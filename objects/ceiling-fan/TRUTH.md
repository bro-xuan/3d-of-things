# Ceiling Fan: truth sheet

Tier B · slug `ceiling-fan` · started 2026-10-19

Fill this in before any geometry. Every number on the page (sizes, counts, ratios, timings) and every shot of the film comes from here, and the generator and the content builder read the same constants. Keep it short: tables and one-liners.

## 1. The object

- **Exactly what:** a classic US 52-inch (1321 mm) AC ceiling fan: five blades, a capacitor-run (PSC) induction motor built inside out (outer rotor), a three-speed pull chain and a slide reverse switch in the switch cup under the motor. The running figures follow the **Hampton Bay Bayfield 52-inch** (Home Depot models 52193 / 52194 / 52195, UL model EF200S(T)-52, use-and-care guide of about 2019–20) [HB1], cross-checked against two sister Hampton Bay 52-inch pull-chain fans, the Devron 57233 and the Campbell 91350 [HB2, HB3]. The Bayfield is not ENERGY STAR certified (not in the EPA dataset, searched 2026-10-19); the only big-brand 52-inch AC-type fan listed there is the Harbor Breeze 52" Lewind [ES1]. Most ENERGY STAR 52-inch fans now draw 1–3 W on low, which points to DC motors [ES2]. No fan maker publishes its motor's insides, so the motor comes from patents and repair sources [P1–P4, C1, F1]. In section 4, *HB1* figures are the maker's claims ("approximate measures"), [calc] marks a number computed here, and *estimate* says where a figure is ours.
- **Real size:** blade sweep 52 in = 1321 mm; 5 blades; 4.5 in (114 mm) ball downrod; 5.8 kg net [HB1]. The Poly Haven mesh we use is 1463 × 1463 × 516 mm (a 1.46 m sweep, about 57.6 in), see section 9.
- **The problem it solves:** keeping people comfortable in a warm room for tens of watts, by moving the air over them instead of chilling all of it; the CBE guide puts the air-conditioning saved at 10 to 100 times the fan's own use [D2].
- **Its one big idea (the principle):** an induction motor turned inside out. The wound stator stays still on a hollow shaft that hangs from the downrod; the steel rotor shell with its aluminium cage turns round it and carries the blades directly, with no gears. A capacitor splits single-phase mains into two currents about 90° apart, which makes a rotating magnetic field, and the field drags the cage round behind it. Because the motor runs with a big slip, a second capacitor in series with it drops the voltage and slows it: that is how the pull chain sets the speed.

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | Poly Haven `ceiling_fan` by Ulan Cabanilla, https://polyhaven.com/a/ceiling_fan (published 2025-04-30, https://api.polyhaven.com/info/ceiling_fan); two meshes (body, blades), 1463 × 1463 × 516 mm, 16k tris | CC0 (licence shown on the asset page, checked 2026-10-19); checked by `npm run models:fetch` |
| [HB1] Dimensions, speeds, watts, airflow | Hampton Bay Bayfield 52-inch use-and-care guide, https://images.thdstatic.com/catalog/pdfImages/14/14e73864-7e13-4394-9cb0-d02e687aa207.pdf (same table in https://images.thdstatic.com/catalog/pdfImages/c0/c0ea825e-10ca-4e1b-a25c-6c6d446b33ba.pdf) | Maker's manual; its performance table is the maker's claim |
| [HB2] | Hampton Bay Devron 52-inch, model 57233, UL EF200S(Q)-52, https://images.thdstatic.com/catalog/pdfImages/12/12b9b5cf-87d0-4d88-9ec1-58e6731968e3.pdf | Maker's manual |
| [HB3] | Hampton Bay Campbell 52-inch, models 91350/91359, UL 52-BVD, https://images.thdstatic.com/catalog/pdfImages/f3/f35f02fa-14b4-4e59-b9fa-7741c5e55a70.pdf | Maker's manual |
| [ES1] | ENERGY STAR Certified Ceiling Fans dataset 2te3-nmxp, https://data.energystar.gov/resource/2te3-nmxp.json; Harbor Breeze 52" Lewind (Lowe's 5660223), pd_id 4586809, certified 2026-04-17 | EPA list of maker-reported test data |
| [ES2] | Same dataset; e.g. Hunter 52" Builder 52731, https://www.energystar.gov/productfinder/product/certified-ceiling-fans/details/2635687 | EPA |
| Mechanism [P1] | Hunter Fan Co., US 10,886,795 B2 (2021), "Electric motor", https://patents.google.com/patent/US10886795 | Patent: central stator, annular rotor round it, rotor slots filled with conductors shorted by end rings |
| [P2] | Bajaj Electricals, Indian patent application filed 2022-09-27, "A stator assembly for an induction motor" (ceiling fan), https://www.quickcompany.in/patents/a-stator-assembly-for-an-induction-motor | Patent: 14 poles, 14 main + 14 auxiliary slots, stator Ø 125–150 mm, skewed rotor bars |
| [P3] | Nidec Motor Corp., US 10,215,180 B2 (2019), https://patents.google.com/patent/US10215180 | Patent for a DC ceiling-fan motor; used only for proportions (can Ø 185 × 35 mm, stator Ø 162.5 mm × 15 mm, two ball bearings) |
| [P4] | Lightolier, US 4,992,709 (1991), https://patents.google.com/patent/US4992709 | Patent: fan speed set by switching series capacitors in and out, which changes the motor's terminal voltage |
| [C1] | HQRP CBB61 replacement capacitor for Hampton Bay fans, 4.5 + 5 + 6 µF, 250 VAC, https://www.ebay.de/itm/351643977469; https://www.ebay.com/itm/162178364020 (a buyer's note there: the red lead is the section common to all speeds) | Spares listings: weak |
| [F1] | https://electro-tech-online.com/threads/those-ceiling-fans.141560/; https://forums.mikeholt.com/threads/ceiling-fan-3-speed-switch-question.149373/; https://www.electrical-contractor.net/forums/ubbthreads.php/posts/180762.html ("typical ceiling fan would be a 16 pole motor") | Weak: practitioners' forum posts |
| [W1] | Westinghouse 7802400 52" listing, blade pitch 12°, https://brighterhomes.xologic.com/brand-westinghouse/52-in-white-finish-white-blades/7802400/sku-A7M2 | Retailer copy of maker's data |
| [B1] | MSF catalogue "Bearing, for ceiling fan" (6201, 6202), https://unicat.msf.org/cat/product/99349 | Catalogue, not US-specific: weak |
| Air and comfort [D1] | US DOE, "Energy Saver 101: Home Cooling" (2016), https://www.energy.gov/sites/default/files/2016/11/f34/HomeCooling101.pdf | Government |
| [D2] | Raftery & Douglass-Jaimes, *CBE Ceiling Fan Design Guide*, UC Berkeley, 2020, https://cbe.berkeley.edu/wp-content/uploads/2020/04/CBE-Ceiling-Fan-Design-Guide-V0.pdf | University research guide |
| [D3] | DOE direction advice (anticlockwise in summer, clockwise in winter) as quoted by https://www.carolinacountry.com/your-energy/save-energy-with-ceiling-fans | Secondary, citing energy.gov |

