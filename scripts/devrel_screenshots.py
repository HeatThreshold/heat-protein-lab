#!/usr/bin/env python3
"""Capture DevRel screenshots of the live heat-protein-lab site.

Runs Playwright headless against https://heat-protein-lab.pages.dev/ and
writes a small library of JPEGs to notes/devrel/screenshots/. The script
is idempotent and the output is committed alongside the Beat-N drafts so
the personalsite cross-post can reference them.

Usage:
  python3 scripts/devrel_screenshots.py
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

SITE = "https://heat-protein-lab.pages.dev/"
OUT = Path(__file__).resolve().parent.parent / "notes/devrel/screenshots"


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)

    captures: list[tuple[str, int, int, str, int]] = [
        # (filename, width, height, anchor, settle_ms)
        ("01-hero.jpg", 1440, 900, "#hero", 1500),
        ("02-ch1-hsf1.jpg", 1440, 900, "#chapter-1", 4500),
        ("03-ch3-hsp70.jpg", 1440, 900, "#chapter-3", 4500),
        ("04-ch4-denaturation.jpg", 1440, 900, "#chapter-4", 4500),
        ("05-ch5-heatmap.jpg", 1440, 900, "#chapter-5", 2000),
        ("06-ch6-variants.jpg", 1440, 900, "#chapter-6", 2000),
        ("07-ch7-pathway.jpg", 1440, 900, "#chapter-7", 5000),
        ("08-ch8-bridge.jpg", 1440, 900, "#chapter-8", 2500),
        ("09-mobile-hero.jpg", 390, 844, "#hero", 1500),
        ("10-mobile-ch1.jpg", 390, 844, "#chapter-1", 4500),
        ("11-posts-index.jpg", 1440, 900, "POSTS_INDEX", 1500),
        ("12-posts-beat1.jpg", 1440, 900, "POSTS_BEAT1", 1500),
    ]

    with sync_playwright() as p:
        # Prefer system chromium (already installed on the Pi) over the
        # Playwright-shipped headless_shell to avoid a 130MB download.
        chromium_path = "/usr/bin/chromium"
        browser = p.chromium.launch(
            headless=True,
            executable_path=chromium_path,
            args=["--no-sandbox"],
        )
        for filename, w, h, anchor, settle_ms in captures:
            ctx = browser.new_context(
                viewport={"width": w, "height": h},
                device_scale_factor=2,  # higher DPI for crisper article images
                reduced_motion="reduce",
            )
            page = ctx.new_page()
            if anchor == "POSTS_INDEX":
                url = SITE + "posts/"
            elif anchor == "POSTS_BEAT1":
                url = SITE + "posts/2026-05-25-wiring-17-scientific-skills/"
            else:
                url = SITE + (anchor if anchor.startswith("#") else "")
            page.goto(url, wait_until="domcontentloaded")
            # Allow the page's own load handlers + 3Dmol to settle.
            page.wait_for_load_state("networkidle", timeout=15_000)
            time.sleep(settle_ms / 1000.0)
            # For chapter anchors, ensure the chapter is in view.
            if anchor.startswith("#chapter"):
                try:
                    page.evaluate(
                        """
                        (sel) => {
                          const el = document.querySelector(sel);
                          if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
                        }
                        """,
                        anchor,
                    )
                    time.sleep(1.0)
                except Exception as exc:
                    print(f"  warn: scroll {anchor} failed: {exc}", file=sys.stderr)
            out_path = OUT / filename
            page.screenshot(
                path=str(out_path),
                type="jpeg",
                quality=85,
                full_page=False,
            )
            print(f"  captured  {filename} ({w}x{h}) @ {anchor}")
            ctx.close()
        browser.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
