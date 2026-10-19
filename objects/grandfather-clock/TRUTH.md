# Grandfather Clock: truth sheet

Tier B · slug `grandfather-clock` · started 2026-10-19

Fill this in before any geometry. Every number on the page (sizes, counts, ratios, timings) and every shot of the film comes from here, and the generator and the content builder read the same constants. Keep it short: tables and one-liners.

## 1. The object

- **Exactly what:** an English eight-day longcase clock of the kind made c. 1750–1850: two trains (going and hour-striking) between brass plates, a recoil anchor escapement, a seconds pendulum, two weights hung on gut lines and pulleys, wound once a week with a crank key through the dial. The shell is Poly Haven's "Vintage Grandfather Clock 01" (James Ray Cock, modelling and texturing; Yann Kervran, rigging; published 28 July 2021): an arched hood with turned columns, a break-arch brass dial with a moon-phase arch, a silvered chapter ring with Roman hours, a trunk with a long panelled door (no lenticle) and a moulded plinth. It carries no maker's name, and the dial has no winding holes or seconds ring modelled, so it is described as a type. The movement inside is ours, built from the British Museum's train counts for the standard London eight-day train (§2).
- **Real size:** 626 × 2191 × 427 mm (W × H × D), the glTF's mesh bounds, cornice and plinth being the widest parts. Poly Haven lists 997 × 795 × 2191 mm; the glTF doesn't reach that width or depth (probably the .blend's rig). On the mesh: trunk ≈ 480 × 265 mm, hood ≈ 560 × 357 mm, the hands' pivot 1732 mm above the floor, hood glass 374 × 487 mm, minute hand 158 mm and hour hand 90 mm from the pivot. Real English longcases: 1.8–2.4 m tall (Wikipedia); British Museum examples: Knibb c. 1675, 1950 × 365 × 210 mm; Markwick 1690–1700, 2100 mm tall; Draper c. 1705, about 2650 × 515 × 275 mm.
- **The problem it solves:** keeping a household's time to the minute, with a seconds hand, for a week on one winding, with no spring to weaken and nothing to tend but the key.
- **Its one big idea (the principle):** a falling weight supplies the energy and a pendulum paces how it is spent. Each one-second swing lets the escape wheel forward half a tooth, so the hands move at the rate the pendulum's length sets, and on each swing the escape wheel gives the pendulum a small push that replaces what friction and air took.
- **Against the pocket watch** (objects/pocket-watch): gravity instead of a mainspring, a pendulum instead of a balance and hairspring. It beats once a second, not six times, and runs 8 days on a winding, not 40 hours. It only keeps time standing still and upright. The pendulum's period depends only on its length and g, not on the mass of the bob (Wikipedia, "Pendulum"). The case is tall to hold a 1 m pendulum and to give the weights room to fall about 1.1–1.3 m in a week; the long case came before the anchor escapement, to give the weights a long drop (Wikipedia, "Grandfather clock").

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | https://polyhaven.com/a/vintage_grandfather_clock_01; https://api.polyhaven.com/info/vintage_grandfather_clock_01 (authors as above, 12,604 polys, "ornate vintage wooden grandfather clock with antique brass dial and moonphase, fully rigged", dimensions 996.6 × 795.2 × 2190.6) | CC0 (asset page; the API carries no licence field), checked by `npm run models:fetch` |
| How it imports | 1k glTF: three nodes, three meshes: `…_Body` (case and hood glass, two primitives), `…_HourHand`, `…_MinuteHand`. Both hands pivot at (0, 1731.9, 125.5) mm. No skin, joints or animations: the rig is only in the .blend. As modelled, the hour hand points at 312.7° (about 10:25) and the minute hand at 222.7° (37 min), 6° apart from agreeing | read from the glTF |
| Going train, motion work, weights | British Museum 1959,0202.1, John Draper, London, c. 1705: "going for eight days with an anchor escapement, seconds-beating pendulum"; train count 96; 60/8; 56/8; 30/7; motion work 40, 40/6, 72; driving weights 5.70 and 6.50 kg (britishmuseum.org/collection/object/H_1959-0202-1) | museum: good |
| The same train | BM 2016,8033.1, James Markwick, London, 1690–1700: 96; 60/8; 56/8; 30/7; motion work 42, 42/6, 72. Variant: BM 1958,1006.2155 (Gould, London, c. 1710, a composite movement): 96; 60/8; 56/7; 30/8 | museum: good |
| Motion work 36/36 and 6/72; the anchor's history | BM 1958,1006.2100, Joseph Knibb, London, c. 1675: motion work 36, 36/6, 72; going train 96; 70/8; 48/7; 30/8; curator's text from D. Thompson, *Clocks* (British Museum, 2004), p. 76, on who invented the anchor | museum: good |
| Anchor escapement | Wikipedia, "Anchor escapement": a 30-tooth wheel turns once a minute and carries the seconds hand; the pallets span about 7½ teeth, 90° apart; impulse angle 3–4° (Britten); the swing cut from about 100° (verge) to 4–6° (M. V. Headrick, "Origin and Evolution of the Anchor Clock Escapement", *IEEE Control Systems* 22(2), 2002); recoil | encyclopaedia citing Britten and Headrick: good |
| Pendulum | Wikipedia, "Seconds pendulum" (993.6 mm at g₀; the 1824 yard to be recoverable from the London seconds pendulum, 39.13929 in); "Pendulum" (a grandfather clock's swing of 6°, amplitude 3°; period independent of the bob's mass; T = T₀(1 + θ₀²/16 + …)); "Pendulum clock" (rating nut, suspension spring, crutch and fork; air drag takes most of the power); Mark Headrick, "Circular Error in a Pendulum", abbeyclock.com/pendulumerror.html ("a one-second pendulum is 39.1 inches (0.994 metres) long") | good |
| Bob | History of Science Museum, Oxford, inv. 40823, "Pendulum for longcase clock": 0.95 kg, 1075 mm long, 95 mm wide, flat bob, threaded rating screw below it (catalogue read through search; the site needs a login); Cousins UK brass-faced lead bob, 88 mm, about 1 kg | museum: fair; supplier: fair |
| Weights and lines | Pendulum of Mayfair, "Duration of Grandfather Clocks": eight-day "movements tend to be 4 wheel train and the weight … is usually around 13lb each"; Rowland of Cambridge, restoration of R. Coster, Newbury, c. 1730–40: "the 10 and 12lb weights"; Cousins UK lead weights 10 lb (55 × 165 mm) for 8-day, 7.5 lb for 30-hour; 1.4 mm natural gut "the standard diameter for English eight-day longcase clocks" (vintageclockparts.com), sold as 21 ft (6.40 m) for both lines (johnwardle.co.uk) | dealers and suppliers: fair |
| Eight-day against 30-hour; pulleys | Wikipedia, "Grandfather clock" (1.8–2.4 m; eight-day: two weights, two keyholes, a crank key; 30-hour: one weight on a chain or rope pulled up by hand; a pulley on each weight "doubles the running time allowed by a given weight drop"); Rogers Jones, "Longcase (Grandfather) Clocks": "Typical 17th–19th century eight-day movements run on two weights suspended on a cable and pulley" | fair |
| Maintaining power | Wikipedia, "Maintaining power" (bolt and shutter); bolt and shutter on BM Knibb c. 1675 and Gould c. 1710 | fair |
| Cannon pinion's friction | Wikipedia, "Wheel train" (the cannon pinion "fits friction-tight over the center wheel shaft"); NAWCC Message Board, "English Tall Case – No Friction Between Cannon Pinion and Center Arbor" (mb.nawcc.org/threads/…173833): a bowed spring washer behind the cannon, a domed collet and taper pin in front (read through search excerpts; the forum blocks fetching) | forum: fair |
| Misconception | Bryan Mumford, "The Gravity Escapement" (bmumford.com/clocks): "People often think the pendulum is what drives a clock. But it is the clock weight that drives the pendulum."; Wikipedia, "Pendulum clock": the escapement "gives the pendulum precisely timed impulses to keep it swinging" | fair |
| Dial sizes | 10 in square, late 17th century (Bonhams: Seignior, Quare); 11 in, Graham c. 1717 (Bonhams lot 102, sale 25442); 12 in on George III eight-day clocks (the-saleroom price guide); 13 in painted break-arch, C. Robotham, Leicester, c. 1790 (Hampshire Antique Restoration, movement restoration report) | auction houses, restorer: fair |
| Not found | No published train count for a 1750–1850 English eight-day clock, no barrel diameter, no measured eight-day bob; de Carle, Loomes and Rawlings aren't online. Those values are marked est. in §4 | – |

## 3. The energy chain

source → transmission → control → output. One line each, naming the parts.

1. **Source (weight, line, barrel):** the going weight (5.7 kg of lead) hangs on a pulley in a loop of gut line, one end knotted under the seatboard and the other wound on the barrel. It pulls the barrel round with half its weight, 28 N, and falls 6.7 mm an hour.
2. **Winding (key, ratchet, click):** a crank key on the winding square, the front end of the barrel's arbor through the dial, turns the barrel backwards and winds the line back on, 16 turns for 8 days. The ratchet on the barrel's end slips under the click on the great wheel, so the great wheel isn't turned back, and when the key stops the click takes the weight's pull again. No maintaining power: while it is wound the train has no drive (better London clocks have bolt and shutter).
3. **Transmission (going train):** barrel and great wheel (96) turn once in 12 hours → centre pinion (8): the centre wheel (60) turns once an hour, and its arbor carries the minute hand through the cannon pinion → third pinion (8): the third wheel (56) turns once in 8 minutes → escape pinion (7): the escape wheel (30) turns once a minute, with the seconds hand on its arbor.
4. **Control (anchor, crutch, pendulum):** the anchor's two pallets straddle 7½ of the escape wheel's teeth. Each one-second swing of the 994 mm pendulum (a 1 kg bob on a steel suspension spring), carried to the anchor by the crutch, lets the wheel forward half a tooth (6°). The tooth's push on the pallet goes back through the crutch as a small push on the pendulum, and recoil pushes the wheel back a little at each tick.
5. **Output (motion work, hands):** the cannon pinion (36), friction-tight on the centre arbor, carries the minute hand and turns the minute wheel (36) once an hour. Its minute pinion (6) turns the hour wheel (72) once in 12 hours, and the hour wheel's pipe, round the cannon, carries the hour hand.
6. **Strike (a side chain, which may be left out):** its own weight (6.5 kg), barrel and great wheel (78), released each hour by a pin on the minute wheel. The pin wheel (48, with 8 pins) lifts the hammer for the bell, and the fly (a fan) sets the striking speed (Draper's counts).

## 4. Numbers

**BM** = British Museum record named in §2 · **model** = measured on the glTF · est. = estimate, nothing published · calc. = computed here (g₀ = 9.80665 m/s²).

**The going train** (BM 1959,0202.1, Draper; the same in BM 2016,8033.1, Markwick)

| Wheel | Teeth (wheel / its pinion) | Turns | Source |
|---|---|---|---|
| Barrel and great wheel | 96 / – (drives the barrel through ratchet and click) | 1 in 12 h (96 ÷ 8 = 12); 2 a day; 16 for 8 days | BM; calc. |
| Centre wheel | 60 / 8 | 1 an hour; carries the minute hand | BM; calc. |
| Third wheel | 56 / 8 | 7½ an hour, 1 in 8 min (60 ÷ 8) | BM; calc. |
| Escape wheel | 30 / 7 | 60 an hour, 1 a minute (56 ÷ 7 = 8; 7½ × 8 = 60); carries the seconds hand | BM; Wikipedia, "Anchor escapement" |
| Check | 12 × 7½ × 8 = 720 escape-wheel turns per barrel turn; 30 teeth × 2 beats × 60 = 3,600 beats an hour | | calc. |
| Variants giving the same 60 | 60/7, 56/8, 30/8 (BM, Gould c. 1710); 70/8, 48/7, 30/8 (BM, Knibb c. 1675); great wheel 96 on the centre pinion of 8 in all three | | BM |

**Motion work** (BM 1958,1006.2100, Knibb)

| Wheel | Teeth | Turns | Source |
|---|---|---|---|
| Cannon pinion | 36 | 1 an hour, with the centre arbor; carries the minute hand | BM |
| Minute wheel / minute pinion | 36 / 6 | 1 an hour (36 ÷ 36) | BM |
| Hour wheel | 72 | 1 in 12 h (72 ÷ 6 = 12); its pipe carries the hour hand | BM |
| Other counts seen | 40, 40/6, 72 (Draper); 42, 42/6, 72 (Markwick): the pair is always 1 : 1, then 6 to 72 | | BM |
| Fit | the cannon is friction-tight on the centre arbor, pressed by a bowed spring washer behind it; the minute hand sits on the cannon's square, held by a domed collet and a taper pin through the arbor; the hour hand pushes onto the hour wheel's pipe. The hands are set by pushing the minute hand round | | NAWCC thread; Wikipedia, "Wheel train" |

**Pendulum**

| Quantity | Value | Source |
|---|---|---|
| Seconds pendulum, theoretical | L = g·(T/2π)², T = 2 s: 993.6 mm at g₀; 994.2 mm at London's g ≈ 9.812 m/s² | calc.; Wikipedia, "Seconds pendulum" |
| As stated | 39.1 in (0.994 m); 39.13929 in (994.1 mm) at London, in vacuo, at sea level (the 1824 yard) | Headrick; Wikipedia, "Seconds pendulum" |
| Use | 994 mm, suspension spring to the bob's centre | – |
| Beat | 1 s a swing, 2 s a full period; 3,600 beats an hour, 86,400 a day | calc. |
| Swing | 6° in all, ±3°: the bob moves 52 mm each side of centre. Anchor clocks: 4–6° in all | Wikipedia, "Pendulum"; "Anchor escapement" (Headrick 2002) |
| Bob | lens-shaped, brass-faced lead, ≈ 100 mm across, ≈ 1 kg (est.) | est. from HSM 40823 (whole pendulum 0.95 kg, 95 mm wide) and Cousins (88 mm, about 1 kg) |
| Whole pendulum | ≈ 1.08 m from the suspension block to the rating nut | HSM 40823 (1075 mm) |
| Suspension | a short straight spring of steel ribbon, on a cock behind the back plate | Wikipedia, "Pendulum clock" |
| Crutch | an arm from the pallet arbor, down behind the back plate, ending in a fork round the pendulum rod | Wikipedia, "Pendulum clock" |
| Energy in the swing | m·g·L·(1 − cos 3°) = 13.4 mJ for a 1 kg bob | calc. |
| Mass | the period doesn't depend on the bob's mass | Wikipedia, "Pendulum" |

**Escapement**

| Quantity | Value | Source |
|---|---|---|
| Type | recoil anchor; not the dead-beat (Towneley c. 1675, Graham c. 1715) | Wikipedia, "Anchor escapement" |
| Escape wheel | 30 teeth, 12° apart, slanted back against the turn | Wikipedia |
| Per beat | the wheel goes forward half a tooth, 6°; a tooth passes in two beats (2 s), one on each pallet; 30 teeth × 2 s = 60 s | calc. |
| Pallets | span 7½ teeth, 90° apart; the anchor's pivot √2 × the escape wheel's radius from the wheel's centre (the usual late 19th-century British layout); impulse angle 3–4° | Wikipedia (Britten) |
| Recoil | after each drop the pallet pushes the wheel back a little, so the seconds hand flicks back after each tick | Wikipedia |
| Invented | c. 1670. The oldest known anchor clock is the Wadham College clock, Oxford, 1670, probably by Joseph Knibb. William Clement (King's College, Cambridge, 1671) is usually credited. Hooke's claim comes from Derham (1696) and is doubted. It appears in longcases "soon after 1670" | BM 1958,1006.2100 (Thompson 2004); Wikipedia |

**Weight, line and barrel**

| Quantity | Value | Source |
|---|---|---|
| Going weight | 5.7 kg (lead) | BM Draper, the lighter of the pair (the record doesn't say which drives which); Pendulum of Mayfair "around 13lb" (5.9 kg); Coster 10 and 12 lb; replacement weights 10–12 lb |
| Strike weight | 6.5 kg | BM Draper, the heavier of the pair |
| Weight's size | a lead cylinder ≈ 60 mm × 180 mm (5.7 kg ÷ 11.34 g/cm³ = 503 cm³) | calc. |
| Line | 1.4 mm gut; 21 ft (6.4 m) does both lines | vintageclockparts.com; johnwardle.co.uk |
| Pulley | yes on an eight-day clock: the line runs from the barrel down round a pulley on the weight and back up to the seatboard, so the weight falls half as far and the line pulls with half its weight. A 30-hour clock has one weight on an endless rope or chain, pulled up by hand | Wikipedia, "Grandfather clock"; Rogers Jones |
| Barrel | ≈ 50 mm (2 in) across (est.); the line's centre on a 51.4 mm circle; 161.5 mm of line a turn | est.; calc. |
| Barrel turns | 1 in 12 h; 2 a day; 16 for 8 days, 14 for a week | calc. from 96 ÷ 8 |
| Winding | the crank key turns the barrel directly: 16 turns a side for a full 8-day wind | calc. |
| Line paid out | 323 mm a day; 2.58 m in 16 turns. With the run to the pulley and the seatboard knot, ≈ 3.2 m a line, which matches 21 ft for the pair | calc. |
| Weight's fall | 161.5 mm a day; 6.73 mm an hour; 1.13 m in a week; 1.29 m in 8 days | calc. |
| Line tension | m·g ÷ 2 = 28.0 N | calc. |
| Torque on the barrel and great wheel | 28.0 N × 25.7 mm = 0.72 N·m | calc. |
| Torque at the escape wheel | 0.72 N·m ÷ 720 = 1.0 mN·m, before friction | calc. |
| Power from the weight | m·g·v = 5.7 kg × 9.81 m/s² × 1.87 µm/s = 105 µW, or 0.10 mJ a beat | calc. |
| Against the pendulum's energy | at most 0.10 mJ a beat in, against 13.4 mJ in the swing: under 1% topped up on each swing. Most of the power goes to air drag, the suspension spring and the train's friction | calc.; Wikipedia, "Pendulum clock" |

**Rate and regulation**

| Quantity | Value | Source |
|---|---|---|
| Rating nut | under the bob: raising the bob shortens the pendulum and the clock gains | Wikipedia, "Pendulum clock" |
| 1 mm of length | dT/T = dL/2L = 1/1988, so 43.5 s a day | calc. |
| Circular error at ±3° | θ₀²/16 = 1.71 × 10⁻⁴, so 14.8 s a day slower than a very small swing; from ±3° down to ±2.5° gains 4.5 s a day | calc.; Wikipedia, "Pendulum" |
| Drive and rate | with a recoil anchor, more drive makes the pendulum swing faster through about the same arc, which partly cancels the circular error | Wikipedia, "Anchor escapement" (Rawlings) |

**Case and dial**

| Quantity | Value | Source |
|---|---|---|
| Height | 1.8–2.4 m; this model 2191 mm | Wikipedia, "Grandfather clock"; model |
| Case | the hood slides forward off the case; its glazed door gives access to the winding squares and hands; the trunk door gives access to the weights and pendulum; the seatboard across the top of the trunk carries the movement; the base (plinth) is below | BM Draper (Thompson 2004: by 1700 "a hood which slides forward" and "a hinged and locked front door … for winding") |
| Dial width, by period | 10 in square (late 17th century); 11 in (c. 1700–20); 12 in (305 mm), common on mid-18th-century eight-day clocks; 13 in painted break-arch (c. 1790) | auction lots and restoration report, §2 |
| This model's dial | plate ≈ 390 mm (15 in) wide, chapter ring ≈ 340 mm across, centre 1732 mm up: larger than a 12 in dial | model |
| Fall in this model | seatboard ≈ 1.55 m up (the dial plate's lower edge, est.), leaving ≈ 1.1–1.2 m for the weight once the pulley and the weight's own 180 mm are allowed for: enough for a week's 1.13 m | model, est. |

## 5. The misconception

"People think the pendulum drives the clock. In fact the falling weight supplies all the energy, about 0.1 mW, and the pendulum only paces how it is spent: each swing unlocks the escape wheel by half a tooth, and the tooth's push on the pallet gives the pendulum at most 0.1 mJ, under 1% of the 13 mJ already in the swing, to replace what the air and the suspension spring took. Without the weight the swing dies away in minutes; without the pendulum the anchor flaps freely and the train races." Sources: Mumford ("it is the clock weight that drives the pendulum"); Wikipedia, "Pendulum clock"; numbers calc. (§4). Goes in: a callout on the pendulum.

## 6. Parts, grouped in chain order

| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
| Power | `weight` | Weight, pulley and line | A 5.7 kg cylinder of lead hung on a pulley in a loop of gut line. The pulley halves its pull to 28 N and its fall to 6.7 mm an hour, so it lasts eight days. | – |
| Power | `great_wheel` | Barrel and great wheel | The line is wound on a barrel 51 mm across. Its 96-tooth great wheel turns once in 12 hours; a ratchet and click let the key wind the barrel back without turning the wheel. | clock train, -0.00138889 turns a minute |
| Train | `centre_wheel` | Centre wheel | Its 8-leaf pinion is driven by the great wheel, so it turns once an hour; its arbor comes through the front plate and carries the minute hand. | clock train, 0.01666667 turns a minute |
| Train | `third_wheel` | Third wheel | 60 teeth on 8 leaves: seven and a half turns an hour. Its 56 teeth drive the escape wheel’s 7-leaf pinion eight times as fast. | clock train, -0.125 turns a minute |
| Train | `escape_wheel` | Escape wheel | 30 pointed teeth, once round a minute. It would race round under the weight’s pull if the anchor didn’t hold it. | clock train, 1 turns a minute |
| Escapement | `anchor` | Anchor | Two steel pallets on one arbor, straddling seven and a half teeth. As it rocks, one pallet lets a tooth go and the other catches the next. | swing: balance |
| Escapement | `crutch` | Crutch | An arm down from the anchor’s arbor, behind the movement, with a fork round the pendulum rod: it carries the swing to the anchor and the push back to the pendulum. | swing: balance |
| Escapement | `pendulum` | Pendulum | A steel rod and a brass-faced lead bob, hung on a thin steel spring: 994 mm from the spring to the bob’s centre, so each swing takes one second. | swing: balance |
| Hands | `cannon_wheel` | Cannon wheel | A 36-tooth wheel on a pipe, friction-tight on the centre arbor: it carries the minute hand, and slips when you set the hands. | clock train, 0.01666667 turns a minute |
| Hands | `minute_wheel` | Minute wheel | 36 teeth to 36: it turns once an hour on a stud, and its 6-leaf pinion drives the hour wheel. | clock train, -0.01666667 turns a minute |
| Hands | `hour_wheel` | Hour wheel | 72 teeth driven by 6: once round in 12 hours. Its pipe, round the cannon’s, carries the hour hand. | clock train, 0.00138889 turns a minute |
| Hands | `seconds_hand` | Seconds hand | On the escape wheel’s arbor: it steps once a second with the tick, and goes round once a minute. | clock: second |
| Hands | `minute_hand` | Minute hand | On the cannon wheel: once round an hour. | clock: minute |
| Hands | `hour_hand` | Hour hand | On the hour wheel’s pipe: once round in twelve hours. | clock: hour |
| Hands | `dial` | Dial | A brass plate with a silvered chapter ring and a moon in the arch, pinned to the front plate on four feet. Two winding squares come through it. | – |
| Frame | `front_plate` | Front plate | Brass, with the wheels’ front pivots in it. Take it off and the train lifts out. | – |
| Frame | `frame` | Back plate, pillars and cock | The back plate and four turned pillars hold the wheels; the cock behind it carries the pendulum’s spring. | – |
| Case | `hood` | Hood | Slides forward off the case to reach the movement. Its glazed door opens to wind the clock and set the hands. | – |
| Case | `trunk_door` | Trunk door | Opens on the weight and the pendulum, to start it swinging or adjust its rating nut. | – |
| Case | `base` | Base | The plinth the trunk stands on, on four bracket feet. | – |
| Case | `case` | Case and seatboard | The trunk is tall for two reasons: a pendulum a metre long, and room for the weight to fall 1.3 m in eight days. The movement stands on a seatboard across its top. | – |

## 7. Mechanism map

What moves and what drives it: time (`speed`, `clock`), a control (name and range), a crank or cam. Which existing motion kinds, experiments and charts it reuses, and anything new (a new mechanism needs a viewer module: references/mechanisms.md).

Everything runs on the watch's clock mechanism (`src/viewer/rig.ts`, `Mechanism`), driven by the visitor's time of day, so the hands show the real time and every wheel stays in mesh.

- **One change to the viewer, additive:** a motion may say `beats` (beats a second; default 6, a watch's). The pendulum's motion says `beats: 1`, so the trains step once a second and `swing: 'balance'` parts swing at 0.5 Hz (a 2 s period). With no `beats` anywhere the watch's numbers are what they were (`perTurn` gives exactly 360, 21,600 and 259,200).
- **Trains** (`train`, turns per turn of the seconds hand, + clockwise from the front; they step with the beat): escape wheel 1, third wheel −7/56 = −1/8, centre wheel 1/60, great wheel −1/720, cannon wheel 1/60, minute wheel −1/60, hour wheel 1/720. All `inside: true`.
- **Hands** (`clock`): minute and hour on the dial's centre; the seconds hand (`clock: 'second'`) on the escape arbor. They step with the train.
- **Swings** (`swing: 'balance'`, amplitude 3°, a sine locked to the beat): the pendulum, the anchor and the crutch, all about the anchor's arbor line (the suspension spring bends level with it). Positive (anticlockwise from the front) dips the left pallet; the escape wheel is modelled with its tips at 45° + 12° k, so the left pallet sits over a gap whenever it dips.
- **Static:** the weight, pulley and line (6.7 mm an hour is too slow to see), the plates, dial and case.
- No new cue, chart, experiment or sound. The film uses no cues: it plays in real time.

## 8. Film (15–25 s, 2–5 shots)

The mechanism doing its job once, start to finish (references/film.md).

| At | Chapter | Caption | Seconds | Cues |
|---|---|---|---|---|
| 0 s | Power | The 5.7 kg weight pulls on its line and turns the barrel, once every twelve hours. | 6 |  |
| 6 s | Train | Its wheels pass the pull on: the centre wheel turns once an hour, the escape wheel once a minute. | 6 |  |
| 12 s | Pendulum | Each one-second swing rocks the anchor and lets the escape wheel on by half a tooth. | 6 |  |
| 18 s | Hands | The centre wheel carries the minute hand; the motion work turns the hour hand 12 times slower. | 5 |  |

## 9. Simplified or left out

Said on the page too (`credit.extra` or the text).

- **A type, not a clock:** the movement is a generic English eight-day built from 18th-century London train counts (BM Draper, Markwick); no 1750–1850 count was found, so the sheet assumes the pattern carried on. The case is Poly Haven's period-style shell, not a known maker's.
- **Strike train left out** (or shown still): in the real clock it has a second weight (6.5 kg), a great wheel of 78, a pin wheel of 48/8 with 8 hammer pins, a hoop wheel of 48/6, a warning wheel of 48/6, a fly pinion of 6, a count wheel or rack, and a hammer and bell (BM Draper).
- **Plates and pillars:** plain rectangular brass plates on four turned pillars, with no latches or decoration; cocks, the back cock and the seatboard's fixings simplified.
- **Teeth and wheels:** an approximate tooth form, not the clockmaker's cycloidal teeth and leaves; solid pinions; wheels crossed out with four spokes (crossings), as English longcase wheels are. The escape wheel and anchor are drawn to the standard proportions (30 teeth, a 7½-tooth span, pallets 90° apart), with the tooth and pallet shapes stylised.
- **Recoil:** shown only as the seconds hand's small flick, if at all.
- **No maintaining power, no calendar.** The shell's moon disc isn't driven. In a real clock it has 118 teeth and is pushed one tooth every 12 hours by a pin on the hour wheel, one turn in 59 days for two painted moons (the 1 : 118 ratio as in patent US4692031A).
- **The dial as modelled has no seconds ring and no winding holes:** the seconds hand belongs on the escape arbor and the winding squares behind the dial; the page says so if they aren't added.
- **Lines and weights:** the gut lines are drawn as straight strands and the line on the barrel as plain turns; the weights are plain lead cylinders and the pulleys simple discs.
- **Time:** the weight falls 6.7 mm an hour, too slow to see, so the film speeds time up or the page gives the drop as a number.
- **Hands:** the shell's hands rest about 6° apart from agreeing (hour hand at 10:25, minute hand at 37 min); the generator sets both from the train.
- **Not modelled:** the rating nut's thread, the suspension spring's thickness, the case's joinery and the hood's slide.
- **As built:** the movement is scaled to this dial (390 mm wide, larger than a 12 in dial): the going winding square is where the mesh has it, 58 mm right of the centre, so the great wheel's module is set by that (1.115) and the plates are 250 × 203 mm. The barrel stays 51 mm (the line's 161.5 mm a turn is what the drop needs). The strike train is left out, so the left half of the plates is empty and the left winding square stops at the dial.
- **The hood:** Poly Haven's hood has a back with an arched window (and a dark panel in it, removed); that back stays on the case as the backboard's frame, and the hood without it slides forward. Its bottom board was removed (a real hood is open over the trunk).
- **The hands** were lifted off the dial (hour 1 mm, minute 2.5 mm) so the new seconds hand sits under them; the dial as modelled has no seconds ring or arbor holes.
- **The anchor** is drawn with its pallets just clear of the teeth at rest; it dips 1.6 mm at each end of its swing. Recoil isn't shown.

## 10. Log

Run `date` at each stage; at twice a stage's budget, tell the user where it stands.

| Stage | Budget | Started | Done | Notes |
|---|---|---|---|---|
| 0 Brief | 5 min | 17:10 | 17:12 | 19 Oct 2026. Variety: the only other timekeeper is the pocket watch (spring and balance); this is gravity and a pendulum. |
| 1 Truth | 15 min | 17:12 | 17:38 | Research subagent (BM train counts, pendulum, weights); it ran in the foreground, so nothing else moved for 26 min. |
| 2 Scaffold | 2 min | 17:12 | 17:46 | Poly Haven's CDN served a stale `.bin` (337,096 bytes against the API's 337,224 and md5): the 2k path gives the right file; seeded `.cache` with it by hand, then `models:fetch` passed (5 cached). |
| 3 Model | 30 min | 17:46 | 18:10 | Hood cut at z −135 with its floor (y < 1545) removed; trunk door cut at z > 100; movement in movement.mjs. |
| 4 Content | 15 min | 18:05 | 18:15 | Explode restaged three times so the hood, dial and front plate clear the view of the train. |
| 5 Mechanism | (if new) | 17:55 | 17:58 | `beats` on a motion (rig.ts, types.ts): additive. |
| 6 Check | 10 min | 18:10 | 18:26 | First film framed the whole clock: the movement was about 75 px. |
| 6 Film, again | – | 18:59 | 19:08 | The owner's call: lean in at one size, top of the hood to the bob, the base and foot of the trunk below the stage. Exact cameras at one distance (3.02 units), 22–24° apart; the base back to glass. The plates are now about 110 px across: hood-to-bob in the stage's free height allows about 1.5×, not 2×. |
| 7 Ship | 5 min | 18:26 | 18:30 | Posters, truth tables, `npm run build`; `reproduce -- --models` identical; `qa -- --all --quick` 0 failed. README and skill.html left to the batch merge. 80 min in all, 26 of them waiting on the research subagent. |
