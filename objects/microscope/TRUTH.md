# Microscope: truth sheet

Tier A · slug `microscope` · shipped before the standard procedure

Reconstructed on 18 October 2026 from the shipped page (content/microscope.json, written by objects/microscope/content.mjs) and the code that drives it; no new research. Where the page says nothing, this sheet says so.

## 1. The object

- **Exactly what:** a compound microscope lit by a mirror under the stage, with its objectives on a turret (summary, facts, parts), from Poly Haven's "Vintage Microscope" by Luis José Fernández Rodríguez. Make, model and year: not stated on the page.
- **Real size:** 40 cm tall (facts: "Real size"). No other dimensions stated.
- **The problem it solves:** not stated as such; the page has it magnify a specimen cut thin enough to see through, lit from below (summary, how step 1).
- **Its one big idea (the principle):** magnifying in two stages that multiply: the objective forms an enlarged image inside the tube and the eyepiece enlarges that again, so a 40× objective under a 10× eyepiece gives 400× (summary).

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | https://polyhaven.com/a/vintage_microscope ("Vintage Microscope", Luis José Fernández Rodríguez) | CC0 1.0 (content: credit), checked by `npm run models:fetch` |
| Dimensions | content: facts "Real size", 40 cm tall | its source: not stated on the page |
| Mechanism | none cited on the page | – |

## 3. The energy chain

source → transmission → control → output. One line each, naming the parts.

1. **Source:** daylight from a window (or a lamp), caught by the Mirror, which the Mirror arm lets swing, and sent straight up.
2. **Transmission:** the Condenser under the stage gathers it into a bright, even spot on the slide, which sits on the round stage of the Arm & stage over a hole.
3. **Control:** turn the turret of Objectives (the nosepiece) to click another objective into line; the Focus knobs turn a small gear against a toothed rack, raising or lowering the whole tube until the specimen is sharp.
4. **Output:** the objective forms a magnified image inside the tube, and the eyepiece at the top of the Tube & eyepiece magnifies it again: 10× under 10× is 100×, 40× under 10× is 400×. The Foot keeps it steady.

## 4. Numbers

| Quantity | Value | Source |
|---|---|---|
| Objectives | 3, of different strengths, on the nosepiece | content: callout 'Objectives' |
| Objective strengths named | 10× and 40× | content: summary; how step 2 text and tag |
| Eyepiece | usually 10× | content: callout 'Eyepiece'; how step 2 tag |
| Magnification | objective × eyepiece: 10 × 10 = 100×, 40 × 10 = 400× | content: facts 'Magnification'; summary; how step 2 text and chart 'How big it looks' |
| Real size | 40 cm tall | content: facts |

The third objective's strength is not stated on the page.

## 5. The misconception

Not stated on the page.

## 6. Parts, grouped in chain order

| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
|  | `vintage_microscope_eye_piece` | Tube & eyepiece | The eyepiece at the top magnifies the image the objective has formed inside the tube. | – |
|  | `vintage_microscope_revolver` | Objectives | Lenses of different strengths on a turret. Turn it to click a new one into line over the slide. | – |
|  | `vintage_microscope_adjustment` | Focus knobs | Turn a small gear against a toothed rack, raising or lowering the whole tube to focus. | – |
|  | `vintage_microscope_condenser` | Condenser | A lens under the stage that gathers the mirror’s light and spreads it evenly over the specimen. | – |
|  | `vintage_microscope_mirror_arm` | Mirror arm | Holds the mirror under the stage and lets it swing to catch the light. | – |
|  | `vintage_microscope_mirror_base` | Mirror | Tilt it toward a window or lamp to bounce light up through the specimen. | – |
|  | `vintage_microscope_rack_mount_support` | Arm & stage | The arm carries the tube and focus gear; the stage is the round table the slide sits on. | – |
|  | `vintage_microscope_base` | Foot | A heavy horseshoe base that keeps the microscope steady while you focus. | – |

The page gives no groups; the order is the page's.

## 7. Mechanism map

- **Nothing moves:** no `motion`, no `motionLabel`, no `try` experiment. The turret, the focus rack and the mirror's swing are in the text only. Taking it apart moves the parts out in three stages (0–2); Arm & stage and Foot stay put.
- **Light:** steps 1 and 2 carry `light` flows: into the Mirror and up through the Condenser to the slide (step 1), then up through the Objectives and Tube & eyepiece (step 2).
- **Charts:** generic `ladder` "How big it looks" in step 2, log scale (Specimen 1×, Objective 10×, Eyepiece 100×).
- **Nothing new.**

## 8. Tour (5–7 steps)

| # | Label | Shows (focus, flow) | Chart | Try |
|---|---|---|---|---|
| 1 | Light | Mirror, Mirror arm, Condenser; light flow |  |  |
| 2 | Lenses | Objectives, Tube & eyepiece, Condenser, Mirror; light flow | ladder: How big it looks |  |
| 3 | Focus | Focus knobs, Tube & eyepiece, Objectives |  |  |

Three steps on the page.

## 9. Simplified or left out

- No `hide` and no `credit.extra`; the page says nothing is simplified.
- The focus gear and its rack are not separate parts: the page puts them in Focus knobs and Arm & stage ("a toothed rack on the arm").

## 10. Log

Not recorded per stage: built before the procedure; the first six Poly Haven objects, this one among them, took 1 h 16 in all (references/procedure.md, "How long it takes").
