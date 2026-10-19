# Personal Cassette Player: truth sheet

Tier B · slug `cassette-player` · started 2026-10-18

Fill this in before any geometry. Every number on the page (sizes, counts, ratios, timings) and every step of the tour comes from here, and the generator and the content builder read the same constants. Keep it short: tables and one-liners.

## 1. The object

- **Exactly what:** a generic personal stereo cassette player with an AM/FM radio, of the Walkman kind (Sony's TPS-L2 started the type on 1 July 1979). Poly Haven "Portable Cassette Player" by Mateusz Sadek (2026, "Project Lighthouse" collection): a teal player whose "Music-a-Tron pro" name is fictional, and a black cassette ("SDQ", fictional) standing beside it. No real make or model, so the transport's numbers come from the format (Philips Compact Cassette, 1963), Sony's patent and service manuals, and typical parts.
- **Real size:** player 97 × 130 × 37 mm (W × H × D, `npm run models:inspect`); the cassette 62 × 99 × 12 mm on the mesh, against the format's 63.5 × 101.6 × 12.7 mm (4 × 2.5 × 0.5 in), so the model is at true scale within 3 %.
- **The problem it solves:** play music from a cassette in a pocket, on two AA cells, with the pitch steady: the tape has to pass the head at exactly 4.76 cm/s however full each reel is, while being carried and shaken.
- **Its one big idea (the principle):** a steel pin (the capstan) turning at a fixed speed, with a rubber roller squeezing the tape against it, meters the tape; everything else (the reels, the clutch, the felt pad) only keeps the tape taut and in place. A heavy flywheel on the capstan smooths the small motor's speed.

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | https://polyhaven.com/a/portable_cassette_player ("Portable Cassette Player", Mateusz Sadek); https://api.polyhaven.com/info/portable_cassette_player (dimensions 172.3 × 39.7 × 130.3 mm for player and cassette side by side) | CC0, checked by `npm run models:fetch` |
| Dimensions | the mesh, measured with sections (well, spindles 41.5 mm apart, capstan and locating holes in the cassette) | as modelled: good |
| Format | Wikipedia, "Compact Cassette" (speed 4.7625 cm/s, 3.81 mm tape, four tracks of 0.6 mm, shell 4 × 2.5 × 0.5 in, Philips 28 Aug 1963, TPS-L2 1 Jul 1979) and "Audio tape specifications" (C60 16–18 µm and 90 m at Maxell, C90 11–12 µm) | encyclopaedia, cited: fair–good |
| Capstan and pad | B. Dormon, "50 years of the Compact Cassette", The Register, 30 Aug 2013, p. 3: Philips's 2 mm capstan, kept small "to reduce its flywheel size"; the pressure pad on "a short piece of sprung metal" pressing "between 0.1N and 0.2N"; take-up through "a slipping clutch" | journalism from Philips history: fair |
| Drive layout | US 4,630,149 (M. Ida, Sony, 1986), "Compact cassette tape player with capstan drive motor under spindle": belt from the motor pulley round the capstan flywheel; the flywheel masks "vibration and irregular rotation of the motor"; a felt friction plate between the play reel gear and the take-up hub, "permitting relative slippage" | patent: good |
| Torques | Sony WM-FX855 service manual: take-up 18–30 g·cm (FWD), back tension 0.7–2.0 g·cm, FF/REW > 35 g·cm; WM-FX561: 20–30, 0.4–2.0, > 40 g·cm (all-guidesbox.com scans) | service manuals: good |
| Motor | audioappraisal.com, "Repairing cassette capstan and turntable DC motors": most capstan motors 2400 rpm, governed mechanically or electronically; portables use 3 V motors "constructed differently"; Mabuchi EG-530AD-2B listing, 2400 rpm | repair guide: fair |
| Physics exercise | Brock University PHYS 1P21, "cassette" problem: tape at 4.7625 cm/s set by the capstan, not the hubs | exercise: fair |

## 3. The energy chain

1. **Source:** two AA cells (3 V) → a small DC motor with an electronic speed governor, 2400 rpm.
2. **Transmission:** a rubber belt 0.6 mm thick from the motor's 4 mm pulley to the 23.7 mm flywheel (5.28 : 1 on the belt's pitch diameters, 4.6 and 24.3 mm); the flywheel is on the capstan's shaft, so the 2 mm capstan turns at 455 rpm.
3. **Control:** the pinch roller presses the tape against the capstan, so the tape moves exactly as fast as the capstan's surface: 4.76 cm/s. A small pulley on the capstan shaft and a second belt drive the take-up spindle through a felt slip clutch that always turns faster than the reel needs, so it only keeps the tape taut; the supply reel is pulled round against a light brake.
4. **Output:** the tape passes the playback head, held against it by the cassette's felt pressure pad; the magnetised tape induces a voltage in the head's coils, which the amplifier turns into sound in the headphones.

