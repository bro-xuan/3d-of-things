# Tesla Roadster: truth sheet

Tier D · slug `tesla-roadster` · shipped before the standard procedure

Reconstructed on 18 October 2026 from the shipped page (content/tesla-roadster.json, written by objects/tesla-roadster/content.mjs) and the code that builds and drives it (objects/tesla-roadster/spec.mjs, the car builder in scripts/kit/cars/, src/viewer/aerocar.ts, src/viewer/jets.ts, src/viewer/rig.ts, src/pages/tour.ts and the charts in src/charts/roadster.ts, src/charts/car.ts and src/charts/generic.ts); no new research. Where they say nothing, this sheet says so. `objects/tesla-roadster/2017/` (the superseded 2017 car) is not covered.

## 1. The object

- **Exactly what:** the Tesla Roadster as shown on 15 October 2026, in its Rocket trim: one seat, the passenger's place taken by an air tank, four suction fans under the tail and ten cold-gas thrusters round it; not road-legal (spec.mjs header; content: summary, facts). The other trims, per the page: the Performance (fans) and the Thrust (adds rear thrusters). Production planned for 2028.
- **An illustration:** "Tesla and the Roadster's name are trademarks of Tesla, Inc.; the Roadster here is an illustration made for this site, which has nothing to do with Tesla, and its insides are simplified" (README, credits).
- **Real size:** Tesla hasn't published its dimensions; the spec's are "measured off its press photographs (side, top and rear), scaled by the wheels" (spec.mjs): 4,240 mm long (`length` −2030 to 2210), 2,800 mm wheelbase, track 1,580 front and 1,560 rear, body half-width up to 955 mm, roof 1,125 mm.
- **The problem it solves:** grip and push beyond the tyres': downforce that doesn't need speed, and thrust that needs no grip (content: summary; old tour "Grip", "Thrusters").
- **Its one big idea (the principle):** fans pull the air out from under the sealed floor, so the air on top presses the car down even standing still; air squeezed to 690 bar, let out through rocket-shaped nozzles, shoves it forward or lifts it off the ground (content: summary).

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | Built in code (objects/tesla-roadster/generate.mjs, the kit's car builder on spec.mjs); credit "Tesla Roadster (2026), after Tesla's launch photographs", 3D of Things | CC0 1.0 (content: credit) |
| Dimensions | spec.mjs: `length` [−2030, 2210], `wheelbase` 2800, `track` [1580, 1560], wheels 20-inch 255/30 front, 21-inch 325/30 rear; measured off the press photographs | the repo's own measurements; no maker drawing |
| Proportions | "Tesla's launch photographs (October 2026)" | credit.extra |
| Suction system | "Tesla's 'Electric Fan Car' patent (US 12,746,987)" | credit.extra; aero.mjs header |
| Figures | "Tesla, Electrek and The EV Report" | credit.extra; maker claims, marked "claimed", "planned", "Tesla says" on the page |
| Inside layout | "The layout of the tanks, lines and nozzles is this model's" | credit.extra; README: Tesla hasn't shown it |
| Numbers in code | aerocar.ts attributes `MASS`, `MU`, `TANK_LITRES`/`FULL_BAR`, rear thrust, `TOP_SPEED` and the 1.6 s launch to Tesla, `FAN_DOWNFORCE` to Musk ("can pull up to two g's"); lift and yaw thrust are "this model's" | aerocar.ts comments |

## 3. The energy chain

1. **Source:** the Battery pack of 4680 cells in the floor (800 to 1,000 volts); and air in the Air tanks at 690 bar, pumped in by the Compressor in the front boot on power from the battery.
2. **Transmission:** the Rear motors (an inverter on each turns DC into three-phase AC; a magnet rotor; a reduction gear of about 9 : 1) → shafts → rear wheels. The Suction fans (four, about 20 kW each) pull the air from under the floor up a duct from an inlet between the rear wheels and blow it out of the tail. The Valves and lines take the air from the tanks to a valve block on the main tank's back and out to each nozzle.
3. **Control:** the Skirts drop to just above the road while the fans run; the Rear wing rises in track mode; each nozzle has its own fast electric valve; in flight a computer trims each lift valve, and the Yaw thrusters turn the car; the front wheels are steered by wire, from a yoke.
4. **Output:** drive at the rear wheels; downforce from the fans and body (over 2 g in a bend, Tesla quotes); about 80 kN from the Rear thrusters; lift from the four Lift thrusters.

## 4. Numbers

| Quantity | Value | Source |
|---|---|---|
| Shown | 15 October 2026 | content: facts; spec.mjs header |
| Trim | Rocket: one seat, not road-legal | content: facts |
| Length, wheelbase, track | 4,240 mm; 2,800 mm; 1,580 / 1,560 mm | spec.mjs: `length`, `wheelbase`, `track` |
| Wheels | 20-inch on 255/30 front; 21-inch on 325/30 rear | content: parts; spec.mjs: `wheels` |
| Mass | under 1,700 kg (Tesla's figure); 1,700 kg used | aerocar.ts: `MASS` |
| Battery | 4680 cells, 800 to 1,000 volts; pack of 2 × 5 modules | content: parts (`battery_pack`); spec.mjs: `pack` |
| Motors | one per rear wheel; "over a megawatt between them, Tesla says"; reduction about 9 : 1 | content: parts (`drive`); film shot 1; old tour: "Motors"; content.mjs: `ratio` |
| Suction fans | four, about 20 kW each, about 80 kW in all; 9 blades, radius 125 mm | content: facts, parts; aerocar.ts: `FAN_KW`; spec.mjs: `aero.fans` |
| Sealed floor | 3.1 m² ("over 3 m²"); seal z −998 to 997 mm, half-width 770 mm | aerocar.ts: `FLOOR`; spec.mjs: `aero.seal`; old tour: "Suction" |
| Air pressure | 101,325 Pa: "about ten tonnes on every square metre" | aerocar.ts: `ATMOSPHERE`; old tour: "Suction" |
| Fans' downforce | 2,000 kg ("two tonnes", "more than the car weighs") | aerocar.ts: `FAN_DOWNFORCE`; old tour: "Suction" |
| Suction | downforce × g / floor: "6 kPa less underneath, a sixteenth of the air's pressure" | aerocar.ts: `SUCTION`; old tour: "Suction" |
| Skirts | drop 95 mm | spec.mjs: `aero.skirtDrop` |
| Grip | tyres alone 1.26 g (Tesla quoted), load sensitivity 0.15; over 2 g with the fans (Tesla quotes) | aerocar.ts: `MU`, `LOAD_SENSITIVITY`, `corneringG`; old tour: "Grip" |
| Body and wing | 900 kg at 300 km/h, with speed squared; 0.4 of it with the wing stowed | aerocar.ts: `BODY_AT_300`, `bodyDownforce` |
| Wing | rises 380 mm, tilts 12° front edge down; up above 120 km/h, down below 90 | spec.mjs: `wing`; aerocar.ts: `setSpeed` |
| Air store | about 600 litres at 690 bar (10,000 psi) | content: facts, parts; aerocar.ts: `TANK_LITRES`, `FULL_BAR` |
| Tanks | `tank_main` r 350 × 1,160 mm across the car; `tank_seat` r 270 × 1,220 mm in the passenger's place; litres from their sizes, rounded to 600 | spec.mjs: `aero.tanks`; aero.mjs; content.mjs |
| Air carried | 327 kg (545 kg/m³ at 690 bar and 20 °C); the old tour said "about 320 kg" | aerocar.ts: `FULL_AIR`; old tour: "Air" |
| Regulator | feeds the nozzles at 150 bar; full thrust down to 180 bar in the tanks | aerocar.ts: `FEED_BAR`, `LOW_BAR` |
| Filling | six or seven hours now; Tesla wants half an hour | content: parts (`compressor`); old tour: "Air" |
| Pressure ladder | car tyre 2.4, diver's tank 230, hydrogen car 700, Roadster 690 bar | old tour: "Air" chart |
| Thrusters | ten: four rear, four lift, two yaw | content: facts |
| Thrust | rear 80 kN (Tesla's figure); lift 48 kN and yaw 6 kN (this model's) | aerocar.ts: `GROUPS`; content: parts |
| Jet | about 650 m/s, "about twice the speed of sound"; leaves at about −200 °C | aerocar.ts: `jetSpeed`; old tour: "Thrusters" |
| Nozzle | de Laval: chamber r 38, throat r 15, exit r 52 mm, 262 mm long | aero.mjs: `NOZZLE` |
| Air at full blast | lasts "about a second and a half" | old tour: "Thrusters" |
| Hover | about 20 kN, "some 30 kg of air a second" | old tour: "Flight" |
| 0–60 mph | 2017 claim 1.9 s; Performance 1.6; Thrust 0.9; Rocket under 0.59 s (claimed) | content: facts; old tour: "Inside" chart |
| Launch in the viewer | tyres alone 11.7 m/s² (about 2.3 s to 60 mph), with the fans 16.8 m/s² (1.6 s); 60 mph = 26.82 m/s | aerocar.ts: `LAUNCH`, `SIXTY` |
| Top speed | over 230 mph (claimed); 103 m/s in the viewer | content: summary; aerocar.ts: `TOP_SPEED` |
| Flights | hop: up to 2.0 m, 4.3 s; barrel roll: 1.6 m at 1.0 s, then a full roll, 4.0 s | aerocar.ts: `fly()` |
| At the launch | jumped over five other Teslas, then 27 feet up with a barrel roll | old tour: "Flight" |
| Production | 2028 (planned) | content: facts |

“Old tour” is the step-by-step tour this page had before its film: those numbers are no longer on the page, but the code still runs on them.

## 5. The misconception

Not stated on the page.

## 6. Parts, grouped in chain order

| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
| Body | `door_left` | Left door | A scissor door: hinged at its front edge, it swings up. | – |
| Body | `door_right` | Right door | A scissor door: hinged at its front edge, it swings up. | – |
| Body | `bonnet` | Front lid | Over the front boot, where the compressor that fills the air tanks is. | – |
| Body | `boot` | Rear wing | The deck behind the glass is the wing: in track mode it rises on two struts and tilts, its front edge down, to press the tail down at speed. | control: wing |
| Body | `front_bumper` | Nose | The light bar across it, an intake underneath, and in its sides the two yaw nozzles. | – |
| Body | `rear_bumper` | Tail | The light bar across it, and the opening where the fans blow out and the rear nozzles fire. | – |
| Body | `body` | Body | The shell, the gold-tinted glass and the cabin: it lifts off the battery, the fans, the air tanks and the nozzles underneath. | – |
| Suction | `fan_box` | Suction fans | Four electric fans of about 20 kW each, in the tail. A duct from an inlet in the floor between the rear wheels feeds them the air from under the car, and they blow it out of the back. | – |
| Suction | `skirts` | Skirts | Carbon blades round the sealed floor. When the fans run they drop to just above the road, so air can only seep in under their edges. | control: skirts |
| Air | `air_tanks` | Air tanks | Carbon-wound tanks, about 600 litres in all at 690 bar (10,000 psi): one across the car behind the seat, one in the passenger’s place. | – |
| Air | `compressor` | Compressor | An electric pump that fills the tanks from the battery. Tesla says six or seven hours for now, and wants it down to half an hour. | – |
| Air | `air_lines` | Valves and lines | Lines from the tanks to a valve block on the main tank’s back, and out to every nozzle; each nozzle has its own fast electric valve. | – |
| Air | `thruster_rear_1` | Rear thrusters | Four nozzles in the tail, about 80 kN between them: four or five times the push the tyres can give. | – |
| Air | `thruster_down_1` | Lift thrusters | One at each corner, blowing straight down: together they can lift the car off the ground. | – |
| Air | `thruster_yaw_left` | Yaw thrusters | One in each side of the nose: they turn the car about its middle, in the air or on the ground. | – |
| Skateboard | `battery_pack` | Battery pack | A thick tray of 4680 cells in the floor, at 800 to 1,000 volts; the seat sits on it. | – |
| Skateboard | `pack_lid` | Pack lid | Seals the pack; the cabin floor, the seat and the passenger’s tank sit on it. | – |
| Skateboard | `drive` | Rear motors | A motor for each rear wheel, each with its inverter on top and a reduction gear beside it. Over a megawatt between them, Tesla says. | – |
| Skateboard | `suspension` | Suspension | Double wishbones and a coil-over at each corner; the front wheels are steered by wire, from a yoke. | – |
| Wheels | `wheel_fl` | Front left wheel | 20-inch, on 255/30 tyres. | time, 60 rpm |
| Wheels | `wheel_fr` | Front right wheel | 20-inch, on 255/30 tyres. | time, 60 rpm |
| Wheels | `wheel_rl` | Rear left wheel | 21-inch, on wide 325/30 tyres. | time, 60 rpm |
| Wheels | `wheel_rr` | Rear right wheel | 21-inch, on wide 325/30 tyres. | time, 60 rpm |

The rpm are the viewer's. Inside these parts, the four fans turn on the `fan` control, the motor rotors at 9 turns a second and the rear shafts with the wheels; the nozzles don't move but fire jets (section 7).

## 7. Mechanism map

- **Time (`speed`):** the wheels and rear shafts at 1 turn a second, the motor rotors at 9 (rig.ts's `Mechanism`). The film runs them at 0.5× all through, the car driving; the fans and the jets keep their own time (aerocar.ts).
- **Controls**, set by aerocar.ts's `AeroCar` and turned into motion by src/viewer/linkage.ts: `fan` (the four fans' turns; 3.2 turns a second as drawn at full power, spinning up and down with a 0.55 s time constant), `skirts` (0–1, sliding 95 mm down over 0.35 s once the fans pass 0.15, up over 0.25 s), `wing` (0–1, rising and tilting over 0.8 s).
- **Jets:** the content's `jets` give each nozzle's exit, direction and group (`rear`, `lift`, `yaw`); jets.ts draws them at the throttles in aerocar.ts's state (reach 2.0, 1.4 and 1.0 m at full blast), with a cloud on the ground under each lift jet.
- **Flight:** aerocar.ts works out the `hop` and `roll` flights at 60 steps a second (the computer throttles the lift nozzles to a planned height, within what they give, the air running down); the viewer lifts the whole car.
- **Film:** cues `fans` (on, shot 2) and `thrust` (on for 2 s, shot 3: the air lasts about that long at full blast); the car doesn't fly and the wing stays down. Solid all through: the motor rotors and rear shafts, the four wheels (with the front ones solid the ghosts don't fade at the nose), the four fans, the four rear nozzles; the body, the motors' cases, the fans' box, the skirts, the tanks and the lines are glass (solid skirts drew a heavy black frame round the floor). Every shot frames the whole car, so none of it runs over the script panel; the camera orbits its right side: front right for the motors (−60°), the side for the fans (−95°), the rear quarter for the jets (−125°).
- **No tries or charts.** The old tour's tries (`run`, `suction`, `grip`, `thrust`, `fly`) and charts (`bars`, `ladder`, `motor-field`, `suction`, `downforce`, `nozzle`, `flight`) are no longer used by this page.

## 8. Film (15–25 s, 2–5 shots)

The mechanism doing its job once, start to finish (references/film.md).

| At | Chapter | Caption | Seconds | Cues |
|---|---|---|---|---|
| 0 s | Drive | The battery drives a motor for each rear wheel, geared down nine times to turn it. | 6 |  |
| 6 s | Grip | Four fans in the tail pull the air from under the floor, so the air above holds it down. | 6.5 | 0.8 s fans → true |
| 12.5 s | Thrust | Air at 690 bar from the tanks blasts out of four rear nozzles, shoving the car forward. | 6 | 1 s thrust → true; 3 s thrust → false |

Shots 2 and 3 also draw air flows (`flows`, two paths each): in under the floor to the fans and out of the tail; from the main tank to two of the rear nozzles.

## 9. Simplified or left out

- "Tesla hasn't published drawings of its insides, so the fans, tanks and nozzles are laid out from its descriptions and its fan-car patent, not from the real parts" (summary); "The layout of the tanks, lines and nozzles is this model's" (credit.extra); "its insides are simplified" (README).
- The dimensions are measured off press photographs, scaled by the wheels (spec.mjs).
- The lift and yaw thrusts are this model's (aerocar.ts); "the hops here are smaller, worked out from the same numbers" (old tour "Flight").
- The fans are drawn at 3.2 turns a second, where "a real one turns hundreds of times a second"; the compressor "takes hours; here, at once" (aerocar.ts).
- In the code: the reduction gear is a case with no gears in it (platform.mjs); its 9 : 1 is only in the motion (content.mjs).

## 10. Log

- Not recorded per stage.
- Built before the standard procedure: tier D, 57 min + 39 min active time, rebuilt from the 2017 car (procedure.md, "How long it takes").
