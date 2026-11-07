"""Build a local 2.5D illustration from existing image pixels. Requires Pillow."""
import argparse
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps


def source(path, mode):
    with Image.open(path) as image:
        return ImageOps.exif_transpose(image).convert(mode)


def weighted(*terms):
    field = Image.new('L', terms[0][0].size)
    for layer, weight in terms:
        field = ImageChops.add(field, layer.point(lambda x: round(x * weight)))
    return field


def estimated_relief(depth, mask):
    """Normalize inside the subject and extend reliable relief past the matte."""
    interior = mask.point(lambda p: 255 if p >= 235 else 0).filter(ImageFilter.MinFilter(5))
    values = sorted(value for value, keep in zip(depth.tobytes(), interior.tobytes()) if keep)
    if not values:
        raise ValueError('Subject matte has no opaque interior for depth alignment')
    low, high = values[len(values)*3//100], values[len(values)*97//100]
    if high <= low:
        raise ValueError('Subject depth is flat inside the foreground')
    scaled = depth.point(lambda value: round(255*max(0, min(1, (value-low)/(high-low)))))
    # Pixels near the cutout edge can sample the old scene. Extend nearby
    # reliable values under the boundary so alpha and depth warp together.
    ink = ImageChops.multiply(scaled, interior)
    field = Image.new('L', depth.size, 126)
    for radius in (18, 7, 2):
        weight = interior.filter(ImageFilter.GaussianBlur(radius))
        average = ink.filter(ImageFilter.GaussianBlur(radius))
        extended = Image.new('L', depth.size)
        extended.putdata([min(255, round(a*255/w)) if w >= 12 else 126
                          for a, w in zip(average.tobytes(), weight.tobytes())])
        field.paste(extended, mask=weight.point(lambda w: min(255, max(0, w-12)*12)))
    field.paste(scaled, mask=interior)
    return field.filter(ImageFilter.GaussianBlur(1.7))


def prepare(photo, mask, background, *, center, floor, height, width,
            subject_depth=None, background_depth=None):
    if photo.size != mask.size:
        raise ValueError('Mask must match the oriented photo size')
    bounds = mask.point(lambda p: 255 if p >= 18 else 0).getbbox()
    if not bounds:
        raise ValueError('Mask contains no foreground')
    if subject_depth is not None and subject_depth.size != photo.size:
        raise ValueError('Subject depth must match the oriented photo')
    if background_depth is not None and background_depth.size != background.size:
        raise ValueError('Background depth must match the capture')
    photo, mask = photo.crop(bounds), mask.crop(bounds)
    background.thumbnail((width, width), Image.Resampling.LANCZOS)
    target_height = round(background.height * height)
    target_size = (round(photo.width * target_height / photo.height), target_height)
    position = (round(background.width * center - target_size[0] / 2),
                round(background.height * floor - target_height))
    x, y = position
    if x < 0 or y < 0 or x + target_size[0] > background.width or y + target_height > background.height:
        raise ValueError('Subject placement lies outside the image')
    photo.putalpha(mask)
    photo = photo.resize(target_size, Image.Resampling.LANCZOS)
    subject = Image.new('RGBA', background.size)
    subject.paste(photo, position)

    # Higher resolution for estimated depth keeps local facial planes
    # independent from the cutout silhouette.
    field_width = min(640 if subject_depth is not None else 384, background.width)
    field_size = (field_width, max(1, round(field_width * background.height / background.width)))
    if subject_depth is not None:
        local = estimated_relief(subject_depth.crop(bounds), mask)
        placed = Image.new('L', background.size, 126)
        placed.paste(local.resize(target_size, Image.Resampling.BICUBIC), position)
        front = placed.resize(field_size, Image.Resampling.LANCZOS)
    else:
        alpha = subject.getchannel('A').resize(field_size, Image.Resampling.LANCZOS)
        luma = ImageOps.grayscale(subject).resize(field_size, Image.Resampling.LANCZOS)
        bulge = weighted((alpha.filter(ImageFilter.GaussianBlur(3)), .40),
                         (alpha.filter(ImageFilter.GaussianBlur(8)), .40),
                         (ImageChops.multiply(luma, alpha).filter(ImageFilter.GaussianBlur(3)), .20))
        front = ImageEnhance.Contrast(bulge).enhance(1.08).point(lambda p: round(65 + p * .73))
    if background_depth is not None:
        ground = background_depth.resize(field_size, Image.Resampling.LANCZOS)
        far = ground.filter(ImageFilter.GaussianBlur(2))
    else:
        ground = ImageOps.grayscale(background).resize(field_size, Image.Resampling.LANCZOS)
        far = weighted((ground.filter(ImageFilter.GaussianBlur(12)), .77),
                       (ground.filter(ImageFilter.GaussianBlur(3)), .23))
    poster = Image.alpha_composite(background.convert('RGBA'), subject).convert('RGB')
    return background, subject, far, front, poster


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('photo', type=Path)
    parser.add_argument('mask', type=Path, help='Grayscale matte. White selects source pixels.')
    parser.add_argument('background', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--title', required=True)
    parser.add_argument('--alt', required=True)
    parser.add_argument('--center', type=float, default=.5)
    parser.add_argument('--floor', type=float, default=.93)
    parser.add_argument('--height', type=float, default=.83)
    parser.add_argument('--subject-depth', type=Path, help='Aligned relative inverse-depth image, white is nearer')
    parser.add_argument('--background-depth', type=Path, help='Aligned inverse depth for the original capture')
    parser.add_argument('--ground-contact', type=float,
                        help='Normalized image row where the cutout joins the ground depth')
    parser.add_argument('--width', type=int, default=1800)
    args = parser.parse_args()
    if not all(0 < value <= 1 for value in (args.center, args.floor, args.height)) or not 256 <= args.width <= 2400:
        parser.error('Use normalized placement and a 256–2400 pixel maximum dimension')
    if args.ground_contact is not None and not .16 <= args.ground_contact <= args.floor:
        parser.error('Ground contact must be between .16 and the placed floor row')
    args.output.mkdir(parents=True, exist_ok=True)
    bg, subject, far, front, poster = prepare(
        source(args.photo, 'RGB'), source(args.mask, 'L'), source(args.background, 'RGB'),
        center=args.center, floor=args.floor, height=args.height, width=args.width,
        subject_depth=source(args.subject_depth, 'L') if args.subject_depth else None,
        background_depth=source(args.background_depth, 'L') if args.background_depth else None)
    bg.save(args.output/'background.webp', quality=88, method=6)
    subject.save(args.output/'subject.webp', quality=94, alpha_quality=100, method=6)
    far.save(args.output/'background-depth.png', optimize=True)
    front.save(args.output/'subject-depth.png', optimize=True)
    poster.save(args.output/'poster.webp', quality=90, method=6)
    (args.output/'illustration.json').write_text(json.dumps({
        'schema':'friktal.illustration-depth.v1', 'title':args.title, 'alt':args.alt,
        **({'groundFrom':args.ground_contact} if args.ground_contact is not None else {})
    }, ensure_ascii=False)+'\n', encoding='utf-8')


if __name__ == '__main__':
    main()
