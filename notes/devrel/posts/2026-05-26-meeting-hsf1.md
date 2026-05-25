---
title: Meeting HSF1 in Antigravity 2.0 — the first chapter shipped
slug: 2026-05-26-meeting-hsf1
date_drafted: 2026-05-26
date_publish_earliest: 2026-05-28
status: draft (sits 48h per DEVREL.md cadence)
beat: 2
project: heat-protein-lab
target_words: 1500-2000
venues:
  - craigmerry.com (canonical)
  - dev.to (canonical_url back)
  - x.com (6-8 tweet thread)
  - linkedin (long-form)
---

# Meeting HSF1 in Antigravity 2.0 — the first chapter shipped

[Beat 1][beat-1] described wiring seventeen scientific skills into a
fresh Antigravity 2.0 workspace and getting `data/candidates.json`
checked in. This is what happened next: a real chapter of the
[heat-protein-lab][repo] page, anchored on a real protein structure,
fetched from real public databases, citations and tissue expression
included. The chapter renders at
[HeatThreshold/heat-protein-lab#chapter-1][live]. It is built around
the heat-shock master regulator **HSF1**.

Three things in here were worth a post on their own.

## A scientific correction caught by the verification step

The chapter's hero protein is HSF1, the transcription factor that
senses heat and switches on the genes that make HSP70 and HSP90. The
design document I&apos;d written before any code went in listed
&ldquo;PDB 5D5W or 5D5U&rdquo; as the candidate human HSF1 structure to
render in the 3D viewer.

The first thing the Phase 1 fetcher did was query the `pdb_database`
skill for metadata on both. The result took thirty seconds:

- **5D5U** &mdash; *&ldquo;Crystal structure of human Hsf1 with HSE
  DNA&rdquo;*, X-ray diffraction, 2.91 Å, *Homo sapiens*. The right
  answer.
- **5D5W** &mdash; *Chaetomium thermophilum* Skn7 with HSE DNA. A
  fungal homolog, not human HSF1. Wrong taxon entirely.

I had written down a structure that wouldn&apos;t have been wrong if
you only read the abstract carelessly (the gene family is conserved
across kingdoms; both proteins bind the same DNA motif), but it
absolutely would have been wrong rendered as &ldquo;your cells contain
this.&rdquo; A short PDB metadata query caught it in seconds, before
any code or any narrative depended on it.

This happened *twice* on the same day. The Chapter 2 design draft
listed PDB 2CG9 as the human HSP90 candidate; the same kind of query
showed 2CG9 is yeast (*Saccharomyces cerevisiae*), and the right human
structure is 7L7J, a cryo-EM Hsp90:p23 complex at 3.1 Å. Two non-human
candidates caught by the same one-line verification pattern in twelve
hours of work.

The pattern is small but the conclusion isn&apos;t: when a design
document picks anchor data, it is worth running a thirty-second
verification query against that data&apos;s authoritative source
before any rendering code is written. The wrong protein at the wrong
species is the kind of mistake that, once it shows up rendered with a
citation underneath it, is much harder to detect.

## The build pattern

The Chapter 1 page is plain HTML, plain CSS, one ES module of
JavaScript, and no bundler. No React, no Tailwind, no Vite. The full
file count for this chapter:

- `index.html` &mdash; the document, with a `<section data-chapter="1">`
  block holding marginalia + body + a 3Dmol viewer container
- `src/styles.css` &mdash; the design tokens (cream paper, Spectral
  serif, IBM Plex Mono labels, a heat-ramp accent system from slate at
  37 °C through terra-cotta at 41 °C)
- `src/main.js` &mdash; an ES module that fetches the chapter&apos;s
  data files, mounts the 3Dmol viewer, hides the loading overlay, and
  wires an `IntersectionObserver` for the chapter-aware temperature
  strip pinned at the top of the viewport

That&apos;s it. The structure is committed in tree at
`data/structures/pdb/hsf1/pdb_00005d5u.cif.gz` (74 KB gzipped), and at
runtime the JS does this:

```js
const buf = await (await fetch(url)).arrayBuffer();
const view = new Uint8Array(buf);
if (view[0] === 0x1f && view[1] === 0x8b) {
  const ds = new DecompressionStream("gzip");
  const stream = new Blob([buf]).stream().pipeThrough(ds);
  cifText = await new Response(stream).text();
}
viewer.addModel(cifText, "cif");
```

`DecompressionStream` is in every modern browser and means the
repo can hold the file gzipped (a quarter of the uncompressed size)
without a build step. The magic-byte check (`0x1f 0x8b`) makes the
code robust to whether the dev server adds a `Content-Encoding: gzip`
header. Python&apos;s `http.server` doesn&apos;t.

The sticky figure trick is also worth flagging. On screens 1024 px
wide and up, the figure column gets `position: sticky; top: var(--temp-strip-height) + 32px; align-self: start;`,
so the spinning HSF1 ribbon stays glued to the same screen position
while the reader scrolls through the chapter&apos;s body text. The
protein is in view the entire time it&apos;s being discussed. It is
the single biggest readability improvement I made in the chapter, and
it is four lines of CSS.

## The agy CLI stall, and what it told me about prompts

[Beat 1][beat-1] mentioned the &ldquo;specific small prompts beat
orchestration prompts&rdquo; rule in passing. Chapter 1&apos;s build
made me believe it.

The Phase 1 data layer required four fetches: PDB structure file,
AlphaFold structure file, top-three PubMed papers on HSF1
trimerization, and Human Protein Atlas tissue expression. Asking `agy
--print` to do all four in one prompt produced the exact same 0.0%-CPU
stall I&apos;d hit during Phase 0. PID alive, one open network socket,
no `uv` subprocesses spawned, no output for fifteen minutes. The
agent was stuck in its planning step.

The pivot that worked: write a small project Python script
(`scripts/01_hsf1.py`, hundred lines) that shells out to the canonical
skill CLIs at their plugin path:

```py
PUBMED_SCRIPTS = Path.home() / ".gemini/config/plugins/science/skills/pubmed_database/scripts"

run([
    "uv", "run", str(PUBMED_SCRIPTS / "pubmed_api.py"),
    str(search_path), "search_pubmed",
    "heat shock factor 1 HSF1 trimerization activation",
    "--max_results", "5",
])
```

It ran end-to-end in under a minute. PDB and AlphaFold were already
cached from Phase 0&apos;s smoke tests, so it short-circuited; PubMed
hit, returned three real papers (PMIDs 30467350, 33493517, 27354066),
and HPA resolved HSF1 to `ENSG00000185122` and reported tissue
expression across forty-nine tissues. The same Human Protein Atlas
fetch that stalled under `agy --print` returned a 4.5 KB JSON in
seconds when called as a `subprocess.run`. Same skill, same arguments,
two invocation paths, very different reliability.

The rule that came out of it: when you can write down the exact
shell command, write it down; don&apos;t make the IDE plan it for
you. The IDE&apos;s value is *between* commands, not in choosing them.

## What rendered

Chapter 1 on the page now shows the marginalia column with a tissue-
expression badge sourced from live Human Protein Atlas data
(&ldquo;Expressed across 49 of 49 tissues; high in adrenal gland,
breast, bronchus, cerebellum (+20 more)&rdquo;), a 64-character-wide
reading column with body copy that introduces HSF1, an inline 3Dmol
viewer rendering the actual 5D5U mmCIF with the protein chains in
ochre cartoon and the HSE DNA strands in slate, a citation accordion
exposing the three PubMed papers above with author lists and PMIDs
linked out to NCBI, and a small AlphaFold-derived note about HSF1&apos;s
global pLDDT of 61.31 confirming the protein is partly disordered by
design.

The PDB overlay at the bottom-left of the viewer is a real link to
[RCSB&apos;s 5D5U entry][5d5u-rcsb]. The PubMed citations are real
PubMed entries (the [Neuroprotection by HSF1 paper][neuro] in
*Scientific Reports*, the [SUMOylation paper][sumo] in *JBC*, the
[p38 MAPK substrate paper][p38] in *MCB*). The HPA tissue claim is
sourced from the live IHC consensus and re-fetchable by running the
project script in tree.

## Three sharp edges worth lifting

For anyone setting up a similar workspace:

- **`scripts/generate_*.py` files Antigravity writes need to be in
  `.gitignore` from day one.** The IDE auto-generates Python clients
  that embed API keys inline. We caught two before commit on the same
  day and the gitignore patterns at the project&apos;s `.gitignore`
  catch the family of file names the IDE chooses (mostly
  `mcp_client.py`, `generate_*.py`, `*_client.py`).
- **The science-skills plugin has three upstream bugs as of v1.0.0**
  worth filing if you hit them: AlphaFold returns HTTP 403 without
  `SCIENCE_SKILLS_USER_AGENT` set; HPA `hpa_cli.py
  get-tissue-expression` raises a `ValueError` and needs a separate
  HTTP client for its XML endpoint; the Reactome diagram&apos;s
  `Accept` header for SVG needed a one-character fix. All three
  patched locally on my Pi; drafted issues are in tree at
  [`notes/devrel/upstream-issues/`][upstream].
- **The IDE&apos;s desktop and CLI modes behave very differently.**
  Antigravity Desktop ran a nine-Stitch-screen mockup generation in
  parallel via Python `threading` from a single prompt and converged
  in two minutes. The CLI&apos;s `--print` mode on the same machine,
  same plugin, stalled forever on a six-skill orchestration prompt.
  Don&apos;t generalise from one to the other.

## What&apos;s next

The chapter is the first of nine sections on the page. Chapters 2
through 8 follow the same pattern: marginalia + reading body + a
figure column with a 3Dmol viewer or schematic or heatmap or chart,
all reading from data files committed to `data/`. Chapter 4 is the
visual centerpiece, scroll-driven, and is the trigger for the next
post (Beat 3).

The repo is at [HeatThreshold/heat-protein-lab][repo], MIT-licensed,
no medical claims, no analytics. If you&apos;re working in the same
space, the issue templates ask the questions I&apos;d want asked.

[beat-1]: https://craigmerry.com/blog/2026-05-25-wiring-17-scientific-skills
[repo]: https://github.com/HeatThreshold/heat-protein-lab
[live]: https://github.com/HeatThreshold/heat-protein-lab#chapter-1
[5d5u-rcsb]: https://www.rcsb.org/structure/5D5U
[neuro]: https://pubmed.ncbi.nlm.nih.gov/30467350/
[sumo]: https://pubmed.ncbi.nlm.nih.gov/33493517/
[p38]: https://pubmed.ncbi.nlm.nih.gov/27354066/
[upstream]: https://github.com/HeatThreshold/heat-protein-lab/tree/main/notes/devrel/upstream-issues
