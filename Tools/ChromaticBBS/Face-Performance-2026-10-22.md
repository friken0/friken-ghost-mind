# Reply / frame performance on the M1 review host

October22,2026. Local Chromium155, eight logical cores,8GB physical RAM.
This report distinguishes target cadence, observed cadence, drawing-buffer
resolution and GPU elapsed queries. It does not claim native Unity results.

## Current / Native Carved revision26

Prime rejected the224px adaptive image. I removed adaptive downsampling,
the GPU-inference resolution cap and the640px ceiling for Reply. Native
means the canvas CSS width multiplied by actual devicePixelRatio. Motion,
speech and zoom retain that pixel density; neither image upscaling nor
checkerboard reconstruction supplies the final face. Historical policy and
numbers below are retained as a rejected experiment, not current behavior.

I split the authored field into three separately compiled geometry programs:
mask/mechanisms, hood, and Else/cradle/web. Each has its own ray bound,
material call tree and four-sample normal. A16-bit depth attachment orders
actual surfaces; empty rays discard. Conservative positive eye/nose bounds
skip distant feature work. The production march factor is.85 against the
combined validation reference's.68. Six fragment passes now execute through
the original renderer: network, routing, mask, hood, companion and bloom.

The final controlled640px A/B samples, with the other preview paused:

| Route | GPU elapsed per draw, ms | Median, ms |
|---|---|---|
| Combined reference |56.688,45.660,44.088,52.766|49.213|
| Three geometry programs |24.993,27.285,25.880,19.654|25.436|

That is about48% less GPU time at identical resolution and pose. Earlier
isolated trials reached15.7–20.8ms; I do not promote their best number to a
constant guarantee. A later competing native preview contaminated a run
with60–111ms split draws. I excluded that run from the improvement claim.

Six fixed poses include front, yaw±.55, yaw±1.1 and a speaking/wing pose.
Mean RGB channel error is.279–.415 on a0..255 scale. Pixels whose summed
RGB delta exceeds90 occupy.190–.365% of the frame. Both measures pass
explicit.5 limits. The small differences include separate union normals,
ray thresholds and depth intersections; this is not byte-identical art.

Final24-second native no-audio run:1040×1040 pixels,19.5FPS, frame
p5050.00ms/p9566.67ms, CPU submit0.335ms. Whole-frame GPU samples
40.931ms and45.683ms. Native resolution still misses the60FPS target.
The face is GPU-bound in this isolated run. No Unity performance or
concurrent neural speech claim follows from this measurement.

Final source verification:132 Node tests and41 targeted checks pass. The
actual retained shader/audio fixture checks native pixel density, preserved
resolution during inference, voice/music articulation, independent irises,
lighting, geometry, history cleanup and image press/release. Its final
assertion receipt is stored in the session bundle.

The additional four-to-seven-component experiments were rejected after
six-pose comparisons exceeded the.5 error limits (.61–.78% strongly changed
pixels in front/speaking views). Their source paths are removed. The retained
three-component result has the smaller.19–.365% changed-pixel range above.
One reused audio-fixture run returned zero forehead pixel response; a fresh
page/audio lifecycle passed72 assertions. I retain that failed attempt as
fixture-lifecycle uncertainty rather than silently claiming every run passed.

## Historical / rejected adaptive-resolution experiment

## What was costing frames

The previous renderer imposed20FPS at rest and10FPS during GPU speech.
The640-square Reply draw also costs about51–54ms on this host, even with
negligible JavaScript submission. Removing caps alone cannot reach60FPS.
A60FPS frame allows16.67ms for the whole browser presentation pipeline.

Revision19 settled at272px:52.4FPS,11.865ms whole-frame GPU elapsed,
0.205ms CPU command submission. A later aggressive192px trial reached
60.0FPS with10.478ms GPU time. The final policy allows more pixel detail
and reserves GPU capacity through a measured11.5ms target. Its settled
full-wrapper measurements are recorded below after the actual run.

## Changes in the owner

- One existing renderer and RAF remain; target cadence is now60FPS.
- Deadline scheduling avoids skipping a refresh after small timing jitter.
- Conservative ray/AABB bounds skip empty corner rays before anatomy.
- Tetrahedral normals use four full field evaluations instead of six.
- Micro lattice and engraving evaluate only near their affected surfaces.
- Adaptive square resolution is bounded224..640; display geometry is fixed.
- Actual GPU inference temporarily caps resolution at256, with60FPS target.
- Adaptive changes wait through camera shifts so the old-pose image survives.
- CPU submission, frame median/p95 and observed face cadence are inspectable.

