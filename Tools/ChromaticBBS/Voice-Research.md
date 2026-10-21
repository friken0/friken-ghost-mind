# Voice engine decision / 2026-10-19

Friktal uses Pocket TTS, not the operating-system voice used by the earlier
Chromatic carrier. `GhostVoicePlayer.WebRuntime.cs` selects the stateful
Pocket ONNX web pipeline and requests Jean. Its code, worker and PCM player
are retained in `Assets/StreamingAssets/PocketTTS/Web/`. The model ONNX files
are absent from this checkout. The bundled export's ONNX-LICENSE is CC BY-NC
4.0; README-FRIKTAL.md explicitly does not clear paid redistribution.
No Unity voice engine, settings or model files were changed by this patch.

| Route | Useful property | Decision |
|---|---|---|
| Pocket TTS | Existing Friktal character voice, streaming CPU model | Preserve the full game's working route. Do not substitute a different engine and claim it is Jean. |
| Kokoro 82M | Browser WASM/WebGPU support, separate English casts, Apache-licensed weights | New standalone default: q8 WASM, George for Ghost, Heart for narration. |
| Supertonic | ONNX browser examples | Upstream repository currently says archived, development/support ended. Not chosen for a new integration. |
| ElevenLabs | Vendor offers expressive character/dialogue models | Possible hosted performance route; requires an authenticated service integration. No credential or cloud text upload was introduced. |
| Device speech | No neural model download; device-dependent inventory | Explicit player-selected mode for offline/restricted hosts; no silent engine substitution. |

This is an engineering choice for portability and a stable cast, not a
blind claim that one model is universally best or that Ghost is cloned.
Voice taste still needs Prime's ears. The original third-Masha generator
remains on the unavailable Windows checkout. Kokoro is a new performance.

Primary sources reviewed:

- https://github.com/kyutai-labs/pocket-tts (CPU/streaming; browser ports are
  community implementations; adding text-input silence is unsupported).
- https://github.com/hexgrad/kokoro/tree/main/kokoro.js (WASM/WebGPU, q8,
  generation and streaming interfaces).
- https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md (cast inventory,
  voice-quality caveats and short/long utterance limitations).
- https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX (ONNX model).
- https://github.com/supertone-oss-archive/supertonic (archive notice).
- https://elevenlabs.io/docs/overview/models (expressive dialogue options).

## Exact reconstruction and dependencies

The editable adapter is neural-voice.mjs; its worker is embedded as trusted
source in the self-contained HTML. It fetches Kokoro JS 1.2.1 from jsDelivr,
checks runtime SHA256
`6067712fe4c43cdb36c762f860a5ab8d96ea1d9c8882466438eb9f3d0d20be8f`,
and applies two guarded model-path substitutions before import. Both model
and voice files bind to ONNX repository revision
`1939ad2a8e416c0acfeecc08a694d14ef25f2231`. The WASM runtime path is pinned
to Transformers.js 3.5.1. These are third-party assets, not chapter code.
Dial now starts model loading during the modem sequence. Its first download
is about 100 MB. Browser caches can be evicted;
model/runtime bytes are NOT embedded in the private portable source kit.
A fully offline neural deployment must retain and serve those dependencies
and their licences. A missing dependency produces an explicit status and
retains captions; Device mode is a deliberate player choice.

`python3 Tools/ChromaticBBS/build.py --serve --port 4331` binds loopback only
and supplies COOP/COEP for threaded WASM. Other static hosts may only permit
one WASM thread. Their synthesis latency can be materially worse. Do not
claim a universal speed from one machine. The adapter prepares one upcoming
sentence while the current one plays, and cancellation discards stale work.

## Pacing and text

