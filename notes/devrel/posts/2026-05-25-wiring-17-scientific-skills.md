---
title: Wiring 17 scientific skills into a fresh Antigravity workspace
slug: 2026-05-25-wiring-17-scientific-skills
date_drafted: 2026-05-25
date_publish_earliest: 2026-05-27
status: draft (sitting 48h before publish per DEVREL.md cadence)
beat: 1
project: heat-protein-lab
target_words: 1200-1500
live_url: https://heat-protein-lab.pages.dev/
canonical_url: https://craigmerry.com/blog/2026-05-25-wiring-17-scientific-skills/
venues:
  - craigmerry.com (canonical) — https://craigmerry.com/blog/2026-05-25-wiring-17-scientific-skills/
  - heat-protein-lab.pages.dev/posts/ (mirror, same content)
  - dev.to (canonical_url back to personal site)
  - x.com (5-7 tweet thread, links back)
---

# Wiring 17 scientific skills into a fresh Antigravity workspace

I'm building a small public website about what heat does to human
proteins. Eight chapters of scrollytelling, one real protein per chapter,
all of the data fetched live from public scientific databases — RCSB
PDB, AlphaFold, PubMed, the Human Protein Atlas, ClinVar, Reactome — and
none of the explanations more medical than they need to be. The repo
lives at [HeatThreshold/heat-protein-lab][repo], MIT, no analytics, no
accounts. It is a low-stakes home for an idea that was cut from a
[Google I/O 2026 hackathon][hackathon] submission as epistemically
risky.

It is also a deliberate test of three new(ish) Google products
composed against the same brief: [Antigravity 2.0][agy], the agentic
IDE that's replacing the Gemini CLI on 2026-06-18; the
[Science Skills][science] bundle that Google DeepMind dropped a few
weeks ago — seventeen skills wired up as Python CLIs covering the
major public bio/chem databases; and [Stitch][stitch], the AI design
tool that's now available as an MCP inside Antigravity.

This post is about getting from a freshly-opened workspace to a
checked-in `data/candidates.json` with every database query verified
end to end. That's Phase 0 in the project plan. It took about ninety
minutes total. Three things made it interesting beyond a setup
exercise.

## What "verified" actually means

The Science Skills bundle ships seventeen skills. The project needs
six of them: `pdb_database`, `alphafold_database_fetch_and_analyze`,
`human_protein_atlas_database`, `pubmed_database`, `clinvar_database`,
and `reactome_database`. Phase 0 is one trivial call per skill, the
output piped into `/tmp/`, and the first relevant identifier extracted
and committed to `data/candidates.json`. Nothing fancy. Just: does the
plumbing work, and can I cite specific things now.

The CLI version of Antigravity is `agy` (`1.0.2` on a Raspberry Pi 5,
aarch64). It works like Claude Code: prompt-driven, with `--print` for
one-shot non-interactive runs and `--dangerously-skip-permissions` to
auto-approve tool calls. I started with one mega-prompt: "run all six
smoke tests, then write `data/candidates.json` with everything you
verified."

This is the part that taught me a lesson.

## Lesson 1: specific small prompts beat orchestration prompts

The mega-prompt sat at 0.0% CPU for fourteen minutes. `ps -ef` showed
the `agy` process alive, one outbound socket open, no `uv` subprocess
ever spawned, nothing written to disk, no stdout output. I went and
made coffee, came back, killed it.

