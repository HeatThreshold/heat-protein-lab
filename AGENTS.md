# AGENTS.md — heat-protein-lab

> Project context file. Antigravity 2.0 (and any other coding agent that follows the AGENTS.md convention) should read this at session start.

## What this project is

A small, public, MIT-licensed experiment that visualizes the effects of heat on human proteins — primarily as an educational scrollytelling page, secondarily as a vehicle for exploring Antigravity 2.0 as a creative coding environment. See [README.md](./README.md) for the framing.

## What this project is **not**

- **Not a clinical or medical tool.** No diagnostic claims. No medical advice. No PII. No accounts.
- **Not a molecular dynamics engine.** We visualize plausible animated denaturation, not run physical simulations.
- **Not a HeatThreshold feature.** This is a sibling experiment in the HeatThreshold org, not a deliverable of the hackathon submission.

If you are about to write code that violates any of those, stop and ask first.

## Tooling expected in this workspace

- **Science MCP plugin (operator-installed).** When the operator says the science plugin is connected, prefer its tools for any protein structure lookup, PDB fetching, sequence/structure questions, or chemistry context over guessing or generic web search. If the MCP is not available in the current session, fall back to the public RCSB PDB REST API (`https://data.rcsb.org/rest/v1/...`) and clearly note the fallback in your reply.
- **3D viewer library** for proteins — likely [3Dmol.js](https://3dmol.csb.pitt.edu/) for fast load, with [Mol*](https://molstar.org/) as a heavier alternative if needed. Prefer 3Dmol.js for first iterations.
- **Static site.** No server. Plain HTML + a small JS bundle (Vite if a bundler is needed; otherwise a single `index.html`).
- **Public PDB IDs** as source data. Start with `4PO2` (human HSP70 nucleotide-binding domain) and `1AO6` (human serum albumin) as familiar, well-documented references.

## Scientific accuracy guardrails

- Use temperature ranges grounded in the literature: most human enzymes have Tₘ in the 40–60 °C range; HSP70/HSP90 induction begins around 40–42 °C; DNA double-helix melting Tₘ in vitro is ~85–95 °C depending on GC content.
- When a number is uncertain, **say so in the UI copy** — never present a tooltip range as a single number.
- The animation is a *visualization* of denaturation, not a physical simulation. Always make this distinction in narration text, not buried in a footer.
- Cite sources. Even informal citations (a Wikipedia link, a PDB structure page) are better than none. Build a `references.md` as the project grows.

## Antigravity workflow notes

- Build in small increments. The whole point of this lab is to *watch the IDE work*, so prefer many small commits and visible intermediate states over one big push.
- When you (the agent) make a non-obvious science choice — picking a protein, picking a Tₘ value, picking how to animate unfolding — surface the choice in chat, not just in the code.
- The operator may want to capture screenshots of the IDE process itself for write-up. Don't be surprised by pauses; they're probably documentation moments.

## Repo conventions

- `notes/` — freeform markdown for IDE-session observations, screenshots, dead ends. Not promised to be coherent.
- `references.md` (when created) — running bibliography for any biological/chemical claim made in the UI.
- Branch directly off `main` for small experiments; PRs are welcome but solo work can land on `main` with clear commit messages.

## Out of scope, hard

- Anything that ingests a real human's biometric data.
- Anything that suggests a diagnosis, intervention, or treatment.
- Anything that tries to monetize.
