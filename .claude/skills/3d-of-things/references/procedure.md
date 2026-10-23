# The procedure, stage by stage

Each stage ends with an exit check. Don't start the next stage until it passes; most of the time lost on earlier objects came from finding a problem two stages late.

## 0. Brief (5 min)

- Identify the object exactly: make, model, year, variant. A current product: web-search its latest reveal (extended search for anything recent), and use press photos for proportions. Say which figures are the maker's claims.
- Check variety: list `content/` and make sure the new object differs from the last ones in mechanism and silhouette. A second of a kind is fine; before a third, check in with the user.
- Pick the tier (SKILL.md) and say its budget.
- Post the brief: object, tier and budget, the energy chain in one line, the film's shots (15–25 s, the happy path), what will move, the sources you'll use. Carry on unless the user objects.

**Exit:** the brief is posted, the tier is named, nothing on the site already does the same thing.

## 1. Truth sheet (15 min)

The truth sheet (`objects/<slug>/TRUTH.md`, made by the scaffold) is the plan. Everything later reads from it.

Start a research subagent as soon as the brief is out, and scaffold while it works:

> Research the **{object}** for an educational 3D teardown and fill sections 1–5 and 9 of `objects/{slug}/TRUTH.md` (read it first; edit no other file). Identify it exactly (for a current product, its latest reveal). Give real dimensions and every number its mechanism runs on (teeth, ratios, focal lengths, timings, pressures, speeds), each with its source (service manuals, patents, maker's specifications, museum records), and the energy chain from source to output, naming the parts. Name one common misconception about how it works and the correction. Note what a teardown would have to simplify. For a model, search Poly Haven (`https://api.polyhaven.com/assets?t=models`, then `/info/<id>`) and report candidates with their asset ids, and whether the parts are separate (if unsure, say so). Licences must be CC0 or CC BY and checkable at the source. Find two or three pictures of the real thing on a plain background, the whole object in frame (Wikimedia Commons, patent figures, the maker's drawings), at least one square on to a side or the front, and give each one's file URL, page, author and licence. Return a short summary with any doubts.

Meanwhile, fill sections 6–8 yourself as the research lands: parts in chain order (8–20 parts, 4–8 groups), the mechanism map, the film's shot list (references/film.md).

**Exit:** sections 1–8 are filled, every number has a source, the model's licence is confirmed (or it's built in code), `objects/<slug>/refs.json` lists the reference pictures (references/qa.md, "Against the real thing"), and the shot list says what moves in each shot with the cues that move it, reusing existing ones where possible.

## 2. Scaffold (2 min)

```sh
npm run new -- <slug> --tier C --title "…" --category …                # built in code
npm run new -- <slug> --tier B --polyhaven <asset_id> --category …     # a shell to open
npm run new -- <slug> --tier A --polyhaven <asset_id> --category …     # parts already separate
```

It writes `objects/<slug>/` (TRUTH.md, content.mjs, and augment.mjs or generate.mjs), fetches or generates a model, writes `content/<slug>.json`, and runs the static check. A tier C object starts as a working demo (a crank and two gears) so every field has an example; a tier A or B object starts with one part per mesh, each coming off away from the middle.

**Exit:** the scaffold finished and `npm run qa -- <slug> --model` shows the model.

## 3. Model

The long stage. Build in passes and look after each one (`npm run qa -- <slug> --model`, ~15 s):

1. **Silhouette.** The outside at true size: the shell, its main masses, the openings. Then line it up with the real thing: `npm run qa -- <slug> --ref` (~10 s) sets the model beside each reference picture, from the same view at the same size, and colours where they differ. Fix the biggest difference and run it again, until what's left is noise or a simplification the truth sheet names. Done by eye, against a photo taken from another angle, this step let the Hasselblad's lens stay longer and slimmer than the real one.
2. **Mechanism.** The parts that move, from the truth sheet's numbers, in their real places. Get the motion right before the detail.
3. **Detail.** What makes it read as a real object at a close look: screws, knurls, engraving, seams, labels, the parts that hold the parts.

