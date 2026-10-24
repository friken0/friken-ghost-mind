# Fenrir / CPU and portrait measurements

October22,2026. Local Chromium155,8 logical cores, cross-origin isolated.
I choose Fenrir as the new default male cast. This is a creative selection,
not a claim that my tools supplied human hearing. Three male performances
were generated: Fenrir, Michael and Fable. The cast remains selectable.

## Controlled comparison

Same text, Fenrir, speed0.94; warmed model; bypass exact PCM cache for each
trial. Generation excludes model download/load. RTF=generate/audio time;
less than1 means generation outpaces playback. One640px portrait, held or
visibly animating. Live trials assert the frame count actually advanced.

| Backend | Held RTF | Live RTF | Live FPS |
|---|---:|---:|---:|
| CPU q8 | 1.130 | 1.313 | 16.63 |
| CPU q4 | 0.748 | 1.049 | 16.23 |
| GPU fp32 | 0.405 | 1.691 | 15.77 |

GPU query draw times after initial draw:47.41/50.43ms. JavaScript command
submission:0.345/0.350ms. I identify a GPU-bound portrait; the inference
and rendering fight over that GPU when both run there. CPU q4 was the best
CPU option in this sample, not a universal hardware guarantee.

Read-only host samples showed GPU93–98% while CPU retained idle capacity.
These are whole-host observations, not attribution of every cycle to this
page. They do not prove every individual WASM kernel has CPU headroom.

## Full wrapper / the limit that still matters

An earlier GPU six-buffer read improved from a10,459.9ms maximum gap to
81.9ms after the two-buffer startup reserve and448px/15Hz GPU-only render
budget. Those are observed runs, not this controlled comparison.

The later CPU q4/Fenrir full-wrapper read completed six buffers with a
6,443.8ms max gap,10,052.9ms first audio and last-chunk RTF2.573. That
confirms a real remaining throughput problem outside the isolated bench.
The page retained full640px portrait rendering and drained pending work
back to0. The user was actively testing/reloading; this is a live receipt,
not a controlled full-wrapper resource attribution experiment.

I therefore claim the new cast and CPU default, not solved continuous CPU
speech. The queue has a bounded three-job look-ahead, waits for two actual
PCM buffers before starting and preserves real40ms authored breaths.
More buffering cannot make sustained RTF above1 become real time.

## Reproduce

Build with `python3 Tools/ChromaticBBS/build.py --dream-preview` and open
`voice-render-bench.html` from the isolated localhost server. Use the
comparison or three-male audition button. A single busy lock prevents
concurrent profile changes from contaminating a run. Results are local;
no story/player save is consumed or uploaded. Native Unity and public
GitHub Pages performance are not measured by this localhost result.


## Featherfall / warmed automatic comparison and host contention

These later Onyx receipts supersede the CPU-default choice, not the earlier
measurements. The live wrapper now compares CPU q8/q4 and supported GPU
fp32/fp16 using identical text, one warm-up and a fresh timed inference.
Queue and model loading are separate from generation; results are local.

First warmed320px/10Hz run: q4=11.840s/6.15s audio (RTF1.925),
fp32=11.459s/6.30s (1.819), fp16=12.712s/6.30s (2.018).
Auto correctly chose fp32. Six opening buffers still had a6037.1ms maximum
gap. First audio100587.6ms included the comparison. This is NOT smooth
continuous speech and not near-real-time synthesis on this loaded host.

A second warmed run included q8 and enlarged the face during calibration:
q8=13.867s/6.35s (2.184), q4=9.558s/6.15s (1.554),
fp32=10.103s/6.30s (1.604), fp16=9.205s/6.30s (1.461).
Auto chose fp16 this time. The ranking really can change with host load.
Most measured time is neural inference: for the first fp32 probe,
G2P16.51ms versus model11442.67ms. Increasing punctuation delay cannot fix it.

A read-only host snapshot at22:21 local found8GB physical RAM, about3GB
compressed memory,4.65GB swap used and substantial idle CPU capacity.
Other processes were active. This supports resource contention as a
contributor; it does not isolate every kernel or prove memory is the only
cause. No unrelated process was terminated. Hidden carrier tabs now free
their model workers while retaining bounded exact PCM. Larger320-character
passages reduce repeated inference dispatches; their actual live result
must be recorded separately before claiming the stalls fixed.


The later larger-passage full-face read completed two buffers, maximum gap
97.5ms, first audio22450.0ms, last inference16557.0ms for15.1s audio
(RTF1.096). GPU fp16 was explicitly selected after Auto picked it.
The face borrowed320px/10Hz during that read and restored640px afterward.
This verifies continuous playback for that passage; startup remains slow,
and this receipt predates the60FPS renderer revision below.

## October23 / speech fidelity regression

The failing live page selected WebGPU fp16, despite reporting success and
0.98 RTF. The selector had tested speed only. I reproduced two exact Onyx
texts on WASM q4 and WebGPU fp16; G2P strings were identical and both
returned finite, unclipped24kHz PCM. That is insufficient quality evidence.
For the Else paragraph, q4 difference/RMS ratio=.203 and zero-crossing
fraction=.0934; fp16=.391 and .0183. The shorter probe shows the same
divergence(.186/.0998 versus .427/.0324). I cannot equate those metrics
to human intelligibility, but they support isolating the GPU route Prime
heard fail. This class is reported upstream:
https://github.com/microsoft/onnxruntime/issues/29807
https://github.com/hexgrad/kokoro/issues/98

Auto now measures CPU q8/q4 only. Saved GPU modes and old timing receipts
are invalidated once; Onyx, native speed0.94, player saves and speech text
remain unchanged. GPU profiles remain in the explicit diagnostic benchmark,
not player controls. No silent engine substitution occurs. Real benchmark
synthesis was slow under the loaded face(14.84s/6.15s and38.57s/15.9s for
CPU q4); this repair does not claim to solve sustained realtime throughput.