## 4. Numbers

**model** = chosen for this teardown · typ. = typical · calc. = computed here · est. = estimate, nothing published found.

**Tape and cassette**

| Quantity | Value | Source |
|---|---|---|
| Tape speed | 4.7625 cm/s (1⅞ in/s) | Wikipedia, "Compact Cassette" |
| Tape width | 3.81 mm (0.15 in) | Wikipedia, "Audio tape specifications" |
| Tracks | four, in two stereo pairs: each channel 0.6 mm wide, 0.3 mm apart; side A's pair on one half of the tape | Wikipedia, "Compact Cassette" |
| C60 | 30 min a side; 85.7 m in theory, 90 m (Maxell); 16–18 µm thick | Wikipedia (both pages) |
| C90 | 45 min a side; ≈ 135 m; 11–12 µm | Wikipedia |
| Shell | 101.6 × 63.5 × 12.7 mm in the format; 98.6 × 61.7 × 11.7 mm on the mesh | Wikipedia; mesh |
| Hub spacing | **model 41.5 mm** between centres (the player's spindles and the cassette's hubs agree) | mesh |
| Hub diameter | **est. 22 mm** (radius 11 mm) | est.: no free source found; consistent with the shell (a full pack of 49 mm then fits 8.8 mm from the tape edge) |
| Full pack (C60: 90 m × 17 µm = 1530 mm²) | radius 24.7 mm | calc. R = √(r² + A/π) |
| Capstan holes | Ø 5.4 mm, 23.9 mm either side of the centre, 1.8 mm behind the tape | mesh |
| Locating holes | ≈ 4 × 4.4 mm, 15.3 mm either side of the centre | mesh |
| Head opening | 18 mm wide, centred | mesh |
| Corner guide rollers | two, ≈ 41 mm either side of the centre | mesh (the exposed tape runs 72 mm) and est. |
| Pressure pad force | 0.1–0.2 N, felt on a phosphor-bronze leaf spring | The Register (Dormon 2013) |

**Drive**

