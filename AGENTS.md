# AGENTS.md — heat-protein-lab

> Project context file. Antigravity 2.0 (and any other coding agent that follows the AGENTS.md convention) should read this at session start. Skim [README.md](./README.md) for the public framing and [PROJECT.md](./PROJECT.md) for the phased build plan.

## What this project is

A small, public, MIT-licensed scrollytelling explainer about what heat does to human proteins. Every chapter is grounded in real data fetched at build time from public scientific databases via the **Google DeepMind Science Skills plugin** that the operator has installed in Antigravity. The page itself is a static HTML/CSS/JS site that reads pre-fetched JSON and structure files from `data/`. See [PROJECT.md](./PROJECT.md) for the chapter outline and build phases.

## What this project is **not**

- **Not a clinical or medical tool.** No diagnostic claims. No medical advice. No PII. No accounts. No analytics.
- **Not a molecular dynamics engine.** Visualized denaturation is animation, not simulation. The UI must always surface this distinction in the narration, not bury it.
- **Not a HeatThreshold feature.** Sibling experiment in the same GitHub org; do not add cross-repo dependencies without explicit operator approval.

If you are about to write code that violates any of those, stop and ask.

## The plugin stack actually available in this workspace

The operator has the following Antigravity plugins installed at `~/.gemini/config/plugins/`. Prefer their skills over hand-rolled web requests or guesses.

### `science` — Google DeepMind Science Skills bundle (the main lever)

This plugin is the heart of the project. Seventeen skills, all wrapped as Python CLIs that run via `uv run scripts/<skill>_cli.py ...`. Each skill must record a `LICENSE_NOTIFICATION.txt` in its own skill directory on first use. Each skill **must be mentioned in your output** when used. Skills the project will actually exercise:

| Skill | When to use it in this project |
|-------|-------------------------------|
| `pdb_database` | Fetching experimentally-determined structures of HSF1, HSP70, HSP90, and the thermosensitive enzyme for Ch 4. Supports sequence/structure/attribute/full-text search. Always grep the schema before composing queries. |
| `alphafold_database_fetch_and_analyze` | Backup for any human protein without a good experimental structure. **Requires a UniProt ID** — never call it with a gene name. Returns pLDDT + PAE analysis (use the script output verbatim; do not compute domain boundaries yourself). |
| `human_protein_atlas_database` | Ch 5 tissue expression heatmap. Use `resolve-ensembl-id` first, then `get-tissue-expression` or `get-atlas-entry`. Strictly human-only. Output is large; always save to `/tmp/`, then process with `jq`. |
| `pubmed_database` | Every chapter's citation block. Use `search_pubmed` → `fetch_article_abstracts` → `jq`-slim. For >10 PMIDs use `cache_results_history` (NCBI History Server). Requires `~/.env` with optional `NCBI_API_KEY` and `USER_EMAIL`. **Never `cat` the `.env`.** |
| `clinvar_database` | Ch 6 clinical variants in HSPA1A / HSF1 / HSP90AA1. Use `count` → `search` → `summary` → `evidence`. Always include genomic coordinates in `<chrom>:<pos>:<ref>><alt>` format when presenting variants. |
| `dbsnp_database` | Fallback for resolving variant coordinates when ClinVar returns a gene range instead of a precise position. |
| `reactome_database` | Ch 7. **Use `diagram` with `--format svg` and `--highlight` to export the pathway diagram directly — this skill renders the SVG for us.** Pathway candidate: `R-HSA-3371556` (Cellular response to heat stress — verify ID via `search` before relying on it). |
| `ncbi_sequence_fetch` | Backup for raw protein sequence retrieval when a PDB or AlphaFold lookup needs a sequence input. |
| `protein_sequence_similarity_search` | Cross-species or paralog comparisons if a chapter needs them (probably not in initial scope). |

Other science skills exist (PubChem, ChEMBL, UniBind, ENCODE cCREs, UCSC conservation, arxiv literature, Reactome workflow creator) — they are unlikely to be needed for this project. Do not invent uses for them.

### Other installed plugins (orthogonal to the science work)

