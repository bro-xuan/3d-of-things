# Lessons

What the site's owner has asked for, and turned down, while the site was built. Each one cost a round of rework the first time.

## The model on the page

- **Truly 3D, solid and whole.** The model sits on a layer above the page and may reach over the side panel on wide screens. It is never faded, masked or clipped at an edge, even in a close-up. A fade into the panel was rejected ("the clock should be complete, not fading into the boundaries").
- **Centred, with everything around it.** At rest the model stands centred on the stage and whole in frame, clear of the sheet's text.
- **Explanations beside the parts.** Clicking a part opens its card next to it in space, not only in the side panel.
- **Objects hand over.** Moving to another object glides one model out as the next comes in, with no reload.

## Controls and looks

- **All controls on the main display**, printed like an engraved plate down the left (How it works, Take it apart with its slider, slow motion and labels as text toggles), not in a boxed card.
- **Rendered and Wireframe only.** An X-ray mode was dropped because it looked too much like wireframe. See-through views live in the film's focus (glass for the parts a step isn't about) and in wireframe.
- **Drawings on the stage**: a third-angle sheet (top, front, side) at one scale with real dimensions; picking a view turns the model to it.
- **Callout numbers and part letters are off at the start**; Labels shows them.

## What to build

- **Real insides.** A closed shell isn't enough; generate the mechanism in code from real numbers. AI part-splitting tools invent insides, so they're out. Anatomy's 2.5D isometric figures are an extra view, never a substitute for the 3D teardown.
- **Variety over series.** Seven generated Teslas from one loft with the same insides were rejected as "too repetitive, they look the same". Make each object differ in mechanism and silhouette, and check in after the second of a kind. Asked to add "a washing machine and two or three more", the owner meant different objects, not kinds of washing machine: "the goal is to popularize different objects, not to make all different kinds of certain object".
- **The product as it is now.** The 2026 Roadster was first built as the 2017 prototype from memory; the owner asked why its suction fans and air thrusters weren't shown. Search the latest reveal before modelling anything current.
- **Free licences only**, verifiable at the source (CC0, CC BY). Sketchfab needs the owner's token: ask first.
- **Don't prune** generator options or archived variants unless asked ("leave them, don't prune").
- **Hold-offs stand.** When the owner says to hold off building models, ask before starting a new one.

## Explaining

- Cause and effect over a parts catalogue: the energy chain, timing, one misconception corrected (references/explaining.md).
- The owner's reference for a "how it works" plate was a field cannon sheet: live charts, scale drawings, a big action button, rendered/wireframe/exploded, slow motion and sound. The step-by-step tour grew from it.
- **"How it works" is an animation, not steps.** The tour of steps with paragraphs, charts and experiments was "not really intuitive enough": "I need actually the animation". The first film (55 s, a locked state, a wrong key, cuts between views) was "very harsh to watch, because it's very abrupt": "why do we need a 55 second video? We need to make the pace consistent". What was accepted (the pin tumbler lock): the happy path only, about 19 s, the camera gliding without a cut at an even pace. Then "I can't see what is inside": the shells (plug and housing) went to glass with the key and pins solid, and that was "absolutely correct". References/film.md has the rules.
- Every live number is true to the mechanism's maths.

## Working

- Fluid sizing on wide, high-density screens: rem units and a viewport-scaled root size, never small fixed pixel fonts (the owner works on a 2880 × 1864 display).
- This is a company laptop: no `sudo`. Git runs as `/Library/Developer/CommandLineTools/usr/bin/git` (the `/usr/bin/git` shim needs an Xcode licence only IT can accept). `python3` is blocked; script with `node`.
- Commits and pushes only when asked. The first commit was the owner's call.
