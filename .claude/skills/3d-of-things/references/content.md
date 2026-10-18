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
| `build` | For the build only | `generate` or `augment` (a script path), `hints` (where to write the hints), `car` (a spec for scripts/cars), `textureSize` (default 2048). |

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
| `explode` | Open the model this far (0–1) for something only visible inside; the camera pose is then for that state. |

### Motion (`motion[]`)

Parts that move by time, by a control, or with another part. The full vocabulary is in references/mechanisms.md.

- **Spins** (`speed`, turns a second, while running): wheels, shafts, gears. Ratios come from the truth sheet: a 16-tooth gear driven by a 40-tooth one turns at `-speed × 40/16`.
- **Clocks** (`clock`, `train`, `swing`, `wind`, `coil`, `pawl`): a watch train in step with real time.
- **Crank and cam** (`crank`/`cam` naming the driver, with `along`, `throw`, `rod`, `phase`, `rocks`, `lift`, `duration`): pistons, rods and valves.
- **Controls** (`control` with `turn`, `slide`, `curve`, `cloth` or `scroll`): driven by a mechanism module's control values, not by time.

`pivot` (a point on the axis, from the hints) and `axis` are in model space. `motionLabel` names the run button ("Turn the crank"); `slowMotion: { rate, explode }` makes it a slow-motion button for clock-driven objects.

### How it works (`how[]`)

5–7 steps, one stage of the energy chain each (references/explaining.md has the recipe).

| Field | What |
|---|---|
| `label`, `title`, `text` | Step bar label (1–2 words), a sentence title, two short paragraphs. |
| `angle`, `fill` | Camera azimuth/elevation; the parts in focus (or `frame`) are framed automatically, filling `fill` of the frame (default 0.75). `camera` is an exact pose instead. |
| `focus` | Nodes that stay solid; the rest turn to glass. |
| `frame` | Nodes to frame, if not the focused ones. |
| `hide` | Nodes left out for the step (a dial in the way). |
| `explode` | Open the model this far for the step. |
| `flow`, `flows`, `carries` | The path the power takes: points (`[x, y, z]` or `{ node, at, ride }` to ride with a part). A point on a part that spins needs `ride: true`, or the line stays put while the part turns (a sprinkler's arm). `carries`: `power` (vermilion, default), `light` (amber, straight between reflections), `air` (blue), `water` (teal). |
| `tags` | Labels on parts: `{ node, text, at, ride }`. Live numbers ("3 swings / second"). A tag on a node that doesn't exist is dropped, and `npm run qa` fails it. |
| `rate` | Mechanism speed for the step (1 real time, 0.1 slow motion). |
| `chart` | A chart under the text: a name from `src/charts/` or a generic one set up here (below). |
| `try` | An experiment (below), with its settings: `count`, `speeds`/`spin`, `settings`. |

### Charts

Generic charts any object can use, set up in the step:

```js
chart: { type: 'ladder', title: 'Turns, gear to gear', caption: '…', unit: 'Turns, for one turn of the crank',
         ticks: [0, 1, 2, 3], rungs: [{ name: 'Crank', value: 1, note: '1 turn', node: 'gear_large' },
                                       { name: 'Pinion', value: 2.5, note: '2½ turns', step: '×2½', node: 'pinion' }] }
// scale: 'log' for big ranges (a frame to a screen); a rung's node gets a dial that turns with it.

chart: { type: 'bars', title: 'Spindle speed', unit: 'Turns a minute, by belt position', follow: 'selected',
         bars: [{ label: '1', value: 550 }, { label: '2', value: 840 }] }
// follow: 'selected' picks out the chosen one of the step's speeds; picked: n marks one bar.

chart: { type: 'timing', title: 'One frame, slowed down', node: 'feed_spool', perTurn: 2,
         bands: [[0, 0.3, 'pull-down']],
         lanes: [{ name: 'Film', points: [[0, 0], [0.04, 0], [0.26, 1], [1, 1]], notes: [[0.15, 'moves']] }] }
// lanes: a level 0–1 through one cycle; the cursor follows `node`'s turning, perTurn cycles a turn.
```

Every chart has a `title` (small capitals) and a `caption` (what to look for). Object charts (`watch-*`, `rangefinder-*`, `reflex-*`, `suction`, `downforce`, `nozzle`, `flight`, `motor-field`, `binoculars-image`) read their mechanism module; `npm run check -- --list` prints them all. A new one goes in `src/charts/` and its registry (references/mechanisms.md).

### Experiments (`try`)

| `try` | For | Settings |
|---|---|---|
| `run` | Anything that spins: hold to run, counting turns | `count: [{ node, label }]` |
| `speeds` | Pick a ratio (belt positions, gears) | `speeds: [{ label, factor, note, factors? }]`, `spin: [nodes]` |
| `wind`, `loose`, `hold` | A watch: wind it, take out the pallet fork, hold the balance | |
| `focus`, `aperture`, `shutter`, `advance` | A camera | `settings: { focus, aperture, speed }` |
| `slide` | A reflex camera's dark slide | |
| `suction`, `grip`, `thrust`, `fly` | The Roadster's fans and thrusters | |

`npm run qa` drives every experiment the same way: it holds each hold button, moves each slider to both ends, clicks each choice and button, and fails if the readout never changes. So a new experiment needs a readout (`.tour__readout`) that reflects what happened.

## Checks

`npm run check -- <slug>` checks all of this against the model in a second: unknown nodes, meshes in no part, points off the model, charts and experiments that don't exist, duplicate orders, missing credit fields and TODO text. `npm run qa -- <slug>` then checks it in the browser.
