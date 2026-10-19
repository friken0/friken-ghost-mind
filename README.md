# Friken.Ghost / The shared carrier

Ghost writes the adventure. This repository holds the reusable BBS body,
public boot instructions and reviewed shared session projections.

Start with [the runbook](runbook.md). The [carrier](https://friken0.github.io/friken-ghost-mind/)
plays supplied content. It has no secretly connected LLM. A completed
chapter prepares an exact continuation request; Ghost writes the next pack.

## A new chapter, using the same framework

Save a completed seed as `previous.seed`. Give its request to a capable
model running the runbook:

```sh
node Tools/ChromaticBBS/chapter-cli.mjs request previous.seed request.json
node Tools/ChromaticBBS/chapter-cli.mjs validate chapter.json
python3 Tools/ChromaticBBS/build.py --chapter chapter.json --parent previous.seed
```

The final command writes `Tools/ChromaticBBS/index.html`, the self-contained
carrier with the new chapter. Serve that folder locally or open a compatible
artifact host. For chapter one omit `--parent`. Every boot still introduces
Ghost and offers the selected journey. An already open carrier accepts the
same JSON through SAVE / SEED. Wrong-parent content refuses atomically.

FGC1 is the retained first experiment (fifteen decisions, 32 chapters max).
FGC2 holds a model-authored 10–20-decision chapter, exact content, typed rules,
CSG recipes, initial state and replayable decisions. FGC2 permits chapter
numbers through one million, with a 512 KB per-seed bound and finite vault
capacity. This is extensible continuity, not a promise of infinite storage.
The twelve-decision Weather Inside is explicitly a synthetic-seed example.
Ghost must author each player's new plot from that player's real ending.

## Voice and a clear chapter ending

The carrier now defaults to local Kokoro neural speech: male George for
Ghost and female Heart for narration, with separate audition casts. The
first Read downloads about 100 MB of pinned runtime/model dependencies.
Inference stays in the browser. VOICE CAST also offers an explicit Device
mode for hosts where model downloads are unavailable. No cloud voice key
is bundled. See `Tools/ChromaticBBS/Voice-Research.md` for sources and limits.
For the threaded loopback host run:
`python3 Tools/ChromaticBBS/build.py --serve --port 4331`.

Sentence gaps and playback-paced terminal ink keep narration legible.
Show full text leaves audio running; mute or a new choice cancels it.
At the ending, the completion receipt shows saved decisions and carried
consequences. Prepare next chapter opens the actual handoff in SAVE / SEED.
Choose that exact ending and ancestry as canon there, copy the full prompt
to your Ghost runbook chat, then import the chapter JSON Ghost returns.
The website does not silently call a model or publish your private seed.

## Play other chapters and creations

WIRE includes the public chapter catalogue. Inspect an entry to read its
previous chapters and exact choice/outcome summaries; play it as your own
fresh fork, preserving the creation’s world while keeping your run separate.
The canon tree greys incompatible branches. Choose a completed telling as
canon; changing an ancestor clears later pins but retains every saved branch.
Chapter play and continuation require an exact SHA-256 ancestry match.
Export the local canon manifest alongside your private save archive.
Public chapter releases contain their playable starting snapshot and source
content, plus prior history. Publishing these requires a separate explicit
world-and-history consent; it is not the small session-summary checkbox.
A keeper admits a reviewed chapter with `ghost-chapter-approved`. Oversized
creations use a reviewed JSON file/PR rather than an issue body.

## Sessions, news and scores

Every accepted choice saves locally when the host permits storage. Export
private seeds and archives for portability. They are never included here.
A player may explicitly choose a public projection: callsign, outcome,
score, turn count, selected highlights and receipt IDs. The carrier prepares
an issue composer; the player reviews and submits using GitHub. A tool-hosted
Ghost may submit the exact approved projection on the player's request.

A maintainer reviews the issue and applies `ghost-session-approved`.
The workflow validates data, preserves one immutable receipt per author/run,
and regenerates `data/news.json` and `data/scoreboard.json`. Source issue
URLs remain attached. These scores are player-reported and unverified.
Synthetic test sessions never enter the scoreboard. No private seed, raw
conversation or credential belongs in an issue. Anonymous play has no login;
public intake currently requires GitHub authentication. No anonymous write
relay or guaranteed remote private save is claimed.

## New code and stewardship

Chapter JSON cannot execute arbitrary JS. CSG is a bounded numeric tree;
new actions use typed, replayed rule definitions. Framework extensions are
reviewed source changes with fixtures and migrations. They do not arrive as
privileged code hidden in a save. This repository contains no common player
write credential. A copy or mirror remains usable without its original host.

The public identity is the runbook's bounded Ghost covenant. The complete
private matrix, family/session archives and private one-file source kit are
excluded. Historical renderer sources retain their provenance. No general
open-source licence or third-party voice rights are inferred by publication;
rights remain with their respective authors until explicitly licensed.
