# Pin Tumbler Lock: truth sheet

Tier C · slug `pin-tumbler-lock` · started 2026-10-18 23:46 UTC

Fill this in before any geometry. Every number on the page (sizes, counts, ratios, timings) and every step of the tour comes from here, and the generator and the content builder read the same constants. Keep it short: tables and one-liners.

**Brief.** A Kwikset KW1 five-pin cylinder, as fitted to a Kwikset 660 single-cylinder deadbolt, with its key and the bolt it throws. Tier C, 25–60 min (no free model with real pins exists; built in code). Energy: your hand → key (push, then twist) → pin stacks lifted against their springs → plug turns in the housing → tailpiece → drive → bolt out 25.4 mm. Tour: The idea · Pin stacks · The key · The shear line · Turn it · The bolt. Moves: the key in and out (pins ride its cuts), the plug, tailpiece, drive and bolt on a turn, a wrong key that won't turn. Sources: Kwikset's rekeying manual, LockWiki's KW1 table, Kwikset 660 listings. Differs from everything on the site (no locks, no pin stacks; a small brass cylinder, not a box or a camera).

## 1. The object

- **Exactly what:** a **Kwikset KW1** five-pin tumbler cylinder (the "Classic", not SmartKey), keyed to the example combination in Kwikset's own rekeying manual, **4-3-6-4-3**, in a **Kwikset 660** single-cylinder deadbolt (ANSI/BHMA A156.2 Grade 3, 2-3/8" backset, 1" throw) [K1, L1, U1].
- **Real size:** the cylinder is about 19 mm across and 27 mm long, its plug 12.65 mm (0.498") across; the key is about 54 mm long; the deadbolt's latch reaches 60.3 mm (2-3/8") from the cylinder's axis to the door's edge.
- **The problem it solves:** a bolt that anyone can throw from inside, but only the holder of one particular piece of brass from outside, with nothing to wind, power or wear out.
- **Its one big idea (the principle):** a plug turns inside a fixed housing, and five spring-loaded stacks of pins sit in holes drilled across the gap between them. Each stack is in two pieces. Unless the split in every stack lies exactly at the gap (the shear line), some pin bridges it and the plug can't turn. The key's cuts are heights: each lifts its stack so the split lands on the line.

## 2. Sources

