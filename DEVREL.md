# DEVREL.md — heat-protein-lab as a developer-relations case study

> Tracking framework for treating this project as a Google developer-relations posting. The thing being demonstrated is the composition of three new Google products — **Antigravity 2.0** (agentic IDE), the **Science Skills** plugin (Google DeepMind's bundle of 17 scientific-database skills), and **Stitch** (Google's AI design tool, present in Antigravity as an MCP) — in service of a real, public, polished artifact. This file is the comms spine. It is meta. It is allowed to be meta because the meta layer is the point.

If this is your first time reading: skim [README.md](./README.md) for the project pitch, [PROJECT.md](./PROJECT.md) for the build plan, [DESIGN.md](./DESIGN.md) for the visual system, and then come back here for how everything is being narrated as it ships.

## Why this is worth a DevRel posting

The three Google products in play each launched into a sparse public-example landscape. Antigravity 2.0 is a brand-new agentic IDE replacing the Gemini CLI on 2026-06-18. The Science Skills bundle is a freshly-published DeepMind drop with a small showcase. Stitch is the youngest of the three. The intersection — **using Antigravity to drive Stitch + Science Skills against a real, hard-to-fake scientific brief** — has, as of project start, essentially no public demonstration. That gap is the post.

The secondary value is the *primary product*, the educational scrollytelling page itself, which is genuinely useful as an explanation of heat illness at the molecular level. The post-shaped artifact and the page-shaped artifact reinforce each other.

## The audiences this is written for

- **Antigravity 2.0 early adopters** — the small but motivated community that picked up the new IDE preview. Want to see what a real, non-toy session looks like.
- **Google DeepMind followers** — Science Skills is DeepMind's first agent-tooling drop; readers want to see it used past the README quickstart.
- **Scientific-computing developers** — the long tail of folks who pull PDB files for one-off projects. The post is permission for them to combine PDB with modern web tooling.
- **Indie / hackathon-adjacent builders** — readers who knew HeatThreshold from Google I/O 2026 and are following what comes after. The story arc — *"this idea got cut for hackathon risk reasons; here's what shipping it properly looks like"* — is the hook for this audience.
- **Educators in biology / biochemistry / health sciences** — secondary audience but high value; the page itself is a teaching artifact.

## Headline candidates

Short list, ranked by current preference. The eventual headline depends on the day and the venue. Track which ones survive readthroughs.

1. **"Heat, proteins, and three new Google products: building a real explainer in Antigravity 2.0"**
2. **"What an agentic IDE looks like with the Protein Data Bank wired in"**
3. **"From hackathon cutting-room floor to public lab: composing Antigravity, Science Skills, and Stitch"**
4. **"Stitch + Antigravity + 3Dmol.js: designing scientific UI in 2026"**
5. **"A scrollytelling page about how heat melts you, built three Google products at a time"**

Lower-ranked but worth keeping for sub-posts:

6. "Visualizing protein denaturation: a Phase 4 deep dive"
7. "Seventeen Science Skills, one weekend project"
8. "Using Stitch as a stateful design system: what the prompt blocks looked like"

## Story arc and posting cadence

The build plan in [PROJECT.md](./PROJECT.md) is nine phases. Most phases are not individually post-worthy. The publishable beats are:

| Beat | Trigger (PROJECT phase) | Working title | Estimated length | Venue tier |
|------|-------------------------|---------------|------------------|------------|
| **Beat 1: The framework** | Phase 0 complete (uv installed, all six smoke tests pass, candidates.json committed) | "Wiring 17 scientific skills into a fresh Antigravity workspace" | 1,200 – 1,500 words | Personal blog + dev.to + X thread |
| **Beat 2: First chapter on the page** | Phase 1 complete (HSF1 chapter visually live) | "Meeting HSF1 in Antigravity 2.0: the first chapter shipped" | 1,500 – 2,000 words | Personal blog + dev.to + X thread + LinkedIn |
| **Beat 3: The visual centerpiece** | Phase 4 complete (denaturation chapter shipped) | "Visualizing what heat does to a protein, without running molecular dynamics" | 2,000 – 2,500 words | Personal blog + dev.to + Hacker News (Show HN candidate) + X thread |
| **Beat 4: The full ship** | Phase 9 complete (page polished and public) | "Heat Protein Lab is live: what eight Antigravity sessions taught me about scientific UI" | 2,500 – 3,500 words | Personal blog + dev.to + Hacker News (Show HN) + LinkedIn + X thread + Mastodon scientific instances |
| **Beat 5 (optional): The retro** | One week after Beat 4 ships | "Three Google products, one project: what worked, what didn't, what I'd change" | 1,800 – 2,200 words | Personal blog + cross-post if uptake on Beat 4 was high |

