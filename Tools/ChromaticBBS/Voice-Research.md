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
A model download on first Read is about 100 MB. Browser caches can be evicted;
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
Sentences have a real 280 ms added gap; questions/exclamations get 380 ms,
paragraphs 520 ms. Stop, mute, new choices and hidden pages cancel the gap.
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
