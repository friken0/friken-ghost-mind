# 2.5D illustrations in the retained terminal

Build response scenes with ANSI++, SDFs, Friktal captures, or existing
Moknon art. Use original supplied photos for an explicitly requested
composite. No AI-generated images. The Friktal capture library records
the source name, credit, dimensions and SHA-256 for each WebP.
[Capture catalogue](art/friktal-screens/manifest.json)

## Author a postcard locally

Use any grayscale matte aligned to the oriented photo, with white
selecting original source pixels. The optional macOS 14+ mask utility
uses Apple's on-device Vision instance segmentation. It predicts a
mask. Every visible photo pixel still comes from the photo. Inspect
the matte around hair, fingers and pets before packaging it.

```sh
clang -fobjc-arc foreground-mask.m -o /tmp/ghost-foreground-mask \
  -framework Vision -framework CoreImage -framework CoreVideo \
  -framework ImageIO -framework Foundation -framework CoreGraphics
/tmp/ghost-foreground-mask portrait.jpg matte.png
python3 prepare-illustration.py portrait.jpg matte.png \
  art/friktal-screens/spirals.webp postcard \
  --title "Field postcard" --alt "Describe the actual image"
python3 build.py --reply letter.json \
  --reply-illustration postcard=postcard \
  --bundle-track jazzsauce --output first-light.html
```

Install Pillow in the authoring environment. The optional final
arguments to the mask utility select specific instance IDs. The
compositor accepts `--center`, `--height` and `--floor` as normalized
placement. Place the feet on a readable surface and check that their
contact holds at both extremes of the tilt. `postcard=postcard` binds the prepared directory on the
right to a node ID on the left. Repeat the flag for multiple nodes.
`"layout": "letter"` uses only the authored choices and letter
navigation.

Use the same pack for existing Moknon portraits. Keep the original
composition as the poster, cut the resident onto the subject plane,
and extend nearby background colour under the cutout so camera motion
can reveal the edge. Supply the original artwork credit in the optional
`source` field of `illustration.json`. Bind the pack to the node ID
that displays the portrait.

## Author depth from the actual photograph

The compositor accepts aligned grayscale maps through `--subject-depth`
and `--background-depth`. White is nearer. The source photo and its map
must have matching oriented dimensions. The compositor normalizes the
foreground using its opaque interior and extends nearby depth past the
cutout edge to keep the old background from dragging the silhouette.

On macOS, `estimate-photo-depth.m` runs Apple's
[Depth Anything V2 Small F16](https://developer.apple.com/machine-learning/models/)
with Core ML. The image stays on the Mac and only depth is estimated.
Use an oriented source image. Resize the returned PNG to the image's
pixel dimensions. A second close crop can recover more detail around
a pet's face. Match its relative depth to the full scene before blending.

```sh
clang -O2 -fobjc-arc estimate-photo-depth.m -o /tmp/ghost-depth \
  -framework Vision -framework CoreML -framework CoreVideo \
  -framework CoreGraphics -framework ImageIO -framework Foundation
/tmp/ghost-depth DepthAnythingV2SmallF16.mlpackage oriented.png depth.png
```

## How the photo moves

The pack contains a full-colour background, an alpha cutout, two small
grayscale maps and a flat poster. Use aligned inverse depth when available. For captures with no depth
estimate, the authoring tool also offers a broad luminance and matte
coverage relief. Both are approximations from one viewpoint. The renderer maps them to 0–25% and 25–100% respectively,
then projects two textured grids in the same ANSI illustration slot.
For a standing subject, pass `--ground-contact ROW` with a normalized
image row at or above both feet. Relief blends into the backdrop's
sampled depth over the .16 image heights above that row. The foot pixels
and the surface under them then use the same projection. Bake a soft
contact shadow into the capture plane. Face and torso relief stays live.
It never needs to invent the hidden side of a person.

The terminal clock drives the camera. Pointer motion controls a
12-degree bounded tilt. Hold to zoom, drag while held, and scroll for
anchored zoom. Reduced motion holds the view still and keeps explicit
gestures available. The flat poster remains usable without WebGL2.
Bundled images and music play from the HTML. Optional neural voice may
still need its first model download or a supported local voice.

Keep private portraits, matte data, depth packs and personal replies
out of the public projection unless their publication is explicitly
approved. The public allowlist contains only the project's screenshots
and the reusable authoring and runtime code.
