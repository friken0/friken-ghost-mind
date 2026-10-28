# Face compositing / else-speaker-shot-31

The three SDF geometry passes retain opaque fragment depth and the existing
anatomy. The final bloom pass applies the presentation aperture after geometry
has resolved: a solid central face, a gradual outer contour and a radial opening.
CSS does not supply a competing mask. The native caption terminal is a sibling
of the renderer and keeps fully opaque glyphs.

For `mountPortrait(...,{background:false})`, call `portrait.emerge(true)` when
showing the overlay and `portrait.emerge(false)` when closing it. Opening takes
900ms on the existing portrait clock. Use `{immediate:true}` for reduced motion.
The overlay owner still controls visibility, input and final removal.

`voiceBass/Mid/Air/Attack` remain actual measured bands. `audioLevel` also feeds
`voiceEnergy`, so measured neural or recorded RMS can light the surface when a
spectrum bus is absent. Device word boundaries feed only `voiceBoundary`, a
decaying approximate impulse. The canvas labels `data-speech-surface` with the
active evidence type. Stopping speech clears both channels. No FFT is invented.

Run the numeric and renderer tests:

```sh
node --test Tools/ChromaticBBS/face-compositing.test.mjs \
  Tools/InfiniEngineSite/ghost-renderer.test.mjs \
  Tools/ChromaticBBS/signal.test.mjs
```

`face-pixel-check.mjs` exports an explicit browser diagnostic:

```js
runFacePixelCheck({
  voiceSample: {
    source: 'neural-pcm', // or 'recorded-pcm'; must describe actual playback
    level: capturedLevel,
    bands: capturedBands,
    note: 'Fixed replay of a measured playback calibration sample'
  },
  size: 640
});
```

It compiles the production shader and reads native RGBA pixels at a fixed pose.
The contour acceptance samples must correspond to opaque SDF geometry in the
unmasked frame, excluding empty-space bloom. The report includes the solid
center, multiple partial-alpha contour samples, opening/closed coverage and
silent-versus-voiced blue/gold relief samples. It rejects silent, synthetic or
unlabelled calibration input. No work, audio generation or network runs on import.
The diagnostic is a fixed replay test; it does not by itself prove live TTS routing.

The explicit test page is `face-pixel-check.html`; rebuild it with
`python3 Tools/ChromaticBBS/build-face-pixel-check.py`. Its readable source is
`face-pixel-check-source.html`, using local production-module imports. The
generated page bundles those exact sources so the existing carrier server and
voice asset origin remain usable without a second server.

The M1 browser witness in `design/face-compositing-results.json` records a
solid alpha255 center, twelve actual-geometry contour samples with alpha69..230,
and a fully clear closed frame. Actual Michael CPU q8 speech played for5.1s;
fixed replay of its measured voice frame changed109,468 face-region pixels.
Compute was8.649s for5.1s audio, so this is not a real-time performance claim.

## Speaker shots and exclusive articulation

`mountSpeech` accepts `beforeSpeaker(role,{signal})`. It awaits this hook
once per role transition after that actor's PCM is ready and before playback.
Manual stop aborts the wait. `portrait.focusSpeaker(role,{signal,immediate})`
settles an800ms camera move on the existing renderer clock: Else gets a
forehead/serpent close-up; Ghost gets the original wide camera. Reduced
motion settles immediately. The field uniforms and conservative scissors
share `portraitCamera`, so tighter framing cannot use stale crop bounds.

Actual neural playback calls `companionTalking(value,{measured:true})`;
device boundaries use the same gate with explicitly approximate evidence.
Each mouth receives only its own active actor. Late analyser frames cannot
reopen a silent Else. Her spine, tail and wings hold during Ghost's shot;
`serpentTime` keeps the shader wave and prepared shoulder on the same held
clock. Music-driven movement returns at rest or on her own turn.

An optional bounded `ghostReply` follows the companion in authored frames.
This supports Ghost → Else → Ghost without changing their selected voices.
The first greeting demonstrates the handoff. The camera widens before the
reply begins, then the face fades back into the original interactive terminal.

`?qaSpeakerCheck=1&qaMemory=1` is an explicit short three-actor fixture using
the production queue, renderer and actual selected neural voices. It is not
a story play or audio-performance benchmark. `face-pixel-check.html` also
offers three silent native camera frames for direct composition review.
Run `speaker-camera.test.mjs` for shot ordering, cancellation and both mouth
gates. The camera-only view makes no voice or cymatics measurement claim.
