# Garden Sprinkler: truth sheet

Tier A · slug `garden-sprinkler` · started 2026-10-18

Fill this in before any geometry. Every number on the page (sizes, counts, ratios, timings) and every step of the tour comes from here, and the generator and the content builder read the same constants. Keep it short: tables and one-liners.

## 1. The object

- **Exactly what:** Poly Haven's "Garden Sprinkler 01" by Amal Kumar (published 23 January 2023, CC0). It is an unbranded, weathered yellow rotating reaction sprinkler: two arms on a wheeled sled base, with a metal swivel column and a ribbed hose connector. It works like Melnor's 2-Arm Revolving Sprinkler (9575C) and Hozelock's twin-arm Round Sprinkler (2510). It is not a named current product, so there is no latest reveal to check.
- **Real size:** 351 × 203 × 249 mm (nozzle tip to tip × height × depth), measured from the mesh. Poly Haven's listing gives 360 × 249 × 216 mm. The arm is 284 mm across, and each nozzle exit is 173 mm from the axis and 195 mm above the ground. Two 74 mm wheels sit at the back, 297 mm apart over their outer faces. The base is 231 × 218 mm, and the swivel column's top is 144 mm up.
- **The problem it solves:** it waters a whole circle of lawn, about 14 m across, from one hose and unattended. It has no motor: mains water pressure is its only power.
- **Its one big idea (the principle):** reaction. Each nozzle throws water backwards and upwards, and the water pushes the arm the opposite way, as in Hero's aeolipile and Segner's 1750 wheel. The nozzle's angle splits each jet between turning the arm and throwing water across the lawn.

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | https://polyhaven.com/a/garden_sprinkler_01 (Amal Kumar, 2023). Nodes: `body_main` (base, column, hose connector), `wheels`, `spinner` (arm and hub), `nozel_left`, `nozel_right` | CC0 (polyhaven.com/license: "Our assets are all licensed as CC0"), checked by `npm run models:fetch` |
| Dimensions | The mesh: `npm run models:inspect -- garden-sprinkler`, plus a read of each part's vertices and the nozzle centrelines (2026-10-18) | Measured. Poly Haven's API lists 359.6 × 249.1 × 215.6 mm |
| Mechanism: seal, bearing, speed, throw | Rain Bird patent US 3,979,066 (B. Fortner, filed 1975, granted 7 Sep 1976): a governor for a reaction-drive sprinkler. Rain Bird US 5,377,914 (H. Christen, granted 3 Jan 1995): a braked spinner. Plastro US 7,458,527 B2 (M. Lutzki, granted 2 Dec 2008): a revolving sprinkler | Patents, with measured test figures |
| Jet and spin physics | Euler's turbine equation, as set in MIT 2.25 *Advanced Fluid Dynamics*, Problem 5.26 (lawn sprinkler with bearing torque). Rose-Hulman ES201 review problem A (a three-arm sprinkler, also in White's *Fluid Mechanics*). Everything marked "computed" was calculated for this sheet | Textbook; the sums are shown in §4 |
| Maker specifications | Melnor 9575C and 7000 (melnor.com). Hozelock 2510 and 2520 (retailer listings TBSG, WOW Tools, ITS; hozelock.com product pages redirect). Gardena pop-up sprinkler art. 1569 (Gardena manual). Rain Bird 32SA (store.rainbird.com). Flexzilla hose guide (Legacy Manufacturing) | Maker pages; the Hozelock figures are second-hand |
| Supply | CCW low-pressure factsheet (Ofwat minimum). Ofwat DG2 reference level (UREGNI reporting guidance). WaterSafe "What should my water pressure be?". Baunetzwissen "Trinkwasser-Hausanschluss" (DIN 1988). Anglian Water via homebuilding.co.uk (2022). Epping Forest DC (22 Jul 2026) | Regulator and industry |
| Drops and throw | LibreTexts *Irrigation Systems Management* (AET 021), 11.3 "Sprinkler Performance". R. D. von Bernuth, "Effect of trajectory angle on performance of sprinklers in wind", *J. Irrig. Drain. Eng.* 114(4):579–587 (1988). Gunn & Kinzer, *J. Meteorol.* 6:243–248 (1949), terminal speeds as fitted in arXiv:1707.05225 | Textbook, peer-reviewed |
| History and the reverse sprinkler | Hero, *Pneumatica* §50 (Woodcroft trans., 1851). *Dictionary of Scientific Biography*, "Segner". Wang, Sprinkle, Zuo & Ristroph, *Phys. Rev. Lett.* 132, 044003 (2024). Smith, Zuo, Kuhlke, Sprinkle & Ristroph, *PNAS* 123(30), e2537479123 (2026). Wikipedia "Feynman sprinkler" (Mach 1883, Feynman 1985) | Primary papers. Wikipedia for the older story only |
| Misconception | NASA Glenn Research Center, "Rocket Principles". *Phys. Rev. Lett.* 132, 044003 | NASA education page; paper |

