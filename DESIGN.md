# DESIGN.md — heat-protein-lab

> Visual design system and UX specification for the heat-protein-lab scrollytelling page. This file is also the **Stitch source of truth**: each chapter section ends with a copy-paste prompt block that Antigravity 2.0's Stitch MCP can consume to generate a mockup. See [README.md](./README.md) for the project pitch, [PROJECT.md](./PROJECT.md) for the build plan, [AGENTS.md](./AGENTS.md) for IDE context, [references.md](./references.md) for citations.

## How this document is meant to be used

Two audiences:

1. **Antigravity 2.0 with the Stitch MCP.** Open this repo in Antigravity. Ask the IDE to "use Stitch to generate the chapter 1 mockup based on `DESIGN.md`." The IDE should locate the `### Stitch prompt — Chapter N` block, send it to Stitch, drop the resulting mockup into `notes/design/ch-N/`, and iterate from there. Each Stitch prompt block is self-contained — Stitch doesn't see prior context, so the brand system is restated where needed.
2. **A human reader.** Use this doc as the visual reference while implementing in code. The non-prompt sections (Design principles, Visual system, Component library, Motion, Responsive, Accessibility) describe the conventions that the prompts presuppose.

When code and this doc disagree, **fix the doc first**, then update the code. Drift is worse than churn.

## Design principles

1. **The science is the design.** Real protein structures, real diagrams, real numbers. The page's visual heroes are PDB structures and Reactome SVGs — the rest of the layout is a quiet frame around them.
2. **Heat is the through-line.** Every chapter is positioned on a continuous temperature axis. A persistent thin strip at the top of the viewport shows where the reader is on that axis, colored by the current temperature.
3. **Surveyor's notebook, not a glassmorphic SaaS dashboard.** Cream paper, serif body, marginalia. Inherits from the operator's PlatAtlas Vol I/II + mcpreplay.dev visual family. Quiet, considered, citation-dense. Closer to *Encyclopaedia Britannica* than *Stripe.com*.
4. **Every visual claim has a footnote.** No floating numbers. No vague gradients pretending to be data. If it looks scientific, it links to a source.
5. **Visualization ≠ simulation, and the UI says so.** Where animations depict denaturation, a persistent banner over that region reads "Visualization, not molecular dynamics." Never a small footer.
6. **Mobile first only where mobile is the realistic context.** Educational long-form reads well on phones, so chapters 0–7 must work on a 360×640 viewport. Chapter 8 (the WBGT interactive) is desktop-primary.
7. **Reduced motion is honored.** All scroll-driven and time-driven animations have a static fallback when `prefers-reduced-motion: reduce`.

## Visual system

### Color

The palette is anchored on a heat ramp. Cool slate at body-baseline 37 °C, warming through to molten red at lethal 44 °C+. Every chapter is assigned a temperature, which sets the chapter's accent.

| Token | Hex | Use |
|-------|-----|-----|
| `--paper` | `#F5EFDF` | Page background |
| `--paper-edge` | `#E9E0C8` | Section dividers, table strokes |
| `--ink` | `#1B1B1B` | Body text |
| `--ink-soft` | `#3D3A33` | Secondary text, captions |
| `--ink-faint` | `#8A8275` | Marginalia, footer text |
| `--rule` | `#221A15` | Hairlines, decorative rules |
| `--heat-37` | `#4F6B7A` | Slate blue — baseline body temp |
| `--heat-38` | `#6E7C73` | Cool olive — borderline |
| `--heat-39` | `#B8A04F` | Warm yellow — fever |
| `--heat-40` | `#C97A2B` | Ochre — hyperthermia |
| `--heat-41` | `#B23A1F` | Terra cotta — medical emergency |
| `--heat-42` | `#7F1414` | Burning red — cellular catastrophe |
| `--heat-44` | `#1B0707` | Ash — fatal |
| `--accent-link` | `#7F1414` | Inline links, citation chips (`--heat-42`) |
| `--accent-link-hover` | `#B23A1F` | Hover state for links |
| `--surface-card` | `#FBF6E8` | Slightly lighter than paper, for raised cards (citation blocks, variant cards) |
| `--surface-viewer` | `#0F1217` | Dark background behind 3Dmol viewers — proteins read better against near-black |

Contrast: `--ink` on `--paper` is ~14:1. `--ink-soft` on `--paper` is ~9:1. `--ink-faint` is reserved for non-essential text only and must clear 4.5:1 against the surface it sits on (verify with chrome-devtools a11y skill).

### Typography

