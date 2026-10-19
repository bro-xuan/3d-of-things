# The content file

`content/<slug>.json` is the page. The site reads it as it is (`src/content.ts`); the types are `Thing` in `src/types.ts`, and that file's comments are the final word. For a new object it's written by `objects/<slug>/content.mjs`, so positions come from the build and the words live next to the code that places them.

## The content builder

```js
import { builtInCode, polyHaven, pose, readHints, space, writeContent } from '../../scripts/kit/content.mjs';
import { nodeBounds, placer } from '../../scripts/kit/nodes.mjs';

const H = readHints('leica-m6');                  // objects/leica-m6/hints.json, from the last build
const at = (name) => H.anchors[name];              // points the generator named
const pivot = (name) => H.pivots[name];
const { top, front, centre } = placer(await nodeBounds('leica-m6'));   // points on any node's box
writeContent('leica-m6', { … });
```

- **Anchors** (model space, named by the generator): `hints.anchors.shutter_button`. Use them for callout positions, tag positions and flow points. Add one in the generator's hints rather than typing a number here.
- **Pivots and axes** (`hints.pivots`): for `motion[].pivot`.
- **Node boxes** (`placer(nodeBounds(slug))`): `top('lens')`, `front('dial')`, `centre('body')`, for downloaded models and for anything near a part's face.
- **Camera poses**: `pose(target, [azimuth, elevation], distance, { card })`. Azimuth 0 looks from +z (the front), 90 from +x; distance is in model units, so 1.5–2.5 frames the whole object. A small object's callouts want 2 or more: at 1 the part fills the frame and its card covers it. A callout's card opens on the roomier side of its marker; `card: 'left'` or `'right'` frames the marker off centre so the card lands on that side, over empty background.
- `space(H)` gives `M(x, y, z)` (a point in mm in the generator's frame) and `U(mm)` (a length) for the rare value no anchor covers.

Model space: x and z centred on the model, y = 0 at its lowest point, scaled so half the bounding box's diagonal is 1. `npm run models:inspect -- <slug>` prints every node's box in it.

## Fields

### The object

| Field | What | Notes |
|---|---|---|
| `order` | Gallery position | Unique. Figure numbers ("Fig. 08") follow the order, so inserting renumbers the ones after. |
| `title` | "Medium-Format SLR" | Name the kind; the make goes in the hook or summary when it's a specific model. |
| `hook` | One line under the title | The mechanism's surprise ("Every turn of the handle spins the bit three and a third times"). |
| `category` | `gears`, `optics`, `time`, `cameras`, `cars`, `home` | A new one goes in both `src/content.ts` and `CategoryId` in `src/types.ts`. |
| `summary` | Three paragraphs | Problem and principle, the parts, the process (references/explaining.md). |
| `model` | `models/<slug>.glb` | Built by `npm run models:build`. |
| `hide` | Nodes left out of the scene and the bounds | A strap, a stray cable, a ground plane. |
| `viewAngle` | `[azimuth, elevation]` of the first view | The camera distance is fitted. `view` sets an exact pose instead. |
| `explodeAngle` | Where the camera swings to when it comes apart | For models whose parts would come straight at the camera. |
| `explodeDuration` | ms for "Take it apart" (default 1300) | 1700–3200 for many stages. |
| `facts` | 4–6 `{ label, value }` | "Beat" / "6 ticks a second". The real size is worth one. |
| `credit` | Who made the model, licence, source | `polyHaven(id, title, authors)` or `builtInCode(title, sources)`. `models:fetch` checks Poly Haven authors against the API. `extra: { label, text }` adds a line (what was built for this site, what it was laid out from). |
| `build` | For the build only | `generate` or `augment` (a script path), `hints` (where to write the hints), `car` (a car's name in its model, for the cars built with scripts/kit/cars/), `textureSize` (default 2048). |

### Parts (`parts[]`)

| Field | What |
|---|---|
| `node` | The glTF node. Every mesh must belong to a part: its own node, a `with` node, or the nearest part node above it. |
| `label` | Short name for the legend and hover. |
| `group` | Heading in the legend; consecutive parts share one. 4–8 groups, in energy-chain order. |
| `about` | One or two sentences, shown beside the part when it's clicked. |
| `direction`, `distance` | How it comes off: any vector; distance in model units (0 stays put). |
| `stage` | Lower stages come off first. Outer parts (case, covers) first, the mechanism's heart last. |
| `window` | `[start, end]` of the slider instead of the stage's timing; gaps between windows hold a useful half-open state. |
| `then` | A second leg: lift clear, then slide aside (`{ direction, distance }`). |
| `with` | Other nodes that travel with it. |

The build checks every explode path against every other part (it uses the viewer's timing). A part nested under another node rides with it.

### Callouts (`annotations[]`)

6–9 of them, in energy-chain order: a numbered marker on the model and a card in the sheet.

| Field | What |
|---|---|
| `title`, `text` | Card heading; one to three sentences of cause and effect. |
| `position` | The marker, on the part's surface (an anchor or a face of its box). |
| `node` | The marker rides with this node when the model comes apart. `ride: true` also turns with it (a crank handle). |
| `camera` | Where the camera flies: `pose(target, angle, distance)`. |
| `explode` | Open the model this far (0–1) for something only visible inside; the camera pose is then for that state. The viewer keeps an opened model standing on the floor, so when a part drops below the model (the ceiling fan's switch cup, 460 mm) the whole model rises by that drop: aim the camera at the part's opened position plus that lift (`apart()` in objects/ceiling-fan/content.mjs). |

### Motion (`motion[]`)

Parts that move by time, by a control, or with another part. The full vocabulary is in references/mechanisms.md.

- **Spins** (`speed`, turns a second, while running): wheels, shafts, gears. Ratios come from the truth sheet: a 16-tooth gear driven by a 40-tooth one turns at `-speed × 40/16`.
- **Clocks** (`clock`, `train`, `swing`, `wind`, `coil`, `pawl`): a watch train in step with real time.
- **Crank and cam** (`crank`/`cam` naming the driver, with `along`, `throw`, `rod`, `phase`, `rocks`, `lift`, `duration`): pistons, rods and valves.
- **Controls** (`control` with `turn`, `slide`, `curve`, `cloth` or `scroll`): driven by a mechanism module's control values, not by time.

`pivot` (a point on the axis, from the hints) and `axis` are in model space. `motionLabel` names the run button ("Turn the crank"); `slowMotion: { rate, explode }` makes it a slow-motion button for clock-driven objects.

### How it works (`film[]`)

A short film of the mechanism doing its job: references/film.md has the rules, every field and the cues. The view fields work as they did for the old tour's steps:

| Field | What |
|---|---|
| `angle`, `fill`, `frame` | The camera's view as the shot starts; the `frame` parts (or the `focus` ones) fill `fill` of the frame (default 0.5). |
| `focus` | Nodes that stay solid; the rest turn to glass. One list for the whole film. |
| `flow`, `flows`, `carries` | A path drawn through the parts: points (`[x, y, z]` or `{ node, at, ride }` to ride with a part). A point on a part that spins needs `ride: true`, or the line stays put while the part turns (a sprinkler's arm). `carries`: `power` (vermilion, default), `light` (amber, straight between reflections), `air` (blue), `water` (teal). |
| `tags` | Labels on parts: `{ node, text, at, ride }`. A tag on a node that doesn't exist is dropped, and `npm run qa` fails it. |

The step-by-step tour that came before (`how[]`: steps of text, charts and experiments) is gone; `npm run check` fails on a content file that still has one.

## Checks

`npm run check -- <slug>` checks all of this against the model in a second: unknown nodes, meshes in no part, points off the model, film cues that don't exist, captions and films too long, duplicate orders, missing credit fields and TODO text. `npm run qa -- <slug>` then checks it in the browser.
