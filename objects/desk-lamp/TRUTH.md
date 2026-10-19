# Desk Lamp: truth sheet

Tier B · slug `desk-lamp` · started 2026-10-18

## 1. The object

- **Exactly what:** a clamp-mounted, spring-balanced task lamp of the Anglepoise kind, in the layout most later lamps use: two parallelogram arms with a pair of extension springs at each hinge (the Luxo L-1's arrangement, Jac Jacobsen 1937, under licence from Carwardine's maker). Poly Haven's "Desk Lamp Arm 01" (Kuutti Siitonen, modelling and texturing; Yann Kervran, rigging; 2022, "The Shed" collection): orange lacquered steel, chrome springs, a cone shade, a screw clamp. It carries no maker's name, so it is described as a type, not a product.
- **Real size:** 202 × 893 × 614 mm (W × H × D) as posed (model). Arm, pivot to pivot: lower 441.6 mm, upper 464.3 mm (906 mm; the L-1 is sold as "arm length total 1000 mm").
- **The problem it solves:** a lamp head that can be put anywhere in reach and stays there, without a knob to tighten at every joint.
- **Its one big idea:** a spring whose pull is proportional to its whole length, hung from a point straight above a pivot, gives a torque k·a·b·sin θ; the weight on the arm gives m·g·L·sin θ. Choose k·a·b = m·g·L and the two cancel at every angle θ: the arm is weightless, not held.

## 2. Sources

| What | Where | Trust / licence |
|---|---|---|
| Model | https://polyhaven.com/a/desk_lamp_arm_01, https://api.polyhaven.com/info/desk_lamp_arm_01 (authors, 25,710 polys, "clamp-mounted, articulated with springs") | CC0, checked by `npm run models:fetch` |
| How it imports | the 2k glTF has **no skin, joints or armature**: one node, one mesh ("Box.001"), two primitives (lamp, bulb glass), 49 loose pieces. The rig is only in the .blend. | read from the cached glTF |
| Dimensions | measured on the mesh: pin centres and bar axes (`augment.mjs`) | as modelled |
| Patent | G. Carwardine, GB 404,615, "Improvements in elastic equipoising mechanisms", applied 4 July 1932 (No. 18812), published 4 Jan 1934: a spring "wound with an initial tension" whose pull is proportional to its length, parallel links (patents.google.com/patent/GB404615A) | primary: good |
| Later patent, licence | GB 433,617 (three-spring lamp for the home, 10 Feb 1934); licence to Herbert Terry & Sons, Redditch, 22 Feb 1934; the 1227 in 1935 (Wikipedia, "Anglepoise lamp"; Science Museum Group, George Carwardine cp48069) | museum: good |
| The layout | "two parallelogram linkages, with a pair of light tension springs on each half of the arm" (Wikipedia, "Anglepoise lamp"); L-1 springs on both hinges, Anglepoise's at the lower hinge (modulor.de, Luxo L-1 page and retailer copy) | fair |
| Analysis | M. J. French & M. B. Widden, "The spring-and-lever balancing mechanism, George Carwardine and the anglepoise lamp", Proc. IMechE C 214(3) 501–508, 2000: perfect balance "by the use of a close-coiled spring whose free length is effectively zero"; the two-degree-of-freedom desk lamp (eprints.lancs.ac.uk/20295) | peer reviewed: good |
| Zero-length spring | L. LaCoste, 1932–34, for long-period seismometers and gravimeters (University of Texas physics history; NASA NTRS 19900011211; U. Tokyo LaCoste note: balance needs zero unstressed length and weight torque = k·a·b) | good |

## 3. The energy chain

Nothing runs: the chain is where the weight goes and what answers it. Moving the head trades its height energy for spring energy, one for one.

1. **Load:** the head (shade, bulb, holder) hangs on the head bracket, which the upper parallelogram carries level.
2. **Upper arm:** the upper bar turns about the elbow pin; its two springs, hooked from a pin 36.3 mm straight above the elbow pivot to a pin 218 mm along the bar, answer its torque.
3. **Elbow:** the elbow plates are the coupler of the lower parallelogram, so they never turn: the upper springs' anchor stays straight above the elbow pivot whatever the lower arm does.
4. **Lower arm:** the lower arm (and its parallel link) turns about the shoulder pin; two springs from a pin 65.7 mm above the shoulder to a pin 215.8 mm along the arm answer the weight of everything above.
5. **Base:** the bracket and screw clamp take the springs' pull and the weight into the desk.

## 4. Numbers

**model** = measured on the mesh · est. = estimate, nothing published · calc. = computed here.

