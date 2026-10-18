# 3D of Things

How things work, taken apart. A free, browser-based library of real machines you can turn over, look inside and pull to pieces, with numbered callouts that explain what each part does.

![The drill press, assembled and exploded](public/posters/drill-press-exploded-800.webp)

Ten objects so far: a hand drill, a pocket watch, binoculars, a microscope, an 8 mm film projector, a drill press, a rangefinder camera (a Leica M3), a medium-format SLR after the Hasselblad 500C/M, the Tesla Roadster shown in October 2026 (with the fans that suck it onto the road and the air thrusters that make it fly), and a family car of no particular make with its engine running. The SLR and the two cars are built entirely in code. Each page has:

- a 3D viewer (drag, zoom, pan; arrow keys too)
- a short explainer and a few key facts
- numbered callouts on the model (off until you turn on Labels, so the model starts clean); picking one flies the camera to it
- click any part, on the model or in the parts list, and what it does opens in a card beside it
- the controls by the model, under its drawings: How it works, the take-it-apart slider and button, run, and Labels (lettered tags naming every part, and the callout numbers)
- on wide screens the model stands on a layer above the page, solid and whole, so it can reach over the card the text is on; picking another object from the row of cut-outs above it (or the pager) hands one model over to the next (one glides out as the other glides in, no reload)
- a scale bar at the model's real size, which follows the zoom
- for some objects, the mechanism running: the hand drill's gears turn at their real 80 : 24 ratio, the pocket watch runs its whole movement in step with your local time, with a slow-motion button for the escapement, the camera focuses, stops down, fires its shutter and winds on, and the cars drive: the Roadster's wheels, half shafts and motors at their gear ratio (and its fans spin, its skirts drop, its wing rises, its thrusters blow and it flies), the family car's pistons on their crankshaft, its valves on the camshaft, its gearbox, propshaft and differential
- **How it works**: a step-by-step tour of the mechanism. Each step keeps the parts it's about solid and turns the rest to glass, so you can watch them work inside the closed model, draws the path the power takes through them (or, for the optical objects, the light), pins labels such as each wheel's speed to the parts (for the Roadster's fans and thrusters, the path the air takes), and runs a chart in step with the model: the watch's escapement timing, its speed ladder from barrel to balance, the balance's swing, the mainspring's pull. Some steps have something to try: wind the watch, hold its balance still, take its pallet fork out and watch the train run away, crank the hand drill and count the turns, move the drill press's belt, focus the camera until the rangefinder's two pictures meet in the finder, close its iris, fire its shutter in slow motion at any speed, and wind on a frame, and fire the SLR in slow motion (lens shut, mirror up, rear flaps open, shutter), wind it with one turn of the knob, and pull its dark slide, count a Roadster's motor's turns for one of its wheels while a chart shows the inverter's three currents turning the field the rotor follows, switch on its fans and watch the pressure under its floor drop, take it up to speed and watch the downforce from its fans and its wing, fire its rear thrusters from a standstill (0 to 60 mph in about half a second, until the air runs out), and make it hop or barrel-roll on its lift thrusters while a chart sets their thrust against its weight, and watch the family car's four strokes, pick its gears and take its differential round a bend
- **Rendered / Wireframe**: two cards at the top right show the model each way (the wireframe one is drawn from the model itself). Switching sends a scan line down the model that redraws it in ink as it passes, hidden edges faint, on drafting-grid paper (key W)
- **Drawings**: top, front and side views drawn from the model as a draughtsman's sheet, at one scale and dimensioned at its real size, printed on the paper beside the model (in the sheet on phones). Pick a view and the model turns to match it
- a tick for the watch's escapement and a click for the camera's shutter (off until you turn them on)
- the model's credit and license

## Run it

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check, then build to dist/
npm run preview    # serve dist/
```

The site is static (Vite + TypeScript + three.js, no framework, no backend). Routing is hash-based and asset URLs are relative, so `dist/` works from any host or sub-path.

## How it's put together

```
content/<slug>.json      one file per object: text, parts, callouts, credit
public/models/<slug>.glb compressed models (meshopt geometry, WebP textures)
public/posters/          gallery images and tray thumbnails, rendered from the models
scripts/                 model pipeline: fetch, build, inspect, posters
src/pages/               gallery, object page, about; theatre.ts keeps the 3D layer between object pages, tour.ts is "How it works"
src/viewer/              the three.js viewer: loading, camera, explode, motion, labels, cards, looks (wireframe, and glass for the parts a step isn't about), flow paths, drawings;
                         linkage.ts moves parts by a mechanism's controls (a camera's focus, its shutter), filmcamera.ts runs the rangefinder, reflexcamera.ts the SLR
src/charts/              the charts for "How it works", drawn in SVG from the same numbers the model runs on
```

The gallery is plain DOM. three.js is only fetched when an object page opens (or when you hover a gallery plate), after that page's poster is already on screen.

## The pocket watch's movement

The Poly Haven watch is a closed case with three hands, so the movement inside is generated: `scripts/watch/` runs as a build step (`build.augment` in `content/pocket-watch.json`). It cuts the case into the pieces that come apart (crystal, dial, case back, crown) along the mesh's own edge loops, adds the inside surfaces a closed shell never had, and builds about 20 parts from real tooth counts: barrel and mainspring, a centre-seconds train (80/10, 75/10, 84/7), a Swiss lever escapement at 21,600 beats an hour, balance and hairspring, motion works and keyless winding. The build fails if any two parts overlap, if anything pokes through the domed case back, if the explode in the content file would pass one part through another, or if the model's bounds move (which would shift every position in the content file).

In the viewer, every wheel, the pallet fork, the balance and the hairspring are driven from one beat count taken from the visitor's clock, so the train stays in mesh at any time of day and in slow motion. The keyless works turn too: winding the crown in "How it works" turns the stem's winding pinion, the crown wheel and the ratchet wheel (each its own node), rocks the click over the ratchet's teeth and coils the mainspring tighter, and the balance swings wider or narrower with what's left in the spring (but at the same rate). The timing lives in `src/viewer/clockwork.ts`, which the charts read too. The design lives in `scripts/watch/movement.mjs` (`layout` for positions, the `H` table for heights). After changing it, `npm run models:build -- pocket-watch` prints the moving parts' axes in model space, for the content file's `motion` pivots.

## The rangefinder camera's insides

The Poly Haven camera is a Leica M3 as a closed shell: body, top cover and base in one mesh, a lens, and a strap lying in front of it. `scripts/camera/` runs as its build step (`build.augment` in `content/rangefinder-camera.json`). It cuts the shell along planes at the cover's and the base plate's seams (splitting the triangles that cross, so the texture carries on across the cut) into the top cover, the body, the base plate and the back door, and gives each its inside: the shell thickened inward with a rim along every cut edge (`surgery.mjs`). The windows' fake dark boxes become openings, the lens comes apart into the parts that turn and slide when it focuses, and the strap goes (its rings stay on the lugs).

`mechanism.mjs` then builds what's inside, laid out like an M3 (the film 27.8 mm behind the bayonet's face, the rangefinder's windows 68.5 mm apart): the shutter's two cloth curtains on their rollers in front of a 24 × 36 mm gate, the film from its cassette over an eight-tooth sprocket to the take-up spool, the advance gears, the rangefinder (window prism, the moving lens on the roller arm that rides the lens's cam, the frame-line mirror and mask, the beam splitter and finder lenses), and the lens's nine-blade iris. The build fails if any generated part crosses another piece at rest, or if the explode in the content file would pass one piece through another (both checked on the meshes themselves, in 3D). `npm run models:build -- rangefinder-camera` prints the pivots, gear ratios and the rollers' and iris's turning curves for the content file's motions.

In the viewer, the camera's parts don't move with time but with its controls: `src/viewer/filmcamera.ts` turns focusing, the aperture ring, the release and the lever's two strokes into values (lens extension, stop, how far each curtain has run, frames wound on), and `src/viewer/linkage.ts` turns those into the content file's motions: turns and slides, a curtain winding off one roller onto the other (`cloth.ts`, which runs the same sums as the build), and the film's perforations moving along it.

## The medium-format SLR, built in code

There is no free model of a Hasselblad to start from, so the whole camera is generated: `scripts/hasselblad/` runs as its build step (`build.generate` in `content/reflex-camera.json`) and returns a glTF document instead of editing a downloaded one. `layout.mjs` holds the dimensions that matter: the lens's flange 74.9 mm from the film, a 56 mm square picture, a screen as far from the lens (by way of the mirror) as the film is. `body.mjs` builds the cast shell (a box rounded on every edge, its openings cut with the rangefinder's surgery tools and thickened inward), leatherette, the chassis (bayonet plate, mirror box, rear plate), the mirror hinged at its top back edge, the two rear flaps, the winding gears on the right-hand wall (sized so one turn of the knob turns the drive key back 30/35 of a turn, the 309° a release spins it) and the knob. `lens.mjs` builds an 80 mm f/2.8 of the Planar type with a five-blade leaf shutter (sector blades that close light-tight, checked by `uncovered()`) and a five-blade iris, with engraved scales drawn as SVG; `back.mjs` the film magazine (insert, rollers, 120 spools, the film's path as tangents between them, gears from the body, frame counter, dark slide); `finder.mjs` the folded hood. The same clash and explode-path checks as the rangefinder's run on it.

In the viewer, `src/viewer/reflexcamera.ts` runs the release in the order of the factory service manual's timing chart: the lens's shutter shuts and the drive key turns to 117°, the iris stops down, the mirror swings up, the flaps open, the key reaches 268° and the shutter fires; letting go closes the flaps and the key ends at 309°. One turn of the knob lowers the mirror, turns the key back (cocking and opening the lens) and winds on a frame; the dark slide locks the release. The charts in `src/charts/reflex.ts` draw from the same functions.

## The cars, built in code

Both cars are generated by `scripts/cars/` (`build.generate` in the content file, with `build.car` naming a spec in `scripts/cars/specs/`). A spec is a car's dimensions (length, wheelbase, track, wheels and tyres) and its shape, drawn as a few (z, value) curves: for the lower body the sill, the widest point, the beltline's crease, the wings' crowns and the bonnet and deck down the middle; for the canopy its foot, the glass line and the roof. `body.mjs` lofts both through those curves, and `generate.mjs` cuts out the panels that come off (doors, bonnet, boot, bumpers) along the loft's own rows and stations, so every seam is a clean line; cuts the wheel arches and any openings the spec lists (the Roadster's tail, where its fans blow out, and the holes for its yaw nozzles); and picks out the lights, trim and glass (for the family car, glass only in its windows, between painted pillars; for the Roadster, a gold-tinted canopy from the windscreen almost to the tail, set exactly on the lower body's crown, painted at its sails, and carbon below a line along its sills). `fittings.mjs` adds what an older car has bolted on: chrome bumpers, a grille, lamps in bezels, door handles. `interior.mjs` builds the seats, dashboard, screen and steering wheel (and a tunnel down the floor where there's a propshaft). The same clash and explode-path checks as the cameras' run on both.

Under the Roadster's body `platform.mjs` builds an electric car's skateboard: a thick pack of 4680 cells in the floor, a drive unit for each rear wheel with its rotor, half shafts, double wishbones and coil-overs, the steering rack and the orange high-voltage cables. `aero.mjs` builds what makes the 2026 car different, laid out from Tesla's descriptions and its "Electric Fan Car" patent: four ducted fans in the tail fed by a duct from an inlet in the floor between the rear wheels, skirts round the sealed floor, two carbon-wound air tanks (about 600 litres), the compressor that fills them, the valve block and the lines, and ten de Laval nozzles (four at the back, one blowing down at each corner, two in the nose for yaw); the deck behind the glass is the wing, on two struts. Under the family car's, `engine.mjs` builds a two-litre four (block, head, a crankshaft with its counterweights and flywheel, pistons on their rods, an overhead camshaft whose lobes are set round it in the firing order 1-3-4-2, the toothed belt), the clutch, a four-speed gearbox with real tooth counts (the layshaft below the main shaft, a freewheeling gear for each speed), the propshaft, and a live rear axle with its differential (a 10-tooth pinion and a 39-tooth crown wheel, spider gears, half shafts) on leaf springs, with the radiator and fan, the intake, the exhaust, the fuel tank and the battery.

The content files are written by `node scripts/cars/content.mjs <car>` (`content-petrol.mjs` for a car with an engine, `content-roadster.mjs` for one with fans and thrusters) from the text in those scripts and the spec; it runs the build for the moving parts' positions in model space, so a change to a spec takes that and `npm run models:build -- <slug>`. In the viewer, the family car's pistons and rods follow the crank (`crank` motions: a slider-crank, the rod rocking about its pin) and its valves the camshaft (`cam` motions), both in `src/viewer/rig.ts`; its gearbox and differential steps scale the spinning parts with `speeds`, one factor for each part where they differ. `src/charts/car.ts` draws the Roadster's motor end-on: the inverter's three currents lighting its coils in turn, the field they make going round, and the rotor following it.

The Roadster's fans, skirts and wing move by controls (`fan`, `skirts`, `wing`) that `src/viewer/aerocar.ts` sets as it runs: the fans spinning up and down, the suction under the floor, the tanks emptying as the air leaves (the gas left behind cooling as it expands, so the pressure falls faster than the air), a standing start on the rear thrusters, and two flights worked out step by step, the car's computer throttling the four lift nozzles to follow a planned height (a hop, and a barrel roll flown with them shut). The viewer lifts and turns the whole model for a flight, and `src/viewer/jets.ts` draws each nozzle's jet (and, under the lift nozzles, a cloud on the ground) from the content file's `jets`. `src/charts/roadster.ts` draws the pressure above and below the floor, downforce against speed, the air's speed through a nozzle and the lift nozzles' thrust against the car's weight, from the same numbers.

## Adding an object

An object is a `.glb` in `public/models/` plus a JSON file in `content/`. The file's name is the slug in the URL.

1. **Find a model** that's free to use (CC0 or CC BY) and has its moving parts as separate, named nodes, or there's nothing to take apart. [Poly Haven](https://polyhaven.com/models) (all CC0) is the source so far.
2. **Write the content file.** The fields are documented in [`src/types.ts`](src/types.ts); copy an existing file as a start. For a Poly Haven model, set `credit.sourceUrl` to `https://polyhaven.com/a/<asset-id>` and the pipeline does the rest:
   ```sh
   npm run models:fetch -- <slug>    # download, verify checksums, license and authors
   npm run models:build -- <slug>    # compress into public/models/<slug>.glb
   ```
   For other sources, compress the model yourself and put it at the `model` path. A model built in code names its script under `build.generate` (see the SLR's).

   Give each part an `about` line: it's what the card says when someone clicks the part. Every mesh should be in some part (a part's `node` or `with`), or a click on it shows nothing; the dev server's console lists any that aren't. A part can sit inside another part's node (the hand drill's gears inside its frame): each mesh belongs to the nearest part above it.
