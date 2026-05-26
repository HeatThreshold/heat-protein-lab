---
title: Three Google products, one project — what worked, what didn't, what I'd change
slug: 2026-05-25-three-google-products-retro
date_drafted: 2026-05-25
date_publish_earliest: 2026-05-25
status: published 2026-05-25
beat: 5
project: heat-protein-lab
target_words: 1800-2200
live_url: https://heat-protein-lab.pages.dev/
canonical_url: https://craigmerry.com/blog/2026-05-25-three-google-products-retro/
venues:
  - craigmerry.com (canonical) — https://craigmerry.com/blog/2026-05-25-three-google-products-retro/
  - heat-protein-lab.pages.dev/posts/ (mirror)
  - dev.to (canonical_url back)
  - x.com (6-8 tweet thread)
---

# Three Google products, one project — what worked, what didn't, what I'd change

[Heat Protein Lab][live] was, among other things, a deliberate
composability test: build a citation-grounded scientific explainer
using three new Google products in concert, by an indie developer
working alone, in a small number of sessions. The three products
were [Antigravity 2.0][agy] (the agentic IDE that's replacing the
Gemini CLI on 2026-06-18), the [Science Skills][science] bundle
that Google DeepMind dropped a few weeks ago, and [Stitch][stitch],
the AI design tool that ships as an MCP inside Antigravity.

The four posts before this one (Beats 1 through 4) describe what
got built and how. This post is the post-mortem on the *tools*. It
is the post a developer-relations team might find more useful than
the chapter-by-chapter writeups, because it is the post about
whether the three products actually compose.

The short version: **yes, with one large caveat.** The caveat is
the Antigravity CLI's `--print` mode, which I will get into below.

The longer version is below.

## Antigravity 2.0

The agentic IDE replaces the Gemini CLI on 2026-06-18. I used the
desktop IDE for most of the chapter authoring and the `agy` CLI on
my Raspberry Pi for data-fetcher work. Two surfaces, similar core
agent, very different ergonomics.

### What worked

- **The chat-shaped flow is the right shape for scientific UI work.**
  Most chapters needed about four exchanges with the IDE before the
  section markup was close enough to drop into manual edits: "I want
  a three-column shell on desktop that collapses to a single column
  under 1024 px"; "the figure should be sticky at top + 32 px on
  desktop"; "this chapter's accent is heat-40 — terra cotta"; "the
  body copy should sit on a 64-character measure." Each instruction
  produced a draft that was small enough to read in one screen and
  edit in three minutes. That cadence is the right cadence for a
  single-page-app-but-not-really build like this one.

- **The Modern Web Guidance plugin pays for itself.** The plugin
  intercepts "how do I X in CSS / HTML / a11y" questions and
  returns answers grounded in caniuse + W3C specs rather than
  blogosphere folklore. I caught two browser-compatibility issues
  during the build — `100dvh` falls back to `100vh` on Safari < 15.4
  (acceptable; covered both); `DecompressionStream("gzip")` is
  universally available in 2026 (used freely) — and both came from
  the plugin volunteering version-shipped data rather than me
  cross-referencing manually.

- **Inline checkpoints + tool transparency in the desktop IDE.**
  Antigravity Desktop shows every tool call as it happens — file
  reads, file writes, shell commands, MCP invocations — and lets
  the operator pause and edit between. That visibility was the
  single biggest difference between a frustrating session and a
  productive one. Knowing what the agent is about to do is more
  valuable than knowing what it did.

- **MCPs as a first-class slot.** Stitch, the Modern Web Guidance
  plugin, the Science Skills CLIs, the local filesystem — all of
  these compose into the same agent as plug-ins. The Stitch
  workflow especially felt natural: type the design intent, get a
  mockup, iterate, drop the result in `notes/design/`.

### What didn't