- `modern-web-guidance-plugin` — **mandatory first stop** for any HTML/CSS/JS feature per its own SKILL.md. Run `npx -y modern-web-guidance@latest search "<query>"` before writing scroll-driven animation code, intersection-observer code, container queries, view transitions, etc.
- `chrome-devtools-plugin` — for debugging the running page (CWV, INP, LCP, memory, a11y). The page is the deliverable, so use this before declaring a chapter visually done.
- **Stitch MCP** (Google's AI design tool, installed in Antigravity) — generates UI mockups from natural-language prompts. [DESIGN.md](./DESIGN.md) contains a self-contained Stitch prompt per chapter (`### Stitch prompt — Chapter N`). The workflow: ask the IDE to "generate the chapter N mockup with Stitch from `DESIGN.md`"; the IDE locates the corresponding prompt block, sends it to Stitch, and drops the resulting mockup into `notes/design/ch-N/`. Iterate the prompt in `DESIGN.md`, not in the chat — drift between code, design, and doc compounds.
- `firebase`, `android-cli-plugin`, `agy-plugin-demo` — irrelevant to this project, ignore.

## Prerequisites the IDE should establish in Phase 0

Before any science skill is invoked the first time:

1. **`uv` installation.** Verified missing on the Pi as of project start. Each science skill requires `uv` on PATH. Install via the official one-liner (`curl -LsSf https://astral.sh/uv/install.sh | sh`) and confirm `uv --version`. Use the project's `notes/` directory to capture which version was installed.
2. **`~/.env` review.** The file exists. NCBI-backed skills (PubMed, ClinVar, dbSNP) work without `NCBI_API_KEY` at 3 req/s; with a key they raise to 10 req/s. If a 429 ever appears, prompt the operator with the exact `printf | read -s | >> $HOME/.env` recipe from the relevant SKILL.md — **never read, print, grep, or otherwise inspect `~/.env`.**
3. **License notification files.** On first call to each skill, create the skill's `LICENSE_NOTIFICATION.txt` (in the *skill's* directory under `~/.gemini/config/plugins/science/skills/<name>/`, not in this repo). Surface the upstream license URL prominently in chat.
4. **Smoke test each science skill we'll use.** A single trivial call per skill, into `/tmp/`, to verify the pipeline works end-to-end before any project data depends on it.

## Repo conventions

- **`scripts/`** — Python build-time data fetchers, one per chapter or per skill. Always invoked via `uv run`. Output destinations are paths under this repo's `data/`, never `/tmp/` (those are scratch only).
- **`data/`** — committed JSON, downloaded `.cif`/`.pdb` files, exported Reactome SVGs. This is the runtime source of truth for the page. **Commit it.** The page must work without re-running any fetcher.
- **`notes/`** — freeform markdown for IDE-session observations, screenshots, dead ends. The whole point of this experiment is to *watch the IDE work*, so capture liberally here.
- **`references.md`** — running bibliography. Every chapter that lands should add its citations here in addition to inline UI links.
- **`index.html` + `src/`** — the page itself. Plain HTML/CSS/ES modules. No bundler unless complexity forces it. 3Dmol.js loaded from a pinned CDN URL with SRI hash.

## Build pacing

Commit small and often. The point of this experiment is to surface the IDE's process, so prefer many small commits over one big push. When you make a non-obvious science choice — picking a protein, picking a Tₘ value, picking how to depict unfolding — surface the choice in chat with a citation, not just in the code.

## Scientific accuracy guardrails

- Cite every number that appears in the UI. A `<sup>` linking to a PubMed entry is fine; an uncited claim is not.
- When a value is a range (e.g., HSP70 induction temperature 40–42 °C, or Tₘ 48–55 °C for a given enzyme), **show the range in the UI**. Never collapse to a single number without a footnote explaining the choice.
- Distinguish in narration between *what's been measured in cells*, *what's been measured in vitro*, and *what's been visualized for clarity in this page*. The third category is the largest.
- DNA double-helix thermal melting Tₘ (~85–95 °C in vitro, GC-dependent) is **not** what causes heat illness — heat illness comes from protein failure, which then permits DNA damage indirectly via failed repair enzymes. Make this distinction explicit if DNA comes up.
- Use the Wikipedia "Heat illness" / "Heat shock response" / "Heat shock protein" articles as orientation, but cite primary literature in the UI, not Wikipedia.

## Out of scope, hard

- Anything ingesting real human biometric data.
- Anything suggesting a diagnosis, intervention, or treatment.
- Anything monetized.
- Anything that auto-emails, auto-tweets, or auto-publishes from this repo.
