import pdfplumber
import sys
import traceback

def extract_page_safe(page, page_num):
    """Extrai texto de uma página com tratamento de erros"""
    try:
        # Tentar extrair de forma simples primeiro
        text = page.extract_text(layout=False, x_tolerance=2, y_tolerance=2)
        return text if text else ""
    except Exception as e:
        print(f"  [Aviso] Erro ao extrair página {page_num}: {str(e)[:100]}")
        try:
            # Tentar método alternativo
            text = page.extract_text(layout=True)
            return text if text else ""
        except:
            return f"[Página {page_num} - Erro na extração]"

try:
    print("Abrindo PDF do SURVIVA MKIII...")
    pdf_path = r'MARCAS\SURVIVA MKIII\MkIII.pdf'
    
    pdf = pdfplumber.open(pdf_path)
    total_pages = len(pdf.pages)
    print(f'Total de páginas no PDF: {total_pages}')
    print('='*80)
    
    all_text = ""
    # Extrair as primeiras 80 páginas (specs técnicas geralmente nas primeiras páginas)
    max_pages = min(80, total_pages)
    successful_pages = 0
    failed_pages = 0
    
    for i in range(max_pages):
        page_num = i + 1
        print(f'Processando página {page_num}/{max_pages}...', end='')
        
        try:
            page = pdf.pages[i]
            text = extract_page_safe(page, page_num)
            
            if text and text.strip() and not text.startswith("[Página"):
                all_text += f"\n\n{'='*80}\n=== PÁGINA {page_num} ===\n{'='*80}\n{text}"
                successful_pages += 1
                print(" ✓")
            else:
                failed_pages += 1
                if text.startswith("[Página"):
                    all_text += f"\n\n{text}"
                print(" [vazia ou erro]")
                
        except KeyboardInterrupt:
            print("\n\n⚠️  Extração interrompida pelo usuário")
            break
        except Exception as e:
            failed_pages += 1
            print(f" ✗ Erro: {str(e)[:50]}")
            all_text += f"\n\n[Página {page_num} - Erro: {str(e)[:100]}]"
    
    pdf.close()
    
    # Salvar em arquivo
    output_file = 'mkiii-extracted.txt'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(all_text)
    
    print(f"\n{'='*80}")
    print(f"✅ Extração concluída!")
    print(f"  - Páginas processadas com sucesso: {successful_pages}/{max_pages}")
    print(f"  - Páginas com erro/vazias: {failed_pages}/{max_pages}")
    print(f"  - Total de caracteres extraídos: {len(all_text):,}")
    print(f"  - Arquivo salvo: {output_file}")
    print(f"{'='*80}")
    
except Exception as e:
    print(f"\n❌ Erro fatal: {str(e)}")
    traceback.print_exc()
    sys.exit(1)
