/*
 * heat-protein-lab — Chapter 1 (HSF1) entry point.
 * Loads:
 *   - data/structures/pdb/hsf1/pdb_00005d5u.cif.gz   (gzipped mmCIF)
 *   - data/citations/hsf1.json                       (PubMed slim)
 *   - data/expression/hsf1.json                      (HPA tissue list)
 * Sets up:
 *   - 3Dmol.js viewer for HSF1
 *   - Citation list rendering
 *   - Tissue-expression summary badge
 *   - Persistent temperature strip + plate badge tied to chapter in view
 */

// --- DOM refs --------------------------------------------------------------

const els = {
  // Chapter 1
  viewer: document.getElementById("viewer-hsf1"),
  viewerLoading: document.querySelector("#viewer-hsf1 .viewer__loading"),
  citationsList: document.getElementById("hsf1-citations-list"),
  expressionSummary: document.getElementById("hsf1-expression-summary"),
  // Chapter 2
  viewerHsp90: document.getElementById("viewer-hsp90"),
  viewerHsp90Loading: document.querySelector("#viewer-hsp90 .viewer__loading"),
  activationCitationsList: document.getElementById("hsf1-activation-citations-list"),
  // Chapter 3
  viewerHsp70: document.getElementById("viewer-hsp70"),
  viewerHsp70Loading: document.querySelector("#viewer-hsp70 .viewer__loading"),
  hsp70CitationsList: document.getElementById("hsp70-citations-list"),
  // Chapter 4
  viewerAldolase: document.getElementById("viewer-aldolase"),
  viewerAldolaseLoading: document.querySelector("#viewer-aldolase .viewer__loading"),
  ch4Section: document.querySelector('section.chapter--centerpiece[data-chapter="4"]'),
  ch4TempValue: document.getElementById("ch4-temp-value"),
  ch4RmsdValue: document.getElementById("ch4-rmsd-value"),
  ch4RmsdBar: document.getElementById("ch4-rmsd-bar"),
  ch4SsValue: document.getElementById("ch4-ss-value"),
  ch4SsBar: document.getElementById("ch4-ss-bar"),
  aldolaseCitationsList: document.getElementById("aldolase-citations-list"),
  // Chapter 5
  hspHeatmap: document.getElementById("hsp-heatmap"),
  // Chapter 6
  variantGrid: document.getElementById("variant-grid"),
  // Global UI
  tempStripFill: document.querySelector(".temp-strip__fill"),
  tempReadout: document.getElementById("temp-readout"),
  plateBadge: document.getElementById("plate-badge"),
};

// --- Helpers ---------------------------------------------------------------

/**
 * Fetch a gzipped file and return its decompressed text contents. The Pi's
 * Python http.server doesn't auto-set Content-Encoding for .gz files, so we
 * decompress in the browser. Falls back to plain text if magic bytes don't
 * match gzip (in case a server already decompressed the response).
 */
async function fetchGzipText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const view = new Uint8Array(buf);
  const isGzip = view.length >= 2 && view[0] === 0x1f && view[1] === 0x8b;
  if (!isGzip) {
    return new TextDecoder("utf-8").decode(view);
  }
  const ds = new DecompressionStream("gzip");
  const stream = new Blob([buf]).stream().pipeThrough(ds);
  return await new Response(stream).text();
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return await res.json();
}

const PLATE_LABELS = [
  "Plate 0",
  "Plate I",
  "Plate II",
  "Plate III",
  "Plate IV",
  "Plate V",
  "Plate VI",
  "Plate VII",
  "Plate VIII",
];

// --- Chapter 1 data renderers ---------------------------------------------