- **The `agy --print` CLI mode stalls on planning.** This is the
  big caveat. Both [Beat 1][beat-1] and [Beat 2][beat-2] cover the
  specific failure mode in detail; the short version is that giving
  `agy --print` an orchestration prompt ("do all six smoke tests,
  then write `data/candidates.json`") produces a stall where the
  process is alive, one socket is open, no tool calls are
  happening, and nothing is written to disk for fourteen-plus
  minutes. The same agent, asked to *execute* a specific shell
  command, returns in under a minute. The behavior differs from
  the desktop IDE, which planned a nine-screen Stitch mockup
  generation in parallel via Python threading from a single prompt
  in under two minutes. So the failure mode is print-mode-specific,
  not agent-wide. But it is the kind of failure mode that will
  burn anyone trying to use the CLI for batch work without
  knowing the rule.

  *The rule I would distill out of this for anyone using `agy --print`:
  one concrete shell command per prompt, capped at five lines of
  output. Treat the IDE as a small-step executor, not a planner.*

- **API keys get baked into auto-generated scratch.** When
  Antigravity calls an MCP that needs a Google API key (Stitch in
  my case), the IDE generates a Python subprocess client and
  writes the key as a literal string in the `X-Goog-Api-Key`
  header. This happened twice in the same session, on two
  differently-named auto-generated files (`scripts/mcp_client.py`
  and `scripts/generate_ui.py`). The first one I caught before
  `git add`; the second made it into a local commit that I had to
  soft-reset. The defensive playbook is in [Beat 1][beat-1] and
  it's a memory rule for any future Antigravity workspace I touch.
  Real ergonomic gap; worth surfacing.

- **The state directory naming is undocumented.** The Antigravity
  CLI state lives at `~/.gemini/antigravity-cli/` (not the
  intuitive-sounding `~/.gemini/antigravity/`); transcripts at
  `brain/<uuid>/.system_generated/logs/transcript.jsonl`. I worked
  this out by walking the filesystem after a session; there was
  no documentation pointing at it. (Operator filed an upstream
  issue about state-directory naming a week before this project.)

## Google DeepMind Science Skills

The Science Skills bundle is seventeen Python CLIs covering RCSB
PDB, AlphaFold, PubMed, Human Protein Atlas, ClinVar, dbSNP,
Reactome, NCBI sequence retrieval, and a handful of utility
skills. The bundle is a fresh public drop and there is very little
prior art for non-toy use. This project used six of the seventeen
skills heavily.

### What worked

- **The CLIs are deterministic, scriptable, and `uv`-runnable.**
  Every skill is `uv run scripts/<skill>_cli.py <args>`. The output
  is JSON to stdout, deterministic for the same inputs, no
  per-call rate-limiting surprises on the rate limits I hit. The
  project's data-fetcher pattern (`scripts/01_hsf1.py` through
  `scripts/06_variants.py`) all shell out to those CLIs via
  `subprocess.run`. Reliable; cacheable; reproducible.

- **The metadata returns are rich enough to catch errors.** The
  `pdb_database` skill caught two wrong PDB candidates in my own
  design document (5D5W is fungal, 5D5U is human; 2CG9 is yeast,
  7L7J is human) in seconds, before any rendering code was
  written. That kind of metadata-first verification step is now a
  rule in the project's [PROJECT.md][project] and a [feedback
  memory][verification-memory] for any future Science-Skills work.

- **The coverage is broad enough for a real explainer.** Six of
  seventeen skills covered everything the page needed:
  `pdb_database`, `alphafold_database_fetch_and_analyze`,
  `human_protein_atlas_database`, `pubmed_database`,
  `clinvar_database`, `reactome_database`. The remaining eleven
  skills (dbSNP, NCBI sequence, ChEMBL, UniProt, Pfam, KEGG, and
  utilities) are still in the bundle, and any future chapter
  extension could reach for them.

### What didn't

Three upstream bugs surfaced during Phase 0 and Phase 1. All three
are now filed at [`google-deepmind/science-skills`][skills-repo]
as issues #2, #3, and #4 with draft text in
[`notes/devrel/upstream-issues/`][upstream]:

- **AlphaFold 403 without `SCIENCE_SKILLS_USER_AGENT`.** The
  AlphaFold fetcher returns HTTP 403 from the EBI servers if the
  default user-agent is not overridden. Not documented; the fix is
  a one-line env-var set, but you find that out by reading the
  source.

- **HPA `hpa_cli.py get-tissue-expression` raises `ValueError`.**
  The Human Protein Atlas CLI uses one HTTP client for all
  endpoints. The XML tissue-expression endpoint needs a separate
  client; the JSON one chokes. `agy` patched this in place at the
  plugin directory during my Phase 0; the fix should land
  upstream.

- **Reactome SVG `Accept` header is too strict.** The Reactome
  diagram-fetch skill sets an `Accept` header that the
  ContentService doesn't match against. A one-character relax fixes
  it; the workaround is to add the SVG mimetype to the accept
  list.

None of the three is project-blocking — there are workarounds — but
each is the kind of small friction that adds up across a real build.

The third pattern worth mentioning isn't a bug: the bundle
auto-vendors copies of its own scripts into a project's
`scripts/` directory when an agent invokes them indirectly. Those
copies end up gitignored by the operator-supplied patterns for
agy scratch (e.g. `scripts/reactome_analysis.py`,
`scripts/pubmed_api.py`) but are easy to miss if you don't grep
before `git add -A`. Pre-populated `.gitignore` patterns matter.

## Stitch

Stitch is Google's AI design tool. In Antigravity 2.0 it ships as
an MCP. I used it to mock chapter 4 (the denaturation centerpiece)
and the WBGT bridge in Chapter 8 before writing the actual CSS, and
it shaped the look of the temperature strip + plate-corner badge
early.

### What worked

- **The single-prompt-to-all-chapters parallel run.** A single
  Antigravity Desktop session generated nine chapter mockups from
  one prompt, via Python `threading`, in under two minutes. The
  result was a reference set I could iterate against without
  re-prompting per chapter.

- **The design-system inheritance.** Once I had locked the
  paper / ink / heat-ramp tokens in `DESIGN.md`, Stitch carried
  them across mockups consistently. The Spectral serif title +
  IBM Plex Mono labels look I wanted survived the round-trip
  without me having to re-state it.

- **Mockup-to-implementation distance was small.** I expected the
  hand-off from a Stitch mockup to actual CSS to involve more
  re-work than it did. Two of the chapters (3 and 5) shipped with
  layouts very close to the Stitch original; the others diverged
  in detail but kept the visual vocabulary.

