# Rangefinder Camera: truth sheet

Tier B · slug `rangefinder-camera` · shipped before the standard procedure

Reconstructed on 18 October 2026 from the shipped page (content/rangefinder-camera.json, written by objects/rangefinder-camera/content.mjs) and the code that builds and drives it (objects/rangefinder-camera/, src/viewer/filmcamera.ts and cloth.ts, src/charts/camera.ts and optics.ts); no new research. Where they say nothing, this sheet says so.

## 1. The object

- **Exactly what:** a Leica M3 from 1955, "the camera that set the pattern for the type" (content: summary, facts). The page treats it as an early M3: two lever strokes a frame, the older speed series, a glass pressure plate (content: parts Advance lever and Pressure plate, callout 'Shutter speed dial'). The shell is Poly Haven's "Camera 01"; the shutter, film transport, rangefinder optics and iris were "built for 3D of Things after the Leica M3" (content: `credit`, `credit.extra`). The lens isn't named and its focal length isn't stated: the page gives f/1.4 to f/16 and eight elements; the code cuts the rangefinder cam for 51.6 mm (`CAM_FOCAL`) and the frame-line mask for 50 mm (mechanism.mjs comment).
- **Real size:** 14 cm wide (content: facts). No other overall dimension on the page or in the code.
- **The problem it solves:** not put as a problem on the page. What it does, in the page's words: finds the distance "the way a surveyor does" so the lens can be focused, then exposes each frame "down to a thousandth of a second" and winds on (content: summary).
- **Its one big idea (the principle):** two windows 68.5 mm apart look at the same subject; the second view shows as a bright patch, and turning the focusing ring swings it across until the two images lie on top of each other: "At that moment the lens is focused." Behind the lens, the exposure is the gap between two cloth curtains (content: summary, hook).

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | https://polyhaven.com/a/Camera_01 ("Camera 01", Rajil Jose Macatangay, Poly Haven): body, top cover and base in one shell, a lens, a strap (augment.mjs) | CC0 1.0 (content: `credit`) |
| Insides | built in code after the Leica M3: mechanism.mjs and textures.mjs, fitted by augment.mjs | ours (content: `credit.extra`) |
| Dimensions | content: facts and text; the layout in mechanism.mjs (camera frame: the source model's axes, in mm); the seams in augment.mjs `CUT` | as modelled; no outside source cited |
| Mechanism | none cited; filmcamera.ts says only "The numbers are the Leica M3's" | not stated on the page or in the code |

## 3. The energy chain

1. **Source:** two strokes of the Advance lever. Through the Advance gears they turn the Sprocket once (38 mm, one frame, its teeth in the perforations) and, through a second idler and a slipping clutch, the Take-up spool; the same strokes wind both curtains back across the frame, overlapping, and set the springs in the Curtain rollers (tour: Winding on; parts).
2. **Transmission:** the Shutter release lets go of the First curtain, and its spring roller pulls it across the frame in about 18 ms. After the delay set on the Shutter speed dial the Second curtain follows and covers the film again (tour: Shutter; parts).
3. **Control:** the Focusing ring turns a helicoid that screws the Optical unit forward; the Rangefinder cam on its back moves the Roller arm, whose shaft swings the Moving lens in the beam, so the patch from the Rangefinder optics slides across until the two pictures meet; the Frame-line mask shifts with the focus. The Aperture ring swings the Iris's nine blades in (tour: Focus, Rangefinder, Coupling, Aperture).
4. **Output:** light from each point of the subject goes through the Optical unit and the Iris, then the slit between the curtains, to a point on the Film in the 24 × 36 mm gate, 27.8 mm behind the mount: the picture, upside down and back to front (tour: Lens, Shutter).

## 4. Numbers

| Quantity | Value | Source |
|---|---|---|
| **Body** width | 14 cm | content: facts |
| Film plane | 27.8 mm behind the bayonet's face (the face at camera-frame z = 17.4 mm) | mechanism.mjs: `FILM_PLANE = FLANGE - 27.8`, `FLANGE`; content: tour Lens |
| Gate | 24 × 36 mm, centred on the lens axis | mechanism.mjs: `GATE`; content: parts Shutter, Film |
| **Film** | 35 mm wide; a frame is 38 mm (36 mm picture, 2 mm gap), eight perforations an edge at 4.75 mm pitch | textures.mjs: `FILM`; camera.ts: film-advance caption; content: part Film |
| Perforation | 2.79 mm along × 1.98 mm across, outer edge 2.01 mm in, corners 0.51 mm | textures.mjs: `FILM.hole` |
| Cassette, take-up | cassette shell radius 12.4 mm, film roll 9.0 mm; take-up core 6.5 mm, roll 7.2 mm | mechanism.mjs: `L.cassetteRadius`, `L.cassetteRoll`, `L.takeUpCore`, `L.takeUpRoll` |
| Strip as built | 130.03 mm, cassette roll to take-up roll | hints.json: `film.length` |
| **Lens** stops | f/1.4, 2, 2.8, 4, 5.6, 8, 11, 16; each half the light of the one before, so f/16 lets in 1/128 of f/1.4 | filmcamera.ts and mechanism.mjs: `STOPS`; content: part Aperture ring, tour Aperture |
| Elements | 8 | content: part Optical unit, tour Lens |
| Iris | 9 blades on pins 16.4 mm from the axis; opening radius 12.5 mm at f/1.4, scaled by 1.4/n; blades 0.024 mm thick, stacked 0.03 mm apart | mechanism.mjs: `IRIS`, `irisAngle` |
| Rest setting | f/5.6, focused at infinity, 1/250 s, cocked | filmcamera.ts: `REST_STOP`, `speed`; camera.ts: `RESTING` |
| Focal length the cam is cut for | 51.6 mm | mechanism.mjs and filmcamera.ts: `CAM_FOCAL` |
| Focusing law | x·x′ = f², film and subject 2f + x + x′ apart | mechanism.mjs and filmcamera.ts: `extensionFor` |
| Nearest focus | 0.7 m | `NEAREST` (700 mm in mechanism.mjs, 0.7 m in filmcamera.ts); content: part Focusing ring |
| Lens extension | 4.5 mm at 0.7 m (4.495 mm as built), 3 mm at 1 m, 1.4 mm at 2 m, none at infinity | content: part Focusing ring, tour Focus; hints.json: `lens.maxExtension`; camera.ts: focus-extension chart text |
| Focusing ring | a quarter turn from infinity to 0.7 m (motion: 0.05389 turn per mm of extension) | content: callout 'Focusing ring', motion `focus_ring` |
| Aperture ring | 0.045 turn a stop, counted from f/5.6 | content: motion `aperture_ring` (`turn` −0.045, `from` 4) |
| **Rangefinder** base | 68.5 mm | content: facts, summary, tour Rangefinder; filmcamera.ts: `RANGEFINDER_BASE` |
| Finder magnification | 0.91× | content: callout 'Viewfinder window'; filmcamera.ts: `FINDER_MAGNIFICATION` |
| Angle to a subject 2 m off | 1.96° | content: tour Rangefinder; camera.ts: rangefinder-triangle caption (`rangefinderAngle`) |
| Moving lens | swung about a millimetre; tilts the second view by up to 5.6° | content: part Moving lens, tour Coupling |
| Roller | radius 1.4 mm, on the cam 16.6 mm from the lens axis, at 100° round the mount | mechanism.mjs: `L.roller` |
| Beam, along x | window prism at −22.65 mm, frame-line mirror 20.1, mask 25.45, collimator 31.2, beam splitter 45.5; the beam at y 67.35, z 9.0 | mechanism.mjs: `L.rfWindow`, `L.illumination`, `L.mask`, `L.collimator`, `L.viewfinder`, `L.beam` |
| **Shutter** speeds | B, then 1 s to 1/1000 s in the older series (1/25, 1/50, 1/100…); in code 1, 1/2, 1/5, 1/10, 1/25, 1/50, 1/100, 1/250, 1/500, 1/1000 s (no B) | content: facts, callout 'Shutter speed dial'; filmcamera.ts: `SHUTTER_SPEEDS` |
| Curtain run | about 18 ms across the 36 mm frame, speeding up as the spring pulls: the edge is 0.6t + 0.4t² of the way (t a fraction of the 18 ms) | content: callout 'Shutter curtains', tour Shutter; filmcamera.ts: `CURTAIN_TRAVEL`, `FRAME_WIDTH`, `curtainAt` |
| Slit | 36 mm × speed / 18 ms, at most the frame: 2 mm at 1/1000 s; the whole frame open at once only from 1/50 s down | content: callout 'Shutter curtains'; filmcamera.ts: `slitWidth`, `FLASH_SYNC` |
| Curtains | first: 41.0 mm of cloth, 41.9 mm of tapes; second: 47.5 and 46.0 mm; cloth 0.15 mm thick, from y 19.4 to 48.2 mm; the edge runs from 1 mm before the gate to 1 mm past it | mechanism.mjs: `CURTAINS`, `CLOTH`, `CLOTH_Y`, `EDGE` |
| Curtain rollers | radius 2.18 mm; a roll grows 0.16 mm a turn | mechanism.mjs: `ROLLER`, `LAYER` |
| **Wind-on** strokes | 2 a frame | filmcamera.ts: `STROKES`; content: part Advance lever, tour Winding on |
| Film per frame | 38 mm, one turn of the sprocket | filmcamera.ts: `FRAME_ADVANCE`; mechanism.mjs: `L.sprocketRadius`; content: part Sprocket |
| Sprocket teeth | 8 a row, two rows | mechanism.mjs: `filmParts`; README ("an eight-tooth sprocket") |
| Gear teeth | lever 26, idler 17, sprocket 20, spool idler 10, spool drive 15; module 0.5 | mechanism.mjs: `L.teeth`, `L.module` |
| Turns a frame | sprocket 1, advance gear 0.7692, idler −1.1765, spool idler −2, spool drive 1.3333, take-up spool 0.84, cassette spool 0.672 | content: motion (control `film`); hints.json: `gears`, `film.perTurn` |
| Lever | 0.3847 turn a stroke; out in 0.45 s, back in 0.3 s; 12 ratchet clicks a stroke | content: motion `advance_lever`; filmcamera.ts: `STROKE_OUT`, `STROKE_BACK`, `tick` |
| Release | springs back over 0.18 s | filmcamera.ts: `tick` |
| **Scale** | 97.638 mm a model unit | hints.json: `space.mmPerUnit` |

## 5. The misconception

Not stated on the page. The nearest it comes is the Shutter step: "At 1/1000 s the second curtain runs only 2 mm behind the first, a narrow slit of light sweeping across the film; every part of it still gets the same thousandth of a second" (tour: Shutter; the shutter-timing chart's caption says the same).

## 6. Parts, grouped in chain order

| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
| Lens | `lens` | Lens mount | The bayonet that locks the lens to the camera, with the depth-of-field scale on its fixed ring. Everything else in the lens turns or slides inside it. | – |
| Lens | `focus_ring` | Focusing ring | Turns a fine thread (a helicoid) that screws the optical unit forward: 4.5 mm out for the nearest focus, 0.7 m. The distance scale is printed on it. | control: focus |
| Lens | `aperture_ring` | Aperture ring | Sets the iris, from f/1.4 wide open to f/16. Each click lets in half the light of the one before. | control: aperture |
| Lens | `hood` | Lens hood | A short tube that keeps stray light from glancing into the front glass. | with Optical unit |
| Lens | `optics` | Optical unit | Eight glass elements in a barrel. They bend the light from each point of the subject back to a point on the film, making the picture. | control: focus |
| Lens | `iris_blade_0` | Iris | Nine thin blades on pins. Turning the aperture ring swings them in together, closing a round hole in the middle of the lens. | control: aperture |
| Lens | `rf_cam` | Rangefinder cam | A curved face on the back of the optical unit. As the lens comes forward to focus close, it pushes the camera’s roller with it. | with Optical unit |
| Rangefinder | `rangefinder` | Rangefinder optics | The prism behind the small window sends its view across the camera to a beam splitter behind the eyepiece, which lays it over the main view as a bright patch. | – |
| Rangefinder | `roller_lever` | Roller arm | Rides on the lens’s cam. As the lens comes forward the arm turns on its shaft, and the same shaft swings the moving lens above. | control: focus |
| Rangefinder | `swinging_lens` | Moving lens | A small lens in the rangefinder’s beam. Swung a millimetre aside, it tilts the second view by up to 5.6°, which is what slides the patch’s image across. | with Roller arm |
| Rangefinder | `frame_mask` | Frame-line mask | A plate with the outline of the picture cut in it. Light from the frosted window shines through, so a bright frame floats in the viewfinder, and the mask shifts as you focus to allow for the finder sitting above the lens. | control: focus |
| Shutter | `shutter` | Shutter | A frame holding the curtains’ rollers just in front of the film, and the gate: the 24 × 36 mm opening that sets the size of each picture. | – |
| Shutter | `first_curtain` | First curtain | Covers the film until the shutter fires, then is pulled clear by its spring roller in under a fiftieth of a second. | control: curtain1 |
| Shutter | `second_curtain` | Second curtain | Follows the first one across, after a delay set by the speed dial, and covers the film again. The gap between them is the exposure. | control: curtain2 |
| Shutter | `roller_a1` | Curtain rollers | Each curtain runs between two rollers: one carries the cloth, the other the tapes from its edge. Springs in the rollers pull the curtains across; the advance lever winds them back. | control: curtain1 |
| Film | `film_cassette` | Film cassette | A light-tight tin with the unexposed film rolled up inside. The film comes out through a slot lined with velvet. | – |
| Film | `film` | Film | 35 mm film: each picture is 24 × 36 mm, and the holes along both edges, eight per frame, let the sprocket pull it exactly one frame at a time. | control: film |
| Film | `take_up_spool` | Take-up spool | Winds up the film as it is exposed. It is driven a little faster than the film moves, through a slipping clutch, so the film stays taut. | control: film |
| Film | `sprocket` | Sprocket | Its teeth sit in the film’s holes. One turn moves the film 38 mm, one frame, whatever the size of the rolls either side. | control: film |
| Film | `pressure_plate` | Pressure plate | A plate of glass on springs (metal on later cameras) that holds the film flat against the rails in the focal plane. | – |
| Controls | `top_plate` | Top cover | A brass cover over the rangefinder and the advance gears, carrying the windows, the dials and the accessory shoe. | – |
| Controls | `speed_dial` | Shutter speed dial | Sets the delay between the two curtains: 1 second to 1/1000. It doesn’t turn when the shutter fires. | – |
| Controls | `release_button` | Shutter release | Pressing it lets go of the first curtain. It sits in the middle of the advance lever’s hub. | control: release |
| Controls | `advance_lever` | Advance lever | Two strokes on this early M3 wind the film on one frame and rewind both shutter curtains, ready for the next picture. | control: lever |
| Controls | `advance_gear` | Advance gears | Carry the lever’s stroke to the sprocket and, through a second idler, to the take-up spool. | control: film |
| Controls | `rewind_knob` | Rewind knob | Turned at the end of the roll to wind the film back into its cassette. | – |
| Body | `body` | Body | A casting with chambers for the cassette and the take-up spool at either end, the shutter in the middle and the lens mount in front. | – |
| Body | `back_door` | Back door | Lifts up when the base plate is off, so the film can be threaded across the gate. It carries the pressure plate. | – |
| Body | `bottom_plate` | Base plate | The M3 loads from the bottom: turn the key and the whole base comes away, and the film goes in from below. | – |

## 7. Mechanism map

Nothing runs on time: every motion has a `control`. filmcamera.ts (`FilmCamera`, picked because the motions use `curtain1` and `focus`) sets the values, and src/viewer/linkage.ts turns them into the content's motions (README).

| Control | Value (filmcamera.ts) | Moves (content: `motion`) | Kind |
|---|---|---|---|
| `focus` | lens extension, 0 to 4.495 mm | Optical unit (`slide`; it carries the Aperture ring, Lens hood, Iris and Rangefinder cam), Focusing ring and Roller arm (`turn`; the arm carries the Moving lens), Frame-line mask (`slide`) | slide, turn |
| `aperture` | stop, 0 (f/1.4) to 7 (f/16) | Aperture ring (`turn`, `from` 4); each iris blade about its own pin (`curve`) | turn, curve |
| `curtain1`, `curtain2` | how far each curtain is across, 0 to 1 | First and Second curtain (`cloth`); their rollers, `roller_b1` and `roller_a1`, `roller_a2` and `roller_b2` (`curve`) | cloth, curve |
| `lever` | the lever's swing, 0 to 1 | Advance lever (`turn`) | turn |
| `release` | the press, 0 to 1 | Shutter release (`slide`) | slide |
| `film` | frames wound on | Film (`scroll` −1), Sprocket, Advance gears, Take-up spool, `cassette_spool` (`turn`) | scroll, turn |

- **filmcamera.ts** computes the extension for a distance (`extensionFor`, capped at `MAX_EXTENSION`), the stop, the curtains' run (`curtainAt`, the second delayed by the speed) and the lever's strokes (each eases on half a frame of film and half the curtains' wind-back). Its rules: `fire` only when cocked and not winding; `windOn` only after firing, once the curtains have run; the second stroke cocks. It calls `onShutter` and `onRatchet` for the sounds.
- **cloth.ts** lays each curtain out by arc length along its path, off one roller and onto the other (an Archimedean spiral on the rollers, straight between), with the same sums as `clothPath` in mechanism.mjs; the layout rides in the curtain node's `cloth` extras.
- **mechanism.mjs `partHints`** writes the pivots, the rollers' and blades' curves and the gear ratios to hints.json; the content's motions repeat them, and they match.
- **Experiments** (`try`): `focus` (Focus, Rangefinder, Coupling), `aperture` (Aperture), `shutter` (Shutter: pick a speed and fire, slowed down), `advance` (Winding on: take a picture, stroke the lever); src/pages/tour.ts runs them.
- **Charts**, all in src/charts/camera.ts and reading the camera's state: `focus-extension`, `rangefinder-view` and `rangefinder-triangle` (both for a subject 2 m off), `iris-stops`, `shutter-timing`, `film-advance`. src/charts/optics.ts holds only `binoculars-image`; nothing here uses it.
- **Flows:** `light` on Lens (four paths) and Rangefinder (three); `power` on Winding on, from the lever through the idler to the sprocket and along the film to the take-up spool.
- **Build checks:** augment.mjs fails if a generated part clashes with anything (bar its `CONTACTS`) or if the content's explode passes one piece through another (README).

## 8. Tour (5–7 steps)

| # | Label | Shows (focus, flow) | Chart | Try |
|---|---|---|---|---|
| 1 | Lens | Optical unit, Film, Shutter; light flow (4 paths) |  |  |
| 2 | Focus | Lens mount, Focusing ring, Optical unit, Aperture ring, Lens hood | focus-extension | focus |
| 3 | Rangefinder | Rangefinder optics, Moving lens, Frame-line mask; light flow (3 paths) | rangefinder-view: | focus |
| 4 | Coupling | Roller arm, Moving lens, Rangefinder cam | rangefinder-triangle: | focus |
| 5 | Aperture | Iris, iris_blade_1, iris_blade_2, iris_blade_3, iris_blade_4, iris_blade_5, iris_blade_6, iris_blade_7, iris_blade_8, iris_ring, Aperture ring | iris-stops | aperture |
| 6 | Shutter | Shutter, First curtain, Second curtain, Curtain rollers, roller_a2, roller_b1, roller_b2; hides Back door, Pressure plate, Film | shutter-timing | shutter |
| 7 | Winding on | Film, Film cassette, Take-up spool, Sprocket, Advance gears, Advance lever, Shutter, First curtain, Second curtain, Curtain rollers, roller_a2, roller_b1, roller_b2; power flow; hides Back door, Pressure plate | film-advance | advance |

Settings as the steps start (content: `settings`): Lens at ∞ and f/1.4; Rangefinder and Aperture at ∞; Shutter at 1/250 s. Steps 3 and 4 give their charts as `{ type, subject: 2 }` with no title, hence the bare colon.

## 9. Simplified or left out

- The insides aren't in the source model: they were "built for 3D of Things after the Leica M3, and fitted inside the model" (content: `credit.extra`).
- The strap goes; its split rings stay on the lugs (augment.mjs; README: "the camera's strap is left off").
- The shell is cut along flat planes at the top cover's and base plate's seams, split into top cover, body, base plate and back door, and thickened inwards; the dark boxes behind the windows and the dark disc behind the lens are taken out so the insides show (augment.mjs).
- The body casting is reduced to a light box, a bulkhead, a deck, a floor and the film chambers' walls (mechanism.mjs `castingParts`).
- No springs or cocking gears in the shutter: their housings are plain blocks, and the rollers turn straight from the curtain controls (mechanism.mjs `shutterParts`). The take-up's slipping clutch has no part of its own: the drive gear just turns faster than the spool (1.3333 against 0.84 turns a frame).
- The rolls of film don't grow or shrink: the spools turn at fixed rates for fixed roll radii (hints.json `film.perTurn`), and the film's picture scrolls along a fixed strip (README: "the film's perforations moving along it").
- Not animated: the Shutter speed dial (the page says it doesn't turn when the shutter fires; it doesn't turn when a speed is picked either) and the Rewind knob. B is on the page but not among the code's speeds.
- The mask carries only the 50 mm frame lines (mechanism.mjs).
- The shutter step "runs slowed down" (content: tour Shutter); the viewfinder chart is drawn about 32° across, "a closer view than the finder's own" (camera.ts).
- The callouts' positions and cameras are typed in model space, not placed from the build's named points; the motions come from the hints and the tour's points are given in the camera frame's millimetres (content.mjs header).

## 10. Log

Not recorded per stage: built before the standard procedure, in 2 h 07 of active time (references/procedure.md, "How long it takes": Leica M3, tier B).
