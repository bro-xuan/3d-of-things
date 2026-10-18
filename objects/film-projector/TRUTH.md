# Film Projector: truth sheet

Tier A · slug `film-projector` · shipped before the standard procedure

Reconstructed on 18 October 2026 from the shipped page (content/film-projector.json, written by objects/film-projector/content.mjs) and the code that drives it; no new research. Where the page says nothing, this sheet says so.

## 1. The object

- **Exactly what:** an 8 mm film projector for Super 8 or Normal 8 film (facts: "Film"), from Poly Haven's "Filmstrip Projector 8mm" by PeterM. Make, model and year: not stated on the page.
- **Real size:** 39 cm long (facts: "Real size"). No other dimensions stated.
- **The problem it solves:** it turns a strip of still photographs into motion on a screen (summary).
- **Its one big idea (the principle):** each frame is pulled down by a claw and held dead still in the gate while it is shown; a spinning shutter blocks the light while the film moves, so you only ever see stills, and at 18 frames a second your eye blends them into motion (hook, summary).

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | https://polyhaven.com/a/filmstrip_projector_8mm ("Filmstrip Projector 8mm", PeterM) | CC0 1.0 (content: credit), checked by `npm run models:fetch` |
| Dimensions | content: facts "Real size", 39 cm long | its source: not stated on the page |
| Mechanism | none cited on the page | – |

## 3. The energy chain

source → transmission → control → output. One line each, naming the parts.

1. **Source:** film unwinds from the Feed reel, held up and out in front by the Reel arm, round the Film guide roller and down into the machine; a bright lamp inside Body, lamp & lens lights it.
2. **Transmission:** small loops of slack above and below the gate let a claw hook into the sprocket holes and pull the film down one frame at a time while the reels turn smoothly; past the gate the Take-up reel winds it back up.
3. **Control:** a spinning shutter blocks the light while the film moves and blinks once more while it is still, so each frame flashes twice. The Speed dial sets frames a second, the Direction dial runs the film forward or backward, and the Format switch sets it up for Super 8 or Normal 8.
4. **Output:** the lens throws the still frame onto the screen, a few hundred times wider (about 260× on a 1.5 m screen); the Focus knob moves the lens in and out until the picture is sharp.

## 4. Numbers

| Quantity | Value | Source |
|---|---|---|
| Typical speed | 18 frames a second | content: facts; hook; summary; how step 2 text |
| Flashes per frame | 2: the shutter blinks once more mid-frame | content: how step 2 text and chart caption |
| Film | Super 8 or Normal 8: the same width; Super 8 has smaller sprocket holes and larger pictures | content: facts; callout 'Format switch' |
| Feed reel holds | around 120 m of film, roughly half an hour of pictures | content: callout 'Feed reel' |
| Super 8 frame width | 5.8 mm ("under 6 mm") | content: how step 3 chart 'From frame to screen' |
| Screen width (example) | 1.5 m | content: how step 3 chart |
| Enlargement | about 260× ("a few hundred times wider than the film") | content: how step 3 chart; how step 3 text |
| One frame, as charted | pull-down band 0–0.3 of the cycle, the film moving 0.04–0.26; shutter open 0.34–0.60 and from 0.76, the blink 0.62–0.74 | content: how step 2 chart 'One frame, slowed down' |
| Real size | 39 cm long | content: facts |

## 5. The misconception

Not stated on the page as one. Closest: the hook, "each held dead still in front of the lens, then whisked away", and the step 2 chart caption, "The film only moves while the shutter is shut (shaded), so the screen never shows a blur."

## 6. Parts, grouped in chain order

| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
|  | `filmstrip_projector_8mm_spool_feed` | Feed reel | Holds the film before it’s shown; it unwinds into the machine. | time, 18 rpm |
|  | `filmstrip_projector_8mm_spool_takeup` | Take-up reel | Winds the film back up after it’s been through the gate. | time, 18 rpm |
|  | `filmstrip_projector_8mm_spool_arm` | Reel arm | Holds the feed reel up and out in front, so the film runs straight into the machine. | – |
|  | `filmstrip_projector_8mm_feed_roller` | Film guide roller | Guides the film in from the reel toward the gate, where each frame is shown. | – |
|  | `filmstrip_projector_8mm_focus` | Focus knob | Moves the lens in and out until the picture on the screen is sharp. | – |
|  | `filmstrip_projector_8mm_switch` | Format switch | Sets the projector up for Super 8 or the older Normal 8 film. | – |
|  | `filmstrip_projector_8mm_dial_mode` | Direction dial | Runs the film forward or backward through the gate. | – |
|  | `filmstrip_projector_8mm_dial_speed` | Speed dial | Sets how fast the film runs past the lamp, in frames a second. | – |
|  | `filmstrip_projector_8mm` | Body, lamp & lens | Houses the lamp, the claw that pulls the film down a frame at a time, the spinning shutter and the lens. | – |

The page gives no groups; the order is the page's.

## 7. Mechanism map

- **Time:** two `speed` spins about the x axis, each −0.3 turns a second: the Feed reel and the Take-up reel, at the same speed. `motionLabel` "Run the film". Steps 1 and 2 run at 0.6× (`rate`).
- **The claw and shutter** have no parts and no motion: the generic `timing` chart "One frame, slowed down" in step 2 shows them, lanes Film, Shutter and Screen with the pull-down band shaded, its cursor following the Feed reel at 2 frames a turn (`perTurn: 2`).
- **Light:** step 3 carries a `light` flow through the lens; generic `ladder` "From frame to screen", log scale (Frame 5.8 mm, Screen 1500 mm, ×260).
- **Flows:** the film's path in steps 1 and 2 is drawn as the default `power` flow (no `carries`).
- **No `try` experiment;** the dials, switch and focus knob don't move.
- **Nothing new:** generic spins, `timing` and `ladder`.

## 8. Tour (5–7 steps)

| # | Label | Shows (focus, flow) | Chart | Try |
|---|---|---|---|---|
| 1 | Film path | Feed reel, Take-up reel, Film guide roller, Reel arm; power flow; at 0.6× speed |  |  |
| 2 | The gate | Feed reel, Take-up reel, Film guide roller; power flow; at 0.6× speed | timing: One frame, slowed down |  |
| 3 | Light | Focus knob; light flow | ladder: From frame to screen |  |

Three steps on the page.

## 9. Simplified or left out

- `hide` leaves out the power cable, its connector and the Schuko plug (the README: "the film projector's loose power cord is hidden in the viewer"). No `credit.extra`.
- The lamp, gate, claw, shutter and lens are not separate parts: the page names them inside Body, lamp & lens (the 'Lens' callout has no node). The film travels with the Feed reel as part of it (`with`), not as a part of its own.

## 10. Log

Not recorded per stage: built before the procedure; the first six Poly Haven objects, this one among them, took 1 h 16 in all (references/procedure.md, "How long it takes").