## 3. The energy chain

source → transmission → control → output. One line each, naming the parts.

1. **Source:** mains pressure of about 3 bar at the tap pushes water down the hose into the ribbed hose connector on the wheeled base (`body_main`), losing 0.3–1 bar on the way.
2. **Transmission:** the water rises through the metal swivel column (`body_main`) and passes from the fixed column into the arm's turning hub (`spinner`) at the swivel's seal.
3. **Control:** the arm (`spinner`) carries the water 173 mm out to the two nozzles (`nozel_left`, `nozel_right`). Their angle sets how each jet's push divides between torque and throw; swivel friction and the work of swinging the water outwards set the speed.
4. **Output:** the nozzles fire two jets of about 19 m/s, angled back and 20° up. The reaction turns the arm at about 170 rpm, and the jets break into drops that land 3–9 m away.

## 4. Numbers

**Base case for every computed figure:** 2.0 bar at the nozzles, two 2.5 mm bores, discharge coefficient C = 0.96, water at 998 kg/m³, nozzle geometry as modelled (exit radius 173 mm, 20° up, 12.6° off the radius) and 0.03 N·m of swivel friction. In the tables, "typical" marks a range taken from sources, "computed" a figure from these sums and "estimate" an assumption.

**Supply**

| Quantity | Value | Source |
|---|---|---|
| UK minimum mains pressure | 0.7 bar (7 m static head) in the water company's pipe | CCW low-pressure factsheet (Ofwat) |
| UK reference level | 1 bar (10 m head) at 9 l/min, at the stop tap | Ofwat DG2 (UREGNI reporting guidance); WaterSafe: "10 metres/head (or one bar)" |
| UK tap pressure | 2–4 bar (typical) | Trade guides; no official statistic found |
| UK plumbing | Must withstand 10 bar | CCW factsheet |
| German mains | Networks run at 2–10 bar; a pressure reducer is required where static pressure at the taps exceeds 5 bar | Baunetzwissen (DIN 1988 Teil 5) |
| Irrigation supply | 25–50 psi = 1.7–3.4 bar (typical) | Rain Bird US 5,377,914 |
| Model value | 3 bar static at the tap; 2 bar at the nozzles after the hose, tap and swivel | Chosen from the rows above and the hose losses below |
| Hose bores | 1/2" = 13 mm; 3/4" = 19 mm | Gardena hose names, e.g. "Classic 13 mm (1/2")" |
| Hose flow, 15 m (50 ft), open end | 1/2": 19–34 l/min (5–9 gpm); 3/4": 68–87 l/min (18–23 gpm) (typical) | Flexzilla hose guide, "at standard residential pressure" |
| Hose alone, with all of 3 bar lost in it | 1/2": 41 l/min over 15 m, 31 l/min over 25 m; 3/4": 115 and 86 l/min | Computed: Darcy–Weisbach with Blasius f = 0.316 Re^-0.25, smooth bore |
| Pressure lost in the hose at 12 l/min | 1/2": 0.35 bar over 15 m, 0.58 bar over 25 m; 3/4": 0.06 and 0.10 bar | Computed, as above |
| What a hose or sprinkler draws | Up to 1,000 l/h (17 l/min) | Anglian Water (homebuilding.co.uk, 2022); Epping Forest DC (2026) |
| This sprinkler's flow | 11.3 l/min (680 l/h) in the base case; 5–20 l/min across 1–3 bar and 2–3 mm bores | Computed (jets table) |
| For comparison | Gardena pop-up sprinkler 1569: 960 l/h over a full circle at 2 bar, 2.5–5 m throw | Gardena manual, art. 1569 |
| Throw, makers' maxima | Melnor 2-arm 9575C: 1,800 sq ft (167 m², radius ≈ 7.3 m). Melnor 3-arm wheeled 7000: 45 ft (13.7 m) across. Hozelock twin-arm 2510: 177 m², 15 m across. Hozelock four-arm sled 2520: 254 m², 18 m across | melnor.com; Hozelock via TBSG, WOW Tools and ITS listings |
| Pressure sets the area | "The operating pressure (bar/psi) determines the covered area!" | Gardena 1569 manual |
| Rain Bird's hose-end range today | Rotors and impact sprinklers, not reaction arms (e.g. 32SA rotor: 19–32 ft, 5.8–9.8 m radius) | store.rainbird.com |

