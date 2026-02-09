import fitz

pdf_path = r"MARCAS/boletins/EV Leisure rafts – Replacement of PRV valve type VSP-EV_08.pdf"

with fitz.open(pdf_path) as doc:
    text = ""
    for page in doc:
        text += page.get_text()

with open("boletins-extract.json", "w", encoding="utf-8") as f:
    import json
    json.dump({"boletim": "EV Leisure rafts – Replacement of PRV valve type VSP-EV_08", "conteudo": text}, f, ensure_ascii=False, indent=2)

print("Extração concluída. Conteúdo salvo em boletins-extract.json.")