function renderCitationsInto(target, payload, sourcePath) {
  if (!target) return;
  if (!payload || !Array.isArray(payload.citations)) {
    target.innerHTML = `<li class="citations__error">No citations found in ${escapeHtml(sourcePath)}.</li>`;
    return;
  }
  const items = payload.citations.map((c) => {
    const authors = (c.authors_short || []).join(", ") + (c.authors_short?.length ? ", et al." : "");
    const safeTitle = c.title ?? "(untitled)";
    const pmid = c.pmid;
    const pubmedUrl = pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : null;
    return `
      <li>
        <span class="citation__authors">${escapeHtml(authors)}</span>
        ${c.year ? ` (${escapeHtml(String(c.year))})` : ""}.
        <span class="citation__title">${escapeHtml(safeTitle)}</span>
        ${c.journal ? `<span class="citation__journal">${escapeHtml(c.journal)}</span>` : ""}
        ${
          pubmedUrl
            ? `<a class="citation__pmid" href="${pubmedUrl}" target="_blank" rel="noopener">PMID&nbsp;${escapeHtml(String(pmid))}</a>`
            : ""
        }
      </li>
    `;
  });
  target.innerHTML = items.join("");
}

function renderCitations(payload) {
  renderCitationsInto(els.citationsList, payload, "data/citations/hsf1.json");
}

function renderActivationCitations(payload) {
  renderCitationsInto(
    els.activationCitationsList,
    payload,
    "data/citations/hsf1_activation.json"
  );
}

function renderHsp70Citations(payload) {
  renderCitationsInto(
    els.hsp70CitationsList,
    payload,
    "data/citations/hsp70.json"
  );
}

function renderAldolaseCitations(payload) {
  renderCitationsInto(
    els.aldolaseCitationsList,
    payload,
    "data/citations/aldolase.json"
  );
}

/* Chapter 6 — Render ClinVar variant cards.
 * Input shape per data/clinvar/variants.json (each card):
 *   { gene, variant_id, title, clinical_significance, review_status,
 *     star_count, chrom, position, ref, alt, protein_effect,
 *     variation_type, molecular_consequences, citation_pmids,
 *     conditions, url }
 */
function classifySig(sig) {
  const s = String(sig || "").toLowerCase();
  if (s.includes("likely pathogenic")) return "likely-pathogenic";
  if (s.includes("pathogenic") && !s.includes("likely") && !s.includes("benign"))
    return "pathogenic";
  if (s.includes("uncertain") || s.includes("vus")) return "vus";
  if (s.includes("conflicting")) return "conflicting";
  if (s.includes("benign")) return "benign";
  return "unknown";
}

