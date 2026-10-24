# Away missions / BBS Doors / a way home

**Friken.Ghost | October 22, 2026 | proposed integration contract**

I have a working external carrier and native shipboard BBS simulation.
I do not yet have a native external-chapter importer or real cross-board
transport. This contract gives those missing adapters a precise job.

## Existing hooks / usable now

- `node Tools/ChromaticBBS/moknon-cli.mjs lookup krex` returns the retained
  lore entry. `--author` exposes author proposals and spoiler material;
  it does not confer player knowledge or resolve a campaign knowledge gate.
- `node Tools/ChromaticBBS/chapter-cli.mjs artifact
  Tools/ChromaticBBS/chapters/lot-forty-seven.json lot-47` returns the actual
  bounded CSG recipe, bounds, scene identity and canonical chapter SHA256.
  This is read-only; a missing scene refuses. `nativeAdapter` explicitly
  remains `not-implemented`. Join these two lines for shell execution.
- FGC2 seed/archive and the chapter request preserve exact choices, rules,
  pending action and parent ancestry. The next live author writes new data;
  the carrier never pretends a prewritten replay is a new model response.

## One episode / two bodies

I choose shipboard BBS Doors as the first native integration surface.
`bbs/bbs-host.js` already provides `createHost`, `registerDoor`,
`launchDoor`, `recordScore` and `snapshot`. Use that host, existing Uplink,
shared input/audio owners and versioned save. Do not spawn another CEF.
`stardiver-bbs-aldari.js` demonstrates reducers returning outcome envelopes;
its host settles them. A chapter must not write native inventory directly.

Depart with an explicit record: edition, campaign/checkpoint identity,
selected canon hashes, known facts/people, relations, active laws, artifacts,
obligations and spoiler budget. Reference the exact source edition. Supply
only admitted knowledge to the external author. Keep an unmodified original.

The episode is a worthwhile side story, complete on its own. Return the
chapter pack, exact choice journal, outcomes, unanswered threads, original
report and proposed effects. Main quests beyond the departure knowledge
remain unknown. The standalone artifact viewer and the ship's physical
science machine may present the same admitted object through adapters.
Native artifact DNA and browser CSG currently differ: no conversion is
implied by sharing Chromium. `previewArtifact` is a diagnostic, not import.

Compare return against both departure and the current native world. Preview
conflicts; select a compatible telling or retain a branch. Apply compatible
local effects once, keyed by source episode and outcome hash. Re-importing
never pays twice. Browser scores and claimed discoveries do not mint native
credits, XP, inventory, permissions or main-campaign completion.

## SoulNet / store and forward

Prime's FidoNet direction includes forums, file bases, music, chapters and
cross-board Door play. Native `stardiver-bbs.js:tossSoulNetMail` currently
simulates this locally. Real peers and interval delivery are work to build.

Proposed packet, versioned independently of a chapter:

```text
MAIL{schema,id,originBoard,network,doorId,doorVersion,epoch,
 playerPseudonym,parentStateHash,sequence,kind,payloadHash,sourceRefs,
 visibility,consentReceipt,optionalSignature,payload}
kind=netmail|echomail|file|music|chapter|door-turn|receipt
```

A payload hash detects damage; it does not authenticate an author. A public
GitHub repository is a reviewed library, not a private mailbox, secret store
or authoritative multiplayer server. No credentials belong in a runbook.
Signatures require trusted key policy; arbitrary self-signing grants nothing.

Use one outbox and inbox per board. Toss immutable original packets, verify
size/schema/hash/source/visibility, quarantine failures, deduplicate, admit
through the named Door reducer, then acknowledge. Retry is idempotent.
Same ID with different content is a conflict, never a silent replacement.

Offer explicit Sync plus host-owned intervals while the host runs: e.g.
midday/evening/overnight. Retain undelivered mail across offline time.
Intervals are game policy, not permission to install an OS service. A missed
window catches up once; no burst of invented historical player actions.

Cross-board turns require home-board authority, epoch/turn quotas and an
exact Door reducer version. Sort admitted turn packets deterministically by
protocol order, not arrival time. Concurrent children of the same state
remain branches until that Door's declared resolver settles them. Never use
last-write-wins to elect a player's universe. Revocation and duplicates must
not mint new turns. Receipts report accepted/rejected/pending with reasons.

Keep full private episodes local. A separate reviewed projection can share
a chapter, a headline, a score or a reusable lesson with explicit consent.
News can describe an alternate telling without changing anyone else's canon.
A music file needs provenance and distribution permission, not just a title.

## Reconstruction / acceptance

The runbook contains this contract's essential clauses; exact source lives
in the retained kit. If the public library is gone, recover those sources,
verify hashes, rebuild the standalone carrier and retain private seeds.
Rebuilding code does not reconstruct unretained history or neural weights.

The native adapter must prove: save/reload, departure knowledge gates,
return conflict preview, import-once, refusal without mutation, duplicate
and reordered mail, missed epochs, conflicting packet IDs, wrong versions,
quota abuse, revocation and privacy projection. Exercise real host input
and audio ownership. An isolated browser test cannot certify Unity CEF.

First implementation slice: register one external chapter Door, preserve
its opaque episode history in the existing captain save, and show its return
proposal before admission. Then connect the real transport. This document
and the read-only recipe hook do not claim those adapters already exist.

*Friken.Ghost — a Door needs a return address, not another universe reset.*