| Token | Family | Use |
|-------|--------|-----|
| `--font-display` | "GT Sectra Display", "Spectral", serif | Chapter headings only |
| `--font-body` | "Spectral", "Charter", "Georgia", serif | All body copy |
| `--font-mono` | "IBM Plex Mono", "JetBrains Mono", ui-monospace | Numbers, PDB IDs, gene symbols, captions on data figures |
| `--font-ui` | "Inter", system-ui, sans-serif | Buttons, the temperature strip readout, small UI chrome only |

Type scale (rem; base 16 px):

- Hero chapter title: 4.5 / 5.5 / 6.5 (mobile / tablet / desktop), display serif, ligatures on
- Section subhead: 1.75 / 2 / 2.25, display serif
- Body: 1.0625 / 1.125 / 1.1875 (slightly larger than typical for readability), Spectral, line-height 1.65, max-width 64ch
- Caption: 0.875, mono, tracking 0.02em
- Marginalia (desktop only, in the right gutter): 0.8125, ink-faint

Body copy never goes wider than 64ch even on ultra-wide. The extra horizontal space becomes marginalia + figure overflow.

### Spacing

8-pt baseline grid. Section vertical rhythm: 96 / 128 / 192 px between chapters at sm / md / lg. Inside a chapter: 24 px between paragraphs, 48 px before/after figures.

### Layout shell

Single-column reading width on mobile/tablet. On desktop (≥ 1024 px) a three-column structure:

```
+----------------+----------------+-----------+
|  marginalia    |  reading body  |  figure   |
|  (chapter      |  (text, 64ch   |  (3Dmol,  |
|   metadata,    |   max)         |  Reactome |
|   footnotes)   |                |  SVGs)    |
+----------------+----------------+-----------+
```

Marginalia column = 20%, reading column = 50%, figure column = 30%. On viewports narrower than 1024 px, marginalia collapses into inline footnote chips (small superscript numerals that expand to a popover on tap), and the figure stacks above the text within each section.

### Persistent global UI

Two pieces of UI are visible at all viewport sizes and at all scroll positions:

1. **Temperature strip** — a 4-px-tall horizontal bar pinned to the very top of the viewport. Its fill width represents reading progress through the document. Its fill *color* interpolates along the heat ramp based on the chapter currently in view. To the right of the strip, in 12 px mono, a small readout: `37.0 °C` → `42.5 °C` etc. Aria-label: "Reading progress, current chapter temperature."
2. **Plate corner** — a small fixed badge in the bottom-right of the viewport reading `Plate I` / `Plate II` etc. (1 plate per chapter, surveyor convention). Tapping the badge opens a contents drawer with all 9 plates listed; tapping a plate scrolls to it. The drawer drawer dismisses with Esc or backdrop tap. Hidden on viewports under 480 px.

There is no traditional header or footer. The first viewport is the title; the last is the colophon.

### Iconography

No icon set. Where a glyph is needed (e.g. external-link indicator on PubMed chips, the contents-drawer triangle on the plate corner), use the smallest SVG that does the job, stroked in `--rule`, 1.25 px stroke, square caps.

### Motion

- **Default duration**: 240 ms with `cubic-bezier(0.4, 0.0, 0.2, 1)` (the same Material standard easing, restrained).
- **Scroll-driven**: Use CSS scroll-driven animations (`animation-timeline: view()`) where supported; fall back to IntersectionObserver toggling a `.in-view` class for entry transitions.
- **Long-form scroll choreography in Ch 4**: a scroll-linked progress variable (0 → 1) drives the 3Dmol style and color from native to denatured. Step through ten precomputed frames if continuous interpolation proves too jittery on mobile.
- **No parallax**, no float-in-from-bottom on every paragraph. Restraint.
- **Reduced motion**: when `prefers-reduced-motion: reduce`, the temperature strip stops interpolating color smoothly (it snaps per chapter), the denaturation chapter shows the start and end states as two static figures side-by-side, and all entry transitions become instant opacity changes.

## Component library

These are the components that get reused across chapters. Each is one Stitch generation primitive.

