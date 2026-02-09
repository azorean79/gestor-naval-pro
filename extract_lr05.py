import pdfplumber

pdf = pdfplumber.open('MARCAS/LR05.pdf')
print(f'Total de páginas: {len(pdf.pages)}')
print('='*80)

# Extrair texto de todas as páginas
all_text = ""
for i, page in enumerate(pdf.pages):
    print(f'\n=== PÁGINA {i+1} ===')
    text = page.extract_text()
    if text:
        all_text += f"\n\n=== PÁGINA {i+1} ===\n{text}"
        print(text)

# Salvar em arquivo
with open('lr05-extracted.txt', 'w', encoding='utf-8') as f:
    f.write(all_text)

print("\n\n✅ Texto extraído salvo em lr05-extracted.txt")
pdf.close()
