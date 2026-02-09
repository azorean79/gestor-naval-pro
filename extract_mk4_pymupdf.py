#!/usr/bin/env python3
import json
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    import subprocess
    import sys
    print("📥 Instalando PyMuPDF...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "PyMuPDF"])
    import fitz

pdf_dir = Path("MARCAS")
output_dir = Path("spare_parts_images")
output_dir.mkdir(exist_ok=True)

# Processar MK IV
mk4_file = pdf_dir / "SURVIVA MKIV" / "MK IV.pdf"
mk4_spares_dir = output_dir / "MK_IV"
mk4_spares_dir.mkdir(exist_ok=True)

print(f"\n🖼️  Extraindo imagens do MK IV usando PyMuPDF...\n")

if not mk4_file.exists():
    print(f"❌ Arquivo não encontrado: {mk4_file}")
else:
    print(f"📄 Processando {mk4_file.name}...")
    
    try:
        # Abrir PDF
        pdf_document = fitz.open(str(mk4_file))
        total_pages = len(pdf_document)
        
        print(f"✅ PDF aberto: {total_pages} páginas\n")
        
        images_saved = 0
        
        # Processar cada página
        for page_num in range(total_pages):
            page = pdf_document[page_num]
            
            # Renderizar página como imagem (150 DPI)
            pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
            
            # Salvar página completa
            filename = f"page_{page_num + 1:03d}.png"
            filepath = mk4_spares_dir / filename
            pix.save(str(filepath))
            images_saved += 1
            
            if (page_num + 1) % 100 == 0:
                print(f"   ... {page_num + 1}/{total_pages} páginas processadas")
        
        pdf_document.close()
        
        print(f"\n{'='*60}")
        print(f"✅ Extração completa!")
        print(f"📁 {images_saved} imagens salvas em: {mk4_spares_dir}/\n")
        
        # Criar índice JSON
        index = {
            "manual": "MK IV",
            "arquivo": str(mk4_file),
            "total_paginas": total_pages,
            "total_imagens": images_saved,
            "diretorio": str(mk4_spares_dir),
            "dpi": 150,
            "paginas": []
        }
        
        for idx in range(1, total_pages + 1):
            index["paginas"].append({
                "numero": idx,
                "arquivo": f"page_{idx:03d}.png"
            })
        
        # Salvar índice
        index_file = output_dir / "MK_IV_index.json"
        with open(index_file, 'w', encoding='utf-8') as f:
            json.dump(index, f, indent=2, ensure_ascii=False)
        
        print(f"📋 Índice salvo em: {index_file}\n")
        
    except Exception as e:
        print(f"❌ Erro ao processar: {e}")
        import traceback
        traceback.print_exc()
