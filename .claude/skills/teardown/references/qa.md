# Checking an object

Two checkers, both driven by the content file, so a new object is checked with no new code.

## `npm run check` (static, under a second)

`scripts/check-content.mjs` loads each content file and its built model:

- every node a content file names exists (parts, `with`, focus, frame, hide, tags, flows, counts, spins, motions, cranks, cams, jets, `hide`);
- every mesh belongs to a part;
- every point (callouts, tags, flows, pivots, jets) sits on the model; a point a whole unit off is an error (millimetres pasted where model units belong), a little off a warning;
- every `chart` and `try` exists in the code (`npm run check -- --list` prints them);
- the credit is complete, `order` is unique, the category exists, the build script exists;
- warnings for parts with no `about`, no facts, no callouts, no tour, missing posters and TODO text.

It exits 1 on any error.

## `npm run qa` (browser, about a minute)

`scripts/qa/run.mjs` starts its own Vite server (or uses `--url`) and headless Chromium on the GPU, opens the object page and waits for real conditions: the model in, the opening move done (`__viewer.tweens` empty), the drawings drawn.

| Section | What it does | Fails when |
|---|---|---|
| load | Opens the page | an error, a failed request, or a dev warning that the content and model disagree ("no node named", "in no part", "no chart called") |
| rest | At rest, wireframe, apart at 50% and 100%, the drawings | errors while apart |
| views (`--model`) | From the front, side and top, and apart at 25/50/75/100% | as rest |
| callouts | Opens each callout from the sheet | its card runs off the window, it doesn't open to its `explode`, errors |
| tour | Opens How it works and every step | the title isn't shown, a tag is missing (unknown node), a chart doesn't draw, a `try` has no controls or its box covers the step bar, Esc doesn't close it; warns on tags past the stage and chart text past the column |
| try | Drives each experiment: holds each hold button, moves each slider to both ends, clicks each choice and button | the readout never changes |
| run | Presses the run button | a spinning part doesn't turn |
| phone | 390 × 844 at 2×, a touch device: rest and the first step | the page scrolls sideways, errors |
| motion | Reduced motion, taken apart | errors |

```sh
npm run qa -- <slug>                    # everything
npm run qa -- <slug> --model            # the model only, for the geometry loop (~15 s)
npm run qa -- <slug> --only tour,try    # some sections
npm run qa -- --all --quick             # load, rest and tour for every object (~80 s, 3 at a time)
npm run qa -- <slug> --software         # SwiftShader, to compare
```

Output goes to `.cache/qa/<slug>/`: numbered contact sheets (`<slug>-1-rest.png`, `-2-callouts.png`, `-3-tour.png`, one per experiment, `-N-phone.png`), every single shot in `shots/`, and `report.json` (every check, the console, the renderer, timings). The exit code is 1 if anything failed.

## Reading the sheets

Read every sheet the run prints. Failed tiles are framed in red, but most of what a person would object to isn't a failing check, so look at each tile for these:

- **At rest:** the whole object, centred, not on the sheet's text; recognisable at a glance; materials right (no black or missing textures, no z-fighting); nothing floating.
- **Wireframe:** hidden lines faint; no stray long triangles from the build.
- **Apart:** every part clear of the others and on the stage; outer parts first; the order reads as the energy chain.
- **Callouts:** the camera frames the part; the card sits beside it without covering it; the marker is on the surface.
- **Tour:** the focused parts solid and the rest glass; the flow line runs through the right parts and fades before the panel; tags on their parts and readable; the chart readable beside the model; the try box clear of everything.
- **Experiments:** the frames show the mechanism moving the right way and in the right order; the readout's numbers are plausible.
- **Phone:** the sheet below the stage; nothing cut off; the tour readable.

Zoom into a single shot from `shots/` only where a sheet raises a question.

## The browser

`scripts/qa/browser.mjs` launches Playwright's Chromium with `--use-angle=metal --enable-gpu --ignore-gpu-blocklist` and checks the renderer string. On this Mac it gets "ANGLE Metal Renderer: Apple M3" at 18–23 ms a frame (1440 × 900 at 2×), against ~460 ms with SwiftShader, with the same picture. Without a GPU it falls back to SwiftShader and says so (`QA_GPU=0` forces it). `npm run posters` uses the same launch.

gstack's `/browse` can't create WebGL contexts here (its Chromium is sandboxed); use the runner.

## Animations, step by step

Real time is fine on the GPU. To judge an animation frame by frame, or to make an experiment deterministic, use Playwright's fake clock: `context.clock.install()` before the page opens, `page.clock.pauseAt(…)` once it has loaded and drawn (loading isn't on the fake clock, and the drawings wait for idle time), then `page.clock.runFor(110)` before each shot. The dev build exposes `window.__viewer` (`setExplode`, `animateExplode`, `showStep`, `lookFrom`, `mechanismState`, `cameraState`, `aeroState`, `angleOf`, `probe`, `pick`, `currentPose`).

## Adding a check

When an object needs a check the runner doesn't have, add it to `scripts/qa/run.mjs` (or to `scripts/check-content.mjs` if it doesn't need a browser), so every object gets it from then on. Never write a one-off script for one object: that habit cost about a third of every build before this procedure.

## Gotchas

- `page.mouse.down` on a button scrolled off screen does nothing; the runner scrolls hold buttons into view first.
- Don't select by attributes the viewer also sets on its own elements.
- The stage is `overflow: clip`; with `overflow: hidden` a click on a control inside it scrolled the whole stage sideways.
- `FilmCamera.tick` re-pushes every control each frame: to hold a pose set through `__viewer.linkage`, replace `__viewer.filmCamera.tick` with `() => false` first.
- Port 5173 is usually the dev server you're running; the runner starts its own on the next free port from 5399.
