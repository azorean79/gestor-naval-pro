from __future__ import annotations

import argparse
import html
import json
from pathlib import Path
from typing import Dict, Any

import fitz  # PyMuPDF
from deep_translator import GoogleTranslator


def chunk_text(text: str, max_len: int = 4500):
    text = text.strip()
    if not text:
        return []
    chunks = []
    start = 0
    n = len(text)
    while start < n:
        end = min(start + max_len, n)
        if end < n:
            split = text.rfind("\n", start, end)
            if split <= start:
                split = text.rfind(" ", start, end)
            if split > start:
                end = split
        chunks.append(text[start:end].strip())
        start = end
    return [c for c in chunks if c]


def translate_text(translator: GoogleTranslator, text: str) -> str:
    if not text.strip():
        return ""
    out_parts = []
    for chunk in chunk_text(text):
        try:
            out_parts.append(translator.translate(chunk) or "")
        except Exception:
            # fallback: mantém original do chunk
            out_parts.append(chunk)
    return "\n\n".join(out_parts)


def build_html(report: Dict[str, Any], title: str) -> str:
    page_blocks = []
    for page in report["pages"]:
        orientation = page.get("orientation", "portrait")
        page_num = page["page"]
        image_rel = page["image_rel"]
        text_pt = html.escape(page.get("translated_text", "")).replace("\n", "<br>")

        block = f"""
        <section class=\"page {orientation}\">\n
          <div class=\"meta\">Página {page_num} • {orientation}</div>\n
          <img src=\"{image_rel}\" alt=\"Página {page_num}\" class=\"page-image\" />\n
          <div class=\"translation\">\n
            <h3>Tradução (PT)</h3>\n
            <p>{text_pt}</p>\n
          </div>\n
        </section>
        """
        page_blocks.append(block)

    body = "\n".join(page_blocks)

    return f"""<!doctype html>
<html lang=\"pt\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>{html.escape(title)} (Traduzido)</title>
  <style>
    :root {{
      color-scheme: light;
      --bg: #f5f7fb;
      --card: #ffffff;
      --text: #1f2937;
      --muted: #6b7280;
      --border: #d1d5db;
      --blue: #1d4ed8;
    }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; font-family: Arial, Helvetica, sans-serif; background: var(--bg); color: var(--text); }}
    header {{ position: sticky; top: 0; background: var(--card); border-bottom: 1px solid var(--border); padding: 12px 16px; z-index: 10; }}
    header h1 {{ margin: 0; font-size: 18px; }}
    header p {{ margin: 4px 0 0; font-size: 12px; color: var(--muted); }}
    main {{ max-width: 1200px; margin: 0 auto; padding: 16px; display: grid; gap: 16px; }}
    .page {{ background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 12px; }}
    .meta {{ font-size: 12px; color: var(--muted); margin-bottom: 8px; }}
    .page-image {{ width: 100%; border: 1px solid var(--border); border-radius: 8px; background: white; }}
    .translation {{ margin-top: 12px; padding: 10px; background: #f9fafb; border: 1px dashed var(--border); border-radius: 8px; }}
    .translation h3 {{ margin: 0 0 8px; color: var(--blue); font-size: 14px; }}
    .translation p {{ margin: 0; font-size: 13px; line-height: 1.5; white-space: normal; }}
  </style>
</head>
<body>
  <header>
    <h1>{html.escape(title)} — Versão traduzida (PT)</h1>
    <p>Layout, fotos e tabelas preservados visualmente através da imagem original de cada página.</p>
  </header>
  <main>
    {body}
  </main>
</body>
</html>
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True, help="Caminho para o PDF")
    parser.add_argument("--out-dir", required=True, help="Diretório de saída")
    parser.add_argument("--dpi", type=int, default=110)
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    out_dir = Path(args.out_dir)
    assets_dir = out_dir / "assets"
    cache_path = out_dir / "translation_cache.json"
    html_path = out_dir / "manual_traduzido.html"

    out_dir.mkdir(parents=True, exist_ok=True)
    assets_dir.mkdir(parents=True, exist_ok=True)

    if cache_path.exists():
      cache = json.loads(cache_path.read_text(encoding="utf-8"))
    else:
      cache = {"title": pdf_path.name, "pages": {}}

    doc = fitz.open(pdf_path)
    translator = GoogleTranslator(source="en", target="pt")
    zoom = args.dpi / 72.0
    matrix = fitz.Matrix(zoom, zoom)

    for i, page in enumerate(doc):
        page_no = i + 1
        key = str(page_no)
        rect = page.rect
        orientation = "landscape" if rect.width > rect.height else "portrait"

        image_name = f"page_{page_no:04d}.jpg"
        image_file = assets_dir / image_name
        image_rel = f"assets/{image_name}"

        if not image_file.exists():
            pix = page.get_pixmap(matrix=matrix, alpha=False)
            pix.save(image_file)

        text_raw = page.get_text("text").strip()

        page_cache = cache["pages"].get(key, {})
        translated_text = page_cache.get("translated_text")
        cached_source = page_cache.get("source_text")

        if translated_text is None or cached_source != text_raw:
            translated_text = translate_text(translator, text_raw)

        cache["pages"][key] = {
            "page": page_no,
            "orientation": orientation,
            "image_rel": image_rel,
            "source_text": text_raw,
            "translated_text": translated_text,
        }

        if page_no % 10 == 0:
            cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"processed_page={page_no}/{len(doc)}")

    doc.close()

    cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")

    ordered_pages = [cache["pages"][str(i)] for i in range(1, len(cache["pages"]) + 1)]
    report = {"title": cache.get("title", pdf_path.name), "pages": ordered_pages}

    html_content = build_html(report, title=cache.get("title", pdf_path.name))
    html_path.write_text(html_content, encoding="utf-8")

    print(f"html_saved={html_path}")
    print(f"pages_total={len(ordered_pages)}")


if __name__ == "__main__":
    main()
