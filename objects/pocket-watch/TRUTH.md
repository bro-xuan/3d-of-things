# Pocket Watch: truth sheet

Tier B · slug `pocket-watch` · shipped before the standard procedure

Reconstructed on 18 October 2026 from the shipped page (content/pocket-watch.json, written by objects/pocket-watch/content.mjs) and the code that builds and drives it (objects/pocket-watch/, src/viewer/clockwork.ts, src/charts/watch.ts); no new research. Where they say nothing, this sheet says so.

## 1. The object

- **Exactly what:** the make, model and year are not stated on the page or in the code. The shell is Poly Haven's "Vintage Pocket Watch" by Tal Swicegood: an engraved case with pendant, crown and bow, an enamel dial with Roman numerals, and three hands. It is a closed case (augment.mjs). Inside it the site generates "a Swiss lever escapement beating 21,600 times an hour, direct centre seconds, keyless winding" (movement.mjs).
- **Real size:** "6 cm across" (content: facts). The movement's main plate has a radius of 28.2 mm (movement.mjs `PLATE`). The case's thickness and other dimensions are not stated.
- **The problem it solves:** keeping time "in a pocket, at any angle, with no pendulum and no plug" (content: summary).
- **Its one big idea (the principle):** "stored energy let out in tiny, even steps" (summary). A wound mainspring pushes, the train carries the push, and the escapement lets it out one tick at a time, at the pace the balance and hairspring set. "The rate comes from the wheel and the spring, not the mainspring" (callout 'Balance').

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | https://polyhaven.com/a/vintage_pocket_watch ("Vintage Pocket Watch", Tal Swicegood, Poly Haven): case, dial, hands | CC0 1.0 (content: `credit`; README credits) |
| Movement | Generated in code: objects/pocket-watch/movement.mjs, fitted by augment.mjs, with the case opened by watchcase.mjs. "Built for 3D of Things from real tooth counts, and fitted inside the case" (`credit.extra`) | Ours. The source of the tooth counts is not stated |
| Dimensions | "6 cm across" (content: facts). The movement is laid out in millimetres (movement.mjs `PLATE`, `layout`, `H`) and placed in the source mesh's units (augment.mjs `frameToSrc`: frame mm ÷ 1000). The build fails if the scene's bounds move | The source of the 6 cm is not stated |
| Mechanism | None cited on the page or in the code: no service manual, patent or book | – |

## 3. The energy chain

source → transmission → control → output. One line each, naming the parts.

1. **Source (keyless works, mainspring):** you turn the Crown & stem. The winding pinion on the stem (13 teeth) turns the Crown wheel (36), which turns the Ratchet wheel (36) on the Barrel's arbor and coils the Mainspring. The click lets the ratchet turn one way only (callout 'Crown'; step 'Power'). Each turn of the crown adds about three hours, and a full wind is 40 hours.
2. **Transmission (train):** the Mainspring's outer end pulls the Barrel round once in 8 hours. Its 80 teeth drive the Centre wheel's pinion (once an hour), and from there the Third wheel (8 turns an hour), the Fourth wheel (once a minute) and the Escape wheel (12 turns a minute) (step 'Gear train').
3. **Control (escapement, balance):** the Pallet fork's two red pallets take turns locking the Escape wheel's 15 teeth. Each swing of the Balance wheel knocks the fork across, the wheel slips half a tooth, and that tooth's push goes back through the fork to the balance (callout 'Escapement'). The Balance wheel and Hairspring set the pace: 3 swings, or 6 beats, a second. The regulator on the Balance cock adjusts it.
4. **Output (motion works, hands):** the Cannon pinion on the centre wheel's arbor carries the Minute hand round once an hour. The Minute wheel and Hour wheel gear it down twelve times for the Hour hand. The Seconds hand rides on the Fourth wheel's arbor, which runs up through the middle of both (callout 'Hands').

## 4. Numbers

**Rate and power**