## 3. The energy chain

source → transmission → control → output. One line each, naming the parts.

1. **Source:** 120 V 60 Hz mains (black and white wires) comes through the canopy, down the downrod and the motor's hollow fixed shaft to the switch cup under the motor: 0.43 A and 51 W on high [HB1].
2. **Control:** in the switch cup the pull-chain switch (1 pull High, 2 Medium, 3 Low, 4 Off [HB1]) picks how much capacitor sits in series with the motor: the less capacitance, the more reactance, the lower the voltage at the windings and the slower the fan [P4, F1]. The slide reverse switch picks which of the two windings gets the run capacitor [F1].
3. **Transmission (the motor):** the main winding takes whatever voltage the switch lets through directly, the auxiliary winding takes it through the run capacitor, so its current leads by about 90°; the two windings, set between each other's poles round the stator, make a field that turns at 400 rpm (18 poles, estimate). The field sweeps through the aluminium bars of the rotor's cage, induces currents in them, and the force on those currents drags the rotor shell round at 151 rpm on two ball bearings.
4. **Output:** five blade irons screwed to the rotor's underside carry five blades pitched about 12°; turning anticlockwise (seen from below) with the leading edge high, they push a column of air down through the 1.37 m² swept disc at about 1.5 m/s, 4430 CFM (2.09 m³/s), which spreads across the floor and back up the walls. All 51 W ends up as heat in the room.

## 4. Numbers

