#!/usr/bin/env python3
"""
Gera fotos individuais por part number a partir do manual MK IV.
Estratégia:
- usa tmp_mkiv_parts.json para saber página de cada part number
- encontra a posição Y do part number no texto da página
- recorta a coluna esquerda (imagem do artigo) no intervalo entre part numbers vizinhos
- grava em public/manual-parts/<part_number>.jpg
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

import fitz  # PyMuPDF


@dataclass
class PartEntry:
    part_number: str
    source_page: int


@dataclass
class WordY:
    text: str
    y0: float
    y1: float


def load_parts(parts_json: Path) -> List[PartEntry]:
    raw = json.loads(parts_json.read_text(encoding="utf-8"))
    result: List[PartEntry] = []
    for row in raw:
        pn = str(row.get("part_number", "")).strip()
        pg = int(row.get("source_page", 0) or 0)
        if not pn or pg <= 0:
            continue
        result.append(PartEntry(part_number=pn, source_page=pg))
    return result


def collect_page_words(doc: fitz.Document, page_no_1: int) -> List[WordY]:
    page = doc[page_no_1 - 1]
    words = page.get_text("words")
    out: List[WordY] = []
    for w in words:
        x0, y0, x1, y1, text, *_ = w
        text = str(text).strip()
        if not text:
            continue
        out.append(WordY(text=text, y0=float(y0), y1=float(y1)))
    return out


def find_part_y(words: List[WordY], part_number: str) -> float | None:
    candidates = [w for w in words if w.text == part_number]
    if not candidates:
        # fallback permissivo para OCR estranho
        candidates = [w for w in words if part_number in w.text or w.text in part_number]
    if not candidates:
        return None
    # normal: baseline no meio da caixa
    c = candidates[0]
    return (c.y0 + c.y1) / 2.0


def build_page_part_positions(doc: fitz.Document, parts: List[PartEntry]) -> Dict[int, List[Tuple[str, float]]]:
    by_page: Dict[int, List[PartEntry]] = {}
    for p in parts:
        by_page.setdefault(p.source_page, []).append(p)

    result: Dict[int, List[Tuple[str, float]]] = {}

    for page_no, page_parts in by_page.items():
        words = collect_page_words(doc, page_no)
        rows: List[Tuple[str, float]] = []
        for p in page_parts:
            y = find_part_y(words, p.part_number)
            if y is not None:
                rows.append((p.part_number, y))

        rows.sort(key=lambda t: t[1])
        result[page_no] = rows

    return result


def crop_and_save(
    doc: fitz.Document,
    page_no: int,
    sorted_positions: List[Tuple[str, float]],
    out_dir: Path,
    dpi: int,
) -> Tuple[int, int]:
    page = doc[page_no - 1]
    h = page.rect.height
    w = page.rect.width

    if not sorted_positions:
        return (0, 0)

    ys = [y for _, y in sorted_positions]

    # limites da coluna de imagem (ajuste para layout típico da tabela do manual)
    x0 = max(0.0, w * 0.08)
    x1 = min(w, w * 0.50)

    ok = 0
    fail = 0

    for i, (part_number, y) in enumerate(sorted_positions):
        prev_y = ys[i - 1] if i > 0 else max(0.0, y - 95.0)
        next_y = ys[i + 1] if i + 1 < len(ys) else min(h, y + 95.0)

        top = max(0.0, (prev_y + y) / 2.0 - 48.0)
        bottom = min(h, (y + next_y) / 2.0 + 8.0)

        if bottom - top < 40:
            top = max(0.0, y - 80.0)
            bottom = min(h, y + 20.0)

        rect = fitz.Rect(x0, top, x1, bottom)

        try:
            scale = dpi / 72.0
            pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), clip=rect, alpha=False)
            out_file = out_dir / f"{part_number}.jpg"
            pix.save(str(out_file))
            ok += 1
        except Exception:
            fail += 1

    return (ok, fail)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True)
    parser.add_argument("--parts-json", default="tmp_mkiv_parts.json")
    parser.add_argument("--out-dir", default="public/manual-parts")
    parser.add_argument("--dpi", type=int, default=180)
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    parts_json = Path(args.parts_json)
    out_dir = Path(args.out_dir)

    out_dir.mkdir(parents=True, exist_ok=True)

    parts = load_parts(parts_json)
    if not parts:
        print("Nenhum part number válido encontrado no JSON.")
        return

    doc = fitz.open(pdf_path)
    page_positions = build_page_part_positions(doc, parts)

    total_ok = 0
    total_fail = 0

    for page_no, positions in sorted(page_positions.items()):
        ok, fail = crop_and_save(doc, page_no, positions, out_dir, args.dpi)
        total_ok += ok
        total_fail += fail
        if ok or fail:
            print(f"page={page_no} ok={ok} fail={fail}")

    doc.close()

    print("---")
    print(f"total_parts={len(parts)}")
    print(f"saved_images={total_ok}")
    print(f"failed_images={total_fail}")
    print(f"output_dir={out_dir}")


if __name__ == "__main__":
    main()