I retried with six separate `agy --print` calls, each capped at five
lines of output, each carrying the literal `uv run scripts/X.py …`
command for that skill. They ran in parallel via sibling bash calls
(agy doesn't appear to share state across processes). All five returned
verified output in under sixty seconds; the first one — PDB metadata
for `4PO2` — produced a clean answer in about thirty seconds.

The lesson, I think, is that when an agentic IDE is asked to *plan*
multi-step work, the planning step can consume the entire LLM call
without ever invoking tools. When the same agent is asked to
*execute* a specific tool call, the planning collapses to a single
inference and the next inference is the tool call. The two prompt
styles produce very different latency curves on the same backend.

The practical version, for anyone driving the `agy` CLI:

> If a single `agy --print` sits at 0.0% CPU for more than sixty
> seconds with no `uv`/`python` child processes visible in `ps -ef`,
> treat it as stalled and `pkill` it. Do not wait out the timeout.
> Rerun with one concrete shell command per prompt.

There's a separate observation worth recording here: in the *desktop*
Antigravity IDE, the same operator (me, ten minutes earlier) had used
Stitch's MCP to generate UI mockups for all nine chapters from a
single mega-prompt — and that one parallelised cleanly via Python
`threading`, dropping nine mockups in under two minutes. So the
"can't plan" failure mode appears to be a property of the print-mode
CLI specifically, not the IDE.

## Lesson 2: Antigravity bakes API keys into auto-generated scratch

Stitch's MCP requires a Google API key. When Antigravity called it,
the IDE generated a Python subprocess client at `scripts/mcp_client.py`
and wrote the key as a literal string in the `X-Goog-Api-Key` header:

```python
"X-Goog-Api-Key: AQ.Ab8…rjqA"
```

I caught this one before any `git add`. Refactored it out of source,
added the path to `.gitignore`. Two paragraphs later, Antigravity
generated *a different* Python client at `scripts/generate_ui.py`
with the same key in the same shape, and my next `git add -A` swept
it into the commit before I noticed. The commit was local only, never
pushed; a `git reset --soft HEAD~1`, an unstage, a `.gitignore`
pattern that catches both file names, a re-commit, and the key never
reached GitHub.

The key has now traveled through my Claude Code conversation history
twice via two embedded-in-source files. It's rotated. The replacement
will live in `~/.env` via a `printf | read -s | >> ~/.env` recipe
that keeps the value out of any shell or agent context.

The defensive playbook, for any Antigravity workspace touching
Google MCPs:

> Add up front to `.gitignore`:
> `scripts/mcp_client.py`,
> `scripts/generate_*.py`,
> `scripts/*_client.py`.
> Then before any `git add -A`, grep the working tree for
> `AIza|AQ\.[A-Za-z0-9_-]{20,}|API[_-]?KEY` patterns and bail if any
> match.

This isn't a knock on Antigravity — the Stitch MCP doesn't appear to
have a standard env-var path documented yet, and the IDE is doing the
plausible thing in the absence of one. It is a real ergonomic gap.
Worth surfacing.

## Lesson 3: real scientific work fell out the other end

Despite the friction, the actual *science output* was excellent.
Inside about six minutes of skill execution (after I'd pivoted to
focused prompts), `data/candidates.json` had:

- **PDB `4PO2`**: verified title *"Crystal Structure of the
  Stress-Inducible Human Heat Shock Protein HSP70 Substrate-Binding
  Domain in Complex with Peptide Substrate"*
- **AlphaFold `P0DMV8`** (HSPA1A): global pLDDT **88.88**, structure
  + metadata + PAE downloaded to `data/structures/alphafold/hspa1a/`
- **Human Protein Atlas** for HSPA1A: gene symbol resolved to
  Ensembl `ENSG00000204389`; Lung tissue at "High" expression
- **PubMed** for "HSF1 trimerization": top three PMIDs
  `38537598`, `24478344`, `41028522`
- **ClinVar**: 47 variants in `HSPA1A[gene]`
- **Reactome** stable ID `R-HSA-3371556` confirmed for "Cellular
  response to heat stress"

Two upstream-worthy bug reports surfaced along the way: the AlphaFold
fetch script returns 403 without a `SCIENCE_SKILLS_USER_AGENT` env
var, and the HPA `hpa_cli.py` script has a `ValueError` in
`get-tissue-expression` that `agy` ended up patching in place at the
plugin directory. Both are easy fixes; both will get filed against
[`google-deepmind/science-skills`][skills-repo] this week.

And a fact worth pinning down for anyone planning a similar project:
the per-skill verification pattern caught a scientific error in my
*own* design document on the same day. I'd written down "PDB 5D5W
or 5D5U" as candidate human HSF1 structures for Chapter 1. The
`pdb_database` skill's metadata query confirmed 5D5U is the human
structure ("Crystal structure of human Hsf1 with HSE DNA",
2.91 Å) — and that 5D5W is actually a fungal homolog (Chaetomium
thermophilum Skn7). A "yeah it sounds right" candidate that the
verification step caught before any code shipped against it.

## What lands next

Chapter 1's page now renders the real 5D5U structure in 3Dmol.js,
sticky in the figure column, citations pulled live from the
three PubMed papers above, the tissue badge rendering Human Protein
Atlas data across forty-nine tissues. That's Phase 1 in the build
plan; it'll be its own writeup. The page is at the repo, license MIT,
no medical claims.

If you're starting your own Antigravity workspace with the Science
Skills bundle: open the AGENTS.md in this repo as a worked example
for how to brief the IDE on a science project, and prepopulate the
gitignore patterns above before your first session. The cost of doing
that first is essentially zero. The cost of not is a soft reset.

[repo]: https://github.com/HeatThreshold/heat-protein-lab
[hackathon]: https://github.com/HeatThreshold/HeatThreshold
[agy]: https://antigravity.google
[science]: https://github.com/google-deepmind/science-skills
[stitch]: https://stitch.withgoogle.com
[skills-repo]: https://github.com/google-deepmind/science-skills
