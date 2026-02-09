import PyPDF2
import sys

try:
    print("Abrindo PDF do SURVIVA MKIII...")
    pdf_path = r'MARCAS\SURVIVA MKIII\MkIII.pdf'
    
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        total_pages = len(pdf_reader.pages)
        print(f'Total de páginas: {total_pages}')
        print('='*80)
        
        all_text = ""
        # Extrair primeiras 100 páginas (onde geralmente estão as especificações)
        max_pages = min(100, total_pages)
        
        for i in range(max_pages):
            try:
                print(f'Processando página {i+1}/{max_pages}...')
                page = pdf_reader.pages[i]
                text = page.extract_text()
                if text and text.strip():
                    all_text += f"\n\n{'='*80}\n=== PÁGINA {i+1} ===\n{'='*80}\n{text}"
            except Exception as e:
                print(f'Erro na página {i+1}: {str(e)}')
                continue
        
        # Salvar em arquivo
        output_file = 'mkiii-extracted.txt'
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(all_text)
        
        print(f"\n\n✅ Texto extraído de {max_pages} páginas salvo em {output_file}")
        print(f"✅ Total de caracteres extraídos: {len(all_text)}")
        
except Exception as e:
    print(f"❌ Erro: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