Rules:

- Tier B: read the shell's meshes, cut them into the parts that come off, thicken the cut pieces (`surgery.solidify`) and remove the fake insides (dark boxes behind windows). Then generate the insides. objects/rangefinder-camera/augment.mjs is the full example.
- Tier C: objects/reflex-camera/ (a camera) and the car builder in scripts/kit/cars/ (a lofted body, a powertrain), run by objects/family-car/ and objects/tesla-roadster/, are the full examples; the scaffold's demo is the smallest.
- Every moving part is its own Part (node), nested under what it rides on (`parent`). Return each pivot, axis and point the content needs in the hints, by name.
- The build fails on clashes and on explode paths that cross. Fix the geometry; add a pair to `CONTACTS` only when the parts truly touch (gears in mesh, a pin in its hole, a part sitting on another). `--no-check` is for a quick look mid-change only.
- Keep the model under ~3 MB and ~100 nodes (`models:build` prints the size).

**Exit:** `npm run models:build -- <slug>` passes with its checks, the `--ref` sheet's differences are fixed or named as simplified, the model reads as the real object at rest and apart, and the hints carry every anchor the content needs.

## 4. Content (15 min)

`objects/<slug>/content.mjs` writes the content file. Write the words from the truth sheet in the order of references/explaining.md, and place everything with anchors. The field guide is references/content.md.

Optionally, while you build the model, a writer subagent can draft the words:

> Read `.claude/skills/3d-of-things/references/explaining.md` and `objects/{slug}/TRUTH.md`, and two existing content files for the voice (`content/pocket-watch.json`, `content/reflex-camera.json`). Draft the words for {object}: hook, three summary paragraphs, 4–6 facts, an `about` for each part in section 6, 6–9 callouts (title and text) and the film's captions in section 8 (one line each, references/film.md). Return them as JSON in your final message; don't edit any file.

**Exit:** `npm run check -- <slug>` passes with no TODO left.

## 5. Mechanism (only for a new kind)

Reuse first; references/mechanisms.md lists what exists. A new kind means a viewer module, its controls and a cue for the film. Wire it where that reference says, and keep its maths free of three.js.

**Exit:** `npm run typecheck` passes and the film moves it in `npm run qa -- <slug> --only tour`.

## 6. Check (10 min)

```sh
npm run check -- <slug>
npm run qa -- <slug>
```

Read every contact sheet the runner prints, against the review list in references/qa.md. Fix and re-run until it passes. Start the regression in the background as soon as your object passes:

```sh
npm run qa -- --all --quick
npm run reproduce              # every content file rebuilt from its builder; -- --models after a kit change
```

**Exit:** 0 failed for the object and for the regression, `reproduce` identical, every warning explained, the sheets reviewed.

## 7. Ship (5 min)

- `npm run posters -- <slug>`.
- `npm run truth -- <slug>` writes the truth sheet's parts table (section 6) and film table (section 8) from what was built, keeping any notes around them; then fill section 7 (the mechanism map) and the log in section 10.
- README: add the object to the list at the top and to the models table (title, source link, author, licence). On `skill.html`, add it to the objects list and update the counts.
- `npm run build` (type-check and production build).
- Memory: a note for anything non-obvious this object taught (a model quirk, a user preference).
- Tell the user what the page shows, what moves, what's simplified and which figures are claims. Offer to commit; commit only when asked.
- To put it live, when the user wants that: the site lives inside afrodance.fun at `/3d-of-everything` (README, Deploying). In a worktree of that repo off its `main` (other work is often in progress there), `npm run export -- --out <worktree>/public/3d-of-everything`, then `npx next build && npx next start -p 3017` there and `npm run qa -- --all --deployed --url http://localhost:3017/3d-of-everything/objects`. Commit and push in that repo only when asked: its `main` deploys to Vercel.

