# Washing Machine: truth sheet

Tier C · slug `washing-machine` · started 2026-10-18

Fill this in before any geometry. Every number on the page (sizes, counts, ratios, timings) and every step of the tour comes from here, and the generator and the content builder read the same constants. Keep it short: tables and one-liners.

## 1. The object

- **Exactly what:** a generic European front-loading washing machine of today: horizontal-axis drum, 8 kg, 1400 rpm, belt drive, 60 cm wide, no one brand. Outside size, drum volume and consumption follow the **Bosch Serie 4 WAN28281GB** (8 kg, 1400 rpm, brushless "EcoSilence Drive" motor that drives the drum by a belt; current on bosch-home.co.uk, checked 2026-10-18) [B1, B4]. The insides follow Whirlpool Europe and Electrolux service manuals for the same layout: a universal motor under the tub driving a poly-V belt [W1, W2, E1]. In section 4, *typ.* marks a range across makers, a model name marks that model's figure, and [calc] marks a number computed here.
- **Real size:** 848 × 598 × 550 mm (H × W × D); 600 mm deep with the door, 1017 mm with the door open; 68.5 kg [B1].
- **The problem it solves:** getting the dirt out of 8 kg of clothes with a few tens of litres of water and about a kilowatt-hour, without wearing them out, then wringing out most of the water so they dry quickly, all in a box that fits under a 60 cm worktop.
- **Its one big idea (the principle):** one drum, two speeds either side of about 60 rpm. Below that speed gravity wins at the top of the drum, so the lifters raise the clothes and drop them through a shallow bath of warm detergent (washing). Far above it the drum becomes a centrifuge, 515 g at 1400 rpm, and flings the water out through its holes (spinning). A heavy, spring-hung tub with friction dampers lets it do both without walking across the floor.

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | Built in code (tier C). Poly Haven has no washing machine: 521 models searched 2026-10-18. | Our geometry, from section 4 |
| Dimensions [B1] | Bosch WAN28281GB spec sheet, media3.bosch-home.com/Documents/specsheet/en-GB/WAN28281GB.pdf | Maker's data |
| [B2] | Bosch WAS28793 and WIS28440EU spec sheets, media3.bosch-home.com/Documents/specsheet/de-DE/… | Maker's data |
| [B3] | Bosch consumption-values sheet 9001553321 (a 9 kg model, EN 60456), media3.bosch-home.com/Documents/9001553321_B.pdf | Maker's data |
| [B4] | WAN28281GB parts list, ransomspares.co.uk (belt 00439490); 00439490 = 1255 mm, 5-rib PJ "1255 J5" (Screwfix 584EV, ricambi.com.au) | Spares catalogues |
| [B5] | Bosch Australia, "10 Year EcoSilence Drive motor warranty" page: permanent magnets on the armature instead of brushes | Maker's page |
| Mechanism [W1] | Whirlpool Europe service manual AWO 12363 (doc. 4812 722 23145, 2004): technical data, parts list, programme and spin charts (copy at hobbielektronika.hu, getfile id 187163) | Maker's service manual |
| [W2] | Whirlpool Europe service manuals FL 5105/A, AWM 5100, AWM 6100 (monitor.espec.ws, hobbielektronika.hu, forums.futura-sciences.com) | Maker's service manuals |
| [E1] | Electrolux technical specification sheets, 2003 (radiokot.ru file 270765; hobbielektronika.hu id 316054). These are top-loaders, with the same family of motors, pumps, heaters and sensors | Maker's service data |
| [E2] | Electrolux EWM2000EVO and AEG-Electrolux EMW2000 service manuals (manualslib.com 737173, 867752) | Maker's service manuals, read as extracts |
| [E3] | Electrolux plastic drum pulley Ø273 mm (shop.electrolux.co.uk 1327683007); Indesit alloy drum pulley Ø280 mm (store.nwar.co.uk) | Spares catalogues |
| [N1] | NXP/Freescale brochure "Household Washing Machines" BBHHWSHMCHNART (2012) | Chip maker; typical values |
| [C1] | Nygårds & Berbyuk, Multibody System Dynamics 27 (2012) 197–238, Chalmers preprint | Peer-reviewed; an Asko machine |
| [C2] | T. Nygårds, PhD thesis, Chalmers 2011 (publications.lib.chalmers.se 137995) | Thesis, funded by Asko |
| [S1] | Sánchez-Tabuenca et al., "Washing Machine Dynamic Model to Prevent Tub Collision during Transient State", Sensors 20 (2020) 6636 | Peer-reviewed |
| [P1] | Whirlpool patent US 10,100,453 B2, "Laundry treating appliance with tuned suspension system" | Patent |
| [P2] | Drum-hole patents: EP 2363524 A1 (holes "normally" 2–4 mm), US 6,334,341 (punched and flared to ~3.5 mm), Miele EP 2022882 A2 (≤ 2.5 mm) | Patents |
| [P3] | LG patents EP 3845696 A1 (conventional lifters ~40 mm high), US 11,952,703 B2 (drum of 0.4–0.6 mm stainless sheet) | Patents |
| [K1] | Suspa friction dampers, suspa.com/global/products/friction-dampers/dampers | Damper maker |
| [K2] | Counterweights: spareka.fr (Whirlpool/Indesit top 12.5 kg, 482000022884; front 14 kg, 481010899540; others 11.4–13.4 kg); ersatzteilshop.de (AEG ZWFC7265 top 12.1 kg) | Spares catalogues |
| [K3] | Lifters: ersatzteilshop.de 10105162 (alternative to Bosch 00669833); ebay.de listing for Bosch 00742713 | Spares listings |
| [K4] | Bosch drum bearings 6205 + 6206 (ransomspares.co.uk, Bosch 849154 listing); Bosch "bearing cross" spider 00474150 | Spares catalogue |
| [EU1] | Commission Delegated Regulation (EU) 2019/2014 (energy label), Annexes I, II, IV, on EUR-Lex | Law |
| [J1] | JRC preparatory study, Boyano et al. 2017, EUR 28809 | EU study |
| [F1] | Owners' drum measurements, automaticwasher.org thread "How big is yours? Compare your drum size" | Weak |
| [F2] | Gorenje residual-moisture chart quoted on automaticwasher.org, thread "Spin Speed — How fast is fast enough?" | Weak, second-hand |
| [H1] | Haier 8 kg range page, haier-europe.com (claims a 525 mm drum) | Maker's marketing |
| [WG] | Whitegoods Help article on replacing the concrete weight; BBC News 2017 on Nottingham Trent's water-tank counterweight | Repair site, press |
| [ISO] | ISO 15 boundary dimensions of 62-series ball bearings (as in SKF tables); ISO 9982 PJ belt section, 2.34 mm rib pitch | Standards |
| [T1] | Teardowns of corroded cast-aluminium spiders: softsolder.com (Kenmore HE3, 2010); automaticwasher.org (Miele PW6055 spider) | Weak: owners' teardowns |

