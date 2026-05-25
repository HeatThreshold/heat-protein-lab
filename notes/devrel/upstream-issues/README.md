# Upstream issue drafts — `google-deepmind/science-skills`

Three bugs caught in `science` plugin v1.0.0 during this project's
Phase 0 + Phase 3 work on 2026-05-25. Drafted as markdown so the
operator can file them from their own shell after refreshing `gh`
auth (the session token expired partway through filing).

## Files

| # | File | Skill |
|---|---|---|
| 1 | [`01-alphafold-403-without-user-agent.md`](./01-alphafold-403-without-user-agent.md) | `alphafold_database_fetch_and_analyze` |
| 2 | [`02-hpa-cli-tissue-expression-valueerror.md`](./02-hpa-cli-tissue-expression-valueerror.md) | `human_protein_atlas_database` |
| 3 | [`03-reactome-svg-accept-header.md`](./03-reactome-svg-accept-header.md) | `reactome_database` |

## How to file each issue

From the repo root, after `gh auth refresh -h github.com`:

```bash
cd notes/devrel/upstream-issues

# Strip the frontmatter and extract title from filename's "title:" field.
# Or just open each file, copy the body below the --- block, and run:

gh issue create \
  --repo google-deepmind/science-skills \
  --title "alphafold_database: fetch_structure.py returns HTTP 403 from AlphaFold endpoint without SCIENCE_SKILLS_USER_AGENT env var" \
  --body-file <(awk 'BEGIN{p=0} /^---$/{c++; if(c==2){p=1; next}} p' 01-alphafold-403-without-user-agent.md)

gh issue create \
  --repo google-deepmind/science-skills \
  --title "human_protein_atlas_database: hpa_cli.py get-tissue-expression raises ValueError; needs separate HttpClient for XML endpoint" \
  --body-file <(awk 'BEGIN{p=0} /^---$/{c++; if(c==2){p=1; next}} p' 02-hpa-cli-tissue-expression-valueerror.md)

gh issue create \
  --repo google-deepmind/science-skills \
  --title "reactome_database: reactome_analysis.py diagram --format svg fails on Accept header negotiation" \
  --body-file <(awk 'BEGIN{p=0} /^---$/{c++; if(c==2){p=1; next}} p' 03-reactome-svg-accept-header.md)
```

The `awk` snippet strips the YAML frontmatter (everything between the
first two `---` lines) before piping the body to `gh issue create`.

After filing, paste the three issue URLs into a comment on
[heat-protein-lab Issue #1 (Beat 1 tracking)](https://github.com/HeatThreshold/heat-protein-lab/issues/1)
and into `data/candidates.json` (the `skill_bug_caught_during_export`
field has a placeholder for the Reactome URL).
