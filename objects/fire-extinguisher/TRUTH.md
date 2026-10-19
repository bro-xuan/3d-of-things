# Fire Extinguisher: truth sheet

Tier B · slug `fire-extinguisher` · started 2026-10-19

Fill this in before any geometry. Every number on the page (sizes, counts, ratios, timings) and every step of the tour comes from here, and the generator and the content builder read the same constants. Keep it short: tables and one-liners.

## 1. The object

- **Exactly what:** a Korean 3.3 kg ABC dry-powder, stored-pressure (축압식) portable extinguisher, charged with nitrogen, on its pressed stand. The shell is Poly Haven's "Korean Fire Extinguisher 01" (UM JOORIN, 2021); its own label reads "분말(ABC)소화기 3.3kg", its stand "소화기" ("fire extinguisher"), and its gauge reads 0–15 ×10⁻¹ MPa with a green band of about 0.7–0.98 MPa, the Korean stored-pressure band. No maker or model is named (the dial's "MADE BY UM JOO RIN Co., Ltd." is the modeller's joke), so the numbers are those of Korean 3.3 kg ABC units on sale (section 4).
- **Not EN 3:** the brief's example was an EN 3 unit at about 14–15 bar. The model's dial and label are Korean, and a 0.7–0.98 MPa green band can't show a 15 bar charge, so the page is the Korean unit.
- **Real size:** listed units are Ø 141–145 mm × 407–424 mm tall, 4.95–5.5 kg charged. Poly Haven's mesh is 280 × 367 × 659 mm with its stand; its cylinder is Ø 181 mm, about 1.28 times a real 3.3 kg unit's. The build scales it by 0.78 to a Ø 141 mm cylinder: 218 × 514 × 287 mm with the stand, 466 mm from the cylinder's foot to the lever's top (the modeller's proportions are about 10% taller than the listings).
- **The problem it solves:** one person putting out a small fire in its first minute, with something that has sat unattended for years and must work at once.
- **Its one big idea (the principle):** the push is stored inside. Nitrogen at about 9.6 bar shares the tank with the powder; opening the valve lets the gas drive the powder up a dip tube from the bottom and out of the hose, and the gas goes with it, so the pressure falls as the tank empties.

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | https://polyhaven.com/a/korean_fire_extinguisher_01; https://api.polyhaven.com/info/korean_fire_extinguisher_01 (author UM JOORIN, published 15 June 2021, 9,913 polygons, 279.96 × 367.44 × 659.25 mm) | CC0 (Poly Haven; cached `source.json`), checked by `npm run models:fetch` |
| Type and band | The model's own label ("분말(ABC)소화기 3.3kg") and dial (0–15 ×10⁻¹ MPa, green ≈ 0.7–0.98), read off its texture | as modelled: good |
| Korean 3.3 kg units | 대동소방 ABC 3.3 kg (danawa.com pcode 5544692): 11 s, 4–6 m, 5.31 kg · 에이치티씨 (pcode 18152906): 10 s, 4–5 m, 4.95 kg · 에프아이씨 (pcode 2701273): 5.5 kg, 145 × 424 mm · 한국소방 (toolsfarm.co.kr no=5751): 12 s, 4–5 m, 5.2 kg · imported unit (intelrior.com): Ø 141 × 407 mm, steel, nitrogen · 세진소방 (sejinmart.co.kr): charge 9.8 kgf/cm², test 19.6 kgf/cm², 5.15 kg, 9 s, 3–4 m · 11번가 887747710: 12 s, 4–5 m | retailer copies of makers' figures: fair |
| EN 3 9 kg units (sizing the shell) | Blazex BXP9 Ø 190 × 585 mm; Viking PS9 Ø 190 × 545 mm; Sides 9 kg Ø 180 × 640 mm; Survitec PP9P (sides.fr, viking-life.com, survitecgroup.com) | makers: good; used only to rule out a 9 kg reading of the shell |
| Powder | Wikipedia, "ABC dry chemical" (monoammonium phosphate with ammonium sulphate in 40–60, 60–40 or 90–10 mixes; fluidised and siliconised; melts at about 180–200 °C on class A; non-conductive) · Wikipedia, "Monoammonium phosphate" (density 1.80 g/cm³) | encyclopaedia: fair |
| Use | Boston University EHS, "The PASS method" (bu.edu/ehs/?p=14190) · OSHAcademy course 629, 3.7 (stand about 8 ft, 2.4 m, away) | good / fair |
| Physics | ideal gas, isothermal; choked flow of nitrogen (γ = 1.4, R = 296.8 J/kg·K) | textbook |

## 3. The energy chain

1. **Source:** nitrogen at 9.6 bar (about 35 g in 2.85 L: the litre above the powder and the gaps between its grains), put in when it was filled; the gauge reads it.
2. **Transmission:** the gas presses on the powder and stirs it; powder and gas enter the dip tube's mouth 12 mm off the bottom and rise 33 cm up the 13 mm tube into the valve.
3. **Control:** the safety pin out, the squeeze lever turns 17.7° about its pin and pushes the stem 3.2 mm down; the stem's rubber seal leaves its seat; let go and the return spring and the tank's pressure close it.
4. **Output:** through the valve's side outlet, about 35 cm of hose and the nozzle: a cloud of powder thrown 4–6 m onto the fire, where monoammonium phosphate breaks the flames' chain reactions and, on class A fuel, melts into a crust.

## 4. Numbers

**model** = chosen for this teardown · calc. = computed here · est. = estimate, nothing published · typ. = across the listed makers. Pressures are gauge (above atmosphere, 1.013 bar) unless marked abs.

**The extinguisher**

| Quantity | Value | Source |
|---|---|---|
| Charge | 3.3 kg ABC powder | the model's label; every listing |
| Charged mass | typ. 4.95–5.5 kg; page: about 5.2 kg | listings |
| Size | typ. Ø 141–145 × 407–424 mm; model Ø 141 mm, 466 mm tall without its stand | listings; mesh × 0.78 |
| Charge pressure | **model 9.6 bar** (0.96 MPa = 9.8 kgf/cm²) at 20 °C | 세진소방 listing (충전압력 9.8 kg/cm²) |
| Gauge | 0–1.5 MPa (0–15 bar), green ≈ 0.7–0.98 MPa (7–9.8 bar); 7° a bar, 0 at 75° left of the top | the model's dial (texture) |
| Test pressure | 19.6 kgf/cm² (1.92 MPa), twice the charge | 세진소방 listing |
| Discharge time | typ. 9–12 s; **model 11.2 s** of powder (calc. below) | listings |
| Range | typ. 3–6 m; page: 4–6 m, as most makers list | listings |
| Fire classes | A, B, C (한국소방 lists A3/B4/C units) | listing |

**Tank and charge (calc. from the scaled shell)**

| Quantity | Value | Source |
|---|---|---|
| Cylinder wall | **model 1.6 mm** steel | est. |
| Tank volume (inside, above the dished bottom, below the valve's spigot) | 4.68 L | calc. by slices from the shell's measured profile |
| Powder bulk density | **model 0.9 kg/L** (ABC powders about 0.8–1.0) | est. |
| Powder volume | 3.67 L, to 251 mm above the floor (78% of the tank) | calc. 3.3 / 0.9 |
| Space above the powder | 1.02 L | calc. |
| Powder grains themselves | 1.83 L (monoammonium phosphate 1.80 kg/L) | calc.; Wikipedia |
| Nitrogen's whole volume | 2.85 L (above the powder and between its grains) | calc. 4.68 − 1.83 |
| Nitrogen's mass | 34.7 g at 9.6 bar, 20 °C | calc. m = pV/RT, p 10.61 bar abs |
| Powder the dip tube can't reach | 0.10 kg (below its mouth, 12 mm off the 78 mm floor) | calc. from the geometry |
| Dip tube | **model** Ø 13 mm outside, 10 mm bore, mouth 12 mm off the bottom | est. |

**The valve (model, laid out in the shell's head)**

| Quantity | Value | Source |
|---|---|---|
| Stem stroke | **model 3.2 mm** | est. |
| Lever | turns 17.7° about its pin to push the stem 3.2 mm; the grip is about 12 times as far from the pin as the stem | calc. from the shell's lever and boss (pin at the back of the head, the stem under the head's top boss) |
| Seal and seat | rubber disc Ø 11.6 mm under a Ø 6 mm seat; the tank's pressure and the spring hold it shut | model; generic layout |
| Return spring | 5 turns, Ø 7.8 mm, 11.6 mm long closed | model |

**The discharge (the model in src/viewer/extinguisher.ts)**

| Quantity | Value | Source |
|---|---|---|
| Gas | isothermal: the 3.3 kg of powder holds the gas near room temperature | assumption |
| Pressure | p_abs = m_N2·R·T / V_gas, V_gas = 4.68 L − powder left / 1.80 kg/L | calc. |
| Powder flow | **model 0.48 kg/s** at 9.6 bar, falling with √p | est., calibrated to the listed 9–12 s |
| Gas carried with it | **model 1 kg of nitrogen per 130 kg of powder** | est., calibrated so the powder runs out with about 1 bar left |
| Result, lever held | powder out after 11.2 s with 0.9 bar left; then the last nitrogen blows through in under a second | calc. |
| Upside down | gas alone through the nozzle, choked: C_d·A = 12.8 mm² (a Ø 5 mm throat × 0.65); 9.6 bar to nothing in about 2.5 s, all 3.3 kg of powder left | calc.; throat est. |
| Gauge with temperature | the same charge reads 8.2 bar at −20 °C, 10.3 bar at 40 °C | calc. p_abs ∝ T |

**Pressure against time, lever held, upright (calc.)**

| Seconds | 0 | 1.5 | 3 | 4.5 | 6 | 7.5 | 9 | 10.5 | 11.2 |
|---|---|---|---|---|---|---|---|---|---|
| Bar | 9.6 | 7.1 | 5.4 | 4.1 | 3.1 | 2.4 | 1.7 | 1.2 | 0.9 |
| Powder left, kg | 3.30 | 2.67 | 2.13 | 1.66 | 1.25 | 0.89 | 0.58 | 0.31 | 0.10 |

## 5. The misconception

"People think the gas in an extinguisher is what puts the fire out; in fact the 35 g of nitrogen is only the push and the 3.3 kg of powder does the work, because the gas leaves through the same dip tube as the powder and is useless on its own: held upside down, the tube's mouth is in the gas, which empties in about 2.5 s and leaves all the powder behind (section 4)." Goes in: the hook, the Nitrogen part's about, the Dip tube callout, and tour step 5 (Empty), whose chart draws the upside-down discharge beside the upright one and whose experiment can turn it over.

## 6. Parts, grouped in chain order

| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
| Store | `cylinder` | Cylinder | A pressed-steel tank 141 mm across that holds 4.7 litres. Makers test it to twice the charge’s pressure. | – |
| Store | `cylinder_front` | Cylinder, front half | Cut away on this model so the powder and the dip tube inside can be seen. | – |
| Store | `stand` | Stand | Keeps it upright and in plain sight. 소화기, on its front, is Korean for fire extinguisher. | – |
| Push | `nitrogen` | Nitrogen | About 35 g of dry nitrogen at 9.6 bar: a litre above the powder and nearly two more in the gaps between its grains. It only pushes. | – |
| Push | `gauge` | Gauge | Reads the nitrogen’s pressure all the time, in tenths of a megapascal (bar). Green, 7 to 9.8 bar, means ready. | – |
| Charge | `powder` | Powder | 3.3 kg of ABC powder, mostly monoammonium phosphate, ground fine and coated so it pours like a liquid when the gas stirs it. | – |
| Charge | `dip_tube` | Dip tube | A tube 13 mm across from the valve to 12 mm off the bottom. Everything that comes out comes up it, so it only works upright. | – |
| Valve | `valve_body` | Valve body | Screwed into the tank’s neck with an O-ring. Inside it are the seat, the stem’s seal, the spring and the passages to the hose and the gauge. | – |
| Valve | `valve_stem` | Stem and seal | The tank’s pressure and the spring hold its rubber seal up against the seat. The lever pushes it 3.2 mm down to open it. | control: ext_lever |
| Valve | `valve_spring` | Return spring | Shuts the valve again when the lever is let go, so a burst can be stopped and started. | control: ext_lever |
| Hand | `safety_pin` | Safety pin | Goes through the handle and the lever so the lever can’t move. The plastic tie on it shows whether it has been pulled. | control: ext_pin |
| Hand | `squeeze_lever` | Squeeze lever | Turns on a pin at the back of the head. 18° of travel pushes the stem 3.2 mm; the grip is twelve times as far from the pin as the stem is. | control: ext_lever |
| Hand | `carry_handle` | Carry handle | Fixed to the head. Carry it by this, and squeeze the lever down towards it. | – |
| Out | `hose` | Hose | About 35 cm of rubber hose from the side of the valve, so the jet can be aimed without lifting the tank. | – |
| Out | `nozzle` | Nozzle | Narrows the stream into a jet that throws the powder 4 to 6 m. Clipped to the band until it’s needed. | – |

## 7. Mechanism map

- **New mechanism:** `src/viewer/extinguisher.ts` (no three.js), chosen when a motion uses the control `ext_lever`. It holds the charge (powder and nitrogen, kg) and steps the discharge of section 4 while the valve is open; it sets four controls: `ext_pin` (0–1, the pin pulled), `ext_lever` (0–1, the lever squeezed; it only moves once the pin is out, at 6 per second), `ext_bar` (gauge bar) and `ext_used` (0–1 of the powder gone). The seal is off its seat once the lever has taken up a fifth of its travel.
- **Driven through the Linkage** (`control` motions, nothing time-driven): the lever turns 17.7° about its pin (`turn`); the stem slides 3.2 mm, and each of the spring's five turns its share of that (`slide`), so the spring squeezes up; the pin slides 78 mm out of the back; the needle turns 7° a bar from 9.6 bar (`turn`, `from`); the powder's 12 slices telescope down (`curve` + `slide`), each one narrower than the one below, its cut face turned a little further back so nested faces never coincide.
- **Experiment:** `discharge` (step 4: pull the pin, hold to squeeze, upright or upside down, recharge) and `squeeze` (step 5: the same with the pin already out). Readout: pressure, powder left, flow, seconds.
- **Chart:** `extinguisher-discharge` (src/charts/extinguisher.ts): gauge bar and powder left against seconds, upright and upside down, from the module's own `dischargeCurve`; a dot and a cursor follow the model.
- **Wired in:** src/viewer/Viewer.ts (the module, its tick, `extinguisherState`, `pullPin`, `squeezeLever`, `invertExtinguisher`, `rechargeExtinguisher`, reset when the tour closes), src/charts/index.ts (`extinguisher()` on the chart source, the chart's registration), src/pages/tour.ts (the source and the experiment), src/types.ts (doc comments).
- **Flows:** `power` (vermilion) for the powder's path, `air` (blue) for the nitrogen's push in step 2.

## 8. Tour (5–7 steps)

| # | Label | Shows (focus, flow) | Chart | Try |
|---|---|---|---|---|
| 1 | The idea | Nitrogen, Powder, Dip tube, Valve body, Hose, Nozzle; power flow |  |  |
| 2 | Push | Nitrogen, Gauge, Valve body |  |  |
| 3 | Up | Powder, Dip tube; power flow |  |  |
| 4 | Valve | Stem and seal, Return spring, Squeeze lever, Safety pin; power flow |  | discharge |
| 5 | Empty | Powder, Dip tube, Gauge, Valve body, Squeeze lever, Stem and seal; power flow | extinguisher-discharge: Pressure as it empties | squeeze |
| 6 | Out | Hose, Nozzle, Valve body; power flow |  |  |

## 9. Simplified or left out

Said on the page too (`credit.extra` or the text).

- The shell is scaled by 0.78 to a real 3.3 kg unit's 141 mm cylinder; its height then comes out about 10% over the listed units' (the modeller's proportions).
- The discharge is a simple model: the gas stays at room temperature, the powder's flow goes with the square root of the pressure, and the gas leaves with it in a fixed proportion (1 kg per 130 kg), calibrated to the makers' 9–12 s; there is no hose or nozzle loss, and the jet's range isn't computed.
- The valve's insides (stem, seal, seat, spring, spigot, passages) are a generic layout placed under the shell's top boss and the lever as modelled; real valves differ by maker. The stem's 3.2 mm stroke, the dip tube's size and the wall's 1.6 mm are estimates.
- The powder and the nitrogen are drawn cut away like the cylinder (their back halves), the nitrogen as a faint veil over the whole tank, since it also fills the gaps between the grains. The powder's level falls in 12 telescoping slices, in proportion to the mass gone; drawn, it stops about 3 cm above the floor.
- The powder is drawn pale pink, the colour ABC powder is usually dyed in Korea (not confirmed at a primary source); nothing on the page claims a colour.
- The gauge's Bourdon tube isn't modelled; the modelled needle is turned to 9.6 bar. The tamper seal is a plain tie and tag. Upside down is shown by the chart and the readout, not by turning the model over.
- Korean type-approval rules (the KFI technical standard) weren't found in a citable form, so the page uses the dial and makers' listings rather than the standard's figures.

## 10. Log

Run `date` at each stage; at twice a stage's budget, tell the user where it stands.

Built on 19 Oct 2026 in 1 h 16 min from the scaffold to the last check (11:36–12:52), against a tier B budget of 15–60 min: the research subagent's 30 min, whose report never arrived, is most of the overrun; a new mechanism (module, chart, two experiments) the rest.

| Stage | Budget | Started | Done | Notes |
|---|---|---|---|---|
| 0 Brief | 5 min | 11:36 | 11:39 | Tier B. Poly Haven model checked (CC0, UM JOORIN); the brief's EN 3 example dropped once the shell's dial and label proved Korean |
| 1 Truth | 15 min | 11:39 | 12:47 | Research subagent ran 30 min (11:39–12:09) and its report never came back, so the research was done by hand alongside the model; sheet written last |
| 2 Scaffold | 2 min | 11:36 | 11:37 | `npm run new` (the scaffold set order 14; set to 15) |
| 3 Model | 30 min | 12:09 | 12:30 | 25 shell islands sorted into parts; cylinder and band cut in half and solidified; scale 0.78; generated dish, nitrogen, 12 powder slices, dip tube, spigot, passages, stem and seal, 5-turn spring, tamper seal; needle turned to 9.6 bar |
| 4 Content | 15 min | 12:26 | 12:35 | 15 parts in 6 groups, 7 callouts, 6 steps |
| 5 Mechanism | (new) | 12:15 | 12:32 | extinguisher.ts, the discharge chart, the `discharge`/`squeeze` experiments, viewer wiring |
| 6 Check | 10 min | 12:35 | 12:47 | QA 55/55; fixed: front half came off towards the camera, dip tube hidden in the powder (powder and gas cut away), transmission gas washing out the powder (now an alpha veil), valve body solid in the valve step, callouts left apart; at the lead's request the explode was made compact (front half out 30 then right 150, hose out 70, stand down 55, the head left on its neck) so the model clears the thumbnails and the drawings at 100% |
| 7 Ship | 5 min | 12:47 | 12:52 | posters, truth tables, README, build; regression 14/14 and the skill page pass, reproduce identical (with models) |