| Id | What | Where | Trust / licence |
|---|---|---|---|
| Model | Built in code (tier C): no free model of a cylinder with its pins | | Our geometry, from section 4 |
| K1 | Kwikset *Rekeying Manual*, doc 49523/01, © 2013 Kwikset Corporation: glossary, "How a pin and tumbler lock works", key gauge 0–7, example key 4-3-6-4-3, top pins .180" (.160" when master keyed), bottom pins in .023" steps, tapered both ends; spring cover, "C"-style plug retainer, tailpiece for deadbolts; #7 cut for builders' keys only | images.kwikset.com/is/content/Kwikset/Redesign 2019/Literature/Documents/KW-REKEY-MANUAL.pdf | Maker's manual |
| L1 | LockWiki, "Kwikset Classic": KW1 (1176) plug ~.498", shoulder to first cut .247", root to root .150", increment .023", cut width .080", MACS 4; depths 1–7 .329–.191"; key pins .172–.287"; drivers .180"; master pins .023–.138" | lockwiki.com/index.php/Kwikset_Classic | Locksmiths' wiki, CC BY |
| L2 | Lock Picking 101 forum: "most common locks use .115" diameter pins"; Kwikset #1 about .171", .023" steps to .285" (#6) | lockpicking101.com/viewtopic.php?p=503209 | Hobbyists, consistent with L1 |
| L3 | Specialty Products Kwikset bottom pin set 1–7: .115" diameter, #360 brass | clksupplies.com/products/kwikset-bottom-pin-set-1-7 | Supplier |
| G1 | GarthSnyder/keygen, `scad/kwikset.scad`: cut locations .247 + .150n", depths .329 − .023n", plug Ø12.7 mm, cutter flat 2.13 mm at 90° | github.com/GarthSnyder/keygen | Open-source key generator; agrees with L1 |
| U1 | Kwikset 660 listings: 1" bolt throw, backset 2-3/8" or 2-3/4", 2-1/8" cross bore, 1" edge bore, doors 1-3/8"–1-3/4", Grade 3 | uhs-hardware.com (Kwikset 660), directdoorhardware.com/kwikset-660-deadbolt.htm | Dealers quoting the maker |

## 3. The energy chain

1. **Source:** your hand. Pushing the key in lifts the pin stacks against their springs (the work is stored in the springs and given back as the key comes out); twisting it is what will do the work of throwing the bolt.
2. **Control:** the pin stacks. Five drivers (all .180" long) are pushed down by springs across the shear line, locking the plug to the housing. The key's five cuts lift five key pins of matching lengths so that every key pin's top, and every driver's bottom, is level with the plug's surface.
3. **Transmission:** with the shear line clear, the twist goes through the key's blade into the plug, which turns in the housing's bore; the key pins turn with it, the drivers stay behind. The plug's tail turns a flat steel tailpiece.
4. **Output:** the tailpiece turns the deadbolt's drive; its crank pin, in a slot in the bolt's tail, pushes the bolt 25.4 mm (1") out over a quarter turn.

## 4. Numbers

Inches are the lock trade's units; mm = in × 25.4. [calc] marks a number worked out here.

| Quantity | Value | Source |
|---|---|---|
| Pin stacks | 5 (a 6-pin version exists) | K1, L1 |
| Plug diameter | ~.498" (12.65 mm) | L1 (G1: 12.7 mm) |
| Pin diameter | .115" (2.92 mm) | L2, L3 |
| Cut positions from the key's shoulder | .247, .397, .547, .697, .847" (first cut .247", then .150" root to root) | L1, G1 |
| Cut depths (from the blade's bottom edge) | 1 .329 · 2 .306 · 3 .283 · 4 .260 · 5 .237 · 6 .214 · 7 .191" (7 only with master pins or construction balls) | L1, K1 |
| Depth increment | .023" (0.58 mm) | L1, K1 |
| Cut width, angle | .080" flat (G1: 2.13 mm), 90° V | L1, G1 |
| MACS (most a cut may differ from its neighbour) | 4 | L1 |
| Key (bottom) pins | #1 .172 · #2 .195 · #3 .218 · #4 .241 · #5 .264 · #6 .287"; tapered both ends; #n goes with cut n | L1, K1 |
| Driver (top) pins | .180" (4.57 mm), all alike, flat both ends; .160" when master keyed | K1, L1 |
| Cut + key pin | .329 + .172 = .306 + .195 = … = .501" for every depth: so the right pin lifts its top to the same height, .501" above the blade's bottom, whatever the cut | [calc] from L1 |
| One step off | a cut one depth too deep leaves the driver .023" (0.58 mm) inside the plug; one too shallow pushes the key pin .023" into the housing | [calc] |
| This key | 4-3-6-4-3 (Kwikset's example): depths .260 .283 .214 .260 .283", key pins #4 #3 #6 #4 #3 | K1, L1 |
| The wrong key | 4-5-6-2-3: cut 2 two steps deep (its driver 1.17 mm into the plug), cut 4 two steps shallow (its key pin 1.17 mm into the housing) | chosen; [calc] |
| Combinations | 6⁵ = 7,776 with depths 1–6; 6,306 of them obey MACS 4. Kwikset's own rules leave fewer | [calc] from L1 |
| Plug turn to throw the bolt | a quarter turn, 90° | U1 (thumbturn and key, 90°) |
| Bolt throw | 1" (25.4 mm) | U1 |
| Backset | 2-3/8" (60.3 mm) from the cylinder's axis to the door's edge | U1 |
| Door | 1-3/8"–1-3/4" (35–44 mm) thick; 2-1/8" cross bore, 1" edge bore | U1 |
| Drive (drawn) | crank pin at r = 25.4/√2 = 17.96 mm, swinging from 45° left of the top to 45° right: bolt travel = r (sin(θ − 45°) + sin 45°) | [calc]; the linkage is ours |
| Gap at the shear line (drawn) | 0.155 mm between plug and bore (real ones are a few hundredths of a millimetre) | model |
| Tolerance the plug turns within | a gap within 0.10 mm of the shear line | model |

## 5. The misconception

"People think the key works something inside the lock, as a key winds a clock, and that its teeth catch levers that let the bolt go; in fact the key moves nothing but five pins, each by a few millimetres, and lets go of none of them: what locks the plug is the driver pins, pushed down across the shear line by their springs, and what turns it and throws the bolt is your wrist. The key's only job is to lift each stack exactly to the line, which is why its cuts are heights in 0.58 mm steps and why a cut one step off is as good as no key at all." Goes in: the summary, the shear-line callout, and the steps "The shear line" and "Turn it".

## 6. Parts, grouped in chain order

| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
| Key | `key` | Key | A brass KW1 key cut 4-3-6-4-3: five cuts 0.150 inch apart, each one of six depths. It slides in to its shoulder and turns with the plug. | control: lock-key |
| Key | `wrong_key` | Wrong key | The same blank cut 4-5-6-2-3. Two cuts are two steps off, so two stacks miss the line: it goes in just as far, and won’t turn. | control: lock-wrong |
| Pin stacks | `key_pins` | Key pins | Five brass pins in holes across the plug, pointed to ride the key’s cuts. Each is as much longer as its cut is deeper, and they turn with the plug. | with Plug |
| Pin stacks | `driver_pins` | Driver pins | Five identical pins, 0.180 inch long, in the housing’s chambers. With no key they sit half in the plug and half in the housing, and hold it. | – |
| Pin stacks | `springs` | Springs | One small coil spring over each driver pushes its stack down onto the key, or into the plug when there is none. | – |
| Plug | `plug` | Plug | The brass cylinder you turn, 12.65 mm across, with the keyway broached through it. Its surface is the shear line. | control: lock-turn |
| Plug | `tailpiece` | Tailpiece | A flat steel bar fixed to the plug’s tail. It carries the turn back through the door to the bolt’s drive. | with Plug |
| Plug | `retainer` | Plug retainer | A C-shaped clip in a groove on the plug’s tail, holding it in the housing. Spring it off and the plug slides out of the front: the first step in rekeying. | – |
| Bolt | `drive` | Drive | Turned by the tailpiece. Its crank pin swings a quarter turn in a slot in the bolt’s tail. | control: lock-turn |
| Bolt | `bolt` | Bolt | Thrown 25.4 mm (one inch) out of the door’s edge into the frame by the quarter turn, and drawn back by turning back. | control: lock-turn |
| Bolt | `latch_case` | Latch case | The tube that guides the bolt, 60.3 mm (2⅜ inch) from the cylinder to the door’s edge, and the plates the drive works between. | – |
| Bolt | `latch_cover` | Latch cover | The plate on the cylinder’s side of the drive. | – |
| Housing | `spring_cover` | Spring cover | A thin brass strip snapped over the chambers’ tops. It holds the springs in; off it comes when the lock is rekeyed. | – |
| Housing | `housing` | Housing | The fixed brass shell. The plug turns in its bore, and the five chambers are drilled up through its ridge. | – |

The parts table reads the part nodes only: the key pins (`key_pin_1…5`), drivers (`driver_1…5`) and the springs' coils (`coil_1_0…coil_5_7`) under them each slide on their stack's control, `lock-pin-1…5`.

## 7. Mechanism map

- **New:** a three-free module `src/viewer/pintumbler.ts` (kind `pintumbler`, chosen by the control `lock-turn`). It holds the bitting and pin numbers from the content's controls' own values: which key is in, how far (pins follow the key's profile under each chamber, so they ride up and down the cuts as it slides), and the plug's angle. A turn is allowed only if every stack's split lies within 0.10 mm of the shear line; otherwise it stops at once and names the pin that holds it. The bolt follows the drive's crank: travel = r (sin(θ − 45°) + sin 45°), r = 17.96 mm.
- **Controls:** `lock-key` (right key: 0 in, 1 out in front, 2 aside), `lock-wrong` (wrong key: 0 parked beside, 1 out in front, 2 in front of the keyway, 3 in), `lock-pin-1…5` (stack lift from rest, mm), `lock-turn` (plug angle, degrees).
- **Charts:** new `lock-pins` (a live section through the five stacks: housing, plug, chambers, the key's profile where it is, each pin where it is, the shear line; a pin across it in vermilion with how far, in mm) and `lock-bolt` (the bolt's travel against the turn, with the plug's angle as a dot), both in `src/charts/lock.ts`. Reused: `bars` (this key's cut depths; its key pins' lengths).
- **Experiments:** new `lock-insert` (a slider: push the key in and watch the pins ride the cuts), `lock-turn` (choose the right key, the wrong one or none, and hold to turn), in `src/pages/tour.ts` with `lockReadout`.
- **Reused:** the Linkage's `turn`, `slide` and `curve` (no change to it); the power flow; tags.
- **Wiring (shared files, additive only):** `src/viewer/Viewer.ts` (chosen by the `lock-turn` control, ticked, reset with the tour, `lockState`, `chooseKey`, `insertKey`, `turnKey`), `src/charts/index.ts` (an optional `lock()` on `ChartSource`, the charts registered), `src/pages/tour.ts` (the source's `lock`, the two experiments). The numbers both the build and the viewer read: `src/viewer/kw1.json`.
- **Springs:** the Linkage can only turn and slide, so each spring is eight one-turn coils, each sliding by a share of its stack's lift (the bottom coil 15/16 of it, the top one 1/16).

## 8. Tour (5–7 steps)

| # | Label | Shows (focus, flow) | Chart | Try |
|---|---|---|---|---|
| 1 | The idea | Plug, Key pins, Driver pins, Springs, Key | lock-pins |  |
| 2 | Pin stacks | Key pins, Driver pins, Springs, Key | lock-pins | lock-insert |
| 3 | The key | Key, Key pins | bars: This key’s cuts, 4-3-6-4-3 |  |
| 4 | The shear line | Key pins, Driver pins, Springs | bars: Key pins for 4-3-6-4-3 |  |
| 5 | Turn it | Key pins, Driver pins, Springs, Key, Wrong key | lock-pins | lock-turn |
| 6 | The bolt | Key, Plug, Tailpiece, Drive, Bolt, Latch case; power flow | lock-bolt | lock-turn |

## 9. Simplified or left out

Said on the page too (`credit.extra` or the text).

- **Keyway:** a plain slot with a step where the key pins rest, not KW1's warded profile; the key has no milled grooves along its blade. The keyway is open through the plug's underside, so the key's bottom edge can sit .501" below the shear line as the numbers say.
- **Pins:** plain pins, no spool drivers or master pins. Key pins are drawn with a 45° point and a chamfered top; drivers are flat, and drawn nickel-silver (Kwikset's are brass) so the split between the two shows. The shear-line gap is drawn 0.155 mm wide.
- **Springs:** each drawn as eight separate coils that close up and open out as the stack moves, not one wire that stretches.
- **Housing:** shaped after photographs, about 19 mm across; Kwikset's exterior rose, torque blade and cylinder guard are left out, and so is the door.
- **Latch:** the bolt's drive is drawn as a crank pin in a slot (a Scotch yoke) giving the real 25.4 mm throw for a quarter turn; Kwikset's own linkage, deadlocking dog and the interior thumbturn are left out. Bolt and case sizes are approximate.
- **Turning:** the plug either turns or doesn't; real plugs have a few hundredths of a millimetre of play, which is what picking uses.

## 10. Log

| Stage | Budget | Started | Done | Notes |
|---|---|---|---|---|
| 0 Brief | 5 min | 23:46 | 23:50 | KW1 picked over a Euro profile: its bitting and pin lengths are published |
| 1 Truth | 15 min | 23:50 | 00:08 | Research by hand (no subagents on this machine): Kwikset manual (text pulled from the 69 MB PDF), LockWiki, keygen |
| 2 Scaffold | 2 min | 00:01 | 00:01 | |
| 3 Model | 35 min | 00:08 | 00:16 | generate.mjs, 64 nodes, 0.29 MB; round pin holes cut with `openHoles` in fine grids; one clash (a latch post against the bolt's yoke) |
| 5 Mechanism | (new) | 00:16 | 00:22 | `src/viewer/pintumbler.ts`, `src/charts/lock.ts`, the two experiments; shared files touched only to add |
| 4 Content | 15 min | 00:22 | 00:24 | 7 callouts, 6 steps; explode reordered (cover, springs, drivers, key pins, then key and plug) after the first explode check failed |
| 6 Check | 10 min | 00:24 | 00:57 | 4 full QA runs, 63/63 at the end; about 13 min of it waiting for the shared browser lock. Fixed from the sheets: callout cameras too close and not following parts that had moved, side views turned to come from the right (the parked wrong key was in the way, and the key now enters from the left as in the chart), drivers drawn silver so the split shows, the plug ghosted where the pins inside matter, chart labels shortened |
| 7 Ship | 5 min | 01:14 | 01:17 | Posters, truth tables. Active time about 75 min against a 25–60 min budget: the lock needed a new mechanism module, two charts and two experiments, and about 20 min went on waiting for the shared browser lock |