| Quantity | Value | Source |
|---|---|---|
| Beat | 6 ticks a second; 21,600 an hour | content: facts 'Beat', part 'Seconds hand'; movement.mjs header; clockwork.ts `BEATS_PER_SECOND` |
| Balance | 3 full swings a second; one full swing is two beats | content: part 'Balance wheel', callout 'Balance', step 'Balance'; watch.ts `watch-escapement` caption |
| Balance swing | ±250° at the rest reserve, scaled by `swingFor` = 130° + 175° × spring torque (0–1) | content: motion `amplitude` 250; watch.ts `REST_SWING`; clockwork.ts `swingFor`, `amplitudeFor` |
| Pallet fork | ±5.5°; flicks across in 0.12 of a beat (unlock, push, lock) | content: motion `amplitude`; clockwork.ts `IMPULSE`, `palletLean` |
| Power reserve | about 40 hours on a full wind; the model is drawn with 30 h in it | content: facts 'Power', callout 'Mainspring', step 'Power'; clockwork.ts `FULL_RESERVE`, `REST_RESERVE` |
| Barrel arbor | 8 hours stored per turn | src/viewer/rig.ts `HOURS_PER_ARBOR_TURN`; content: tag 'Barrel: 1 turn in 8 hours' |
| One turn of the crown | about three hours (the arbor turns 0.3611) | watch.ts `watch-power` caption; content: motion `wind` |

**The going train**

| Wheel | Teeth (wheel / its pinion) | Turns | `train` | Source |
|---|---|---|---|---|
| Barrel | 80 / – | 1 in 8 h | −0.0020833… | movement.mjs `layout` → `train`; content: step 'Gear train', tag '1 turn / 8 h' |
| Centre wheel | 80 / 10 | 1 an hour | 0.0166… | movement.mjs `train`; content: part 'Centre wheel', step 'Gear train' ("80 teeth … pinion of 10") |
| Third wheel | 75 / 10 | 8 an hour, one every 7½ min | −0.1333… | movement.mjs `train`; content: tag '8 turns / hour'; watch.ts `RUNGS` |
| Fourth wheel | 84 / 10 | 1 a minute | 1 | movement.mjs `train`; content: part 'Fourth wheel' |
| Escape wheel | 15 club-shaped teeth / 7 | 12 a minute, one every 5 s | −12 | movement.mjs `escapePinion`; scripts/kit/gears.mjs `escapeWheel` (`teeth = 15`); content: part 'Escape wheel', callout 'Gear train' |
| Balance | – | 10,800 swings an hour, ⅓ s each | `swing: balance` | watch.ts `RUNGS` |
| Steps | ×8, ×8, ×7½, ×12, then ×15 to the balance: ×86,400 from barrel to balance | | | watch.ts `RUNGS`, `watch-train` caption; content: part 'Third wheel' ("seven and a half times") |

**Motion works and keyless works**

| Wheel | Teeth | Turns | `motion` | Source |
|---|---|---|---|---|
| Cannon pinion | 12 | 1 an hour, with the centre wheel | `train` 0.0166… | movement.mjs `motion`; content: part 'Cannon pinion' |
| Minute wheel / its pinion | 36 / 10 | ÷3 | `train` −0.00555… | movement.mjs `motion`; content: tag 'Minute wheel: ÷3'; watch.ts `watch-hands` |
| Hour wheel | 40 | ÷4: 1 in 12 h, so the hour hand goes round twice a day | `train` 0.001388… | movement.mjs `motion`; content: tag 'Hour wheel: ÷4', parts 'Hour wheel', 'Hour hand' |
| Winding pinion (on the stem) | 13 | with the crown | `wind` −1 | movement.mjs `windingPinionTeeth` |
| Crown wheel | 36 | 0.3611 per crown turn | `wind` −0.3611 | movement.mjs `crownTeeth`; content: motion |
| Ratchet wheel | 36 | 0.3611 per crown turn | `wind` 0.3611 | movement.mjs `ratchetTeeth` ("equal wheels keep the ratchet clear of the fourth wheel's rim") |
| Click | rocks 5° per ratchet tooth | | `pawl` 36 | content: motion `pawl`, `amplitude` |

