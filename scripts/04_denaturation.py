"""
Chapter 4 (When proteins melt) data fetcher.

Hero: aldolase A, the human glycolytic enzyme that liberates dihydroxy-
acetone phosphate from fructose-1,6-bisphosphate. Literature melting
temperatures for fructose-bisphosphate aldolases land roughly in the
45–55 °C range; Chapter 4 uses Tm ≈ 48 °C as a representative anchor.

Outputs:
    data/structures/pdb/aldolase/pdb_00006xmh.cif.gz   (already cached)
    data/citations/aldolase.json                       (PubMed slim)

Run from the repo root:

    uv run --no-project python scripts/04_denaturation.py
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

DATA = REPO / "data"
STRUCT_PDB = DATA / "structures/pdb/aldolase"
CITATIONS = DATA / "citations"

PDB_ID = "6XMH"  # Human aldolase A wild type, X-ray 1.95 Å
# Mixed selection: two ALDOA-in-human-biology + one aldolase thermal stability.
PMIDS = ["34821530", "39262779", "28299451"]


def run(cmd, cwd=None):
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
    out = CITATIONS / "aldolase.json"
    if out.exists():
        print(f"PubMed aldolase: already cached")
        return
    CITATIONS.mkdir(parents=True, exist_ok=True)
    abstracts = CITATIONS / ".aldolase.abstracts.json"
    print(f"PubMed: fetch abstracts for PMIDs {','.join(PMIDS)}")
    run([
        "uv", "run",
        str(PUBMED_SCRIPTS / "pubmed_api.py"),
        str(abstracts),
        "fetch_article_abstracts", ",".join(PMIDS),
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
    out.write_text(json.dumps({"chapter": 4, "topic": "When proteins melt", "citations": slim}, indent=2))
    abstracts.unlink(missing_ok=True)


def main() -> None:
    print("== Chapter 4 (When proteins melt) data fetch ==")
    fetch_pdb_structure()
    fetch_pubmed_citations()
    print("== Done ==")


if __name__ == "__main__":
    main()
