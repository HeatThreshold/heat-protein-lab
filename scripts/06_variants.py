"""
Chapter 6 (When the genome strains) data fetcher.

ClinVar variants in three heat-shock genes — HSPA1A, HSF1, HSP90AA1 —
curated into a small set of variant cards that span pathogenicity
classes. The chapter is documentation of what ClinVar contains, NOT
prediction of individual heat-illness susceptibility.

Outputs:
    data/clinvar/variants.json   — curated array of variant cards

Card shape:
    {
        "gene": "HSPA1A",
        "variant_id": "...",
        "title": "NM_005345.6(HSPA1A):c.123G>A (p.Arg41Lys)",
        "clinical_significance": "Pathogenic",
        "review_status": "criteria provided, single submitter",
        "star_count": 1,
        "chrom": "6",
        "position": 31815525,
        "ref": "G",
        "alt": "A",
        "protein_effect": "p.Arg41Lys",
        "molecular_consequences": ["missense variant"],
        "citation_pmids": ["12345678"],
        "conditions": ["..."],
        "url": "https://www.ncbi.nlm.nih.gov/clinvar/variation/<id>/"
    }
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SKILLS = Path.home() / ".gemini/config/plugins/science/skills"
CV_SCRIPTS = SKILLS / "clinvar_database/scripts"

DATA = REPO / "data"
CLINVAR = DATA / "clinvar"

GENES = ["HSPA1A", "HSF1", "HSP90AA1"]
CARDS_PER_GENE = 2  # 2 × 3 genes = 6 cards


def run(cmd, cwd=None):
    print(f"  $ {' '.join(cmd)}")
    proc = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, env={**os.environ})
    if proc.returncode != 0:
        print(f"    !! exit {proc.returncode}", file=sys.stderr)
        print(proc.stderr[-2000:], file=sys.stderr)
        raise SystemExit(proc.returncode)
    return proc


def star_count(review_status: str) -> int:
    # Approximate ClinVar star rating from review-status text.
    rs = (review_status or "").lower()
    if "practice guideline" in rs:
        return 4
    if "reviewed by expert panel" in rs:
        return 3
    if "multiple submitters" in rs and "no conflicts" in rs:
        return 2
    if "criteria provided" in rs:
        return 1
    return 0


SMALL_VARIANT_TYPES = {
    "single nucleotide variant",
    "deletion",
    "insertion",
    "indel",
    "duplication",
    "microsatellite",
}


def is_small_point_variant(s) -> bool:
    """Accept SNVs and small indels. Reject megabase-scale copy-number
    variants — those span hundreds of genes and aren't variants *of* the
    heat-shock protein per se."""
    vt = (s.get("variation_type") or "").lower()
    if "copy number" in vt:
        return False
    title = (s.get("title") or "").lower()
    # Reject large chromosomal regions referenced by cytoband ranges like
    # "GRCh37/hg19 6p22.1-q14.1".
    if "grch37/hg19" in title and ("p" in title or "q" in title) and "-" in title:
        return False
    if vt and vt not in SMALL_VARIANT_TYPES:
        # Allow if it's truly small (e.g., "Deletion" without copy-number)
        if "deletion" not in vt and "insertion" not in vt and "duplication" not in vt:
            return False
    return True


def pick_representatives(summaries):
    """Pick up to CARDS_PER_GENE variants prioritising clinical interest
    AND actually being a small variant *in* the gene (not a megabase CNV
    that happens to overlap the gene locus).

    Tier (lower = better):
      0 Pathogenic SNV/small indel
      1 Likely Pathogenic SNV/small indel
      2 Uncertain significance (VUS) SNV/small indel
      3 Conflicting interpretations
      4 Likely Benign
      5 Benign
      6 anything else
    """
    def priority(sig: str) -> int:
        s = (sig or "").lower()
        if "pathogenic" in s and "likely" not in s and "benign" not in s:
            return 0
        if "likely pathogenic" in s:
            return 1
        if "uncertain significance" in s or "vus" in s:
            return 2
        if "conflicting" in s:
            return 3
        if "likely benign" in s:
            return 4
        if "benign" in s:
            return 5
        return 6

    eligible = [s for s in summaries if is_small_point_variant(s)]
    scored = []
    for s in eligible:
        sig = s.get("clinical_significance") or ""
        stars = star_count(s.get("review_status") or "")
        scored.append(((priority(sig), -stars), s))
    scored.sort(key=lambda t: t[0])
    return [s for _, s in scored[:CARDS_PER_GENE]]


HGVS_PROTEIN_RE = re.compile(r"\(p\.([A-Za-z]{3}\d+[A-Za-z]{3}\*?|\*?\d+[A-Za-z]{3})\)")


def extract_protein_effect(title: str):
    m = HGVS_PROTEIN_RE.search(title or "")
    return ("p." + m.group(1)) if m else None


def fetch_gene(gene: str):
    print(f"\n== {gene} ==")
    # 1. Search
    search_out = CLINVAR / f".search-{gene}.json"
    run([
        "uv", "run", str(CV_SCRIPTS / "clinvar_api.py"),
        "search", "--query", f"{gene}[gene]", "--output", str(search_out),
    ], cwd=CV_SCRIPTS.parent)
    search_data = json.loads(search_out.read_text())
    variant_ids = search_data.get("variant_ids", [])
    total = search_data.get("total_count", len(variant_ids))
    print(f"  search: {total} total, fetched {len(variant_ids)}")
    if not variant_ids:
        return []
    # 2. Summary on (up to) first 100 — keeps cost down while having enough
    #    variety to pick representatives from.
    summary_out = CLINVAR / f".summary-{gene}.json"
    run([
        "uv", "run", str(CV_SCRIPTS / "clinvar_api.py"),
        "summary", "--variant_ids", *variant_ids[:100], "--output", str(summary_out),
    ], cwd=CV_SCRIPTS.parent)
    summaries = json.loads(summary_out.read_text())
    reps = pick_representatives(summaries)
    print(f"  picked {len(reps)} representatives:")
    cards = []
    # 3. Evidence on each chosen variant — for HGVS coords + PMIDs.
    for s in reps:
        vid = s.get("variant_id")
        print(f"    - {vid} | {s.get('clinical_significance')} | {s.get('title','')[:60]}")
        evidence_out = CLINVAR / f".evidence-{gene}-{vid}.json"
        run([
            "uv", "run", str(CV_SCRIPTS / "clinvar_api.py"),
            "evidence", "--variant_id", str(vid), "--output", str(evidence_out),
        ], cwd=CV_SCRIPTS.parent)
        ev = json.loads(evidence_out.read_text())
        allele = ev.get("allele_info") or {}
        conditions = [c.get("name") for c in (ev.get("conditions") or []) if c.get("name")]
        pmids = ev.get("citation_references") or []
        cards.append({
            "gene": gene,
            "variant_id": vid,
            "title": s.get("title"),
            "clinical_significance": s.get("clinical_significance"),
            "review_status": s.get("review_status"),
            "star_count": star_count(s.get("review_status") or ""),
            "chrom": allele.get("chromosome"),
            "position": allele.get("position_start"),
            "ref": allele.get("reference_allele"),
            "alt": allele.get("alternate_allele"),
            "protein_effect": extract_protein_effect(s.get("title") or ""),
            "variation_type": s.get("variation_type"),
            "molecular_consequences": s.get("molecular_consequences") or [],
            "citation_pmids": [str(p) for p in pmids[:4]],
            "conditions": conditions[:3],
            "url": f"https://www.ncbi.nlm.nih.gov/clinvar/variation/{vid}/",
        })
        evidence_out.unlink(missing_ok=True)
    search_out.unlink(missing_ok=True)
    summary_out.unlink(missing_ok=True)
    return cards


def main() -> None:
    print("== Chapter 6 (ClinVar variants) data fetch ==")
    out = CLINVAR / "variants.json"
    if out.exists():
        print(f"  already cached at {out}")
        return
    CLINVAR.mkdir(parents=True, exist_ok=True)
    all_cards = []
    for gene in GENES:
        all_cards.extend(fetch_gene(gene))
    out.write_text(json.dumps({
        "chapter": 6,
        "topic": "ClinVar variants in heat-shock genes",
        "genes": GENES,
        "card_count": len(all_cards),
        "retrieved_at": "2026-05-25",
        "cards": all_cards,
    }, indent=2))
    print(f"\n== Done. {len(all_cards)} cards -> {out} ==")


if __name__ == "__main__":
    main()
