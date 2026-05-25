# heat-protein-lab

> An **Antigravity 2.0 IDE experiment**: build a visual, interactive demo of what heat does to human proteins (and, by extension, to the cellular machinery that keeps us alive). Not a product. Not a clinical tool. A learning lab — for me, and for anyone who lands here.

This repo is the small, deliberately-low-stakes home for an idea that was floated during the [HeatThreshold](https://github.com/HeatThreshold/HeatThreshold) Google I/O 2026 hackathon push and ultimately deemed too risky to ship inside a 48-hour scoped submission. The risk wasn't technical — it was *epistemic*: claiming anything about human biology under heat stress, on a hackathon stage, with no domain reviewer, is a bad idea. Doing it here, framed as an experiment, with disclaimers up front, is a fine idea.

The companion question is: **how does Antigravity 2.0 actually feel as a creative coding environment when the brief is half-scientific?** This repo is also the petri dish for that.

## The science, in one screen

When the human body heats up beyond about 40 °C (104 °F), proteins start to unfold. This is called **denaturation** — the protein loses the precise 3D shape that lets it do its job, the way an over-easy egg loses its translucent gel structure when it hits a hot pan. Most enzymes have a "melting temperature" (Tₘ) somewhere between 40 °C and 60 °C, which is why sustained core body temperatures over ~42 °C are medically catastrophic: thousands of essential proteins start failing at once.

The body's main defense is a family of chaperone proteins called **heat shock proteins** (HSPs — most famously HSP70 and HSP90). They sense temperature rises and rush to refold damaged client proteins before they aggregate. HSP expression is part of why endurance athletes who train in the heat acclimatize — they're up-regulating their own protein-rescue machinery.

DNA itself is more thermally stable than people often assume (the double helix's melting temperature in vitro is closer to 90 °C), but heat damages DNA *indirectly*: by knocking out the repair enzymes that fix the everyday oxidative damage genomes accumulate. So "heat damages DNA" is true, but the mechanism is *protein failure → repair backlog*, not direct strand-breaking.

> All of the above is textbook molecular biology. None of it is medical advice. This repo will **never** offer medical, clinical, or diagnostic claims. If you are experiencing heat illness, call a doctor, not a JavaScript app.

## What the lab is trying to demonstrate

A short list of demos worth pursuing in here, roughly in order of "build first":

1. **A real protein in a real viewer.** Pull a PDB structure (e.g. [`4PO2`](https://www.rcsb.org/structure/4PO2) — human HSP70) into a 3D viewer (3Dmol.js, NGL, or Mol*) on a static page. First commit, lowest possible bar.
2. **A temperature slider that means something visually.** As the slider moves from 37 °C up toward and past Tₘ, the structure visibly degrades — secondary structure cartoon collapses, hydrogen-bond count drops, RMSD-from-native climbs on a side panel. The motion doesn't have to be physically simulated; a plausibly-animated *visualization* of unfolding is the goal.
3. **A side-by-side: enzyme vs HSP70.** Two viewers, same slider. The enzyme (say, a metabolic protein) unfolds rapidly; HSP70 holds its shape much longer and is shown grabbing client proteins as they begin to misfold.
4. **The bridge back to environmental heat.** Take a WBGT or core-temp input from the [HeatThreshold](https://github.com/HeatThreshold/HeatThreshold) world and translate it into the protein view — i.e. *"this is what your hypothalamic enzymes are flirting with at 41 °C core temp."* This is the part that closes the loop with the parent project, and it's the part most worth explaining carefully so it doesn't read as medical claim-making.
5. **Scrollytelling.** A single long page where each section advances the slider and the narrative, ending with the heat-shock-response rescue and a "this is why acclimatization works" frame.

## What this repo is *not*

- Not a molecular dynamics simulator. We are not running GROMACS in WASM. We are visualizing an animation that looks like denaturation, on a slider.
- Not a HeatThreshold feature. HeatThreshold is a hackathon-frozen safety/scheduling app. This is a sibling experiment that may *link to* HeatThreshold concepts, but won't ship inside it.
- Not a product. There is no business model. No analytics. No accounts. No PII. Static page, public repo, MIT-licensed.

## How to use Antigravity 2.0 in this repo

Open the repo in Antigravity 2.0. It will read [`AGENTS.md`](./AGENTS.md) and ground itself. From there, ask it to take on one of the demo levels above. The point of the experiment is to *watch the IDE work* — what artifacts it produces, where it gets stuck, what it teaches you about the science along the way, and what it teaches you about itself as a tool. Capture screenshots and rough notes in a `notes/` directory as you go.

## License

MIT. See [LICENSE](./LICENSE).

## Author

Craig Merry (craigm26 on GitHub). This is a personal experiment; pull requests welcome but expect a slow pace.