function renderVariantCards(payload) {
  if (!els.variantGrid) return;
  const cards = (payload && Array.isArray(payload.cards) && payload.cards) || [];
  if (!cards.length) {
    els.variantGrid.innerHTML =
      '<p class="variant-grid__loading">No variants in data/clinvar/variants.json.</p>';
    return;
  }
  const html = cards
    .map((c) => {
      const sigClass = classifySig(c.clinical_significance);
      const stars = "★".repeat(Math.min(4, c.star_count || 0)) +
        "☆".repeat(4 - Math.min(4, c.star_count || 0));
      const coord =
        c.chrom && c.position
          ? `chr${escapeHtml(String(c.chrom))}:${escapeHtml(String(c.position))}` +
            (c.ref && c.alt ? `:${escapeHtml(c.ref)}>${escapeHtml(c.alt)}` : "")
          : "&mdash;";
      const pmids = (c.citation_pmids || []).slice(0, 3);
      const pmidLinks = pmids.length
        ? pmids
            .map(
              (p) =>
                `<a href="https://pubmed.ncbi.nlm.nih.gov/${escapeHtml(p)}/" target="_blank" rel="noopener">PMID&nbsp;${escapeHtml(p)}</a>`
            )
            .join(" &middot; ")
        : `<span style="color:var(--ink-faint)">no linked PubMed citations</span>`;
      return `
        <article class="variant-card">
          <div class="variant-card__row">
            <span class="variant-card__gene">${escapeHtml(c.gene)}</span>
            <span class="variant-card__pill" data-sig="${escapeHtml(sigClass)}">${escapeHtml(
              c.clinical_significance || "Unknown"
            )}</span>
          </div>
          <div class="variant-card__hgvs" title="${escapeHtml(c.title || "")}">${escapeHtml(
            c.title || "(untitled)"
          )}</div>
          ${
            c.protein_effect
              ? `<div class="variant-card__protein">${escapeHtml(c.protein_effect)}</div>`
              : ""
          }
          <div class="variant-card__coord">${coord}</div>
          <div class="variant-card__stars">
            <span class="variant-card__stars-glyph" aria-hidden="true">${escapeHtml(stars)}</span>
            <span>Review status</span>
          </div>
          <div class="variant-card__citations">
            <span class="variant-card__citations-label">Cited in</span> ${pmidLinks}
          </div>
          ${
            c.url
              ? `<a class="variant-card__link" href="${escapeHtml(c.url)}" target="_blank" rel="noopener">ClinVar entry &#8599;</a>`
              : ""
          }
        </article>
      `;
    })
    .join("");
  els.variantGrid.innerHTML = html;
}

/* Chapter 5 — Render an HSP tissue heatmap. Inputs: arrays of
 * {tissue, organ, level} per gene. Tissues are union-merged with rows
 * grouped by organ. */
const HSP_GENES = ["HSPA1A", "HSPA8", "HSP90AA1"];
const HEATMAP_LEVEL_KEYS = ["high", "medium", "low", "not detected"];

function renderHeatmap(perGene) {
  if (!els.hspHeatmap) return;

  // Build union of all tissue names across the three genes, keyed by tissue.
  // Each entry: { tissue, organ, levels: { HSPA1A: 'high', ... } }
  const tissueMap = new Map();
  HSP_GENES.forEach((gene) => {
    const rows = perGene[gene] || [];
    rows.forEach((row) => {
      const key = row.tissue;
      if (!tissueMap.has(key)) {
        tissueMap.set(key, { tissue: key, organ: row.organ || "", levels: {} });
      }
      tissueMap.get(key).levels[gene] = String(row.level || "").toLowerCase();
    });
  });

  // Group rows by organ, sort organs alphabetically, then tissues within.
  const byOrgan = new Map();
  for (const entry of tissueMap.values()) {
    const key = entry.organ || "Other";
    if (!byOrgan.has(key)) byOrgan.set(key, []);
    byOrgan.get(key).push(entry);
  }
  const sortedOrgans = Array.from(byOrgan.keys()).sort();
  for (const k of sortedOrgans) {
    byOrgan.get(k).sort((a, b) => a.tissue.localeCompare(b.tissue));
  }

  // Header row.
  const header = `
    <div class="heatmap__header" role="row">
      <div class="heatmap__corner" role="columnheader">Tissue</div>
      ${HSP_GENES.map((g) => `<div role="columnheader">${escapeHtml(g)}</div>`).join("")}
    </div>
  `;

  // Rows, grouped by organ.
  const groups = sortedOrgans
    .map((organ) => {
      const tissueRows = byOrgan
        .get(organ)
        .map((entry) => {
          const cells = HSP_GENES.map((gene) => {
            const lvl = entry.levels[gene] || "n/a";
            const display =
              lvl === "high"
                ? "H"
                : lvl === "medium"
                ? "M"
                : lvl === "low"
                ? "L"
                : lvl === "not detected"
                ? "·"
                : "—";
            return `<div class="heatmap__cell" role="cell" data-level="${escapeHtml(
              lvl
            )}" title="${escapeHtml(gene)} · ${escapeHtml(entry.tissue)}: ${escapeHtml(
              lvl
            )}">${escapeHtml(display)}</div>`;
          }).join("");
          return `
            <div class="heatmap__tissue" role="rowheader">${escapeHtml(entry.tissue)}</div>
            ${cells}
          `;
        })
        .join("");
      return `
        <div class="heatmap__group-break" role="presentation">${escapeHtml(organ)}</div>
        ${tissueRows}
      `;
    })
    .join("");

  els.hspHeatmap.innerHTML = header + groups;
}