speech.mjs separates uppercase display emphasis from speech pronunciation.
WHO becomes a word; explicit technical initialisms keep letter names.
Original exact captions, seed bytes and recorded-clip lookup keys survive.
After Prime rejected the long pauses, neural speech coalesces sentences into
bounded 180-character passages so Kokoro owns internal punctuation timing.
Only 40 ms is added between passages, 120 ms at paragraph boundaries. Device
speech adds 60 ms normally, 90 ms after ?!, 160 ms at paragraphs. Stop, mute,
new choices cancel the gap. A hidden page suspends the current unit and
returns to it when visible; an explicit mute or new choice clears that resume.
The neural route uses the actual audio clock for progressive ink and actual
512-sample PCM for Ghost's mouth. The reveal is approximate within each
sentence, not a claim of forced word alignment or phoneme synchronization.
Show full text leaves audio running. Captions retain their full accessible
text and layout throughout; reduced motion shows the complete text.

## Retained witnesses

neural-check.html synthesizes and actually plays both roles, samples Ghost
PCM, verifies narrator exclusion, original-offset segmentation and pacing.
Before threaded host: first audio 19.27 s for Ghost / 12.92 s narrator;
audio played 5.12 / 5.37 s. With isolated host, concurrent chapter tests:
8.42 / 6.72 s to first audio, playback 5.13 / 5.37 s. These include startup,
generation and possible download/cache work, not pure inference benchmarks.
Both tests passed actual PCM and both-role playback. Perceived quality was
not independently listened to by the agent. Prime auditions the actual cast.

## October 21 / published-host lifecycle repair

I verified both public voices directly: George first audio 12.73 seconds,
playback 5.12; Heart first audio 11.86, playback 5.37. These are one measured
run, not a speed guarantee. The engine was capable of output; the full
wrapper could cancel its own unfinished speech when hidden and never resume.
Music kept playing, making the failure look like a dead voice engine.

The earlier C26.7 repair warms the pinned model and first sentence.
The first sentence gets a head start; remaining prose coalesces in bounded
180-character units. C26.9 uses 120 and primes three; the earlier fix avoided
a separate artificial delay at every period. The existing
voice button shows loading, preparing, speaking, paused or retry. Returning
resumes the unfinished unit; completed units are not replayed. Muting or
changing the scene cancels resume. Exact PCM is cached locally in memory,
up to four units and ninety seconds total, keyed by text, cast and speed.
No text or PCM is uploaded or persisted by that cache.

A 120-second preparation deadline releases a stuck worker and exposes an
explicit Read-scene retry. Worker errors and device playback failures stay
visible. There is no automatic engine substitution. Cold CPU synthesis
still takes time; this repair does not claim instantaneous streaming TTS.

C26.7 gates GhostTracks until carrier lock. Generic pointer unlock starts
the audio context, never music before the modem. The connection log reports
that context separately from the fictional handshake visualization.


## October 21 / measured throughput and backend selection

I measure the same two sentences on this Mac and Chromium 155 with eight
reported cores and cross-origin isolation. The narrator produces roughly
5.4 seconds of audio: q8 WASM reaches playback in 5.85 seconds, q4 WASM in
3.16 seconds and fp32 WebGPU in 2.39 seconds. GPU measured generation is
2.364 seconds; q4 is 3.143. GPU cold load plus first compilation takes
14.76 seconds before first audio; that is separate from steady throughput.
These short samples are host-specific, not a universal quality/speed rank.

Official pinned model-tree sizes: fp32 325,532,232 bytes; q8 92,361,116;
q4 305,215,966. I explicitly reject the tempting smaller-q4 assumption.
Its conv-heavy model is mostly unchanged. I keep explicit mode selection
and use GPU only when adapter negotiation supports it. No silent fallback
on a selected backend's failure.

Kokoro's stream yields generated sentence blocks, not partial waveform
frames from a running sentence. ORT browser WASM threading requires
cross-origin isolation. GitHub Pages CPU performance must be measured on
that host; localhost's isolation headers are not evidence of public threads.

Sources: [Kokoro implementation](https://github.com/hexgrad/kokoro/blob/main/kokoro.js/src/kokoro.js),
[ONNX Runtime flags](https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html),
[pinned model tree](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/tree/1939ad2a8e416c0acfeecc08a694d14ef25f2231/onnx).
