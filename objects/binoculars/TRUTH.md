# Binoculars: truth sheet

Tier A · slug `binoculars` · shipped before the standard procedure

Reconstructed on 18 October 2026 from the shipped page (content/binoculars.json, written by objects/binoculars/content.mjs) and the code that drives it; no new research. Where the page says nothing, this sheet says so.

## 1. The object

- **Exactly what:** Porro-prism binoculars (facts: "Design"), from Poly Haven's "Vintage Binoculars" by Luke. Make, model and year: not stated on the page.
- **Real size:** 20 cm long (facts: "Real size"). No other dimensions stated.
- **The problem it solves:** a simple telescope shows the world upside down (summary); each half here is a small telescope whose picture comes out upright, in a short body.
- **Its one big idea (the principle):** two prisms in each barrel bounce the light four times, turning the image upright and folding a long light path into a short body (hook, summary).

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | https://polyhaven.com/a/vintage_binocular ("Vintage Binoculars", Luke) | CC0 1.0 (content: credit), checked by `npm run models:fetch` |
| Dimensions | content: facts "Real size", 20 cm long | its source: not stated on the page |
| Mechanism | none cited on the page | – |

## 3. The energy chain

source → transmission → control → output. One line each, naming the parts.

1. **Source:** light from the scene enters the objective lens at the front of the Left barrel and the Right barrel; it gathers the light and forms a small image inside the barrel, upside down and back to front.
2. **Transmission:** in each barrel's bulge, two right-angled Porro prisms each reflect the light twice: the first turns the image over top to bottom, the second side to side. The fold packs a long path into a short body and sets the objectives wider apart than the eyepieces.
3. **Control:** the Focus wheel slides both eyepieces in or out together; the Diopter ring then sharpens the Right eyepiece on its own; the Hinge (under the Hinge cap) swings the halves to the distance between your eyes.
4. **Output:** the Left eyepiece and Right eyepiece magnify the upright image like a magnifying glass: objective focal length ÷ eyepiece focal length, about 7×.

## 4. Numbers

| Quantity | Value | Source |
|---|---|---|
| Design | Porro prism | content: facts |
| Reflections | 4 per side: two prisms, each reflecting twice | content: facts; callout 'Porro prisms' |
| Real size | 20 cm long | content: facts |
| Objective focal length | about 180 mm, for "a typical pair" | content: how step 3 text and chart |
| Eyepiece focal length | about 25 mm, for "a typical pair" | content: how step 3 text and chart |
| Magnification | 180 ÷ 25 mm, about 7×; the first number in "7 × 50" | content: how step 3 chart caption |
| Eye spacing the hinge matches | typically 56 to 74 mm | content: callout 'Hinge' |

The focal lengths are the page's typical pair, not measured on this model.

## 5. The misconception

Not stated on the page.

## 6. Parts, grouped in chain order

| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
|  | `vintage_binocular_left_prism` | Left barrel | One of the two small telescopes: the objective lens at the front, a pair of Porro prisms in the bulge. | – |
|  | `vintage_binocular_right_prism` | Right barrel | The second telescope, a mirror image of the first, with its own objective lens and prisms. | – |
|  | `vintage_binocular_left_lens` | Left eyepiece | Lenses that magnify the image formed inside the barrel. The focus wheel moves both eyepieces together. | – |
|  | `vintage_binocular_right_lens` | Right eyepiece | Like the left one, but with its own diopter ring, to make up for the difference between your eyes. | – |
|  | `vintage_binocular_diopter` | Diopter ring | Sharpens the right eyepiece on its own, once the focus wheel has set the left. | – |
|  | `vintage_binocular_focus` | Focus wheel | Slides both eyepieces in or out together, to focus near or far. | – |
|  | `vintage_binocular_eye_relief` | Hinge cap | Caps the central hinge that the two halves pivot on. | – |
|  | `vintage_binocular_middle` | Hinge | Lets the two halves swing to match the distance between your eyes. | – |

The page gives no groups; the order is the page's.

## 7. Mechanism map

- **Nothing moves:** no `motion`, no `motionLabel`, no `try` experiment. Taking it apart moves the parts out in two stages (0, 1); the Hinge stays put.
- **Light:** steps 1–3 carry `light` flows, one path per barrel (`flow` for the left, `flows` for the right): objective, the two prisms, eyepiece. In those steps the barrels are left out of `focus`, so they turn to ghosts and the path shows inside.
- **Charts:** `binoculars-image` in step 2 (src/charts/optics.ts, "What the picture does": a letter F upside down after the objective, the right way round after the 4 reflections, enlarged by the eyepiece), made for this object; generic `bars` "Magnification" in step 3 (Objective 180, Eyepiece 25 mm, `picked: 0`).
- **Nothing new** beyond that chart.

## 8. Tour (5–7 steps)

| # | Label | Shows (focus, flow) | Chart | Try |
|---|---|---|---|---|
| 1 | Objective | Left eyepiece, Right eyepiece, Diopter ring, Focus wheel, Hinge cap, Hinge; light flow (2 paths) |  |  |
| 2 | Prisms | Left eyepiece, Right eyepiece, Diopter ring, Focus wheel, Hinge cap, Hinge; light flow (2 paths) | binoculars-image |  |
| 3 | Eyepiece | Left eyepiece, Right eyepiece, Diopter ring, Focus wheel, Hinge cap, Hinge; light flow (2 paths) | bars: Magnification |  |
| 4 | Focus | Left eyepiece, Right eyepiece, Focus wheel, Diopter ring |  |  |

Four steps on the page.

## 9. Simplified or left out

- No `hide` and no `credit.extra`; the page says nothing is simplified.
- The objective lenses and prisms are not separate parts: they are named inside Left barrel and Right barrel, and the light path stands in for them.

## 10. Log

Not recorded per stage: built before the procedure; the first six Poly Haven objects, this one among them, took 1 h 16 in all (references/procedure.md, "How long it takes").