| Quantity | Value | Source |
|---|---|---|
| Lower arm, shoulder pin to elbow pin | 441.6 mm | model |
| Upper arm, elbow pin to head pin | 464.3 mm | model |
| Lower springs: anchor above the shoulder pin a₁, pin along the arm b₁ | 65.7 mm, 215.8 mm | model |
| Upper springs: anchor above the elbow pin a₂, pin along the bar b₂ | 36.3 mm, 218.1 mm | model (anchor trued, §9) |
| Pose as modelled | lower arm 38.5° from upright, upper arm 48.6° | model |
| Spring length as modelled | lower 169.4 mm, upper 195.9 mm; ℓ = √(a² + b² − 2ab·cos θ) | calc. |
| Masses | head 0.40 kg; upper bars 0.20 kg; springs 0.04 kg a pair; elbow plates 0.06 kg; lower arm 0.25 kg; parallel link 0.10 kg | est. from the model's sizes in lacquered steel (bars as 1 mm pressed channel) and an E27 holder and bulb |
| Upper arm's weight torque | 2.32 N·m × sin ψ (0.40 kg × 464 mm + 0.20 kg × 232 mm + half the springs at 218 mm) | calc. |
| Lower arm's weight torque | 3.83 N·m × sin θ (everything above the elbow at 442 mm + arm and link at 221 mm + half its springs) | calc. |
| Spring rate for balance, k = m·g·L / (a·b) | upper pair 293 N/m; lower pair 270 N/m | calc. |
| Spring pull as modelled | upper pair 57 N; lower pair 46 N (k × ℓ) | calc. |
| Zero-length condition | pull = k × whole length: wound with initial tension F₀ = k × closed length (GB 404,615) | patent; French & Widden |
| Head reach | about 0.9 m of arm; L-1: 1,000 mm arm, 155 mm shade, E27 | model; modulor.de |

## 5. The misconception

"People think the joints are stiff, so friction holds the arm where you leave it; in fact the springs carry the whole weight at every angle (k·a·b = m·g·L), so the joints need hardly any friction. Held by friction alone, the shoulder would have to grip with up to 3.8 N·m, too stiff to move with a fingertip." Goes in: the step "Not friction" (hold to unhook the springs and the arm drops; let go and it stays where it got to) and a callout on the shoulder.

## 6. Parts, grouped in chain order

| Group | Node | Label | About (one line) | Moves by |
|---|---|---|---|---|
| The load | `shade` | Shade | A steel cone that throws the light down and keeps it out of your eyes. Its own knuckle on the bracket tilts it and holds it by friction: the one joint here that friction does hold. | with Head bracket |
| The load | `bulb` | Bulb | A pear-shaped E27 bulb, a few tens of grams of the head’s 0.4 kg (an estimate). | with Head bracket |
| The load | `lamp_holder` | Lamp holder | The E27 holder the bulb screws into. Its cable loops out of the shade’s back and along the arm. | with Head bracket |
| Upper arm | `head_bracket` | Head bracket | Two plates pinned to both upper bars. The bars stay parallel, so the bracket shifts as the arm moves but never turns: the head keeps the angle you gave it. | control: arm_upper |
| Upper arm | `upper_bar` | Upper bar | The lower of the upper arm’s two bars, 464 mm pin to pin. It turns about the elbow pin, and the upper springs pull on a pin 218 mm along it. | control: arm_upper |
| Upper arm | `upper_link` | Upper link | The upper bar’s partner, pinned 36 mm above it at both ends. The two make a parallelogram that carries the head level. | control: arm_upper |
| Upper springs | `upper_spring_left` | Upper spring, left | One of the upper pair: from the pin 36.3 mm straight above the elbow pivot to the pin 218 mm along the upper bar. Wound with initial tension, it pulls in proportion to its whole length. | control: arm_spring_upper |
| Upper springs | `upper_spring_right` | Upper spring, right | The other of the upper pair. Between them they pull with 293 N for every metre of their length: 57 N as modelled. | control: arm_spring_upper |
| Lower arm | `elbow_plates` | Elbow plates | The plates that join the arms. They’re the far side of the lower parallelogram, so they never turn, and the upper springs’ anchor stays straight above the elbow pivot. | control: arm_lower |
| Lower arm | `lower_arm` | Lower arm | Two side bars, 442 mm from the shoulder pin to the elbow. Everything above the elbow, about 0.7 kg, hangs on its far end. | control: arm_lower |
| Lower arm | `lower_link` | Parallel link | A bar the same length as the lower arm, pinned to the base bracket and the elbow plates. It keeps the plates from turning as the lower arm moves. | control: arm_lower |
| Lower springs | `lower_spring_left` | Lower spring, left | One of the lower pair: from a pin 65.7 mm straight above the shoulder pin to the pin 216 mm along the lower arm. | control: arm_spring_lower |
| Lower springs | `lower_spring_right` | Lower spring, right | The other of the lower pair. Between them they pull with 270 N for every metre of their length: 46 N as modelled. | control: arm_spring_lower |
| Base | `base_bracket` | Base bracket | The fixed side of the lower parallelogram: it carries the shoulder pin, the parallel link’s pin and the lower springs’ anchors, and turns on the clamp. | – |
| Base | `clamp` | Clamp | A screw clamp for the desk’s edge. The springs’ pull and the lamp’s weight go into the desk here. | – |
| Base | `clamp_screw` | Clamp screw | Turned up under the desk by its tommy bar, it squeezes the desk top against the clamp’s upper jaw. | – |