## 3. The energy chain

source → transmission → control → output. One line each, naming the parts.

1. **Source:** 230 V mains (2.3 kW, 10 A) into the control board, and mains water at 0.5–10 bar held back by the solenoid inlet valve.
2. **Transmission:** the motor turns a ~26 mm pulley, and a 1255 J5 poly-V belt drives the 280 mm drum pulley (about 1 : 11). The pulley's shaft runs in two ball bearings (6205 + 6206) in the back of the tub and turns the drum through the three-armed spider. Separately, the 2 kW heater in the sump turns current into heat in the water.
3. **Control:** the control board counts drum speed (tacho or rotor position), reads the water level (air trap → hose → pressure sensor) and the temperature (NTC), and opens the valve into the detergent drawer. It switches the heater and the pump, reverses the tumble at 54 rpm, holds ~90 rpm to spread the load, and checks the unbalance before every spin. Springs, friction dampers and the concrete counterweights keep the tub's swing inside its 20–40 mm gap.
4. **Output:** the drum's three lifters raise the clothes and drop them through warm detergent solution; the 30–35 W drain pump pumps the dirty water out through its filter; a final spin at 1400 rpm (515 g at the wall) leaves about half the clothes' dry weight in water (class B, 45–54 %).

## 4. Numbers

| Quantity | Value | Source |
|---|---|---|
| **Cabinet** H × W × D | 848 × 598 × 550 mm; 600 mm with the door; 1017 mm with the door open (WAN28281GB) | B1 |
| Mass | 68.5 kg (WAN28281GB); 76.8 kg (WAS28793); 77 kg (AWO 12363) | B1, B2, W1 |
| Electrical | 2300 W connected load, 10 A, 220–240 V 50 Hz (WAN28281GB) | B1 |
| Tub to cabinet gap | typ. 20–40 mm | S1 |
| **Door** porthole (loading opening) | 32 cm (WAS28793), 30 cm (WIS28440EU) | B2 |
| Door outer diameter | ≈ 420–470 mm, derived: the open door reaches 1017 mm, and the body is 550 mm deep | B1, calc |
| Door position, swing | top edge 135 mm below the worktop; opens 180° (WAN28281GB), 165° (WAS28793) | B1, B2 |
| Door parts | frame, moulded glass bowl reaching into the drum's mouth, hinge, electric lock; rubber bellows gasket clamped by a wire ring to the tub's mouth and by a ring to the front panel | W1, B4 (Bosch 00361127 seal, 00439671 ring) |
| **Drum** volume | 55 l (WAN28281GB, WIS28440EU); 63–65 l in big-drum 8 kg models (WAS28793) | B1, B2 |
| Capacity per litre | typ. 0.12 kg/l (Swedish market mean, ±15 %); 8 kg in 55 l is 0.145 kg/l | C2, calc |
| Drum diameter | typ. 440–500 mm (measured: Miele 470 mm, Hotpoint 8 kg 490 mm); Haier claims 525 mm for its "big" 8 kg drum | F1, H1 |
| Drum depth | 317 mm for 55 l at Ø470 mm (328 mm for 56.9 l); measured 310–370 mm | calc, F1 |
| Drum shell | stainless steel sheet 0.4–0.6 mm | P3 |
| Perforation | round holes typ. 2–4 mm, often punched and flared to ~3.5 mm; Miele ≤ 2.5 mm. Pitch: no maker figure found (assume ~10–15 mm) | P2 |
| Lifters | 3 plastic lifters, 43–46 mm high, 213–280 mm long, with drain holes (9 on the 213 mm one); conventional lifters are ~40 mm | K3, P3 |
| **Tub** | plastic, two halves clamped together with a gasket ("Tub 53 l front", rear half, "Clamp for tub"); Electrolux calls its plastic "Carboran" | W1, E1 |
| Tub outer diameter | ≈ 520–550 mm, derived from the 598 mm cabinet less a 20–40 mm gap each side | B1, S1, calc |
| Spider | 3-arm "bearing cross" bolted to the drum's back, carrying the shaft; cast aluminium (typ.), which detergent can corrode | K4, T1 |
| Bearings | 6205 + 6206 (Bosch); 6204 + 6206 (Whirlpool, 53 l drum); 6203 + 6205 (Whirlpool, 48 l) | K4, W1, W2 |
| Bearing sizes, bore × OD × width | 6204: 20 × 47 × 14; 6205: 25 × 52 × 15; 6206: 30 × 62 × 16 mm | ISO |
| Shaft | stepped: 30 mm at the inner bearing (6206), 25 mm at the outer (6205); the pulley is held on its threaded end (Whirlpool: M12 nut) | ISO, W1 |
| Shaft seal | lip seal between the tub and the inner bearing ("Shaft seal 1200"); sizes vary by model, no confirmed Bosch size | W1 |
| **Belt** | poly-V 1255 J5: 5 ribs, PJ section (2.34 mm pitch, so 11.7 mm wide), 1255 mm long (WAN28281GB); Whirlpool "WH 1250 J5" | B4, W2, ISO |
| Drum pulley | Ø298 mm (Whirlpool), Ø280 mm (Indesit, alloy), Ø273 mm (Electrolux, plastic) | W1, W2, E3 |
| Belt ratio | 1 : 15.6–15.9 (Whirlpool, 1000 rpm machines); 12–18 (Electrolux); typ. 1 : 6–1 : 16, "around 1 : 10" (NXP) | W1, W2, E1, N1 |
| Ratio for this model | 280 / 26 mm = 1 : 10.77. Motor at 582 rpm for the 54 rpm wash, 969 rpm for the 90 rpm distribution, 15,077 rpm for the 1400 rpm spin; belt speed 20.5 m/s | calc |
| Belt centre distance | 365 mm for a 1255 mm belt over 280/26 mm pulleys; 326 mm needs ~1182 mm (an 1180 PJ5 belt exists, sold as equivalent to Bosch 00264987 on ersatzteilshop.de) | calc |
| **Motor** types | universal (series-wound, brushes, tacho): 660 rpm wash, 14,400 rpm spin, 350 W / 850 W, ratio 12 (Electrolux, 1200 rpm drum); universal MCA 52, i = 1 : 15.6 (Whirlpool); brushless permanent-magnet motor with a belt (Bosch EcoSilence Drive); direct drive has no belt and turns at drum speed | E1, W1, B4, B5, N1 |
| Motor power, torque | typ. ~750 W, ~2 N·m | N1 |
| **Suspension** springs | 2 top springs (typ.); some designs use 3 springs, or 4 bottom struts | W1, S1, C1 |
| Spring rate | 5.0–6.0 N/mm each (Whirlpool's tuning range); 2.9 N/mm per strut × 4 (Asko) | P1, C1 |
| Dampers | 2 friction dampers below the tub (typ.); friction 60–120 N each (Suspa RD 18, its "proven standard damper"); Suspa range 20–250 N | W1, K1 |
| Counterweights | concrete (or cast iron) on the tub, one on top and one round the front: top 12.1–12.5 kg, front 11.4–14 kg, about 25 kg in all | K2, C2, W1, WG |
| Suspended mass | ~45 kg dry (measured Asko: tub system 35.6 + drum 6.7 + motor rotor 2.5 kg), plus up to ~16 kg of wet laundry | C1, calc |
| Resonance band | rigid-body modes at 70–105 rpm (sway) and 160–260 rpm (rocking) in a Whirlpool design; 100–300 rpm measured on another machine. Estimate: f = √(k/m)/2π = 2.5 Hz ≈ 150 rpm for 11 N/mm and 45 kg (40 mm static sag) | P1, S1, calc |
| Through the band | spread the load at ~90 rpm, check the unbalance, then ramp quickly past 100–300 rpm to a plateau. Whirlpool: plateaus at 300 and 600 rpm, at most 2 retries per ramp; final spin 90 → 960 rpm in ~90 s, then to maximum, up to 11 retries. Above ~300 rpm the tub runs supercritical | W1, S1 |
| At full spin | 1400 rpm = 23.3 Hz, ~9 × the 2.5 Hz bounce: undamped transmissibility ~1 % | calc |
| Unbalance force | a 0.5 kg lump at r = 235 mm and 1400 rpm pulls with 2.5 kN (257 kgf) | calc |
| **Water** supply | 0.5–10 bar (Whirlpool valve); 0.05–0.8 MPa (Electrolux) | W1, E1 |
| Inlet valve | solenoid valve, 8 l/min below 1 bar (AWO 12363), 8 l/min ±10 % above 1 bar (FL 5105); 4 l/min (older AWM 5100); 5.5–8 l/min (Electrolux) | W1, W2, E1 |
| Detergent drawer | 3 compartments: I prewash, II main wash, and softener (flower), which empties through a siphon. Two-way valve: one outlet flushes main wash, the other prewash, both together reach the softener (Electrolux). Whirlpool uses one valve and a motor-driven distributor | E2, W1 |
| Fill levels | level 1 at 50 ± 5 mm water column (31–42 mm of water in the drum), overflow at 280 ± 20 mm (267–306 mm) (Whirlpool). Electrolux analogue sensor: 25 kHz empty, 21.5 kHz at 350 mm | W1, E1 |
| Level sensing | air trap (pressure chamber) on the tub's sump, hose up to the pressure switch or sensor | W1, E1 |
| Heater | 1950–2050 W tubular element in the sump under the drum, 230 V, ≈ 26 Ω (Whirlpool R25 22–28 Ω; Electrolux 27 Ω) | W1, E1, calc |
| Temperature sensor | NTC in the heater: 35.9 kΩ at 0 °C, 9.8 at 30, 6.6 at 40, 4.6 at 50, 3.2 at 60, 1.1 kΩ at 95 °C (Whirlpool); others 5–21 kΩ at 25 °C | W1, E1 |
| Heating to 40 °C | 20 l + 8 kg cotton + drum + tub from 15 to 40 °C: ~0.76 kWh, ~23 min at 2 kW (water alone 0.58 kWh) | calc |
| Drain pump | synchronous, 30–35 W; 14 l/min at 1.25 m head (AWO 12363), 20 ± 2 l/min at 0.55–1.0 m (another Whirlpool), 25 l/min with 1.0 m maximum head (Electrolux) | W1, W2, E1 |
| Filter | coarse lint and coin filter in front of the pump, behind the bottom flap ("Filter set pump") | W1 |
| **Programme**, cotton 40 °C (typ.) | fill 3–5 min → heat ~20–25 min while tumbling → wash 30–60 min → drain + spin ~4 min → 2–3 rinses × 7–11 min (fill, tumble, drain, spin at 600–960 rpm) → final spin ~6–15 min | W1, calc |
| Real durations | AWO 12363 cotton: main wash 50–70 min, rinses 11 min each, final extract 15–18 min (about 2 h); Bosch 9 kg cotton 40 °C: 208 min; eco 40-60: 3:35 h (WAN28281GB) | W1, B3, B1 |
| Tumble | 54 rpm; cotton: 10–12 s on, 6–4 s pause (16 s period), reversing; delicates 4 s on / 12 s off; wool 1.5 s on / 30–62 s off | W1 |
| Distribution | 54 → 90 rpm in 24–30 s (AWO 12363), 95 rpm (FL 5105). Electrolux: checks from 55 rpm, works out the unbalance every 160 ms and nudges the speed by ±2 rpm, balanced by ~115 rpm | W1, W2, E2 |
| Spin speeds | 600–960 rpm between rinses; final 400–1400 rpm, selectable (WAN28281GB) | W1, B1 |
| Spin class bands (eco 40-60, weighted) | A < 45 %, B 45–54, C 54–63, D 63–72, E 72–81, F 81–90, G ≥ 90 % water left per dry mass | EU1 |
| Residual moisture vs speed | typ. ~70 % at 800, ~58 % at 1000, ~55 % at 1200, 50–53 % at 1400 (Bosch 52–54 %), ~44 % at 1600 rpm; little gain above ~1600 rpm | F2, B2, B3, J1 |
| Water left in the load | 8 kg dry at 53 % holds 4.2 kg of water | calc |
| Energy, water per cycle | cotton 40 °C: 1.35 kWh, 90 l (Bosch 9 kg); eco 40-60: 0.63 kWh, 48 l (WAN28281GB, class C) | B3, B1 |
| Class A for 8 kg | EEI ≤ 52, with SCE = −0.0025c² + 0.0846c + 0.392 = 0.909 kWh for c = 8, so ≤ 0.473 kWh per eco 40-60 cycle | EU1, calc |
| **Physics**: sticking speed (ω²r = g) | n = (60/2π)·√(g/r) = 61.7 rpm at r = 235 mm (59.8 at 250, 63.8 at 220); "60 to 80 rpm" for 30–50 cm drums | calc, C1 |
| Wash at 54 rpm | 0.77 g at the wall: on a smooth wall the clothes would leave it 50° above horizontal, 40° short of the top; the lifters carry them a little further, then they fall | calc |
| Distribution at 90 rpm | 2.1 g: the clothes are pinned to the wall and spread out | calc |
| g at 400 / 800 / 1400 rpm | 42 / 168 / 515 g at r = 235 mm (45 / 179 / 548 g at r = 250 mm) | calc |
| Why washing is slow | above ~62 rpm the clothes stick and stop falling, so they are no longer flexed, dropped and flushed by the wash water; the wash needs the lift-and-drop below ~0.8 g, and spinning only takes water out | calc, C1 |

## 5. The misconception

"People think the concrete block is dead weight that pins the cabinet to the floor; in fact it is bolted to the tub and hangs on the springs with it, because its job is to make the moving mass heavy and to bring that mass's centre forward to the middle of the drum, whose back carries the bearings, spider, pulley and motor." Above the resonance the spinning tub circles its own combined centre of mass. A 0.5 kg lump of wet clothes at r = 235 mm therefore swings a ~60 kg tub about 2.0 mm, but would swing a 35 kg tub without the concrete about 3.4 mm, and the springs pass proportionally less force to the cabinet [C2, W1, WG, calc]. Goes in: the counterweight callout, and the suspension or spin step.

## 6. Parts, grouped in chain order

| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
| Controls | `fascia` | Control panel | The programme dial and the display. Behind it a circuit board runs the programme: when to open the valve, heat, turn the drum and pump. | – |
| Controls | `control_board` | Control board | The machine’s timer: it reads the water level and temperature and switches the valve, the heater, the motor and the pump in turn. | – |
| Water in | `inlet_valve` | Inlet valve | Two electric valves on the cold supply. Each one feeds a different compartment of the drawer, so the right powder goes in at the right time. | – |
| Water in | `drawer` | Detergent drawer | Three compartments: prewash, main wash and softener. Water from the valve sluices one out at a time, down into the tub. | – |
| Water in | `dispenser` | Drawer housing | The box the drawer slides into. Water runs out of its back, down a wide hose into the top of the tub. | – |
| Water in | `hoses` | Hoses | Valve to drawer, drawer to tub, tub to pump and pump to the drain. The drain hose rises above the water level before it leaves, so the tub can’t siphon itself empty. | – |
| Water in | `heater` | Heater | A 2 kW element in the sump, under the drum, where the water lies. A sensor beside it tells the board when the water is warm enough. | – |
| Drive | `motor` | Motor | A small, fast motor bolted under the tub, so it swings with it. Carbon brushes feed its spinning coils. | – |
| Drive | `motor_rotor` | Motor’s rotor | The part that turns, with a small pulley on its end. It runs about 10.8 times as fast as the drum. | time, 581.5 rpm |
| Drive | `belt` | Belt | A ribbed rubber belt from the motor’s small pulley to the drum’s big one: a gearbox in one part. | – |
| Drive | `pulley` | Drum pulley | Bolted to the end of the drum’s shaft, behind the tub. Its size against the motor’s pulley sets the ratio. | time, 54 rpm |
| Drum | `drum` | Drum | Stainless steel, punched with small holes. Water gets in and out through them; clothes can’t. | time, 54 rpm |
| Drum | `spider` | Spider and shaft | A three-armed aluminium casting on the drum’s back, with the steel shaft that runs through the tub’s bearings to the pulley. | with Drum |
| Suspension | `tub_front` | Tub, front half | The outer drum that holds the water. It doesn’t turn, but it swings on its springs. The sump and the heater are in its bottom. | – |
| Suspension | `tub_rear` | Tub, back half | Carries the bearings in its hub, the motor underneath and the springs’ lugs on top. | – |
| Suspension | `bearings` | Bearings | Two ball bearings in the tub’s hub carry the drum’s shaft, sealed against the water inside. | – |
| Suspension | `springs` | Springs | The tub hangs from the cabinet’s top on two springs. They let it swing a few millimetres while the drum spins, so the cabinet doesn’t. | – |
| Suspension | `dampers` | Dampers | Two friction struts under the tub. They soak up the swinging, most of all as the drum speeds up through the speed where the tub would rock hardest. | – |
| Suspension | `counterweight` | Counterweight | A block of concrete on the tub’s top, about 8 kg. It makes the swinging mass heavy, so an uneven load shakes it less. | – |
| Suspension | `front_weight` | Front counterweight | A second block round the tub’s mouth, about 11 kg, which also brings the swinging mass’s centre forward, under the door. | – |
| Suspension | `bellows` | Door seal | A rubber bellows from the tub’s mouth to the cabinet’s front. It keeps the water in and lets the tub move while the cabinet stands still. | – |
| Water out | `drain_pump` | Drain pump | A small pump under the front, with a filter you can unscrew behind the flap to catch coins and buttons. | – |
| Water out | `pump_impeller` | Impeller | Four vanes spun by the pump’s motor fling the water out to the drain hose. | time, 180 rpm |
| Cabinet | `door` | Door | Its glass bowl reaches back into the seal and presses against it, so the water stays in the drum. | – |
| Cabinet | `front_panel` | Front panel | Enamelled steel with the door’s opening and the pump’s flap. | – |
| Cabinet | `top_lid` | Worktop | Two screws at the back hold it; it is the first thing off in a repair. | – |
| Cabinet | `side_left` | Left side | Enamelled sheet steel on a frame. | – |
| Cabinet | `side_right` | Right side | Enamelled sheet steel on a frame. | – |
| Cabinet | `back_panel` | Back panel | The water and the drain hose pass through it. | – |
| Cabinet | `frame` | Frame | A base with four corner posts and two top rails, from which the springs hang. | – |

## 7. Mechanism map

- **Time** drives it all. The drum and its pulley turn at 54 rpm (0.9 turns a second, the wash tumble); the motor's rotor at 10.77 times that through the belt; the drain pump's impeller at 3 turns a second (a two-pole synchronous motor on 50 Hz turns at 3,000 rpm [calc]; slowed so it can be seen).
- **Reused:** `speed` spins; the `run` experiment (Drive) and `speeds` (Tumble or spin: 54, 90, 800 and 1,400 rpm, with `rate` 0.15 so the spin can be followed); generic charts `timing` (the programme), `ladder` (motor to drum, and a log ladder of drum speeds) and `bars` (Heat, Suspension, Water out); flows `power` and `water`.
- **New:** the `water` flow (teal) and the `home` category. The suspension is static: springs and dampers don't stretch and the tub doesn't sway, since that would need a mechanism module of its own.

## 8. Tour (5–7 steps)

| # | Label | Shows (focus, flow) | Chart | Try |
|---|---|---|---|---|
| 1 | The idea | Drum, Spider and shaft, Tub, front half, Tub, back half | timing: A 40 °C cotton wash |  |
| 2 | Water in | Inlet valve, Hoses, Drawer housing, Detergent drawer; water flow |  |  |
| 3 | Heat | Heater | bars: Minutes to heat the water |  |
| 4 | Drive | Motor, Motor’s rotor, Belt, Drum pulley, Spider and shaft; power flow | ladder: Turns a minute, motor to drum | run, counting Motor, Drum |
| 5 | Tumble or spin | Drum, Spider and shaft; at 0.15× speed | ladder: How hard the wall pushes | speeds: 54 rpm / 90 rpm / 800 rpm / 1,400 rpm |
| 6 | Suspension | Springs, Dampers, Counterweight, Front counterweight, Tub, front half, Tub, back half | bars: How far the tub shakes at full spin |  |
| 7 | Water out | Drain pump, Impeller, Hoses, Tub, front half; water flow | bars: Water left in the clothes |  |

## 9. Simplified or left out

Said on the page too (`credit.extra` or the text).

- **A composite, not one brand:** Bosch WAN28281GB's outside size and drum volume, with the insides of Whirlpool Europe and Electrolux service manuals. Numbers marked *typ.* in section 4 are ranges, not one model's.
- **Motor:** one generic belt motor under the tub, drawn as a universal motor with brushes. Bosch's current motor is brushless (permanent magnets), and some makers use direct drive with no belt. No commutator, magnet or inverter detail.
- **Drive:** the belt ratio (280/26 mm = 1 : 10.77) is chosen to give a ~15,000 rpm motor at a 1400 rpm spin; no 1400 rpm service manual stated its ratio. The belt is a smooth loop, with no rib detail or stretch.
- **Drum:** real drums carry thousands of 2–4 mm holes; the model shows a pattern (and the pitch is assumed). The 3 lifters are simplified, and the embossing and seams are left out.
- **Tub:** one smooth shell, without the ribs, bosses and clamp ring between its two halves. The bellows gasket is a plain ring, without its folds, drain holes or spray nozzles.
- **Suspension:** springs and dampers do not stretch, and the tub does not sway (or only as an illustration). The six rigid-body modes are one "resonance band" of about 70–300 rpm. The two concrete blocks are shaped to weigh what the spares catalogues list (about 12.5 kg each, on top and round the front, at 2.3 kg a litre), not modelled on one machine's.
- **Water:** hoses are simplified, and the flows and volumes on screen are illustrative. The drawer has 3 compartments but no siphon detail. The air trap and pressure hose are schematic. Left out: Aquastop, flow meter, foam detection.
- **Electronics:** the control board is one box; the door lock, interference filter and wiring are left out.
- **Cabinet:** panels, plinth and feet are simplified; transit bolts and sound-deadening mats are left out.
- **Programme:** one representative cotton 40 °C timeline. Real machines adapt the fill, heating, number of rinses and spin to the load and the foam, so a full programme takes 2–3.5 h. Unbalance control appears as a hold at 90 rpm; real machines retry up to 11 times.
- **Residual moisture versus spin speed** is a typical curve; only the ~52–54 % at 1400 rpm is maker data.

## 10. Log

Built on 18 Oct 2026, in one session alongside the bicycle pump and the garden sprinkler: asked for at 16:06, posters at 16:44, with the research running in a subagent meanwhile. `npm run timing -- --item washing-machine` counts 24 min of active work on it: check 9, building it in code 6, model 3, content 3, ship 2.

| Stage | Budget | Active | Notes |
|---|---|---|---|
| 0 Brief | 5 min | 0 min | Tier C: no CC0 model with insides, so built wholly in code |
| 1 Truth | 15 min | (subagent) | Sections 1–5 and 9 by a research agent while the generator was written |
| 3 Model | 5 min | 3 + 6 min | generate.mjs, 30 parts; clashes fixed (door × bellows, dispenser × counterweight bolt, frame × fascia) |
| 4 Content | 15 min | 3 min | 8 callouts, 7 steps |
| 6 Check | 10 min | 9 min | QA 66/66; the springs made static (their explode crossed the tub's flange), the door given a two-leg path, callout cameras moved off moved panels |
| 7 Ship | 5 min | 2 min | Posters |
| Later | | | Counterweights enlarged from 19 to 25 kg to match the spares catalogues (section 4); the counterweight callout seen from the left, at 42% apart |