3. **Place things.** Positions and camera poses are in *model space*: the model centred on x/z, standing on y = 0, scaled so half its bounding-box diagonal is 1. `npm run models:inspect -- <slug>` lists every node's bounds in that space. In the dev server, the browser console has `__viewer.probe(node, fromDirection)` (where a ray from that side hits the part), `__viewer.pick(x, y)` (what's under a canvas point) and `__viewer.currentPose()` (the camera, ready to paste). Callout poses are framed on the middle of the stage; only the starting view is moved off it, by the stage's `--home-x`, `--home-y` and `--home-fill` in `src/styles/main.css`, so take poses for callouts after flying to one.
4. **Write its "How it works"** (`how` in the content file, optional): a few steps, each with a `title`, `text`, the `angle` to see it from, the parts in `focus` (the rest turn to glass), a `flow` path through the parts (model-space points, each riding with a node; `carries: "light"` draws straight amber rays), `tags`, a `chart` (one drawn for the object in `src/charts/`, or a generic `ladder`, `bars` or `timing` chart set up in the content file) and something to `try`. The camera frames the step's parts by itself. For the watch, `npm run models:build -- pocket-watch` also prints the power's paths through the movement in model space.
   Parts that move with a mechanism's controls rather than with time (a lens focusing, a shutter's curtains, a lever's stroke) take `control` motions: turns, slides, curves, cloth and scrolling film (`Motion` in [`src/types.ts`](src/types.ts)). The camera's experiments (`focus`, `aperture`, `shutter`, `advance`) and its charts read `src/viewer/filmcamera.ts`.