### What didn't

- **The API key embedded in scratch is the same hazard I keep
  flagging.** Stitch's MCP needs a Google API key; Antigravity
  generates the client script with the key inline. This is the
  same hazard described above under Antigravity; Stitch is the
  reason it surfaces.

- **State directory naming is the same problem.** The Stitch-
  related scratch goes into Antigravity's state tree, which is
  badly-documented.

- **No "Stitch as artifact" export today.** The mockups generated
  through the MCP are markdown/text outputs and screenshots; there
  is not (yet) a clean export-to-Figma or export-to-HTML path. For
  this project that was fine — the mockups served their job as a
  reference set and the implementation was hand-written CSS — but
  for teams that want to hand off Stitch output to a designer or
  developer not at the IDE, that gap matters.

## Composing the three against one brief

The composition test was: can these three products produce a real,
citation-grounded scientific explainer when used together by one
person at a kitchen table?

Yes. The page is at <https://heat-protein-lab.pages.dev/>. It is
real. It is grounded. It uses live structures from RCSB and
AlphaFold, citations from PubMed, tissue expression from the Human
Protein Atlas, variants from NCBI ClinVar, and a curated pathway
from Reactome — all wired through the Science Skills CLIs, all
fetched in `scripts/` at build time and committed to `data/`. The
visual system was drafted in Stitch, refined in CSS, and shipped
with no bundler. The IDE was Antigravity 2.0 desktop for most of
the chapter work and `agy --print` (carefully scoped to single
shell commands per call) for the data-fetch and verification work.

The "with one large caveat" is the `agy --print` failure mode. It
is the failure mode most likely to bite someone trying to use the
CLI for batch work without knowing the rule, and the rule —
**single concrete shell command per prompt, no orchestration** —
is not currently in the CLI's documentation. Worth surfacing as a
docs PR upstream.

## What this would look like for a teaching team

If a developer-relations team at Google wanted to demonstrate the
composition of these three products against a small but real
brief, this project — or something very like it — is a strong
shape:

- One landing artifact (the page).
- One open repo with clear phase plan + DevRel cadence (`PROJECT.md`,
  `DEVREL.md`, `AGENTS.md`).
- Five posts written across the build, not after, with screenshots.
- Three upstream bug reports filed (proof the team is actually
  using the products, not just admiring them).
- A small but meaningful set of memory rules + reference docs that
  make the workflow reusable: gitignore patterns for the API-key
  hazard, the state-directory cheat sheet, the "concrete shell
  command per prompt" rule.

What it would *not* require is a demo dataset, a slide deck, or
much polish beyond the artifact's own polish. The artifact is the
demo.

## Two upstream PRs I'd open if I had the time

I won't this week. If a future me has the time, the two highest-
leverage PRs to open against the science-skills repo are:

1. **A `Quickstart.md` that includes the API-key + state-directory
   cheat sheet.** Two hours of writing; saves every Antigravity
   workspace from the API-key-in-scratch hazard.

2. **A `docs/agy-cli.md` that documents the single-shell-command
   rule for `--print` mode**, with a worked example. Two hours of
   writing; saves the next person two days.

Both are within scope of the bundle's stated intent. Both are
small. Either one would be a high-value first contribution.

## Closing

I built this page because I wanted to know what heat does to the
molecules inside a body. I wrote five posts about it because the
tooling story is a real story and there is very little prior art
for using these three products together. The page itself is the
artifact; the posts are the path that gets you to the artifact.

If you read this far: the lab is at
<https://heat-protein-lab.pages.dev/>. The repo is at
[HeatThreshold/heat-protein-lab][repo]. The previous four posts
walk back to the wiring details ([Beat 1][beat-1]), the first
chapter ([Beat 2][beat-2]), the denaturation centerpiece ([Beat
3][beat-3]), and the full ship retrospective ([Beat 4][beat-4]).
Beat 5 is what you just read.

Thanks for reading. PRs welcome at a slow cadence.

[live]: https://heat-protein-lab.pages.dev/
[repo]: https://github.com/HeatThreshold/heat-protein-lab
[agy]: https://antigravity.google
[science]: https://github.com/google-deepmind/science-skills
[skills-repo]: https://github.com/google-deepmind/science-skills
[stitch]: https://stitch.withgoogle.com
[project]: https://github.com/HeatThreshold/heat-protein-lab/blob/main/PROJECT.md
[upstream]: https://github.com/HeatThreshold/heat-protein-lab/tree/main/notes/devrel/upstream-issues
[verification-memory]: https://github.com/HeatThreshold/heat-protein-lab/blob/main/PROJECT.md#per-skill-verification
[beat-1]: https://craigmerry.com/blog/2026-05-25-wiring-17-scientific-skills/
[beat-2]: https://craigmerry.com/blog/2026-05-26-meeting-hsf1/
[beat-3]: https://craigmerry.com/blog/2026-05-25-visualizing-denaturation/
[beat-4]: https://craigmerry.com/blog/2026-05-25-heat-protein-lab-shipped/
