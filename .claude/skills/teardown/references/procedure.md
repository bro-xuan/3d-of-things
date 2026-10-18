# The procedure, stage by stage

Each stage ends with an exit check. Don't start the next stage until it passes; most of the time lost on earlier objects came from finding a problem two stages late.

## 0. Brief (5 min)

- Identify the object exactly: make, model, year, variant. A current product: web-search its latest reveal (extended search for anything recent), and use press photos for proportions. Say which figures are the maker's claims.
- Check variety: list `content/` and make sure the new object differs from the last ones in mechanism and silhouette. A second of a kind is fine; before a third, check in with the user.
- Pick the tier (SKILL.md) and say its budget.
- Post the brief: object, tier and budget, the energy chain in one line, the tour's 5–7 step labels, what will move, what you'll try, the sources you'll use. Carry on unless the user objects.

**Exit:** the brief is posted, the tier is named, nothing on the site already does the same thing.

## 1. Truth sheet (15 min)

The truth sheet (`objects/<slug>/TRUTH.md`, made by the scaffold) is the plan. Everything later reads from it.

Start a research subagent as soon as the brief is out, and scaffold while it works:

> Research the **{object}** for an educational 3D teardown and fill sections 1–5 and 9 of `objects/{slug}/TRUTH.md` (read it first; edit no other file). Identify it exactly (for a current product, its latest reveal). Give real dimensions and every number its mechanism runs on (teeth, ratios, focal lengths, timings, pressures, speeds), each with its source (service manuals, patents, maker's specifications, museum records), and the energy chain from source to output, naming the parts. Name one common misconception about how it works and the correction. Note what a teardown would have to simplify. For a model, search Poly Haven (`https://api.polyhaven.com/assets?t=models`, then `/info/<id>`) and report candidates with their asset ids, and whether the parts are separate (if unsure, say so). Licences must be CC0 or CC BY and checkable at the source. Return a short summary with any doubts.

Meanwhile, fill sections 6–8 yourself as the research lands: parts in chain order (8–20 parts, 4–8 groups), the mechanism map, the tour outline.

**Exit:** sections 1–8 are filled, every number has a source, the model's licence is confirmed (or it's built in code), and the tour outline names its charts and experiments, reusing existing kinds where possible.

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

1. **Silhouette.** The outside at true size: the shell, its main masses, the openings. Compare it with photos.
2. **Mechanism.** The parts that move, from the truth sheet's numbers, in their real places. Get the motion right before the detail.
3. **Detail.** What makes it read as a real object at a close look: screws, knurls, engraving, seams, labels, the parts that hold the parts.

Rules:

- Tier B: read the shell's meshes, cut them into the parts that come off, thicken the cut pieces (`surgery.solidify`) and remove the fake insides (dark boxes behind windows). Then generate the insides. scripts/camera/augment.mjs is the full example.
- Tier C: scripts/hasselblad/ (a camera) and scripts/cars/ (a lofted body, a powertrain) are the full examples; the scaffold's demo is the smallest.
- Every moving part is its own Part (node), nested under what it rides on (`parent`). Return each pivot, axis and point the content needs in the hints, by name.
- The build fails on clashes and on explode paths that cross. Fix the geometry; add a pair to `CONTACTS` only when the parts truly touch (gears in mesh, a pin in its hole, a part sitting on another). `--no-check` is for a quick look mid-change only.
- Keep the model under ~3 MB and ~100 nodes (`models:build` prints the size).

**Exit:** `npm run models:build -- <slug>` passes with its checks, the model reads as the real object at rest and apart, and the hints carry every anchor the content needs.

## 4. Content (15 min)

`objects/<slug>/content.mjs` writes the content file. Write the words from the truth sheet in the order of references/explaining.md, and place everything with anchors. The field guide is references/content.md.

Optionally, while you build the model, a writer subagent can draft the words:

> Read `.claude/skills/teardown/references/explaining.md` and `objects/{slug}/TRUTH.md`, and two existing content files for the voice (`content/pocket-watch.json`, `content/reflex-camera.json`). Draft the words for {object}: hook, three summary paragraphs, 4–6 facts, an `about` for each part in section 6, 6–9 callouts (title and text) and the tour steps in section 8 (label, title, two short paragraphs each). Return them as JSON in your final message; don't edit any file.

**Exit:** `npm run check -- <slug>` passes with no TODO left.

## 5. Mechanism (only for a new kind)

Reuse first; references/mechanisms.md lists what exists. A new kind means a viewer module, its controls, maybe experiments and charts. Wire it where that reference says, and keep its maths free of three.js so the charts can import it.

**Exit:** `npm run typecheck` passes and the object's experiments respond in `npm run qa -- <slug> --only tour,try`.

## 6. Check (10 min)

```sh
npm run check -- <slug>
npm run qa -- <slug>
```

Read every contact sheet the runner prints, against the review list in references/qa.md. Fix and re-run until it passes. Start the regression in the background as soon as your object passes:

```sh
npm run qa -- --all --quick
```

**Exit:** 0 failed for the object and for the regression, every warning explained, the sheets reviewed.

## 7. Ship (5 min)

- `npm run posters -- <slug>`.
- `npm run truth -- <slug>` writes the truth sheet's parts table (section 6) and tour table (section 8) from what was built, keeping any notes around them; then fill section 7 (the mechanism map) and the log in section 10.
- README: add the object to the list at the top and to the models table (title, source link, author, licence). On `teardown.html`, add it to the objects list and update the counts.
- `npm run build` (type-check and production build).
- Memory: a note for anything non-obvious this object taught (a model quirk, a user preference).
- Tell the user what the page shows, what moves, what's simplified and which figures are claims. Offer to commit; commit only when asked.

## Changing an existing object

The objects built before this procedure keep their own layout:

| Object | Model built by | Content written by |
|---|---|---|
| hand-drill, drill-press, film-projector, microscope, binoculars | Poly Haven, no build step | `content/<slug>.json`, by hand |
| pocket-watch | `scripts/watch/` (augment) | `.cache/watch/content.mjs`, outside git and stale: re-running it drops the keyless-winding motions, so edit the JSON |
| rangefinder-camera | `scripts/camera/` (augment) | `.cache/camera/content.mjs` with `.cache/camera/hints.json`, outside git |
| reflex-camera | `scripts/hasselblad/` (generate) | `.cache/hasselblad/content.mjs` with its `hints.json`, outside git |
| family-car, tesla-roadster | `scripts/cars/` (generate, a spec in `specs/`) | `node scripts/cars/content.mjs <car>`. Always name the car: with no argument it writes the 2017 Roadster over the live one |

For any change: edit, `npm run models:build -- <slug>` if the model changed, rewrite the content, `npm run check -- <slug>`, `npm run qa -- <slug>`, then `npm run qa -- --all --quick`.

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
