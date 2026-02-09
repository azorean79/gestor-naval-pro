import pdfplumber
import sys

try:
    print("Abrindo PDF...")
    pdf = pdfplumber.open('MARCAS/SURVIVA MKIII/MkIII.pdf')
    total_pages = len(pdf.pages)
    print(f'Total de páginas: {total_pages}')
    print('='*80)

    # Extrair apenas as primeiras 50 páginas (onde geralmente estão as specs técnicas)
    all_text = ""
    max_pages = min(50, total_pages)
    
    for i in range(max_pages):
        try:
            print(f'Processando página {i+1}/{max_pages}...')
            page = pdf.pages[i]
            text = page.extract_text()
            if text:
                all_text += f"\n\n{'='*80}\n=== PÁGINA {i+1} ===\n{'='*80}\n{text}"
        except Exception as e:
            print(f'Erro na página {i+1}: {str(e)}')
            continue

    # Salvar em arquivo
    with open('mkiii-extracted.txt', 'w', encoding='utf-8') as f:
        f.write(all_text)

    print(f"\n\n✅ Texto extraído de {max_pages} páginas salvo em mkiii-extracted.txt")
    pdf.close()
    
except Exception as e:
    print(f"❌ Erro: {str(e)}")
    sys.exit(1)
