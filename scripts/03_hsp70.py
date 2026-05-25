"""
Chapter 3 (The first line of defense) data fetcher.

Outputs:
    data/structures/pdb/hsp70/pdb_00004po2.cif.gz   (HSP70 substrate-binding domain)
    data/citations/hsp70.json                       (PubMed slim, top 3)
    data/diagrams/hsr-pathway-hspa1a.svg            (Reactome HSR pathway, HSPA1A highlighted)

Run from the repo root:

    uv run --no-project python scripts/03_hsp70.py
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
PUBMED_SCRIPTS = SKILLS / "pubmed_database/scripts"
REACTOME_SCRIPTS = SKILLS / "reactome_database/scripts"

DATA = REPO / "data"
STRUCT_PDB = DATA / "structures/pdb/hsp70"
CITATIONS = DATA / "citations"
DIAGRAMS = DATA / "diagrams"

PDB_ID = "4PO2"
PUBMED_QUERY = "HSPA1A HSP70 ATP cycle"
REACTOME_PATHWAY = "R-HSA-3371556"


def run(cmd: list[str], *, cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    print(f"  $ {' '.join(cmd)}")
    proc = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, env={**os.environ})
    if proc.returncode != 0:
        print(f"    !! exit {proc.returncode}", file=sys.stderr)
        print(proc.stderr[-2000:], file=sys.stderr)
        raise SystemExit(proc.returncode)
    return proc


def fetch_pdb_structure() -> None:
    target = STRUCT_PDB / f"pdb_0000{PDB_ID.lower()}.cif.gz"
    if target.exists():
        print(f"PDB {PDB_ID}: already cached")
        return
    STRUCT_PDB.mkdir(parents=True, exist_ok=True)
    print(f"PDB {PDB_ID}: downloading mmCIF")
    run([
        "uv", "run",
        str(PDB_SCRIPTS / "download_coordinate_files.py"),
        "--ids", PDB_ID,
        "--format", "mmcif",
        "--output_dir", str(STRUCT_PDB),
    ], cwd=PDB_SCRIPTS.parent)


def fetch_pubmed_citations() -> None:
    out = CITATIONS / "hsp70.json"
    if out.exists():
        print(f"PubMed HSP70: already cached")
        return
    CITATIONS.mkdir(parents=True, exist_ok=True)
    print(f"PubMed: search '{PUBMED_QUERY}'")
    search = CITATIONS / ".hsp70.search.json"
    abstracts = CITATIONS / ".hsp70.abstracts.json"
    run([
        "uv", "run",
        str(PUBMED_SCRIPTS / "pubmed_api.py"),
        str(search),
        "search_pubmed", PUBMED_QUERY,
        "--max_results", "5",
    ], cwd=PUBMED_SCRIPTS.parent)
    pmids = json.loads(search.read_text())
    if not pmids:
        raise SystemExit("no PMIDs returned for HSP70")
    run([
        "uv", "run",
        str(PUBMED_SCRIPTS / "pubmed_api.py"),
        str(abstracts),
        "fetch_article_abstracts", ",".join(pmids[:3]),
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
    out.write_text(json.dumps({"chapter": 3, "topic": "HSP70 chaperone", "citations": slim}, indent=2))
    search.unlink(missing_ok=True)
    abstracts.unlink(missing_ok=True)


def export_reactome_diagram() -> None:
    out = DIAGRAMS / "hsr-pathway-hspa1a.svg"
    if out.exists():
        print(f"Reactome HSR diagram: already cached")
        return
    DIAGRAMS.mkdir(parents=True, exist_ok=True)
    print(f"Reactome: export {REACTOME_PATHWAY} with HSPA1A highlighted as SVG")
    run([
        "uv", "run",
        str(REACTOME_SCRIPTS / "reactome_analysis.py"),
        "diagram",
        "--id", REACTOME_PATHWAY,
        "--highlight", "HSPA1A",
        "--format", "svg",
        "--output", str(out),
    ], cwd=REACTOME_SCRIPTS.parent)


def main() -> None:
    print("== Chapter 3 (HSP70 + Reactome pathway) data fetch ==")
    fetch_pdb_structure()
    fetch_pubmed_citations()
    export_reactome_diagram()
    print("== Done ==")


if __name__ == "__main__":
    main()
