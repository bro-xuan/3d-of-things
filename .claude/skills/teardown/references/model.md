# The model

## Sourcing

Licences first: CC0 or CC BY only, and checkable at the source, because a model in a web viewer can be downloaded by anyone.

1. **Poly Haven** (all CC0) is the default. Search the list (`https://api.polyhaven.com/assets?t=models`, 500+ models) by tag, then `https://api.polyhaven.com/info/<id>` for its name and authors. `npm run models:fetch` downloads the 2k glTF, checks the md5s, and fails if the credit doesn't name every author. Many Poly Haven props are single meshes (tier B); mechanical ones often have their parts separate (tier A).
2. **Sketchfab** has CC0 and CC BY museum scans, but every download, CC0 included, needs the user's API token. Ask before going that way, check each model's own licence field (uploads from one museum mix CC0 and CC BY), and note that scans are shells.
3. **Built in code** (tier C) when nothing free fits, or when the insides matter more than the outside (the Hasselblad was built from its service manual).

Don't use: the Khronos glTF sample CAD assemblies (their READMEs carry no licence), paid stock models (their licences rarely allow serving the file), or AI part-segmentation tools (Hunyuan3D-Part, PartField, HoloPart). They split a shell into plausible pieces but don't know how the machine works, so they invent the insides.

## Model space and units

- Generators work in **millimetres** in the object's own frame: x to its right, y up, z towards its front. The kit writes **metres** into the glTF; the viewer's scale bar, drawings and real size depend on that.
- Content files use **model space**: x and z centred, y = 0 at the lowest point, scaled so half the bounding box's diagonal is 1. `modelSpace(scene)` returns `toModel(mm)`, `unit(mm)` and `space: { origin, mmPerUnit }` (that last goes in the hints).

## The kit

`scripts/kit/index.mjs` is the one import. Its building blocks live where the objects that grew them keep them, so those models rebuild byte for byte.

