# Explaining an object

How the words, the order and the film make someone understand a machine. Read this before writing a truth sheet or any content.

## The six rules

These came out of research on how people understand machines, and every object on the site follows them.

1. **Follow the energy, in order.** People run a machine in their heads one step at a time, from cause to effect (Mary Hegarty's work on mental animation). So the part groups, the callouts, the order parts come off and the film's shots all follow one chain: where the energy comes from, how it's carried, what controls it, what it ends up doing. Watchmakers already teach a watch as power → transmission → escapement → regulation → display.
2. **Problem → principle → parts → process.** Say what problem the object solves and its one big idea before naming any part. The summary's three paragraphs take that order.
3. **Group the parts.** Twenty lettered parts are a list; five groups of four are an explanation. Use 4–8 `group` headings, in the energy chain's order.
4. **Pair the real thing with a diagram.** The model shows what it is; a flow line, a few labels or the scale drawings show how it works (David Macaulay does this on almost every page).
5. **Show it working, slowly enough to follow.** Animation helps when it's slow, simple and controllable (Tversky, *Animation: Can It Facilitate?*). "How it works" is a short film of the happy path at an even pace, with the insides seen through glass, that the visitor can pause, scrub and slow down (references/film.md). The owner found a step-by-step tour of text, charts and experiments hard to follow; the film replaced it.
6. **Name one misconception and correct it.** Explanations that state a wrong idea and correct it teach more than clear explanations alone (Derek Muller's research). One per object, in a callout: "The rate comes from the wheel and the spring, not the mainspring: wind it tighter and it still ticks at the same speed."

Further reading, if a hard object needs it: Macaulay, *The Way Things Work Now*; Biesty & Platt, *Incredible Cross-Sections*; Munroe, *Thing Explainer*; Tufte, *Visual Explanations*; Mayer, *Multimedia Learning*; Bartosz Ciechanowski's interactive [Mechanical Watch](https://ciechanow.ski/mechanical-watch/); Li & Agrawala et al., *Automated Generation of Interactive 3D Exploded View Diagrams* (2008); Mitra et al., *Illustrating How Mechanical Assemblies Work* (2010).

## Where each rule lands on the page

| Rule | Content fields |
|---|---|
| Energy chain | `parts[].group` order, `parts[]` order, `annotations[]` order, explode `stage`/`window` (outer parts first, the chain's heart last), `film[]` order |
| Problem → principle → parts → process | `hook`, then `summary[0]` (problem + principle), `summary[1]` (the parts that do it), `summary[2]` (the process, and what's live on this model) |
| Grouping | `parts[].group`: 4–8 headings |
| Real thing + diagram | `film[].flow` (power vermilion, light amber, air blue, water teal), `film[].tags`, the drawings sheet (automatic) |
| Show it working | `film[]` (references/film.md), `slowMotion` and the run button |
| Misconception | one `annotations[].text`, stated then corrected |

## The film

References/film.md has the rules and the fields. In short: the machine doing its job once, start to finish, in 15–25 s; one action per shot with one line of caption; the camera gliding through the shots without a cut; casings as glass and moving parts solid, the same throughout.

## House voice

Plain, physical, exact. British spelling ("aluminium", "colour", "metres", "centre"). Say what the part does, then the number that makes it real.

Good, from the site:

- Hook: "Every turn of the handle spins the bit three and a third times." / "A wound spring does the pushing; a little wheel swinging back and forth sets the pace." / "Two windows a hand's width apart find the distance; two cloth curtains race across the film to take the picture."
- Summary, first paragraph (problem and principle): "A pocket watch has to keep time in a pocket, at any angle, with no pendulum and no plug. It does it with stored energy let out in tiny, even steps."
- Callout: "The power: a strip of hardened steel about half a metre long, coiled inside the barrel. Winding pulls it tight round the arbor; as it relaxes it turns the barrel, about once every eight hours, and the barrel's teeth drive everything else. A full wind lasts around 40 hours."
- Part `about`: "24 teeth on the spindle: it turns three and a third times for every turn of the handle." / "Meshes with the top of the wheel to keep its teeth engaged. It drives nothing."
- Film caption: "Slide the key in. Each cut lifts a pair of pins to its own height."

Avoid:

- Marketing words: "revolutionary", "cutting-edge", "advanced", "stunning", "precision-engineered".
- A part named before the reader knows why it's there.
- Jargon without its job: say "the escapement holds the train back, letting it move one tooth at a time", not "the Swiss lever escapement regulates".
- Numbers without units, or rounder than the truth. If a figure is the maker's claim, say so ("Tesla says 0–60 mph in under a second").
- Hiding simplifications. Say what was left out or simplified, in the text or in `credit.extra`.

Lengths: `hook` one line (under ~110 characters); `summary` three paragraphs of two to four sentences; `about` one or two sentences; callout `text` one to three sentences; `facts` four to six short label/value pairs ("Beat" / "6 ticks a second").
