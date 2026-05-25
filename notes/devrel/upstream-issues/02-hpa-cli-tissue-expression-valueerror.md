---
target_repo: google-deepmind/science-skills
skill: human_protein_atlas_database
title: "human_protein_atlas_database: hpa_cli.py get-tissue-expression raises ValueError; needs separate HttpClient for XML endpoint"
labels: bug
status: drafted (gh token expired mid-session; operator to file after `gh auth refresh`)
drafted: 2026-05-25
---

## Summary

The `human_protein_atlas_database` skill's `hpa_cli.py` script raises a
`ValueError` when invoked as `get-tissue-expression <ENSEMBL_ID>` on a
clean install. The skill's HTTP client is configured against the JSON
search endpoint and is reused for the XML tissue-expression endpoint,
which expects a different base URL.

## Reproduction

Fresh install of `science` plugin v1.0.0. First call to:

```bash
uv run ~/.gemini/config/plugins/science/skills/human_protein_atlas_database/scripts/hpa_cli.py \
  resolve-ensembl-id HSPA1A --output /tmp/hpa-hspa1a-id.json
# -> succeeds, returns ENSG00000204389

uv run ~/.gemini/config/plugins/science/skills/human_protein_atlas_database/scripts/hpa_cli.py \
  get-tissue-expression ENSG00000204389 --output /tmp/hpa-hspa1a-expression.json
# -> ValueError during HTTP setup / response parse
```

## Suggested fix

The script needs a **separate** `HttpClient` instance for the XML
endpoint, because the XML and JSON endpoints have different base URLs.
The local patch that fixed it on our Pi added (around line 39-40):

```python
CLIENT = http_client.HttpClient(BASE_URL_SEARCH, qps=2.0)
CLIENT_XML = http_client.HttpClient(BASE_URL_XML, qps=2.0)  # new
```

…and wired `_fetch_xml` to use `CLIENT_XML`. After that, both
`resolve-ensembl-id` (JSON) and `get-tissue-expression` (XML) succeed
against `ENSG00000204389`, returning Lung at "High" expression for
HSPA1A and 49 tissues for HSF1 (`ENSG00000185122`).

I am happy to send a PR with the exact diff if a maintainer points me
at the contribution flow.

## Context

Caught while wiring science-skills into a Raspberry Pi 5 (aarch64)
running Antigravity 2.0 on 2026-05-25. Project at
https://github.com/HeatThreshold/heat-protein-lab relies on this skill
for Chapter 1's tissue-expression badge and (in later phases) the full
Chapter 5 tissue heatmap.

Environment:

- `science` plugin v1.0.0 (clean install)
- Python via `uv 0.11.16` (aarch64-unknown-linux-gnu)
- Raspberry Pi OS, kernel 6.18

Sibling issues being filed:
- `alphafold_database_fetch_and_analyze`: HTTP 403 without `SCIENCE_SKILLS_USER_AGENT`
- `reactome_database`: `reactome_analysis.py diagram --format svg` Accept header
