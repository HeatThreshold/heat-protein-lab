# PROJECT.md — heat-protein-lab build plan

> A phased build plan grounded in the actual capabilities of the Google DeepMind Science Skills plugin installed in Antigravity 2.0. Each phase is small enough to ship in a single working session; chapter phases land on `main` directly with a commit per non-trivial step. See [README.md](./README.md) for the public framing, [AGENTS.md](./AGENTS.md) for IDE context, [references.md](./references.md) for the running bibliography.

## Chapter outline (the destination)

The site at `index.html` is a single scrollytelling page. Sections are full-viewport. Each chapter is anchored by **one real protein**, **one real visual**, and **at least two real citations**.

| Ch | Title | Hero protein | Primary skill calls |
|----|-------|--------------|---------------------|
| 0 | The premise | — | None — pure framing + disclaimer |
| 1 | Meet your cellular thermometer | **HSF1** (heat-shock factor 1) | `pdb_database` (HSF1 DBD), `pubmed_database`, `human_protein_atlas_database` |
| 2 | When heat arrives | **HSF1 + HSP90** | `pdb_database` (HSP90), schematic SVG |
| 3 | The first line of defense | **HSP70 / HSPA1A** | `pdb_database` (4PO2 candidate), `pubmed_database`, `reactome_database` |
| 4 | When proteins melt | One thermosensitive enzyme (candidates: aldolase, LDH) | `pdb_database`, `pubmed_database` for the Tₘ |
| 5 | Heat shock proteins across the body | HSPA1A, HSPA8, HSP90AA1 | `human_protein_atlas_database` tissue queries |
| 6 | When the genome strains | HSPA1A / HSF1 variants | `clinvar_database` + `pubmed_database` |
| 7 | The full pathway | Reactome diagram | `reactome_database` (`diagram --format svg --highlight`) |
| 8 | Bridge to HeatThreshold | — | Pure JS; no skill calls |

*Protein IDs above are candidates. Each will be verified via the relevant skill before the chapter is built — the IDE should not assume any of them are correct.*

## Phase 0 — Bootstrap

Single goal: make every science skill we plan to use return real data into this repo's `data/` directory, end to end.

1. **Install `uv` on the Pi** (currently missing). Verify `uv --version`. Capture the install command and resulting version in `notes/0-bootstrap.md`.
2. **Confirm `~/.env`** exists (it does). If a `NCBI_API_KEY` is not already there, prompt the operator with the exact `printf | read -s | >> $HOME/.env` recipe from the SKILL.md files. Never read or print `~/.env` content.
3. **Create LICENSE_NOTIFICATION files** in each science skill directory on first use (PDB, AlphaFold, HPA, PubMed, ClinVar, Reactome). These live in the skill's directory under `~/.gemini/config/plugins/science/skills/<name>/`, not in this repo.
4. **Smoke test each skill** the project will use. One trivial call each, into `/tmp/`:
   - `pdb_database` — fetch metadata for PDB `4PO2` and confirm the title is HSP70-related.
   - `alphafold_database_fetch_and_analyze` — fetch the AlphaFold entry for UniProt `P0DMV8` (HSPA1A) and confirm pLDDT output parses.
   - `human_protein_atlas_database` — resolve gene symbol `HSPA1A` to its Ensembl ID, then fetch its tissue expression.
   - `pubmed_database` — search for `HSF1 trimerization` and fetch the top 3 abstracts.
   - `clinvar_database` — `count` variants in `HSPA1A[gene]`.
   - `reactome_database` — `search` for "Cellular response to heat stress" and confirm the stable ID.
5. **Lock in candidate protein IDs.** Write the verified PDB IDs, UniProt IDs, Ensembl IDs, and Reactome pathway ID into `data/candidates.json`. Every later phase reads from this file.

**Exit criteria:** All six smoke tests pass; `data/candidates.json` committed; `notes/0-bootstrap.md` captures any surprises.

## Phase 1 — Chapter 1 (Meet HSF1)

The first chapter is the template. Everything that gets built here defines the pattern for chapters 2–7.

