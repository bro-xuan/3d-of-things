# Bicycle Pump: truth sheet

Tier B · slug `bicycle-pump` · started 2026-10-18

Fill this in before any geometry. Every number on the page (sizes, counts, ratios, timings) and every step of the tour comes from here, and the generator and the content builder read the same constants. Keep it short: tables and one-liners.

## 1. The object

- **Exactly what:** a generic single-acting track (floor) pump: painted metal barrel on a moulded three-legged base, wide T-handle on a 13 mm rod, hose clipped up the barrel to a lever-lock head (a ball needle clamped in it), no gauge. Poly Haven "Tire Pump" by Garrison Gager (3 Feb 2023, "The Shed" collection); its "POLYLOFT" label is fictional, so there is no real make, model or year. The numbers come from real pumps of the type: Topeak JoeBlow Sport III, SKS Rennkompressor, Silca Pista.
- **Real size:** 255 × 101 × 580 mm (W × D × H): Poly Haven's API and `npm run models:inspect` agree (not the 270 × 640 mm in the brief). On the mesh: barrel 33 mm outside, 461 mm showing (base collar top at 44 mm, top cap 506–525 mm); rod Ø 13 mm, 24 mm showing with the handle down; handle 255 mm wide at 549–580 mm; feet 250 × 95 mm; hose ≈6 mm. Real floor pumps stand 650–730 mm, so this one is short, but its barrel fits a real 30 mm bore: keep Poly Haven's scale.
- **The problem it solves:** getting 7 L of outside air into a 1 L road tube at 7 bar, or 10 L into a 5 L MTB tyre at 2 bar, in 20–35 strokes, with body weight rather than arm strength.
- **Its one big idea (the principle):** a piston shrinks a trapped volume of air until its pressure passes the tyre's; only then does a one-way valve let it through, and on the way back the piston's cup seal is itself the inlet valve. Push = gauge pressure × piston area, so a narrow 30 mm bore lets body weight reach 8–11 bar.

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | https://polyhaven.com/a/tire_pump ("Tire Pump", Garrison Gager, 2023); https://api.polyhaven.com/info/tire_pump | CC0 (cached `source.json`: CC0-1.0), checked by `npm run models:fetch` |
| Dimensions | API `dimensions` 254.9 × 101.0 × 579.5 mm; `npm run models:inspect -- bicycle-pump`; barrel, rod and cap rings measured on the cached glTF | as modelled: good |
| Pump specs | Topeak: topeak.com/global/en/product/1079-JOEBLOW-SPORT-III, /1561-JOEBLOW-MOUNTAIN-II, /956-JOEBLOW-ACE-DX, /446-CHECK-VALVE · SKS: bike-components.de p18203 (Rennkompressor), p89893 (NXT), p31190 (30 mm cup) · Silca 741 leather washer (sjscycles.co.uk) · Lezyne Classic Floor Drive (excelsports.com) · Park Tool PFP-8 (parktool.com) · Bontrager Charger (andyschleckcycles.lu) · Decathlon Floor Pump 900 (decathlon.com.kw) | maker pages good; retailer copies of maker specs fair |
| Mechanism | Park Tool, "PFP-6 and PFP-3 Service" (parktool.com/en-us/blog/repair-help/pfp-6-and-pfp-3-service) · US 5,538,398, R. J. Elson, 1996 (U-cup) · US 2014/0334954 A1, J.-C. Tsao, 2014 (O-ring piston, end-cap inlet) · US 6,076,544, B. E. Pierce / Bell Sports, 2000 (lever head) · Wikipedia, "Bicycle pump" | service guide and patents: good |
| Valves | Wikipedia, "Presta valve", "Schrader valve" · Schwalbe Tech Info 2015, p. 30 · J. Brandt, "Presta vs Schrader Valves" (sheldonbrown.com/brandt/presta-schrader.html) | good |
| Gauge | WIKA, Bourdon tube gauges (wika.com/en-au/lp_bourdon_tube_pressure_gauge.WIKA) · R. George, "How your pump pressure gauge works" (georgeron.com, 2009; a Park Tool pump) · Silca 210 psi gauge (performancebike.com) · Wikipedia, "Eugène Bourdon" | maker and teardown: good |
| Pressures | Schwalbe Tech Info 2015, pp. 36–37 (schwalbe.com/media/32/85/58/1694006374/Schwalbe-TechInfo-2015_GB.pdf) · Schwalbe road technology page (ETRTO 2019 table) · Roadman Cycling, MTB tyre pressure guide | maker good; guide fair |
| Physics | NASA Glenn, "Specific heats" and "Compression and expansion" (grc.nasa.gov/www/k-12/airplane/specheat.html, compexp.html) · Engineering Toolbox, "Compression and expansion of gases", "Specific heat of metals" · Brown et al., *Chemistry: The Central Science*, 14th ed., ch. 5 ex. 7 · ISO 2533 standard atmosphere | good |
| Real-world check | BikeRadar, B'Twin Floor Pump 900 review (47 cm stroke, strokes to fill) · 16 g CO2 chart on Performance Bike's Lezyne Trigger Drive listing | measured / chart: fair |