## Changing an existing object

Every object has the same layout, whenever it was built:

| In `objects/<slug>/` | What it is |
|---|---|
| `TRUTH.md` | The truth sheet. The ten objects built before this procedure got theirs on 18 October 2026, reconstructed from the shipped page and its code (no new research), so they're thinner than a researched one. |
| `content.mjs` | Writes `content/<slug>.json`: edit this, never the JSON. |
| `generate.mjs` or `augment.mjs`, and the object's own modules | The model's build step (`build.generate` or `build.augment`). A Poly Haven model with its parts already separate has none. |
| `hints.json` | Where the build put things, written by `npm run models:build -- <slug>` for the content builder. |

Code shared by more than one object is in the kit, `scripts/kit/`. The two cars run the car builder in `scripts/kit/cars/` on their own `spec.mjs`, and their content builders run the build (without the checks) for its hints. Three things to know about the older objects:

- The content builders of the five Poly Haven objects were converted key for key from their hand-written JSON, so their positions and cameras are still typed in model space. A change that moves a part means placing what's on it again, from `hints.json` or the model (`placer(nodeBounds)`), as the newer builders do. The pocket watch's, the Leica's and the SLR's are the builders their pages were made with: motions and tours come from the hints, and the points are given in the movement's or the camera's millimetres. What each still types in model space is listed in its header (the Leica's callouts, the watch's crown and bow callouts and tour tags).
- `objects/tesla-roadster/2017/` is the 2017 Roadster the page showed before the 2026 car, kept as the car builder's example of a plain electric car. Running its `content.mjs` writes over the live page.
- The copies of the watch's, the Leica's and the SLR's builders left under `.cache/watch/`, `.cache/camera/` and `.cache/hasselblad/` (outside git) are older than the ones in `objects/` and write the old paths: don't run them.

For any change: edit, `npm run models:build -- <slug>` if the model changed (and `npm run qa -- <slug> --ref` if its outside did), `node objects/<slug>/content.mjs`, `npm run check -- <slug>`, `npm run qa -- <slug>`, then `npm run qa -- --all --quick` and `npm run reproduce` (with `-- --models` after a change to the kit, which every model built in code shares).

## How long it takes

Active time per object, from the session logs (`npm run timing`), before this procedure:

| Object | Tier | Active time | Hand-made browser QA | Re-reading code |
|---|---|---|---|---|
| Six Poly Haven objects, the first site | A, no tours yet | 1 h 16 for all six | 23% | 6% |
| Pocket watch movement | B | 1 h 47 | 27% | 13% |
| Leica M3 | B | 2 h 07 | 37% | 9% |
| Hasselblad-type SLR | C | 1 h 59 | 33% | 9% |
| 2026 Roadster (rebuilt from the 2017 car) | D | 57 min + 39 min | 24–32% | 8–23% |

With this procedure (18 Oct 2026; three objects built in one session, 70 minutes from the request to the last poster, research in subagents alongside):

| Object | Tier | Active time, to its posters | Check stage |
|---|---|---|---|
| Washing machine | C | 24 min | 38% |
| Bicycle pump | B | 15 min | 38% |
| Garden sprinkler | A | 15 min | 46% |

Checking is still the biggest stage, but now it's reading contact sheets and fixing what they show (callout cameras, flow points on moving parts, a crank bug in the viewer) rather than writing browser scripts. `--item` counts every call that names the object, so a call that loops over several objects counts for each: measure an object when it ships.

Two thirds of the browser-QA time was the browser itself: every script launched software WebGL at about 460 ms a frame and slept 2.5–4.5 s per view. The rest was writing a new script for every object. That's what the GPU runner removes (one object's full check runs in about a minute), and the references remove most of the re-reading. Measure each new object with `npm run timing -- <session.jsonl> --item <slug>=<pattern>` and add it here.
