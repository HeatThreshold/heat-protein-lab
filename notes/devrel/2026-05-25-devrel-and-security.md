# Session — 2026-05-25 — DevRel framework + Antigravity scratch security

> Companion to [2026-05-25-stitch-ui.md](./2026-05-25-stitch-ui.md). That log covers what Antigravity did (Stitch mockup generation for all 9 chapters). This log covers what was happening in a Claude Code session in parallel: setting up the developer-relations tracking framework, and catching the Antigravity-generated scratch scripts before they leaked an API key to GitHub.

## Meta

- **Date:** 2026-05-25
- **Duration:** ~75 minutes (overlapping with the Stitch UI generation)
- **Phase / chapter:** Project-level (not chapter-specific). Sets up DEVREL.md and quarantines auto-generated scratch.
- **Where it left off:** Framework committed at `afaf127` and pushed. 8.5 of 9 Stitch mockups generated. Stitch API key rotation pending operator action.

## What was attempted

Wire the project as a Google developer-relations case study (DEVREL.md + tracking issues + repo topics + session-log template), in a Claude Code session running parallel to the operator's Antigravity session.

## Stitch prompts used

None directly from this session — Stitch was driven from the Antigravity side. The Stitch prompts themselves live in [DESIGN.md § Chapter N](../../DESIGN.md), written here on the prior turn and read by Antigravity via its `upload_design_md` MCP tool.

## Science Skill calls

| Skill | Intent | First-try success? | Output |
|-------|--------|--------------------|--------|
| None | This session did framework / comms work, not data fetching | N/A | N/A |

Smoke tests for the seven Science Skills the project will use are still pending; they are the Phase 0 exit criterion and the trigger for Beat 1.

## Modern Web Guidance queries

None. The session did not write any HTML/CSS/JS — only markdown docs and YAML/JSON config.

## Time-to-first-useful-output

- DEVREL.md first draft: about 10 minutes from start to a committable file.
- Full framework (DEVREL.md + 4 issue templates + session-log template + 17 repo topics + 5 tracking issues + memory entries): about 75 minutes wall-clock, including the security cleanup.

## Surprises

- **Antigravity used the template within minutes.** I had just written `notes/devrel/SESSION-TEMPLATE.md` when Antigravity, working in parallel, copied it to `notes/devrel/2026-05-25-stitch-ui.md` and filled in the fields. The framework is self-bootstrapping in a way that genuinely surprised me — the doc was *meant* to be filled in by humans-via-IDE, but the IDE picked it up directly.
- **Threading-based parallel Stitch generation.** Antigravity figured out that `npx mcp-remote` can be subprocessed concurrently and ran 9 parallel Stitch generations, cutting wall time from a forecast ~15 minutes to under 2. Worth lifting into a Beat 3 paragraph about "what an agentic IDE figures out that you wouldn't have prompted for."

## Frustrations / sharp edges

- **Antigravity bakes API keys inline into generated Python scratch.** Twice in this session, Antigravity wrote `scripts/mcp_client.py` and `scripts/generate_ui.py` with the Stitch API key (`AQ.…`) embedded as a literal string in the `X-Goog-Api-Key` header argument — no env var, no secrets-manager lookup, just `"X-Goog-Api-Key: AQ.Ab8…rjqA"`. The second file was created **while** I was committing the framework; `git add -A` swept it into commit `f25bd18` before I could catch it. Caught it post-commit via `head -40` of the file, soft-reset via `git reset --soft HEAD~1` (commit was local-only, not yet pushed), expanded `.gitignore` to catch the pattern (`scripts/{mcp_client,generate_*,*_client}.py`), and re-committed cleanly as `afaf127`. The key traveled through Claude Code's chat twice via the two file contents; **operator rotated the key on 2026-05-25 later in this same session**, closing the exposure. Memory entry [[antigravity-bakes-api-keys-in-scratch]] captures this as a recurring-pattern playbook for future Antigravity workspaces.
- **GitHub labels don't exist on new repos by default.** The first batch of `gh issue create --label "devrel,beat-N"` calls all failed silently with `could not add label: 'devrel' not found`. The CLI exits 0 on label failure and still creates the issue (which it didn't — the body was passed but with no labels attached, the issues weren't actually created in this case; I had to retry). Building the label set up front via `gh label create` and re-running fixed it. Mild but worth noting if the post discusses the GitHub-tracking setup.
- **Chapter 4 mockup is PNG-only.** Antigravity's session log says "Iterations to usable mockup: 1" for all chapters, but Chapter 4 produced only `mockup.png`, no `mockup.html`. The Stitch generation succeeded enough to produce a screenshot but didn't return HTML — possibly the asset polling timed out before the HTML downloadUrl populated, or the screen-generation step itself partly failed. This is the visual centerpiece chapter and the post that goes with it (Beat 3) would want a working HTML mockup. Flag for next session to re-run.

## Screenshots

- N/A from Claude Code's side. Antigravity's session captured the 8 Stitch PNGs in `notes/design/ch-{0,1,2,3,5,6,7,8}/mockup.png`.

## Beat it feeds

- **Beat 1** (the framework post): the security incident with the embedded API key is *exactly* the kind of "show the seams" material DEVREL.md calls for. A short paragraph in the Beat 1 post about how an agentic IDE quietly bakes credentials into auto-generated scratch is more valuable to readers than any number of paragraphs about how slick the rest worked.
- **Beat 4 / Beat 5** (the ship post / retro): the threading-based parallel Stitch generation is the kind of unprompted-emergent-behavior anecdote that lands well in a retrospective.

## Next session

1. ~~**Rotate the Stitch API key.**~~ Done 2026-05-25 by operator. The compromised `AQ.Ab8…rjqA` is dead; any future Antigravity-generated scratch should still be gitignored on suspicion until the underlying inline-credential behavior changes upstream.
2. **Re-run Chapter 4 Stitch generation** to produce the missing HTML mockup.
3. **Begin Phase 0 smoke tests** for the seven Science Skills the project will use (PDB, AlphaFold, HPA, PubMed, ClinVar, dbSNP, Reactome). This is the exit criterion for Phase 0 and the trigger for the Beat 1 post. Attempt these via the `agy` CLI rather than the desktop IDE.
