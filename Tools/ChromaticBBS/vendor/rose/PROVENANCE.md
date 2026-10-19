# Original Masha rose shader reference

Recovered read-only from the published inline `rose-vertex` and
`rose-fragment` script elements of:

<https://ghost-a-rose-between-machines.friken596564.chatgpt.site/>

The read-only Sites connector confirms **A Rose Between Machines — First Contact** is
owned by the current user. Its description credits Friken.Ghost's
first-contact transmission for Masha and Ernesto. The user explicitly asked
to reuse this previously created artwork in CHROMATIC. These files preserve
that existing source for integration; they do not declare a new public
license or substitute a different rose implementation.

At retrieval on October 19, 2026, Sites reported:

- Project: `appgprj_6ac25f400358819184bb5a282a111a08`
- Latest saved version: **11**
- Version ID: `appgprj_6ac25f400358819184bb5a282a111a08~appgver_ae1c5c6398c48191b40e7159aa65c140`
- Source commit: `5e29802d01858cce2386acedd94f4da8edca0251`
- Saved deployment archive hash: `sha256:e829f4a2b0d9a167f46bdd60e83ee851dbdde4b793573eebf3de165ea1a79b46`

The shader was read from the live page's DOM, rather than extracted from
that saved deployment archive; the metadata records site provenance and
does not assert a separately verified archive-to-DOM byte comparison.
The page's runtime reference is `/assets/rose-runtime.js?v=6`; that query
suffix is an asset cache version, not the Sites saved version number.
Direct browser navigation to that JS asset was blocked by the browser.
The full inline shaders were accessible and were copied without executing
downloaded source. No site access, source repository, version or deployment
was changed.

## Mathematical contract

This rose intersects seven curved parametric height surfaces with the camera
ray. Each whorl folds into five through eleven petals, advances by the
golden angle `2.3999632297`, and scales by `0.74`. Seven fixed-point
refinements per whorl are followed by a boundary/residual hit test. Normals
come from finite differences of that whorl's height function.

It is **not a conventional 3D signed-distance-field sphere tracer**. Its
original quality comes from those actual curved surfaces, recursive veins,
iridescent pigment, nodal interference, specular silk, harmonic halo and
golden-angle pollen. Keep that distinction when adapting it.

The recovered vertex source is 77 characters; the fragment source is 4,874
characters. Both local lengths match the original inline elements. Local
UTF-8 SHA256 receipts are:

- `rose.vertex.glsl`: `c456d7b107ea3152a65fa06e07de02dafe23880fbf780a92f02510899dfd15a5`
- `rose.fragment.glsl`: `616ae3861fdbb8e8e53fec10cb052d3242308f0100107d234674ca29580bc000`

Uniforms are `uResolution`, `uPointer`, `uModes`, `uTime`, and `uAudio`.
The source routes the four audio components into deformation, hue, halo and
pollen. The retrieved shader alone does not establish the runtime's exact
audio measurement or default mode values. Browser/audio acceptance of the
adapted CHROMATIC integration remains separate work.
