# The film ("How it works")

"How it works" is a short animation, played like a video: the mechanism does its job once, start to finish, the camera glides round it, and one line of caption under the model says what is happening. The visitor can pause, scrub, jump between chapters and slow it to ½× or ¼×; dragging the model pauses it, and playing again glides the camera back. The sheet's card becomes the film's script. It's the `film` field of the content file, played by `src/pages/film.ts`. The pin tumbler lock (`objects/pin-tumbler-lock/content.mjs`) is the reference.

It replaced a step-by-step tour of text, charts and experiments, which the owner found hard to follow: "I need actually the animation". The rules below are what the owner asked for while the lock's film was made.

## The rules

1. **The happy path only.** The machine doing its normal job once: the key goes in and turns; the crank turns and the bit spins; the shutter fires. No failure cases (a wrong key), no "what if" detours, no experiments, no locked-then-unlocked set-up. If the first shot needs the mechanism in a starting state (the key out), set it with a cue at 0 s and no `over`.
2. **Short.** 15–25 s in all (30 at most), in 2–5 shots of 4–8 s. A simple machine is two or three shots. Say each thing once.
3. **One action per shot, at an even pace.** Each shot shows one thing happening and its caption says it. Moves take seconds, not a snap: slide a key in over 4–5 s, turn a plug over 4–5 s; start a cue half a second to a second into its shot so the caption is read first. Every shot moves at about the same speed as the others.
4. **The camera never cuts.** It glides through each shot's view on one smooth path (it arrives at a shot's view as the shot starts, and drifts on through the last). So neighbouring shots have views close together: an orbit of 20–60° between shots, and similar framing, so it never lurches in and out. Look along the action from the side that shows it (the lock is filmed from the side where the latch is behind the pins and the key's bow is level with them, not in front).
5. **See inside: shells are glass, moving parts solid.** Put everything that moves, and what it acts on, in `focus`; the casing, housing, cover and plug-like shells stay out of it, so they turn to glass and the action inside shows through. Use **one focus set for the whole film** (two at most): a part that flicks between solid and glass from one shot to the next is the harsh jump the owner rejected. Leave `explode` at 0 unless the inside can't be seen any other way.
6. **Captions: one line, cause and effect.** Under ~90 characters (110 at most), present tense, the house voice, a number only when it's the point ("Its 40 teeth push the 16-tooth gear round two and a half times for every turn"). No step titles, paragraphs or charts: the caption is all the text.
7. **Labels and lines sparingly.** A few `tags` naming the parts as they act ("springs", "top pins", "bottom pins"), and a `flow` line where it shows something the eye would miss: the power's path, the light's, or a line that matters (the lock's shear line). Keep a tag or line on through the shots that need it rather than redrawing it.

## Fields

Each shot (`Shot` in `src/types.ts`):

| Field | What |
|---|---|
| `chapter` | The chapter on the timeline (1–2 words). Shots in a row with the same chapter share one. 2–3 chapters. |
| `caption` | The line under the model while the shot plays. |
| `duration` | Seconds at normal speed. |
| `angle`, `fill` | The camera's view as `[azimuth, elevation]` degrees (azimuth 0 looks from +z), and how much of the frame the framed parts fill (default 0.5; 0.45–0.75). The camera arrives here as the shot starts. |
| `frame` | The parts to frame (default: the `focus` parts). Framed where they are both as the shot starts and as it ends, so a key that slides in from outside stays in frame. |
| `focus` | Parts that stay solid; the rest are glass. The same list in every shot. |
| `hide` | Parts left out (a second key that plays no part). |
| `flow`, `flows`, `carries` | A path drawn through the parts, as in a tour step: power (vermilion), light (amber), air (blue) or water (teal). |
| `tags` | Labels on parts, as in a tour step. |
| `run` | Spinning parts (anything a crank or motor turns, `speed` motions) run through the shot; `false` holds them still. Default true. |
| `rate` | How fast the mechanism runs (1 real time, less is slow motion: a watch's escapement, a shutter). |
| `spin` | Spinning parts at another speed through the shot, by node: `{ spindle: 2.1 }` (a belt on other pulleys, a drum on spin, a differential in a bend). |
| `cues` | What the mechanism does, below. |
| `explode`, `chart` | Allowed, rarely right: explode only when there's no other way to see in; no charts. |

## Cues

`{ at, do, to, over }`: at `at` seconds into the shot, do something. A number moves to `to` over `over` seconds, eased, from wherever the mechanism has it then (no `over`: at once). A switch is `to: true` or `false`; an event needs no `to`. Whatever a cue leaves going carries on into the next shot. The verbs are `CUES` in `src/pages/film.ts` (`npm run check -- --list` prints them):

| Mechanism | Cues |
|---|---|
| Anything | `explode` (0–1) |
| A lock (src/viewer/pintumbler.ts) | `key` ('right', 'wrong', 'none'), `insert` (0–1, how far in), `turn` (degrees, 0–90) |
| A balanced arm | `arm-lower`, `arm-upper` (degrees from upright), `springs` (on their pins) |
| A tape measure | `tape-out` (mm), `tape-let-go`, `tape-lock`, `tape-hook` |
| An extinguisher | `pin` (pulled), `squeeze`, `invert`, `recharge` |
| A camera | `focus` (metres, 0 infinity), `stop` (stops from wide open), `speed` (shutter, s), `fire`, `wind-on`, `slide` (dark slide out), `preview` (stop-down) |
| A car with fans and thrusters | `fans`, `road-speed` (km/h), `wing`, `thrust`, `fly` ('hop', 'roll') |
| Clockwork | `wind` (crown turning), `hold` (balance held), `loose` (fork out) |

Spinning parts need no cue: they run while `run` is on, at `rate`, scaled by `spin`. A mechanism the cues don't reach gets a verb in `CUES` (one line: its kind, where it starts, which models have it, what it calls on the viewer) and a row here.

## Making one

1. Write the shot list in the truth sheet's section 8 (at, chapter, caption, seconds, cues), 15–25 s.
2. Put it in `objects/<slug>/content.mjs` as `film: [...]`, after `motion`. Keep the shot list's helpers there (the parts that stay solid as one constant, flow paths from the hints' anchors). Remove `how`, and the helpers only it used.
3. `node objects/<slug>/content.mjs && npm run check -- <slug>`: unknown nodes and cues, captions over 110 characters, shots outside 3–10 s, films outside 12–30 s, more than two focus sets.
4. `npm run qa -- <slug> --only tour` and read `<slug>-N-film.png`: a strip of frames at even steps through the whole film. Check it as a film, frame to frame:
   - the camera glides: each frame a small, even move from the last; no jump, no lurch in or out;
   - every frame shows the action the caption names, framed whole and clear of the caption and bar (nothing important hidden behind a solid part, or off the frame);
   - the inside can be seen through the glass, and nothing flicks between solid and glass;
   - tags and lines sit on their parts.
   Fix the views (`angle`, `fill`, `frame`) and timings and run it again. Then watch it once in the browser at normal speed (`npm run dev`, How it works), since the strip can't show pacing.
5. `npm run truth -- <slug>` rewrites the truth sheet's section 8 from the film.
