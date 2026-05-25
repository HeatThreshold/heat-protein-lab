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
  viewer: document.getElementById("viewer-hsf1"),
  viewerLoading: document.querySelector("#viewer-hsf1 .viewer__loading"),
  citationsList: document.getElementById("hsf1-citations-list"),
  expressionSummary: document.getElementById("hsf1-expression-summary"),
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

function renderCitations(payload) {
  if (!payload || !Array.isArray(payload.citations)) {
    els.citationsList.innerHTML =
      '<li class="citations__error">No citations found in data/citations/hsf1.json.</li>';
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
  els.citationsList.innerHTML = items.join("");
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
  const highSample = buckets.high.slice(0, 4).join(", ");
  const more = buckets.high.length > 4 ? ` (+${buckets.high.length - 4} more)` : "";
  els.expressionSummary.innerHTML = `
    Expressed across ${total - buckets["not detected"].length} of ${total} tissues; high in
    <strong>${escapeHtml(highSample)}</strong>${escapeHtml(more)}.
  `;
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

async function mountHsf1Viewer() {
  // 3Dmol attaches to window. If the CDN script hasn't finished yet, bail
  // with a readable error so the user can refresh.
  const $3 = window.$3Dmol;
  if (!$3) {
    els.viewerLoading.textContent = "3Dmol.js failed to load (CDN blocked?)";
    return;
  }

  // Fetch + decompress the gzipped mmCIF.
  let cifText;
  try {
    cifText = await fetchGzipText("data/structures/pdb/hsf1/pdb_00005d5u.cif.gz");
  } catch (err) {
    console.error(err);
    els.viewerLoading.textContent = "Could not load PDB 5D5U from data/.";
    return;
  }

  const viewer = $3.createViewer(els.viewer, {
    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--surface-viewer").trim() || "#0F1217",
    antialias: true,
  });

  viewer.addModel(cifText, "cif");

  // Color the protein on a constrained warm palette so it sits inside the
  // page's heat-ramp aesthetic rather than reading as generic chemistry candy.
  viewer.setStyle({ chain: "A" }, { cartoon: { color: "#c97a2b" } });
  viewer.setStyle({ chain: "B" }, { cartoon: { color: "#c97a2b" } });
  viewer.setStyle({ chain: "C" }, { cartoon: { color: "#c97a2b" } });
  // DNA strands (heat-shock element) — cool slate so they read distinct.
  viewer.setStyle({ chain: "D" }, { cartoon: { color: "#4f6b7a" } });
  viewer.setStyle({ chain: "E" }, { cartoon: { color: "#4f6b7a" } });
  // Anything else (ligands, ions): a soft outline.
  viewer.setStyle({ hetflag: true }, { stick: { color: "#b8a04f", radius: 0.15 } });

  viewer.zoomTo();
  viewer.render();

  // Gentle continuous rotation, halted under reduced-motion.
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    viewer.spin("y", 0.4);
  }

  if (els.viewerLoading) els.viewerLoading.style.display = "none";
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
  // chapter is highlighted — handled separately).
  const updateScrollFill = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (els.tempStripFill) {
      els.tempStripFill.style.setProperty("--fill-width", `${Math.min(100, Math.max(0, pct))}%`);
      els.tempStripFill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    }
  };
  updateScrollFill();
  window.addEventListener("scroll", updateScrollFill, { passive: true });
  window.addEventListener("resize", updateScrollFill, { passive: true });
}

// --- Boot ------------------------------------------------------------------

(async function boot() {
  setupChapterObserver();

  // Parallel: viewer, citations, expression. Independent.
  await Promise.allSettled([
    mountHsf1Viewer(),
    fetchJson("data/citations/hsf1.json")
      .then(renderCitations)
      .catch((err) => {
        console.error(err);
        els.citationsList.innerHTML = `<li class="citations__error">Could not load citations: ${escapeHtml(
          err.message
        )}</li>`;
      }),
    fetchJson("data/expression/hsf1.json")
      .then(renderTissueExpression)
      .catch((err) => {
        console.error(err);
        els.expressionSummary.textContent = `Could not load tissue expression: ${err.message}`;
      }),
  ]);
})();
