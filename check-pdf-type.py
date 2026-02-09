import fitz  # PyMuPDF
import json
from pathlib import Path
from PIL import Image
import pytesseract
import io
import re

# Configurar Tesseract (ajustar caminho se necessário)
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def extract_with_ocr(pdf_path, max_pages=50):
    """Extrai texto de PDF usando OCR"""
    
    print(f"\n{'='*80}")
    print(f"Processando com OCR: {pdf_path.name}")
    
    all_text = ""
    doc = fitz.open(pdf_path)
    
    total_pages = min(len(doc), max_pages)
    print(f"Total de páginas a processar: {total_pages} (de {len(doc)})")
    
    for page_num in range(total_pages):
        print(f"Processando página {page_num + 1}/{total_pages}...", end=" ")
        
        page = doc[page_num]
        
        # Tentar texto normal primeiro
        text = page.get_text()
        
        # Se não houver texto, usar OCR
        if len(text.strip()) < 50:
            try:
                # Converter página em imagem
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom para melhor OCR
                img_data = pix.tobytes("png")
                image = Image.open(io.BytesIO(img_data))
                
                # OCR
                text = pytesseract.image_to_string(image, lang='eng')
                print(f"[OCR] {len(text)} caracteres")
            except Exception as e:
                print(f"[ERRO OCR: {e}]")
                text = ""
        else:
            print(f"[TEXTO] {len(text)} caracteres")
        
        all_text += f"\n--- PÁGINA {page_num + 1} ---\n{text}\n"
    
    doc.close()
    
    # Salvar texto
    output_txt = pdf_path.stem + "-ocr.txt"
    with open(output_txt, 'w', encoding='utf-8') as f:
        f.write(all_text)
    
    print(f"\nTexto salvo em: {output_txt}")
    print(f"Total de caracteres: {len(all_text)}")
    
    return all_text


def extract_simple_check(pdf_path):
    """Verificar se PDF tem texto ou é apenas imagem"""
    
    doc = fitz.open(pdf_path)
    total_text_chars = 0
    total_pages = len(doc)
    
    # Verificar primeiras 10 páginas
    for i in range(min(10, total_pages)):
        page = doc[i]
        text = page.get_text()
        total_text_chars += len(text.strip())
    
    doc.close()
    
    has_text = total_text_chars > 500
    
    print(f"\n{'─'*80}")
    print(f"Arquivo: {pdf_path.name}")
    print(f"Total de páginas: {total_pages}")
    print(f"Caracteres nas primeiras 10 páginas: {total_text_chars}")
    print(f"Tipo: {'PDF com TEXTO' if has_text else 'PDF ESCANEADO (imagens)'}")
    print(f"{'─'*80}")
    
    return has_text


def main():
    base_path = Path(r"c:\Users\julio\Desktop\APLICACAO MASTER\LIFERAFT1.0\gestor-naval-pro\MARCAS")
    
    pdfs = [
        base_path / "Seasava Plus.pdf",
        base_path / "Seasava Plus X E R.pdf"
    ]
    
    print("="*80)
    print("VERIFICAÇÃO INICIAL DE PDFs")
    print("="*80)
    
    for pdf_path in pdfs:
        if pdf_path.exists():
            has_text = extract_simple_check(pdf_path)
            
            if not has_text:
                print(f"\n⚠️  PDF '{pdf_path.name}' é escaneado - seria necessário OCR")
                print("    OCR requer Tesseract instalado e é um processo lento.")
                print("    Analisando manualmente primeiras páginas...\n")
                
                # Ver se consegue extrair algo das primeiras páginas
                doc = fitz.open(pdf_path)
                for i in range(min(5, len(doc))):
                    page = doc[i]
                    # Tentar extrair tabelas ou imagens
                    print(f"  Página {i+1}: {len(page.get_images())} imagens, {len(page.get_text())} caracteres de texto")
                doc.close()
        else:
            print(f"❌ Arquivo não encontrado: {pdf_path}")
    
    print(f"\n{'='*80}")
    print("RECOMENDAÇÃO:")
    print("="*80)
    print("""
Os PDFs parecem ser escaneados (imagens). Para extrair as especificações:

OPÇÃO 1 - OCR Automático (requer Tesseract):
    1. Instalar Tesseract OCR: https://github.com/UB-Mannheim/tesseract/wiki
    2. Instalar pytesseract: pip install pytesseract pillow
    3. Descomentar código OCR neste script
    
OPÇÃO 2 - Manual (mais rápido e preciso):
    Abra os PDFs e forneça as páginas específicas com tabelas de:
    - Capacidades (4P, 6P, 8P, etc.)
    - Cilindros CO2
    - Pressões de trabalho
    - Válvulas
    - Weak link specifications
    
OPÇÃO 3 - Análise página específica:
    Informe quais páginas contêm as tabelas de especificações e
    eu posso tentar OCR apenas naquelas páginas.
    """)

if __name__ == "__main__":
    main()