| Quantity | Value | Source |
|---|---|---|
| Capstan diameter | **model 2.0 mm** (Philips's choice) | The Register (Dormon 2013); the Brock exercise uses 2.38 mm |
| Capstan speed | 7.58 turns/s, 455 rpm | calc. v / (π·d) = 47.625 / (π·2.0) |
| Tape per capstan turn | 6.28 mm | calc. π·d |
| Motor | **model 2400 rpm**, 3 V, electronic governor | typ.: audioappraisal.com (2400 rpm capstan motors); 3 V for portables |
| Belt ratio | 5.28 : 1 (motor pulley 4.0 mm, flywheel rim 23.7 mm; pitch diameters 4.6 and 24.3 mm with a 0.6 mm belt) | calc. 2400 / 455; pulley sizes chosen to fit the shell |
| Flywheel | brass, Ø 23.7 mm, on the capstan shaft | model (Sony US 4,630,149 for the layout) |
| Pinch roller | **model Ø 9 mm** rubber, 6 mm wide: 1.68 turns/s (101 rpm) | model; speed calc. v / (π·9) |
| Take-up drive | a second, crossed belt (0.7 mm round; crossed because the take-up reel turns the opposite way to the capstan): 2.4 mm pulley on the capstan shaft to the clutch's 22.8 mm pulley (pitch 3.1 and 23.5 mm): the clutch turns at 1.0 turn/s (60 rpm) | model: est., chosen above the reel's highest need (41 rpm) |
| Take-up torque | 18–30 g·cm (play) | Sony WM-FX855 service manual |
| Tape tension from it | 16–27 gf (0.16–0.27 N) at an empty hub, 7–12 gf at a full one | calc. torque / radius |
| Back tension (supply) | 0.7–2.0 g·cm: under 2 gf of pull | Sony WM-FX855; calc. |
| FF / REW torque | > 35 g·cm (WM-FX855), > 40 g·cm (WM-FX561) | service manuals |
| Batteries | two AA cells, 3 V; Ø 14.5 × 50.5 mm each | typ. for players with a radio; the IEC AA size |

**Reels through one side of a C60 (calc., hub r 11 mm, pack 1530 mm²)**

| Played | Take-up radius | Take-up speed | Supply radius | Supply speed |
|---|---|---|---|---|
| start | 11.0 mm | 41.3 rpm | 24.7 mm | 18.4 rpm |
| a quarter (**the model**) | 15.6 mm | 29.2 rpm (0.487 turns/s) | 22.1 mm | 20.6 rpm (0.344 turns/s) |
| half | 19.1 mm | 23.8 rpm | 19.1 mm | 23.8 rpm |
| three quarters | 22.1 mm | 20.6 rpm | 15.6 mm | 29.2 rpm |
| end | 24.7 mm | 18.4 rpm | 11.0 mm | 41.3 rpm |

ω = v / (2π·R) with v = 47.625 mm/s; R = √(r² + f·A/π). A C90's thinner tape gives the same pack (1553 mm², 24.8 mm) and so the same speeds over 45 minutes. The capstan stays at 455 rpm throughout.

**Head (calc.)**

| Quantity | Value | Source |
|---|---|---|
| Wavelength on tape | 100 Hz: 0.48 mm · 1 kHz: 47.6 µm · 10 kHz: 4.8 µm · 15 kHz: 3.2 µm | calc. λ = v / f |
| Playback gap | ≈ 1–2 µm (Wikipedia gives 2 µm, unsourced) | Wikipedia (flagged) |
| Head | a playback-only stereo head (no erase head on a player): two cores, one per track of the side's pair | format |

**The radio (mentioned only)**

| Quantity | Value | Source |
|---|---|---|
| Dial | AM 530–1600 kHz (printed ×10: 54 … 160), FM 88–108 MHz; an AM/FM/cassette slide switch | the model's own dial |

## 5. The misconception

"People think the reels pull the tape through at the right speed; in fact the capstan sets it: the tape is squeezed between the 2 mm steel capstan, turning at a steady 455 rpm, and the rubber pinch roller, so it moves at 4.76 cm/s whatever the reels do. The reels can't set it, because their size changes: over one side of a C60 the take-up reel's pack grows from 22 to 49 mm across, so it slows from 41 to 18 rpm while the supply reel speeds up from 18 to 41. Its drive turns faster than it ever needs and slips on felt (Sony US 4,630,149; Dormon, The Register), so it only takes up what the capstan delivers." Goes in: the callout on the capstan, step 1's text and the "Reels" step, with the speeds through a side as bars.

## 6. Parts, grouped in chain order

| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
| Case | `lid` | Lid | The cassette door, with a window onto the reels. Shut, it holds the cassette down over the spindles and the capstan. | – |
| Case | `back_cover` | Back cover | The back half of the case. The bulge in the middle holds the two AA cells. | – |
| Case | `front_case` | Front case | The front half: the cassette well, the keys on top and, on the left, the AM/FM radio’s dial, band switch and tuning wheel. | – |
| Case | `deck` | Deck | A steel plate that holds the transport in line: the capstan’s bearing, the spindles, the head and the pinch roller’s post. | – |
| Power | `batteries` | Batteries | Two AA cells in series: 3 volts for the motor, the amplifier and the radio. | – |
| Power | `motor` | Motor | A small DC motor whose electronic governor holds it at about 2,400 turns a minute. Its 4 mm pulley drives the belt. | – |
| Power | `belts` | Belts | Thin rubber belts: one from the motor to the flywheel, slowing it 5.28 times; one, crossed so the clutch turns the other way, from the capstan’s shaft to the take-up clutch. | – |
| Capstan | `flywheel` | Flywheel and capstan | A 23.7 mm brass flywheel on a 2 mm steel shaft. The shaft is the capstan: at 455 turns a minute its surface moves at exactly 4.76 cm/s. | time, 454.8 rpm |
| Capstan | `pinch_roller` | Pinch roller | A 9 mm rubber roller on a sprung arm. It squeezes the tape against the capstan, so the tape can’t slip: it turns only because the tape does. | – |
| Take-up | `clutch` | Slip clutch | The take-up belt’s big pulley and a felt ring. It turns once a second, faster than the reel ever needs, and slips on the felt. | time, 60 rpm |
| Take-up | `takeup_spindle` | Take-up spindle | Sits on the clutch’s felt and turns the take-up reel. The drag of the felt, 18 to 30 gram-centimetres, keeps the tape taut. | time, 29.2 rpm |
| Take-up | `supply_spindle` | Supply spindle | Turns freely under the supply reel, which the tape pulls round against a light drag. | time, 20.6 rpm |
| Cassette | `cassette_back` | Cassette | A Philips compact cassette: two reels of tape 3.81 mm wide in a shell 10 cm long. This is its back half, with the corner guide rollers. | – |
| Cassette | `cassette_front` | Cassette front | The front half of the shell, with side A’s label. The two halves are screwed together. | – |
| Cassette | `supply_reel` | Supply reel | The full reel at the start of a side. A quarter of the way through a C60 its pack is 44 mm across and turns 21 times a minute. | time, 20.6 rpm |
| Cassette | `takeup_reel` | Take-up reel | Winds up what the capstan delivers. Its pack is 31 mm across here and turns 29 times a minute, slowing as it grows. | time, 29.2 rpm |
| Cassette | `tape` | Tape | Plastic film 3.81 mm wide and 17 µm thick (drawn thicker here), coated with iron oxide. Side A’s two tracks are on one half of it. | – |
| Cassette | `pressure_pad` | Pressure pad | Felt on a bronze leaf spring, inside the cassette. It presses the tape onto the head with 0.1 to 0.2 newtons. | – |
| Sound | `head` | Playback head | Two tiny electromagnets with a gap about a micron wide. The magnetised tape passing the gap makes a voltage in their coils: the music, for the amplifier. | – |

## 7. Mechanism map

- **Time-driven spins** (turns a second, at real speed; the tour slows them): motor shaft 40, flywheel with the capstan 7.58, pinch roller −1.68, take-up clutch pulley −1.0 (the crossed belt reverses it), take-up spindle and reel −0.487, supply spindle and reel −0.344 (both reels clockwise from the front, the capstan anticlockwise so its surface at the tape moves down with it). All from section 4; the packs are drawn a quarter of the way through side A, so the reels' speeds match the packs on screen.
- The belts stay still (a belt loop can't spin as one part); flow lines show where they carry the power.
- **Reused:** plain spins; the `run` experiment with counts; the generic charts `ladder` (the speed ladder, log scale) and `bars` (reel speeds through a side; wavelengths on the tape). Nothing new in the viewer.

## 8. Film (15–25 s, 2–5 shots)

The mechanism doing its job once, start to finish (references/film.md).

| At | Chapter | Caption | Seconds | Cues |
|---|---|---|---|---|
| 0 s | Drive | A belt from the motor turns the brass flywheel; its 2 mm steel shaft is the capstan. | 5 |  |
| 5 s | Drive | The pinch roller squeezes the tape onto the capstan, so the tape moves at exactly 4.76 cm/s. | 5 |  |
| 10 s | Tape | The tape’s magnetised coating sweeps past the head’s tiny gap and makes a voltage: the music. | 5 |  |
| 15 s | Tape | The take-up reel only winds in what the capstan lets through, slowing down as it fills. | 5 |  |

Solid throughout: the Motor, Belts, Flywheel and capstan, Pinch roller, Tape, Playback head, Pressure pad, both reels and spindles and the Slip clutch; the case, the Deck and the cassette's shell are glass, so the whole transport, the drive behind the deck too, shows from the front, and nothing comes apart. Every shot frames the whole player at one size; the camera orbits from −70° to −10°. Every shot runs at 0.25× (`rate`).

## 9. Simplified or left out

Said on the page too (`credit.extra` or the text).

- No real make: the transport's sizes are chosen to fit this shell and match the format and typical parts; the motor speed (2400 rpm), pulley sizes, pinch roller and flywheel are typical, not one model's.
- The take-up is driven by a second small belt from the capstan shaft, crossed to reverse it (the take-up reel turns clockwise from the front, the capstan anticlockwise); real players do this with the same belt and gears (Sony's patent, where a gear mesh gives the reversal), with the same felt slip clutch.
- The keys, the play mechanism that swings the head and pinch roller in, fast wind, auto-stop, and the amplifier and radio board are left out; the radio is only mentioned.
- One pack position (a quarter through side A) is modelled; the reels' speeds through the side are in the chart.
- The hub diameter (22 mm) is an estimate; the tape is drawn far thicker than its 17 µm so it shows.
- The cassette's shell is cut in two along its mid-plane to show the inside; real ones are two halves screwed or welded together, with slip sheets between the packs and the shell (left out).

## 10. Log

Run `date` at each stage; at twice a stage's budget, tell the user where it stands.

| Stage | Budget | Started | Done | Notes |
|---|---|---|---|---|
| 0 Brief | 5 min | 23:46 | 23:50 | Tier B; Poly Haven model inspected |
| 1 Truth | 15 min | 23:50 | 00:05 | Research done here (no subagents on this machine) |
| 2 Scaffold | 2 min | 23:48 | 23:49 | `3dot-new` |
| 3 Model | 30 min | 00:05 | 00:42 | Sections and probes of the mesh first (the well, the lid's 19.8 mm underside, the cassette's channel and holes); five builds to clear the clash and explode checks: the cassette shifted 1.4 mm left of the modeller's spot to clear the well's retaining ledge, the channel's end walls and pinch-roller pockets opened, the head and pinch roller retract before the cassette lifts. The take-up belt crossed when a check of the directions showed an open belt would turn the clutch against the reel |
| 4 Content | 15 min | 00:24 | 00:27 | Alongside the model; 19 parts in 6 groups, 9 callouts, 6 steps |
| 5 Mechanism | (if new) | | | none: spins, `run`, `ladder`, `bars` |
| 6 Check | 10 min | 00:30 | 01:08 | Four full QA runs (each about 6 min on software GL, plus waits for the shared browser lock), 64/64 each time. Fixed from the sheets: callout cameras pulled back to distance 2 (they had filled the frame), the explode reordered so the front case comes off before the cassette (the head and pinch roller sit under the radio panel), the cassette's front half slid aside to show the packs, two tags that overlapped, crowded bar notes, the capstan callout seen from above so the pinch roller doesn't hide it |
| 7 Ship | 5 min | 01:09 | 01:16 | Posters (after a 4 min wait for the browser lock), `npm run truth`, `npm run reproduce` all identical. About 1 h 30 min from the brief to the commit, a third of it waiting on the shared browser and the software-GL QA runs |

19 October 2026: "How it works" became a film (references/film.md), 4 shots, 20 s, all from the front; the six tour steps, their charts and the `run` experiment came off the page.