| Quantity | Value | Source |
|---|---|---|
| **Fan** blade sweep | 52 in = 1321 mm; swept disc 1.37 m² [calc] | HB1 |
| Blades | 5, reversible (two finishes), 3 screws each into a blade iron (15 screws) | HB1 |
| Blade irons | 5; each puts an alignment post into a slot in the motor's underside (the rotor shell) and is held by pre-fitted motor screws | HB1 |
| Blade pitch | ≈ 12° (Westinghouse 7802400); typ. 12–14°; not given for the Bayfield (estimate) | W1 |
| Mounting | 4.5 in (114 mm) ball downrod, or close to the ceiling; blades ≥ 7 ft (2.1 m) above the floor; box rated 35 lb (15.9 kg); ceilings sloped up to 30° | HB1 |
| Blades below ceiling | ≈ 300 mm with the 4.5 in downrod (estimate; read it off the model) | estimate |
| Mass | 5.8 kg net, 7.5 kg boxed (Bayfield); Devron 9.5 kg, Campbell 8.3 kg | HB1–HB3 |
| Lead wires | 54 in, from the top of the motor up the downrod | HB1 |
| Motor housing (decorative) | ≈ Ø 210 × 120 mm (estimate; take from the model) | estimate |
| **Speeds** (Bayfield, 120 V) | Low 75 rpm · Medium 107 rpm · High 151 rpm | HB1 (maker's claim) |
| Watts | Low 11.98 W · Medium 24.12 W · High 51.03 W | HB1 (maker's claim) |
| Current | 0.21 · 0.30 · 0.43 A | HB1 (maker's claim) |
| Power factor | 0.48 · 0.67 · 0.99 [calc: W ÷ (120 V × A)] | calc |
| Airflow | Low 2563 · Medium 3312 · High 4430 CFM (1.21 · 1.56 · 2.09 m³/s) | HB1 (maker's claim) |
| Airflow per watt | 214 · 137 · 87 CFM/W [calc]; pre-2020 test method, not comparable with today's ENERGY STAR figures | calc |
| Mean air speed through the disc, high | ≈ 1.5 m/s [calc: 2.09 m³/s ÷ 1.37 m²] | calc |
| Blade tip speed | 5.2 · 7.4 · 10.4 m/s [calc] | calc |
| Sister fans | Devron: 61/111/160 rpm, 9/29/62 W, 1579/2859/4002 CFM. Campbell: 60/105/160 rpm, 12/28/59 W, 2307/3588/5309 CFM | HB2, HB3 (maker's claims) |
| ENERGY STAR AC comparison | Harbor Breeze 52" Lewind: 14.3 W low, 63.7 W high, 77.7 CFM/W (DOE 2020 test method) | ES1 |
| ENERGY STAR DC comparison | Hunter 52" Builder 52731: 1.3 W low, 22.2 W high, 282.1 CFM/W | ES2 |
| **Mains** | 120 V, 60 Hz (US) | HB1 |
| **Motor** type | PSC induction, outer rotor: wound stator on a fixed hollow shaft; rotor = steel shell with laminated ring and aluminium cage (bars shorted by end rings) | P1, P2 |
| Poles | 18 (estimate; forum says 16 is typical; Bajaj's 50 Hz Indian fan uses 14) | F1, P2, estimate |
| Synchronous speed | 120 × 60 ÷ 18 = 400 rpm (16 poles: 450 rpm) [calc] | calc |
| Slip | High 62 %, Medium 73 %, Low 81 % at 18 poles (66 / 76 / 83 % at 16) [calc]; large on purpose: a high-resistance cage, so that lowering the voltage lowers the speed | calc |
| Stator slots | 36: 18 main + 18 auxiliary, one of each per pole (estimate, by Bajaj's pattern of 14 + 14 for 14 poles) | P2, estimate |
| Rotor bars | ≈ 44, skewed (estimate; Bajaj says skewed, no count found anywhere) | P2, estimate |
| Stator stack | ≈ Ø 150 mm × 15–20 mm (estimate; Bajaj Ø 125–150 mm; Nidec's DC fan motor Ø 162.5 × 15 mm); the "153 × 15" trade size was not confirmed | P2, P3, estimate |
| Rotor shell | ≈ Ø 175–185 mm × 35–45 mm (estimate; Nidec DC can 185 × 35 mm) | P3, estimate |
| Air gap | ≈ 0.5 mm (estimate; induction motors need a small gap) | estimate |
| Bearings | 2 sealed deep-groove ball bearings, top and bottom of the rotor shell, typ. 6202 (15 × 35 × 11 mm) or 6201 (12 × 32 × 10 mm) (estimate) | B1, P3, estimate |
| Windings | main and auxiliary, alike in fan motors so either can take the capacitor; turns not published | F1, estimate |
| **Capacitor** | one CBB61 metallised-polypropylene block in the switch cup, 3 sections, 4.5 + 5 + 6 µF, 250 VAC, 4 leads (one common) | C1 |
| Which section does what | one section runs the auxiliary winding at all speeds (a weak one slows every speed) [C1]; the switch puts the others in series with the motor. Our scheme (estimate): run 4.5 µF; Low = 5 µF; Medium = 5 + 6 µF in parallel; High = no series capacitor | C1, F1, P4, estimate |
| Series reactance at 60 Hz | 5 µF = 531 Ω; 11 µF = 241 Ω [calc: 1 ÷ (2π · 60 · C)]. On Low the 531 Ω and the motor share the 120 V; 0.21 A fits roughly 50–60 V at the motor (estimate) | calc |
| Reverse switch | DPDT slide switch on the switch cup: left = forward (downdraft), right = reverse (updraft); stop the fan first, the switch can't break the motor current | HB1, F1 |
| **Air** direction | Summer: anticlockwise seen from below, air down. Winter: clockwise, air up the middle and down the walls at low speed | D3, HB1 |
| Comfort | 0.5 m/s ≈ 2 °C (4 °F) cooling effect; ASHRAE 55 allows up to 0.8 m/s where people can't control the fan | D2 |
| Thermostat | with a fan, set the air conditioning about 4 °F (2 °C) higher | D1 |

## 5. The misconception

**Recommended: (a).** It is the one people act on every day, and the page can show it with the motor's own watts.

(a) "People think a ceiling fan cools the room; in fact it warms it slightly, because every one of its 51 W on high ends up as heat in the room. You feel cooler because moving air carries heat off your skin faster: it sweeps away the warm layer of still air round you and speeds up the evaporation of sweat. Air at 0.5 m/s feels about 2 °C (4 °F) cooler [D2], so you can set the air conditioning about 4 °F higher [D1]. A fan cools people, not rooms: in an empty room it only adds heat, so switch it off when you leave [D1]." Goes in: a callout.

(b) Runner-up: "People think the winter (reverse) setting blows warm air down; in fact the blades just turn the other way and lift air up the middle, so the warm layer under the ceiling rolls down the walls and mixes in, at low speed, without a draught on anyone. A fan can mix the air either way, but it takes more power in reverse for the same mixing [D2]."

## 6. Parts, grouped in chain order

| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
| Mains | `canopy` | Canopy and downrod | The canopy covers the box in the ceiling the fan hangs from; the mains comes down inside the hollow rod. Neither moves. | – |
| Mains | `coupling_cover` | Coupling cover | Hides the joint where the downrod’s foot is pinned to the motor’s shaft. It stays still while the housing just below it turns. | – |
| Switches | `switch_housing` | Switch cup | Hangs from the bottom of the fixed shaft, under the turning motor, so its switches stay put. Less than 2 mm separates it from the rotor. | – |
| Switches | `speed_switch` | Pull-chain switch | Each pull steps it round: high, medium, low, off. Each speed puts a different capacitor in series with the motor, or none. | – |
| Switches | `capacitor` | Capacitor | Three capacitors in one block of metallised plastic film: 4.5, 5 and 6 µF at 250 V. One runs the auxiliary winding; the others slow the motor. | – |
| Switches | `reverse_switch` | Reverse switch | Swaps which winding the capacitor feeds, so the field, the rotor and the blades turn the other way and lift the air instead. | – |
| Switches | `switch_cap` | Switch cap | Closes the cup. The switch plate inside carries the pull-chain switch and the capacitor; the chain comes out through it. | – |
| Stator | `shaft` | Shaft | Hollow and fixed: it hangs from the downrod, carries the stator, and the motor’s leads run down inside it to the switch cup. | – |
| Stator | `stator` | Stator core | A stack of thin steel sheets, 188 mm across and 20 mm thick, with 36 teeth, held on the shaft by an aluminium hub. The red and blue band round it is the field, drawn: north and south poles at one instant. | – |
| Stator | `main_winding` | Main winding | 18 coils of enamelled copper, on every other tooth, wound so that neighbours make opposite poles. It takes the mains straight from the switch. | – |
| Stator | `aux_winding` | Auxiliary winding | 18 coils on the teeth in between, fed through the capacitor (red here to tell them apart). Their current peaks a quarter of a cycle early. | – |
| Rotor | `rotor` | Rotor | A steel can round the stator, lined with a ring of laminated steel, on two 6202 ball bearings. The blade irons bolt to its underside. | time, 151 rpm |
| Rotor | `cage` | Squirrel cage | 44 aluminium bars through the rotor’s ring, joined by a ring at each end. No wire reaches them: the field makes the currents in them. | with Rotor |
| Rotor | `motor_housing` | Motor housing | The painted cover, with the rotor’s lid and its top bearing inside. It turns with the rotor, at up to 151 rpm. | time, 151 rpm |
| Blades | `blade_1` | Blade 1 | Each of the four blades is screwed to a steel blade iron that holds it at 13.7°, leading edge high, so it pushes air down as it turns. | with Rotor |
| Blades | `blade_2` | Blade 2 | One of four, a quarter turn on from blade 1, on its own blade iron. | with Rotor |
| Blades | `blade_3` | Blade 3 | One of four, a quarter turn on from blade 2, on its own blade iron. | with Rotor |
| Blades | `blade_4` | Blade 4 | One of four, a quarter turn on from blade 3, on its own blade iron. | with Rotor |

## 7. Mechanism map

What moves and what drives it: time (`speed`, `clock`), a control (name and range), a crank or cam. Which existing motion kinds, experiments and charts it reuses, and anything new (a new mechanism needs a viewer module: references/mechanisms.md).

- **Rotor** (`rotor`, with the `cage` and the four `blade_n` nested under it) and **motor housing** (`motor_housing`, which carries the rotor's lid and top bearing): two time-driven spins at the same speed, 151 rpm (2.5167 turns/s, the Bayfield's high speed), about the downward axis, so anticlockwise seen from below. They are separate nodes, not nested, so the housing can lift off upward while the rotor drops in the explode; the film gives both the same `spin` factor in every shot, so they stay in step.
- **Field** (`field`, nested under the fixed `stator`): a ring of nine north (vermilion) and nine south (blue) pole pads in the 0.6 mm air gap, a time-driven spin at the synchronous speed, 120 × 60 Hz ÷ 18 poles = 400 rpm (6.6667 turns/s), same axis and sense. Not a part of the fan: a drawing of the field, said so on the page.
- **Film**: no cues; it uses `spin` factors (eased over 1.5 s by the player) and one `rate` of 0.05 for the whole film, so the field's poles can be followed (at 1 the field turns 40° a frame at 60 fps, two pole pitches, and looks frozen). Shot 1 holds everything still (`spin` 0), shot 2 starts the field (1) with the rotor at 0.25, shots 3–4 run everything at its own speed.
- **Film framing**: two focus sets, changing once at the chapter break to Air. In shots 1–3 the windings, the field, the cage, the shaft and the switch cup's parts are solid and the blades glass, so they don't cover the motor; in shot 4 the blades are solid too. Exact cameras at one distance (2.45 model units) on a point just below the motor, leaning in so the blade tips come near the stage's sides; shots 1–3 from 8° below the motor (the field shows through the glass housing above the switch cup), shot 4 from 6° above. Azimuths −40°, −20°, 0°, 20°. The labels sit at the motor's right-hand edge so they don't cover the field.
- Reused: plain `speed` spins (src/viewer/rig.ts) and the film's `spin`/`rate`. Nothing new in the viewer or the kit.

## 8. Film (15–25 s, 2–5 shots)

The mechanism doing its job once, start to finish (references/film.md).

| At | Chapter | Caption | Seconds | Cues |
|---|---|---|---|---|
| 0 s | Current | 120 V comes down to the switch cup, then up to the windings: one direct, one through the capacitor. | 5 |  |
| 5 s | Field | The capacitor puts the two currents a quarter-cycle apart, so the poles march round: a field at 400 rpm. | 6 |  |
| 11 s | Rotor | It sweeps through the cage’s bars; the currents it drives in them drag the rotor after it at 151 rpm. | 6 |  |
| 17 s | Air | Pitched at 13.7°, leading edge high, the four blades push a column of air down into the room. | 5 |  |

## 9. Simplified or left out

Said on the page too (`credit.extra` or the text).

- **Model and licence:** Poly Haven `ceiling_fan` by Ulan Cabanilla, CC0 (checked on https://polyhaven.com/a/ceiling_fan, 2026-10-19). It has two meshes, body and blades; everything inside the housing (stator, windings, rotor cage, bearings, shaft, capacitor, switches, wiring) is built in code, sized from section 4.
- **Size:** the mesh sweeps 1463 mm, about 57.6 in, not the Bayfield's 1321 mm. Either scale it by 0.90 to 1321 mm or keep it and say "a 52–56 in fan"; the speeds, watts and airflow are the Bayfield's either way. No light kit, like the Bayfield.
- **Motor insides are typical, not one maker's:** no fan maker publishes its motor. Pole count (18), stator slots (36), rotor bars (44), stack size, air gap and bearing sizes are estimates from patents and repair sources.
- **Windings:** shown as a few neat turns or copper bands per tooth, not hundreds of turns of fine enamelled wire; the turn count is not published.
- **Laminations:** the stator stack is drawn as a handful of bands, not the ~30–40 sheets of 0.5 mm steel a 15–20 mm stack holds (estimate).
- **Cage:** bars drawn straight and countable; real ones are skewed and cast inside the rotor's laminated ring, hidden from view.
- **Capacitor:** one block with three labelled sections; which section does which job differs between makers, so our run / Low / Medium scheme is one common arrangement, not the Bayfield's own diagram.
- **Switches and wiring:** the pull-chain switch is drawn as a four-position selector (High, Medium, Low, Off), the reverse switch as a two-way slide; the wiring is reduced to a few colour-coded runs through the hollow shaft.
- **Blade pitch:** 12° from a similar Westinghouse fan; the Bayfield's own pitch is not published.
- **Air:** shown as four straight blue lines down through the blades' disc; the real wake also swirls round with the blades, spreads over the floor and is strongest under the blade tips.
- **Built (2026-10-19):** the mesh has **four** blades, not the Bayfield's five, and sweeps 1463 mm; it is kept at its own size and the page quotes the Bayfield's speeds and watts as "a typical 52-inch three-speed fan's" (credit line). The blades are **mirrored** (x → −x) so they pitch like a US fan's: leading edge high when turning anticlockwise seen from below. Their pitch, 13.7°, is measured off the mesh (the Westinghouse figure is 12°).
- **Built:** stator 188 × 20 mm with 36 teeth (estimate; a common trade size), rotor can Ø238 mm, 44 bars, two 6202 bearings, the switch plate, pull-chain switch with a 3.2 mm ball chain, a 46 × 30 × 22 mm capacitor block and four colour-coded leads. The auxiliary winding is drawn red to tell it from the main one; real ones are both copper-coloured enamel.
- **The field at full speed:** pressing "Switch on" runs the field at its true 400 rpm, which a 60 Hz screen can't show (it moves two poles a frame and looks still); only the film, slowed twenty times, shows it turning. The housing hides it at rest.
- **Explode:** the motor housing lifts only 45 mm, because the lid's top bearing inside it would otherwise meet the downrod's foot; the coupling cover's floor hole and the housing's top hole are opened to 15.5 and 17 mm, and the little trim ring's bore eased from 14.9 to 15.5 mm, so they slide up the 14.8 mm downrod.

## 10. Log

Run `date` at each stage; at twice a stage's budget, tell the user where it stands.

| Stage | Budget | Started | Done | Notes |
|---|---|---|---|---|
| 0 Brief | 5 min | 17:10 | 17:10 | Ceiling fan, tier B. Variety: the first object driven by an electric motor. |
| 1 Truth | 15 min | 17:10 | 17:24 | Research subagent (sections 1–5, 9) while scaffolding: Hampton Bay Bayfield 52" as the reference fan. |
| 2 Scaffold | 2 min | 17:10 | 17:11 | `npm run new`, 4 s. |
| 3 Model | 30 min | 17:24 | 17:57 | Mesh profiled (housing one island: drum, neck, bowl); cut into housing, rotor underside and switch cup; motor and switch cup generated. Explode fixed for parts sliding up the downrod. |
| 4 Content | 15 min | 17:53 | 18:05 | Parts, callouts, film. Found that the viewer keeps the exploded model on the floor: exploded callout cameras add the switch cap's 460 mm drop. Film on exact cameras (the spinning blades' framed box changes width with azimuth). |
| 5 Mechanism | (if new) | – | – | None: spins and the film's `spin`/`rate`. |
| 6 Check | 10 min | 17:56 | 18:24 | `check`, `qa` (model, full, tour) and their sheets; regression and reproduce. |
| 7 Ship | 5 min | 18:06 | 18:25 | Posters, truth tables, build, commit. A first regression pass failed 7 checks because `reproduce` rewrote the content files under its dev server; run again alone, it passed. |
