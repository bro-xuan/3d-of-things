# Tape Measure: truth sheet

Tier B · slug `tape-measure` · started 2026-10-19

Fill this in before any geometry. Every number on the page (sizes, counts, ratios, timings) and every step of the tour comes from here, and the generator and the content builder read the same constants. Keep it short: tables and one-liners.

## 1. The object

- **Exactly what:** a 3 m × 19 mm pocket tape measure with a rubber-moulded case, a front lock you press and a belt clip: Poly Haven's generic "3m" tape (no brand), opened up and built inside to the figures of a Stanley PowerLock 3 m × 19 mm (cat. no. 0-33-523), the commonest documented tape of that size. Where no maker gives a figure, the patents below do; what neither gives is laid out to fit the case and marked "assumed".
- **Real size:** the model's case is 41 × 74 × 85 mm (with the clip; the source's wrist strap is left off).
- **The problem it solves:** carry three metres of rigid ruler in a pocket, and get it back in by itself.
- **Its one big idea (the principle):** the blade is a curved steel strip wound on a drum; pulling it out winds a flat spiral spring inside the drum, and the spring's stored energy winds it back. The curve across the blade makes the strip stiff enough to stand out in the air, yet it flattens to coil up.

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | https://polyhaven.com/a/measuring_tape_01 (Kuutti Siitonen) | CC0, checked by `npm run models:fetch` and at https://polyhaven.com/license |
| Anchor product | Stanley PowerLock 3 m × 19 mm, 0-33-523: https://www.stanleytools.co.uk/product/0-33-523/stanley-3m-powerlock-tape-measure | maker: 19 mm blade, Class II, "±0.5 mm at 1 m", hook "moves along the securing rivets to account for hook thickness" |
| Blade thickness | Stanley FatMax 3 m × 16 mm, 0.13 mm (Klium listing); US 7,395,608 (0.13–0.18 mm common); US 7,096,596 (0.114 mm typical); US 10,712,142 (core 0.09–0.13 mm) | distributor, patents |
| Standout | US 7,395,608 table: ½ in 0.9–1.1 m, ¾ in 1.4–1.85 m, 1 in 2.2–2.5 m; Stanley PowerLock 1 in: 7 ft (2.1 m); FatMax 32 mm: 3.35 m (Screwfix) | patent, maker, distributor |
| True zero | US 4,930,227 (Stanley, 1990): rivets in "axially elongated apertures or slots", sliding "equivalent to the thickness of the hook" | patent |
| Accuracy | Directive 2014/32/EU, Annex X (MI-008): ±(a + bL), class II a = 0.3 mm, b = 0.2 mm/m; +0.2 mm for an end bounded by a surface | standard |
| Spring | US 10,870,555 (25 ft × 1¼ in tape: spring 0.13–0.165 mm thick, 2.0–2.5 m long); US 11,092,418 and US 6,811,109: inner end's tab in a slot of a post fixed to the case, outer end tabbed to the reel, pre-wound at assembly | patents |
| Lock | US 3,214,836 (R. F. West, Stanley, filed 1963): pressing the button pushes a shoe onto the blade, wedging it against the case's bottom wall behind the mouth | patent |
| Cupped blade | US 1,402,589 (Farrand, 1922): the concave section stops it buckling; coiled, the turns flatten out | patent |
| History | US 79,965 (A. J. Fellows, 14 July 1868): spring tape; US 1,402,589 (H. Farrand, 3 Jan 1922): curved steel rule; PowerLock 1963 | patents |

## 3. The energy chain

1. **Source:** your pull on the end hook draws the blade out of the mouth.
2. **Transmission:** the blade unrolls from the drum and turns it, 20.3 turns for the whole 3 m.
3. **Storage:** the drum carries the spiral spring's outer end round the fixed post, winding the spring tighter: its coils move off the drum's wall and pack onto the post.
4. **Control:** the lock's shoe can pinch the blade against the mouth's floor and hold it against the spring.
5. **Output:** let go and the spring turns the drum back, winding the blade in until the hook stops against the mouth. The hook's play keeps every reading true, hooked or pushed.

## 4. Numbers

