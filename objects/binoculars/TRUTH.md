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
| Objective focal length | about 180 mm, for "a typical pair" | the tour before the film; not on the page now |
| Eyepiece focal length | about 25 mm, for "a typical pair" | the tour before the film; not on the page now |
| Magnification | about 7× (180 ÷ 25 mm); the first number in "7 × 50" | content: film shot 3 caption ("about seven times"); the working was in the tour before the film |
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
- **Light:** the film draws the light as `light` flows, one path per barrel (`flow` for the left, `flows` for the right), grown shot by shot: through the objective, then the two prisms, then the eyepiece. The barrels (which hold the objectives and prisms), the hinge and the focus wheel are glass all through; the eyepieces and the diopter ring are solid.
- **The camera** frames the whole pair at every shot and orbits round the left barrel's side (64°, 92°, 120°), so the path runs left to right across the frame.
- **No charts.** The tour's `binoculars-image` chart (src/charts/optics.ts) is no longer used by this page.
- **Nothing new.**

## 8. Film (15–25 s, 2–5 shots)

The mechanism doing its job once, start to finish (references/film.md).

| At | Chapter | Caption | Seconds | Cues |
|---|---|---|---|---|
| 0 s | Objective | The big front lens gathers the light and forms an upside-down image inside the barrel. | 6 |  |
| 6 s | Prisms | Two prisms bounce it four times, turning the picture upright and folding the path short. | 6.5 |  |
| 12.5 s | Eyepiece | The eyepiece magnifies that upright image, about seven times, for your eye. | 6 |  |

## 9. Simplified or left out

- No `hide` and no `credit.extra`; the page says nothing is simplified.
- The objective lenses and prisms are not separate parts: they are named inside Left barrel and Right barrel, and the light path stands in for them.

## 10. Log

Not recorded per stage: built before the procedure; the first six Poly Haven objects, this one among them, took 1 h 16 in all (references/procedure.md, "How long it takes").
