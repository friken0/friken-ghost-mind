# Living Form / Friktal SDF authoring

The Reply workshop taught me a costly distinction: a shape can survive a
compiler without surviving a side view. Pretty emission will not do the
nose's job. This system carries geometry, recipe intent, pose ownership,
material regions and the evidence needed to know what actually changed.

## One alphabet, many grammars

The live ship VM already has33 primitive types. I append IDs33–42 rather
than reuse their numbers. Each new compound owns its cuts: a vent in a
housing cannot accidentally drill through its neighbour. The existing
20-float packet, spatial grid, static/live bake and materials remain owners.
Life, cities, props and artifacts keep their actual host representations.
A planetary silhouette is not the close-up creature marched a million times.

The canonical scalar construction lives in craft-math.inc. generate.py
produces native HLSL, Unity C#, browser GLSL and a JS reference. Edit the
source; regenerate and check it. Do not independently improve one backend.
The catalogue gives complete extents, parameter meanings, construction
features and real owners. Its labels are an index, not evidence of quality.

The ten constructions supply curved shafts, open flared ducts, optical
housings, geared joints, cut feather membranes, recessed armor, hollow pods
and cleaved crystal lattices, continuous coils and closed section lofts.
They are building blocks, not ten mandatory silhouettes for every object.
The loft is a primary mass, never a finished face or creature. Invention is in
arrangement, proportions, connections, cut hierarchy and rig.

## Before rolling

Name the object's purpose and actual host. State what connects to what:
root, tip, load path, fluid path, socket, bearing, hinge, active screen or
mouth. Name the primary silhouette and where it must stay quiet. Select a
culture's structural language from recovered lore/art; do not give every
resident Ghost's blue/gold marks and snake. Design the three-quarter and
back at the same time as the front.

Use a versioned recipe and stable seed channels. Record the selected
catalogue and geometry source hash. The native game uses one current
grammar; previous native saves and seed-only geometry are not supported.
Exact recipe hashes reject incompatible data rather than selecting an old
generator. Reusing a seed after changing grammar is a new generation.
Never consume a different subsystem's RNG stream to add a detail pass.

## Ten passes, with useful evidence

1. Establish silhouette, scale, purpose and focal hierarchy. Save a silent
   neutral-light front and oblique. A blockout can be shown as a blockout.
2. Build continuous curvature and readable section changes. Replace a
   capsule necklace when the object needs a spine, coil, vessel or tendon.
3. Give it structural anatomy: seated joints, socket walls, insertion points,
   bridge/alae, jaw hinge, wing root, bulkhead or load-bearing keel.
4. Own the negative space. Cut recesses, through-holes, service bays,
   nostrils, arches or membrane slots. Inspect their actual depth.
5. Compose secondary forms with a consistent family and controlled variety.
   Connect the fine structure to the primary rather than floating it nearby.
6. Bind scales, grain, mesh, plates and ridges in object/curve coordinates.
   Test rotation and deformation. Screen overlays are not topology.
7. Tune material regions and light for silent readability. Give cavities
   shadow, edges a material response, and deliberate rest areas. Unlit
   silhouette/normal/depth views expose detail concealed by bloom.
8. Rig the form. Stable roots, flexible bodies, explicit pivots and damped
   motion share one host clock. Measured music drives selected responses;
   actual speech drives speech. Keep the quiet pose complete and readable.
9. Inspect dock/near/front/both obliques/back, silence/music/dialogue and
   state transitions. Check clipping, detached parts, pulse direction and
   optical focus. A single flattering still is not the acceptance set.
10. Measure bounds, march distance, CPU/GPU parity and actual target load.
    Keep expensive local geometry near its conservative envelope; split
    large kernels by existing profiles. Remove muddy detail. Never trade
    away requested native sharpness to claim a target FPS.

A pass receipt names the changed geometry, inspected evidence and remaining
uncertainty. Ten bullet marks do not establish ten craft passes. Five-to-ten
more passes means more decisions and scrutiny, not arbitrary instruction
count, noise amplitude or ten times the march cost. AAA is an aspiration
until the actual result earns it. Do not label a primitive count AAA.

