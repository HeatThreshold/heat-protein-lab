#!/usr/bin/env python3
"""Render the Beat-N DevRel drafts in notes/devrel/posts/ into the
surveyor-themed static post pages under posts/.

The lab site is intentionally bundler-free, so this script runs locally
and commits the resulting HTML. Re-run whenever a Beat post draft is
edited. The repo's GitHub Actions deploy then ships the static HTML to
Cloudflare Pages without ever touching markdown.

Reads
-----
notes/devrel/posts/*.md  — YAML-ish frontmatter + markdown body.

Writes
------
posts/<slug>/index.html  — one per draft.
posts/index.html         — landing page listing the drafts in date order.

The HTML uses the project's shared `src/styles.css` plus a post-specific
`src/post.css`. The canonical URL on each post points back to the
craigmerry.com mirror; the lab-site copy is the discovery surface that
follows the live page itself.
"""
from __future__ import annotations

import html
import re
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path

import markdown


REPO_ROOT = Path(__file__).resolve().parent.parent
SRC = REPO_ROOT / "notes" / "devrel" / "posts"
DEST = REPO_ROOT / "posts"


@dataclass
class Post:
    slug: str
    title: str
    date_drafted: date
    date_publish_earliest: date
    beat: int
    target_words: str
    canonical_url: str
    live_url: str
    body_md: str

    @property
    def body_html(self) -> str:
        md = markdown.Markdown(
            extensions=[
                "fenced_code",
                "tables",
                "footnotes",
                "smarty",
                "attr_list",
            ],
            output_format="html5",
        )
        return md.convert(self.body_md)


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Parse a minimal YAML-ish frontmatter block from the top of a markdown file.

    We don't import PyYAML to keep the dependency set tiny. The frontmatter we
    write is small and well-structured — top-level scalars and a `venues:` list.
    """
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---\n", 4)
    if end < 0:
        return {}, text
    block = text[4:end]
    body = text[end + 5 :]
    meta: dict[str, object] = {}
    current_key: str | None = None
    current_list: list[str] | None = None
    for raw in block.splitlines():
        line = raw.rstrip()
        if not line:
            continue
        if line.startswith("  - ") and current_key:
            if current_list is None:
                current_list = []
                meta[current_key] = current_list
            current_list.append(line[4:].strip())
            continue
        if ":" in line and not line.startswith(" "):
            key, _, value = line.partition(":")
            key = key.strip()
            value = value.strip()
            current_key = key
            current_list = None
            if value == "":
                # list will follow
                continue
            meta[key] = value
    return meta, body


def load_post(path: Path) -> Post:
    text = path.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(text)
    slug = str(meta.get("slug") or path.stem)
    title = str(meta.get("title") or slug)
    drafted = date.fromisoformat(str(meta["date_drafted"]))
    earliest = date.fromisoformat(str(meta["date_publish_earliest"]))
    beat = int(meta.get("beat") or 0)
    target_words = str(meta.get("target_words") or "")
    canonical = str(meta.get("canonical_url") or f"https://craigmerry.com/blog/{slug}/")
    live = str(meta.get("live_url") or "https://heat-protein-lab.pages.dev/")
    return Post(
        slug=slug,
        title=title,
        date_drafted=drafted,
        date_publish_earliest=earliest,
        beat=beat,
        target_words=target_words,
        canonical_url=canonical,
        live_url=live,
        body_md=body.strip() + "\n",
    )


POST_TEMPLATE = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="{description}" />
    <meta name="color-scheme" content="light" />
    <title>{title} — Heat Protein Lab</title>
    <link rel="canonical" href="{canonical}" />

    <!-- Open Graph -->
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Heat Protein Lab" />
    <meta property="og:title" content="{title}" />
    <meta property="og:description" content="{description}" />
    <meta property="og:url" content="{post_url}" />
    <meta property="og:image" content="https://heat-protein-lab.pages.dev/og.svg" />
    <meta property="article:published_time" content="{publish_date}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{title}" />
    <meta name="twitter:description" content="{description}" />
    <meta name="twitter:image" content="https://heat-protein-lab.pages.dev/og.svg" />

    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="stylesheet" href="/src/styles.css" />
    <link rel="stylesheet" href="/src/post.css" />
  </head>
  <body class="post">
    <a class="skip-link" href="#post-body">Skip to post</a>
    <header class="post-header">
      <div class="post-header__row">
        <span class="post-header__plate">Plate {beat:02d}</span>
        <a class="post-header__home" href="/">Heat Protein Lab</a>
        <a class="post-header__index" href="/posts/">All posts</a>
      </div>
      <h1 class="post-title">{title}</h1>
      <p class="post-meta">
        <time datetime="{publish_date}">{publish_date_human}</time>
        · Beat {beat} of 5
        · <a href="{canonical}">canonical on craigmerry.com</a>
      </p>
    </header>

    <article id="post-body" class="post-body">
      {body_html}
    </article>

    <footer class="post-footer">
      <p>
        The live page this post writes about is at <a href="{live}">{live}</a>.
        Repo: <a href="https://github.com/HeatThreshold/heat-protein-lab">HeatThreshold/heat-protein-lab</a>.
      </p>
      <p class="post-footer__nav">
        <a href="/posts/">← All posts</a>
        ·
        <a href="/">Home</a>
      </p>
    </footer>
  </body>
</html>
"""


