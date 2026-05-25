"""
Chapter 2 (When heat arrives) data fetcher.

Covers HSF1 activation kinetics + the human HSP90 closed-state complex
that releases HSF1 when heat arrives.

Outputs:
    data/structures/pdb/hsp90/pdb_00007l7j.cif.gz   (already present)
    data/citations/hsf1_activation.json             (PubMed slim, top 3)

Run from the repo root:

    uv run --no-project python scripts/02_hsf1_activation.py
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
STRUCT_PDB = DATA / "structures/pdb/hsp90"
CITATIONS = DATA / "citations"

PDB_ID = "7L7J"           # Cryo-EM Hsp90:p23 closed-state complex, human, 3.1 Å
PUBMED_QUERY = "HSP90 HSF1 dissociation heat shock activation"


def run(cmd: list[str], *, cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    print(f"  $ {' '.join(cmd)}")
    proc = subprocess.run(
        cmd, cwd=cwd, capture_output=True, text=True,
        env={**os.environ},
    )
    if proc.returncode != 0:
        print(f"    !! exit {proc.returncode}", file=sys.stderr)
        print(proc.stderr[-2000:], file=sys.stderr)
        raise SystemExit(proc.returncode)
    return proc


def fetch_pdb_structure() -> None:
    target = STRUCT_PDB / f"pdb_0000{PDB_ID.lower()}.cif.gz"
    if target.exists():
        print(f"PDB {PDB_ID}: already cached at {target}")
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
    out = CITATIONS / "hsf1_activation.json"
    if out.exists():
        print(f"PubMed HSF1 activation: already cached at {out}")
        return
    CITATIONS.mkdir(parents=True, exist_ok=True)
    print(f"PubMed: search '{PUBMED_QUERY}', fetch top 3 abstracts, slim")
    search = CITATIONS / ".hsf1_activation.search.json"
    abstracts = CITATIONS / ".hsf1_activation.abstracts.json"
    run([
        "uv", "run",
        str(PUBMED_SCRIPTS / "pubmed_api.py"),
        str(search),
        "search_pubmed", PUBMED_QUERY,
        "--max_results", "5",
    ], cwd=PUBMED_SCRIPTS.parent)
    pmids = json.loads(search.read_text())
    if not pmids:
        raise SystemExit("no PMIDs returned for HSF1 activation")
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
    out.write_text(json.dumps({"chapter": 2, "topic": "HSF1 activation", "citations": slim}, indent=2))
    search.unlink(missing_ok=True)
    abstracts.unlink(missing_ok=True)


def main() -> None:
    print("== Chapter 2 (HSF1 activation + HSP90) data fetch ==")
    fetch_pdb_structure()
    fetch_pubmed_citations()
    print("== Done ==")


if __name__ == "__main__":
    main()
