#!/usr/bin/env python3
import os
import json
import re
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    import subprocess
    import sys
    print("📥 Instalando pdfplumber...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "pdfplumber"])
    import pdfplumber

# Diretório com PDFs
pdf_dir = Path("MARCAS")
output_dir = Path("extracted_manuals")
output_dir.mkdir(exist_ok=True)

# Procurar todos os PDFs
pdf_files = list(pdf_dir.rglob("*.pdf"))
print(f"\n📚 Encontrados {len(pdf_files)} manuais para processar:\n")

for pdf_file in sorted(pdf_files):
    print(f"📄 Processando: {pdf_file.name}...")
    relative_path = pdf_file.relative_to(pdf_dir)
    
    try:
        with pdfplumber.open(str(pdf_file)) as pdf:
            pages_count = len(pdf.pages)
            print(f"   📑 Total de páginas: {pages_count}")
            
            # Extrair texto
            full_text = ""
            for page_num, page in enumerate(pdf.pages, 1):
                text = page.extract_text()
                if text:
                    full_text += f"\n{'='*60}\nPÁGINA {page_num}\n{'='*60}\n{text}\n"
            
            # Extrair tabelas
            all_tables = []
            table_count = 0
            for page_num, page in enumerate(pdf.pages, 1):
                tables = page.extract_tables()
                if tables:
                    table_count += len(tables)
                    for table_idx, table in enumerate(tables):
                        all_tables.append({
                            "página": page_num,
                            "índice": table_idx,
                            "dados": table
                        })
            
            # Procurar keywords importantes
            keywords_found = {
                "especificação": 0,
                "composição": 0,
                "spare": 0,
                "component": 0,
                "material": 0,
                "capacity": 0,
                "weight": 0,
                "dimension": 0
            }
            
            text_lower = full_text.lower()
            for keyword in keywords_found:
                keywords_found[keyword] = len(re.findall(keyword, text_lower))
            
            # Salvar resultados
            base_name = pdf_file.stem
            output_prefix = output_dir / base_name
            
            # Salvar texto
            text_file = f"{output_prefix}_extracted.txt"
            with open(text_file, "w", encoding="utf-8") as f:
                f.write(full_text)
            
            # Salvar tabelas
            tables_file = f"{output_prefix}_tables.json"
            with open(tables_file, "w", encoding="utf-8") as f:
                json.dump({
                    "arquivo": str(pdf_file),
                    "páginas": pages_count,
                    "tabelas_total": table_count,
                    "data": all_tables
                }, f, indent=2, ensure_ascii=False)
            
            # Salvar resumo
            summary_file = f"{output_prefix}_summary.json"
            with open(summary_file, "w", encoding="utf-8") as f:
                json.dump({
                    "arquivo": str(pdf_file),
                    "páginas": pages_count,
                    "tabelas": table_count,
                    "keywords": keywords_found
                }, f, indent=2, ensure_ascii=False)
            
            print(f"   ✅ Texto → {text_file}")
            print(f"   ✅ Tabelas ({table_count}) → {tables_file}")
            print(f"   ✅ Resumo → {summary_file}")
            
    except Exception as e:
        print(f"   ❌ Erro ao processar {pdf_file.name}: {str(e)}")

print(f"\n{'='*60}")
print(f"✅ Extração completa!")
print(f"📁 Arquivos salvos em: {output_dir}/")
print(f"{'='*60}\n")

# Listar arquivos gerados
print("📋 Arquivos gerados:")
for file in sorted(output_dir.glob("*")):
    print(f"   • {file.name}")
