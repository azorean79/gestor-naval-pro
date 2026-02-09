import fitz  # PyMuPDF
import os
import json

boletins_dir = os.path.join(os.path.dirname(__file__), '../marcas/boletins')
output_file = os.path.join(boletins_dir, 'boletins-extract.json')

boletins = []

for file in os.listdir(boletins_dir):
    if file.endswith('.pdf'):
        file_path = os.path.join(boletins_dir, file)
        doc = fitz.open(file_path)
        text = ''
        for page in doc:
            text += page.get_text() + '\n'
        boletins.append({'file': file, 'text': text})

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(boletins, f, ensure_ascii=False, indent=2)

print(f'Boletins extraídos: {len(boletins)}')