INDEX_TEMPLATE = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="DevRel posts written alongside the Heat Protein Lab build — process notes mirrored from craigmerry.com." />
    <meta name="color-scheme" content="light" />
    <title>Posts — Heat Protein Lab</title>
    <link rel="canonical" href="https://heat-protein-lab.pages.dev/posts/" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="stylesheet" href="/src/styles.css" />
    <link rel="stylesheet" href="/src/post.css" />
  </head>
  <body class="post post--index">
    <header class="post-header">
      <div class="post-header__row">
        <span class="post-header__plate">Posts</span>
        <a class="post-header__home" href="/">Heat Protein Lab</a>
      </div>
      <h1 class="post-title">Field notes from the build</h1>
      <p class="post-meta">
        Process posts written alongside the lab itself. Each is canonical on
        <a href="https://craigmerry.com/blog/">craigmerry.com</a> and mirrored
        here so the live page can link back to the story of how it was built.
      </p>
    </header>

    <article class="post-body">
      <ol class="post-index">
        {entries}
      </ol>
    </article>

    <footer class="post-footer">
      <p class="post-footer__nav">
        <a href="/">← Home</a>
      </p>
    </footer>
  </body>
</html>
"""


def derive_description(body_md: str, fallback: str) -> str:
    """First non-heading paragraph of the body, trimmed."""
    paragraphs = re.split(r"\n\s*\n", body_md.strip())
    for p in paragraphs:
        s = p.strip()
        if not s or s.startswith("#"):
            continue
        # Strip simple markdown link syntax for the description.
        s = re.sub(r"\[([^\]]+)\]\[[^\]]+\]", r"\1", s)
        s = re.sub(r"\[([^\]]+)\]\(([^\)]+)\)", r"\1", s)
        s = re.sub(r"`([^`]+)`", r"\1", s)
        s = re.sub(r"\s+", " ", s)
        if len(s) > 280:
            s = s[:277].rstrip() + "..."
        return s
    return fallback


def render_post(post: Post) -> str:
    description = derive_description(
        post.body_md,
        fallback=f"Heat Protein Lab — Beat {post.beat} field notes.",
    )
    return POST_TEMPLATE.format(
        title=html.escape(post.title),
        description=html.escape(description),
        canonical=html.escape(post.canonical_url, quote=True),
        live=html.escape(post.live_url, quote=True),
        post_url=html.escape(
            f"https://heat-protein-lab.pages.dev/posts/{post.slug}/", quote=True
        ),
        publish_date=post.date_publish_earliest.isoformat(),
        publish_date_human=post.date_publish_earliest.strftime("%B %-d, %Y"),
        beat=post.beat,
        body_html=post.body_html,
    )


def render_index(posts: list[Post]) -> str:
    entries: list[str] = []
    posts_sorted = sorted(posts, key=lambda p: (p.date_publish_earliest, p.beat))
    for p in posts_sorted:
        desc = derive_description(p.body_md, fallback="")
        entries.append(
            "<li>"
            f'<time datetime="{p.date_publish_earliest.isoformat()}">'
            f'{p.date_publish_earliest.strftime("%B %-d, %Y")}</time>'
            f'<span class="post-index__beat">Beat {p.beat}</span>'
            f'<h2 class="post-index__title"><a href="/posts/{p.slug}/">{html.escape(p.title)}</a></h2>'
            f'<p class="post-index__excerpt">{html.escape(desc)}</p>'
            "</li>"
        )
    return INDEX_TEMPLATE.format(entries="\n        ".join(entries))


def main(argv: list[str]) -> int:
    DEST.mkdir(exist_ok=True)
    posts: list[Post] = []
    for path in sorted(SRC.glob("*.md")):
        post = load_post(path)
        out_dir = DEST / post.slug
        out_dir.mkdir(exist_ok=True)
        (out_dir / "index.html").write_text(render_post(post), encoding="utf-8")
        posts.append(post)
        print(f"  rendered  posts/{post.slug}/index.html")
    (DEST / "index.html").write_text(render_index(posts), encoding="utf-8")
    print(f"  rendered  posts/index.html ({len(posts)} entries)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