**Jets**

| Quantity | Value | Source |
|---|---|---|
| Jet speed | v = C √(2Δp/ρ): 13.6 m/s at 1 bar, 19.2 m/s at 2 bar, 23.5 m/s at 3 bar (ideal 14.2, 20.0, 24.5 m/s) | Computed |
| Discharge coefficient | C ≈ 0.96, "but depends on the design of the nozzle". Used here for both speed and flow, with no contraction of the jet | LibreTexts AET 021, 11.3 |
| Nozzle bore | 2.5 mm in the base case; 2–3 mm likely (from 5–20 l/min at 1–3 bar). The mesh's tip face is 19 mm across, with an inner ring about 3 mm across that may stand for the bore | Computed; mesh read |
| Rain Bird's test nozzles | 5/32 in (4.0 mm) straight bores at 40 psi (2.8 bar) | US 3,979,066 |
| Flow per nozzle | 5.7 l/min = 94 g/s (3.6 l/min with a 2 mm bore, 8.2 l/min with 3 mm) | Computed, 2 bar |
| Thrust per nozzle, arm held | F = ṁv = 1.81 N (0.90 N at 1 bar, 2.71 N at 3 bar) | Computed |
| Torque, arm held, as modelled | 0.128 N·m from both nozzles = 2 × 1.81 N × cos 20° × 38 mm, the jet line's distance from the axis | Computed; the 38 mm is from the mesh |
| Torque, arm held, r = 150 mm, 20° up | 2F cos 20° × r × sin(angle off the radius): 0.13 N·m at 15°, 0.26 at 30°, 0.36 at 45°, 0.51 at 90° (fully sideways) | Computed |

**Spin (the Segner wheel)**

| Quantity | Value | Source |
|---|---|---|
| What sets the speed | Drive torque = ṁR(w_t − ωR): the jets' sideways push minus the angular momentum handed to the water as it is swung out to the tip. With no friction the arm speeds up until "the (ground-referenced) angular momentum outflow from it is zero" | Euler's turbine equation; MIT 2.25 Problem 5.26 answer |
| Centrifugal pumping | In the turning arm w² = C²(2Δp/ρ + ω²R²), so the jets get faster as the arm spins: +1% at 166 rpm here, +77% at 1,850 rpm on a 150 mm arm | Bernoulli in the arm's turning frame; computed |
| Where the push goes at 166 rpm, as modelled | Jet push 0.131 N·m = swinging water out 0.099 (76%) + swivel friction 0.030 (23%) + air drag on the arms 0.002 (1–2%) | Computed |
| Torque against speed, as modelled (chart) | Drive torque 0.128 N·m at 0 rpm, 0.099 at 50, 0.070 at 100, 0.041 at 150, 0.013 at 200 and 0 at 216 rpm; it meets 0.03 N·m of friction at 166 rpm | Computed |
| Swivel friction | 0.01–0.05 N·m (estimate): about 25 N of water pressure lifts the arm onto its washer, and μ ≈ 0.2 at an 8 mm radius gives 0.04 N·m. Model value 0.03 N·m | Estimate; the mechanism is from US 3,979,066 |
| Air drag on the arms | 0.002 N·m at 166 rpm, 0.14 N·m at 1,850 rpm (two arms 20–30 mm thick, Cd 1.2); it matters only at thousands of rpm | Computed |
| Speed as modelled | 221 rpm with no friction and no air; 216 rpm with air drag; 166 rpm with 0.03 N·m of friction; 116 rpm at 0.06; 48 rpm at 0.10 | Computed |
| Model value for the animation | About 170 rpm (2.8 turns a second), clockwise seen from above | Computed; the direction comes from the nozzle centrelines |
| Fully sideways nozzles, r = 150 mm, 20° up | 2,670 rpm with no air and no friction; 1,850 rpm with air drag; 1,750 rpm with 0.03 N·m of friction | Computed |
| Measured: reaction sprinkler | 510 rpm ungoverned, 92 rpm with a governor vane (three arms, 5/32 in nozzles, 40 psi). The patent says the reaction type's speed "is usually quite high" | Rain Bird US 3,979,066 |
| Measured: unbraked spinner | 2,000–3,000 rpm. With a silicone brake it runs at 3–17 rpm at 25–50 psi, and about 10 rpm gives the longest throw | Rain Bird US 5,377,914 |
| Braked farm sprinklers | 1–10 rpm | Plastro US 7,458,527 B2 |
| Textbook check | Three arms, 2.7 m³/h, R = 15 cm, d = 7 mm: 6.5 m/s jets and 414 rpm with no friction (317 rpm with the jets turned 40° from the tangent) | Rose-Hulman ES201 review problem A; recomputed |
| Unbraked garden arm sprinklers | Roughly 100–500 rpm (estimate from the rows above) | Estimate |
| Spin-up | Time constant about 0.3 s, taking I ≈ 18 kg·cm² for an estimated 80 g of arms and nozzles; up to speed in about a second | Computed estimate |
| Power | 38 W of water power goes in (Δp × Q); at 166 rpm the arm takes about 0.6 W (1.5%) and the rest leaves in the jets | Computed |
| Lab sprinkler, forward | Steady speed rises roughly in proportion to flow, because thrust scales as Q² and drag as Ω²; "a direct rotational analogue to a rocket" | *Phys. Rev. Lett.* 132, 044003 |