| Namespace / export | What's in it |
|---|---|
| `geometry` | `Geo` (an indexed mesh: `vertex`, `tri`, `quad`, `append`), `extrude(caps, sides, shapes, z0, z1, opts)`, `flat`, `lathe(geo, profile, opts)`, `cylinder(geo, r, z0, z1, { inner })`, `turned(geo, stations, { bore })`, `ribbon(geo, path, width, z0, z1)`, `spiral(r0, r1, turns)`, loops (`circle`, `inset`, `ccw`, `cw`, `pointInLoop`), `contours(sdf, bounds, cell)` with `sd` and `smin` (outlines from 2D distance fields), `place`, `alongAxis` |
| `gears` | `gear({ teeth, module, kind, phase })` (watch-style teeth; `kind: 'pinion'` for the small one), `escapeWheel`, `windows`/`wheelHoles` (spokes), `polar` |
| `meshPhase(a, b)`, `centreDistance(m, za, zb)` | Turn the second gear so its teeth fall between the first's; where to put it |
| `solids` | Along any axis (`'x'`, `'y'`, `'z'`): `plate(geo, axis, shapes, w0, w1)`, `box(geo, [x0,x1], [y0,y1], [z0,z1], { round, chamfer, axis })`, `shaft(geo, axis, at, stations)`, `revolve(geo, axis, at, profile)`, `spur(geo, axis, at, { teeth, module, phase, bore, hub }, w0, w1)`, `rect`, `ring`, `hole`, `put`, `localCentre` |
| `shapes` | `roundedBox(geo, xs, ys, zs, r)` (every edge rounded: castings), `flutes` (knurling), `band`/`face` (rings and engraved scales), `roundRect`, `projectUVs`, `tube(geo, path, r)` (wires, springs, cables), `helix` (a coil's centreline), `conicalGear`, `openHoles(mesh, holes)` with `sdCircle`/`sdRect` |
| `surgery` | For a downloaded shell: `readMesh(primitive)` (mm), `cut(mesh, f)` (split along f = 0), `pick(mesh, keep)`, `islands`/`islandBounds`, `merge`, `solidify(mesh, thickness)` (an inner skin and a rim on every cut edge), `fromGeo`, `writePrimitive` |
| `textures`, `finishes` | PNG painters: `leatherGrain`, `engraving` (SVG scales), `screenMarkings`, `rollFilm`; `genevaStripes`, `perlage` (normal maps) |
| `loft`, `curve`, `lines` | Lofted bodies through profile curves (a car's shell; scripts/cars/body.mjs) |
| `wheels` | `tyreSize`, `tyre`, `rim`, `brakeDisc`, `caliper` |
| `Part` | `new Part(name, { parent, extras })`; `part.geo(materialKey)` returns that material's `Geo` |
| `materialKit(doc)` | `material(name, hex, metallic, roughness)`, `glass(name, hex, { index })`, `texture(name, png)`, `textured(…)`, `tile(info, scale)` |
| `assemble({ name, parts, materials })` | A new document: one node per part, nested by `parent`, one primitive per material. Returns `{ doc, scene, nodes, pieces, parentOf }`. |
| `piecesOf`, `writeNodes` | The same in two steps, for adding parts to a downloaded model (tier B) |
| `modelSpace(scene)` | `{ toModel, unit, space, mmPerUnit, realSize }` |
| `runChecks({ label, pieces, contacts, data, parentOf, mmPerUnit, check, log })` | The clash and explode checks (below) |
| `inModel(hints, ms)` | A nested hints object into model space: points through `toModel`, lengths scaled, axes kept |
| `checkClashes`, `checkExplode`, `extensionFor`, `irisAngle`, `clothPath` | The checks themselves; thin-lens extension and iris angles; cloth curtains between rollers |

When a new object needs a building block, add it to the kit (a module in `scripts/kit/`, exported from `index.mjs`) rather than to the object's folder, so the next object has it.

## Building in code (tier C)

The scaffold's `generate.mjs` is the smallest complete example: numbers (`L`), `CONTACTS`, `buildParts()`, `generate()` returning `{ doc, hints }`. The full ones are scripts/hasselblad/ (a camera: cast shell, mirror box, lens with leaf shutter and iris, film magazine) and scripts/cars/ (a lofted body cut into panels, a powertrain, an aero system).

- Lay out from the truth sheet's numbers in one place (`L`, or a `layout.mjs`), and derive positions from them (gear centres from `centreDistance`, a lens's extension from `extensionFor`).
- One `Part` per piece that moves or comes off. Nest a part under what it rides on (`parent`), so it moves with it and the explode check knows.
- Materials are named after the object (`leica_chrome`), since names are global in the viewer.
- Return hints: `space`, `pivots` (each moving part's axis point), `anchors` (every point the content places: callout markers, tag positions, flow points), and the numbers the content and charts need (teeth, ratios, travel).

## Opening a shell (tier B)

scripts/camera/augment.mjs (the Leica) is the full example, scripts/watch/augment.mjs the other.

1. Read the shell's primitives with `surgery.readMesh` (mm) and find where it splits: `npm run models:inspect`, `surgery.islands` for loose pieces, and sections along an axis for seams.
2. Cut along planes (`surgery.cut`, then `surgery.pick` by side) into the parts that come off (cover, base plate, door), and `solidify` each so it has a thickness and a rim along the cut.
3. Remove what only faked the inside (dark boxes behind windows, a disc behind a lens).
4. Generate the insides as Parts, put everything in one `pieces` map (the shell's pieces with `generated: false`), `writeNodes`, dispose the source's own nodes, run the checks and return hints.

## The build's checks

`npm run models:build -- <slug>` runs the generator with `check: true`. It fails the build on:

- **Clashes:** any generated mesh crossing another piece at rest (three-mesh-bvh, triangle against triangle). Pairs in `CONTACTS` are allowed, and only pairs that truly touch belong there: gears in mesh, a shaft in its bearing, a part sitting on another. `'name*'` matches a prefix; a leading `*` does not work.
- **The explode path:** the content file's explode, replayed with the viewer's timing at 160 steps, must not pass any piece through another. Pairs that touch at rest are only checked once they've moved apart.

`--no-check` turns both into log lines for a quick look mid-change. A model that only passes with it isn't done.

## Naming

- Nodes are `snake_case` and say what the part is: `focus_ring`, `mirror`, `take_up_spool`.
- Numbered repeats: `iris_blade_0` … `iris_blade_8`, `piston_1` … `piston_4`.
- Sides: `_left`/`_right`; wheel corners `_fl`, `_fr`, `_rl`, `_rr`.
- Slugs: lowercase letters, digits and hyphens (the poster endpoint accepts nothing else).

## Size

Keep a model under ~3 MB and ~100 nodes; the existing ones are 0.8–2.9 MB with 37–94 nodes. The build compresses geometry with meshopt and textures to WebP at 2048 px (`build.textureSize` to change it).

## Gotchas

- gltf-transform's `prune()` drops a `TEXCOORD_n` no material reads, so per-vertex data for the viewer goes in a custom attribute (`_CLOTH`, which three.js loads lowercased).
- meshopt quantisation rewrites node transforms, so anything that deforms a mesh in the viewer has to work through its matrix.
- three-mesh-bvh reorders the index buffer, so a triangle index from a BVH cast can't be mapped back to a material.
- The viewer assumes glTF units are metres. A downloaded model in other units shows a wrong scale bar and drawings; fix it in the build step.
