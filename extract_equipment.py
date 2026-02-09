import pdfplumber

# Páginas específicas sobre equipamento
equipment_pages = list(range(116, 130)) + list(range(283, 290))  # 117-130, 284-290

pdf = pdfplumber.open('MARCAS/LR05.pdf')
print(f'Extraindo páginas de equipamento: {len(equipment_pages)} paginas\n')

all_text = ""

for i in equipment_pages:
    try:
        if i < len(pdf.pages):
            page = pdf.pages[i]
            text = page.extract_text()
            if text:
                all_text += f"\n\n{'='*80}\n=== PAGINA {i+1} ===\n{'='*80}\n{text}"
                print(f'OK: Pagina {i+1}')
    except Exception as e:
        print(f'ERRO na pagina {i+1}: {str(e)[:50]}')
        continue

# Salvar em arquivo
with open('lr05-equipment-extract.txt', 'w', encoding='utf-8') as f:
    f.write(all_text)

print(f'\nTexto extraido salvo em lr05-equipment-extract.txt')
pdf.close()