**Swivel**

| Quantity | Value | Source |
|---|---|---|
| Water path | The arm's hub turns on a hollow sleeve fixed to the supply; "laterally directed ports" in the sleeve feed the arms | US 3,979,066 |
| Seal | Water pressure lifts the hub and squeezes a bearing washer between a collar lip and a flange on the sleeve, making "a tight fluid seal". The lift also raises the hub's closed end off the top of the sleeve, which cuts friction | US 3,979,066 |
| Seal, other designs | An elastomer lip seal that the pressure presses shut. At switch-on "a small flow of water will pass" and flushes dirt out | US 5,377,914 |
| Seal, other designs | O-ring dynamic seals on tubular bearing surfaces | Plastro US 7,458,527 B2 |
| Bearing | Plain: the hub turns on the column, with the washer as its thrust face; none of these designs uses ball bearings | Patents above; Poly Haven description: "metal swivel" |
| Lift on the hub | About 25 N (2.2 bar on a 12 mm seal), against about 1 N of arm weight | Computed estimate |
| Cheap sprinklers | May use a plain plastic-on-metal fit that weeps a little at the swivel | Unconfirmed: no maker source found |

**Throw**

| Quantity | Value | Source |
|---|---|---|
| Why angled up | A jet needs height to travel. Without air 45° throws farthest; with drag about 29° is best in still air, falling below 5° in winds over 8 m/s | von Bernuth 1988 (simulation) |
| Why angled back | Only the sideways part of a jet makes torque ("a velocity component in a tangential direction"), and the more sideways the jet, the faster the spin | US 3,979,066, claim 1 |
| Model's nozzles | 20° up; 12.6° off the radius at the tip (22° off the arm's line); exits 195 mm above the ground | Mesh read |
| Irrigation nozzles | 23° up (typical) | LibreTexts 11.3 (its tables assume 23°) |
| Range with no air | 25 m from the axis (2 bar, 20° up) | Computed |
| Range with drag, still air, 2 bar | Drops of 1, 2, 3 and 4 mm land 3.5, 6.8, 8.7 and 9.6 m from the axis | Computed, with drag set by terminal speeds of 3.9, 6.5, 8.1 and 8.9 m/s (Gunn & Kinzer data, arXiv:1707.05225 fit) |
| Throw against pressure, as modelled (2 mm drops) | 1 bar 5.2 m, 1.5 bar 6.1 m, 2 bar 6.8 m, 2.5 bar 7.4 m, 3 bar 7.8 m (at 82, 129, 166, 197 and 224 rpm) | Computed |
| Best launch angle with drag | 29–35°, where 2 mm drops reach 7.3 m and 3 mm drops 9.5 m; at 20° they reach 6.8 and 8.8 m | Computed; agrees with von Bernuth's 29° |
| Wetted circle, model value | About 14 m across (about 145 m²) | Computed (2 mm drops); makers claim 13.7–15 m across for two- and three-arm models |
| Pressure out of range | Too high: "a high percentage of small drops" that fall short. Too low: the jet does not break up, giving "a doughnut shaped pattern" | LibreTexts 11.3 |
| Why faster spin shortens the throw | The nozzle's own speed ωR cancels the backward part of the jet, so a freely spinning arm launches its water with no sideways speed over the ground, and a fully sideways nozzle would drop it near its own tip. The spiralling streams also "fall out earlier" | MIT 2.25 P5.26; Rain Bird US 3,979,066 |
| Nozzle angle against speed and throw (20° up, 0.03 N·m, 2 mm drops) | 12.6° off the radius (as modelled): 166 rpm, 6.8 m. 30°: 470 rpm, 6.8 m. 45°: 755 rpm, 6.8 m. 60°: 1,063 rpm, 6.4 m. 75°: 1,347 rpm, 5.0 m. 90°: 1,474 rpm, 2.5 m. Held still, every angle throws 6.7–6.8 m | Computed |
| Measured effect of slowing | Governed at 92 rpm, Rain Bird's reaction sprinkler watered about 11% more area than at 510 rpm. Without its brake, the spinner's throw fell by about 50%. "Decreasing the rotation speed results in a larger range" | US 3,979,066; US 5,377,914; Plastro US 7,458,527 B2 |