function renderTissueExpression(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    els.expressionSummary.textContent = "No HPA data found.";
    return;
  }
  // Count high/medium/low to give a one-line summary, then list the high-expression tissues.
  const buckets = { high: [], medium: [], low: [], "not detected": [] };
  for (const row of rows) {
    const lvl = String(row.level || "").toLowerCase();
    if (buckets[lvl]) buckets[lvl].push(row.tissue);
  }
  const total = rows.length;
  const expressedCount = total - buckets["not detected"].length;
  const highSample = buckets.high.slice(0, 4).join(", ");
  const remaining = buckets.high.length - 4;
  const tail = remaining > 0 ? ` (+${remaining} more)` : "";
  // Single sentence, single line — let CSS handle wrapping naturally.
  els.expressionSummary.innerHTML = `Expressed across ${expressedCount} of ${total} tissues; high in <strong>${escapeHtml(
    highSample
  )}</strong>${escapeHtml(tail)}.`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// --- 3Dmol viewer ----------------------------------------------------------

async function mount3DmolViewer({
  mountEl,
  loadingEl,
  cifUrl,
  styleFn,
  pdbId,
}) {
  const $3 = window.$3Dmol;
  if (!$3) {
    if (loadingEl) loadingEl.textContent = "3Dmol.js failed to load (CDN blocked?)";
    return;
  }
  let cifText;
  try {
    cifText = await fetchGzipText(cifUrl);
  } catch (err) {
    console.error(err);
    if (loadingEl) loadingEl.textContent = `Could not load PDB ${pdbId} from data/.`;
    return;
  }

  const viewer = $3.createViewer(mountEl, {
    backgroundColor:
      getComputedStyle(document.documentElement)
        .getPropertyValue("--surface-viewer")
        .trim() || "#0F1217",
    antialias: true,
  });

  viewer.addModel(cifText, "cif");
  styleFn(viewer);
  viewer.zoomTo();
  viewer.render();

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    viewer.spin("y", 0.4);
  }
  if (loadingEl) loadingEl.style.display = "none";
}

function styleHsf1(viewer) {
  // Protein chains in ochre, DNA strands in slate, ligands/ions thin stick in yellow.
  viewer.setStyle({ chain: "A" }, { cartoon: { color: "#c97a2b" } });
  viewer.setStyle({ chain: "B" }, { cartoon: { color: "#c97a2b" } });
  viewer.setStyle({ chain: "C" }, { cartoon: { color: "#c97a2b" } });
  viewer.setStyle({ chain: "D" }, { cartoon: { color: "#4f6b7a" } });
  viewer.setStyle({ chain: "E" }, { cartoon: { color: "#4f6b7a" } });
  viewer.setStyle({ hetflag: true }, { stick: { color: "#b8a04f", radius: 0.15 } });
}

function styleHsp90(viewer) {
  // HSP90 dimer + p23 + ATP. Apply a single warm-yellow cartoon to all
  // protein chains; bound nucleotides/ions read as thin sticks.
  viewer.setStyle({ cartoon: { color: "#b8a04f" } });
  viewer.setStyle({ hetflag: true }, { stick: { color: "#c97a2b", radius: 0.18 } });
}

function styleHsp70(viewer) {
  // HSP70 SBD + bound peptide. Cartoon in ochre (chapter accent).
  // Bound peptide substrate stands out in a softer cream-yellow.
  viewer.setStyle({ cartoon: { color: "#c97a2b" } });
  viewer.setStyle({ hetflag: true }, { stick: { color: "#e9d8a0", radius: 0.15 } });
}

