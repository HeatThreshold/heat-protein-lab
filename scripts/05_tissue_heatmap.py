"""
Chapter 5 (Where the defenders live) data fetcher.

Fetches HPA tissue protein expression (IHC consensus) for three heat-shock
genes — HSPA1A, HSPA8, HSP90AA1 — across human tissues. The chapter
renders these as a 3-column heatmap with tissues on rows.

Outputs:
    data/expression/hspa1a.json
    data/expression/hspa8.json
    data/expression/hsp90aa1.json

Run from the repo root:

    uv run --no-project python scripts/05_tissue_heatmap.py
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SKILLS = Path.home() / ".gemini/config/plugins/science/skills"
HPA_SCRIPTS = SKILLS / "human_protein_atlas_database/scripts"

DATA = REPO / "data"
EXPRESSION = DATA / "expression"

GENES = ["HSPA1A", "HSPA8", "HSP90AA1"]


def run(cmd, cwd=None):
    print(f"  $ {' '.join(cmd)}")
    proc = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, env={**os.environ})
    if proc.returncode != 0:
        print(f"    !! exit {proc.returncode}", file=sys.stderr)
        print(proc.stderr[-2000:], file=sys.stderr)
        raise SystemExit(proc.returncode)
    return proc


def fetch_gene(gene: str) -> None:
    out = EXPRESSION / f"{gene.lower()}.json"
    if out.exists():
        print(f"HPA {gene}: already cached at {out}")
        return
    EXPRESSION.mkdir(parents=True, exist_ok=True)
    print(f"HPA {gene}: resolve Ensembl, then tissue expression")
    id_out = EXPRESSION / f".{gene.lower()}.ensembl.json"
    run([
        "uv", "run",
        str(HPA_SCRIPTS / "hpa_cli.py"),
        "resolve-ensembl-id", gene,
        "--output", str(id_out),
    ], cwd=HPA_SCRIPTS.parent)
    raw = id_out.read_text()
    parsed = json.loads(raw)
    ensembl_id = (
        (isinstance(parsed, dict) and (
            parsed.get("ensembl_id")
            or parsed.get("data", {}).get("ensembl_id")
            or (parsed.get("results") or [{}])[0].get("ensembl_id")
        )) or None
    )
    if not ensembl_id:
        raise SystemExit(f"could not extract Ensembl ID for {gene}: {raw[:400]}")
    run([
        "uv", "run",
        str(HPA_SCRIPTS / "hpa_cli.py"),
        "get-tissue-expression", ensembl_id,
        "--output", str(out),
    ], cwd=HPA_SCRIPTS.parent)
    id_out.unlink(missing_ok=True)
    print(f"  -> {out} ({ensembl_id})")


def main() -> None:
    print("== Chapter 5 (HSP tissue heatmap) data fetch ==")
    for gene in GENES:
        fetch_gene(gene)
    print("== Done ==")


if __name__ == "__main__":
    main()
