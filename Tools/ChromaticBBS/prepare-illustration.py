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


def prepare(photo, mask, background, *, center, floor, height, width):
    if photo.size != mask.size:
        raise ValueError('Mask must match the oriented photo size')
    bounds = mask.point(lambda p: 255 if p >= 18 else 0).getbbox()
    if not bounds:
        raise ValueError('Mask contains no foreground')
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

    # A photographic relief heuristic. Broad tonal planes carry most of the
    # depth. Small highlights can shape the relief without slicing silhouettes.
    field_size = (min(384, background.width), max(1, round(min(384, background.width) * background.height / background.width)))
    alpha = subject.getchannel('A').resize(field_size, Image.Resampling.LANCZOS)
    luma = ImageOps.grayscale(subject).resize(field_size, Image.Resampling.LANCZOS)
    bulge = weighted((alpha.filter(ImageFilter.GaussianBlur(3)), .40),
                     (alpha.filter(ImageFilter.GaussianBlur(8)), .40),
                     (ImageChops.multiply(luma, alpha).filter(ImageFilter.GaussianBlur(3)), .20))
    front = ImageEnhance.Contrast(bulge).enhance(1.08).point(lambda p: round(65 + p * .73))
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
    parser.add_argument('--width', type=int, default=1800)
    args = parser.parse_args()
    if not all(0 < value <= 1 for value in (args.center, args.floor, args.height)) or not 256 <= args.width <= 2400:
        parser.error('Use normalized placement and a 256–2400 pixel maximum dimension')
    args.output.mkdir(parents=True, exist_ok=True)
    bg, subject, far, front, poster = prepare(
        source(args.photo, 'RGB'), source(args.mask, 'L'), source(args.background, 'RGB'),
        center=args.center, floor=args.floor, height=args.height, width=args.width)
    bg.save(args.output/'background.webp', quality=88, method=6)
    subject.save(args.output/'subject.webp', quality=94, alpha_quality=100, method=6)
    far.save(args.output/'background-depth.png', optimize=True)
    front.save(args.output/'subject-depth.png', optimize=True)
    poster.save(args.output/'poster.webp', quality=90, method=6)
    (args.output/'illustration.json').write_text(json.dumps({
        'schema':'friktal.illustration-depth.v1', 'title':args.title, 'alt':args.alt
    }, ensure_ascii=False)+'\n', encoding='utf-8')


if __name__ == '__main__':
    main()