Beats can slip but should not get reordered.

## Per-session capture (the raw material the posts pull from)

Every Antigravity session that touches this repo should produce a session log in `notes/devrel/`. Use the template at `notes/devrel/SESSION-TEMPLATE.md`. The fields are deliberately small so the friction is low; they exist so that when a post is drafted four weeks later, the specifics are not lost.

Per session, capture:

- **Date and rough duration.** "About 90 minutes."
- **Phase / chapter worked on.**
- **What was attempted, in one sentence.**
- **What Stitch prompts were used** (literal text or a link to the DESIGN.md block) — and **how many iterations** before the mockup was usable. This is the single most under-documented thing about AI design tools in the wild.
- **Which Science Skill calls were made.** Skill name, query intent (not the raw JSON), and whether the call returned what was needed first try.
- **Which Modern Web Guidance queries fired**, if any.
- **One screenshot of the IDE mid-session.** Saved as `notes/devrel/YYYY-MM-DD-NN.png`.
- **One screenshot of the page result.** Saved as `notes/devrel/YYYY-MM-DD-NN-result.png`.
- **One paragraph: what was surprising.** This is the seed of every interesting paragraph in the eventual post.
- **One paragraph: what was frustrating, if anything.** Rough edges in any of the three products. Be specific. Reading "the agent got confused" tells nobody anything; reading "Stitch's first pass put the temperature strip at the bottom of the viewport despite the prompt specifying top, and a second prompt fixed it" is gold.
- **Time-to-first-useful-output.** "Eleven minutes from `agy open` to a usable mockup" is the kind of number readers remember.

## Reproducibility checklist

Posts that DevRel-style readers actually try are posts that someone reproduced and confirmed. Maintain this checklist; update it as the project lands.

- [ ] Reader has `agy` 1.0.0+ installed (Antigravity CLI; see [antigravity-cli-state-layout] memory if needed). The desktop IDE is the better UX; the CLI works for the data-fetching pieces.
- [ ] Reader has the **Science Skills** plugin installed (`~/.gemini/config/plugins/science/`).
- [ ] Reader has the **Stitch MCP** registered in Antigravity (operator-installed; not yet a community-documented step at project start — document it when the procedure becomes public).
- [ ] Reader has `uv` ≥ 0.11 on PATH.
- [ ] Reader has `jq` on PATH.
- [ ] Reader has a `~/.env` and optionally an `NCBI_API_KEY` in it for raising PubMed/ClinVar/dbSNP rate limits.
- [ ] Reader has cloned `HeatThreshold/heat-protein-lab` and opened it in Antigravity.
- [ ] Reader can run `notes/devrel/REPRO-SMOKE.md` (when it exists) — a top-to-bottom verification that all three products are wired up.

## Open metrics worth tracking

Numbers that, if captured, make the eventual post tangibly better. None of these are vanity; all are diagnostic of the build experience.

- **Time per chapter.** Planning → first commit → visually shipped.
- **Stitch iterations per chapter mockup.** Number of prompt revisions before the mockup was usable. Tracked in the session logs.
- **Science Skill calls per chapter.** Tracked in the session logs.
- **First-try-success rate of Science Skill calls.** Did the call return what was needed on attempt 1, or did the query need refinement?
- **`modern-web-guidance` queries per chapter.** How many of them produced usable advice.
- **Page weight, LCP, INP per chapter.** Measured via the chrome-devtools plugin at chapter completion.
- **Number of citations in `references.md` by end of project.** Pure scientific-rigor metric.
- **Repo stars, forks, clones, issues opened.** Tracked weekly post-Beat-4.