1. Pre-flight: Use `modern-web-guidance` skill to pick a scroll-driven animation pattern (likely scroll-driven CSS animations + `IntersectionObserver` for chapter transitions) before writing any HTML/CSS.
2. **Data fetch script** at `scripts/01_hsf1.py`:
   - PDB metadata + structure download for the HSF1 DBD (sequence search will identify the right entry if 5D5W isn't confirmed).
   - PubMed search for the canonical HSF1 paper(s); fetch abstracts; slim with `jq` into `data/citations/hsf1.json`.
   - HPA resolve-ensembl-id → get-atlas-entry, stored at `data/expression/hsf1.json`.
3. **Page scaffold** at `index.html`:
   - One `<section data-chapter="1">` with the chapter narrative, a 3Dmol.js viewer for the HSF1 structure, a citation `<details>` block, and a small tissue-expression badge sourced from `data/expression/hsf1.json`.
   - 3Dmol.js loaded from a pinned CDN URL with SRI hash.
4. **Styling pass**: pick the page's overall typographic and color system. Suggested direction: muted greys + heat-gradient accent (yellow → orange → red), serif body + mono labels. Capture decisions in `notes/1-style.md`.
5. **Chrome DevTools smoke**: open `index.html`, confirm structure renders, citations link out, no console errors, LCP < 2.5 s.

**Exit criteria:** Chapter 1 visually complete in a browser, all data fetched from real sources, references.md updated.

## Phase 2 — Chapter 2 (HSF1 activation)

1. Hand-drawn SVG schematic of the HSF1 inactive monomer ↔ active trimer transition. Schematic, not structural — clearly labeled as such.
2. Add HSP90 structure beside it (PDB candidate 2CG9) so the "abandonment" step has a real anchor.
3. PubMed citations for HSF1 activation kinetics fetched via the same script pattern as Phase 1.

## Phase 3 — Chapter 3 (HSP70)

1. PDB structure of HSP70 (4PO2 candidate, verify in Phase 0). Two sub-domain views: nucleotide-binding domain and substrate-binding domain.
2. Reactome `diagram --format svg --highlight HSPA1A` exported into `data/diagrams/`. This is the first chapter that demos Reactome's diagram export.
3. PubMed citations for HSPA1A canonical papers.

## Phase 4 — Chapter 4 (When proteins melt) — *the visual centerpiece*

1. **Protein selection.** Pick a thermosensitive enzyme with (a) a public PDB structure, (b) a literature-measured Tₘ in the 40–60 °C range, (c) clear physiological relevance. Aldolase A and LDH-A are leading candidates. Verify Tₘ via PubMed before committing.
2. **Denaturation visualization.** A scroll-driven transition that interpolates the protein from its native PDB conformation to a visually "unfolded" representation. Implementation options to compare in `notes/4-denaturation.md`:
   - Cartoon → ribbon → coil rendering style change, driven by 3Dmol.js style commands.
   - Atom-level interpolation between native and an extended representation (a hand-built or library-supplied unfolded reference).
   - A pre-computed series of intermediate frames loaded as ten separate `.cif` files.
3. **UI guardrails.** A persistent banner over the chapter: *"Visualization, not molecular dynamics."* The scroll position is bound to a temperature value displayed prominently, with the literature-measured Tₘ marked.
4. Side panel updates with reading-only metrics (RMSD from native, secondary-structure %), pre-computed at build time from the chosen frames.

## Phase 5 — Chapter 5 (HPA tissue heatmap)

1. Build `scripts/05_hsp_tissues.py` that pulls tissue expression for HSPA1A, HSPA8, HSP90AA1 from HPA.
2. Render a CSS-grid heatmap directly from the resulting JSON. No D3 needed.
3. Brief narrative explaining the "expressed everywhere" finding and why endurance acclimatization works.

## Phase 6 — Chapter 6 (ClinVar variants)

1. `scripts/06_clinvar.py`: `count` → `search` (uncapped) → `summary` → `evidence` for a small set of HSPA1A / HSF1 / HSP90AA1 variants.
2. Variant cards in the UI showing genomic coordinate (`chrN:pos:ref>alt`), clinical significance, star rating, linked condition, PubMed citation references.
3. Strong disclaimer adjacent: clinical significance ≠ individual heat-illness risk prediction.

## Phase 7 — Chapter 7 (Reactome pathway)

1. Verify the right pathway stable ID for "Cellular response to heat stress" (candidate `R-HSA-3371556`) via Reactome's `search` command.
2. `reactome_database diagram --id <verified_id> --format svg --highlight "HSF1,HSPA1A,HSP90AA1" --output data/diagrams/hsr-pathway.svg`
3. Inline the SVG, with hover interactions tying nodes back to the chapters where each was introduced.

## Phase 8 — Chapter 8 (Bridge to HeatThreshold)

Pure JS, no skill calls.

1. WBGT input field. A simple physiological model translates WBGT and exposure duration into a *plausible-range* core-temperature curve (this is not predictive medicine and must be labeled as such).
2. As the curve crosses chapter checkpoints (37 → 39 → 40 → 41 → 42 °C), the corresponding earlier chapter's anchor is visually marked as "you've reached this point in the story."
3. A footer link to the HeatThreshold repo for the safety/scheduling side.

## Phase 9 — Polish

1. Mobile responsive check at 360 × 640 minimum.
2. A11y pass (keyboard nav, screen reader labels on 3Dmol viewers, sufficient contrast on heat-gradient accents).
3. LCP / INP under Core Web Vitals thresholds via chrome-devtools.
4. Disclaimer audit: every chapter has a visible "not medical advice" footer.
5. Source attribution audit: every fact in the UI traces to a source in `references.md`.

## Data licensing

Each upstream database carries its own terms. The license-notification files created in Phase 0 record acknowledgment of these:

- **PDB** — https://www.rcsb.org/pages/usage-policy
- **AlphaFold** — https://alphafold.ebi.ac.uk/
- **Human Protein Atlas** — https://www.proteinatlas.org/about/licence
- **PubMed / PMC** — https://pubmed.ncbi.nlm.nih.gov/disclaimer/ + per-paper licenses
- **ClinVar / dbSNP** — https://www.ncbi.nlm.nih.gov/clinvar/ + https://www.ncbi.nlm.nih.gov/home/about/policies/
- **Reactome** — https://reactome.org/license + https://reactome.org/cite

The project code itself is MIT. Data fetched into `data/` carries the upstream license of its source — `references.md` records source + retrieval date for each artifact committed.

## What we are deliberately NOT building

- A login system, accounts, or user data.
- An LLM-generated explanation layer. Every narrative paragraph is written by a human (the operator, optionally assisted by the IDE) and reviewed before commit.
- A "predict your heat tolerance" widget. Hard out of scope.
- A mobile app or Electron build. Static page only.
- A complete biology textbook. Eight chapters, then stop and polish.
