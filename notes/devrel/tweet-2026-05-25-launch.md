# Tweet thread — heat-protein-lab launch 2026-05-25

X/Twitter handle: [@CraigMerry](https://x.com/CraigMerry)
Status: draft for operator review
Goal: one cohesive thread of 8 tweets that hooks on the hackathon
what-if, names the three Google products in play, and links to the
canonical posts + the live page.

Each tweet is ≤ 270 characters so it fits comfortably under the 280
limit with room for ASCII counters / URL trimming.

---

## Thread (8 tweets)

### 1 — hook

> At the Google I/O 2026 hackathon I wanted to build something about
> what heat does to the molecules inside a human body.
>
> I didn't. The claim space was too risky for a 48-hour stage.
>
> Two days later I started the repo it should have been. It's live:
>
> https://heat-protein-lab.pages.dev/

`(Beat 1 of 5 thread ↓)`

---

### 2 — what it is

> Heat Protein Lab is 8 chapters of scrollytelling about heat-shock
> biology. One real protein per chapter (HSF1, HSP70, HSP90, aldolase
> A), real PDB structures rendered in 3Dmol, citations from PubMed,
> tissue data from the Human Protein Atlas, the full Reactome pathway.
>
> No medical claims.

---

### 3 — the stack

> Built in @AntigravityCLI 2.0 against Google DeepMind's Science
> Skills bundle (17 Python CLIs for the public bio/chem databases),
> with @StitchByGoogle for the design pass.
>
> Plain HTML / CSS / one ES module. No bundler. The repo is at
> github.com/HeatThreshold/heat-protein-lab.

---

### 4 — Beat 1 link

> Beat 1 — wiring 17 scientific skills into a fresh Antigravity
> workspace.
>
> Three lessons fell out: small prompts beat orchestration prompts,
> Antigravity bakes API keys into auto-generated scratch, and real
> science output comes out the other end.
>
> https://craigmerry.com/blog/2026-05-25-wiring-17-scientific-skills/

---

### 5 — Beat 2 link

> Beat 2 — meeting HSF1, the protein your cells use as a thermometer.
>
> Chapter 1 ships with the real 5D5U structure (HSF1 bound to its DNA
> motif), PubMed citations live, Human Protein Atlas tissue
> expression across 49 tissues. Also: a 5D5W vs 5D5U taxon mistake
> the verification step caught.
>
> https://craigmerry.com/blog/2026-05-26-meeting-hsf1/

---

### 6 — Beat 3 link (visual centerpiece)

> Beat 3 — visualizing what heat does to a protein, without running
> molecular dynamics.
>
> Chapter 4 is the centerpiece: a real human enzyme (aldolase A,
> PDB 6XMH) "denatures" as the reader scrolls. Atoms don't move,
> 3Dmol styles change. The disclaimer is loud on purpose.
>
> https://craigmerry.com/blog/2026-05-25-visualizing-denaturation/

---

### 7 — Beat 4 + 5 links (retro)

> Beat 4 — what eight Antigravity sessions taught me about scientific
> UI. The full ship retrospective: file count, page weight, what got
> cut, the C/F toggle that landed mid-session.
>
> https://craigmerry.com/blog/2026-05-25-heat-protein-lab-shipped/
>
> Beat 5 (the cross-product retro) →

---

### 8 — Beat 5 + close

> Beat 5 — three Google products, one project. The post-mortem on
> Antigravity 2.0 + Science Skills + Stitch composed against a real
> scientific brief. What worked, what didn't, three upstream
> science-skills issues filed, the agy --print CLI stall rule.
>
> https://craigmerry.com/blog/2026-05-25-three-google-products-retro/
>
> Thanks for reading.

---

## Single-tweet alternative (if the thread feels too long)

> I built an 8-chapter scrollytelling explainer of what heat does to
> human proteins — real PDB structures, real citations, real tissue
> data — in Antigravity 2.0 against Google DeepMind's Science Skills.
>
> Live + open-source. Five posts on the build.
>
> https://heat-protein-lab.pages.dev/

---

## Tags worth attaching when posting

For X discoverability, on tweets 1, 3, and 8 only (don't spam every
tweet):

- `#Antigravity` (where the IDE is the protagonist of the tweet)
- `#GoogleIO` (on tweet 1, as the hackathon callback)
- `#scrollytelling` (on tweet 2, where the format is named)
- `#HeatShockResponse` (on tweet 5, technical accuracy)

Avoid `#bio`, `#protein`, `#science` — too broad, attracts low-
quality reply traffic.

---

## Other places to post

- **LinkedIn long-form**: post the Beat 4 body verbatim with one new
  paragraph at the top explaining the project arc to a non-technical
  reader. Beat 4 reads well as long-form business content.
- **Hacker News Show HN**: submit the live URL with a title like
  "Show HN: Heat Protein Lab — what heat does to human proteins,
  citation-grounded, no medical claims." Submit Tuesday morning PT
  for best fit if posting today doesn't land.
- **dev.to**: cross-post Beat 5 specifically (most developer-relevant)
  with canonical URL pointing to craigmerry.com.
- **Mastodon scientific instances**: short summary + link, one post,
  no thread.

---

## What NOT to post

- No medical-claims framing in any tweet.
- No "this could save lives" or "this could help during heat waves"
  framing. The page is explanatory, not protective.
- No screenshots of the denaturation chapter without the disclaimer
  badge visible — the badge is part of the image's honesty.