## 3. The energy chain

1. **Source:** your weight on the T-handle → the 13 mm rod → the piston: 141 N at 2 bar to 565 N at 8 bar on the 30 mm bore.
2. **Transmission:** the piston's cup seal, its lip flared against the barrel by the air below, squeezes the trapped 307 cm³ towards the 3 cm³ dead volume: compressed, warmer air.
3. **Control:** when the barrel's air passes the tyre's pressure the check valve (a rubber ball in the base's hose outlet) lifts; on the upstroke it reseats to keep the tyre's air in, while the cup's lip folds to let fresh air down from the top cap.
4. **Output:** hose → head (its rubber gasket squeezed round the valve stem by the cam lever) → the Presta valve pushed open, or the Schrader core held open by the head's pin → the tyre; a gauge on the outlet side would read the pressure.

## 4. Numbers

**model** = chosen for this teardown · typ. = typical range across makers · calc. = computed here (formula given) · est. = estimate, nothing published. Pressures are gauge (above atmosphere) unless marked abs; p_atm = 1.013 bar abs (ISO 2533).

**The pump**

| Quantity | Value | Source |
|---|---|---|
| Barrel bore (inner Ø) | **model 30 mm**; typ. 28–32 mm | Silca Pista: 28 mm steel 1917–2008, 30 mm aluminium since 2008 (Silca 741 copy); SKS 30 mm cup for the Rennkompressor (mfr no. 10150); Decathlon 900 "32 mm cylinder"; leaves a 1.5 mm wall in the model's 33 mm barrel |
| Piston area A | 7.07 cm² | calc. π·30²/4 mm² |
| Stroke | **model 430 mm**; typ. 380–490 mm | model: ≈470 mm inside the shell's barrel less ≈25 mm piston and end gaps (mesh); B'Twin 900 measured 470 mm (BikeRadar); 450 mm implied by Topeak's 318 cc at 30 mm; 485 mm by SKS NXT's 343 cm³ at 30 mm |
| Swept volume per stroke V_s | **model 304 cm³**; typ. 300–350 cm³ all-round; ≈720 cm³ MTB high-volume; ≈180 cm³ high-pressure stage | calc. A × stroke; Topeak JoeBlow Sport III 318 cc, Mountain II 722 cc, Ace DX 586 / 405 / 181 cc by stage; SKS Rennkompressor NXT 343 cm³ |
| Dead volume V_d (piston at the bottom) | **model est. 3 cm³** (≈1 % of V_s); est. range 2–5 cm³ | est.: 1–3 mm piston-to-base gap (1.4 cm³ at 2 mm) + the hollow under the cup's lip + the drilled passage to the check valve + the ball's cavity; set by where the stroke stops and how the base is drilled; not published |
| Free air delivered per stroke | 298 cm³ at 2 bar, 283 at 7 bar, 280 at 8 bar (92–98 % of V_s) | calc. V_s − V_d·(p_tyre/p_atm − 1), absolute pressures (Boyle) |
| Height of real pumps | typ. 650–730 mm | Lezyne Classic 650 mm (Excel Sports); SKS Rennkompressor 650 mm, NXT 730 mm; Topeak Sport III 27 in = 686 mm (its page also says 78.5 cm) |

**Seals and valves**

| Quantity | Value | Source |
|---|---|---|
| Piston seal | cup (U-cup) seal, lip facing down into the compression space: leather (Silca since 1917, steam-formed, 2.5 mm thick) or rubber (SKS); many current pumps use an O-ring instead (Lezyne HP floor pumps) | Silca 741 copy; SKS GU washer; Lezyne O-ring kit (bike-components.de) |
| Downstroke | the air below presses into the cup's hollow and flares its lip flat against the wall: it seals | US 5,538,398 |
| Upstroke | pressure below falls under atmospheric; the lip collapses and outside air is drawn past it "through the annular gap" | US 5,538,398; Wikipedia, "Bicycle pump" ("it provides its own valve") |
| Where the air comes in | through the top cap (round the rod, or a vent hole), down the space above the piston, past the lip | US 2014/0334954 A1 (air enters "via the through hole 14 of the end cap"); the path on this model is assumed |
| O-ring piston (variant) | the O-ring rides in a groove wider than itself: pushed to one side it seals; on the upstroke it sits against notches that let air by | US 2014/0334954 A1 |
| Lubrication | plunger gasket greased with silicone grease | Park Tool PFP-3/6 service (part #1087) |
| Check valve | in the base outlet: a rubber ball on a seat inside the base's hose fitting; barrel air lifts it, tyre air presses it shut; Topeak sells its check valve as a part (TRK-JB04-1) | Park Tool PFP-3/6 service; topeak.com check valve |
| If it sat in the head | the hose (72 cm × ≈4 mm ≈ 9 cm³) would become dead volume: see the limits below | calc. |

**Hose, head and gauge**

| Quantity | Value | Source |
|---|---|---|
| Hose | 72 cm (Topeak Sport III), 105 cm (Ace DX), 120 cm (SKS NXT); bore est. 3–4 mm (6–9 cm³); the model's hose ≈6 mm outside | topeak.com; bike-components.de; bore est.; mesh |
| Hose fill | first stroke only: 9 cm³ of hose at 7 bar holds 63 cm³ of free air (0.2 stroke) | calc. |
| Presta valve | 6 mm stem; no spring: tyre pressure holds the plunger shut; unscrew the knurled nut first; pump air pushes it open once hose pressure passes tyre pressure | Wikipedia, "Presta valve"; Schwalbe Tech Info p. 30 ("6 instead of 8 mm"); Brandt ("no valve spring to overcome") |
| Schrader valve | 8 mm stem, 0.305 in × 32 tpi thread; spring-assisted poppet core with a centre pin; A. Schrader 1891, US patent 1893 | Wikipedia, "Schrader valve" |
| How the head opens it | Schrader: a fixed pin in the head pushes the core's pin in and holds it open, so the pump needs its own check valve; Presta: no pin needed, its tip rests on the stop | US 6,076,544; Park Tool (Schrader ball-seat "with cross-shaped stud"); Brandt ("requires a check valve") |
| Lever lock | the lever's cam pulls a collet whose fingers squeeze a rubber gasket inwards round the stem: grip and seal; a Presta is not pulled down onto the pin | US 6,076,544 |
| Dual head | two reversible gaskets (Presta side has the smaller hole), two ball-seats and a ball that closes the unused side | Park Tool PFP-3/6 service |
| Gauge (none on this model) | C-shaped Bourdon tube: an oval-section tube bent ≈250°, sealed at its free end; pressure rounds the section and uncurls it; the tip turns a sector, pinion and pointer | WIKA; R. George (Park Tool gauge) |
| Gauge history | Eugène Bourdon, Paris patent 18 June 1849 | Wikipedia, "Eugène Bourdon" |
| Gauge range | typ. 0–11 bar / 160 psi (Topeak Sport III 3 in, Park PFP-8, Bontrager Charger 4 in, Decathlon 900 100 mm); 0–15 bar / 220 psi (Lezyne Classic 3.5 in); 0–16 bar (SKS); 0–4 bar / 60 psi on MTB pumps (Topeak Mountain II) | maker pages, retailer copies |
| Gauge accuracy | ±3 % (Silca 210 psi gauge, a diaphragm type, not Bourdon); 0.2 bar reading precision (Decathlon 900) | Silca listing; Decathlon |
| What it reads | sits on the outlet side of the check valve, so it reads hose pressure: above tyre pressure while air flows, the tyre's between strokes | Park Tool layout (ball in the base fitting, gauge on the hose); Brandt (a depressor is "necessary to read back pressure"); behaviour inferred |

**Pressures**

| Quantity | Value | Source |
|---|---|---|
| Road, 25 mm | typ. 6–8 bar: 6.0 / 7.0 / 8.0 bar for a ≈60 / 85 / 110 kg rider (tube); newer tubeless tables 4.8–7.0 bar for 55–85 kg | Schwalbe Tech Info p. 37; Schwalbe Pro One TLE table (ETRTO 2019) |
| MTB, 2.3–2.4 in | typ. 1.5–2.5 bar: trail 22–26 psi (1.5–1.8 bar), XC 28–32 psi (1.9–2.2 bar), 75 kg with tubes 1.7–2.0 bar; Schwalbe's tube table 2.0 / 3.0 bar at 60 / 85 kg (55–60 mm) | Roadman Cycling; Schwalbe Tech Info p. 37 |
| Pump maximum | typ. 11 bar / 160 psi (Topeak Sport III, Park PFP-8, Bontrager Charger, Decathlon 900); 15 bar / 220 psi (Lezyne Classic); 16 bar / 230 psi (SKS Rennkompressor); 18 bar / 260 psi (Topeak Ace DX, via a narrow third barrel); 4 bar / 60 psi (Topeak Mountain II) | maker pages |
| Leak-down | ≈1 bar a month is normal for a tube | Schwalbe Tech Info p. 36 |

**Why there is a maximum (calc.)**

| Quantity | Value | Source |
|---|---|---|
| Dead-volume limit | the outlet can only open while p_atm·(V_s + V_d)/V_d > p_tyre, abs (isothermal); adiabatic p_atm·((V_s + V_d)/V_d)^1.4 | Boyle and isentropic relations (Engineering Toolbox; NASA Glenn); the clearance-volume limit of any reciprocating compressor |
| Check valve in the base, V_d 3 cm³ | ratio 102 → 104 bar abs (660 bar abs adiabatic): far above any rating, not the limit | calc. |
| V_d 5 cm³ | 63 bar abs | calc. |
| Valve in the head, + 72 cm × 4 mm hose (V_d 12 cm³) | 27 bar abs; at 8 bar each stroke delivers only 209 of 304 cm³ | calc. |
| Valve in the head, + 120 cm × 5 mm hose (V_d 27 cm³) | 12.6 bar abs (11.6 bar): now it binds | calc. |
| Force limit | p_max = m·g/A on a 30 mm bore: 60 kg → 8.3 bar, 70 kg → 9.7 bar, 85 kg → 11.8 bar, 100 kg → 13.9 bar | calc. F = p·A |
| What sets a rating | body weight on the bore (a 30 mm bore is an ≈11 bar pump for an 85 kg rider), plus the gauge's scale and the hose, head and valve ratings; higher-pressure pumps narrow the bore: 70 kg reaches 16 bar only below ≈23 mm, 18 bar below 22 mm (Ace DX's third barrel ≈23 mm if its stroke is ≈450 mm) | calc.; Topeak Ace DX stages |

**Force at the handle (calc., 30 mm bore, no seal friction)**

| Tyre pressure | Push | vs a 70 kg person (687 N) |
|---|---|---|
| 2 bar | 141 N (14.4 kgf) | 21 % |
| 4 bar | 283 N (28.8 kgf) | 41 % |
| 6 bar | 424 N (43.2 kgf) | 62 % |
| 8 bar | 565 N (57.7 kgf) | 82 % |
| 11 bar (rating) | 778 N (79.3 kgf) | 113 % |

F = p·A with p gauge, since the space above the piston is at atmospheric. This is the peak, reached only once the outlet opens; before that the push climbs with the barrel pressure.

**Where the outlet opens (calc., V_s 304 cm³, V_d 3 cm³)**

| Tyre pressure | Opens after (isothermal / adiabatic) | Stroke left that moves air (of 430 mm) |
|---|---|---|
| 1.5 bar | 60 % / 48 % | 171 / 223 mm |
| 2 bar | 67 % / 55 % | 142 / 195 mm |
| 2.5 bar | 72 % / 59 % | 121 / 174 mm |
| 4 bar | 81 % / 69 % | 84 / 134 mm |
| 6 bar | 86 % / 76 % | 58 / 105 mm |
| 7 bar | 88 % / 78 % | 51 / 95 mm |
| 8 bar | 90 % / 80 % | 45 / 87 mm |
| 11 bar | 92.5 % / 84 % | 32 / 70 mm |

Isothermal x = 1 − [p_atm(V_s + V_d)/p_t − V_d]/V_s; adiabatic x = 1 − [(V_s + V_d)(p_atm/p_t)^(1/1.4) − V_d]/V_s, p absolute (Engineering Toolbox; γ = 1.4, NASA Glenn). A real quick stroke lies between (polytropic n 1–1.4, Engineering Toolbox): n = 1.2 gives 60 % at 2 bar and 83 % at 7 bar.

**Air and strokes (calc., isothermal, from flat, fixed tyre volume, V_s 304 cm³)**

| Quantity | Value | Source |
|---|---|---|
| 700×25c (ETRTO 25-622) air volume | ≈1.0 L; typ. 0.85–1.0 L | calc. torus 2π²Rr², R = 311 mm + r: 0.84 L for a 23 mm inside section, 1.00 L for 25 mm; the 16 g CO2 chart implies 0.99 L (700×23 at 130 psi) and 1.46 L (700×28 at 88 psi) |
| 29×2.3 (58-622) air volume | ≈5.3 L; typ. 4.9–5.6 L | calc. torus, 54–58 mm section; the CO2 chart implies 4.15 L (29×2.1 at 31 psi) and 5.84 L (29×2.5 at 22 psi) |
| Road tube to 7 bar | 6.9 L of outside air: 24 strokes (21 to 6 bar, 28 to 8 bar; 21 to 7 bar if 0.85 L) | calc. stroke by stroke: p_new = (p·V_t + p_atm·(V_s + V_d))/(V_t + V_d), 9 cm³ hose on the tyre side |
| MTB tyre to 2 bar | 10.5 L: 35 strokes (27 to 1.5 bar, 44 to 2.5 bar) | calc. |
| Real-world check | the same maths predicts 21 strokes for 700×26 to 80 psi, 29 for 29×2.4 to 20 psi, 30 for 700×40 to 50 psi; BikeRadar counted 21, 30 and 29 on a B'Twin 900 | BikeRadar review |

**Heat (calc. / est.)**

| Quantity | Value | Source |
|---|---|---|
| Why it warms | each stroke is quick, so the compression is nearly adiabatic: the work goes into the air, which passes heat to the barrel's lower end, where it is most compressed; seal friction adds a little | Brown et al., ch. 5 ex. 7; NASA Glenn |
| Peak air temperature (ideal adiabatic, from 20 °C) | 127 °C at 2 bar, 190 °C at 4, 236 °C at 6, 256 °C at 7, 274 °C at 8 bar | calc. T₂ = T₁·(p₂/p₁)^0.286, abs (NASA Glenn) |
| Air per stroke | 0.37 g; at 7 bar it carries ≈88 J of heat, about one stroke's work | calc. ρ = p/RT = 1.204 kg/m³, c_p = γR/(γ − 1) = 1005 J/kg·K |
| Work per stroke at 7 bar | 62 J (isothermal) to 86 J (adiabatic) | calc. ∫(p − p_atm)dV |
| Work for a road fill (1 L to 7 bar) | ≈1.0–1.2 kJ, nearly all of it ending as heat | calc. |
| Barrel warming | est. up to ≈10 K at the bottom of a steel barrel after a road fill, if half the work stays in its lowest 100 mm (117 g at a 1.5 mm wall, 490 J/kg·K → 57 J/K); less as it spreads into the base: warm to the hand, not hot | est.; Engineering Toolbox specific heat |

## 5. The misconception

"People think the air flows into the tyre for the whole downstroke; in fact the outlet stays shut while the piston only squeezes the trapped air, and opens only when the barrel's pressure passes the tyre's: at 7 bar after 88 % of the stroke (78 % for a quick, adiabatic stroke), so only the last 51–95 mm of 430 mm moves any air into the tube, and at 2 bar the last third; because the check valve and the Presta valve open only to a pressure difference (Park Tool's ball valve; Wikipedia, 'Bicycle pump'), and Boyle's law sets where in the stroke that happens (section 4)." It is also why the push is hardest only near the bottom. Goes in: a callout on the check valve, and the tour step on the stroke, with pressure plotted against stroke.

## 6. Parts, grouped in chain order

| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
| Push | `plunger` | Handle and piston | The T-handle, its rod and, at the rod’s foot, the piston with its rubber cup. Your weight goes down the rod. | crank on stroke |
| Push | `top_cap` | Top cap | Guides the rod. Air gets into the barrel round it on every upstroke. Unscrew it and the whole plunger lifts out. | – |
| Squeeze | `barrel` | Barrel | A tube 30 mm across inside. A full stroke sweeps about 300 cm³ of air. | – |
| Valve | `base` | Base | You stand on it. A passage inside takes the air from the barrel’s foot across to the hose. | – |
| Valve | `check_valve` | Ball valve | A rubber ball on a seat in the outlet. Air lifts it to get out; between strokes the tyre’s pressure presses it back down. | cam on stroke |
| Out | `hose` | Hose | Carries the air from the base to the head. It holds the tyre’s pressure between strokes. | – |
| Out | `head` | Head | A lever squeezes a rubber gasket round the tyre’s valve stem. A pin inside holds a Schrader valve open; a Presta valve is pushed open by the pump’s own air. | – |

## 7. Mechanism map

- **A hidden driver:** `stroke`, an empty node under the base (kit `hiddenDriver`, so the build's prune keeps it), turns at 0.5 turns a second. The plunger follows it with a `crank` motion (throw half the 420 mm stroke, a rod long enough that the stroke is close to a sine) and the check valve's ball lifts on a `cam` on the same driver for 44° of each turn, at the bottom of the downstroke (phase −158°).
- **Rest pose:** the plunger is moved up by the stroke in the build, so the model rests at the top of its stroke and every framing holds the whole stroke.
- **Reused:** `crank` and `cam` (made for the family car's engine); the `run` experiment (Push); generic charts `bars` (Push, Filling) and `timing` (Squeeze); flows `power` and `air`.
- **New:** `hiddenDriver` in the kit, and a viewer fix: crank throws and cam lifts are now model units whatever the parent's scale (src/viewer/rig.ts). They had been applied in the glTF's metres, which moved the plunger twice its stroke, and the family car's pistons the wrong distance too.

## 8. Tour (5–7 steps)

| # | Label | Shows (focus, flow) | Chart | Try |
|---|---|---|---|---|
| 1 | The idea | Handle and piston, Barrel |  |  |
| 2 | Push | Handle and piston, Barrel, Top cap; power flow | bars: Push needed on the handle | run, counting Strokes |
| 3 | Squeeze | Handle and piston, Barrel, Ball valve; air flow; at 0.4× speed | timing: One stroke, slowed down |  |
| 4 | Refill | Handle and piston, Top cap, Barrel; air flow |  |  |
| 5 | Out | Base, Ball valve, Hose, Head; air flow |  |  |
| 6 | Filling | Barrel, Base, Handle and piston | bars: Strokes to fill |  |

## 9. Simplified or left out

Said on the page too (`credit.extra` or the text).

- No gauge on this model: the Bourdon gauge is in the text only (or generated, with a 0–11 bar scale, if wanted).
- Bore 30 mm, stroke 420 mm (section 4's 430 mm, cut to clear the plug in the barrel's foot) and dead volume 3 cm³ are chosen to fit the shell and match makers' figures; the model's maker gives none.
- One rubber cup seal; leather cups and O-ring pistons are only mentioned.
- The check valve is drawn as a rubber ball in the base outlet (Park Tool's layout); makers differ.
- The head is one lever-lock chuck (gasket, cam, Schrader pin); the dual head's ball and seats and the Presta lock nut are left out, and the ball needle in the model's head stays as modelled.
- The inlet through the top cap is assumed, and the hose bore (≈4 mm) is estimated.
- The physics is an ideal gas between the isothermal and adiabatic bounds: no seal friction, no valve cracking pressure or core spring, no flow losses in the hose, and the tyre's volume is fixed while it fills (a flat tube is smaller).
- Tyre volumes are tori from ETRTO sizes; the heating is an estimate, not simulated.

## 10. Log

Built on 18 Oct 2026, after the washing machine, from Poly Haven's Tire Pump (tier B: one mesh, opened and given its insides). Posters at 17:00. `npm run timing -- --item bicycle-pump` counts 15 min of active work: check 6, model 2, augment 2, content 2, ship 2, orientation 1.

| Stage | Budget | Active | Notes |
|---|---|---|---|
| 0 Brief | 5 min | 1 min | Tier B |
| 1 Truth | 15 min | (subagent) | Research agent, in parallel |
| 3 Model | 5 min | 2 + 2 min | augment.mjs: pieces sorted by bounds; piston, cup seal, air channel and ball valve generated; the stroke cut from 430 to 420 mm to clear the barrel's foot plug |
| 4 Content | 15 min | 2 min | 6 callouts, 6 steps |
| 6 Check | 10 min | 6 min | QA 48/48; found the crank scaling bug (the plunger travelled twice as far) and fixed it in the viewer |
| 7 Ship | 5 min | 2 min | Posters |
