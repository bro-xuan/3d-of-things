# Medium-Format SLR: truth sheet

Tier C · slug `reflex-camera` · shipped before the standard procedure

Reconstructed on 18 October 2026 from the shipped page (content/reflex-camera.json, written by objects/reflex-camera/content.mjs) and the code that builds and drives it (objects/reflex-camera/, src/viewer/reflexcamera.ts, src/charts/reflex.ts); no new research. Where they say nothing, this sheet says so.

## 1. The object

- **Exactly what:** a medium-format single-lens reflex "after the Hasselblad 500C/M" (credit), the 500C/M made 1970–1994 (content: facts). A cubic body with the mirror, two rear flaps and the winding gears; an 80 mm f/2.8 "of the Planar type" with its own leaf shutter (part 'Lens'); a film magazine for 120 film "after the Hasselblad A12" (back.mjs); a folding hood (finder.mjs). No variant beyond that: the body's name plate is blank (body.mjs), and the lens's name ring reads "1 : 2.8 f = 80 mm" and "No 5 712 304" (generate.mjs `nameRing`).
- **Real size:** 110 × 114 × 176 mm with lens and magazine (content: facts). The built model measures 109.2 × 114.4 × 176.1 mm (W × H × D; the size generate.mjs logs, read from public/models/reflex-camera.glb).
- **The problem it solves:** not stated as such. The page's nearest: you see the lens's own picture on a ground-glass screen, and because the parts come off you can "change films halfway through a roll" or, with another finder, "hold it at eye level" (summary).
- **Its one big idea (the principle):** the focusing screen is exactly as far from the lens as the film is, 74.9 mm by way of a 45° mirror, so what is sharp on the screen is sharp on the film (step 'Light'; layout.mjs). Taking the picture is a sequence: the lens's shutter shuts, the mirror flies up, the flaps open, and only then does the shutter in the lens open; one turn of the knob resets the lot and winds on (summary, hook).

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | Built in code: objects/reflex-camera/generate.mjs, from body.mjs, lens.mjs, back.mjs, finder.mjs and scripts/kit/. Credit: "Medium-format SLR, after the Hasselblad 500C/M", 3D of Things, "built in code for this site" | CC0 1.0 (credit) |
| Dimensions | "the 500C/M's published dimensions" (credit.extra), not named further. As the code gives them (layout.mjs, mm, origin at the middle of the picture on the film, z forward): body shell x −44…44, y −44…46, z 3.5…72.5; magazine z −41.5…3.5; finder folded, y 46…68.5; lens seat 74.9 in front of the film | as built; the published source isn't identified in the repo |
| Mechanism | "the factory service manual's exploded views and release-sequence chart" (credit.extra; the summary says "timing chart"). reflexcamera.ts: the drive key's angles (117°, 268°, 309°) are the manual's, "the times are this model's" | manual not identified further (no title, number or year) |
| Magazine | "after the Hasselblad A12" (back.mjs header) | code comment only |
| Shutter blades | outlines "Found by .cache/hasselblad/leafsearch.mjs" (lens.mjs, `SHUTTER`) | a fitting script, git-ignored; not a source |
| Focal-plane comparison | "the rangefinder's cloth curtains", the whole frame open only up to 1/50 s (step 'Flash'; chart 'leaf-shutter') | the site's own rangefinder page |

## 3. The energy chain

source → transmission → control → output, as the page and the code tell it.