| Quantity | Value | Source |
|---|---|---|
| Blade | 3 m graduated × 19 mm | Stanley 0-33-523 |
| Blade steel | 0.13 mm; 0.15 mm a turn on the roll, with its coating | FatMax 3 m 0.13 mm; US 10,712,142 (0.15–0.2 mm coated) |
| Blade curve | radius 22 mm across, about 2.2 mm deep | assumed: no figure for 16–19 mm blades (Milwaukee's 25–35 mm blades: 7–10 mm deep) |
| Stiffness from the curve | about 1.07 (h/t)²: some 300× a flat strip | derived, I ≈ (4/45)·b·t·h² against b·t³/12 |
| Standout, ¾ in blade | 1.4–1.85 m; this model folds past 1.6 m, 4.5 cm out from the case | US 7,395,608; fold point assumed |
| Drum | hub 44 mm across | assumed, to fit the case (research estimate 35–44 mm) |
| Drum turns, home to 3 m | 20.3 (computed from the roll), about 15 cm of blade a turn | derived: blade pitch 0.15 mm on a 44 mm hub |
| Spring | 0.13 mm × 16 mm spring steel, 3.84 m long, in a 40 mm barrel round a 10 mm post; 37 turns end to end at home, 57 at 3 m out | thickness: US 10,870,555 range; width and length laid out to fit (length: the most turns its barrel holds) |
| Spring torque | E·b·t³·θ / 12L, E = 206 GPa, wound 12 turns past free at home (pre-wound at assembly): 12 N·mm home, 32 N·mm at 3 m; a pull on the hook of 0.47 N home, 1.44 N at 3 m | formula; preload assumed |
| Hook | 0.9 mm steel, 2 rivets in slots 0.9 mm longer than the rivets | model's hook; informal sources about 1 mm; US 4,930,227 |
| Accuracy | Class II: ±0.5 mm at 1 m, ±0.9 mm at 3 m (±1.1 mm counted from the hook) | 2014/32/EU Annex X; Stanley "±0.5 mm at 1 m" |
| Lock | press the button 2 mm: the shoe drops onto the blade | US 3,214,836 (mechanism); travel from the model's recess |
| Return | about 1.8 m/s, slowing as the hook comes home | assumed, for the animation |

## 5. The misconception

"People think the loose, wobbly hook is broken or worn; in fact it is meant to slide, by exactly its own thickness, because then a measurement pushed against a wall and one hooked over an edge both start at the true zero." (US 4,930,227; Stanley's "moves along the securing rivets".) Goes in: callout 6 and the last step ("Hook").

## 6. Parts, grouped in chain order

<!-- truth:parts -->
| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
| Your pull | `end_hook` | End hook | Where your pull goes in: 0.9 mm of steel riveted to the blade's end. It slides on its rivets by exactly its own thickness, so the zero is right whether it's hooked or pushed. | control: tape_out |
| Your pull | `hook_rivets` | Rivets | Two rivets fixed in the blade, running in slots in the hook 0.9 mm longer than they are. | control: tape_out |
| Blade | `blade` | Blade | 3 m of steel 0.13 mm thick and 19 mm wide, curved across its width. On the drum it lies flat, about 20 turns deep; out in the air the curve stiffens it. | control: tape_out |
| Drum | `drum` | Drum | A 44 mm hub with the blade's tail fixed to it. About 15 cm of blade turns it once; inside is the spring's barrel. | control: tape_drum |
| Spring | `recoil_spring` | Recoil spring | 3.8 m of spring steel 0.13 mm thick and 16 mm wide, coiled 37 turns deep in the drum: its inner end on the post, its outer end on the drum. | control: tape_drum |
| Spring | `spring_post` | Spring post | Moulded into the right half of the case: the spring's inner end hooks on it and the drum turns round it. It never moves, so the drum's turning winds the spring. | – |
| Lock | `lock_button` | Lock button | Press it 2 mm into its recess and the shoe under it drops onto the blade. | control: tape_lock |
| Lock | `brake` | Brake shoe | An arm from the button down inside the case's front wall, ending in a shoe just over the blade behind the mouth. Locked, it pinches the blade against the guide under it. | with Lock button |
| Case | `case_left` | Case, left half | One of two moulded halves under a rubber skin; this one carries the label. | – |
| Case | `case_right` | Case, right half | The other half: the spring's post stands from its wall, and the guide the blade runs out on is moulded into it. | – |
| Case | `belt_clip` | Belt clip | Sprung steel, screwed to the case where the spring's post is. | – |
<!-- /truth:parts -->

## 7. Mechanism map

A new kind, `src/viewer/tapemeasure.ts` (three-free: blade path, drum turns, spring coils and torque, standout), with `src/viewer/strip.ts` (bends the blade and spring meshes along those paths, like the shutter's cloth). Controls: `tape_out` (mm out), `tape_drum` (drum turns), `tape_hook` (0 pushed, 1 hooked), `tape_lock` (0 free, 1 on). Motions: the drum turns with `tape_drum`; the blade (strip) with `tape_out`; the spring (strip) with `tape_drum`; the hook slides with `tape_out` and by its thickness with `tape_hook`; the rivets with `tape_out`; the button (and the brake on it) with `tape_lock`. Experiments: `tape-pull` (slider out to 3 m, let go), `tape-lock` (pull out, lock, let go), `tape-standout` (slider past the standout), `tape-hook` (hooked or pushed). Charts: `tape-spring` (new: the pull on the hook against blade out, its cursor following the drum), `bars` (standout by blade width). Wired in additively: `src/viewer/linkage.ts` (a `strip` motion kind), `src/viewer/Viewer.ts` (the module chosen by the `tape_out` control; `tapeState`, `setTapeOut`, `letGoTape`, `setTapeLock`, `setTapeHook`), `src/types.ts` (`Motion.strip`), `src/charts/index.ts`, `src/pages/tour.ts` (one branch to `src/pages/tapetry.ts`).

## 8. Tour (5–7 steps)

<!-- truth:tour -->
| # | Label | Shows (focus, flow) | Chart | Try |
|---|---|---|---|---|
| 1 | The idea | Blade, Drum, Recoil spring, Spring post, End hook; power flow; apart 0.45 |  |  |
| 2 | Pull | Blade, Drum, End hook, Rivets; power flow; apart 0.45 |  | tape-pull |
| 3 | Spring | Recoil spring, Drum, Spring post; power flow; apart 0.45 | tape-spring: What the spring pulls with | tape-pull |
| 4 | Lock | Lock button, Brake shoe, Blade; power flow; apart 0.45 |  | tape-lock |
| 5 | Curve | Blade, End hook, Rivets | bars: Standout by blade width | tape-standout |
| 6 | Hook | End hook, Rivets, Blade |  | tape-hook |
<!-- /truth:tour -->

## 9. Simplified or left out

- The blade's printing is a scale every millimetre with numbers every centimetre; the case's own label is Poly Haven's.
- The spring's size isn't published for any 3 m tape: it is laid out to fit (0.13 mm, the patents' thickness), and its forces are this model's. Its coils are drawn packed on the post and on the drum's wall with one free coil between: the shape a spring of the most turns takes.
- The spring's end tabs (in a slot in the post, hooked into the drum) aren't modelled; its ends sit against them.
- The lock is a press (the model's button fills its recess); the PowerLock's shoe slides on an arc.
- Past its standout the blade folds at one point and the rest is drawn straight; a real one hangs and curls.
- The wrist strap on the source model is left off.

## 10. Log

Run `date` at each stage; at twice a stage's budget, tell the user where it stands.

| Stage | Budget | Started | Done | Notes |
|---|---|---|---|---|
| 0 Brief | 5 min | 11:36 | 11:40 | 3 m to match the model's "3m" label; Poly Haven model is one mesh with a wrist strap, so tier B |
| 1 Truth | 15 min | 11:40 | 12:24 | 44 min, past twice its budget: the research subagent ran in the foreground (~20 min) and its handback failed, so the report was read from its transcript; the sheet was written once the viewer module was drafted |
| 2 Scaffold | 2 min | 11:59 | 12:00 | |
| 3 Model | 30 min | 12:00 | 12:39 | the mouth's wall was solid (Poly Haven's hook ran through it) and its lower lip too thin to wall; drum flipped so the spring shows from the label side; printed blade |
| 4 Content | 15 min | 12:28 | 12:36 | |
| 5 Mechanism | (new kind) | 12:05 | 12:28 | `tapemeasure.ts`, `strip.ts`, `tapetry.ts`, `charts/tape.ts`, additive wiring |
| 6 Check | 10 min | 12:31 | 12:45 | object 63/63; first regression failed 3 other objects because I rebuilt files mid-run (dev server reloads), all pass on a quiet rerun |
| 7 Ship | 5 min | 12:41 | 12:46 | posters, truth tables, README, build |

Total about 70 minutes from the request to the last check, against a tier B budget of 15–60: the research wait and a new viewer kind (blade paying out, spring winding) account for the overrun.
