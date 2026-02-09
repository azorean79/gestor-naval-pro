import fitz  # PyMuPDF
import os
import json

LEGISLACAO_DIR = os.path.join(os.path.dirname(__file__), '..', 'legislaçao')
OUTPUT_FILE = os.path.join(LEGISLACAO_DIR, 'legislacao_extraida.json')

result = []

for fname in os.listdir(LEGISLACAO_DIR):
    if not fname.lower().endswith('.pdf'):
        continue
    path = os.path.join(LEGISLACAO_DIR, fname)
    doc = fitz.open(path)
    texto = ""
    for page in doc:
        texto += page.get_text()
    result.append({
        'arquivo': fname,
        'texto': texto.strip()
    })

with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f'Extração concluída. {len(result)} arquivos processados. Saída: {OUTPUT_FILE}')