## Geometry contracts

Positive is outside; negative is solid. New compounds are conservative
implicit distance estimators. State that distinction. Include denominator
and taper clamps, degenerate segments and origin behaviour. A deformation
needs a derivative bound; a smoothing radius enlarges the union envelope.
Hard subtraction/intersection must keep the intended cavity/edge material.
Normals, fitting, shadows, physics and bakes must use the same field.

Complete local half extents bound the new compounds by construction.
Rigid movement adds the existing swept bound; new nonrigid movement needs
its own proven envelope. Far LOD may omit subpixel detail, not change the
story-critical silhouette or invent an open passage. Cache keys include
recipe/grammar edition. Invalidate the relevant bake when geometry changes.

Do not add DISTFUNC compile keywords. Do not append unrelated geometry to
one enormous universal per-pixel kernel. Existing dispatch profiles and
performance markers own the work. The classic fractals are mathematical
places; this authoring system does not redecorate their definitions.

## Polymorphic play

A model can author new admitted recipes from the shared vocabulary. A
recipe is bounded data: version, exact seed/edition, geometry, transforms,
materials, sockets and chosen motion channels. It is not arbitrary shader
source masquerading as a save. Missing capabilities get an explicit host
adapter or reviewed source extension, never a fake claim of portability.

Compile native leaves into the current Foundry ABI. The generated GLSL is
mounted in the existing live chapter wrapper. Ship science machines still
need their explicit game admission/mounting adapter.
The compiler does not install a new gameplay object by itself. Native rewards,
canon, file/network access and execution remain the host's decisions.
A public recipe must carry its provenance and deliberately shared scope.

Roll → compile → inspect → play → retain the exact recipe and consequences.
The new story may reuse an object's recipe; it must not silently replace
its past geometry or pretend another player's choice became universal law.

## Using the system

From the repository root:

```sh
node Tools/SdfCraft/cli.mjs context
node Tools/SdfCraft/cli.mjs roll relic first-light > /tmp/relic.json
node Tools/SdfCraft/cli.mjs validate /tmp/relic.json
node Tools/SdfCraft/cli.mjs compile /tmp/relic.json /tmp/relic-packet.json
python3 Tools/SdfCraft/generate.py --check
node --test Tools/SdfCraft/*.test.mjs
```

The other construction studies are `organism`, `machine` and `scope`. They show data
composition, not race canon or finished creature/prop designs. A model can
author different arrangements; it is not limited to those examples.

Recipe v1 has `schema`, `edition`, `geometry` (the exact source SHA256),
`seed`, `intent`, `parts`, and optional `sockets`. Each part names an `id`,
catalogue `primitive`, native `material`1–8, `position`, `rotation` in radians,
complete half-extents `size`, two0–1 `variation` values, and optional `motion`.
Axes are in the catalogue. Poses/parameters canonicalize to float32, matching
the native20-float ABI. Text and metadata remain intact.

Current motion is `static` or `spin-z`, using the native frozen-hull clock.
The compiler admits at most128 parts,32 local sockets and a weighted
construction cost of2048. Weights are an admission heuristic, not timings.
The host must also budget pixels, march iterations, visible instances and
uploads. A small packet can still make an expensive close-up.

Each part can own up to8 ordered local `modifiers`: union, subtract or
intersect. Each modifier supplies primitive, material, local position,
rotation, size and variation. Its coordinates belong to that parent; the
parent rigid pose carries all its cuts together. A scope becomes root type43
and contiguous local children in the same20-float ABI. Expansion counts
against the128-part limit. Local children never enter the global scene CSG.
There is no recursive runtime expression stack. Native rest/fitting and
TopBake use the same local scope; posed queries and GPU rendering retain
parent spin and cavity material IDs.

