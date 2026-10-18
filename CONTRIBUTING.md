# Contributing

Thanks for helping. This file covers adding or changing an object, the checks every change has to pass, and the house rules.

## Adding an object

The easy way is Claude Code in this repository:

```text
/3d-of-things add a sewing machine
```

The [`/3d-of-things` skill](.claude/skills/3d-of-things/SKILL.md) is the standard procedure; doing it by hand follows the same stages:

1. **Pick something new.** A machine whose mechanism and shape differ from what's on the site, with a free model (CC0 or CC BY, checkable at its source) or enough published dimensions to build it in code.
2. **Write its truth sheet** (`objects/<slug>/TRUTH.md` once scaffolded): sources, real numbers, the energy chain, the parts in groups, the tour.
3. **Scaffold it:**
   ```sh
   npm run new -- <slug> --tier C --title "Sewing Machine" --category gears        # built in code
   npm run new -- <slug> --tier B --polyhaven <asset_id>                           # a shell to open
   npm run new -- <slug> --tier A --polyhaven <asset_id>                           # parts already separate
   ```
4. **Build the model** in `objects/<slug>/generate.mjs` or `augment.mjs` with the kit (`scripts/kit/`), returning named pivots and anchors in the hints, and loop:
   ```sh
   npm run models:build -- <slug> && node objects/<slug>/content.mjs && npm run check -- <slug>
   npm run qa -- <slug> --model
   ```
5. **Write the content** in `objects/<slug>/content.mjs`: [explaining a machine](.claude/skills/3d-of-things/references/explaining.md) for the order and voice, [the content file](.claude/skills/3d-of-things/references/content.md) for every field.
6. **Check it:** `npm run check -- <slug>` and `npm run qa -- <slug>` pass, and you've looked at every contact sheet.
7. **Ship it:** `npm run posters -- <slug>`, add it to the README's list and models table, `npm run build`.

## Changing an object

Edit the source, not the output: every object's `objects/<slug>/content.mjs` writes `content/<slug>.json`, and its `generate.mjs` or `augment.mjs` builds the model. Rebuild what you changed, then check that object and the rest:

```sh
npm run models:build -- <slug> && node objects/<slug>/content.mjs
npm run qa -- <slug>
npm run qa -- --all --quick
npm run reproduce
```

## The checks

A change is ready when:

- `npm run build` passes (type-check and production build);
- `npm run check` reports no errors;
- `npm run reproduce` passes: every content file is what its builder writes (with `-- --models` after a change to the kit: every model too);
- `npm run qa -- --all --quick` passes, and `npm run qa -- <slug>` for every object you touched;
- `npm run models:build -- <slug>` passes its clash and explode checks for every model you touched, without `--no-check`.

When a check is missing, add it to `scripts/qa/run.mjs` or `scripts/check-content.mjs` so every object gets it, rather than writing a script for one object.

## House rules

- **Real insides.** Generate mechanisms from real numbers and cite them; say on the page what's simplified. No AI part-segmentation: it invents insides.
- **Free licences only**, verifiable at the source, credited exactly.
- **The model stays solid and whole on the page**: no fades, masks or clipping at the page's edges.
- **Follow the energy** in the groups, callouts, explode order and tour.
- **One voice**: plain, physical, exact, British spelling, the number that makes it real.
- **Sizes in rem** with the page's viewport-scaled root size; no small fixed pixel sizes.
- **The kit's building blocks are shared.** The modules in `scripts/kit/` are what existing models are built from, so a change to one (say `scripts/kit/solids.mjs`) must leave those models byte for byte the same: `npm run reproduce -- --models` rebuilds them all and fails on any difference. Otherwise add a new function instead.
- **Objects import from the kit, never from each other.** Code one object needs stays in its `objects/<slug>/`; once a second object needs it, move it into the kit.
