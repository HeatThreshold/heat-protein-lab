# heat-protein-lab

> An **Antigravity 2.0 IDE experiment** that builds a real, citation-grounded, scroll-driven explainer of what heat does to human proteins — using Google DeepMind's [Science Skills](https://github.com/google-deepmind/science-skills) plugin (PDB, AlphaFold, PubMed, Human Protein Atlas, ClinVar, Reactome) to fetch real biological data, and 3Dmol.js to render real protein structures. Not a clinical tool. A lab.

This repo is the small, deliberately-low-stakes home for an idea that was floated during the [HeatThreshold](https://github.com/HeatThreshold/HeatThreshold) Google I/O 2026 hackathon push and ultimately deemed too risky to ship inside a 48-hour scoped submission. The risk wasn't technical — it was *epistemic*: claiming anything about human biology under heat stress, on a hackathon stage, with no domain reviewer, is a bad idea. Doing it here, framed as an experiment, with disclaimers up front and every claim back-linked to a real source, is a fine idea.

The companion question is: **how does Antigravity 2.0 feel as a creative coding environment when the brief is half-scientific?** The Science Skills plugin gives the IDE first-class access to a stack of public scientific databases. This repo is the petri dish for finding out what that combination can produce.

## What the lab will produce

A single-page, public scrollytelling explainer at `index.html` that walks the reader through what happens inside a human body as core temperature climbs from a normal 37 °C up through fever (39 °C), hyperthermia (40 °C), medical emergency (41 °C), cellular catastrophe (42 °C), and beyond. Every chapter centers on a *real protein*, with its *real structure*, with *real citations*, with *real expression data*, with — where relevant — *real clinical variants*.

The narrative arc:

| Ch | Title | Anchor |
|----|-------|--------|
| 0 | The premise | One screen. The hook + the disclaimer. |
| 1 | Meet your cellular thermometer | HSF1, the master heat-shock regulator (PDB structure, expression) |
| 2 | When heat arrives | HSF1 activation — HSP90 abandonment → trimerization → DNA binding |
| 3 | The first line of defense | HSP70 (HSPA1A) — the chaperone that refolds damaged proteins |
| 4 | When proteins melt | A real thermosensitive enzyme — visual denaturation (clearly labeled as visualization, not MD) |
| 5 | Heat shock proteins across the body | Tissue expression heatmap from the Human Protein Atlas |
| 6 | When the genome strains | ClinVar variants in HSPA1A / HSF1 — known clinical significance |
| 7 | The full pathway | Reactome "Cellular response to heat stress" diagram (R-HSA-3371556, candidate) |
| 8 | Bridge to HeatThreshold | A WBGT input → predicted core-temperature progression → chapter checkpoint markers |

The full phased build plan lives in [PROJECT.md](./PROJECT.md). The running bibliography lives in [references.md](./references.md). Project context for Antigravity 2.0 lives in [AGENTS.md](./AGENTS.md).

## How the project is built

- **Build-time data fetching.** A set of Python scripts in `scripts/` calls the Science Skills CLIs (PDB, AlphaFold, PubMed, HPA, ClinVar, Reactome) via `uv run`. Each script writes plain JSON or downloaded structure files into the committed `data/` directory.
- **Static page reads from `data/`.** No server, no build framework initially. Plain HTML + CSS + ES modules. 3Dmol.js for protein rendering, IntersectionObserver-driven CSS for scroll triggers, Reactome's own SVG export for the pathway diagram.
- **All data is committed.** The page works offline; rebuilding the data is an explicit, separate workflow.
- **Every claim is cited.** Inline footnote-style links to PubMed, PDB, AlphaFold, ClinVar entries. Sources also collected in [references.md](./references.md).

## Hard constraints

- **No medical or clinical claims.** Not advice. Not diagnostic. Not predictive of individual human outcomes. If you are experiencing heat illness, call a doctor, not a JavaScript app.
- **No PII, no biometric ingestion, no accounts, no analytics.** The page is purely static and educational.
- **No physical simulation.** The denaturation animations are *visualizations of denaturation*, not molecular dynamics. This distinction is surfaced in the UI, never buried.
- **No HeatThreshold integration without explicit say-so.** This is a sibling experiment, not a feature.

## How to run it (eventually)

Open `index.html` in a browser. There is no build step for the page itself. To refresh the underlying scientific data, run the fetcher scripts in `scripts/` — they require `uv`, `jq`, and the Science Skills plugin installed in Antigravity (see [PROJECT.md § Phase 0](./PROJECT.md#phase-0--bootstrap)).

## License

MIT for the project code. The fetched data files in `data/` carry the licenses of their upstream sources (RCSB PDB, EBI AlphaFold, NCBI PubMed/ClinVar/dbSNP, Human Protein Atlas, Reactome). See [references.md](./references.md) for source attribution and [PROJECT.md § Data licensing](./PROJECT.md#data-licensing) for details.

## Author

Craig Merry (craigm26 on GitHub). Personal experiment; PRs welcome, pace will be slow.