## 7. Mechanism map

- New viewer module `src/viewer/balancedarm.ts` (no three.js): the arm's two angles (θ lower, ψ upper, degrees from upright), set by the visitor or let fall; it sets the controls `arm_lower`, `arm_upper` (degrees from the modelled pose) and `arm_spring_lower`, `arm_spring_upper` (each spring pair's swing about its anchor), and gives the springs' lengths. Torques, rates and lengths come from the functions the chart draws.
- Motions (`control` + `turn`, an existing kind): lower arm and parallel link turn about their base pins by Δθ; the elbow plates ride on the lower arm and turn back by −Δθ (the parallelogram's coupler); the upper bar and upper link turn about their elbow pins by Δψ; the head bracket rides on the upper bar and turns back by −Δψ; each spring pair turns about its anchor.
- Springs stretch: a small vertex stretcher `src/viewer/stretch.ts` (like the cloth) moves the far hook along the spring's axis and spreads the coil, from the node's extras (`spring`: anchor, axis, coil span, rest length).
- Chart `arm-torque` (new): weight torque and spring torque against angle, 0–90°, for both arms, with an ordinary spring's (no initial tension) for comparison; markers at the arm's angles.
- Experiments (new): `arm` (two sliders, readout of both torques) and `unhook` (hold to unhook the springs: the arm sinks; let go and it stays wherever it got to).

## 8. Tour (5–7 steps)

| # | Label | Shows (focus, flow) | Chart | Try |
|---|---|---|---|---|
| 1 | The idea | power flow |  |  |
| 2 | The load | Shade, Bulb, Lamp holder, Head bracket, Upper bar, Upper link |  |  |
| 3 | Springs | Upper spring, left, Upper spring, right, Upper bar, Elbow plates | arm-torque: Torque about each pivot | arm |
| 4 | Parallelograms | Head bracket, Upper bar, Upper link, Elbow plates, Lower arm, Parallel link, Base bracket |  |  |
| 5 | Lower arm | Lower spring, left, Lower spring, right, Lower arm, Parallel link, Base bracket | arm-torque: Torque about each pivot |  |
| 6 | Not friction |  | arm-torque: Torque about each pivot | unhook |


## 9. Simplified or left out

- The model's two parallelograms were trued: the parallel link's elbow pin moved 4.5 mm and the upper link (with its pins) about 5 mm, so both are exact parallelograms and the upper springs' anchor sits straight above the elbow pin (as modelled it leaned 7.8°, which would leave the upper arm out of balance by up to 13%).
- The textured cylinders that stood for springs were replaced by coils built in code, on the same pins.
- The springs are ideal zero-length springs. Real ones only approach it over their working range, and a little friction in the joints takes up the difference.
- Masses are estimates; the spring rates follow from them by the balance condition, as a designer would choose them.
- The head's own tilt joint (a friction knuckle) and the base's swivel don't move here; the cable doesn't follow the arm.

## 10. Log

| Stage | Budget | Started | Done | Notes |
|---|---|---|---|---|
| 0 Brief | 5 min | 23:46 | 23:50 | tier B, plus a new mechanism (stage 5) |
| 1 Truth | 15 min | 23:50 | 00:04 | research in this session (no subagents); the glTF has no rig: 49 loose pieces, measured |
| 2 Scaffold | 2 min | 23:47 | 23:48 | in the background during research |
| 3 Model | 30 min | 00:04 | 00:10 | pieces sorted by centre, parallelograms trued, springs rebuilt; first build passed its checks |
| 4 Content | 15 min | 00:13 | 00:16 | |
| 5 Mechanism | (new) | 00:10 | 00:15 | balancedarm.ts, stretch.ts, the chart, two experiments |
| 6 Check | 10 min | 00:16 | 00:31 | explode reworked (closed hooks can’t leave their pins); two full qa runs on SwiftShader, ~3 min each; the first had one transient aborted page load |
| 7 Ship | 5 min | 00:31 | 00:35 | posters, truth tables |