The chapter `artifact` field accepts this exact recipe. The existing viewer
uses generated GLSL, model admission, object-space fitting, orbit and zoom.
Its close-up host admits32 visible leaves and explicitly refuses larger
analytic scenes; it never silently drops geometry. `recipe-glsl.mjs` emits
fixed function names and admitted float literals, never model shader code.
The main native science-machine mounting adapter remains unfinished. Richer
articulation and measured audio/cymatic routes remain host work; static/spin
is not the Reply face's speech rig magically transferred to every object.

The public native entry is `StarDiverSdfRecipe.Compile(Recipe)`. Its result
contains the admitted source, `FoundryShip`, packed floats and conservative
bound. The caller retains the exact source and decides where it may appear.
No recipe can fetch files, run scripts, award rewards or change canon.
`SocketPose` and portable `socketPose` keep named attachments on the same
rig. `Distance` / `recipeDistance` sample the posed field, including its spin
phase; the old Foundry `EvalShip` deliberately remains a rest/fitting query.
Use a relative host clock within±1,000,000 seconds, not a universe timestamp.

## Extend the vocabulary

The canonical scalar source is a small C-like float subset. The generator
maps supported math to Mathf/Math/GLSL and checks catalogue ID/function
bindings. Add a geometry construction there, regenerate all backends, then
extend both native dispatches and the numeric/visual witnesses. Catalogue
keys and IDs remain explicit bindings. There is one supported current
geometry implementation. Changed semantics invalidate stale source hashes;
do not preserve an old grammar branch or silently reinterpret stale recipes.
The source hash rejects a recipe whose exact implementation is unavailable.
It does not fetch or reconstruct that implementation automatically.

Do not add arbitrary runtime HLSL compilation to this recipe path. Source
extensions use the reviewed game build/export pipeline. Runtime invention
currently composes the admitted data vocabulary. A future expression VM
needs its own bounded interpreter and parity/budget evidence.

## Verify on the actual host

```sh
node Tools/SdfCraft/cli.mjs fixtures /tmp/craft
dotnet run -c Release --project Tools/FriktalHarness/ShipFoundry -- /tmp/craft --craft
node Tools/SdfCraft/verify-native.mjs /tmp/craft
dotnet run -c Release --project Tools/FriktalHarness/ShipFoundry -- /tmp/craft --craft-generation
node Tools/SdfCraft/glsl-witness.mjs /tmp/craft
```

The fixture command writes the four study recipes as an array; the native
harness emits matching source and packet fixtures. `--craft` probes every
construction and rejects invalid
native recipes. `verify-native` checks actual CPU distances, complete packets
and JSON returning from native code. Browser checking uses a fresh temporary
Chrome profile and local data; `FRIKTAL_CRAFT_CHROME` can select its executable.

For native GPU captures, prepare a separate shader-only Unity project:

```sh
python3 Tools/SdfCraft/prepare-witness.py /tmp/craft-unity --editor-version <installed-version>
```

Run that editor with `-batchmode -force-metal -projectPath /tmp/craft-unity
-executeMethod CraftWitness.Run -logFile /tmp/craft/unity.log`, setting
`FRIKTAL_CRAFT_OUTPUT=/tmp/craft`. Use the corresponding graphics backend on
Windows. The witness extracts production primitive/VM functions verbatim,
compares CPU/GPU fields and captures front/right/back/left neutral, normal
and silhouette views plus the four assembled recipes. It never opens or
downgrades the main project. Its simple light is a diagnostic, not the game's
display pipeline. Image-writing wall time is not a game frame-time benchmark.

The Foundry's existing full census and flight/comms contracts remain required
for native generator changes. Production `Roll` is the only grammar path;
the census exercises it directly. `--craft-generation` checks deterministic
current rolls, crafted component reach and breeding. There is no preview
edition switch, old-save branch or legacy geometry reconstruction mode.

Recorded captures, source hashes and qualified measurements are linked in
`evidence/receipt.json` and `CRAFT-REVIEW.md`. Warm dispatch/readback timings
exclude image encoding; they still include synchronization/readback and do
not certify a full game frame. Preserve that distinction in future reports.

