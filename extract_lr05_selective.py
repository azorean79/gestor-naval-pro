import pdfplumber
import sys

# Páginas específicas para extrair (ajustar conforme necessário)
page_ranges = [
    (0, 10),      # Introdução
    (28, 46),     # Chapter 1: Description & Data (já vimos parte)
    (100, 150),   # Possível localização de equipment lists
    (200, 250),   # Possível localização de parts/components
]

pdf = pdfplumber.open('MARCAS/LR05.pdf')
print(f'Total de páginas: {len(pdf.pages)}')

all_text = ""

for start, end in page_ranges:
    for i in range(start, min(end, len(pdf.pages))):
        try:
            page = pdf.pages[i]
            text = page.extract_text()
            if text:
                all_text += f"\n\n{'='*80}\n=== PÁGINA {i+1} ===\n{'='*80}\n{text}"
                print(f'Extraída página {i+1}')
        except Exception as e:
            print(f'Erro na página {i+1}: {e}')
            continue

# Salvar em arquivo
with open('lr05-extracted-selective.txt', 'w', encoding='utf-8') as f:
    f.write(all_text)

print(f"\n✅ Texto extraído salvo em lr05-extracted-selective.txt")
pdf.close()
