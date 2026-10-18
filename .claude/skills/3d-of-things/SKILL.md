---
name: 3d-of-things
description: Add a real machine to 3D of Things the standard way, as a 3D model that comes apart into named parts with real insides, callouts, scale drawings and a step-by-step "How it works" tour with live charts and experiments. Use it whenever someone asks to add, build, model, open up, take apart or explain an object, machine, instrument, camera, watch, engine or vehicle in 3D, even if they only name the thing ("do a Leica M6", "add a sewing machine"), in this repository or in any other folder (it sets up a 3D of Things workspace first). Also use it to change or check an existing object page ("the SLR's tour is broken", "does everything still work?") or to put the machines on another site. Covers sourcing a CC0 model or generating one in code, the content file, mechanisms, the tour, the automated checks and shipping.
compatibility: Written for Claude Code. Works in a 3D of Things workspace (a checkout of bro-xuan/3d-of-things) and sets one up when run anywhere else. Needs git, Node 22+, and a Playwright Chromium for the browser checks (it uses the Mac's GPU when there is one).
---

# 3D of Things

3D of Things explains how machines work by taking real ones apart in 3D. This skill is the standard procedure for one object, from a name ("a Hasselblad 500C/M") to a shipped page: model, parts, callouts, drawings, a tour that follows the energy through the mechanism, and checks that prove it all works.

## The one idea

**Real insides, really moving.** The object explains itself when its insides are true and they work: real tooth counts, real focal lengths, real timing, driven by the same numbers the charts show. A shell with labels is a catalogue, not an explanation. When a model has no insides, generate them in code from the truth sheet; never invent them, and never let an AI segmenter guess them.

## Where to work

Everything below runs in a 3D of Things workspace: a checkout of `bro-xuan/3d-of-things`. Its code is this skill's kit (the viewer, the model pipeline, the generator kit, the checks) and its objects are the references the procedure reuses.

- **In a workspace** (this folder or a parent has a `package.json` named `3d-of-things`): work there. If the workspace's own `.claude/skills/3d-of-things/SKILL.md` differs from this copy, follow the workspace's; it matches the code beside it.
- **Anywhere else**, set one up before the brief. Ask where if it isn't obvious; by default it goes in `./3d-of-things`:
  ```sh
  git clone --depth 1 https://github.com/bro-xuan/3d-of-things.git 3d-of-things
  cd 3d-of-things && npm install
  npx playwright install chromium   # for the checks, if it's missing
  npm run check                     # every object: 0 errors, 0 warnings
  ```
  Keep the objects it comes with. If the clone fails, say why and stop; don't look for another copy.
- **On the user's own site:** `npm run export -- --out <their site>/public/<path>` builds the site for that path, checks it, copies it in as static files and prints the rewrites the host needs (README, "Deploying"). Run it again after every change; never edit the exported files.

## Size it first

Name the tier in your first message, with its budget. These are active times for the whole procedure. Measured with it on 18 October 2026: garden sprinkler (A) 15 min, bicycle pump (B) 15 min, washing machine (C) 24 min. A dense mechanism (a watch movement, a camera's shutter) sits at the top of its range; none has been timed with the procedure yet, so measure the next one (`npm run timing`, "How long it takes" in references/procedure.md).

| Tier | What | Examples | Budget |
|---|---|---|---|
| **A · Sourced** | A CC0 model with its parts as separate, named nodes. Content and tour only. | garden sprinkler, hand drill, microscope | 15–30 min |
| **B · Opened** | A CC0 shell, cut open in code, with the insides generated. | bicycle pump, pocket watch, Leica M3 | 15–60 min |
| **C · Built** | No usable model: the whole object generated in code. | washing machine, Hasselblad SLR, family car | 25–60 min |
| **D · Machine** | Several systems with their own physics (a vehicle that flies, a plant). | 2026 Roadster | 2 h+ |

- Tier D: don't start it. Propose a C version that keeps the core idea, list what D would add, and build D only if the user chooses it.
- A model that is one mesh is never tier A, whatever its source: there is nothing to take apart. Open it (B).
- Have the page open in the browser within the first ten minutes (`npm run new` does this), then deepen it.
- Run `date` at the start of each stage and log it in the truth sheet. When a stage runs past twice its budget, tell the user where it stands and what is left.

## The procedure

Work in this order. Write the truth sheet before any geometry: most of the quality is decided there.

0. **Brief (5 min).** Pin down exactly what: make, model, year, variant. For a current or recent product, web-search its latest reveal first; training data may predate it. Check that it differs in mechanism and silhouette from the objects already on the site (`ls content/`). Post a short brief (object, tier and budget, the energy chain in one line, the tour's 5–7 steps, what moves, sources) and carry on unless the user objects.
1. **Truth sheet (15 min).** `objects/<slug>/TRUTH.md`: sources, real numbers, the energy chain, the one misconception, parts grouped in chain order, the mechanism map, the tour outline and what's simplified. Hand the research to a subagent while you scaffold (references/procedure.md has the prompt). For a model, search Poly Haven first (`https://api.polyhaven.com/assets?t=models`, by tag); CC0 or CC BY only, licence checked at the source.
2. **Scaffold (2 min).** `npm run new -- <slug> --tier A|B|C [--polyhaven <id>] [--title …] [--category …]`. It writes the object's folder from templates, fetches or generates a first model, writes the content file and checks it. The page now works.
3. **Model (the long one).** Tier A: group and name the parts the scaffold listed. Tier B: `objects/<slug>/augment.mjs` cuts the shell (`surgery`) and adds the insides. Tier C: `objects/<slug>/generate.mjs` builds everything with the kit (`scripts/kit/`). Return every pivot, axis and point the content needs as named `pivots` and `anchors` in the hints. Inner loop:
   `npm run models:build -- <slug> && node objects/<slug>/content.mjs && npm run check -- <slug>`, then `npm run qa -- <slug> --model` to see it (views and explode, ~15 s). The build fails on any clash between parts and on any explode path that passes one part through another; fix the geometry, and list only true contacts (gears in mesh, a pin in its hole) in `CONTACTS`.
4. **Content (15 min, can run alongside 3).** `objects/<slug>/content.mjs` writes `content/<slug>.json`: hook, summary, facts, parts with `about`, callouts, motions, the tour. Positions come from the hints' anchors (or `placer(nodeBounds)` for a downloaded model), never typed. Follow references/explaining.md for order and voice and references/content.md for every field.
5. **Mechanism (only for a new kind).** Reuse what exists first: time-driven spins and clock trains, crank and cam motions, `control` motions (turn, slide, curve, cloth, scroll), the generic charts (`ladder`, `bars`, `timing`) and experiments (`run`, `speeds`). A genuinely new mechanism gets a three-free module in `src/viewer/` that the charts read too; references/mechanisms.md lists every place it has to be wired.
6. **Check (10 min).** `npm run check -- <slug>` (static, 1 s), then `npm run qa -- <slug>` (browser, about a minute): every callout, tour step and experiment, the phone layout and reduced motion. Read the contact sheets it prints; open a single shot only to look closer. Fix, re-run, until it passes with no warnings you can't explain. Then `npm run qa -- --all --quick` in the background for the other objects.
7. **Ship (5 min).** `npm run posters -- <slug>`, `npm run truth -- <slug>` (the sheet's parts and tour tables, from what was built), add the object to the README's models table and its list, `npm run build`, update the memory notes, and tell the user what's on the page and what's simplified. Commit only when the user asks. To put it live, `npm run export` bakes the site into afrodance.fun (references/procedure.md).

## What makes it fast

The procedure is fast because nothing is done twice and the machine does the looking. Measured on earlier objects, a third of each build went on hand-written browser scripts waiting for software rendering, and a sixth on re-reading the codebase.

- **Never write a one-off QA script.** If the runner lacks a check, add it to `scripts/qa/run.mjs` so every object gets it.
- **The browser runs on the GPU** (`scripts/qa/browser.mjs`, 20–25× SwiftShader's speed). Wait on conditions (`__viewer.tweens` empty, or `[data-moving]` gone on a built copy, selectors), never on fixed sleeps.
- **Static before browser:** `npm run check` catches unknown nodes, meshes in no part, off-model points, unknown charts and experiments and unfinished text in a second.
- **Read contact sheets, not screenshots:** the runner tiles every view into a few labelled sheets and frames failures in red.
- **No pasted numbers:** the generator names its points; the content builder uses the names. A changed layout moves everything with it.
- **The kit, not copies:** `scripts/kit/` has every building block the earlier generators grew (gears, shafts, rounded boxes, tubes, lofts, surgery, materials, assembly, checks). Import from it; add a block there when a new object needs one.
- **Parallel tracks:** research in a subagent during the scaffold; the regression pass in the background during review.
- **Keep the context lean:** pipe builds through `tail`, keep logs to summaries, and read the references when a stage needs them, not up front.

## Craft rules (short form)

- **True insides.** Parts are built from real numbers (teeth, focal lengths, timings, pressures), cited in the truth sheet. Simplify openly and say so on the page (`credit.extra` or the text).
- **Every number on screen comes from the model.** Charts and readouts read the same maths that moves the parts (a module in `src/viewer/` with no three.js in it).
- **Follow the energy.** Groups, callouts, explode order and tour steps all run source → transmission → control → output. One misconception per object, stated and corrected.
- **Parts, not meshes.** Every mesh belongs to a named part with an `about`; 8–20 parts in 4–8 groups. Parts come off outer first, in stages, along paths that clear everything.
- **The model is solid and whole.** Never faded, masked or clipped at the page's edges; framed whole at rest; cards beside the parts they explain.
- **Let people control time.** Slow motion, hold-to-run, sliders. Nothing important happens only in a fast loop.
- **Licences.** CC0 or CC BY, verifiable at the source; credit exact. Trademarks are named as illustrations ("has nothing to do with Tesla").
- **Variety.** Each new object differs from the last in mechanism and silhouette; check in after the second of a kind.
- **Voice.** Plain, physical, exact, British spelling; the number that makes it real. No marketing words.

## Commands

| Command | What it does | Time |
|---|---|---|
| `npm run new -- <slug> --tier …` | Scaffold an object and build its first page | 2–10 s |
| `npm run models:build -- <slug> [--no-check]` | Build (fetch first for Poly Haven), check clashes and explode paths, write hints | 1–5 s |
| `node objects/<slug>/content.mjs` | Write `content/<slug>.json` from the text and the hints | < 1 s |
| `npm run check [-- <slug>]` | Static content checks against the model | < 1 s |
| `npm run qa -- <slug> [--model\|--quick\|--only …]` | Browser checks, contact sheets, report, exit code | 15–70 s |
| `npm run qa -- --all --quick` | Regression over every object, and the skill's page | ~100 s |
| `npm run qa -- --skill` | The skill's page and its live watch | ~15 s |
| `npm run posters -- <slug>` | Gallery posters and tray thumbnail | ~7 s |
| `npm run export -- --out <host>/public/3d-of-everything` | Bake the site into afrodance.fun (absolute URLs under the mount) | ~3 s |
| `npm run qa -- --all --deployed --url <gallery>` | The baked copy, served: load, rest and tour, no dev hooks | ~95 s |
| `npm run models:inspect -- <slug>` | Every node's bounds in model space | < 1 s |
| `npm run timing [-- session.jsonl --item slug=pattern]` | Where a build's time went, by stage | 5–30 s |

## References

Read each when its stage needs it:

- `references/procedure.md`: every stage with its exit check and budget, the subagent prompts, how long each kind of object took before and why.
- `references/explaining.md`: the six rules for explaining a machine, where each lands on the page, the tour recipe and the house voice.
- `references/content.md`: the content file field by field, the content builder, explode staging, callouts, motions, the tour, charts and experiments.
- `references/model.md`: sourcing and licences, model space, the kit's API, opening a shell (B), building in code (C), hints and anchors, the build's checks, naming, gotchas.
- `references/mechanisms.md`: the motion and control vocabulary, the existing mechanism modules, and how to wire a new one, its charts and its experiments.
- `references/qa.md`: what `check` and `qa` cover, how to read the sheets, the GPU browser, the fake clock, and the visual review list.
- `references/lessons.md`: what the site's owner has asked for and turned down, so it isn't relearned.