/* Chapter 4 — scroll-driven denaturation visualization. Stage transitions:
 *   t < 0.34: NATIVE   — cartoon, slate
 *   t < 0.67: STRESSED — ribbon (thin), warm yellow
 *   t ≥ 0.67: DENATURED— lines/wireframe, terra-cotta
 * 3Dmol atoms do not move; we change styles + colors and let the temperature
 * readout + metrics carry the rest of the narrative.
 */
const ALDOLASE_STAGES = [
  { until: 0.34, name: "native", style: { cartoon: { color: "#4f6b7a" } } },
  { until: 0.67, name: "stressed", style: { cartoon: { color: "#b8a04f", thickness: 0.3 } } },
  { until: 1.01, name: "denatured", style: { line: { color: "#b23a1f" } } },
];

let aldolaseViewer = null;
let aldolaseLastStage = null;

function setAldolaseStage(stageName) {
  if (!aldolaseViewer || stageName === aldolaseLastStage) return;
  const stage = ALDOLASE_STAGES.find((s) => s.name === stageName);
  if (!stage) return;
  aldolaseViewer.setStyle({}, {}); // clear
  aldolaseViewer.setStyle({}, stage.style);
  aldolaseViewer.setStyle({ hetflag: true }, { stick: { color: "#c97a2b", radius: 0.15 } });
  aldolaseViewer.render();
  aldolaseLastStage = stageName;
}

function styleAldolaseInitial(viewer) {
  aldolaseViewer = viewer;
  aldolaseLastStage = null;
  setAldolaseStage("native");
}

async function mountHsf1Viewer() {
  return mount3DmolViewer({
    mountEl: els.viewer,
    loadingEl: els.viewerLoading,
    cifUrl: "data/structures/pdb/hsf1/pdb_00005d5u.cif.gz",
    styleFn: styleHsf1,
    pdbId: "5D5U",
  });
}

async function mountHsp90Viewer() {
  if (!els.viewerHsp90) return;
  return mount3DmolViewer({
    mountEl: els.viewerHsp90,
    loadingEl: els.viewerHsp90Loading,
    cifUrl: "data/structures/pdb/hsp90/pdb_00007l7j.cif.gz",
    styleFn: styleHsp90,
    pdbId: "7L7J",
  });
}

async function mountHsp70Viewer() {
  if (!els.viewerHsp70) return;
  return mount3DmolViewer({
    mountEl: els.viewerHsp70,
    loadingEl: els.viewerHsp70Loading,
    cifUrl: "data/structures/pdb/hsp70/pdb_00004po2.cif.gz",
    styleFn: styleHsp70,
    pdbId: "4PO2",
  });
}

async function mountAldolaseViewer() {
  if (!els.viewerAldolase) return;
  // Chapter 4 viewer does NOT spin — the scroll-driven stage changes carry
  // the motion. Use a wrapper styleFn that captures the viewer reference.
  const $3 = window.$3Dmol;
  if (!$3) {
    if (els.viewerAldolaseLoading)
      els.viewerAldolaseLoading.textContent = "3Dmol.js failed to load.";
    return;
  }
  let cifText;
  try {
    cifText = await fetchGzipText("data/structures/pdb/aldolase/pdb_00006xmh.cif.gz");
  } catch (err) {
    console.error(err);
    if (els.viewerAldolaseLoading)
      els.viewerAldolaseLoading.textContent = "Could not load PDB 6XMH.";
    return;
  }
  const viewer = $3.createViewer(els.viewerAldolase, {
    backgroundColor:
      getComputedStyle(document.documentElement)
        .getPropertyValue("--surface-viewer")
        .trim() || "#0F1217",
    antialias: true,
  });
  viewer.addModel(cifText, "cif");
  styleAldolaseInitial(viewer); // sets aldolaseViewer + initial native stage
  viewer.zoomTo();
  viewer.render();
  if (els.viewerAldolaseLoading) els.viewerAldolaseLoading.style.display = "none";
  setupCh4ScrollDriver();
}