## Measurement limits

One sparse asynchronous query samples a pass or the whole frame at a time.
The four pass samples carry their own render sizes; they are independent,
not a breakdown that can honestly be summed into one frame. Whole-frame
elapsed is measured separately and drives the resolution budget. Results
are consumed only when available and discarded on GPU disjoint. No glFinish,
blocking readback or per-frame console spam is used for production timing.

ANGLE's Metal query implementation flushes command buffers at query start
and end, so the probes themselves perturb execution. Sparse sampling bounds
that cost; frame intervals remain the user-facing witness.
[ANGLE Metal query source](https://chromium.googlesource.com/angle/angle/+/8ce63479cbe11d0e9c94cfe884b5e80f2800a729/src/libANGLE/renderer/metal/QueryMtl.mm).

The60FPS route trades internal pixel resolution for fluid animation.
The geometry, cutouts, expressions, materials and all rendering passes stay.
640px remains the maximum, not a claim that640px reaches60FPS on this host.
Native import, another browser and simultaneous neural speech need their
own measurements. Human visual acceptance remains Prime's.


## Final isolated renderer / revision21

Visible no-audio run:60.0FPS at224px, frame median16.67ms,
p9517.66ms, CPU submit0.160ms. Last24 whole-frame GPU samples had a
median near10.5ms, with occasional spikes; the last captured sample was
16.708ms. This is a steady-frame witness, not a claim that spikes vanish.
The conservative11.5ms policy kept a224px floor after warm-up. Pausing
motion now repaints at full available detail for close inspection.

The actual shader/audio fixture passes71 assertions, including fresh light,
static-image press/release/cancel, measured music, mouth/gear coupling,
independent pupil focus, history cleanup and five yaw views. This fixture
is synthetic PCM, not a human listening test or simultaneous Kokoro benchmark.


## Full-wrapper cost found after the isolated test

Revision21 full UI, face inspection, explicit QA silence:50.0FPS at224px,
median16.67ms and p9533.53ms. CPU face submission0.160ms, latest complete
GPU query15.056ms. This is slower than the isolated face result.
The electric Canvas2D plane had a2.4-million-pixel cap at about30Hz.
Revision22 reduces that decorative plane to one million pixels/DPR1 and
20Hz during face inspection,30Hz elsewhere. It keeps the same geometry,
electric streams and event effects, and records its own CPU paint cost.


Final revision22 wrapper sample, QA silence: face53.0FPS, UI54FPS at224px,
frame p5016.67ms/p9533.33ms, face CPU submit0.195ms, decorative-plane CPU
paint0.190ms over999,559 pixels. Last complete GPU sample14.536ms.
The full loaded wrapper therefore still misses a sustained60FPS despite
the isolated face reaching it. I report that remaining gap explicitly.
Simultaneous Kokoro/60FPS is not yet certified by these no-audio receipts.


Final packaged rerun also passes71 assertions; its fixed640px draw query
was60.13ms under that later host load. The earlier51–54ms samples remain
historical measurements, not a promise of constant GPU timing. Paused
inspection was separately witnessed at640px. The normal preview is left
at boot with voice/SFX enabled and music off; it has no QA-silence flag.


## Mid-spine27 / October23 anatomical steering

I move Else’s ribbed torso and wing roots from roughly y.52 to y.456,
leaving the stabilized skull near y.589 and the seated coil below it. One
`serpentShoulder` anchor follows the travelling body wave and owns both wings
and feather-to-hood web endpoints. Head, neck and wing-bearing body now read
as distinct structures. This adds one named helper,35 across the stack.

Prime confirms the paired gold jaw gears should double in size. I scale the
actual assemblies, cut chambers, bearings and rods, rescale returned distances
and expand the conservative mask ray bound. I preserve native display pixels.
The actual packaged fixture passes72 assertions, including measured voice/music
responses, independent iris focus, real mouth geometry, side views and no GL
errors. Six fixed640px poses pass the existing combined/split image limits.
One1040px draw is47.33ms GPU. Comparative samples vary substantially; this is
visual acceptance and instrumentation, not a new sustained60FPS claim.