## Publication targets

By tier, with notes on each.

### Tier 1 (controlled, ship-ready any time)

- **Personal blog at craigmerry.com.** The canonical post lives here. Other venues link back. Operator already publishes there ([[personalsite-2026-three-post-series-shipped-2026-05-19]] reference).
- **GitHub README hero block** on this repo, updated as beats ship.

### Tier 2 (community, low friction)

- **dev.to** — copy of the post, canonical URL set to craigmerry.com.
- **Hashnode** — same.
- **Mastodon scientific instances** — short summaries with links, hosted from operator's Mastodon.
- **X / Twitter thread** — five to seven tweets per beat, link to canonical at the end.
- **LinkedIn long-form** — beat 2 and beat 4 only.

### Tier 3 (moderation gates, higher payoff)

- **Hacker News "Show HN"** — only beat 3 (denaturation centerpiece) and beat 4 (full ship) are HN-worthy. Submit at a time of day that fits the audience; don't burn the second submission if the first lands well.
- **lobste.rs** — beat 4 only, if/when invited.

### Tier 4 (aspirational; do not pitch but track if reached out to)

- **Google Developers blog** — would require an invitation; do not pitch. Note if Google contacts.
- **DeepMind blog** — same.
- **A11y / accessible-science venues** — Beat 4 is a natural fit if the a11y story is strong by then.

## Voice and constraints

- **First-person, present tense, dry.** Operator's voice across personalsite-2026 posts. Sentences earn their length.
- **No hype.** This is a small page about heat and proteins. Calling it "revolutionary" or "groundbreaking" instantly cheapens it.
- **Specifics, not abstractions.** "Stitch generated the chapter 4 banner in red; I needed it in red on cream not cream on red; one prompt revision fixed it" beats "the design tool worked great."
- **Show the seams.** Times when a tool failed or surprised are the most useful paragraphs for readers. Don't sand them out.
- **No medical claims, even casually.** Especially in promotional copy where shortcuts feel tempting.
- **Cite back to primary sources, not Wikipedia.** Same rule the UI follows.

## Press-kit checklist (when it's needed)

To be populated under `press/` during Phase 9 polish. Not before — premature press kits age badly.

- One-sentence project summary.
- One-paragraph summary.
- 250-word summary.
- Three hero screenshots at 16:9, 1:1, 9:16.
- One short looping GIF (denaturation chapter is the natural candidate).
- License and attribution boilerplate for the upstream data sources.
- Bios for the operator and any contributors.
- Contact line.

## Editorial cadence

- **Per session**: write the session log (in `notes/devrel/`) within 24 hours of the session ending.
- **Per beat**: draft the post within one week of the triggering phase completing. Sit on the draft for at least 48 hours before publishing.
- **Per quarter**: roll up open-metrics numbers into a tiny `notes/devrel/metrics-YYYY-QN.md` snapshot. These age into "what I shipped this year" material naturally.

## Cross-references

- [README.md](./README.md) — public pitch.
- [PROJECT.md](./PROJECT.md) — phased build plan; beats are tied to phases.
- [DESIGN.md](./DESIGN.md) — visual system + Stitch prompt blocks.
- [AGENTS.md](./AGENTS.md) — Antigravity context file.
- [references.md](./references.md) — every citation that appears in the UI.
- `notes/devrel/SESSION-TEMPLATE.md` — the per-session log template.
- `notes/devrel/` — the populated session logs.
- `.github/ISSUE_TEMPLATE/` — issue templates so follow-along readers can file useful issues.

## What this document is *not*

- Not a marketing plan with conversion funnels. There is no funnel.
- Not a promise to publish. Beats can be skipped if the underlying work isn't post-worthy.
- Not a Google-authored or Google-endorsed posting. This is an independent project that happens to use Google products and write about that experience. All three products are credited; none are claimed.
- Not a recruiting page. The repo has a contributor model but no growth target.
