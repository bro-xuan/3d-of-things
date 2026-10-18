# Family Car: truth sheet

Tier C · slug `family-car` · shipped before the standard procedure

Reconstructed on 18 October 2026 from the shipped page (content/family-car.json, written by objects/family-car/content.mjs) and the code that builds and drives it (objects/family-car/spec.mjs, the car builder in scripts/kit/cars/, src/viewer/rig.ts, src/pages/tour.ts and the charts in src/charts/generic.ts); no new research. Where they say nothing, this sheet says so.

## 1. The object

- **Exactly what:** no particular make: a three-box family saloon of the 1970s or 80s, petrol four at the front driving the rear wheels through a clutch, a four-speed gearbox, a propshaft and a differential in a live rear axle (content: summary; spec.mjs header).
- **Real size:** 4,500 mm long on a 2,650 mm wheelbase (content: facts); track 1,440 mm front and rear, body half-width up to 862 mm, roof 1,400 mm, 14-inch wheels on 185/70 tyres (spec.mjs). "Proportions of a typical 1970s–80s saloon" (spec.mjs), not one car's measurements.
- **The problem it solves:** getting the power of petrol burnt at the front to the rear wheels, both to pull and to cruise, and round a bend; the car "carries its own fuel and has to cool itself" (content: summary, tour steps 1, 3, 4).
- **Its one big idea (the principle):** four pistons pushed down in turn by burning petrol turn a crankshaft; a camshaft at half its speed opens each cylinder's valves for its four strokes; the gearbox trades speed for pulling power; the differential lets the rear wheels turn at different speeds in a bend (content: summary).

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | Built in code (objects/family-car/generate.mjs, the kit's car builder on spec.mjs); credit "Family Car, built in code", 3D of Things, "built in code for this site" | CC0 1.0 (content: credit) |
| Dimensions | spec.mjs: `length` [−2250, 2250], `wheelbase` 2650, `track` [1440, 1440], `wheels` 14-inch 185/70, `engine` bore 88, stroke 82 | "its sizes are those of a typical saloon of the time" (content: summary); no make |
| Mechanism | credit.extra: "The layout and sizes of a typical rear-wheel-drive saloon of the 1970s and 80s; no particular make." Tooth counts and timing in engine.mjs (`GEARS`, `FIRING`, `LIFT`, `DURATION`). No outside source is cited. | the repo's own |
| README | "The cars, built in code" | agrees with the code |

## 3. The energy chain

1. **Source:** petrol from the Fuel tank under the boot floor and air through the Intake (filter, runners), burnt in four cylinders of the Engine block under the Cylinder head's spark plugs; the 12 V Battery for the starter, the sparks and the lights.
2. **Transmission:** Pistons and rods → Crankshaft (flywheel at the back) → Clutch → Gearbox (Gears: input shaft, layshaft, main shaft) → Propshaft, a universal joint at each end → Differential (pinion, crown wheel, spider gears) in the Rear axle → Half shafts → rear wheels.
3. **Control:** the Timing belt turns the Camshaft at half the crank's speed and its lobes open the valves, two to a cylinder, firing 1, 3, 4, 2; the Clutch pedal lets the drive go; the lever locks one gear to the main shaft; the spider gears share the drive between the half shafts in a bend.
4. **Output:** the rear wheels; the heat goes out through the Radiator (water pumped round the block and head, air pulled by the Fan) and the Exhaust. Rough shares: wheels 25 %, exhaust 35 %, cooling 30 %, friction 10 % (content: Layout chart).

## 4. Numbers

| Quantity | Value | Source |
|---|---|---|
| Length, wheelbase | 4,500 mm; 2,650 mm | content: facts; spec.mjs: `length`, `wheelbase` |
| Track | 1,440 mm front and rear | spec.mjs: `track` |
| Wheels | 14-inch steel wheels with hubcaps, 185/70 tyres | content: parts (wheels); spec.mjs: `wheels`, `rims` style `aero` |
| Engine | two litres, four cylinders in a row | content: facts; spec.mjs: `engine` comment |
| Bore × stroke | 88 × 82 mm | content: facts; spec.mjs: `engine` |
| Rod, bore spacing | rod 140 mm; cylinders 96 mm apart; crank throw half the stroke | spec.mjs: `engine.rod`, `engine.spacing`; engine.mjs: `r = E.stroke / 2` |
| Firing order | 1, 3, 4, 2, one every half turn; cylinders 1–4 fire at 0, 540, 180, 360 crank degrees | content: tour "Four strokes"; engine.mjs: `FIRING` |
| Crankpins | cylinders 1 and 4 at 0°, 2 and 3 at 180° | engine.mjs: `phases`; content: motion `phase` |
| Valves | two to a cylinder; lift 9 mm; open over 120° of the camshaft's turn; intake fully open a quarter turn of the camshaft after the exhaust | content: parts (`cylinder_head`); engine.mjs: `LIFT`, `DURATION`, valve loop |
| Timing belt | crank pulley 20 teeth, cam pulley 40: camshaft at half the crank's speed | engine.mjs: `spur` teeth; content: parts (`timing_belt`) |
| Flywheel | starter ring of 110 teeth | engine.mjs |
| Gear teeth (layshaft : main) | constant mesh 30 : 20; 3rd 26 : 24; 2nd 21 : 29; 1st 15 : 35; module 3 | engine.mjs: `GEARS` |
| Gear ratios | 1st 3.5, 2nd 2.07, 3rd 1.38, 4th 1 (direct) | content: tour "Gearbox" (speeds, chart); engine.mjs: `ratio` |
| Final drive | 3.9 : 1, pinion 10 teeth, crown wheel 39 | content: facts, tour "Differential"; engine.mjs: `GEARS.final` |
| Differential gears | spider gears 10 teeth, side gears on the half shafts 16 | engine.mjs |
| Rear springs | leaf springs of four leaves each side, a damper each side | content: parts (`rear_springs`); engine.mjs |
| Front suspension | two wishbones and a coil-over at each corner, steering rack | content: parts (`suspension`); platform.mjs |
| Battery | 12 V | content: parts (`battery`) |
| Energy shares | wheels 25, exhaust 35, cooling 30, friction 10 % ("rough shares at a steady speed") | content: tour "Layout" chart |
| Viewer speeds (turns a second) | crank, fan, clutch, input and main shafts, propshaft, pinion 2; camshaft 1; layshaft −1.3333; free gears 3rd 1.4444, 2nd 0.9655, 1st 0.5714; carrier, half shafts and wheels 0.5128 (fourth gear); spider gears ±0.1231 | content: motion; content.mjs ("the engine at a steady 2, the rest in fourth gear") |
| In a bend | outside wheel ×1.15, inside ×0.85 | content: tour "Differential" speeds; content.mjs: `bend` 0.15 |
| Four strokes step | runs at 0.35× | content: tour `rate` |

## 5. The misconception

Not stated on the page.

## 6. Parts, grouped in chain order

| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
| Body | `door_front_left` | Left front door | A door, with its window in a steel frame. | – |
| Body | `door_front_right` | Right front door | A door, with its window in a steel frame. | – |
| Body | `door_rear_left` | Left rear door | A door, with its window in a steel frame. | – |
| Body | `door_rear_right` | Right rear door | A door, with its window in a steel frame. | – |
| Body | `bonnet` | Bonnet | Over the engine. | – |
| Body | `boot` | Boot lid | Over the boot; the fuel tank is under its floor. | – |
| Body | `front_bumper` | Front | The nose: the grille, the headlamps and a chrome bumper wrapped round its corners. | – |
| Body | `rear_bumper` | Tail | The tail lamps, the number plate and the rear bumper. | – |
| Body | `body` | Body | The steel shell, the glass and the cabin: it lifts off the engine, the gearbox and the axles underneath. | – |
| Engine | `radiator` | Radiator | Hot water from the engine runs down its tubes and is cooled by the air through its fins. | – |
| Engine | `fan` | Fan | On the crankshaft’s nose: it pulls air through the radiator when the car is going slowly. | time, 120 rpm |
| Engine | `timing_belt` | Timing belt | A toothed belt from the crankshaft to the camshaft, whose pulley is twice the size: the camshaft turns at half the crankshaft’s speed. | – |
| Engine | `cam_cover` | Cam cover | Keeps the oil in, over the camshaft. | – |
| Engine | `camshaft` | Camshaft | A lobe over each valve, set round the shaft so each opens at its moment; it turns once for every two turns of the crankshaft. | time, 60 rpm |
| Engine | `cylinder_head` | Cylinder head | Over the cylinders: the valves, two to a cylinder, and the spark plugs. | – |
| Engine | `engine_block` | Engine block | Cast iron: four cylinders in a row, the crankshaft in its bearings underneath. | – |
| Engine | `piston_1` | Pistons and rods | Four pistons with their rings, each on a connecting rod down to its crankpin. | crank on Crankshaft |
| Engine | `crankshaft` | Crankshaft | Turns the pistons’ up and down into turning: a crankpin for each rod with a counterweight opposite, the flywheel at the back. | time, 120 rpm |
| Engine | `sump` | Sump | The oil, under the crankshaft. | – |
| Engine | `intake` | Intake | Air comes in through the filter and along the runners, petrol is added, and the mixture goes into the cylinders. | – |
| Engine | `exhaust` | Exhaust | The burnt gas from each cylinder, through the catalytic converter and the silencer to the tailpipe. | – |
| Engine | `battery` | Battery | Twelve volts for the starter motor, the sparks and the lights. | – |
| Drivetrain | `propshaft` | Propshaft | Takes the drive back from the gearbox to the rear axle, with a universal joint at each end so the axle can move on its springs. | time, 120 rpm |
| Drivetrain | `gearbox` | Gearbox | Four forward gears in a cast case; the lever moves the selectors inside. | – |
| Drivetrain | `gear_input` | Gears | The input shaft drives the layshaft below it; the layshaft’s gears drive a gear for each speed, turning freely on the main shaft until one is locked to it. | time, 120 rpm |
| Drivetrain | `clutch` | Clutch | Springs press its disc against the flywheel; pressing the pedal lets it go, to change gear or to stop. | time, 120 rpm |
| Drivetrain | `rear_axle` | Rear axle | The axle’s casing: the differential in its middle, the half shafts in its tubes. | – |
| Drivetrain | `diff_carrier` | Differential | The pinion turns the crown wheel and the carrier with it; the spider gears in the carrier share the drive between the two half shafts. | time, 30.8 rpm |
| Drivetrain | `halfshaft_left` | Half shafts | From the differential out to the wheels, inside the axle’s tubes. | time, 30.8 rpm |
| Chassis | `rear_springs` | Rear springs | Leaf springs and dampers: the axle hangs from the body on them. | – |
| Chassis | `suspension` | Front suspension | At each front corner, two wishbones hold the wheel’s upright, with a coil spring round the damper; the steering rack turns the uprights. | – |
| Chassis | `fuel_tank` | Fuel tank | The petrol, under the boot floor. | – |
| Chassis | `wheel_fl` | Front left wheel | 14-inch steel wheels with hubcaps, on 185/70 tyres. | time, 30.8 rpm |
| Chassis | `wheel_fr` | Front right wheel | 14-inch steel wheels with hubcaps, on 185/70 tyres. | time, 30.8 rpm |
| Chassis | `wheel_rl` | Rear left wheel | 14-inch steel wheels with hubcaps, on 185/70 tyres. | time, 30.8 rpm |
| Chassis | `wheel_rr` | Rear right wheel | 14-inch steel wheels with hubcaps, on 185/70 tyres. | time, 30.8 rpm |

The rpm are the viewer's (content.mjs: the crank at a steady 2 turns a second, the rest in fourth gear); the valves, inside the Cylinder head, move by cam on the Camshaft.

## 7. Mechanism map

- **Time (`speed`):** every spinning part turns at its turns a second (section 4) in rig.ts's `Mechanism`. Steps run it unless they say `try: 'run'` (src/pages/tour.ts).
- **Crank:** the four pistons and their rods follow the crankshaft (`crank`, `throw`, `rod`, `phase`; rods `rocks`), worked out in rig.ts's `follow()`.
- **Cam:** the eight valves follow the camshaft (`cam`, `lift`, `phase`, `duration` 120), through rig.ts's `openness()`.
- **Controls, jets:** none.
- **Tries:** `run` (Four strokes: hold Drive, counting Crankshaft and Camshaft turns); `speeds` (Gearbox: 1st, 2nd, 3rd, 4th scale the output side by 1/ratio; Differential: Straight, Bend left, Bend right set each half shaft, wheel and spider gear by its own factor).
- **Charts (src/charts/generic.ts):** `bars` (where the petrol's energy goes; gear ratios, following the chosen gear), `timing` (each piston's height through one camshaft turn, cursor on the camshaft), `ladder` (dials on the half shafts and the crown wheel). Nothing new: no car-specific viewer module or chart (src/charts/car.ts's motor chart is the Roadster's).

## 8. Tour (5–7 steps)

| # | Label | Shows (focus, flow) | Chart | Try |
|---|---|---|---|---|
| 1 | Layout | Engine block, Cylinder head, Crankshaft, Clutch, Gearbox, Propshaft, Rear axle, Differential, Half shafts, Rear left wheel, Rear right wheel, Radiator, Fuel tank, Exhaust; power flow; apart 0.6 | bars: Where the petrol’s energy goes |  |
| 2 | Four strokes | Pistons and rods, Crankshaft, Camshaft, valve_in_1, valve_ex_1, valve_in_2, valve_ex_2, valve_in_3, valve_ex_3, valve_in_4, valve_ex_4; apart 0.6; at 0.35× speed | timing: The four strokes, cylinder by cylinder | run, counting Crankshaft, Camshaft |
| 3 | Gearbox | Gears, layshaft, mainshaft, gear_1, gear_2, gear_3, Propshaft, Clutch; apart 0.6 | bars: Engine turns for each turn of the propshaft | speeds: 1st / 2nd / 3rd / 4th |
| 4 | Differential | Differential, pinion, spider_1, spider_2, Half shafts, halfshaft_right, Rear left wheel, Rear right wheel, Propshaft; apart 0.6 | ladder: The two wheels and the crown wheel | speeds: Straight / Bend left / Bend right |
| 5 | Cooling | Radiator, Fan, Engine block, Cylinder head; apart 0.6 |  |  |

## 9. Simplified or left out

- No particular make: "the layout and sizes of a typical rear-wheel-drive saloon of the 1970s and 80s" (credit.extra); "its sizes are those of a typical saloon of the time" (summary).
- The energy shares are "rough shares at a steady speed" (Layout chart).
- The viewer runs the engine at a steady 2 turns a second with the rest in fourth gear (content.mjs); the clutch never lets go and the lever and selectors don't move.
- In the code: no water pump, oil pump, ignition parts or fuel line to the engine are built, though the text has the water "pumped round passages in the block and the head".

## 10. Log

- Not recorded per stage.
- Built before the standard procedure; its time isn't recorded (procedure.md, "How long it takes", doesn't list it).