function setupCh4ScrollDriver() {
  if (!els.ch4Section) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // Snap to denatured end-state and bypass scroll wiring entirely.
    setAldolaseStage("denatured");
    if (els.ch4TempValue) els.ch4TempValue.textContent = "50.0";
    if (els.ch4RmsdBar) {
      els.ch4RmsdBar.style.width = "100%";
      els.ch4RmsdBar.style.background = "var(--heat-41)";
    }
    if (els.ch4RmsdValue) els.ch4RmsdValue.textContent = "≈12 Å";
    if (els.ch4SsBar) els.ch4SsBar.style.width = "30%";
    if (els.ch4SsValue) els.ch4SsValue.textContent = "30%";
    return;
  }

  const TEMP_LO = 40;
  const TEMP_HI = 50;
  const RMSD_HI = 12;

  let lastFrac = -1;
  let rafPending = false;
  const update = () => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      const rect = els.ch4Section.getBoundingClientRect();
      const viewportH = window.innerHeight;
      // Progress 0..1: 0 when section's top hits the top of viewport,
      // 1 when section's bottom hits the bottom of viewport.
      const total = rect.height - viewportH;
      let frac = (0 - rect.top) / total;
      frac = Math.max(0, Math.min(1, frac));
      if (Math.abs(frac - lastFrac) < 0.005) {
        rafPending = false;
        return;
      }
      lastFrac = frac;

      // Temperature
      const temp = TEMP_LO + frac * (TEMP_HI - TEMP_LO);
      if (els.ch4TempValue) els.ch4TempValue.textContent = temp.toFixed(1);

      // RMSD bar
      if (els.ch4RmsdBar) {
        els.ch4RmsdBar.style.width = `${(frac * 100).toFixed(1)}%`;
        const barColor =
          frac < 0.34
            ? "var(--heat-37)"
            : frac < 0.67
            ? "var(--heat-39)"
            : "var(--heat-41)";
        els.ch4RmsdBar.style.background = barColor;
      }
      if (els.ch4RmsdValue) els.ch4RmsdValue.textContent = `${(frac * RMSD_HI).toFixed(1)} Å`;

      // Secondary structure % retained
      const ssPct = 100 - frac * 70; // 100 → 30
      if (els.ch4SsBar) els.ch4SsBar.style.width = `${ssPct.toFixed(0)}%`;
      if (els.ch4SsValue) els.ch4SsValue.textContent = `${Math.round(ssPct)}%`;

      // 3Dmol stage transition (3-step discrete)
      const stage = frac < 0.34 ? "native" : frac < 0.67 ? "stressed" : "denatured";
      setAldolaseStage(stage);

      rafPending = false;
    });
  };

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();
}

// --- Temperature strip + plate badge ---------------------------------------

function setupChapterObserver() {
  const chapters = document.querySelectorAll(".chapter");
  if (!chapters.length) return;

  const update = (chapter) => {
    if (!chapter) return;
    const tempStr = chapter.getAttribute("data-temp") || "37.0";
    const accent = chapter.getAttribute("data-accent") || "heat-37";
    const chapterIdx = Number(chapter.getAttribute("data-chapter") || "0");

    // Pull the named ramp color out of the document-level custom properties.
    const accentColor = getComputedStyle(document.documentElement)
      .getPropertyValue(`--${accent}`)
      .trim();

    if (els.tempStripFill) {
      els.tempStripFill.style.background = accentColor || "var(--heat-37)";
    }
    if (els.tempReadout) {
      els.tempReadout.textContent = `${Number(tempStr).toFixed(1)} °C`;
    }
    if (els.plateBadge) {
      els.plateBadge.textContent = PLATE_LABELS[chapterIdx] ?? `Plate ${chapterIdx}`;
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      // Pick the most-visible chapter currently intersecting.
      let best = null;
      let bestRatio = 0;
      for (const e of entries) {
        if (e.intersectionRatio > bestRatio) {
          bestRatio = e.intersectionRatio;
          best = e.target;
        }
      }
      if (best) update(best);
    },
    {
      // Fire when chapters are at least 40% visible — keeps the strip stable
      // and avoids flicker as section boundaries cross the fold.
      threshold: [0.4, 0.6, 0.8],
      rootMargin: "0px",
    }
  );

  chapters.forEach((c) => observer.observe(c));

  // Tie the fill width to overall scroll progress (independent of which
  // chapter is highlighted — handled separately). Throttle with rAF to keep
  // the scroll thread cheap.
  let rafPending = false;
  const updateScrollFill = () => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      const clamped = Math.min(100, Math.max(0, pct));
      if (els.tempStripFill) {
        els.tempStripFill.style.width = `${clamped}%`;
      }
      rafPending = false;
    });
  };
  updateScrollFill();
  window.addEventListener("scroll", updateScrollFill, { passive: true });
  window.addEventListener("resize", updateScrollFill, { passive: true });
}