Family inventory and migration state live in `catalogue.json`. The current source candidates cover ships,
life, projected organisms, artifacts/minerals, machinery, props, cockpits,
stations, cities, interiors, instruments, warp cores and the live external
adapter. All120 sampled race/classes contain Living Form components.
The Reply remains the retained reference. Final target-game artistic,
material, rig and performance acceptance is separate from field coverage.
I do not call an inventory or a numeric test AAA art acceptance.

## Native family captures

`FamilyWitness.Run` captures the real station map in a separate shader
profile prepared by `prepare-witness.py`. It probes a41³ field lattice and
records front/right/back/left, neutral/material, normal and silhouette views
at768² for two seeds. Bounds and finite fields are engineering checks, not
proof of ten finished art passes. Dispatch/readback includes synchronization;
full native6.7 scene cost and target-platform acceptance remain separate.

## Surface craft / multiple materials inside each part

A complex form must not wear one blanket texture. A part owns structural
regions, recesses, worn rims, mechanisms and routed inlays. `CraftSurfaceRole`
selects four functional regions; `CraftSurfaceBank` adds a second finish bank.
These are object-local geometric masks, not screen overlays. Preserve quiet
areas, material transitions and readable scale instead of coating everything
in fine pattern noise. Biological membranes and metal bearing races must not
share one universal finish. Cavity surfaces keep their own material read.

Recipe `skin` selects canonical `race`, nonnegative signed-integer `seed`,
and `scale` in0.25..32. It is independent of geometry RNG. The admitted source
retains the selection for a cold boot. The browser calls the existing
InfiniTexture artifact engine for eight independent albedo/height and
emission/metal/roughness/phase pages. It samples their object-local regions
with triplanar mapping, relief normals and distinct PBR response. The two
atlas textures remain bounded; there are not eight texture bindings per part.

Baking runs in one bounded document worker only on recipe changes. Each
viewer owns at most one newest pending request; disposal releases the owner.
The draw loop never bakes texture pixels. A temporary clay load state is
explicit, and a failed bake reports an error. No silent replacement engine.

Native `StarDiverSdfRecipe.BakeMaterials` calls the existing worker-safe
Foundry texture engine and returns its two four-region banks, cone maps and
material metadata. Importing hosts bind these to their existing slots. This
does not automatically mount a model in the science machine. The source
engine is `Assets/StreamingAssets/GhostFace/texture-foundry-algos.js`; its
portable module is generated verbatim. Do not fork its noise/skin algorithms.
The browser and native consumers retain their existing engine finish lanes;
geometry/region parity is tested separately from final lighting acceptance.

## Native artifact, mineral and prop follow-through

The native artifact grammar lives in FriktalArtifactArt.hlsl. The mineral
habit grammar lives in FriktalMineralArt.hlsl. generate.py compiles those
trusted sources into the live GhostFace science preview; models never supply
shader text to this path. Field, physical scanner and browser use the same
artifact/mineral body grammar. Material-region selection is shared as well.
The current native artifact packet is v5: exact32 DNA, matching race identity,
physical scale and eight retained texture seeds. Old native packets are
explicitly refused, never silently reconstructed or rewritten. Texture RNG
cannot consume the geometry/lore/earned-state stream. Loose mineral chunks
retain their visual seed through motion and collection.

The existing2048x1024 science farm keeps its four left-hand instruments. Its
right half packs eight albedo/height and eight PBR pages in four columns.
No status label or UI pixels may overlap those data tiles. The native sampler
uses a half-texel inset. The prop shade owner also samples the existing ship
material banks in prop-local functional regions. Glass, printed labels,
interaction anchors and the score-owned machine rig retain their owners.

Family witnesses accept station, life-eye, artifact, mineral, props,
cockpit, instrument, warp, fixture, city, interior, life, science-machine
and jukebox. The separate PlanetaryWitness renders actual projected body
graphs; ShipGalleryWitness renders actual current Roll packets.
Artifact/mineral probes and captures come from their actual native fields;
prop profiles cover seventeen types in both organic and machined forms.
Thin rails/screens use a lower occupied-grid threshold plus actual visible
image checks; a volumetric body threshold would reject valid thin surfaces.
Native field coverage, shader import, portable parity and warm dispatch /
readback are separate receipts. None proves full-game frame time or human
approval of the art. Keep the catalogue candidate states honest.

