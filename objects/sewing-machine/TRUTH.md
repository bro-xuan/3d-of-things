# Sewing Machine: truth sheet

Tier C · slug `sewing-machine` · started 2026-10-19

Fill this in before any geometry. Every number on the page (sizes, counts, ratios, timings) and every step of the tour comes from here, and the generator and the content builder read the same constants. Keep it short: tables and one-liners.

## 1. The object

- **Exactly what:** the **Singer 201-2**, built in the USA (1935–57), a domestic straight-stitch lockstitch machine with reverse. It has a full rotary hook on a vertical axis, driven by gears, and the "P.H." motor built onto the back of its arm, which drives the balance wheel through a spiral gear [IS, SI, I1, A1]. The mechanism follows Singer's **Adjuster's Manual for machines 201-1, 201-2, 201-3, 201-4 and 1200-1, Form 18962, dated 12-36** [A1]. Controls and threading follow the 201-2 instruction book, **Form 20340 Rev. 5-51** [I1]. The Clydebank 201K2 has the same mechanism and the same direct-drive potted motor (PHK) [SI]. In section 4, *typ.* marks a range or a figure that isn't specific to the 201, *weak* marks a retailer or forum figure, and [calc] marks a number computed here.
- **Real size:** **not confirmed from a primary source.** The cast-iron head weighs about 30 lb (13.6 kg); the 1950s aluminium 201K23 about 24 lb (10.9 kg) [SI]. Science Museum envelopes: a sectioned 201K on its stand, 565 × 265 × 440 mm [SM1]; a 1937 201K in its case, 370 × 540 × 250 mm [SM2]. The bed is about 7 in (178 mm) front to back, and between 14⅝ and 16⅝ in (371–422 mm) long [CS, weak]. Section 4 sets an assumed head size for the generator.
- **The problem it solves:** joining two layers of cloth with a seam that looks the same on both sides, doesn't unravel when one stitch breaks, and goes on as fast as a motor can turn. A hand sewer can't do that, because a hand needle has to pass its whole length of thread through the cloth at every stitch.
- **Its one big idea (the principle):** two threads instead of one. The needle pushes only a *loop* of the upper thread through the cloth. Under the bed a hook, turning twice for every stitch, catches that loop and carries it right round a bobbin (spool) of the lower thread. The take-up lever then pulls the loop back up, so the two threads interlock in the middle of the cloth. Neither thread ever passes through the cloth as a free end. One arm shaft, turning once per stitch, times all three motions: the needle bar, the hook (through a train of bevel gears down the pillar and along the bed) and the feed dog, which moves the cloth on between stitches [A1, I1].

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | Built in code (tier C). Poly Haven has no sewing machine: 521 models searched 2026-10-19 via api.polyhaven.com/assets?t=models (nearest: `spinning_wheel_01`, which isn't one) | Our geometry, from section 4 |
| Mechanism [A1] | Singer, *Adjuster's Manual for Singer Machines 201-1, 201-2, 201-3, 201-4 and 1200-1, Singer P.H. Motors and B.R. Motors*, Form 18962 (12-36). Scan and OCR at archive.org/details/singer-201-adjusters-manual-en; index at manualslib.com/manual/1000393 | Maker's service manual: names every shaft and gear used here |
| Use, controls [I1] | Singer, *Instructions for Using Singer Electric Sewing Machine (P.H. Built-on Motor) 201-2*, Form 20340 Rev. (5-51), ismacs.net/singer_sewing_machine_company/manuals/singer-model-201-sewing-machine-manual.pdf | Maker's instruction book |
| Variants [IS] | ISMACS model list, classes 200–299, and the class 201 page (ismacs.net) | Collectors' society; good |
| History, weight [SI] | singersewinginfo.co.uk/201 | Enthusiasts' reference site; medium |
| [SM1] | Science Museum Group 1936-460: sectioned Singer lock-stitch electric sewing machine, No. 201K, on stand, 1936; 565 × 265 × 440 mm | Museum record |
| [SM2] | Science Museum Group 1987-1125: 201K serial EB071649, Kilbowie, 1937, "gear driven rotary shuttle"; 370 × 540 × 250 mm (in its case) | Museum record |
| [P1] | US 1,996,290, H. Gunther (Singer), "Loop-taker for sewing machines", filed 9 Dec 1933, issued 2 Apr 1935 | Patent. A cup-shaped hook on a vertical shaft, driven through a gear pair; a thread case lifted out vertically, held from turning by a finger. Probably the 201's hook (right date, same layout), but the patent doesn't name the model |
| [FW] | singer-featherweight.com, "How does the Featherweight compare…": 201 at 32 lb | Weak: retailer |
| [B] | Bobbin guides (sewingmachinesplus.com, sewingpartsonline.com): class 66 ≈ 20.5 mm × 10.9 mm | Weak: retailers |
| [CS] | allbrands.com case listing (long-bed machines incl. 201: ~16⅝ × 7 in bed) | Weak: retailer, for case fit |

## 3. The energy chain

source → transmission → control → output. One line each, naming the parts.

1. **Source:** 110–120 V mains, AC or DC, into the Singer P.H. motor (a small universal motor with brushes) built onto the back of the arm, with its speed set by the carbon controller under the knee lever or foot. The hand on the balance wheel also counts, and always turns it toward the operator [I1, A1].
2. **Transmission:** a steel spiral gear on the armature shaft drives a textolite (fabric-resin) gear on the balance wheel hub, through a shock-absorbing spring, which turns the **horizontal arm shaft**, once per stitch. At the arm shaft's front end, the **needle bar crank** and **needle bar connecting link** drive the needle bar; the **thread take-up crank** and lever link drive the take-up lever. Near the balance wheel, the **counterbalanced feed cam and feed-lifting eccentric** drives the feed forked connection and the feed connecting rod down the pillar to the **feed rock shaft** and **feed lifting rock shaft** in the bed. Behind it, the **horizontal arm shaft bevel gear** drives the **upright arm shaft** down the pillar. Its lower bevel gear drives the **rotating hook driving shaft** along the underside of the bed to the left (needle) end, where a front bevel gear turns the vertical **rotating hook shaft** and the hook, **2 turns per stitch** [A1].
3. **Control:** the stitch regulator lever on the stitch indicator plate sets 6–30 stitches per inch and, pushed up as far as it goes, reverses the feed. The tension dial (0–9) sets the upper thread's pull. A thumb screw on the presser bar sets the foot's pressure, and moving the feed lifting crank's screw to its other hole drops the feed for darning [I1].
4. **Output:** a lockstitch, with the needle and bobbin threads "locked in the center of the thickness of the material" [I1], 0.85–4.2 mm long [calc], forward or in reverse.

## 4. Numbers

| Quantity | Value | Source |
|---|---|---|
| **Variant pinned** | 201-2 (USA, potted P.H. motor, gear drive), mechanism per Form 18962 (Dec 1936), use per Form 20340 (May 1951). Class 201 made 1935–57 (USA), 1935–62 (UK) | A1, I1, SI |
| Mass | cast-iron 201 about 30 lb = 13.6 kg; aluminium 1950s model about 24 lb = 10.9 kg; "32 lb" (14.5 kg) on a retailer site | SI, FW (weak), calc |
| Overall envelopes | 565 × 265 × 440 mm (sectioned 201K on its stand); 370 × 540 × 250 mm (1937 201K in its case). Both include a base or case, so they bound the head; they aren't its size | SM1, SM2 |
| Bed | about 7 in = 178 mm front to back; 14⅝–16⅝ in = 371–422 mm long. **Not confirmed** | CS (weak), calc |
| Head layout (assumed for the model) | Research estimate: bed 400 × 178 × 30 mm; arm ~140 mm above the bed, ~230 mm clear of the pillar; needle ~60 mm from the bed's left end, ~110 mm from its front; balance wheel Ø ~110 mm; motor pot Ø ~75 mm behind the wheel. **As built** (generate.mjs `L`): bed 400 × 178 × 50 mm (hollow tray, 4 mm top); arm 70 mm deep, its underside 126 mm above the bed, pillar 98–104 mm wide with 220 mm clear to the needle; needle 60 mm from the left end, 104 mm from the front; arm shaft 165 mm above the bed; balance wheel Ø 100 mm; motor Ø 48 × 90 mm along the back of the arm. Overall 420 × 302 × 187 mm. **Our estimates from photos: replace with a measured figure if one is found** | assumed |
| **Drive: motor to arm shaft** | steel **spiral gear** on the armature shaft → **textolite gear** on the balance wheel hub, coupled to the hub by a **shock-absorbing spring**; the hub is on the arm shaft. Ratio not stated | A1, I1 |
| Hand wheel / stop motion | the balance wheel's **stop motion clamp screw** frees it from the arm shaft, so the bobbin can be wound without sewing | I1, A1 |
| **Drive: arm shaft to hook** | horizontal arm shaft bevel gear (H10) → upright arm shaft upper bevel gear (C10); upright arm shaft (A10), vertical, in the pillar; its lower bevel gear (Z9) → rotating hook driving shaft back bevel gear (G8); rotating hook driving shaft (K7), horizontal, under the bed, running left from the pillar to the hook; its front bevel gear (T7) → rotating hook shaft bevel gear (Q7); rotating hook shaft (R7), vertical, carrying the hook (F7) | A1 |
| Hook speed | "a horizontal rotating sewing hook which makes **two revolutions to each stroke** of the needle bar": 2 : 1 overall, arm shaft to hook | A1 |
| Split of the 2 : 1 | tooth counts not published. In A1's photos (Figs. 39, 58) Z9 and G8 look the same size (1 : 1), so the 2 : 1 is in the upper pair (H10 : C10) or the front pair (T7 : Q7). **Assumed for the model:** 1 : 1, 1 : 1, 2 : 1 at the hook | A1 (photos), assumed |
| Hook timing | needle bar at its lowest point, then risen until the **lower timing mark** on the needle bar connecting stud meets the timing gauge's finger: the **hook point is at the centre of the needle**, and the **top of the needle's eye about 1/16 in (1.6 mm) below the hook point**. The rise between the two marks isn't stated in inches (*typ.* 3/32 in = 2.4 mm on other Singer rotary hooks) | A1, calc; typ. from forums (weak) |
| Hook side | the hook "takes the loop from the **left side** of the needle", so the stitch forms the same forward and in reverse | A1 |
| Needle bar | driven by the **needle bar crank** (T10) on the front end of the arm shaft and the **needle bar connecting link** (V3), joined to the bar by the **needle bar connecting stud** (G7). Stroke: **not found** (*typ.* ~30 mm on domestic Singers; assumed 30 mm) | A1, assumed |
| Take-up lever | link type: the **thread take-up crank** (U10), which comes off with the needle bar connecting link at the needle bar crank, and the **thread take-up lever link hinge stud** (Y10) in the arm. No cam: the same crank drives the needle and the take-up. Its exact phase isn't stated (to unthread, the take-up lever is set "at its highest position"). A **thread take-up (check) spring** on the tension takes up slack "until the eye of the needle reaches the goods in its descent" | A1, I1 |
| **Hook and bobbin** | full rotary hook in a horizontal plane (vertical axis); the **bobbin case stays in the hook**, held by a **retaining ring** and kept from turning by its **finger** in the notch of the **bobbin case position plate** under the feed dog | A1, I1, P1 |
| Bobbin | **class 66**, drop-in, wound clockwise; ≈ 20.5 mm across × 10.9 mm high (*weak*); its axis vertical | SI, IS, B |
| Loading | draw the **slide plate** in the bed to the left of the throat plate, lift the bobbin out with the fingers, drop a new one in, and draw the thread through the slot and under the bobbin case tension spring | I1 |
| Hook diameter | **not found** (research guessed Ø 28 mm; the model uses Ø 40 mm so that a 23 mm bobbin case, the needle 16 mm off the hook's axis and the cup's wall all fit, with the beak 0.55 mm outside the needle) | assumed |
| **Feed** | four-motion drop feed, driven from the arm shaft, not the hook shaft: one **counterbalanced feed cam and feed-lifting eccentric** (L10) on the horizontal arm shaft near the balance wheel. Feed lift: the **feed connecting rod** (L5), its cap round the eccentric, runs down the pillar to the **feed lifting rock shaft** (Q9) in the bed. Feed advance: the **feed forked connection** (J5) straddles the feed cam; its slide block (W9) runs in the slideway of the **feed regulator** (T9), pivoted in the arm. Its lower end drives the **feed rock shaft** (T8) under the bed through an eccentric hinge screw | A1 |
| Stitch regulator | lever on a slotted plate, numbered 6 to 30 stitches per inch (4.23 to 0.85 mm); lever pushed up as far as it goes = the same stitch length in reverse; a thumb screw sets a forward-only stop | I1, calc |
| Longest stitch | No. 6 = 6 stitches per inch = 4.2 mm, "satisfactory for basting" | I1, calc |
| Feed dog | at its highest, "slightly less than the full depth of the feed dog teeth" stands above the throat plate. Number of rows of teeth: not found (assumed 3 rows, as in I1's photos of the throat plate's slots) | A1, assumed |
| Feed drop | feed lifting crank under the bed: its thumb screw moved from the lower to the upper hole drops the feed | I1 |
| **Motor** | Singer P.H. motor on the back of the arm; universal, AC or DC; standard windings 110–120 V, others 95–250 V, also 32 V DC and 50 V. Wattage not found (*typ.* 1930s Singer motors ~60–90 W, unconfirmed) | I1, A1 |
| Speed | **no maker's stitches-per-minute figure found.** If assumed at 1,000 spm: arm shaft 1,000 rpm, hook 2,000 rpm | calc, assumed |
| Needle | system **15×1**, flat side of the shank to the left; threaded right to left | IS, SI, I1 |
| Upper thread path | spool pin → thread guide (1) on top of the arm → between the **tension discs** (2), thread guard → up into the **thread take-up spring** (4) and its retaining fork (3) → right to left through the hole in the **take-up lever** (5) → guide on the face plate (6) → wire guide on the needle bar bushing (7) → guide on the needle clamp (8) → needle eye, right to left | I1 |
| Tension | numbered dial 0–9 (higher = tighter); one turn of the thumb nut covers the full range; the presser bar lifter releases it. Bobbin tension: one screw on the bobbin case's spring | I1 |
| Thread per stitch | not found | – |

## 5. The misconception

"People think the sewing machine's needle carries the thread down through the cloth and back up again, like a hand needle, or that the machine ties a knot at every stitch; in fact the needle pushes only a loop of the upper thread under the cloth, and the hook, turning twice per stitch, catches that loop from the needle's left side and carries it right round the bobbin case. The take-up lever then pulls the loop up, so the bobbin thread is left lying inside it, and the two threads interlock in the middle of the cloth. They can't knot, because a knot needs a free end pushed through a loop, and both threads stay joined to their spools." Singer's own words: the hook "makes two revolutions to each stroke of the needle bar" and "takes the loop from the left side of the needle" [A1]; in a good stitch "the needle and bobbin threads should be locked in the center of the thickness of the material" [I1]. Singer's 201-2 book (p. 36) also uses "knot" for a fault of older machines: sewn in reverse, they formed "a knot … on the under thread at each stitch", which the 201 doesn't [I1]. Goes in: a callout on the hook, and the stitch-forming step.

## 6. Parts, grouped in chain order

| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
| Power | `motor` | Motor | Singer’s built-on motor, on the back of the arm. A spiral gear on its shaft turns a gear on the balance wheel’s hub; a knee lever sets its speed. | – |
| Power | `balance_wheel` | Balance wheel | On the arm shaft’s right end: one turn, one stitch. Turn it by hand towards you; the knob on its face frees it from the shaft to wind a bobbin. | time, 30 rpm |
| Arm shaft | `arm_shaft` | Arm shaft | Runs the length of the arm and turns once per stitch. Everything else is timed from it: the crank at its left end, the feed cam and eccentric, the bevel gear. | time, 30 rpm |
| Arm shaft | `needle_link` | Needle-bar link | Joins the crank’s pin to a stud on the needle bar, turning the crank’s circle into the bar’s straight 30 mm stroke. | crank on Arm shaft |
| Arm shaft | `needle_bar` | Needle bar | Slides up and down in two bushings in the head, the needle clamped at its foot. | crank on Arm shaft |
| Arm shaft | `needle` | Needle | A 15×1 needle, flat side to the left. The thread runs in a groove down its front and through the eye near the point, so the needle carries a loop, not an end. | with Needle bar |
| Arm shaft | `take_up_lever` | Take-up lever | Rocks in the head with the crank. It lets thread down while the hook carries the loop round the bobbin, then pulls the slack back up to set the stitch. | crank on Arm shaft |
| To the hook | `upright_shaft` | Upright shaft | Runs down inside the pillar. The bevel gear at its top is half the size of the arm shaft’s, so it turns twice per stitch. | time, 60 rpm |
| To the hook | `hook_drive_shaft` | Hook driving shaft | Runs along the underside of the bed from the pillar to the hook, with a bevel gear at each end. | time, 60 rpm |
| To the hook | `hook` | Rotating hook | A steel cup turning on a vertical shaft, twice per stitch. Its sharp beak passes the needle just above the eye and catches the loop of thread there. | time, 60 rpm |
| Stitch | `bobbin_case` | Bobbin case | Sits in the hook but doesn’t turn: a finger on its rim rests in a notch. The loop goes right round it, and its spring sets the bobbin thread’s tension. | – |
| Stitch | `bobbin` | Bobbin | A class 66 bobbin, 20.5 mm across, holding the lower thread. It drops in from above when the slide plate is drawn back. | – |
| Stitch | `tension` | Tension | Two discs squeeze the top thread; the numbered nut sets how hard. The little check spring takes up the slack as the needle comes down. | – |
| Stitch | `spool` | Spool | The top thread, on its pin on top of the arm. | – |
| Stitch | `presser_foot` | Presser foot | Holds the cloth down on the feed dog while it moves, and lifts with its bar when you raise the lever behind the head. | – |
| Feed | `feed_rod` | Feed connecting rod | Hangs from the feed-lifting eccentric on the arm shaft and works the lifting rock shaft under the bed. | crank on Arm shaft |
| Feed | `feed_fork` | Feed forked connection | Straddles the feed cam on the arm shaft; the stitch regulator sets how far it swings, and so how far the cloth moves. | crank on Arm shaft |
| Feed | `feed_lift_shaft` | Feed lifting rock shaft | Rocks a few degrees under the bed; its arm lifts the feed bar so the teeth rise through the plate. | crank on Arm shaft |
| Feed | `feed_rock_shaft` | Feed rock shaft | Rocks under the bed; its arm pushes the feed bar back while the teeth are up, then forward again. | crank on Arm shaft |
| Feed | `feed_dog` | Feed dog | Two rows of teeth on the feed bar. Up, back, down, forward: they grip the cloth from below and walk it on one stitch at a time. | crank on Arm shaft |
| Feed | `stitch_lever` | Stitch regulator | Set from 6 to 30 stitches to the inch. Pushed to the top it reverses the feed, and the same stitch is sewn backwards. | – |
| Frame | `arm_front` | Arm, front half | The arm is one hollow iron casting with the bed. Its front half lifts away here, as on the Science Museum’s sectioned 201K, to show the shafts inside. | – |
| Frame | `face_plate` | Face plate | Covers the head’s end, where the needle bar, presser bar and take-up lever work. | – |
| Frame | `needle_plate` | Needle plate | The needle goes through its hole and the feed dog’s teeth come up through its slots. | – |
| Frame | `slide_plate` | Slide plate | Slides to the left to get at the bobbin. | – |
| Frame | `bed` | Bed and arm | One japanned iron casting: the bed, the pillar and the back of the arm, with bushings for every shaft. | – |

## 7. Mechanism map

- **Time** drives it all, through one angle: the arm shaft at 0.5 turns a second (one stitch every 2 s, a slow hand turn; no maker's stitches-per-minute figure was found, so the model shows none). At rest the shaft is at 0: needle at the top, feed dog up.
- **Spins** (`speed`): arm shaft and balance wheel 1×; upright shaft 2× about +y (the 32 : 16 bevel pair at the top); hook driving shaft 2× about +x and the hook 2× clockwise seen from above (1 : 1 pairs). Signs from the bevel rule: the driven gear turns −d_driver/d_driven about its axis pointing away from the apex.
- **Crank** (`crank: arm_shaft`): the needle bar (throw 15 mm, link 38 mm, `along` down, phase 180°, so it rests at the top) and its link (`rocks`, about +x through the stud). The feed connecting rod the same way on the 0.75 mm feed-lifting eccentric; the feed dog's bar along z (throw 2.1 mm, a long rod, phase 90°: back while it is up).
- **Rockers** (new use of `crank` + `rocks`, no viewer change): a crank with a rod of 0.002 model units only turns its part, by asin(throw/rod × sin(angle + phase)), and slides it under 0.25 mm along its own pivot. Used for the take-up lever (±14°, peaking 40° after the needle's top), the feed rock shaft (its arm moves the bar ±2.1 mm), the feed lifting rock shaft (±1.4°, its arm lifts 1.5 mm) and the forked connection (±0.7°).
- **Cam** (`cam: arm_shaft`): a hidden driver `feed_lifter` (kit `hiddenDriver`) lifts the feed dog 1.5 mm over 200° of each turn; the dog rides on it and adds its push.
- **Timing**: the hook meets the needle at 221°, 41° after the bottom, when the needle has risen 2.4 mm (typ. loop rise; the 38 mm link makes the bottom of the stroke dwell); the beak is built at that angle's mirror so the timing is in the geometry.
- **Reused:** the `run` experiment (Power: stitches; To the hook: stitches and hook turns), generic charts `timing` (one stitch; the loop's trip), `ladder` (turns per stitch) and `bars` (stitch length by setting), the `power` flow.
- **New:** nothing in the viewer. The object's own `casting.mjs` builds the hollow arm from a filleted silhouette with walls left open where shafts pass.

## 8. Tour (5–7 steps)

| # | Label | Shows (focus, flow) | Chart | Try |
|---|---|---|---|---|
| 1 | The idea | Needle bar, Needle, Needle-bar link, Take-up lever, Rotating hook, Bobbin case, Bobbin, Feed dog, Arm shaft; apart 0.58; at 0.25× speed | timing: One stitch, slowed down |  |
| 2 | Power | Motor, Balance wheel, Arm shaft; power flow; apart 0.45 |  | run, counting Stitches |
| 3 | Needle | Arm shaft, Needle-bar link, Needle bar, Needle, Take-up lever; power flow; apart 0.45; at 0.35× speed |  |  |
| 4 | To the hook | Arm shaft, Upright shaft, Hook driving shaft, Rotating hook; power flow; apart 0.45 | ladder: Turns, for one stitch | run, counting Stitches, Hook turns |
| 5 | The stitch | Rotating hook, Bobbin case, Bobbin, Needle, Needle bar, Feed dog; apart 0.58; at 0.12× speed | timing: The loop’s trip round the bobbin |  |
| 6 | Feed | Arm shaft, Feed connecting rod, Feed forked connection, Feed lifting rock shaft, Feed rock shaft, Feed dog, Stitch regulator; power flow; apart 0.45; at 0.35× speed | bars: Stitch length |  |

## 9. Simplified or left out

Said on the page too (`credit.extra` or the text).

- **Size is estimated:** no source gave the head's measured dimensions, needle-bar stroke, hook diameter or balance wheel diameter. The model's sizes (section 4, "assumed") are read from Singer's photos and drawn to look right, not measured off a machine.
- **Gear teeth:** each bevel and spiral gear is drawn as a smooth cone or disc, or with stylised teeth. Singer published no tooth counts. The 2 : 1 hook ratio is Singer's figure; placing it all in the pair at the top of the pillar (32 : 16) is our choice: a 2 : 1 pair at the hook would not fit under it.
- **Motor:** the P.H. motor is one drum on the back of the arm with a pinion. No brushes, field coils, grease cups, Singerlight lamp, wiring, terminal block or controller. The spiral-gear ratio isn't published, so the motor and its pinion stay still on the model, under the gear cover; the shock-absorbing spring is left out.
- **Thread:** only the reels of thread are drawn (on the spool and the bobbin); the threads' path is left out of the 3D. The loop's growth round the hook and the take-up's pull are an illustration, not a simulation of the thread's real length.
- **Tension assembly:** one part (discs, check spring and dial together); the thread guard, stop washer and release pin are left out.
- **Hook and bobbin:** the hook is one turning cup with a beak; the bobbin case, its retaining ring and position plate are one static part, with the bobbin inside. The hook's gib, race and oil hole are left out.
- **Feed:** the four-motion feed is shown as the feed dog's rise, push, fall and return, driven from one eccentric. The feed regulator's slideway, the forked connection's slide block and the screw centres are simplified; reverse is just the lever's top position.
- **Left out:** the presser foot lifter linkage and pressure spring (the foot is a static part on its bar), bobbin winder (a static part, or left out), stop motion clamp, face plate thread cutter, needle clamp detail, slide plate's spring, oil holes and wicks, hinges, cabinet and the knee lever.
- **Speed on screen:** the model turns slowly enough to follow; no maker's stitches-per-minute figure was found, so any real-speed number shown is an assumption.
- **As built** (generate.mjs and content.mjs): the arm is split along the shafts' plane and its front half lifts away (the real casting is one piece with the bed). The hook is Ø 40 mm with the needle 16 mm off its axis and the beak 0.55 mm outside the needle; no thread is drawn in 3D, so the loop's trip is told by the timing chart and the text. The take-up lever rocks ±14° as a smooth swing peaking 40° after the needle's top (a real link take-up dwells low, then snatches up); its drive link and the thread take-up crank are left out. The rock shafts and the forked connection rock as cranks with a vanishing rod. The feed's numbers are chosen to fit: lift 1.5 mm over 200° of the turn, the lifting eccentric 0.75 mm, the feed cam 2 mm; the dog travels 4.2 mm, the longest stitch. Bevel gears are module 1: 32 : 16 at the top, 16 : 16 at the pillar's foot and at the hook. The arm shaft turns at 0.5 turns a second.

## 10. Log

Built on 19 Oct 2026 in a worktree (branch `object/sewing-machine`), unattended, alongside three other objects. Started 11:36; research in a subagent (it ran in the foreground, so the wait counts); posters at 12:29.

| Stage | Budget | Started | Done | Notes |
|---|---|---|---|---|
| 0 Brief | 5 min | 11:36 | 11:37 | Singer 201-2 (rotary hook, gear drive) over the 15-91: the 2 : 1 hook and the all-gear drive are in Singer's adjuster's manual. Tier C: Poly Haven has no sewing machine |
| 1 Truth | 15 min | 11:37 | 11:54 | Sections 1–5 and 9 by a research subagent (16 min); no measured head size, stroke or hook size found, so those are marked assumed |
| 2 Scaffold | 2 min | 11:37 | 11:37 | `npm run new -- sewing-machine --tier C --category gears --order 14` |
| 3 Model | 35 min | 11:54 | 12:21 | Layout worked out first (needle, hook, feed dog and plate heights; bevel apexes; rocker phases), then generate.mjs and casting.mjs in one pass; one clash (crank pin × needle bar) |
| 4 Content | 15 min | 12:17 | 12:22 | Written alongside the model: 26 parts in 6 groups, 9 callouts, 6 steps |
| 5 Mechanism | (if new) | – | – | None: rockers are cranks with a vanishing rod, the feed lift a cam on a hidden driver |
| 6 Check | 10 min | 12:21 | 12:28 | QA 61/61, then 66/66: the arm's front half lifted clear instead of sitting in front of the shafts; callouts given their own explode; timing-chart labels cleared; Power step turned to see the motor |
| 7 Ship | 5 min | 12:28 | 12:32 | Posters, truth tables, README; regression 14 objects + skill page pass, reproduce identical, build passes. 56 min from start to finish |
