"""
Chapter 1 (Meet HSF1) data fetcher.

Project script — not a vendored copy of any upstream skill script. This file
calls the Google DeepMind Science Skills CLIs by path and aggregates their
outputs into the project's `data/` tree. Idempotent: rerun to refresh.

Phase 0 verified the underlying skills work (see `data/candidates.json`).
This script narrows them to the HSF1 chapter's specific inputs:

    PDB     5D5U     human Hsf1 with HSE DNA, X-ray 2.91 Å
    UniProt Q00613   canonical HSF1 -> AlphaFold model
    Gene    HSF1     -> HPA Ensembl ID -> tissue expression

Outputs land in:

    data/structures/pdb/hsf1/pdb_00005d5u.cif.gz   (already present)
    data/structures/alphafold/hsf1/AF-Q00613-*     (already present)
    data/citations/hsf1.json                       (PubMed top abstracts)
    data/expression/hsf1.json                      (HPA tissue expression)

Run from the repo root:

    SCIENCE_SKILLS_USER_AGENT="heat-protein-lab/0.1 (craigm26@gmail.com)" \\
        uv run --no-project python scripts/01_hsf1.py

The SCIENCE_SKILLS_USER_AGENT env var is required to avoid 403s on AlphaFold
(see Phase 0 session log, 2026-05-25-agy-phase0.md).
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SKILLS = Path.home() / ".gemini/config/plugins/science/skills"

PDB_SCRIPTS = SKILLS / "pdb_database/scripts"
AF_SCRIPTS = SKILLS / "alphafold_database_fetch_and_analyze/scripts"
HPA_SCRIPTS = SKILLS / "human_protein_atlas_database/scripts"
PUBMED_SCRIPTS = SKILLS / "pubmed_database/scripts"

DATA = REPO / "data"
STRUCT_PDB = DATA / "structures/pdb/hsf1"
STRUCT_AF = DATA / "structures/alphafold/hsf1"
CITATIONS = DATA / "citations"
EXPRESSION = DATA / "expression"

PDB_ID = "5D5U"           # Crystal structure of human Hsf1 with HSE DNA, 2.91 Å
UNIPROT = "Q00613"        # Canonical HSF1
GENE_SYMBOL = "HSF1"


def run(cmd: list[str], *, cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    """Run a skill CLI command, surfacing stderr on failure."""
    print(f"  $ {' '.join(cmd)}")
    proc = subprocess.run(
        cmd,
        cwd=cwd,
        capture_output=True,
        text=True,
        env={**os.environ, "SCIENCE_SKILLS_USER_AGENT": os.environ.get(
            "SCIENCE_SKILLS_USER_AGENT",
            "heat-protein-lab/0.1 (craigm26@gmail.com)",
        )},
    )
    if proc.returncode != 0:
        print(f"    !! exit {proc.returncode}", file=sys.stderr)
        print(proc.stderr[-2000:], file=sys.stderr)
        raise SystemExit(proc.returncode)
    return proc


def ensure_dirs() -> None:
    for d in (STRUCT_PDB, STRUCT_AF, CITATIONS, EXPRESSION):
        d.mkdir(parents=True, exist_ok=True)


def fetch_pdb_structure() -> None:
    if (STRUCT_PDB / f"pdb_0000{PDB_ID.lower()}.cif.gz").exists():
        print(f"PDB {PDB_ID}: already cached")
        return
    print(f"PDB {PDB_ID}: downloading mmCIF")
    run([
        "uv", "run",
        str(PDB_SCRIPTS / "download_coordinate_files.py"),
        "--ids", PDB_ID,
        "--format", "mmcif",
        "--output_dir", str(STRUCT_PDB),
    ], cwd=PDB_SCRIPTS.parent)


def fetch_alphafold() -> None:
    target = STRUCT_AF / f"AF-{UNIPROT}-F1-model_v6.cif"
    if target.exists():
        print(f"AlphaFold {UNIPROT}: already cached")
        return
    print(f"AlphaFold {UNIPROT}: downloading mmCIF + PAE + metadata")
    run([
        "uv", "run",
        str(AF_SCRIPTS / "fetch_structure.py"),
        UNIPROT,
        "-o", str(STRUCT_AF),
    ], cwd=AF_SCRIPTS.parent)


def fetch_pubmed_citations() -> None:
    out = CITATIONS / "hsf1.json"
    if out.exists():
        print(f"PubMed HSF1: already cached at {out}")
        return
    print("PubMed HSF1: search top 5, fetch abstracts, slim")
    search = CITATIONS / ".hsf1.search.json"
    abstracts = CITATIONS / ".hsf1.abstracts.json"
    run([
        "uv", "run",
        str(PUBMED_SCRIPTS / "pubmed_api.py"),
        str(search),
        "search_pubmed",
        "heat shock factor 1 HSF1 trimerization activation",
        "--max_results", "5",
    ], cwd=PUBMED_SCRIPTS.parent)
    pmids = json.loads(search.read_text())
    if not pmids:
        raise SystemExit("no PMIDs returned for HSF1")
    run([
        "uv", "run",
        str(PUBMED_SCRIPTS / "pubmed_api.py"),
        str(abstracts),
        "fetch_article_abstracts",
        ",".join(pmids[:3]),
    ], cwd=PUBMED_SCRIPTS.parent)
    slim = [
        {
            "pmid": a.get("pmid"),
            "title": a.get("title"),
            "authors_short": (a.get("authors") or [])[:3],
            "year": a.get("year"),
            "journal": a.get("journal"),
            "snippet": (a.get("abstract") or "")[:280],
        }
        for a in json.loads(abstracts.read_text())
    ]
    out.write_text(json.dumps({"chapter": 1, "gene": GENE_SYMBOL, "citations": slim}, indent=2))
    search.unlink(missing_ok=True)
    abstracts.unlink(missing_ok=True)


def fetch_hpa_expression() -> None:
    out = EXPRESSION / "hsf1.json"
    if out.exists():
        print(f"HPA HSF1: already cached at {out}")
        return
    print("HPA HSF1: resolve Ensembl, then tissue expression")
    id_out = EXPRESSION / ".hsf1.ensembl.json"
    expr_out = EXPRESSION / "hsf1.json"
    run([
        "uv", "run",
        str(HPA_SCRIPTS / "hpa_cli.py"),
        "resolve-ensembl-id", GENE_SYMBOL,
        "--output", str(id_out),
    ], cwd=HPA_SCRIPTS.parent)
    raw = id_out.read_text()
    parsed = json.loads(raw)
    ensembl_id = (
        parsed.get("ensembl_id")
        or parsed.get("data", {}).get("ensembl_id")
        or parsed.get("results", [{}])[0].get("ensembl_id")
        if isinstance(parsed, dict) else None
    )
    if not ensembl_id:
        raise SystemExit(
            f"could not extract Ensembl ID; resolve-ensembl-id returned: {raw[:400]}"
        )
    run([
        "uv", "run",
        str(HPA_SCRIPTS / "hpa_cli.py"),
        "get-tissue-expression", ensembl_id,
        "--output", str(expr_out),
    ], cwd=HPA_SCRIPTS.parent)
    id_out.unlink(missing_ok=True)


def main() -> None:
    print("== Chapter 1 (HSF1) data fetch ==")
    ensure_dirs()
    fetch_pdb_structure()
    fetch_alphafold()
    fetch_pubmed_citations()
    fetch_hpa_expression()
    print("== Done. data/{structures,citations,expression}/ updated ==")


if __name__ == "__main__":
    main()
