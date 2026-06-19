from pathlib import Path
from pypdf import PdfReader

pdf_path = Path(r"c:/Users/julio/Desktop/APLICACAO MASTER/oreyazores26/manuais/Manual for ISO 9650.pdf")
out_path = Path(r"c:/Users/julio/Desktop/APLICACAO MASTER/oreyazores26/scripts/rfd_iso9650_manual_extracted.txt")

reader = PdfReader(str(pdf_path))
chunks: list[str] = []
for i, page in enumerate(reader.pages, start=1):
    text = page.extract_text() or ""
    chunks.append(f"\n\n===== PAGE {i} =====\n{text}")

out_path.write_text("".join(chunks), encoding="utf-8")
print({"pages": len(reader.pages), "chars": sum(len(c) for c in chunks), "out": str(out_path)})