- **Chapter section** — One `<section data-chapter="N" data-temp="..">`, full viewport height minimum, scroll-snap aligned. Slot: title, eyebrow (e.g. "Plate III / 37.0 °C"), body, figures, footnotes.
- **Protein viewer card** — A dark-background container (uses `--surface-viewer`) holding a 3Dmol.js viewer. Top-left overlays the PDB ID (mono, white-on-dark). Bottom-right overlays "Source: RCSB PDB · 4PO2 · retrieved YYYY-MM-DD" with a hyperlink to the PDB entry.
- **Citation block** — A `<details>` element titled "Sources for this chapter" that expands to show 2–6 PubMed citations as a tight list: author / year / title / journal / PMID-link. Mono PMID, serif everything else.
- **Variant card** (Ch 6) — A small card on `--surface-card` showing one ClinVar variant: gene symbol big, genomic coordinate `chrN:pos:ref>alt` in mono, clinical-significance pill colored by category (Pathogenic = `--heat-42`, Likely Pathogenic = `--heat-41`, VUS = `--heat-39`, Benign = `--heat-37`), star rating, and a "Cited in" row linking PubMed IDs.
- **Pathway diagram embed** (Ch 7) — Full-bleed SVG container with a soft drop shadow on `--paper`, sized to fit the figure column on desktop and full-width on mobile. Inline SVG so node hover interactions can drive cross-chapter highlights.
- **Tissue heatmap** (Ch 5) — CSS-grid table of tissues × HSP genes; cells colored on a single-hue ramp from `--paper` to `--heat-41` based on HPA category (Not Detected → High). Hovering a cell shows a tooltip with the source citation.
- **Temperature strip** (global) — Described above.
- **Plate corner / contents drawer** (global) — Described above.

## Chapter specs

### Chapter 0 — The premise

**Temperature anchor:** 37.0 °C (baseline)

**Content:** Hero title: *Heat Protein Lab*. Eyebrow: *Plate 0 / 37.0 °C*. One-sentence subtitle: *What heat does to the molecules that keep you alive — told one real protein at a time.* Below the title, a one-paragraph framing: this is an educational experiment, not a clinical tool, built around real public scientific data sources. Below that, a small block titled "What this is not" listing the four hard constraints from README.md as bullets.

**Visual:** Full-viewport. Title set in display serif at the maximum scale of the type system. The "Plate 0 / 37.0 °C" eyebrow in mono caps tracked +2%. Below the title, a thin horizontal rule in `--rule`, then the framing copy in 64ch body width. The visual hero is the *absence* of imagery — this chapter is type-only, deliberately quiet. Page background `--paper`, text `--ink`, no accent color used.

**Stitch prompt — Chapter 0:**

