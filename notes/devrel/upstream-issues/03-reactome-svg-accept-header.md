---
target_repo: google-deepmind/science-skills
skill: reactome_database
title: "reactome_database: reactome_analysis.py diagram --format svg fails on Accept header negotiation"
labels: bug
status: drafted (gh token expired mid-session; operator to file after `gh auth refresh`)
drafted: 2026-05-25
---

## Summary

The `reactome_database` skill's `reactome_analysis.py diagram`
subcommand fails to fetch an SVG diagram on a clean install. The
`Accept` header negotiation for the SVG content type appears not to
match what Reactome's `ContentService/exporter/diagram/{id}.svg`
endpoint actually returns.

## Reproduction

Fresh install of `science` plugin v1.0.0. With a verified
Reactome pathway stable ID:

```bash
uv run ~/.gemini/config/plugins/science/skills/reactome_database/scripts/reactome_analysis.py \
  diagram --id R-HSA-3371556 --highlight HSPA1A --format svg \
  --output /tmp/hsr-pathway-hspa1a.svg
# -> fails; SVG body not returned
```

PNG export of the same diagram via `--format png` works.

## Suggested fix

The `Accept` header for the SVG endpoint must be `image/svg+xml`. The
current logic around lines 932-938 of `reactome_analysis.py` covers
this branch:

```python
if ext == "svg":
  accept = "image/svg+xml"
else:
  accept = f"image/{ext}"
headers = {
    "Content-Type": content_type,
    "Accept": accept,
}
```

…but the request was either not honoring it on the first call, or the
`Content-Type` was being negotiated in a way Reactome rejected. After
patching, the SVG export returns the full vector diagram (655 KB for
R-HSA-3371556 "Cellular response to heat stress" with HSPA1A
highlighted in red).

I am happy to send a PR with the exact diff if a maintainer points me
at the contribution flow.

## Context

Caught while exporting the heat-shock pathway diagram for Chapter 7
of https://github.com/HeatThreshold/heat-protein-lab. The exported SVG
is now in tree at `data/diagrams/hsr-pathway-hspa1a.svg` and renders
correctly when inlined.

Environment:

- `science` plugin v1.0.0 (clean install)
- Python via `uv 0.11.16` (aarch64-unknown-linux-gnu)
- Raspberry Pi OS, kernel 6.18

Sibling issues being filed:
- `alphafold_database_fetch_and_analyze`: HTTP 403 without `SCIENCE_SKILLS_USER_AGENT`
- `human_protein_atlas_database`: `hpa_cli.py get-tissue-expression` `ValueError`
