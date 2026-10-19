# Pin Tumbler Lock: truth sheet

Tier C · slug `door-lock` · started 2026-10-19

Fill this in before any geometry. Every number on the page (sizes, counts, ratios, timings) and every step of the tour comes from here, and the generator and the content builder read the same constants. Keep it short: tables and one-liners.

## 1. The object

- **Exactly what:** a five-pin cylinder of the kind in a Schlage single-cylinder deadbolt (B60 type), keyed to Schlage Classic specifications (the C keyway's five positions), with its key, a tailpiece and a retaining clip. Not a particular Schlage part number: laid out from the maker's published keying numbers.
- **The key:** code 2-7-4-9-5 (cuts read bow to tip). A second key, 2-7-4-6-5, is the wrong key: one cut three steps too shallow.
- **Real size:** shell about 17 × 27 × 31 mm (width × height × length); key about 52 mm long; plug 12.7 mm across.
- **The problem it solves:** a door that only the holder of one particular piece of metal can open, with no power, for decades.
- **Its one big idea (the principle):** a split line. Each pin stack is cut in two at a different height; only the right key lifts all five gaps exactly to the line between the turning plug and the fixed shell, and only then can the plug turn.

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | built in code | CC0, this site |
| Key bitting specifications (shoulder to first cut .231", spacing .1562", depth step .015", root depths 0 = .335" … 9 = .200", blade .343", 100° cutter with a .031" flat, MACS 7) | Schlage service manuals (Allegion, © 2015: Primus manual p. 12, Everest full-size cylinder manual p. 14, "Key bitting specifications") | maker's manual |
| Pin lengths (bottom pins 0 = .165" … 9 = .300"; top pins .235/.200/.165" by plug total) | same pages, "Pins and springs" | maker's manual |
| Plug diameter "about ½ in", the industry standard for full-size cylinders | same manuals, glossary | maker's manual |
| Spacing .1562", two-step progression, 100° cutter | Allegion knowledge base, "What is Schlage combinating rule 15?" https://kc.allegion.com/kb/article/what-is-schlage-combinating-rule-15 | maker |
| Pin diameter .115" | McMaster-Carr rekeying kits (Schlage: .115" diameter, .015" steps); CLK Supplies, Schlage bottom pins | suppliers |
| Mechanism | Linus Yale Jr., US patents 31,278 (1861) and 48,475 (1865); the manual's "Construction and operating principles" | |

## 3. The energy chain

1. **Your hand** pushes the key in: its blade lifts each pin stack against its spring, and every stack rides up and down over the cuts as they pass.
2. **The key's cuts** stop each key pin at its own height: with the right key, the gap between key pin and driver pin in all five stacks sits on the shear line, the surface between plug and shell.
3. **Your wrist** turns the key; the key turns the plug, which is now free. The driver pins stay in the shell, the key pins ride round in the plug.
4. **The plug's tail** turns the tailpiece, which turns the deadbolt's drive and throws the bolt.

## 4. Numbers

| Quantity | Value | Source |
|---|---|---|
| Pin stacks | 5 (Schlage's residential C keyway; commercial cylinders have 6) | manual |
| Pin diameter | .115" (2.92 mm) | McMaster, CLK |
| Spacing, centre to centre | .1562" (3.97 mm) | manual, Allegion KB |
| Shoulder to first cut | .231" (5.87 mm) | manual |
| Depth step | .015" (0.381 mm), depths 0–9, two-step progression | manual |
| Root depth | 0 = .335" (8.51 mm) … 9 = .200" (5.08 mm), from the blade's bottom | manual |
| Blade height | .343" (8.71 mm) | manual |
| Cutter | 100° with a .031" (0.79 mm) flat | manual |
| MACS | 7 | manual |
| Bottom (key) pins | 0 = .165" … 9 = .300", .015" steps: each pin is as much longer as its cut is deeper | manual |
| Top (driver) pins | #1 .235" (plug total 0–3), #2 .200" (4–6), #3 .165" (7–9) | manual |
| Plug diameter | about ½" (12.7 mm) | manual |
| Root depth + bottom pin | .500" for every depth: the gap lands on the plug's surface | the two tables |
| Combinations | 10⁵ = 100,000 bittings in principle, fewer under MACS | arithmetic |
| Turn to throw a deadbolt | a quarter turn | common to deadbolts |

## 5. The misconception

"People think the key opens the lock by pushing something; in fact the key does no work on the bolt at all: it only lifts five pins so that their gaps line up at the shear line, and your wrist turns the plug and throws the bolt." Goes in: the "Turn" step and its callout; the wrong-key step shows it (the same push, one gap 1.14 mm off, and the plug won't move).

## 6. Parts, grouped in chain order

<!-- truth:parts -->
| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
| Key | `key` | Key | Nickel silver, cut 2-7-4-9-5 from bow to tip. Its shoulder stops it against the plug’s face, so each cut ends up under its own pin. | control: lockKey |
| Key | `wrong_key` | Wrong key | The same blank cut 2-7-4-6-5: its fourth cut is three steps, 1.14 mm, shallower than it should be. | control: lockWrong |
| Pin stacks | `spring_cover` | Spring cover | A strip pressed over the tops of the shell’s five chambers. The springs push against it. | – |
| Pin stacks | `springs` | Springs | Five small coil springs, one on each stack. They push every stack down, so with no key in, each driver pin drops across into the plug. | – |
| Pin stacks | `driver_pin_1` | Driver pin 1 | Steel, 5.97 mm. The maker pairs long driver pins with shallow cuts and short ones with deep cuts, so every stack is close to the same height. With no key in, it sits half in the plug and holds it. | control: lockPin1 |
| Pin stacks | `driver_pin_2` | Driver pin 2 | Steel, 4.19 mm. The maker pairs long driver pins with shallow cuts and short ones with deep cuts, so every stack is close to the same height. | control: lockPin2 |
| Pin stacks | `driver_pin_3` | Driver pin 3 | Steel, 5.08 mm. The maker pairs long driver pins with shallow cuts and short ones with deep cuts, so every stack is close to the same height. | control: lockPin3 |
| Pin stacks | `driver_pin_4` | Driver pin 4 | Steel, 4.19 mm. The maker pairs long driver pins with shallow cuts and short ones with deep cuts, so every stack is close to the same height. | control: lockPin4 |
| Pin stacks | `driver_pin_5` | Driver pin 5 | Steel, 5.08 mm. The maker pairs long driver pins with shallow cuts and short ones with deep cuts, so every stack is close to the same height. | control: lockPin5 |
| Pin stacks | `key_pin_1` | Key pin 1 | First key pin: 4.95 mm, for a 2 cut. Its tip rides the key; its top has to end exactly at the plug’s surface. | control: lockPin1 |
| Pin stacks | `key_pin_2` | Key pin 2 | Second key pin: 6.86 mm, for a 7 cut. Its tip rides the key; its top has to end exactly at the plug’s surface. | control: lockPin2 |
| Pin stacks | `key_pin_3` | Key pin 3 | Third key pin: 5.71 mm, for a 4 cut. Its tip rides the key; its top has to end exactly at the plug’s surface. | control: lockPin3 |
| Pin stacks | `key_pin_4` | Key pin 4 | Fourth key pin: 7.62 mm, for a 9 cut. Its tip rides the key; its top has to end exactly at the plug’s surface. | control: lockPin4 |
| Pin stacks | `key_pin_5` | Key pin 5 | Fifth key pin: 6.10 mm, for a 5 cut. Its tip rides the key; its top has to end exactly at the plug’s surface. | control: lockPin5 |
| Plug and shell | `plug` | Plug | The part that turns: brass, 12.7 mm across, with the keyway up its middle and five holes drilled down into it. Only it and what’s in it turn with the key. | control: lockTurn |
| Plug and shell | `shell` | Shell | The fixed body. The plug turns in its bore; the five chambers drilled up through the ridge on top hold the driver pins and springs. | – |
| Output | `retaining_clip` | Retaining clip | A spring-steel horseshoe in a groove on the plug’s tail. It stops the plug sliding out of the front; take it off and the plug comes out, which is how a locksmith rekeys a lock. | with Plug |
| Output | `tailpiece` | Tailpiece | A flat steel bar in the slot across the plug’s tail. It reaches through the door to the deadbolt, and a quarter turn of it throws the bolt. | with Plug |
<!-- /truth:parts -->

## 7. Mechanism map

- New mechanism module `src/viewer/pinlock.ts` (no three.js): the key's profile from its bitting (100° cuts with a .031" flat, the tip's ramps), each pin's height as the key slides, the shear-line test, the plug's turn. It sets controls:
  - `lockKey`: how far the right key is drawn out (mm, 0 = home), a slide along +z.
  - `lockWrong`: the same for the wrong key.
  - `lockSwap`: 0–1, the keys changing places in front of the lock.
  - `lockPin1` … `lockPin5`: each stack's height against where the right key holds it (mm). Key pin and driver pin slide by it; spring coil k of n by (1 − (k + ½)/n) of it.
  - `lockTurn`: the plug's turn (turns). The key pins, the key, the tailpiece and the clip are nested in the plug and turn with it.
- Experiments: `lock-insert` (a slider for the key), `lock-turn` (hold to turn), `lock-keys` (pick a key, hold to turn). Chart: `lock-stacks` (the five stacks against the shear line, live), and a generic `bars` for the cut depths.

## 8. Tour (5–7 steps)

<!-- truth:tour -->
| # | Label | Shows (focus, flow) | Chart | Try |
|---|---|---|---|---|
| 1 | The idea | Key, Plug, Key pin 1, Key pin 2, Key pin 3, Key pin 4, Key pin 5, Driver pin 1, Driver pin 2, Driver pin 3, Driver pin 4, Driver pin 5, Springs, Tailpiece; power flow | lock-stacks |  |
| 2 | Key in | Key, Key pin 1, Key pin 2, Key pin 3, Key pin 4, Key pin 5, Driver pin 1, Driver pin 2, Driver pin 3, Driver pin 4, Driver pin 5, Springs | lock-stacks | lock-insert |
| 3 | The cuts | Key, Key pin 1, Key pin 2, Key pin 3, Key pin 4, Key pin 5 | bars: How deep each cut goes |  |
| 4 | Shear line | Key pin 1, Key pin 2, Key pin 3, Key pin 4, Key pin 5, Driver pin 1, Driver pin 2, Driver pin 3, Driver pin 4, Driver pin 5 | lock-stacks |  |
| 5 | Turn | Key, Plug, Key pin 1, Key pin 2, Key pin 3, Key pin 4, Key pin 5, Tailpiece, Retaining clip; power flow |  | lock-turn |
| 6 | Wrong key | Key, Wrong key, Key pin 1, Key pin 2, Key pin 3, Key pin 4, Key pin 5, Driver pin 1, Driver pin 2, Driver pin 3, Driver pin 4, Driver pin 5 | lock-stacks | lock-keys |
<!-- /truth:tour -->

## 9. Simplified or left out

- The keyway is a plain slot: the real C keyway has wards along its sides, and the key is grooved to match.
- The shell is shown bare: in a deadbolt it sits in a round housing behind a rose, with the door's trim.
- The deadbolt itself (bolt, case and drive) is left out: the tailpiece is cut short where it would enter the bolt's drive.
- Spring rates aren't published; the springs are drawn as six coils each, compressing evenly.
- The key pins' tips are cones that sit on the cut's flat; real tips are rounded.

## 10. Log

Run `date` at each stage; at twice a stage's budget, tell the user where it stands.

| Stage | Budget | Started | Done | Notes |
|---|---|---|---|---|
| 0 Brief | 5 min | 11:36 | 11:56 | 20 min: picking a lock form with published numbers; Allegion's Schlage service manual settled it (bitting, pin lengths, plug size) |
| 1 Truth | 15 min | 11:56 | 11:58 | written from the brief's research |
| 2 Scaffold | 2 min | 11:56 | 11:56 | |
| 3 Model | 35 min | 11:58 | 12:10 | first build passing its clash and explode checks at 12:10; round holes by openHoles on finely tessellated bands |
| 5 Mechanism | (if new) | 11:59 | 12:12 | src/viewer/pinlock.ts (also read by the generator and content builder through Node's type stripping), src/charts/lock.ts, src/pages/locktry.ts, wiring in Viewer.ts, charts/index.ts, tour.ts, types.ts |
| 4 Content | 15 min | 12:09 | 12:17 | callout cameras pulled back twice (a 30 mm object wants distances of 2.4–4.6) |
| 6 Check | 10 min | 12:12 | 12:24 | object 62/62; regression 14 objects + skill page pass (a first run failed four other objects while reproduce rewrote the models under it; clean on its own) |
| 7 Ship | 5 min | 12:24 | 12:26 | posters, truth tables, README, build |

Total about 50 minutes, the brief's research the largest single stage.