**Layout and sizes** (movement frame in mm: origin on the hands' axis, y towards the crown; movement.mjs unless noted)

| Quantity | Value | Source |
|---|---|---|
| Real size | 6 cm across | content: facts |
| Main plate | radius 28.2; faces at z −0.9 and −2.4 | `PLATE` |
| Wheel centres | centre wheel and fourth wheel [0, 0]; barrel [−3, 11]; third 7.6 at 200°; escape wheel [0, −7.35]; minute wheel 4.4 at 160°; winding pinion at y 22.4 | `layout` |
| Lever | straight line: escape wheel, pallet arbor and balance in line at −40°; the pallets lock at the tangents, 60° (2½ teeth) apart; lever 4.6, roller radius 1.0 | `layout` |
| Escape wheel | tip radius 3.6, root 2.72 | `layout` `escapeTip`; gears.mjs `escapeWheel` |
| Modules | each mesh has its own, from its centre distance: ÷45 for 80/10, ÷42.5 for 75/10, ÷45.5 for 84/7; motion works 4.4/24 and 4.4/25; the winding module is solved so the two 36-tooth wheels mesh, with the crown wheel's pitch circle over the winding pinion | `layout` |
| Balance | rim 7.75 outside, 7.2 inside; one arm; 18 timing screws | `buildMovement` |
| Hairspring | 12.5 turns, out to a radius of 3.65 | `buildMovement` |
| Mainspring | drawn with 10.5 turns; "about half a metre long" | `buildMovement`; content: callout 'Mainspring' |
| Heights | barrel sunk 1.2 into the plate; balance cock at 3.9–4.62 above the plate's back face | `H` |
| Dial feet | two, 17 from the axis, at 70° and 250° | watchcase.mjs `caseSurfaces` |
| New inner surfaces | 0.6 thick | watchcase.mjs `WALL` |

## 5. The misconception

Not stated as a misconception on the page. The nearest the page comes is a correction in callout 'Balance': "The rate comes from the wheel and the spring, not the mainspring: wind it tighter and it still ticks at the same speed." Step 5 'Balance' says it again ("A weaker push only makes the swings smaller. They take the same time"), with the `watch-balance` chart and the `hold` experiment's readout, "still 6 beats a second".

## 6. Parts, grouped in chain order

| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
| Winding | `winding_stem` | Crown & stem | Turn the crown and the stem carries your twist into the movement, to wind the mainspring. | winding |
| Winding | `crown_wheel` | Crown wheel | Takes the turn from the winding pinion on the stem and passes it on to the ratchet wheel. | winding |
| Winding | `ratchet_click` | Ratchet wheel & click | The ratchet wheel turns the barrel’s arbor as you wind. The sprung click drops into its teeth, so the spring can’t unwind backwards. | winding |
| Power | `mainspring` | Mainspring | A long coiled strip of hardened steel: the watch’s whole store of energy. | winding |
| Power | `barrel` | Barrel | The drum the mainspring lives in. As the spring relaxes it turns the barrel, and the barrel’s teeth drive the train. | clock train, -0.0020833333333333333 turns a minute |
| Gear train | `centre_wheel` | Centre wheel | Turns once an hour. Its arbor carries the cannon pinion, and with it the minute hand. | clock train, 0.016666666666666666 turns a minute |
| Gear train | `third_wheel` | Third wheel | Passes the centre wheel’s motion on to the fourth wheel’s pinion, speeding it up seven and a half times. | clock train, -0.13333333333333333 turns a minute |
| Gear train | `fourth_wheel` | Fourth wheel | Turns once a minute, and carries the seconds hand on its long arbor. | clock train, 1 turns a minute |
| Escapement | `escape_wheel` | Escape wheel | Fifteen club-shaped teeth, let past by the pallet fork half a tooth at a time. | clock train, -12 turns a minute |
| Escapement | `pallet_fork` | Pallet fork | Rocks to and fro on every tick: its red pallets lock and release the escape wheel, and its forked end kicks the balance. | swing: pallet |
| Balance | `balance_wheel` | Balance wheel | Swings back and forth three times a second. Its steady rhythm is what sets the watch’s rate. | swing: balance |
| Balance | `hairspring` | Hairspring | A fine blued spiral that pulls the balance back each time it swings out. Its stiffness sets the beat. | swing: coil |
| Hands | `cannon_pinion` | Cannon pinion | A tube that grips the centre wheel’s arbor. It carries the minute hand and drives the motion works. | clock train, 0.016666666666666666 turns a minute |
| Hands | `minute_wheel` | Minute wheel | Gears the cannon pinion down for the hour wheel; between them they slow it twelve times. | clock train, -0.005555555555555556 turns a minute |
| Hands | `hour_wheel` | Hour wheel | Turns once every twelve hours and carries the hour hand on its tube. | clock train, 0.001388888888888889 turns a minute |
| Hands | `dial` | Dial | The enamel face and its ring of Roman numerals, held to the main plate by two small feet. | – |
| Hands | `vintage_pocket_watch_hour_hand` | Hour hand | Rides on the hour wheel’s tube, going round twice a day. | clock: hour |
| Hands | `vintage_pocket_watch_minute_hand` | Minute hand | Rides on the cannon pinion, once round every hour. | clock: minute |
| Hands | `vintage_pocket_watch_second_hand` | Seconds hand | Sits on the tip of the fourth wheel’s arbor and steps forward six times a second. | clock: second |
| Frame | `main_plate` | Main plate | The foundation: wheels pivot in its jewels, the bridges are screwed to it, and the dial sits on its other side. | – |
| Frame | `barrel_bridge` | Barrel bridge | Holds the barrel’s arbor, and carries the winding wheels on top. | – |
| Frame | `train_bridge` | Train bridge | Holds the top pivots of the third, fourth and escape wheels, each in a jewel in a gold setting. | – |
| Frame | `pallet_bridge` | Pallet bridge | A small bridge holding the pallet fork’s top pivot, tucked in under the balance. | – |
| Frame | `balance_cock` | Balance cock | Holds the balance’s top pivot and the hairspring’s outer end. The little arm on top, the regulator, adjusts the rate. | – |
| Case | `case` | Case | The engraved shell the movement sits in. The stem runs up through the pendant at the top to the crown, and the bow above holds the chain. | – |
| Case | `case_back` | Case back | Closes the case, keeping dust and damp away from the oiled pivots. | – |
| Case | `crystal` | Crystal | The glass over the dial. It comes off first, to get at the hands. | – |

There are 27 rows here, but the facts say "Parts shown: 26". `crown`, `ratchet_wheel`, `hand_cap` and `winding_pinion` have no rows: they come apart `with` Crown & stem, Ratchet wheel & click, Seconds hand and Main plate respectively. `train` values are turns per turn of the seconds hand, so per minute.

## 7. Mechanism map

- **Time drives it all, from the visitor's clock.** A single beat count moves every clock-driven part: the seconds of the day × 6 (`BEATS_PER_SECOND`), less any time lost to slow motion. So the hands show the visitor's time and the train stays in mesh (src/viewer/rig.ts `Mechanism.tick`). `trainBeats` (clockwork.ts) keeps the train locked between beats and moves it in an eased step over 0.12 of a beat (`IMPULSE`).
- **`clock`:** `hour`, `minute`, `second` on the three Poly Haven hands.
- **`train`** (turns per turn of the seconds hand): Barrel, Centre, Third, Fourth and Escape wheels, Cannon pinion, Minute wheel, Hour wheel. Each is `inside: true`, so it moves only while the inside can be seen.
- **`swing`:** `pallet` on the Pallet fork (±5.5°, across on each beat: `palletLean`). `balance` on the Balance wheel: a sine at 3 swings a second, ±250° at the 30 h rest reserve, wider or narrower with the reserve (`springTorque`, `swingFor`, `amplitudeFor`). `coil` on the Hairspring: bent in place by rig.ts `Coil`, the inner coils turning and the outer end staying put.
- **`wind`** (turns per crown turn): crown, winding stem and winding pinion −1; Crown wheel −0.3611; Ratchet wheel 0.3611. The click has `pawl: 36` and rocks 5° per tooth, with a click sound. The Mainspring has `wind` with `coil: true` and coils with the hours stored, 8 per arbor turn (rig.ts `HOURS_PER_ARBOR_TURN`).
- **Run button:** `motionLabel` "Slow motion", with `slowMotion` {rate 0.05, explode 0.5}. The clock runs at 0.05 of real time, taking the closed model half apart first, then catches up when slow motion ends (rig.ts `catchUp`). Two steps set their own `rate`: Escapement 0.06, Balance 0.12.
- **Experiments** (src/pages/tour.ts, driving rig.ts):
  - `wind` (step 'Power'): "Wind the crown" turns it 1.2 times a second (`WIND_SPEED`), up to 40 h.
  - `loose` (step 'Escapement'): "Take out the pallet fork" ghosts the fork (Viewer.ts `setLoose`). The train runs away and spends the reserve in seconds (`looseSpeed`), drawn no faster than 2.4 turns a second (`SPIN_CAP`), while the balance swings on and dies away. "Put the fork back" restores the spring.
  - `hold` (step 'Balance'): "Hold the balance" stops everything. An "Hours since winding" slider sets the reserve.
- **Charts** (src/charts/watch.ts, from the numbers in clockwork.ts):
  - `watch-chain`: the stages; each opens its step.
  - `watch-power`: `springTorque` over 40 h, with the reserve now.
  - `watch-train`: turns an hour on a log scale, mesh by mesh, with live dials.
  - `watch-escapement`: two beats in three lanes (balance, fork, escape wheel).
  - `watch-balance`: one second of swing, just wound, nearly run down and now.
  - `watch-hands`: three dials and the two motion-works meshes.
- **Flows:** `power` lines (the default `carries`) on five steps, from the build's `flowPaths` (movement.mjs) via hints.json. The content's flow points and motion pivots match hints.json.
- **Reused or new:** no other object uses `clock`, `train`, `swing`, `pawl`, `wind` as a motion kind, or `slowMotion`. src/types.ts lists `wind`, `loose` and `hold` as experiments "for a watch". Other viewer modules take only `clamp01` and `easeInOutCubic` from clockwork.ts.

## 8. Film (15–25 s, 2–5 shots)

The mechanism doing its job once, start to finish (references/film.md).

| At | Chapter | Caption | Seconds | Cues |
|---|---|---|---|---|
| 0 s | Power | The wound mainspring turns the barrel, and its teeth drive the train of wheels. | 6 |  |
| 6 s | Escapement | Slowed ten times: each swing of the balance lets the escape wheel slip half a tooth, a tick. | 6 |  |
| 12 s | Escapement | The hairspring swings the balance to and fro three times a second: that sets the pace. | 6 |  |
| 18 s | Hands | The train turns the hands: the seconds hand once a minute, the minute hand once an hour. | 6 |  |

Solid throughout: the Mainspring, the train, the escapement, the Balance wheel and Hairspring, the motion works and the three hands; the case, crystal, dial, plates, bridges and Barrel are glass, so the movement is seen from the dial side. Every shot frames the whole watch at one size; the camera orbits from −50° to 24°. Shots 2 and 3 run at 0.1× (`rate`), the others at real speed. Shot 1's power flow is the build's `power` path from the Mainspring joined to `train` (hints.json `flow`). The winding parts stay still: winding fills the spring in about 3 s and wouldn't run again on a replay.

## 9. Simplified or left out

Said on the page too (`credit.extra` or the text).

- **A generated movement in a sourced shell:** the Poly Haven model is a closed case with three hands. The movement is generated "from real tooth counts" (`credit.extra`). The case is cut along the mesh's own edge loops into case, back, dial, crown and crystal. The inside of the case, the inside of the back and the back of the dial are turned from the case's own profile, 0.6 mm thick (augment.mjs, watchcase.mjs).
- **Laid out to be seen:** "the escapement rides on top of the train so it can be seen, under the balance; the balance cock is kept low because the case back is domed" (movement.mjs `H`). The regulator index is "kept short and clear of the escapement and of the case back's slope", and has no motion.
- **Idealised timing (clockwork.ts):**
  - The train steps in a fixed eased impulse of 0.12 of a beat.
  - The balance is a sine locked to the beat.
  - The spring's pull (`springTorque`) is a 0–1 curve with no units, and the swing is a straight line on it (`swingFor`).
  - The rate never changes with the swing, which is the page's point.
- **Mainspring:** drawn part wound at 30 h (`REST_RESERVE`), with 10.5 turns. The callout's "about half a metre long" is not checked against the drawn spring.
- **Jewels:** the model has hole jewels at both pivots of the third, escape, pallet and balance arbors and at the fourth wheel's top pivot, plus the two pallet stones and the impulse jewel. The callout's "fifteen or so" and "17 jewels" are about "a good watch", not this model.
- **Drawn for the screen:** the parts inside (`inside: true`) move only while they can be seen, and a runaway train is drawn no faster than 2.4 turns a second.
- **Placement:** content.mjs takes the moving parts' pivots and the tour's power paths from the hints, and places the callouts inside the case from the movement's layout. Still typed in model space: the movement frame's scale and origin, the hands' pivot, the crown and bow callouts and the tour's tags (content.mjs header).
- **Sources:** none are cited for the mechanism or the numbers.

## 10. Log

Not recorded per stage: built before the standard procedure, in 1 h 47 of active work (procedure.md, "How long it takes": tier B, 27% hand-made browser QA, 13% re-reading code).

19 October 2026: "How it works" became a film (references/film.md), 4 shots, 24 s; the six tour steps, their charts and experiments came off the page.
