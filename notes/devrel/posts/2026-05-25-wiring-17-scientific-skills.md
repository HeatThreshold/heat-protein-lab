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

This is the story I should have told at the [Google I/O 2026
hackathon][hackathon].

I went into that hackathon — Cerebral Valley × Google DeepMind, at
Shack15 on the Embarcadero, May 23rd — wanting to build something
about heat. Not heat in the [WBGT-and-clothing-color][heatthreshold-repo]
sense; the
[other story][heatthreshold-retro] does that already and shipped as
`HeatThreshold/HeatThreshold` on the day. The story I kept wanting
to tell was the one upstream of that: *what does heat actually do
to the molecules inside a human body when core temperature climbs?*
Why does 41 °C end an emergency department workup with the words
"organ damage", when 37 °C is just lunch? What proteins fail first,
how, in what order, with what consequence? I had been reading
HSF1/HSP70 review papers for weeks. I had no science background.
I knew the page in my head was the more compelling demo.

I didn't build it. I built the other one. The molecular story
was epistemically risky to ship inside a 48-hour window: claiming
anything about human biology under heat stress, on a hackathon stage,
with no domain reviewer, is a bad idea. So that idea sat in a
README bullet and a Slack message and went quiet. Two days after
the hackathon ended I started the repo it should have been —
[HeatThreshold/heat-protein-lab][repo], MIT, no analytics, no
accounts, eight chapters of scrollytelling, one real protein per
chapter, every claim back-linked to a real source. It is alive at
**<https://heat-protein-lab.pages.dev/>**.

It is also a deliberate test of three new(ish) Google products
composed against the same brief: [Antigravity 2.0][agy], the agentic
IDE that's replacing the Gemini CLI on 2026-06-18; the
[Science Skills][science] bundle that Google DeepMind dropped a few
weeks ago — seventeen skills wired up as Python CLIs covering the
major public bio/chem databases; and [Stitch][stitch], the AI design
tool that's now available as an MCP inside Antigravity. *Can these
three products, composed by one indie builder at a kitchen table,
produce a real, citation-grounded scientific explainer?* That's the
demo. The page is the answer.

This first post is about getting from a freshly-opened workspace to
a checked-in `data/candidates.json` with every database query
verified end to end. That's Phase 0 in the project plan. It took
about ninety minutes total. Three things made it interesting beyond
a setup exercise.

![The Heat Protein Lab hero, rendered against the project's surveyor's-notebook visual system. The persistent temperature strip at the top moves from 37 °C to 44 °C as the reader scrolls.](/screenshots/heat-protein-lab/01-hero.jpg)
*The lab's landing screen. The page that came out of all this Phase-0 plumbing.*

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

![Chapter 7 of the live site showing the full Reactome heat-shock-response pathway (R-HSA-3371556) inlined as SVG with HSPA1A highlighted in a magenta box near the centre.](/screenshots/heat-protein-lab/07-ch7-pathway.jpg)
*Chapter 7. The Reactome pathway diagram, fetched live through the Science Skills `reactome_database` skill and inlined as SVG with three jump-to-chapter chips below it. The chip ringlights the diagram on hover so a reader can find HSF1, HSPA1A, or HSP90AA1 and trace what role they played a few plates earlier.*

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

![Chapter 1 of the live site showing the human HSF1 structure (PDB 5D5U) rendered as an interactive 3Dmol.js cartoon — protein chains in ochre, the HSE DNA strands in slate, the citation accordion below, the tissue-expression badge in the marginalia column.](/screenshots/heat-protein-lab/02-ch1-hsf1.jpg)
*Chapter 1's first paint. The marginalia column on the left carries the tissue expression badge sourced from the Human Protein Atlas skill; the figure column on the right renders the actual mmCIF file with `DecompressionStream` decoding the committed `.cif.gz` in-browser. This is what every database query upstream of it is for.*

## What lands next

Chapter 1's page now renders the real 5D5U structure in 3Dmol.js,
sticky in the figure column, citations pulled live from the
three PubMed papers above, the tissue badge rendering Human Protein
Atlas data across forty-nine tissues. That's Phase 1 in the build
plan; it'll be [its own writeup][beat-2]. The page is at the repo,
license MIT, no medical claims.

If you're starting your own Antigravity workspace with the Science
Skills bundle: open the AGENTS.md in this repo as a worked example
for how to brief the IDE on a science project, and prepopulate the
gitignore patterns above before your first session. The cost of doing
that first is essentially zero. The cost of not is a soft reset.

And if you were at the I/O hackathon and saw `HeatThreshold` go up:
this is the second half of that story, the part I didn't trust
myself to ship under a deadline. The lab is at
<https://heat-protein-lab.pages.dev/>. The repo is at
[HeatThreshold/heat-protein-lab][repo]. The hackathon retro is
[here on craigmerry.com][heatthreshold-retro]. Read in any order;
they cohere either way.

[repo]: https://github.com/HeatThreshold/heat-protein-lab
[heatthreshold-repo]: https://github.com/HeatThreshold/HeatThreshold
[hackathon]: https://github.com/HeatThreshold/HeatThreshold
[heatthreshold-retro]: https://craigmerry.com/blog/2026-05-24-heat-threshold-google-io-hackathon/
[beat-2]: https://craigmerry.com/blog/2026-05-26-meeting-hsf1/
[agy]: https://antigravity.google
[science]: https://github.com/google-deepmind/science-skills
[stitch]: https://stitch.withgoogle.com
[skills-repo]: https://github.com/google-deepmind/science-skills
