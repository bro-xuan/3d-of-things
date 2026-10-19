# Spinning Wheel: truth sheet

Tier B · slug `spinning-wheel` · started 2026-10-19

Fill this in before any geometry. Every number on the page (sizes, counts, ratios, timings) and every shot of the film comes from here, and the generator and the content builder read the same constants. Keep it short: tables and one-liners.

## 1. The object

- **Exactly what:** a treadle flyer wheel of the Saxony (slanted-bench) type: wheel at the low end of a sloping bench on three legs, flyer at the high end on a mother-of-all with two maidens, tension screw through the bench's end. **Double drive**: one band doubled into two open loops, one on the flyer's whorl, one on the bobbin's (the mesh has four strands between wheel and flyer, two loops 16–17 mm apart, and two grooves on the flyer whorl). Poly Haven calls it "a vintage Victorian wooden spinning wheel" and gives no maker, country or provenance (published 2021-10-07); its three legs and steep bench look more Scandinavian slant-bench than British (an unsourced reading).
- **Real size:** 489 × 966 × 1025 mm (Poly Haven's dimensions; the build keeps the mesh's metres). With the generated fibre held out in front of the orifice the model's box is 672 mm wide.
- **The problem it solves:** spinning fibre into yarn continuously. A spindle twists, then stops while the yarn is wound on by hand; the flyer twists and winds on at the same time.
- **Its one big idea (the principle):** the flyer, turning, puts one twist in the yarn per turn; the bobbin, turning on the same shaft a little faster (bobbin lead), winds the yarn on. The speed difference, not the wheel, does the winding.

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | https://polyhaven.com/a/spinning_wheel_01 (Sofia Pahaoja) | CC0, checked by `npm run models:fetch` |
| Dimensions, ratios, crank | Measured off the mesh by `objects/spinning-wheel/augment.mjs` (fitted axes, band wraps, groove floors) | The model's own geometry; a modeller's wheel, not a measured antique |
| Mechanism (flyer, double drive, bobbin lead, tension, slip) | The standard handspinning literature: Alden Amos, *The Alden Amos Big Book of Handspinning* (Interweave, 2001); Mabel Ross, *The Essentials of Handspinning* (1980); Patricia Baines, *Spinning Wheels, Spinners and Spinning* (Batsford, 1977) | Well-established; the terms (footman, mother-of-all, maidens, whorl, orifice, hooks) are the standard ones. Not checked page by page in this session |
| History | Earliest flyer picture: the Wolfegg *Hausbuch*, c. 1475–80, hand-turned, with two cords, i.e. double drive (Baines pp. 85–87; the Museo Leonardiano cites "Hausbuch 34a, two-cord version"); Lucas van Leyden's engraving of 1513 (p. 87); first English mention 1557 (p. 90). The treadle legend, Meister Jürgen of Watenbüttel near Braunschweig, 1530, is first recorded in Rehtmeier's chronicle of 1722 and was doubted by 1843 (Deutsche Biographie); Baines finds no firm treadle evidence before the 17th century. Leonardo's Codex Atlanticus f. 1050r is a flyer machine with an automatic traverse (the spindle moves to and fro to fill the bobbin), not the invention of the flyer (Museo Leonardiano); no source was found for the often-quoted "c. 1490" | Secondary; the page says only "from the sixteenth century it spread across Europe" |
| The misconception | Science Museum Group co44835: "The flyer and bobbin are free to turn independently and are provided with pulleys of different diameter … As the bobbin turns faster than the flyer, the yarn is continuously wound up on it." | Museum record |
| Treadling pace | 50–60 treadles a minute sustainable, about 100 at most (Abby's Yarns, 2006; HJS Studio, a search snippet) | Weak: blog sources. The page uses 60 a minute |
| Flyer speed | About 750 rpm typical, 500 slow, 1000 for a good spinner (Bill Wyatt's tachometer readings, wyattspinwheels.com) | A maker's measurements |
| Twist | 4–6 twists to the inch for a thick, soft singles, 10–12 for fingering (thefiberfaerie.com); *Joy of Handspinning*'s arithmetic agrees: at 10 : 1, drafting 2 in per treadle gives 5 to the inch, and one flyer turn is one twist | The figure's source is weak; the arithmetic isn't. The page uses 4 to the inch |
| Ratios elsewhere | Ashford Traditional double drive 7.5 / 9.5 / 13 : 1 with a 16 : 1 bobbin lead (Ashford SHFDD sheet; Woolery); single drive 7 / 9 / 12 / 17; Kromski Minstrel 6.5 / 8.5 / 12 / 16; Wyatt 8 / 12 / 16, "most spinners like a ratio of about 12 to 1", and "a bobbin pulley about 2/3 the size of the flyer's whorl"; an antique Finnish wheel 11–12 : 1 (Bresser, *Spin Off* 2023) | Makers' and retailers' figures |

## 3. The energy chain

source → transmission → control → output. One line each, naming the parts.

1. **Source:** the spinner's foot rocks the **treadle** on its hinge pins; its far corner pulls the **footman** down.
2. **Transmission:** the footman turns the **crank** on the wheel's axle; the **drive wheel**'s rim (a flywheel) carries the crank over its dead points and drives the **drive band**, doubled into two loops.
3. **Control:** the loops drive the **flyer whorl** and the smaller **bobbin whorl**; the **tension screw** slides the **mother-of-all** to tighten both loops; the spinner holds the yarn back, so the band slips on the bobbin whorl and the yarn goes in only as fast as the hands let it.
4. **Output:** the **flyer** turns and twists the yarn between the orifice and the hands; the **bobbin**, turning faster, winds it on over a **hook**.

## 4. Numbers

| Quantity | Value | Source |
|---|---|---|
| Wheel rim, outside | 606 mm | mesh (`hints.numbers.rimDiameter`) |
| Band round the wheel (centreline) | 596.7 mm | circle fitted to the band's wrap on the rim |
| Flyer whorl, band's groove (centreline) | 48.8 mm | groove floor + 0.8 mm cord radius |
| Bobbin whorl, band's groove (centreline) | 45.0 mm | groove floor + cord radius |
| Drive band | about 1.6 mm cord | the mesh's strands |
| Flyer ratio | 12.23 : 1 | 596.7 / 48.8; ordinary wheels run about 6 : 1 to 17 : 1, 12 : 1 a favourite (Wyatt) |
| Bobbin ratio | 13.27 : 1 | 596.7 / 45.0 |
| Bobbin lead | 1.04 turns per turn of the wheel: the bobbin at 1.085× the flyer | the two ratios, as modelled. Low against makers' wheels: the Ashford's bobbin runs 1.23× the flyer on its fastest groove, and Wyatt puts the bobbin pulley at about ⅔ of the flyer whorl (1.5×) |
| Crank throw | 63.6 mm | fitted axle to crank pin |
| Footman | 576 mm | crank pin to the treadle's corner (an antique in the Albuquerque Museum: 18½ in, 470 mm, a snippet) |
| Treadle arm | 312 mm | hinge line to the footman's pin |
| Treadle's corner, travel | 127 mm (2 × throw) | four-bar, rest at bottom dead centre |
| Treadling | 60 a minute (1 turn/s of the wheel) | an easy pace (Ross, Amos) |
| Flyer speed | about 730 rpm | 12.23 × 60; Wyatt measures about 750 typical |
| Hooks | 11 on each arm | mesh (a Connecticut Historical Society flyer has 10 on its one surviving arm) |
| Spokes | 12 | mesh |
| Bobbin core / yarn on it | 50.7 mm / 61.7 mm | mesh core; 6 mm of yarn generated on it |
| Yarn | about 2.4 mm, 4 twists to the inch | chosen: a soft singles |
| Yarn let in per turn of the wheel | about 78 mm | 12.23 twists ÷ 4 per inch |
| Free wind-on per turn of the wheel | about 202 mm | 1.04 × π × 61.7 mm: more than the spinner lets in, so the band slips |
| Axle tilts as modelled | wheel 3.6°, flyer 4.6° | fitted; the parts turn about their own axes |

## 5. The misconception

"People think the big wheel spins the yarn, or that the bobbin turning pulls it in; in fact the wheel only drives, the **flyer** twists the yarn (one twist per turn), and the yarn winds on **only because the bobbin turns at a different speed from the flyer** (here 8.5 % faster), because if they turned together the yarn would be twisted but never taken in." Goes in: the callout "Not the wheel, the flyer", the hook, and the film's last shot.

## 6. Parts, grouped in chain order

| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
| Foot | `treadle` | Treadle | A triangular frame on the floor, hinged on two pins along its inner bar. The foot rocks it; its far corner carries the footman. | rocked by the crank on Drive wheel |
| Foot | `footman` | Footman | A wooden rod 57.6 cm long from the treadle’s corner up to the crank. It only pulls: the foot pushes the crank down past the bottom and the wheel carries it over the top. | link from Treadle to its crank |
| Wheel | `wheel` | Drive wheel | Twelve spokes and a rim 60.6 cm across, grooved for the band. Its weight keeps it turning between pushes of the foot, carrying the crank over the points where the footman can’t pull it. | time, 60 rpm |
| Wheel | `crank` | Crank | An iron crank on the axle’s end, 64 mm from the axle to its pin. The footman hangs from the pin. | with Drive wheel |
| Wheel | `uprights` | Uprights | Four turned posts, two each side, wedged through the bench; the axle turns in bearings at their tops. | – |
| Band | `drive_band` | Drive band | One cotton cord, about 1.6 mm thick, going twice round the wheel’s rim: one loop on the flyer’s whorl, one on the bobbin’s. It is tied on, and the tension screw tightens both loops at once. | – |
| Flyer and bobbin | `flyer` | Flyer | A U of wood on a hollow shaft. The yarn enters at the orifice, leaves by a hole in the shaft’s side and runs along an arm over one of its eleven hooks. Every turn of the flyer puts one twist in the yarn. | time, 734 rpm |
| Flyer and bobbin | `flyer_whorl` | Flyer whorl | A grooved pulley screwed onto the shaft’s back end. The band runs in its 48.8 mm groove; a smaller groove beside it would turn the flyer faster. | with Flyer |
| Flyer and bobbin | `bobbin` | Bobbin | It turns loose on the flyer’s shaft, driven by its own whorl, 45 mm in the groove: smaller than the flyer’s, so it turns faster and winds the yarn on. | time, 62.4 rpm |
| Flyer and bobbin | `yarn` | Yarn | A singles yarn of about 4 twists to the inch, from the drafting zone through the orifice and over a hook onto the bobbin. | with Flyer |
| Flyer and bobbin | `fibre` | Fibre | Prepared wool, held in the spinner’s hands (not shown) and drawn out thin as the twist runs up into it. | – |
| Flyer and bobbin | `leader` | Yarn at the orifice | The yarn between the orifice and the spinner’s hands. It turns with the flyer, and each turn puts in one twist, which runs up into the fibre being drawn out. | with Flyer |
| Mounting | `front_maiden` | Front maiden | The post holding the orifice end in a leather bearing. It turns in the mother-of-all to let the flyer out. | – |
| Mounting | `back_maiden` | Back maiden | Holds the shaft’s back end in a leather bearing, just behind the whorl. | – |
| Mounting | `mother_of_all` | Mother-of-all | The bar the maidens stand in, on a post through a slot in the bench. Sliding it away from the wheel tightens the band. | – |
| Mounting | `tension_screw` | Tension screw | A wooden screw through the end of the bench into the mother-of-all’s post. Turning the knob moves the flyer away from the wheel or towards it. | – |
| Frame | `table` | Bench | The slanting bench that carries everything: the uprights at its low end, the mother-of-all at its high end. | – |
| Frame | `legs` | Legs | Three turned legs, the front one long, and a rail along the floor that the treadle hinges against. | – |

Written by `npm run truth -- spinning-wheel` from the content file.

## 7. Mechanism map

- **Time:** `wheel` spins at 1 turn/s (`speed`), about its fitted axis through the hub. `flyer` spins at 12.23× about its fitted axis (orifice to back bearing). `bobbin` is nested in the flyer and spins at the difference, 1.04×, so its total is 13.27×. `crank`, `flyer_whorl`, `yarn` and `leader` ride their parents.
- **Four-bar (new):** `treadle` is a `rocker` on the wheel's crank: it rocks about its hinge (the two pins on its inner bar) to the angle that keeps its corner exactly the footman's length from the crank pin; `footman` is the `coupler`, hung from the treadle's corner and pointed at the crank pin. `src/viewer/fourbar.ts` (no three.js), wired in `src/viewer/rig.ts`; fields `rocker`, `coupler`, `pin`, `at` in `src/types.ts`; `scripts/check-content.mjs` checks their nodes and points. The slider-crank (`crank` + `rocks`) was not enough: the treadle's corner swings 23° on an arc 25 mm off a straight line.
- **Film:** no new cues; `rate` slows the last shot to 0.04 so the bobbin's lead on the flyer can be followed by two riding tags.
- **Not moving:** the band (a uniform cord moving along itself looks still), the tension screw (only in Take it apart).

## 8. Film (15–25 s, 2–5 shots)

| At | Chapter | Caption | Seconds | Cues |
|---|---|---|---|---|
| 0 s | Treadle | Each push of the foot rocks the treadle, and the footman pulls the crank round. | 5 |  |
| 5 s | Band | The heavy wheel keeps turning, and one doubled band takes it to the flyer and the bobbin. | 5 |  |
| 10 s | Twist | The flyer turns 12.2 times a turn of the wheel, and each turn twists the yarn once. | 5 |  |
| 15 s | Wind on | Slowed down: the bobbin’s smaller whorl turns it faster than the flyer, so the yarn winds on. | 6 |  |

Written by `npm run truth -- spinning-wheel` from the content file.

## 9. Simplified or left out

- The wheel is the modeller's, not a measured antique: the ratios are what its grooves give, and its axles lean 3.6° and 4.6° as modelled.
- The band in the mesh sits loosely round the whorls; the ratios use the grooves it runs in.
- No slip. In use the spinner holds the yarn back and the band slips on the bobbin's whorl, so the yarn winds on only as fast as it is drafted: about 78 mm per turn of the wheel here, against the 202 mm the whorls alone would wind. The film and the run button show the bobbin at its full 13.27× with no slip; the "Winding on" callout says so in words. The band doesn't visibly travel either.
- The spinner's hands aren't shown; the fibre floats where they'd hold it. The yarn outside the orifice turns rigidly with the flyer, so its spiral shows the twist going in; in real yarn the twist runs up into the drafting zone.
- The yarn's path through the orifice, the eye and over one hook is generated; real flyers vary in where the eye is.
- The footman's joints are pins; on old wheels they are leather thongs or a wire hook.
- Take it apart: the band is tied on round the wheel, so it, the wheel and the mother-of-all under its loops stay put; the flyer is slid inside the loops, clear of the whorls, before it comes out.

## 10. Log

Run `date` at each stage; at twice a stage's budget, tell the user where it stands.

| Stage | Budget | Started | Done | Notes |
|---|---|---|---|---|
| 0 Brief | 5 min | 17:10 | 17:11 | Saxony double-drive wheel, tier B, gears, order 21 |
| 1 Truth | 15 min | 17:11 | 18:12 | Research subagent blocked 17:11–17:27 (15 min lost waiting); the numbers were then measured off the mesh |
| 2 Scaffold | 2 min | 17:10 | 17:11 | 6 s |
| 3 Model | 30 min | 17:27 | 18:00 | 85 islands sorted by bounds; axes fitted (both tilted); band radii by circle fit and groove floors; yarn, fibre, wound yarn, tension screw generated; explode reordered three times |
| 4 Content | 15 min | 17:52 | 18:09 | callout cameras twice (the viewer's narrow field: distances 3–6) |
| 5 Mechanism | (if new) | 17:50 | 17:53 | four-bar rocker/coupler, additive |
| 6 Check | 10 min | 17:59 | 18:18 | film angles: the wheel is edge-on from ±z, so the film stays on the spinner's side; object qa 61 passed, 0 warnings; regression all pass (a first run failed 3 loads because reproduce rewrote files under it); reproduce -- --models all identical |
| 7 Ship | 5 min | 18:11 | 18:22 | posters, truth tables (taught truth-tables.mjs the rocker and coupler), build |
