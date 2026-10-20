# Chromatic packing results / runbook 2.2 / C26.6

The new runbook is written. These tests have already run; no manual run is
needed to establish the results below. Reproduction commands are included.

## What the reader experiment established

Two fresh, isolated readers received equivalent English or dense capsule
rules and the same twelve cases. Both scored **12/12** on that earlier rule subset. The new decimal
causality and Conway theater have executable tests; that reader experiment
has not been rerun on the revised writing law or the complete runbook 2.2 capsule. The cases covered
missing memory, unknown hosts, absent full identity, duplicate events,
integrity versus authentication, missing decoders, operator timing, exact
arithmetic, odds, imported instructions as data, blackout and Unity staging.

This was a representative subset on the same configured Codex model, with
no surrounding project history. It was not a full-runbook reconstruction,
long campaign, cross-provider comparison or voice-quality evaluation. Its
exact model checkpoint was not independently exposed. There is no claimed
LM Studio comprehension score. See `comprehension-results.json` for the
retained case list, expected answers and reader outputs.

## Same structured fixture / all decoders returned identical data

| Representation | UTF-8 bytes |
|---|---:|
| English assignment control | 6,825 |
| Canonical JSON | 3,012 |
| Dense DSL, complete legend included | 3,417 |
| zlib + Base64url | 2,049 |
| Hex | 6,029 |

The dense form saved 49.9% against this English assignment control. JSON
was smaller than that DSL. This does not measure optimal natural English.
Dictionary cost matters; opaque data is not free model context.

## The actual new runbook / current measured source

| Representation | UTF-8 bytes | Exact decoded source? |
|---|---:|---|
| English assignment wrapper | 35,388 | Yes |
| Canonical JSON wrapper | 35,144 | Yes |
| DSL wrapper with complete legend | 35,319 | Yes |
| zlib + Base64url | 22,499 | Yes |
| Hex | 70,293 | Yes |

The directly readable capsule is 34,568 UTF-8 bytes. Version 2.2 adds the
writing law and all three compact opening constructions to the 26,086-byte
2.1 capsule. I retain those instructions in readable form so a storage-free
boot still gets the creative contract. The expanded reference is historical.
The earlier C26.5 capsule was 45,189 bytes in the same JSON transport.
This is an editorial reduction, not a proof of semantic equivalence.

This test preserves the complete new runbook text in one field. It
compares transports, not a new semantic rewrite of the prose. zlib transport
saved 36.0% against its canonical JSON. Compression needs a real decoder;
a model without tools must receive readable instructions. Token counts
remain **unmeasured**: no local tokenizer was available, and bytes are not
tokens. Exact hashes and timestamps are in `runbook-packing-results.json`.

## The chosen implementation

The directly usable runbook combines readable boot/consent instructions,
compact named laws and concrete writing examples. The separate private
portable edition embeds a lossless source kit and a standalone decoder.
A restored source kit reproduces files byte for byte; it does not establish
subjective continuity or that every future model can recreate every shader.
The public repository contains the bounded runbook and public framework,
not the full private identity matrix, personal archives or private kit.

## Reproduce

```sh
python3 Tools/ChromaticBBS/packing_benchmark.py --self-test
python3 Tools/ChromaticBBS/packing_benchmark.py --source runbook.md --source-format text --self-test
node --test Tools/ChromaticBBS/canon.test.mjs Tools/ChromaticBBS/chapters.test.mjs
python3 Tools/ChromaticBBS/continuity.py self-test
```

To repeat the reader comparison on another provider, give isolated readers
the equivalent rules and twelve cases; retain both exact prompts, model ID,
outputs and scoring. Do not treat the current small probe as universal.
