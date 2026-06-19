"""
Import Ocean Safety spares PDF into stock.
- Extracts Part No, Description, RRP (GBP->EUR), Ser.Stn.Price (GBP->EUR), Min.Stock
- Extracts embedded product images from PDF and saves to public/uploads/ocean-safety/
- Creates stock items via POST /api/stock
"""
import fitz  # PyMuPDF
import re
import os
import json
import base64
import urllib.request
import urllib.error
from io import BytesIO

# ─── Config ──────────────────────────────────────────────────────────────────
PDF_PATH   = "documentacao/ocean safety spares.pdf"
IMG_DIR    = "public/uploads/ocean-safety"
OUT_JSON   = "scripts/ocean_safety_items.json"
GBP_TO_EUR = 1.17   # approximate exchange rate March 2026
API_BASE   = "http://localhost:3000"
SUPPLIER   = "Ocean Safety"
CATEGORY   = "Jangadas e Salvatagem"
# ─────────────────────────────────────────────────────────────────────────────

os.makedirs(IMG_DIR, exist_ok=True)

def extract_image(doc, xref, partno):
    """Extract an embedded image by xref and save to disk. Returns public URL."""
    try:
        img = doc.extract_image(xref)
        ext = img["ext"]
        data = img["image"]
        filename = f"{partno}.{ext}"
        filepath = os.path.join(IMG_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(data)
        return f"/uploads/ocean-safety/{filename}"
    except Exception as e:
        print(f"  [WARN] Could not extract image xref={xref}: {e}")
        return None


def parse_pdf():
    """
    PDF text layout per item (multi-line):
      OSL8200
      Ocean SOLAS Compact          <- desc part 1
      £70.02                       <- RRP
      £49.02                       <- Ser.Stn.Price
      5                            <- Min.Stock (optional integer)
      Service Kit 6, 8 Person      <- desc part 2 (optional)
    """
    doc = fitz.open(PDF_PATH)
    items = []

    PARTNO_RE = re.compile(r'^[A-Z]{2,5}[\dA-Z\-]{2,15}$')
    PRICE_RE  = re.compile(r'^£([\d,]+\.?\d*)$')
    INT_RE    = re.compile(r'^\d+$')
    SKIP_HEADERS = {"Part No", "Description", "Image", "RRP", "Ser. Stn.", "Price",
                    "Min.", "Stock", "2021", "2022", "2023", "2024", "2025", "Index"}

    for page_num in range(2, len(doc)):  # skip cover + index
        page  = doc[page_num]
        raw   = page.get_text("text") or ""
        lines = [l.strip() for l in raw.split("\n")]

        # Collect image rects: xref -> (y0, y1, y_center)
        img_rects = {}
        seen_xrefs = set()
        for img_info in page.get_images(full=True):
            xref = img_info[0]
            if xref in seen_xrefs:
                continue
            seen_xrefs.add(xref)
            rects = page.get_image_rects(xref)
            if rects:
                r = rects[0]
                img_rects[xref] = (r.y0, r.y1)

        # Get y positions for text lines starting with a part no
        blocks = page.get_text("dict")["blocks"]
        partno_y = {}  # partno -> y0
        for b in blocks:
            if b["type"] != 0:
                continue
            for line in b["lines"]:
                txt = " ".join(s["text"] for s in line["spans"]).strip()
                if PARTNO_RE.match(txt) and txt not in SKIP_HEADERS:
                    partno_y[txt] = b["bbox"][1]

        # State machine through lines
        i = 0
        while i < len(lines):
            line = lines[i]
            if not line or line in SKIP_HEADERS:
                i += 1
                continue

            if PARTNO_RE.match(line):
                partno = line
                desc_parts = []
                rrp_gbp    = None
                stn_gbp    = None
                minstk     = 0
                i += 1

                # Consume following lines until we see next part no or end of useful block
                while i < len(lines):
                    nxt = lines[i]
                    if not nxt:
                        i += 1
                        continue
                    if PARTNO_RE.match(nxt) and nxt not in SKIP_HEADERS:
                        break  # next item starts — don't consume
                    if nxt in SKIP_HEADERS:
                        i += 1
                        continue
                    pm = PRICE_RE.match(nxt)
                    if pm:
                        val = float(pm.group(1).replace(",", ""))
                        if rrp_gbp is None:
                            rrp_gbp = val
                        elif stn_gbp is None:
                            stn_gbp = val
                        i += 1
                        continue
                    # After both prices, an integer alone = min stock
                    if rrp_gbp is not None and stn_gbp is not None and INT_RE.match(nxt):
                        minstk = int(nxt)
                        i += 1
                        continue
                    # Otherwise it's a description fragment
                    desc_parts.append(nxt)
                    i += 1

                if rrp_gbp is None or stn_gbp is None:
                    continue  # incomplete row, skip

                desc      = " ".join(desc_parts).strip()
                rrp_eur   = round(rrp_gbp * GBP_TO_EUR, 2)
                stn_eur   = round(stn_gbp * GBP_TO_EUR, 2)

                # Find matching image
                img_url  = None
                part_y0  = partno_y.get(partno)
                if part_y0 is not None:
                    best_xref    = None
                    best_overlap = 0
                    for xref, (iy0, iy1) in img_rects.items():
                        oy0 = max(part_y0 - 30, iy0)
                        oy1 = min(part_y0 + 80, iy1)
                        overlap = max(0, oy1 - oy0)
                        if overlap > best_overlap:
                            best_overlap = overlap
                            best_xref    = xref
                    if best_xref and best_overlap > 5:
                        img_url = extract_image(doc, best_xref, partno)

                items.append({
                    "partno":            partno,
                    "nome":              desc if desc else partno,
                    "descricao":         desc,
                    "refFabricante":     partno,
                    "categoria":         CATEGORY,
                    "fornecedor":        SUPPLIER,
                    "precoVenda":        rrp_eur,
                    "precoCompra":       stn_eur,
                    "quantidadeMinima":  minstk,
                    "quantidade":        0,
                    "imagem":            img_url,
                    "status":            "ativo",
                })
            else:
                i += 1

    doc.close()
    return items


def post_item(item):
    payload = json.dumps({
        "nome":                item["nome"],
        "descricao":           item["descricao"],
        "categoria":           item["categoria"],
        "quantidade":          item["quantidade"],
        "quantidadeMinima":    item["quantidadeMinima"],
        "precoCompra":         item["precoCompra"],
        "precoVenda":          item["precoVenda"],
        "codigoFabricante":    item["refFabricante"],
        "foto":                item["imagem"],
        "status":              item["status"],
    }).encode("utf-8")
    
    req = urllib.request.Request(
        f"{API_BASE}/api/stock",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read())
            return True, body
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        return False, body
    except Exception as ex:
        return False, str(ex)


if __name__ == "__main__":
    print("=== Ocean Safety Spares Import ===")
    print(f"Exchange rate: 1 GBP = {GBP_TO_EUR} EUR")
    print()
    
    print("Parsing PDF...")
    items = parse_pdf()
    print(f"Found {len(items)} items.")
    
    # Save JSON for inspection
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"Saved to {OUT_JSON}")
    print()
    
    # Count images
    with_imgs = sum(1 for it in items if it["imagem"])
    print(f"Items with images: {with_imgs}/{len(items)}")
    print()
    
    # Import to stock API
    print("Importing to stock...")
    ok_count = 0
    skip_count = 0
    err_count = 0
    
    for idx, item in enumerate(items):
        success, result = post_item(item)
        if success:
            ok_count += 1
            print(f"  [{idx+1}/{len(items)}] OK  {item['refFabricante']} | {item['descricao'][:50]}")
        elif isinstance(result, str) and ("já existe" in result.lower() or "already" in result.lower() or "duplicate" in result.lower()):
            skip_count += 1
            print(f"  [{idx+1}/{len(items)}] SKIP (already exists): {item['refFabricante']}")
        else:
            err_count += 1
            print(f"  [{idx+1}/{len(items)}] ERR  {item['refFabricante']}: {str(result)[:120]}")
    
    print()
    print(f"Done. Created: {ok_count}  Skipped: {skip_count}  Errors: {err_count}")
