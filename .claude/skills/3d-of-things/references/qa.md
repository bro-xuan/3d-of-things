# Checking an object

Two checkers, both driven by the content file, so a new object is checked with no new code.

## `npm run check` (static, under a second)

`scripts/check-content.mjs` loads each content file and its built model:

- every node a content file names exists (parts, `with`, focus, frame, hide, tags, flows, counts, spins, motions, cranks, cams, jets, `hide`);
- every mesh belongs to a part;
- every point (callouts, tags, flows, pivots, jets) sits on the model; a point a whole unit off is an error (millimetres pasted where model units belong), a little off a warning;
- every film cue (and any `chart`) exists in the code (`npm run check -- --list` prints them); captions, shots and films within their lengths;
- the credit is complete, `order` is unique, the category exists, the build script exists;
- warnings for parts with no `about`, no facts, no callouts, no film, missing posters and TODO text.

It exits 1 on any error.

## `npm run qa` (browser, about a minute)

`scripts/qa/run.mjs` starts its own Vite server (or uses `--url`) and headless Chromium on the GPU, opens the object page and waits for real conditions: the model in, the opening move done (`__viewer.tweens` empty), the drawings drawn. A built or deployed copy has no `__viewer`: there the stage's `data-state="ready"` and `data-moving` (set while a camera move or animation runs) stand in for it.

| Section | What it does | Fails when |
|---|---|---|
| load | Opens the page | an error, a failed request, or a dev warning that the content and model disagree ("no node named", "in no part", "no chart called") |
| rest | At rest, wireframe, apart at 50% and 100%, the drawings | errors while apart |
| views (`--model`) | From the front, side and top, and apart at 25/50/75/100% | as rest |
| callouts | Opens each callout from the sheet | its card runs off the window, it doesn't open to its `explode`, errors |
| tour | Opens How it works: the film plays on its own; each shot is held near its end and checked; then a strip of frames at even steps through the whole film; played to the end, it stops | it doesn't play, a caption isn't shown or runs off the window, a tag is missing (unknown node), it doesn't stop at the end, Esc doesn't close it; warns on captions over 110 characters, tags past the stage and a film outside 12–30 s |
| run | Presses the run button | a spinning part doesn't turn |
| phone | 390 × 844 at 2×, a touch device: rest and the film's opening | the page scrolls sideways, errors |
| motion | Reduced motion, taken apart | errors |
| ref (`--ref`) | Sets the model beside each picture in `refs.json`, from the same view at the same size ("Against the real thing", below) | a picture can't be read or its object can't be told from its background; warns under 85% overlap or past 5% in proportions |

```sh
npm run qa -- <slug>                    # everything
npm run qa -- <slug> --model            # the model only, for the geometry loop (~15 s)
npm run qa -- <slug> --only tour        # some sections (tour is the film)
npm run qa -- <slug> --ref              # the model beside photographs of the real thing, from the same view (~10 s)
npm run qa -- --all --quick             # load, rest and the film for every object (~100 s, 3 at a time)
npm run qa -- --skill                   # the skill's page: its live watch winds, slows, comes apart; the wheel scrolls (~15 s)
npm run qa -- <slug> --software         # SwiftShader, to compare
npm run qa -- --all --deployed --url http://localhost:3017/3d-of-everything/objects
                                        # a built copy, served (or the live site): load, rest and the film
```

`--deployed` is for the copy baked into afrodance.fun (`npm run export`, README › Deploying): serve that site's production build (`npx next build && npx next start -p 3017` in its checkout) and point `--url` at the gallery. It checks what the dev server can't: the URLs under the mount, the production bundle, the host's rewrites. Without the dev hooks it skips taking apart, callouts and run, and checks the film by jumping to each shot from its script.

Output goes to `.cache/qa/<slug>/`: numbered contact sheets (`<slug>-1-rest.png`, `-2-callouts.png`, `-3-film.png`, `-N-phone.png`), every single shot in `shots/`, and `report.json` (every check, the console, the renderer, timings). The exit code is 1 if anything failed.

## Reading the sheets

Read every sheet the run prints. Failed tiles are framed in red, but most of what a person would object to isn't a failing check, so look at each tile for these:

