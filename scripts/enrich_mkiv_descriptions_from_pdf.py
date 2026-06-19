#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

import fitz  # PyMuPDF

PART_RE = re.compile(r"^(\d{8}|\d{5}-\d{3}|[A-Z0-9]{3,10}-[A-Z0-9]{2,10})$")

GARBAGE_DESCRIPTIONS = {
    "part number",
    "part number:",
    "found on:",
    "found on",
    "rfd p/n:",
    "quantity",
}


def clean_line(line: str) -> str:
    return re.sub(r"\s+", " ", (line or "").strip())


def normalize(s: str) -> str:
    return clean_line(s).lower()


def parse_page_description_map(page_text: str) -> Dict[str, str]:
    """
    Extrai mapa part_number -> description em páginas no formato:
      Description
      <valor>
      Found on:
      <valor>
      Part number
      <codigo>
    """
    lines = [clean_line(l) for l in page_text.splitlines()]
    lines = [l for l in lines if l]

    out: Dict[str, str] = {}
    i = 0
    n = len(lines)

    while i < n:
        if normalize(lines[i]).startswith("description"):
            # Capturar descrição até aparecer Found on / Part number / Description
            j = i + 1
            desc_lines: List[str] = []
            while j < n:
                lj = normalize(lines[j])
                if lj.startswith("found on") or lj.startswith("part number") or lj.startswith("description"):
                    break
                desc_lines.append(lines[j])
                j += 1

            description = clean_line(" ".join(desc_lines))

            # Procurar part number nas próximas linhas do bloco
            k = j
            found_pn = None
            while k < n and k < i + 30:
                lk = normalize(lines[k])
                if lk.startswith("description") and k > j:
                    break

                candidate = lines[k]
                if PART_RE.match(candidate):
                    found_pn = candidate
                    break

                if lk.startswith("part number"):
                    # verificar linhas seguintes
                    for m in range(k + 1, min(n, k + 6)):
                        cand2 = lines[m]
                        if PART_RE.match(cand2):
                            found_pn = cand2
                            break
                    if found_pn:
                        break
                k += 1

            if found_pn and description:
                out[found_pn] = description

            i = max(i + 1, k)
        else:
            i += 1

    return out


def suspicious_description(desc: str) -> bool:
    d = normalize(desc)
    if not d:
        return True
    if d in GARBAGE_DESCRIPTIONS:
        return True
    if re.fullmatch(r"[0-9().x×\-\s]+", d):
        return True
    if d in {"danish", "finnish", "french", "german", "greek", "italian", "dutch", "norwegian", "polish", "portugese", "spanish", "swedish", "denmark", "finland", "france", "germany", "italy", "russia"}:
        return True
    return False


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True)
    parser.add_argument("--parts-json", default="tmp_mkiv_parts.json")
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    json_path = Path(args.parts_json)

    parts = json.loads(json_path.read_text(encoding="utf-8"))

    doc = fitz.open(pdf_path)

    # Agrupar páginas presentes no JSON
    pages = sorted({int(p.get("source_page", 0) or 0) for p in parts if int(p.get("source_page", 0) or 0) > 0})

    page_maps: Dict[int, Dict[str, str]] = {}
    for page_no in pages:
      if page_no < 1 or page_no > doc.page_count:
          continue
      page_text = doc[page_no - 1].get_text("text")
      page_maps[page_no] = parse_page_description_map(page_text)

    doc.close()

    updated = 0
    resolved_from_map = 0

    for row in parts:
        pn = str(row.get("part_number", "")).strip()
        page_no = int(row.get("source_page", 0) or 0)
        current_desc = str(row.get("description", "")).strip()

        mapped = page_maps.get(page_no, {}).get(pn)

        if mapped:
            mapped_clean = clean_line(mapped)
            if mapped_clean and mapped_clean != current_desc:
                # Se temos mapeamento explícito, usar sempre
                row["description"] = mapped_clean
                updated += 1
                resolved_from_map += 1
            continue

        # sem mapeamento: manter desc atual
        if suspicious_description(current_desc):
            # mantém como está (não inventar)
            pass

    json_path.write_text(json.dumps(parts, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"pages_scanned={len(pages)}")
    print(f"mapped_updates={resolved_from_map}")
    print(f"total_updates={updated}")
    print(f"json_saved={json_path}")


if __name__ == "__main__":
    main()
