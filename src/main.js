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