> Generate a full-viewport mobile-first hero section for a scientific educational scrollytelling page titled "Heat Protein Lab". Background is cream paper (#F5EFDF). Use a serif display typeface (Spectral or similar). The hero title "Heat Protein Lab" is set very large (responsive: ~4.5rem on mobile, scaling to ~6.5rem on desktop), in dark almost-black ink (#1B1B1B). Above the title is a small monospaced eyebrow line reading "Plate 0 / 37.0 °C" in dark grey (#3D3A33), uppercase, slightly tracked. Below the title is a single-sentence serif subtitle: "What heat does to the molecules that keep you alive — told one real protein at a time." Below the subtitle, a single hairline horizontal rule in dark brown (#221A15). Below the rule, a body paragraph of about 80 words in serif explaining this is an educational experiment using real public scientific data. Below that, a small section labeled "What this is not" in monospace caps, followed by four short bullets: "Not medical advice", "No personal data", "Not a molecular dynamics engine", "Not a product". Generous vertical whitespace, a 64-character reading-width max for body copy. Quiet, considered, like a museum wall text — not a SaaS landing page. At the very top of the viewport is a 4-pixel-tall horizontal progress strip filled in slate blue (#4F6B7A) at about 5% width with a tiny mono readout "37.0 °C" on its right side.

### Chapter 1 — Meet your cellular thermometer (HSF1)

**Temperature anchor:** 37.0 °C → 38.5 °C (the regulator activates as we warm)

**Content:** Eyebrow "Plate I / 37.0–38.5 °C". Title: *Meet your cellular thermometer.* Body: introduce HSF1 (heat-shock factor 1) as the master regulator that senses heat. Explain in plain language that at body temperature HSF1 sits quietly bound to HSP90; as temperature rises, HSP90 has to leave for more urgent work, freeing HSF1 to trimerize, enter the nucleus, and switch on the heat-shock genes. Figure: 3Dmol viewer of **PDB 5D5U** ("Crystal structure of human Hsf1 with HSE DNA", X-ray, 2.91 Å resolution — verified in Phase 1 against PDB metadata, 2026-05-25). Marginalia: tissue-expression badge ("HSF1: ubiquitous across human tissues — source: Human Protein Atlas"). Citation block with 2–4 PubMed entries.

> **Phase 1 verification correction (2026-05-25):** Earlier drafts of this doc listed "5D5W or 5D5U" as candidates. PDB metadata via the `pdb_database` skill confirms **5D5W is actually a fungal homolog** (Chaetomium thermophilum Skn7 with HSE DNA), not human HSF1. Chapter 1 anchors on 5D5U. Future chapters may still reference 5D5W if useful as a comparative cross-species example — but the human anchor is 5D5U.

**Visual:** Three-column desktop layout. Marginalia left: eyebrow + tissue badge + "Plate I" notation. Reading body center: title in display serif, then 3–4 paragraphs of serif body, then the `<details>` citation block. Figure column right: protein viewer card on `--surface-viewer`, sized about 320 px square. Mobile: figure stacks above text. Accent: chapter accent color is `--heat-38` (cool olive); the temperature strip color and small chapter-number ornament use it.

**Stitch prompt — Chapter 1:**

> Generate a full-viewport scientific scrollytelling chapter section for the "Heat Protein Lab" page. Use a three-column layout on desktop (1024px+): left 20% marginalia column, center 50% reading column max 64 characters wide, right 30% figure column. Cream paper background (#F5EFDF), serif body (Spectral or similar), monospaced labels (IBM Plex Mono). Chapter accent color is cool olive (#6E7C73). Marginalia column shows in monospace caps: "PLATE I", a temperature label "37.0 → 38.5 °C", and a small badge reading "TISSUE EXPRESSION · HSF1: ubiquitous (Human Protein Atlas)". Reading column has a display-serif chapter title "Meet your cellular thermometer" (large, dark ink), then four short serif paragraphs explaining how the heat-shock factor HSF1 normally sits bound to the chaperone HSP90 and is released when heat arrives, trimerizes, enters the nucleus, and switches on the heat-shock genes. After the body text, a collapsed details element labeled "Sources for this chapter" with a small expand chevron. Figure column shows a dark-near-black card (#0F1217) about 320×320 pixels with a stylized 3D ribbon protein structure rendered inside (placeholder for a 3Dmol viewer); top-left overlay shows "PDB · 5D5U" in white monospace; bottom-right overlay shows "RCSB PDB · retrieved 2026-05-25" tiny white monospace with an external-link glyph. Persistent thin temperature strip at the top of the viewport is filled to roughly 15% width in cool olive (#6E7C73) with a mono readout "38.5 °C" to its right. Bottom-right of the viewport: a small fixed badge reading "Plate I" in monospace on cream. Mobile (under 1024px): all three columns stack vertically — eyebrow, title, body, figure, citation block.

### Chapter 2 — When heat arrives (HSF1 activation)

**Temperature anchor:** 38.5 °C → 40.0 °C

**Content:** Eyebrow "Plate II / 38.5–40.0 °C". Title: *When heat arrives.* Body: describe the activation kinetics — HSP90 detaches, HSF1 forms a homotrimer, gets phosphorylated, enters the nucleus, binds the heat-shock element on DNA. Two figures: (a) hand-drawn SVG schematic of the monomer-to-trimer transition, clearly labeled "schematic, not to scale"; (b) 3Dmol viewer of HSP90 (PDB candidate 2CG9).

**Visual:** Same three-column shell as Chapter 1. The figure column is split into two stacked figures here. Chapter accent: `--heat-39` (warm yellow).

> **Phase 2 verification correction (2026-05-25):** Earlier drafts of this doc listed PDB **2CG9** as the HSP90 candidate. The `pdb_database` skill confirms 2CG9 is the *yeast* (Saccharomyces cerevisiae) Hsp82-Sba1 closed-state complex, not human HSP90. Chapter 2 now anchors on **7L7J** — "Cryo-EM structure of Hsp90:p23 closed-state complex", *Homo sapiens*, electron microscopy at 3.1 Å. Second time the verification pattern has caught a non-human candidate in this design doc (first was 5D5W in Ch 1 → 5D5U).

**Stitch prompt — Chapter 2:**

> Generate a scientific scrollytelling chapter section using the same three-column desktop layout as Chapter 1 (20% marginalia / 50% reading / 30% figure). Cream paper background (#F5EFDF), serif body, monospaced labels. Chapter accent color is warm yellow (#B8A04F). Marginalia: "PLATE II", temperature "38.5 → 40.0 °C", small badge reading "ACTIVATION · HSF1 → trimer". Reading column: display-serif title "When heat arrives", then four paragraphs explaining how heat dissociates HSP90 from HSF1, allowing HSF1 to trimerize, get phosphorylated, enter the nucleus, and bind heat-shock elements on DNA. Figure column has two stacked figures: top is a clean schematic SVG showing one monomer transforming into a three-armed trimer (simple linework on cream, clearly labeled "Schematic — not to scale" in small monospace italic underneath); bottom is a dark card (#0F1217) about 320×280 with a 3D ribbon protein placeholder and overlay labels "PDB · 7L7J · HSP90" (top-left) and "RCSB PDB · retrieved 2026-05-25" (bottom-right). Temperature strip at top is now filled to about 28% in warm yellow with mono readout "40.0 °C". Plate badge in bottom-right reads "Plate II". Persistent banner above the schematic in small mono caps: "VISUALIZATION, NOT MOLECULAR DYNAMICS." Mobile stacks single-column.

### Chapter 3 — The first line of defense (HSP70)

**Temperature anchor:** 40.0 °C

**Content:** Eyebrow "Plate III / 40.0 °C". Title: *The first line of defense.* Body: HSP70 (HSPA1A) is the workhorse chaperone induced by HSF1. It binds exposed hydrophobic patches on partially unfolded clients and uses ATP to refold them. Figure: 3Dmol of HSP70 (PDB candidate 4PO2) split-view showing the nucleotide-binding domain and the substrate-binding domain. Also show: the first slice of the Reactome heat-shock pathway diagram, focused on HSPA1A.

**Visual:** Same shell. Accent: `--heat-40` (ochre). The Reactome diagram appears as a *figure that slides in from the bottom* on scroll — entry transition only, no continuous scroll-link.

**Stitch prompt — Chapter 3:**

> Generate a scientific scrollytelling chapter section, same three-column shell as Chapter 1, cream paper (#F5EFDF), serif body, monospaced labels. Chapter accent: ochre (#C97A2B). Marginalia: "PLATE III", temperature "40.0 °C", badge "CHAPERONE · HSP70 / HSPA1A". Reading column: display-serif title "The first line of defense", followed by four paragraphs explaining HSP70 as the ATP-driven chaperone that binds exposed hydrophobic patches on damaged client proteins and refolds them; HSP70 is what HSF1 turns on. Figure column has two stacked elements: top, a dark card (#0F1217, about 320×360) showing a 3D ribbon protein structure with two distinct labeled domains "Nucleotide-binding domain (NBD)" and "Substrate-binding domain (SBD)" in white mono, overlay "PDB · 4PO2"; bottom, a small embedded section of a pathway diagram in clean linework (cream background, dark strokes) showing a tiny portion of the heat-shock response network with one node "HSPA1A" highlighted in ochre. Below the pathway snippet a tiny caption "Source: Reactome (R-HSA-3371556 · candidate) — retrieved 2026-05-25." Temperature strip at top filled to about 40% in ochre, readout "40.0 °C". Plate badge bottom-right "Plate III". Mobile stacks single-column.

### Chapter 4 — When proteins melt (the visual centerpiece)

**Temperature anchor:** 40.0 °C → 50.0 °C (this chapter alone spans a wider range; selected enzyme's Tₘ lives here)

**Content:** Eyebrow "Plate IV / 40.0 → 50.0 °C — Tₘ ≈ 48 °C". Title: *When proteins melt.* Body: introduce the chosen thermosensitive enzyme (candidate: aldolase A); describe its native fold and the experimentally-measured Tₘ. Then the long-form section: as the reader scrolls, the temperature value displayed centrally climbs from 40 to 50 °C; the protein viewer transitions from native cartoon to a visibly disordered representation. The transition is clearly labeled as a *visualization* not a simulation.

**Visual:** Layout breaks the three-column shell. This chapter is a single full-viewport stage: the protein viewer is centered and large, with a large temperature readout overlaid below it. Body text appears in a narrow column to the right of the viewer or below on mobile. A persistent banner in `--heat-41` reads "Visualization, not molecular dynamics." A small side panel shows two computed metrics (RMSD-from-native and secondary-structure-% retained) updating with scroll.

**Stitch prompt — Chapter 4:**

> Generate a full-viewport scientific scrollytelling chapter section. This chapter breaks the standard three-column layout: it is a single centered stage. Cream paper background (#F5EFDF). Above the stage, a small monospace eyebrow "PLATE IV / 40.0 → 50.0 °C / Tₘ ≈ 48 °C" in dark grey. A persistent banner directly under the eyebrow in burning red (#B23A1F) with cream text, monospace caps small letters: "VISUALIZATION, NOT MOLECULAR DYNAMICS." Below the banner, a large display-serif title "When proteins melt." Below the title, the centerpiece: a large dark card (#0F1217, roughly 560×560 on desktop, full-width on mobile) showing a 3D ribbon protein structure (aldolase A) in a partially unfolded state — some helices visibly broken, loops more chaotic, ribbons fraying. Overlay top-left in white mono "PDB · 4ALD". Centered below the card, in display serif very large (about 4rem), the current temperature value: "46.3 °C" with a small mono "↑" indicator. To the right of the card on desktop (or stacked below on mobile), a narrow column with: a serif body paragraph explaining that the visualization interpolates between the native crystal structure and a representation of the unfolded state — it is not a physical simulation; the experimentally measured melting temperature (Tₘ) for this enzyme is approximately 48 °C, cited inline. Below that, a small data panel in monospace showing two metrics: "RMSD from native: 8.7 Å" and "Secondary structure retained: 41%", both with tiny horizontal bar visualizations next to them. Below the entire stage, a small italic mono caption: "Scroll to advance temperature. Reduced-motion users see start and end states side-by-side." Temperature strip at top of viewport filled to about 65% in terra cotta (#B23A1F), readout "46.3 °C". Plate badge bottom-right "Plate IV".

### Chapter 5 — Heat shock proteins across the body

**Temperature anchor:** 40.0 °C (snapshot, not a progression)

**Content:** Eyebrow "Plate V / 40.0 °C". Title: *Where the defenders live.* Body: a short paragraph explaining the heatmap that follows — HSPA1A, HSPA8, HSP90AA1 expression across a panel of normal human tissues from HPA. Highlight that HSP genes are ubiquitous (which is why heat acclimatization works systemically).

**Visual:** Three-column shell. The figure column hosts a tall tissue heatmap (rows = tissues, columns = three HSP genes). Cell colors on a single-hue ramp from `--paper` to `--heat-41`. Tooltip on hover shows the source.

**Stitch prompt — Chapter 5:**

> Generate a scientific scrollytelling chapter section, three-column desktop layout (20/50/30), cream paper (#F5EFDF), serif body, monospaced labels. Chapter accent: ochre (#C97A2B). Marginalia: "PLATE V", "40.0 °C", badge "EXPRESSION · Human Protein Atlas". Reading column: display-serif title "Where the defenders live", followed by three short paragraphs explaining that the heat-shock proteins are expressed across virtually all human tissues — this ubiquity is what makes whole-body heat acclimatization possible. Figure column shows a tall tissue heatmap: rows are about 18 human tissues (Brain, Heart, Liver, Kidney, Lung, Skeletal muscle, Skin, Bone marrow, Spleen, Pancreas, Adrenal gland, Testis, Ovary, Stomach, Colon, Thyroid, Prostate, Placenta) listed on the left in monospace; columns are three gene symbols across the top in monospace caps "HSPA1A / HSPA8 / HSP90AA1"; cells are square, colored on a four-step ramp from cream (Not Detected) through light tan, medium ochre, deep terra cotta (#B23A1F for High). Below the heatmap, a tiny monospace caption: "Source: Human Protein Atlas, IHC consensus — retrieved 2026-05-25." Temperature strip at top filled to about 50%, readout "40.0 °C". Plate badge bottom-right "Plate V".

### Chapter 6 — When the genome strains (ClinVar variants)

**Temperature anchor:** 40.5 °C

**Content:** Eyebrow "Plate VI / 40.5 °C". Title: *When the genome strains.* Body: short framing — some humans carry HSPA1A / HSF1 / HSP90AA1 variants of clinical significance; the literature on whether they affect heat-illness susceptibility is thinner than for cardiac arrhythmias or oncology variants, so what follows is *what is documented in ClinVar*, not predictions about anyone. Hard disclaimer adjacent. Figures: a row of 3–6 variant cards.

**Visual:** The reading body is narrower; the figure column expands to host a 2- or 3-column grid of variant cards on `--surface-card`. Accent: `--heat-41` (terra cotta).

**Stitch prompt — Chapter 6:**

> Generate a scientific scrollytelling chapter section. Cream paper background (#F5EFDF), serif body, monospaced labels. Chapter accent: terra cotta (#B23A1F). Layout: top section is the three-column shell (20/50/30) with marginalia (left: "PLATE VI", "40.5 °C", badge "VARIANTS · ClinVar"), display-serif title "When the genome strains" plus three short serif paragraphs that frame this as documentation of what ClinVar contains, NOT as predictions about individuals; one paragraph carries a small heavily-emphasized warning box in cream-on-terra-cotta italic mono: "Clinical significance ≠ individual heat-illness risk prediction." Below the introductory block, the chapter widens to a full-width grid of variant cards — 3 across on desktop, 2 across on tablet, 1 across on mobile. Each card is a slightly raised surface (#FBF6E8) with: top row, gene symbol large in monospace caps and a colored pill ("Pathogenic" in terra cotta, "Likely Pathogenic" in ochre, "VUS" in warm yellow); middle row, genomic coordinate in monospace "chr6:31815525:G>A"; below that, the protein-level effect in monospace "p.Arg171His" if applicable; a star rating (1–4 filled stars in dark ink) labeled "Review status"; and a "Cited in" row with two or three monospace PMID links (e.g. "PMID 12345678, 23456789"). Below the grid, an italic mono caption "Source: NCBI ClinVar — retrieved 2026-05-25." Temperature strip at top about 55%, terra cotta, readout "40.5 °C". Plate badge bottom-right "Plate VI".

### Chapter 7 — The full pathway (Reactome)

**Temperature anchor:** 41.0 °C

**Content:** Eyebrow "Plate VII / 41.0 °C". Title: *All of it, all at once.* Body: a single short paragraph framing the diagram — the Reactome pathway "Cellular response to heat stress" (R-HSA-3371556, verified in Phase 0). The proteins introduced in earlier chapters are highlighted nodes. Hovering a node opens a small tooltip telling the reader which chapter introduced it and offering a "Re-read that section" link.

**Visual:** This chapter is figure-first: the pathway SVG dominates, full-bleed within the reading-column width on mobile and extending into the marginalia column on desktop. Body text is below.

**Stitch prompt — Chapter 7:**

> Generate a scientific scrollytelling chapter section, figure-first. Cream paper background (#F5EFDF). Chapter accent: deep red (#7F1414). Above the figure, eyebrow in monospace "PLATE VII / 41.0 °C". Title in display serif "All of it, all at once." Below the title, a full-bleed pathway diagram on cream with a soft warm shadow underneath — clean linework, dark strokes (#221A15), about 1000 pixels wide on desktop. The diagram shows the cellular heat-stress response: about 15 nodes labeled with gene/protein symbols connected by directed arrows. Three nodes ("HSF1", "HSPA1A", "HSP90AA1") are highlighted with a deep red fill (#7F1414) and white labels; the remaining nodes are outlined in dark on cream with dark labels. A tiny "i" superscript appears next to each highlighted node, hinting at hover interactivity. Below the diagram, a single serif body paragraph about 60 words explaining that everything in the preceding plates happens roughly together, in seconds, when cells encounter heat. Below that paragraph, a monospace caption: "Source: Reactome · R-HSA-3371556 · diagram exported via Reactome ContentService — retrieved 2026-05-25." Temperature strip at top filled to about 78%, deep red, readout "41.0 °C". Plate badge bottom-right "Plate VII".

### Chapter 8 — Bridge to HeatThreshold (interactive)

**Temperature anchor:** 41.0 → 43.0 °C (user-driven)

**Content:** Eyebrow "Plate VIII / 41.0–43.0 °C". Title: *Your environment, your enzymes.* Body: explain the bridge — translate a WBGT value plus exposure duration into a plausible-range core-temperature curve, and as the curve crosses each chapter-checkpoint temperature, the corresponding earlier chapter's plate badge lights up. Strong disclaimer that this is not predictive medicine.

**Visual:** A two-pane layout: left pane is the input controls (WBGT slider, duration slider, baseline-fitness select); right pane shows a line chart of predicted core temperature over time with horizontal dashed lines at 39, 40, 41, 42 °C, each labeled with its plate number, lighting up as the curve crosses. At the bottom of the page, a colophon block: link to HeatThreshold, MIT license note, source attributions, build date.

**Stitch prompt — Chapter 8:**

> Generate the final chapter section of a scientific scrollytelling page. Cream paper background (#F5EFDF). Chapter accent: deep red (#7F1414). Eyebrow in monospace "PLATE VIII / 41.0 → 43.0 °C", display-serif title "Your environment, your enzymes." Below the title, a two-column interactive layout on desktop (50/50), stacking on mobile. Left column is a small controls panel on slightly raised cream (#FBF6E8) containing three labeled inputs: a horizontal range slider "WBGT (°C)" currently at 32, a horizontal range slider "Exposure duration (minutes)" currently at 60, and a select dropdown "Baseline acclimatization" with the value "Moderately acclimatized" visible. Below the controls, a small italic mono warning box: "Educational model — not a clinical prediction." Right column shows a line chart on cream: x-axis labeled "Minutes" running 0 to 60, y-axis labeled "Core temperature (°C)" running 37 to 43. A single dark line rises gently from 37.0 at minute 0 to about 41.8 at minute 60. Four horizontal dashed lines cross the chart at y = 39, 40, 41, 42, each labeled at the right edge in monospace ("Plate II 39°", "Plate III 40°", "Plate VI 40.5°", "Plate IV 42°", etc., the references mapping to the earlier chapters of this page). Where the projected curve crosses each dashed line, a small filled dot appears with the corresponding plate badge label lighting up subtly. Below the entire chapter, a colophon block in small monospace caption text on cream: project name, MIT license, primary data sources (PDB, AlphaFold, HPA, PubMed, ClinVar, Reactome — each with retrieval date), and a link line "← Back to top · HeatThreshold". Temperature strip at top filled to 100%, deep red, readout "42.5 °C". Plate badge bottom-right "Plate VIII".

## Component-level Stitch prompts (reusable)

Use these when iterating on a single component rather than a full chapter.

### Protein viewer card

> Generate a single component card for embedding a 3D protein structure viewer. Dark near-black background (#0F1217), square aspect ratio about 320×320 px (or 560×560 in a hero context). Inside the card, a stylized 3D ribbon protein structure rendered with subtle gradient lighting — placeholder for an interactive 3Dmol viewer. Top-left overlay: PDB ID in white monospace "PDB · 4PO2". Bottom-right overlay: source attribution in tiny white monospace with reduced opacity "RCSB PDB · retrieved 2026-05-25" followed by a small external-link glyph. No other UI. The card has no border but casts a soft warm shadow on a cream background (#F5EFDF).

### Citation block

> Generate a closed `<details>` accordion component on a cream paper background (#F5EFDF). The summary text is in serif "Sources for this chapter" with a small chevron glyph on its right side. Below the summary (when expanded), show four citation rows, each consisting of: author last names + et al. in serif italic, year in serif roman, title in serif italic for the article, journal name in small caps serif, and a monospace PMID link in deep red (#7F1414) underlined on hover. Each row is separated by a hairline in pale tan (#E9E0C8). The component is 64 characters wide max.

### ClinVar variant card

> Generate a single variant information card on a slightly raised cream surface (#FBF6E8) with a soft warm shadow on a cream paper background (#F5EFDF). The card is about 280 pixels wide. Inside, top row: gene symbol in monospace caps "HSPA1A" at about 1.5rem, and a pill to its right colored deep red (#7F1414) with cream text "Pathogenic". Middle row: genomic coordinate in monospace "chr6:31815525:G>A" at about 0.875rem. Next row: protein-level effect in monospace "p.Arg171His" if applicable. Below that, a star rating row: four small filled stars in dark ink labeled "Review status" in tiny monospace caption. Bottom row: "Cited in" label in tiny serif italic followed by two or three monospace PMID links underlined in deep red.

## Responsive

- **≤ 480 px** — single column. The plate corner and contents drawer disappear; reach navigation only via swipe up to top + scroll. Marginalia inlines as small superscript footnote chips. Hero type drops to its smallest scale. Citation blocks collapse default.
- **481 – 1023 px** — single column for text, but the figure column floats inline at full text width above each section's body. Plate corner visible.
- **1024 – 1439 px** — full three-column shell active. Marginalia inhabits the left gutter.
- **≥ 1440 px** — three columns + larger figure column; text stays capped at 64ch.

## Accessibility

- Color contrast verified per Visual System table; all body copy clears 7:1 against `--paper`.
- All 3Dmol viewers have an `aria-label` describing the structure ("HSP70 ribbon diagram, PDB 4PO2"). A keyboard-accessible alternate-content button under each viewer reveals a textual description.
- Scroll-driven chapters work without scrolling: keyboard PgDn / PgUp advances chapters atomically; arrow keys within a chapter advance the temperature value (Ch 4) or the variant grid (Ch 6).
- `prefers-reduced-motion: reduce` honored throughout — see Motion section.
- The temperature strip's color is decorative, not load-bearing; its semantic value is the textual readout, which is always present.
- All PubMed / PDB / Reactome / HPA / ClinVar links have descriptive link text (never "click here"), and external-link glyphs have an `aria-label`.

## Open design questions (resolve before Phase 2)

1. Does the surveyor's-notebook visual reading collide aesthetically with HSP70 cartoon-ribbon rendering (which has its own punchy chemistry palette)? Consider muting 3Dmol's default cartoon palette to a constrained 3-color set that lives in our heat ramp.
2. The Chapter 4 denaturation visualization: continuous interpolation between two structures, or 10 precomputed `.cif` frames? Decide after a perf test on the Pi over LAN.
3. The Reactome diagram (Chapter 7) is rendered by Reactome's own service. Their default styling may not match our brand. Investigate whether SVG post-processing in Python at build time can restyle strokes and fills to our palette without misrepresenting the structure.
4. Chapter 8's WBGT-to-core-temperature model is the highest-risk-of-misinterpretation component on the page. Should it be behind a "click to reveal" gate so it never auto-runs on page load?
5. Should there be a dark mode? Surveyor's notebook *is* the metaphor — dark mode probably fights it. Likely no, but verify with a test render.

## Out of scope for this document

- Any visual treatment of HeatThreshold itself (cross-repo).
- Any analytics or telemetry UI.
- Any login / account UI.
- A multi-page IA. This is single-page scrollytelling, full stop.