1. **Source:** your hand: one turn of the Winding knob, which "does everything" (part 'Winding knob'); then a finger on the release button.
2. **Transmission:** the knob's winding gear (30 teeth) drives the Winding gears on the right-hand wall: an idler (16) to the cross shaft (35) and a 16 : 16 bevel pair to the Bayonet plate's drive shaft, turning the drive key back 309° (which cocks the lens's shutter and opens its blades and iris for viewing); the flaps' barrel (32) is wound; the magazine gear (20) reaches through the back into the Film magazine's input (14), idler (16) and spool drive (24), winding the film a frame onto the take-up spool; a cam on the knob's shaft lowers the Mirror (step 'Winding'; body.mjs `TRAIN`; back.mjs `MAG_TRAIN`). The energy waits in the drive key's spring (part 'Bayonet plate'), the flaps' spring (tag 'Flaps' spring') and the mirror's spring (reflexcamera.ts).
3. **Control:** the release button, locked while the Dark slide is in (reflexcamera.ts `fire`): the lens's shutter shuts and the key turns to 117°, the iris closes to the stop set, the Mirror swings up, the Rear flaps open, the key reaches 268° and lets the shutter go at 50 ms; letting go closes the flaps and the key ends at 309° (`STAGES`; step 'Release').
4. **Output (light):** while you look, Lens → Mirror at 45° → Focusing screen, under the Folding hood; mirror up and flaps open, the leaf shutter's five blades open for the speed set (1 s to 1/500 s) at the stop set (f/2.8 to f/22), and the picture falls on the film, 56 mm square, held flat by the Film insert's pressure plate (steps 'Light', 'Shutter', 'Magazine').

## 4. Numbers

Every value appears in the content or the code; nothing here is researched.

**Film and picture**

| Quantity | Value | Source |
|---|---|---|
| Film | 120 roll film, twelve frames | content: facts 'Film'; reflexcamera.ts `FRAMES` |
| Picture | 56 × 56 mm | content: facts 'Film'; layout.mjs `PICTURE` |
| Film width | 61.5 mm | layout.mjs `FILM_WIDTH` |
| Frame pitch | 60.5 mm (a 4.5 mm gap between pictures) | layout.mjs `FRAME_PITCH`; chart 'film-roll' caption |
| Film path in the magazine | 128.31 mm | back.mjs `FILM_LENGTH` (hints.json `film.length`) |
| Rolls (radius) | supply 11.8 mm, full at frame 1; take-up 6.7 mm | back.mjs `ROLLS` |
| Spool turns per frame | supply 0.816, take-up 1.4371 | hints.json `spools.perFrame`; content: motion `supply_spool`, `take_up_spool` |
| Frame counter | numbers 1–12, 1/12 turn a frame | generate.mjs `counterDial`; content: motion `frame_counter` (0.0833) |
| Dark slide | lifts 60 mm, over 0.6 s | generate.mjs hints `darkSlide.lift`; reflexcamera.ts `SLIDE_TIME` |

**Optics**

| Quantity | Value | Source |
|---|---|---|
| Lens seat to film (flange) | 74.9 mm | content: facts 'Lens to film'; layout.mjs `FLANGE` |
| Lens seat to screen | 33.9 mm to the mirror + 41 mm up to the screen = 74.9 mm | chart 'reflex-path' (reflex.ts `MIRROR_AT`, `SCREEN_AT`); layout.mjs `SCREEN.y` |
| Mirror | at 45°, 58 mm long, half-width 31 mm, 1.3 mm glass, front-silvered; hinged at its top back edge (z 8.6, y 32.4 mm); swings up 45° | layout.mjs `MIRROR`; content: callout 'Mirror'; motion `mirror` (−0.125 turn) |
| Focusing screen | square, half-width 28.5 mm, 2.2 mm thick, at y 41 mm | layout.mjs `SCREEN` |
| Lens | 80 mm f/2.8, 7 glasses in 5 groups, Planar type | content: facts 'Lens', part 'Lens'; layout.mjs `LENS.focal` |
| Nearest focus | 0.9 m | layout.mjs `LENS.nearest`; content: part 'Focusing ring' |
| Glass out to focus | 8.75 mm at 0.9 m (8.752); 3.4 mm at 2 m | content: part 'Focusing ring', step 'Focus'; lens.mjs `extensionFor` (x·x′ = f²), hints.json `focus.maxExtension`. The same formula gives 3.48 mm at 2 m |
| Focusing ring | 300° from ∞ to 0.9 m | layout.mjs `LENS.throw`; content: part 'Focusing ring' |
| Stops | f/2.8, 4, 5.6, 8, 11, 16, 22; 15° of ring a stop | reflexcamera.ts `STOPS`; layout.mjs `LENS.stopTurn`; step 'Shutter' |
| Speeds | 1, 1/2, 1/4, 1/8, 1/15, 1/30, 1/60, 1/125, 1/250, 1/500 s, and B on the scale; 21° of ring a speed | reflexcamera.ts `SPEEDS`; generate.mjs `speedScale`; layout.mjs `LENS.speedTurn`; content: facts 'Shutter' |
| Set at rest | f/8, 1/125 s, focused at ∞ | reflexcamera.ts `REST_STOP`, `REST_SPEED` |
| Leaf shutter | 5 blades between the glass, each turning 48° on its pin; flash at every speed | lens.mjs `SHUTTER`; content: callout 'Shutter in the lens', facts 'Shutter' |
| Iris | 5 blades | lens.mjs `IRIS`; step 'Shutter' |
| Depth-of-field scale | for a blur of 0.06 mm, marked at f/4, 8, 11, 16, 22 | generate.mjs `dofScale` |
| Light value | EV = log₂(N²/t) at ISO 100: each step halves or doubles the light | reflexcamera.ts `lightValue`; chart 'light-pairs' |
| Focal-plane shutter, for comparison | the whole frame open only up to 1/50 s | step 'Flash'; chart 'leaf-shutter' caption |

**The release** (ms from pressing; the times are this model's, the key's angles the manual's: reflexcamera.ts `STAGES`)

| Quantity | Value | Source |
|---|---|---|
| Lens shutter shuts | 0–9 ms | `STAGES.closing` |
| Drive key to 117° (pre-released) | 0–14 ms | `STAGES.key1`, `KEY_PRE` |
| Iris closes to the stop | 2–32 ms | `STAGES.stopping` |
| Mirror swings up | 12–34 ms | `STAGES.mirror` |
| Rear flaps open | 31–45 ms | `STAGES.flaps` |
| Key on to 268°; the shutter fires | 45–50 ms; fires at 50 ms | `STAGES.key2`, `STAGES.fire`, `KEY_FIRE`; step 'Release' ("50 ms in") |
| Blades open, and shut | 1.8 ms each | `STAGES.blade` |
| Let go: flaps close, key to 309° | 6 ms after the shutter shuts; flaps close over 16 ms | `STAGES.letGo`, `STAGES.closeFlaps` |
| Drive key per release | 309°, 30/35 of a turn | reflexcamera.ts `KEY_TURN`; content: callout 'Drive key', ladder caption |

**Winding**

| Quantity | Value | Source |
|---|---|---|
| Gear teeth (module 0.65) | winding gear 30, idler 16, cross shaft 35, bevels 16 : 16 to the drive shaft, flaps' barrel 32, magazine gear 20; in the magazine: input 14, idler 16, spool drive 24 | body.mjs `TRAIN`, `driveShaft`, `crossShaft`; back.mjs `MAG_TRAIN`; hints.json `gears`, `magazineGears` |
| Turns for one turn of the knob | idler 1.875, drive key 0.857 (309°), magazine gear 1.5 | content: ladder chart, step 'Winding' |
| One turn of the knob | 0.9 s: mirror down over the first half, film wound over 15–85 % of it, shutter and iris opened in the last 14 % | reflexcamera.ts `WIND_TIME`, `windAt` |
| Ratchet | 24 clicks a turn (sound) | reflexcamera.ts `tick` |

**Size and dates**

| Quantity | Value | Source |
|---|---|---|
| Overall | 110 × 114 × 176 mm with lens and magazine | content: facts 'Size' |
| Body shell | x −44…44, y −44…46, z 3.5…72.5 mm; edges rounded 3 mm; wall 1.6 mm | layout.mjs `BODY` |
| Film magazine | x −44…44, y −44…46, z −41.5…3.5 mm | layout.mjs `MAGAZINE` |
| Made | 1970–1994 (500C/M) | content: facts 'Made' |

## 5. The misconception

Not stated on the page. The nearest is the Flash step ("Why a shutter in every lens"), which sets the leaf shutter against a focal-plane shutter's slit, but not as something people believe.

## 6. Parts, grouped in chain order

| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
| Lens | `lens` | Lens | An 80 mm f/2.8 of the Planar type, seven glasses in five groups, with its own shutter between them. It turns off the body on a bayonet. | – |
| Lens | `optics` | Optical unit | The glass with the shutter and iris between it, in a housing carrying the speed and aperture rings. Focusing moves all of it forward on a helicoid. | control: focus |
| Lens | `focus_ring` | Focusing ring | Turned 300° from infinity to 0.9 m, it screws the optical unit out 8.75 mm. The distance scale on it reads against the depth-of-field ring. | control: focus |
| Body | `shell` | Body shell | An aluminium casting, chrome outside and leatherette on the sides. Everything that works is on the chassis inside, which slides out of the back. | – |
| Body | `knob` | Winding knob | One turn does everything: it lowers the mirror, turns the drive key back to cock the lens’s shutter, and winds the film on in the magazine. | control: wind |
| Body | `front_plate` | Bayonet plate | The front of the chassis: the bayonet the lens locks into, and at the bottom of its throat the drive key, on a shaft with the spring that turns it as the camera fires. | – |
| Body | `chassis` | Mirror box | Black inside so no light bounces about. The mirror hangs from its top back corner; the focusing screen sits in a frame on top. | – |
| Body | `mechanism_plate` | Winding gears | A brass plate on the right-hand wall with the train from the knob: an idler to the drive key’s cross shaft, the barrel that powers the rear flaps, and the gear that reaches into the magazine. | – |
| Body | `rear_plate` | Rear flaps | The back of the chassis, with the picture’s window and two hinged flaps behind the mirror that keep the film dark while you look through the lens. | – |
| Finder | `finder` | Folding hood | Folded flat it protects the screen; opened, it shades it, and a magnifier inside flips up for focusing. | – |
| Finder | `screen` | Focusing screen | Ground glass, its matte face exactly as far from the lens as the film, by way of the mirror: what is sharp here is sharp on the film. | – |
| Magazine | `magazine` | Film magazine | A box of film that hooks onto the back of the body. With its dark slide in, it can come off in the middle of a roll. | – |
| Magazine | `dark_slide` | Dark slide | A thin steel sheet in front of the film. While it is in, the film is safe and the camera won’t fire. | control: slide |
| Magazine | `insert` | Film insert | Slides out of the left side to load: two 120 spools, the rollers the film turns over, and the pressure plate that holds it flat. | – |

Only the content's 14 parts are listed; the pieces under them (gears, blades, rings, mirror, flaps, spools, film, release button, frame counter) move by the controls in section 7.

## 7. Mechanism map

- **Nothing runs on time:** every part moves by a named control. `ReflexCamera` (src/viewer/reflexcamera.ts) sets the controls from `releaseAt`, `windAt` and `bladeOpening`; src/viewer/linkage.ts turns them into the content's motions; Viewer.ts makes a `ReflexCamera` when the motions have a `mirror` control.
- **Motion kinds:** `turn` (with `from` for the aperture ring, from stop 3, and the speed ring, from speed 7), `slide` (optics, release button, dark slide), `curve` (the iris blades, by stop) and `scroll` (the film's texture, one frame a frame).

| Control | Value | Moves |
|---|---|---|
| `focus` | mm the glass is out, 0–8.75 | optics (slide), focusing ring (−0.0952 turn a mm) |
| `aperture` | stop 0–6 | aperture ring |
| `iris` | stop × how far closed (open for viewing) | iris blades 0–4 (curve) |
| `speed` | speed 0–9 | speed ring |
| `blades` | 0 open, 1 shut | shutter blades 0–4 |
| `mirror` | 0 down, 1 up | mirror |
| `flaps` | 0 shut, 1 open | upper and lower flap (a quarter turn each) |
| `key` | turns, 0 to 30/35 | drive shaft, cross shaft, idler, winding gear, flaps' barrel, magazine gear, magazine input |
| `wind` | knob turns | knob |
| `film` | frames | spool drive, magazine idler, both spools, film (scroll), frame counter |
| `release` | 0 up, 1 pressed | release button |
| `slide` | 0 in, 1 out | dark slide |

- **Rules (reflexcamera.ts):** `fire` refuses unless wound and the dark slide is fully out; `windOn` refuses while cocked or while the release runs; the mirror stays up until wound; `rate` gives slow motion; events `mirror`, `slap`, `fire`, `flaps` and a ratchet click drive the sounds (Viewer.ts).
- **Experiments (src/pages/tour.ts):** `focus` (slider, ∞ to 0.9 m), `aperture` (f/2.8 to f/22, the iris closed to the stop while it's shown, as with the preview), `shutter` (1/500, 1/125, 1/30, 1/8, 1 s; Fire and Turn the knob; slowed to fit the screen), `advance` (Take a picture, Turn the knob, at full speed) and `slide` (pull out or put back the dark slide).
- **Charts:** six in src/charts/reflex.ts, drawn from reflexcamera.ts's state and functions (`reflex-path`, `reflex-focus`, `light-pairs`, `release-sequence`, `film-roll`, `leaf-shutter`), and the generic `ladder` (src/charts/generic.ts) for Winding. src/charts/optics.ts holds only the binoculars' chart and isn't used here.
- **Shared with the rangefinder:** linkage.ts and the `Controls` type (filmcamera.ts), the camera experiments, the build's clash and explode-path checks (scripts/kit/parts.mjs), and the blade outlines (lens.mjs: "as in the rangefinder's lens").

## 8. Film (15–25 s, 2–5 shots)

The mechanism doing its job once, start to finish (references/film.md).

| At | Chapter | Caption | Seconds | Cues |
|---|---|---|---|---|
| 0 s | Focus | Focusing screws the lens out until the picture the mirror throws up to the screen is sharp. | 6 | 0 s slide → true; 1 s focus → 2 over 4 s |
| 6 s | Fire | The release flips up the mirror and opens the flaps, and only then fires the lens’s shutter. | 6 | 1 s fire |
| 12 s | Wind on | One turn of the knob lowers the mirror, cocks the shutter and winds the film on a frame. | 6 | 1 s wind-on |

Solid throughout: the Optical unit, Focusing ring, shutter and iris blades, the mirror and rear flaps, the release, the Winding knob and its gears, the film and its spools; the Body shell, Mirror box, Lens mount, Folding hood and Film magazine are glass. The Dark slide is pulled at 0 s (the release is blocked while it's in) and hidden throughout. Every shot runs at 1/40 (`rate`), so the release's 82 ms at 1/125 s takes 3.3 s; the knob's turn runs in real time, 0.9 s. Shot 1 draws three light rays to the mirror and the screen; shot 3 the power from the knob to the drive key and into the magazine.

## 9. Simplified or left out

- The release's times are the model's; only its order and the drive key's angles (117°, 268°, 309°) come from the manual's chart (reflexcamera.ts), though the page says the chart "is drawn from the factory's own timing chart" (step 'Release').
- The release can't be held: the model lets go 6 ms after the shutter shuts (`letGoAt`).
- On the camera the iris stays open until the picture is taken; in the Shutter step "it closes as you turn the ring" (the tour holds the preview on).
- The Folding hood is built folded flat, magnifier inside, and doesn't open (finder.mjs; no motion); the Light step hides it to show the screen. One finder and one magazine only; the eye-level finder is in the summary.
- The glass: "seven glasses in five groups" on the page; lens.mjs builds five solids, one per group, and a coating layer on the front.
- Named but not built as parts: the cam that lowers the mirror and the lever that lifts it (only its pin, body.mjs `mirror`), the ratchet (a housing on the winding gear, and 24 clicks a turn as sound), the mirror's spring and the flaps' cranks (named in body.mjs `flap`).
- The rolls don't grow or shrink: the spools turn a fixed amount a frame from fixed radii (back.mjs `ROLLS`), though the 'film-roll' caption says the magazine counts frames "so the gaps stay even as the take-up spool fills".
- The lens's rings "can be locked together" (chart 'light-pairs' caption): not modelled.
- Built but not working: the magazine's loading crank, the lens's synchro lever and flash socket, the lens catch.

## 10. Log

Not recorded per stage: built before the procedure, in 1 h 59 of active time (references/procedure.md, "How long it takes": Hasselblad-type SLR, tier C).

19 October 2026: "How it works" became a film (references/film.md), 3 shots, 18 s: focus at 2 m, fire, wind on; the six tour steps, their charts and experiments came off the page.
