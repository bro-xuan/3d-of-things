# Mechanisms

How parts move in the viewer, what already exists, and how to add a kind of mechanism the site doesn't have yet. Nothing in the site branches on an object's slug: every special case is chosen by motion fields, control names, or chart and experiment names.

## What exists

### Time-driven (src/viewer/rig.ts, `Mechanism`)

| Motion fields | Moves | Used by |
|---|---|---|
| `speed` (turns a second while running) | A spin | drills, projector, drill press, car wheels and shafts |
| `clock: 'hour' \| 'minute' \| 'second'` | A hand on the visitor's clock | pocket watch |
| `train` (turns per turn of the seconds hand) | A wheel stepping with the escapement's beat | pocket watch |
| `swing: 'balance' \| 'pallet' \| 'coil'` with `amplitude` | A balance, a pallet fork, a hairspring | pocket watch |
| `wind`, `wind` + `coil`, `pawl` | The keyless works, a mainspring, a click | pocket watch |
| `crank` (+ `along`, `throw`, `rod`, `phase`, `rocks`) | A piston and its rod on a crank | family car, bicycle pump |
| `cam` (+ `along`, `lift`, `phase`, `duration`) | A valve on a camshaft | family car, bicycle pump |

`inside: true` only animates when the inside can be seen; it works for `train` but is ignored for plain spins.

`throw`, `rod` and `lift` are model units, whatever the scale of the part's parent.

**Something that slides with nothing visible turning** (a pump's plunger, a hand-worked valve): add a hidden driver with the kit, `hiddenDriver('stroke', { parent: 'base', at })`, an empty part the build keeps. Give it a `speed` and hang the sliding parts on it with `crank` (a long `rod` makes the stroke close to a sine) and `cam`. Rest the model at the top of the travel (move the part there in the build), so every framing holds the whole stroke. The bicycle pump does this.

### Control-driven (src/viewer/linkage.ts, `Linkage`)

A motion with `control: '<name>'` follows a value that a mechanism module sets, through `turn` (turns per unit, from `from`), `curve` ([value, turns] points; with `slide`, a slide), `slide` (a vector per unit), `cloth` (a curtain between rollers, with layout from the build) or `scroll` (film whose picture moves).

| Module | Chosen when | Controls it drives | State, actions |
|---|---|---|---|
| `filmcamera.ts` (rangefinder) | a motion uses `curtain1` or `focus` | `focus`, `aperture`, `curtain1`, `curtain2`, `lever`, `film`, `release` | `cameraState`; `focusAt`, `setStop`, `setSpeed`, `fire`, `windOn` |
| `reflexcamera.ts` (SLR) | a motion uses `mirror` | `focus`, `aperture`, `iris`, `speed`, `blades`, `mirror`, `flaps`, `key`, `wind`, `film`, `release`, `slide` | `cameraState`; also `setSlide`, `setPreview` |
| `aerocar.ts` (Roadster) | a motion uses `skirts` | `fan`, `skirts`, `wing` | `aeroState`; `setFans`, `setSpeed`, `fire`, `fly`, `refill`, `reset` |

Control names are one global namespace: a control nothing sets never moves, and any object with a `focus` control currently gets the rangefinder's module. Name a new mechanism's controls so they don't collide.

## Adding a mechanism

Only when nothing above can do it. A crank-driven pump, a belt, a lever linkage, a ratchet or a spinning governor can usually be built from spins, `crank`/`cam` motions and `speeds`; try that first.

A new mechanism is a module in `src/viewer/<kind>.ts`, shaped like the three that exist:

- No three.js import, so the charts can import its maths before the viewer loads.
- A constructor taking `Controls` (`{ set(control, value) }`) that calls `push()`.
- `readonly kind`, a `get state()` returning a plain object with `kind`, `tick(dt): boolean`, optional `rate` and event callbacks for sounds.
- Real numbers from the truth sheet: the timing chart, the ratios, the physics. The charts and readouts read the same functions.

Wire it in (there's no registry yet, so these are the places):

| Where | What |
|---|---|
| `src/viewer/Viewer.ts` | Import it; add a field; choose it in `load()` beside `ReflexCamera` / `FilmCamera` / `AeroCar` by a control name only it uses; tick it in the frame loop; expose its state and actions as methods (like `cameraState`, `fire`); reset it in `setTouring(false)`; dispose it |
| `src/charts/index.ts` | A getter on `ChartSource` for its state, and its charts' factories in `factories` |
| `src/pages/tour.ts` | The source object passed to charts, and a `kind === '<name>'` branch in the experiments for each new `try` |
| `src/pages/thing.ts` | The sound button's condition, if it makes sound (and voices in `src/sound.ts`) |
| `src/types.ts` | The doc comments on `Motion.control` and `Step.try` |
| `scripts/check-content.mjs` | Nothing: it reads chart and experiment names from the code |

An experiment must have a readout (`.tour__readout`) that changes when it works, and controls the QA runner can drive: hold buttons (`.button--hold`), sliders (`input[type=range]` in `.tour__slider`), choices (`.tour__choice`) or plain buttons in `.tour__try-actions`. Then `npm run qa` checks it with no new code.

## Charts

A chart is a `ChartFactory` (`(host, { source, thing, spec, go }) => { title, caption, update?, destroy }`) in `src/charts/`, registered in that file's `Record<string, ChartFactory>` and spread into `factories` in `src/charts/index.ts`. Draw it as SVG sized to CSS pixels, so text stays in rem (`sizedSvg` in `src/charts/svg.ts`), and read live values from `source` in `update()`.

Prefer the generic `ladder`, `bars` and `timing` (references/content.md), set up in the content file. A custom chart earns its place when it shows something the model can't: a field turning in a motor, a pressure curve, a light path. Prefix its name with the object or kind (`reflex-path`, not `path`).

## Sound

Three voices exist in `src/sound.ts`: a tick, a ratchet and a shutter. The sound button only shows for objects whose motions have `swing: 'pallet'` or `cloth`. Sounds are off until the visitor turns them on.