**History**

| Quantity | Value | Source |
|---|---|---|
| Hero's aeolipile | 1st century AD: a steam-filled ball on two pivots, spun by steam escaping from two bent tubes; the first recorded reaction turbine | Hero, *Pneumatica* §50 (Woodcroft, 1851); Wikipedia "Aeolipile" |
| Segner's wheel | 1750: Johann Andreas Segner of Göttingen described a wheel turned by water streaming from oppositely directed tubes, in a letter to Euler dated 11 January 1750. Euler refined it; the wheel "is now used for horticultural irrigation" | *Dictionary of Scientific Biography*, "Segner" |
| Reverse sprinkler, the puzzle | Does a sprinkler that sucks water in turn, and which way? Mach (1883) reported "no distinct rotation". Feynman tried it at Princeton in the early 1940s until the glass carboy burst, and posed it in *Surely You're Joking, Mr. Feynman!* (1985) | Wikipedia "Feynman sprinkler" |
| Reverse sprinkler, the answer (2024) | Sucking water in, it turns the other way, with the orifices leading, unsteadily and "about 40 times slower" than when it squirts at the same flow (2.0 cm³/s). The cause is the jets inside the hub: centrifugal flow in the curved arms skews them, so they collide off-centre | Wang, Sprinkle, Zuo & Ristroph, "Centrifugal Flows Drive Reverse Rotation of Feynman's Sprinkler", *Phys. Rev. Lett.* 132, 044003 (26 Jan 2024), doi:10.1103/PhysRevLett.132.044003. APS *Physics* 17, 15 reports "about 50 times slower" |
| Follow-up (2026) | Seven deliberately odd arm shapes rule out Mach's explanation (the water's total angular momentum) and the Feynman-linked one (flow at the outer arms); torque follows the momentum flux into the hub | Smith, Zuo, Kuhlke, Sprinkle & Ristroph, "Geometry controls momentum flux in the sprinkler problem", *PNAS* 123(30), e2537479123 (13 Jul 2026), doi:10.1073/pnas.2537479123; seven designs per Live Science (27 Jul 2026) |

## 5. The misconception

"People think the jets push against the air. In fact the push happens inside the arm: the nozzle forces the water out backwards, and the water pushes the nozzle forwards. That is Newton's third law, as in a rocket. The air plays no part in the push; it only drags on the arms and breaks the jets into drops." NASA's "Rocket Principles" answers the same question for rockets: "the only part air plays … is to slow them down", and "rockets actually work better in space than they do in air". Wang et al. (*Phys. Rev. Lett.* 132, 044003) call the forward sprinkler "a direct rotational analogue to a rocket". Goes in: the nozzle callout, or the tour step on the jets.

## 6. Parts, grouped in chain order

| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
| Water in | `garden_sprinkler_01_body_main` | Frame and column | The hose screws on at the front. The water turns up the column in the middle to the swivel at its top. | – |
| Spin | `garden_sprinkler_01_spinner` | Arm | Hollow, with its hub on the column. Water pressure lifts the hub onto a washer that seals the joint and takes the arm’s weight as it turns. | time, 166 rpm |
| Jets | `garden_sprinkler_01_nozel_left` | Left nozzle | Points the water outwards, 20° up and a little sideways. The sideways part of the jet is what turns the arm. | with Arm |
| Jets | `garden_sprinkler_01_nozel_right` | Right nozzle | The same as the left one, pointing the other way round, so the two pushes add up to a turn. | with Arm |
| Frame | `garden_sprinkler_01_wheels` | Wheels | Two wheels at the back, so it can be pulled by the hose to the next patch of lawn. | – |

## 7. Mechanism map

- **Time:** one motion. The arm (`garden_sprinkler_01_spinner`) turns about the column's axis at 166 rpm, clockwise seen from above (−2.767 turns a second, real time), and the two nozzles turn with it as its children.
- **Reused:** a `speed` spin; the `speeds` experiment (The push: 1, 2 and 3 bar, each scaling the arm's speed); generic `bars` charts (`follow: 'selected'` in The push, so the chart picks the chosen pressure); the `water` flow from the washing machine, with its points on the arm and nozzles set to `ride` so the lines turn with them.
- **Nothing new in the viewer.** The water jets themselves aren't drawn: the car's thruster jets are supersonic gas, and a water jet that arcs and breaks into drops would need a look of its own.

## 8. Film (15–25 s, 2–5 shots)

The mechanism doing its job once, start to finish (references/film.md).

| At | Chapter | Caption | Seconds | Cues |
|---|---|---|---|---|
| 0 s | Water in | Turn on the tap and water comes up the column, through the swivel and out along the arm. | 6 |  |
| 6 s | The push | Each nozzle throws water back and to the side, and the water pushes the nozzle forwards. | 6 |  |
| 12 s | The push | Pushed at both ends, the arm turns at about 170 rpm and waters a circle 14 m across. | 6 |  |

## 9. Simplified or left out

Said on the page too (`credit.extra` or the text).

- The swivel is not modelled inside. Its seal (a washer the water pressure squeezes, or an O-ring) and its plain bearing are described but not shown, and the water's path up the column and along the arm is drawn as flow lines.
- The live numbers (about 170 rpm, 11 l/min, 19 m/s jets, 3–9 m throw) are computed for an assumed 2 bar at the nozzles, 2.5 mm bores and 0.03 N·m of swivel friction. They were not measured on this sprinkler, so the page says "about".
- The nozzle angle is the one the artist modelled (20° up, 12.6° off the radius). Real nozzles are often adjustable (Melnor: "Adjust the tip of each sprinkler arm").
- The jets aren't drawn: the water's path is drawn up the column and along the arm to the nozzles, and stops there. Real jets break into drops of many sizes, spiral as the arm turns and drift in wind.
- Throw is worked out for single drops with drag; the jet's unbroken core, wind and the spread of drop sizes are left out.
- Hose, tap and swivel losses are lumped together: 3 bar at the tap becomes 2 bar at the nozzles.
- The wheels are only for moving the sprinkler between waterings; nothing rolls while it runs.
- The model is unbranded. The Melnor, Hozelock, Gardena and Rain Bird figures are comparisons, not this sprinkler's specification.
- Feynman's reverse sprinkler is told in the text only, not simulated.
- The arm turns at its real speed, about 2.8 times a second (166 rpm), and faster when 3 bar is picked.

## 10. Log

Built on 18 Oct 2026, after the pump, from Poly Haven's Garden Sprinkler 01 (tier A: separate parts, nothing to open). Posters at 17:14. `npm run timing -- --item garden-sprinkler` counts 15 min of active work: check 7, orientation 3, content 2, ship 2, other 1, model 1.

| Stage | Budget | Active | Notes |
|---|---|---|---|
| 0 Brief | 5 min | 3 min | Tier A; points read off the mesh with nodeBounds (now with `space` and `parent`) |
| 1 Truth | 15 min | (subagent) | Research agent, in parallel |
| 3 Model | 5 min | 1 min | Downloaded as it is; 5 parts |
| 4 Content | 15 min | 2 min | 4 callouts, 5 steps |
| 6 Check | 10 min | 7 min | Flow points on the arm needed `ride` (the lines stood still while the arm turned); callout cameras pulled back for a small object; kit `pose()` gained `card` so a card lands beside its part, not over it |
| 7 Ship | 5 min | 2 min | Posters |
