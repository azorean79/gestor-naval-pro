import pdfplumber
import re

# Procurar páginas que mencionam "pack", "equipment", "SOLAS A", "SOLAS B"
keywords = ['pack', 'equipment', 'SOLAS A', 'SOLAS B', 'emergency', 'ration', 
            'water', 'first aid', 'flare', 'rocket', 'torch', 'battery', 'anchor']

pdf = pdfplumber.open('MARCAS/LR05.pdf')
print(f'Total de páginas: {len(pdf.pages)}\n')

matches = []

# Procurar em todas as páginas (pode demorar)
print('Procurando páginas com informação sobre equipamento...\n')

for i in range(len(pdf.pages)):
    try:
        page = pdf.pages[i]
        text = page.extract_text()
        if text:
            text_lower = text.lower()
            # Verificar se página contém keywords relevantes
            keyword_count = sum(1 for kw in keywords if kw.lower() in text_lower)
            if keyword_count >= 3:  # Pelo menos 3 keywords
                matches.append((i+1, keyword_count, text[:200]))  # Guardar número da página
                print(f'Pagina {i+1}: {keyword_count} keywords encontrados')
    except Exception as e:
        print(f'Erro na pagina {i+1}: {str(e)[:50]}')
        continue

print(f'\n=> Encontradas {len(matches)} paginas relevantes')
print('\nPaginas com mais keywords:')
matches.sort(key=lambda x: x[1], reverse=True)
for page_num, count, preview in matches[:20]:
    print(f'  Pagina {page_num}: {count} keywords')

pdf.close()

# Salvar lista de páginas relevantes
with open('lr05-relevant-pages.txt', 'w', encoding='utf-8') as f:
    f.write('PAGINAS RELEVANTES PARA EQUIPAMENTO/PACKS\n')
    f.write('='*50 + '\n\n')
    for page_num, count, preview in matches[:20]:
        f.write(f'Pagina {page_num} ({count} keywords):\n{preview}\n\n')

print('\nLista salva em lr05-relevant-pages.txt')