- **At rest:** the whole object, centred, not on the sheet's text; recognisable at a glance; materials right (no black or missing textures, no z-fighting); nothing floating.
- **Wireframe:** hidden lines faint; no stray long triangles from the build.
- **Apart:** every part clear of the others and on the stage; outer parts first; the order reads as the energy chain.
- **Callouts:** the camera frames the part; the card sits beside it without covering it; the marker is on the surface.
- **Film:** read the strip as a film (references/film.md, "Making one"): the camera glides, each frame a small even move from the last, never a jump or a lurch in and out; every frame shows the action its caption names, whole and clear of the caption and bar; the insides show through the glass; nothing flicks between solid and glass; tags and lines on their parts. Then watch it once at normal speed in the browser for the pace.
- **Phone:** the sheet below the stage; nothing cut off; the caption and bar readable.

Zoom into a single shot from `shots/` only where a sheet raises a question.

## Against the real thing (`--ref`)

Every other check asks whether the model agrees with itself. This one asks whether it looks like the object it explains. It follows Wes Bos's scan-to-threejs (github.com/wesbos/3d-model-anything), which renders a scanned room from the pose of every photo taken during the scan and sets each photo beside its render. Our photos come from anywhere, so each one's view is given or found instead of recorded.

`objects/<slug>/refs.json` lists two or three pictures of the real thing (objects/reflex-camera/refs.json is the example; scripts/qa/refs.mjs documents every field):

```json
{ "refs": [{ "id": "left-side", "url": "https://upload.wikimedia.org/…", "source": "https://commons.wikimedia.org/wiki/File:…",
             "credit": "Kenny Louie, CC BY 2.0", "view": "right", "ignore": [[1380, 150, 2050, 800]], "note": "…" }] }
```

- **Pictures:** a plain background, the whole object in frame and nothing in front of it. Good sources are Wikimedia Commons, patent figures and the maker's dimensioned drawings. They are downloaded into `.cache/refs/<slug>/` and never committed, because a reference is only looked at, not shipped. Note the licence in `credit` anyway.
- **View:** read it off the picture, then pin it.
  - A picture square on to a face (no other face shows, as in a maker's drawing or a side view taken from far off): `"front"`, `"back"`, `"left"`, `"right"` or `"top"`. Right is the side seen from +x, as in the drawings' side view, so a camera's own left side is the model's `"right"`. When the opposite face fits better, the run says so.
  - Any other angle: `{ "azimuth", "elevation", "fov" }` in degrees, as `viewAngle`.
  - Can't tell: `"find"` searches for the camera whose view of the model gives the outline most like the picture's, in about 5 s. It prints the best pose and draws every near tie on the sheet. Pick the right one by eye (which faces show, and how much) and pin it. Narrow the search with `{ "find": { "azimuth": [min, max], "elevation": [min, max] } }` if needed.
  - Don't trust the search alone. An outline fits from more than one side, and a model with the wrong shape pulls the search towards a view that hides the error: the Hasselblad's too-long lens drew it to a low, wide-angle view from behind.
- **What the model doesn't show:** `ignore` rectangles (in the picture's pixels) leave out a hand, a strap, an accessory, or a hood that's up in the photo and folded on the model. `crop` cuts off a table's reflection. Raise `tolerance` when the background has stripes or a strong gradient.

The sheet (`<slug>-N-ref.png`) has four tiles per picture: the photo; the model from the same view at the same size; the photo with the model's outline in red; and the difference. In the difference, blue is what the real thing has and the model doesn't, red is what the model has and the real thing doesn't, and the ignored areas are hatched. The model is scaled to the photo's outline by area (`fit` can make it width or height) and moved to the best overlap. So the tiles show shape, not size; size comes from the truth sheet's numbers.

Two numbers help, and the run warns below 85% overlap or past 5% in proportions. Neither is a pass mark: the outline of a photo taken close up has perspective, and a backdrop's shadow can join the object's. Read the difference tile:

- **A band of one colour along a whole side:** a proportion is off (too long, too low).
- **Blue round a part:** it's too small or missing. **Red:** it's too big or shouldn't be there.
- **Speckle along the edges:** nothing to fix.

Fix the biggest difference, rebuild and run it again. Stop when what's left is either noise or a simplification the truth sheet names.

## The browser

`scripts/qa/browser.mjs` launches Playwright's Chromium with `--use-angle=metal --enable-gpu --ignore-gpu-blocklist` and checks the renderer string. On this Mac it gets "ANGLE Metal Renderer: Apple M3" at 18–23 ms a frame (1440 × 900 at 2×), against ~460 ms with SwiftShader, with the same picture. Without a GPU it falls back to SwiftShader and says so; `--software` or `QA_GPU=0` forces it (with `--disable-gpu`, or Chromium on a Mac keeps Metal). The quick pass runs on SwiftShader too, so a machine without a GPU can do every check, only slower. `npm run posters` uses the same launch.

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