5. **Render its posters**: `npm run posters -- <slug>` (starts its own dev server and a headless Chromium; needs a Playwright Chromium, `npx playwright install chromium` if it's missing). It also cuts the object tray's thumbnail from the assembled poster; `npm run posters -- --thumbs` remakes just the thumbnails.

## Models

| Object | Model | Made by | License |
| --- | --- | --- | --- |
| Hand Drill | [Vintage Hand Drill](https://polyhaven.com/a/vintage_hand_drill) | Yann Kervran & Benjamin McDonnell | CC0 1.0 |
| Pocket Watch | [Vintage Pocket Watch](https://polyhaven.com/a/vintage_pocket_watch) (case, dial, hands); movement built for this site | Tal Swicegood | CC0 1.0 |
| Binoculars | [Vintage Binoculars](https://polyhaven.com/a/vintage_binocular) | Luke | CC0 1.0 |
| Microscope | [Vintage Microscope](https://polyhaven.com/a/vintage_microscope) | Luis José Fernández Rodríguez | CC0 1.0 |
| Film Projector | [Filmstrip Projector 8mm](https://polyhaven.com/a/filmstrip_projector_8mm) | PeterM | CC0 1.0 |
| Drill Press | [Drill Press 01](https://polyhaven.com/a/drill_press_01) | Viktor | CC0 1.0 |
| Rangefinder Camera | [Camera 01](https://polyhaven.com/a/Camera_01) (body, lens and dials); shutter, film transport, rangefinder optics and iris built for this site | Rajil Jose Macatangay | CC0 1.0 |
| Medium-Format SLR | built in code for this site (`scripts/hasselblad/`), after the Hasselblad 500C/M | 3D of Things | CC0 1.0 |
| Tesla Roadster | built in code for this site (`scripts/cars/`) from Tesla's October 2026 launch photographs and figures | 3D of Things | CC0 1.0 |
| Family Car | built in code for this site (`scripts/cars/`), a typical rear-wheel-drive saloon of the 1970s and 80s; no particular make | 3D of Things | CC0 1.0 |

All but the SLR and the two cars from [Poly Haven](https://polyhaven.com). Tesla and the Roadster's name are trademarks of Tesla, Inc.; the Roadster here is an illustration made for this site, which has nothing to do with Tesla, and its insides are simplified (Tesla hasn't shown the layout of its tanks, lines and nozzles). The film projector's loose power cord is hidden in the viewer, and the camera's strap is left off. The explanations were written for this site.

## Deploying

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main` (enable Pages with "GitHub Actions" as the source in the repo settings). Any other static host works too: serve `dist/`.
