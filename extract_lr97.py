import subprocess
import sys

# Instalar pdfplumber
print("📥 Instalando pdfplumber...")
subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "-q"])

import pdfplumber
import json
from pathlib import Path

pdf_path = "MARCAS/LR97.pdf"

try:
    with pdfplumber.open(pdf_path) as pdf:
        print(f"\n📄 LR97.pdf - Total de páginas: {len(pdf.pages)}\n")
        
        # Extrair texto de todas as páginas
        full_text = ""
        all_tables = []
        
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            full_text += f"\n{'='*60}\nPÁGINA {i+1}\n{'='*60}\n"
            full_text += text
            
            # Extrair tabelas
            tables = page.extract_tables()
            if tables:
                print(f"✅ Encontradas {len(tables)} tabela(s) na página {i+1}")
                for j, table in enumerate(tables):
                    all_tables.append({
                        'page': i+1,
                        'table_index': j,
                        'data': table
                    })
        
        # Procurar por palavras-chave
        if "Specification" in full_text or "specification" in full_text or "Espécification" in full_text:
            print("✅ Encontradas especificações")
        
        if "Composition" in full_text or "composition" in full_text or "Contents" in full_text:
            print("✅ Encontrada composição/conteúdos")
            
        if "Spare" in full_text or "spare" in full_text:
            print("✅ Encontrados componentes/spares")
        
        # Salvar texto extraído
        with open("LR97_extracted.txt", "w", encoding="utf-8") as f:
            f.write(full_text)
        
        # Salvar tabelas em JSON
        with open("LR97_tables.json", "w", encoding="utf-8") as f:
            json.dump(all_tables, f, indent=2, ensure_ascii=False)
        
        print("\n✅ Texto extraído salvo em LR97_extracted.txt")
        print(f"✅ {len(all_tables)} tabela(s) salva(s) em LR97_tables.json")
        
        # Mostrar primeiros 3000 caracteres
        print("\n" + "="*60)
        print("PREVIEW DO CONTEÚDO:")
        print("="*60)
        print(full_text[:3000])
        
except FileNotFoundError:
    print(f"❌ Arquivo não encontrado: {pdf_path}")
except Exception as e:
    print(f"❌ Erro ao processar PDF: {e}")
    import traceback
    traceback.print_exc()
