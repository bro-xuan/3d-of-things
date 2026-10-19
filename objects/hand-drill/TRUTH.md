# Hand Drill: truth sheet

Tier A · slug `hand-drill` · shipped before the standard procedure

Reconstructed on 18 October 2026 from the shipped page (content/hand-drill.json, written by objects/hand-drill/content.mjs) and the code that drives it; no new research. Where the page says nothing, this sheet says so.

## 1. The object

- **Exactly what:** a hand drill whose crank turns a face-gear wheel of 80 teeth, driving a 24-tooth pinion on the spindle (summary), from Poly Haven's "Vintage Hand Drill" by Yann Kervran & Benjamin McDonnell. Make, model and year: not stated on the page.
- **Real size:** 49 cm tall (facts: "Real size"). No other dimensions stated.
- **The problem it solves:** drilling small holes in wood, where speed matters more than force (summary).
- **Its one big idea (the principle):** gearing up: 80 ÷ 24 = 3⅓ turns of the bit for each turn of the handle, paid for in torque; the teeth on the wheel's face turn the sideways crank into the drill's vertical spin (summary, callout 'Face gear').

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | https://polyhaven.com/a/vintage_hand_drill ("Vintage Hand Drill", Yann Kervran & Benjamin McDonnell) | CC0 1.0 (content: credit), checked by `npm run models:fetch` |
| Dimensions | content: facts "Real size", 49 cm tall | its source: not stated on the page |
| Mechanism | none cited on the page | – |

## 3. The energy chain

source → transmission → control → output. One line each, naming the parts.

1. **Source:** your arm on the Crank & drive wheel: the crank arm is a lever, and one turn of your hand is one turn of the wheel.
2. **Transmission:** the wheel's 80 teeth, cut into its back face, mesh at right angles with the 24-tooth Drive pinion fixed to the spindle, which turns 3⅓ times per turn of the wheel.
3. **Control:** the Frame & handle holds the gears in mesh; the Idler pinion meshes with the top of the wheel, turns the opposite way and drives nothing, keeping the teeth meshed when you lean on the drill.
4. **Output:** the Chuck & bit turns with the pinion, 3⅓ times per crank with under a third of your twist; the push that makes the bit bite comes from you, on the top handle.

## 4. Numbers

| Quantity | Value | Source |
|---|---|---|
| Drive wheel | 80 teeth, on its back face | content: facts 'Gear ratio'; summary; callout 'Face gear' |
| Drive pinion | 24 teeth | content: facts 'Gear ratio'; callout 'Drive pinion' |
| Bit turns per crank | 80 ÷ 24 = 3⅓ | content: facts; hook; how step 2 chart 'Turns, gear to gear' (3.33) |
| Turning force at the bit | under a third of your hand's (0.3, ÷3⅓) | content: how step 3 text and chart 'The trade' |
| Real size | 49 cm tall | content: facts |

The idler pinion's tooth count is not stated on the page.

## 5. The misconception

Not stated on the page as one. Closest: the step 3 chart caption, "Gears can’t make work out of nothing: what the bit gains in speed, it loses in force", and the 'Handle' callout, "The gears supply the speed; the pressure that makes the bit bite into the wood comes from you."

## 6. Parts, grouped in chain order

| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
|  | `vintage_hand_drill_crank` | Crank & drive wheel | The crank turns the big wheel, whose 80 teeth, cut into its face, drive the pinions. | time, 24 rpm |
|  | `vintage_hand_drill_cog1` | Idler pinion | Meshes with the top of the wheel to keep its teeth engaged. It drives nothing. | time, 80 rpm |
|  | `vintage_hand_drill_cog2` | Drive pinion | 24 teeth on the spindle: it turns three and a third times for every turn of the handle. | time, 80 rpm |
|  | `vintage_hand_drill_head` | Chuck & bit | Jaws inside the sleeve close round the bit’s shank and keep it centred on the spindle. | time, 80 rpm |
|  | `vintage_hand_drill` | Frame & handle | The frame holds the gears in mesh. You push on the handle while you crank. | – |

The page gives no groups; the order is the page's.

## 7. Mechanism map

- **Time:** four `speed` spins, each with a `pivot` on its own axle. Crank & drive wheel: −0.4 turns a second about z (the sideways crank axle). Drive pinion and Chuck & bit: −1.3333 about y (the vertical spindle), 3⅓ times the crank. Idler pinion: +1.3333 about y, the other way. `motionLabel` "Turn the crank".
- **Film:** the spins run at real time through all three shots. The "handle" tag and the power flow's first points `ride` round with the crank, as does the 'Crank handle' callout. Every shot frames the whole drill, top handle to bit, at one size, on the frame and the chuck and bit (whose box doesn't change as they turn, where the crank's handle would swing it about); the camera only goes round.
- **Flows:** `power`, one path through the whole film: handle round to the axle, down the wheel to the Drive pinion, down through the Chuck & bit to its tip.
- **Nothing new:** generic spins and the `power` flow.

## 8. Film (15–25 s, 2–5 shots)

The mechanism doing its job once, start to finish (references/film.md).

| At | Chapter | Caption | Seconds | Cues |
|---|---|---|---|---|
| 0 s | Crank | Your hand on the crank turns the big wheel round, once for every turn of the handle. | 6 |  |
| 6 s | Gears | Its 80 face teeth turn the 24-tooth pinion on the spindle 3⅓ times for every turn. | 7 |  |
| 13 s | Bit | The chuck turns with the spindle, so the bit spins 3⅓ times as fast as your hand. | 6 |  |

## 9. Simplified or left out

No `hide` and no `credit.extra`; the page says nothing is simplified.

## 10. Log

Not recorded per stage: built before the procedure; the first six Poly Haven objects, this one among them, took 1 h 16 in all (references/procedure.md, "How long it takes").
