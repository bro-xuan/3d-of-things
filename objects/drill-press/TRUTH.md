# Drill Press: truth sheet

Tier A · slug `drill-press` · shipped before the standard procedure

Reconstructed on 18 October 2026 from the shipped page (content/drill-press.json, written by objects/drill-press/content.mjs) and the code that drives it; no new research. Where the page says nothing, this sheet says so.

## 1. The object

- **Exactly what:** a belt-driven drill press with stepped pulleys (hook, summary), from Poly Haven's "Drill Press 01" by Viktor. Make, model and year: not stated on the page.
- **Real size:** 90 cm tall (facts: "Real size"). No other dimensions stated.
- **The problem it solves:** it holds a drill rigidly upright, so holes go in straight and to a set depth (summary).
- **Its one big idea (the principle):** one motor at one speed; moving the V-belt between two mirror-image stepped pulleys changes the spindle's speed, slow with more force or fast with less (hook, summary).

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | https://polyhaven.com/a/drill_press_01 ("Drill Press 01", Viktor) | CC0 1.0 (content: credit), checked by `npm run models:fetch` |
| Dimensions | content: facts "Real size", 90 cm tall | its source: not stated on the page |
| Mechanism | none cited on the page | – |

## 3. The energy chain

source → transmission → control → output. One line each, naming the parts.

1. **Source:** an induction motor at the back of the Column, head & motor, fed by its cord and started by the Switches, runs at one fixed speed, about 1,400 rpm.
2. **Transmission:** the Motor pulley on its shaft drives the V-belt, whose wedge section jams into the grooves (the harder it pulls, the tighter it grips), and the belt turns the Spindle pulley.
3. **Control:** which pair of grooves the belt sits in sets the speed: five positions, about 550 to 3,580 rpm; lift the Belt guard to move it. The Feed handles lower the spinning spindle by a rack and pinion, a spring lifts it back, and the Depth stop limits its travel.
4. **Output:** the Chuck & bit spins with the spindle and comes down into the work on the Table, which slides up and down the column, clamps where you want it and has slots for the bit to pass through.

## 4. Numbers

| Quantity | Value | Source |
|---|---|---|
| Motor speed | one fixed speed, about 1,400 rpm ("typically around 1,400 rpm") | content: callout 'Motor'; how step 1 text and tag |
| Belt positions | 5 | content: how step 2 chart caption and `speeds` |
| Pulley grooves | about 45 to 115 mm across | content: how step 2 chart caption |
| Spindle speed, positions 1–5 | about 550, 840, 1,400, 2,330, 3,580 rpm ("roughly 550 to 3,600") | content: how step 2 chart 'Spindle speed', `speeds` notes |
| Speed factors, positions 1–5 | 0.39, 0.6, 1, 1.67, 2.56 × the motor's speed (3 is equal pulleys) | content: how step 2 `speeds` |
| Example ratio | a 2 : 1 pair halves the speed and doubles the turning force | content: callout 'Stepped pulleys' |
| Real size | 90 cm tall | content: facts |

The groove sizes of positions 2 and 4 are not stated on the page.

## 5. The misconception

Not stated on the page.

## 6. Parts, grouped in chain order

| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
|  | `drill_press_01_lid` | Belt guard | Covers the pulleys and belt. Lift it to move the belt to another speed. | – |
|  | `drill_press_01_plate` | Table | Slides up and down the column and clamps where you want it, with slots for the bit to pass through. | – |
|  | `drill_press_01_belt` | V-belt | Its wedge-shaped section jams into the pulley grooves, carrying the motor’s turn to the spindle. | – |
|  | `drill_press_01_handle` | Feed handles | Turn a pinion against a rack on the spindle’s sleeve, lowering the spinning bit into the work. | – |
|  | `drill_press_01_bit` | Chuck & bit | Grips the bit. It spins with the spindle and comes down when you pull the handles. | time, 90 rpm |
|  | `drill_press_01_limiter` | Depth stop | A stop on a threaded rod, so every hole in a batch ends at the same depth. | – |
|  | `drill_press_01_button_a` | Switches | Start and stop the motor. | – |
|  | `drill_press_01_gear_a` | Motor pulley | A stack of grooves on the motor shaft, mirroring the spindle pulley; where the belt sits sets the speed. | time, 90 rpm |
|  | `drill_press_01_gear_b` | Spindle pulley | The matching stack of grooves on the spindle, turned by the belt from the motor pulley. | time, 90 rpm |
|  | `drill_press_01` | Column, head & motor | The column carries the head, which holds the spindle at the front and the motor at the back. The cord brings the motor its power. | – |

The page gives no groups; the order is the page's.

## 7. Mechanism map

- **Time:** three `speed` spins about the vertical (y) axis, each −1.5 turns a second (90 rpm, far below the page's 1,400 rpm): Motor pulley, Spindle pulley, Chuck & bit. `motionLabel` "Switch it on".
- **Belt position:** measured from the model's vertices, the V-belt sits in the Motor pulley's second-smallest groove (rim 56 mm, the belt about 44 mm across in it) and the Spindle pulley's second-largest (rim 90 mm, the belt about 79 mm across): position 2 of the five, small driving big, about 0.6 of the motor's speed (the page's 840 rpm). The motions turn both pulleys at the same −1.5, so the film slows the Spindle pulley and the Chuck & bit to 0.6 with `spin`; the belt can't move between grooves, so the film shows no other speed.
- **Film:** the spins run at real time through all three shots. Every shot frames the whole press at one size; the camera only goes round. Solid: the pulleys, the V-belt, the Chuck & bit and the Table the work is clamped to (which also keeps the glass of the column and base, far from the head, from fading away); the Belt guard, the head and the motor's casing are glass.
- **Flows:** `power`, one path through the whole film: the motor up to the Motor pulley, along the V-belt to the Spindle pulley, down the spindle to the bit's tip.
- **Not animated:** the feed (rack and pinion, spring), the Depth stop, the Table and the Belt guard; so the film shows the drive, not a hole being drilled.
- **Nothing new:** generic spins and the `power` flow.

## 8. Film (15–25 s, 2–5 shots)

The mechanism doing its job once, start to finish (references/film.md).

| At | Chapter | Caption | Seconds | Cues |
|---|---|---|---|---|
| 0 s | Motor | The motor at the back spins the stepped pulley on its shaft, at one steady speed. | 6 |  |
| 6 s | Belt | The V-belt wedges into a groove of each pulley and carries the turn forward to the spindle. | 6 |  |
| 12 s | Spindle | A small groove drives a bigger one, so the bit turns slower than the motor, about 840 rpm. | 7 |  |

## 9. Simplified or left out

- No `hide` and no `credit.extra`; the page says nothing is simplified.
- The motor, spindle, its sleeve, the rack and pinion and the return spring are not separate parts: they are named in the text, and the motor is inside Column, head & motor (the 'Motor' callout has no node).

## 10. Log

Not recorded per stage: built before the procedure; the first six Poly Haven objects, this one among them, took 1 h 16 in all (references/procedure.md, "How long it takes").