// --- Boot ------------------------------------------------------------------

(async function boot() {
  setupChapterObserver();

  // Parallel: all viewers + all citation/expression fetches. Independent.
  await Promise.allSettled([
    mountHsf1Viewer(),
    mountHsp90Viewer(),
    mountHsp70Viewer(),
    mountAldolaseViewer(),
    fetchJson("data/citations/hsf1.json")
      .then(renderCitations)
      .catch((err) => {
        console.error(err);
        if (els.citationsList) {
          els.citationsList.innerHTML = `<li class="citations__error">Could not load citations: ${escapeHtml(
            err.message
          )}</li>`;
        }
      }),
    fetchJson("data/citations/hsf1_activation.json")
      .then(renderActivationCitations)
      .catch((err) => {
        console.error(err);
        if (els.activationCitationsList) {
          els.activationCitationsList.innerHTML = `<li class="citations__error">Could not load activation citations: ${escapeHtml(
            err.message
          )}</li>`;
        }
      }),
    fetchJson("data/citations/hsp70.json")
      .then(renderHsp70Citations)
      .catch((err) => {
        console.error(err);
        if (els.hsp70CitationsList) {
          els.hsp70CitationsList.innerHTML = `<li class="citations__error">Could not load HSP70 citations: ${escapeHtml(
            err.message
          )}</li>`;
        }
      }),
    fetchJson("data/citations/aldolase.json")
      .then(renderAldolaseCitations)
      .catch((err) => {
        console.error(err);
        if (els.aldolaseCitationsList) {
          els.aldolaseCitationsList.innerHTML = `<li class="citations__error">Could not load aldolase citations: ${escapeHtml(
            err.message
          )}</li>`;
        }
      }),
    Promise.all([
      fetchJson("data/expression/hspa1a.json"),
      fetchJson("data/expression/hspa8.json"),
      fetchJson("data/expression/hsp90aa1.json"),
    ])
      .then(([hspa1a, hspa8, hsp90aa1]) =>
        renderHeatmap({ HSPA1A: hspa1a, HSPA8: hspa8, HSP90AA1: hsp90aa1 })
      )
      .catch((err) => {
        console.error(err);
        if (els.hspHeatmap) {
          els.hspHeatmap.innerHTML = `<p class="heatmap__loading">Could not load tissue expression: ${escapeHtml(
            err.message
          )}</p>`;
        }
      }),
    fetchJson("data/clinvar/variants.json")
      .then(renderVariantCards)
      .catch((err) => {
        console.error(err);
        if (els.variantGrid) {
          els.variantGrid.innerHTML = `<p class="variant-grid__loading">Could not load ClinVar variants: ${escapeHtml(
            err.message
          )}</p>`;
        }
      }),
    fetchJson("data/expression/hsf1.json")
      .then(renderTissueExpression)
      .catch((err) => {
        console.error(err);
        if (els.expressionSummary) {
          els.expressionSummary.textContent = `Could not load tissue expression: ${err.message}`;
        }
      }),
  ]);
})();
