---
target_repo: google-deepmind/science-skills
skill: alphafold_database_fetch_and_analyze
title: "alphafold_database: fetch_structure.py returns HTTP 403 from AlphaFold endpoint without SCIENCE_SKILLS_USER_AGENT env var"
labels: bug
status: drafted (gh token expired mid-session; operator to file after `gh auth refresh`)
drafted: 2026-05-25
---

## Summary

The `alphafold_database_fetch_and_analyze` skill's `fetch_structure.py`
script returns HTTP 403 from the AlphaFold Database endpoint on a clean
install when no `SCIENCE_SKILLS_USER_AGENT` env var is set. The script
doesn't appear to attach a default User-Agent header, and AlphaFold's
endpoint refuses requests without one.

A first-time operator wiring the science plugin up runs into this
immediately on the first AlphaFold call. The workaround is well-known
to long-time users but is not documented anywhere obvious in the
skill's SKILL.md.

## Reproduction

Fresh install of `science` plugin v1.0.0 (`installed_version.json`).
With no `SCIENCE_SKILLS_USER_AGENT` in the environment:

```bash
uv run ~/.gemini/config/plugins/science/skills/alphafold_database_fetch_and_analyze/scripts/fetch_structure.py P0DMV8 -o /tmp/af-hspa1a/
```

Returns HTTP 403 from AlphaFold endpoint.

With the env var set, the same command succeeds:

```bash
export SCIENCE_SKILLS_USER_AGENT="heat-protein-lab/0.1 (craigm26@gmail.com)"
uv run ~/.gemini/config/plugins/science/skills/alphafold_database_fetch_and_analyze/scripts/fetch_structure.py P0DMV8 -o /tmp/af-hspa1a/
# -> success: AF-P0DMV8-F1-model_v6.cif, metadata.json, PAE.json
```

## Suggested fix

Either of:

1. Set a sensible default `User-Agent` header in `fetch_structure.py` (e.g., `science-skills/1.0.0 (google-deepmind)`), overrideable by `SCIENCE_SKILLS_USER_AGENT`.
2. Add the `SCIENCE_SKILLS_USER_AGENT` requirement to the `## Prerequisites` section of the skill's `SKILL.md` so first-time operators know to set it before the first call.

Option (1) is the better fix because it lets the skill "just work" on
first invocation.

## Context

Caught while wiring science-skills into a Raspberry Pi 5 (aarch64)
running Antigravity 2.0 (`agy 1.0.2`) on 2026-05-25. Project at
https://github.com/HeatThreshold/heat-protein-lab uses the science
plugin as its primary data layer; this was one of three skill-level
issues caught during Phase 0 smoke testing.

Environment:

- `science` plugin v1.0.0 (clean install)
- Python via `uv 0.11.16` (aarch64-unknown-linux-gnu)
- Raspberry Pi OS, kernel 6.18

Sibling issues being filed:
- `human_protein_atlas_database`: `hpa_cli.py get-tissue-expression` `ValueError`
- `reactome_database`: `reactome_analysis.py diagram --format svg` Accept header