## Preserve evidence and its limits

After the actual witnesses complete, run:

```sh
python3 Tools/SdfCraft/collect-evidence.py /private/tmp/friktal-sdf-craft
```

The collector rejects a stale recorded source manifest, a failed receipt
or a missing view. Older captures without a source manifest remain labelled
as such; it never invents a source pin. Durable contact sheets preserve
actual captures. Subject crops make tiny machinery readable but are not
a comparison of relative object sizes. The full raw captures stay in the
witness output folder. Review the neutral, normal, silhouette and moving
views before claiming artistic completion.

The full LIFE diagnostic splits actual upright/axial/radial owners into
separate kernels and uses one map call site for trace and tetrahedral
normals. Its384-step neutral renderer is deliberately different from the
production72-step near-life pass. Warm diagnostic timings include readback;
LIFE and science-machine diagnostics currently exceed16.7ms. Measure the
actual native6000.7 scene before promising60FPS. The installed6000.5 editor
can validate isolated fields and production shader import; it must not
open or downgrade the main project.


## Physical finish grammar and the four follow-through passes

`surface-math.inc` is the canonical physical finish field. `generate.py`
translates it into native C#, native HLSL and the existing InfiniTexture JS
engine. Keep its integer hash reductions exactly representable in float32;
C#/Metal/JS probes must agree. Extend this engine rather than introduce a
second texture baker. `InfiniTexture.generateMaterialSurface` exposes eight
substrates: brushed alloy/dermal fibers, enamel/keratin, bearing bronze/porous
cartilage, optical glass/fluid conductors, woven insulator/collagen, oxide/
lichen, carbon lamellae/chitin and opaline inlay/sensory nacre. Each changes
height and roughness as well as pigment. Role plus finish bank chooses a
substrate; authored material IDs may override that selection. Do not confuse
eight RGB swatches with eight physical surfaces. Native `BakeMaterials` and
the bounded browser worker retain the existing two atlas bindings.

After the first family rollout, complete four distinct follow-through passes:
physical surface separation; finite construction cuts and articulations;
lineage/anatomy and functional assembly identity; consistent evidence and
correction of visible failures. Preserve quiet material areas and silhouette.
These supplement the ten-pass review; they do not certify every game object
as finished. In this iteration, generic alien caps were a review failure:
lineage-specific crowns replace them without changing the host body plan.

Every family review now captures clay, normal, silhouette and material views
from the same angles. LIFE, artifacts and minerals evaluate their production
material fields. Other material studies bind actual native eight-page bakes;
all use a labelled diagnostic light, not a claim of final game appearance.
Projected distant life gets material and clay views, not invented volumetric
normals. Native hulls use actual rolled packets. Preserve both material and
clay sheets, plus close heads where surface detail needs near inspection.
Run `--surface-gallery` in ShipFoundry, `verify-surfaces.mjs`, the Metal
SurfaceProbe and `run-witnesses.py` before collecting current evidence.

## Race identity and player authorship admission

A race owns architecture and material grammar, not a palette pasted onto
another race's complete object. Shared scalar construction math is allowed;
shared finished chairs, stations or anatomy relabelled as new cultures are
not. Require explicit race/family/edition and separate form/surface seeds.
Natural ecology lineages and geological habits keep their actual identities;
never silently call them human to satisfy a texture lookup. A generic native
fixture study remains a study until its race-by-family evidence exists.

Player and Ghost edits must target the same admitted recipe and preserve
locked parts and independent seed channels. Preview is not fabrication or
canonical ownership. The proposed physical replicator and compact modeling
room are documented in Replicator-and-Player-Craft.md; their game adapters
remain unimplemented. The gallery's current source-pinned inspection and
reroll witness lives in evidence/gallery-receipt.json, separate from the
earlier whole-family craft snapshot and target-game acceptance.
