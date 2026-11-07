# 2.5D illustrations in the retained terminal

Build response scenes with ANSI++, SDFs, Friktal captures, or existing
Moknon art. Use original supplied photos for an explicitly requested
composite. No AI-generated images. The Friktal capture library includes
four WebP screenshots with source names, credit, dimensions and SHA-256.
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
placement. `postcard=postcard` binds the prepared directory on the
right to a node ID on the left. Repeat the flag for multiple nodes.
`"layout": "letter"` uses only the authored choices and letter
navigation.

## How the photo moves

The pack contains a full-colour background, an alpha cutout, two small
grayscale maps and a flat poster. The background relief derives from
broad luminance. The subject uses multiscale mask coverage and
smoothed source luminance. These are artistic depth estimates from
a single view. The renderer maps them to 0–25% and 25–100% respectively,
then projects two textured grids in the same ANSI illustration slot.
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
