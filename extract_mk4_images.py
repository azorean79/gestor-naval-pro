#!/usr/bin/env python3
import json
from pathlib import Path

try:
    from pdf2image import convert_from_path
    from PIL import Image
except ImportError:
    import subprocess
    import sys
    print("📥 Instalando dependências...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "pdf2image", "pillow"])
    from pdf2image import convert_from_path
    from PIL import Image

pdf_dir = Path("MARCAS")
output_dir = Path("spare_parts_images")
output_dir.mkdir(exist_ok=True)

# Processar MK IV
mk4_file = pdf_dir / "SURVIVA MKIV" / "MK IV.pdf"
mk4_spares_dir = output_dir / "MK_IV"
mk4_spares_dir.mkdir(exist_ok=True)

print(f"\n🖼️  Extraindo imagens do MK IV...\n")

if not mk4_file.exists():
    print(f"❌ Arquivo não encontrado: {mk4_file}")
else:
    print(f"📄 Convertendo MK IV.pdf para imagens...")
    
    try:
        # Converter PDF para imagens (pode levar tempo)
        images = convert_from_path(str(mk4_file), dpi=150)
        
        print(f"✅ {len(images)} páginas convertidas")
        
        # Salvar todas as páginas como imagem
        for idx, image in enumerate(images, 1):
            # Salvar página completa
            filename = f"page_{idx:03d}.png"
            filepath = mk4_spares_dir / filename
            image.save(filepath, 'PNG')
            
            # Procurar por regiões de interesse (presumindo que spares estão em áreas específicas)
            width, height = image.size
            
            # Dividir página em 4 quadrantes para processar
            quadrants = [
                ((0, 0, width//2, height//2), f"page_{idx:03d}_Q1_tl.png"),
                ((width//2, 0, width, height//2), f"page_{idx:03d}_Q2_tr.png"),
                ((0, height//2, width//2, height), f"page_{idx:03d}_Q3_bl.png"),
                ((width//2, height//2, width, height), f"page_{idx:03d}_Q4_br.png"),
            ]
            
            # Salvar quadrantes com contraste aumentado (para encontrar diagramas)
            for box, qname in quadrants:
                quad_img = image.crop(box)
                
                # Detectar se tem conteúdo (não é só branco)
                # Calcular média de pixels
                pixels = list(quad_img.getdata())
                avg_brightness = sum(p if isinstance(p, int) else sum(p[:3])//3 for p in pixels) / len(pixels)
                
                # Se tem conteúdo (não é branco puro ~255)
                if avg_brightness < 240:
                    # Aumentar contraste para realçar diagramas
                    from PIL import ImageEnhance
                    enhancer = ImageEnhance.Contrast(quad_img)
                    quad_img = enhancer.enhance(1.5)
                    
                    quad_img.save(mk4_spares_dir / qname, 'PNG')
            
            if idx % 50 == 0:
                print(f"   ... {idx} páginas processadas")

        print(f"\n{'='*60}")
        print(f"✅ Extração completa!")
        print(f"📁 Imagens salvas em: {mk4_spares_dir}/\n")
        
        # Contar arquivos
        png_files = list(mk4_spares_dir.glob("*.png"))
        print(f"📊 Arquivos gerados: {len(png_files)}\n")
        
        # Criar índice JSON
        index = {
            "manual": "MK IV",
            "total_paginas": len(images),
            "total_imagens": len(png_files),
            "diretorio": str(mk4_spares_dir),
            "paginas": []
        }
        
        for idx in range(1, len(images) + 1):
            index["paginas"].append({
                "numero": idx,
                "arquivo_completo": f"page_{idx:03d}.png",
                "quadrantes": [
                    f"page_{idx:03d}_Q1_tl.png",
                    f"page_{idx:03d}_Q2_tr.png",
                    f"page_{idx:03d}_Q3_bl.png",
                    f"page_{idx:03d}_Q4_br.png"
                ]
            })
        
        # Salvar índice
        index_file = output_dir / "MK_IV_index.json"
        with open(index_file, 'w', encoding='utf-8') as f:
            json.dump(index, f, indent=2, ensure_ascii=False)
        
        print(f"📋 Índice salvo em: {index_file}\n")
        
    except Exception as e:
        print(f"❌ Erro ao processar: {e}")
        print(f"\n💡 Dica: Se receber erro de 'poppler', instale:")
        print(f"   Windows: https://github.com/oschwartz10612/poppler-windows/releases/")
        print(f"   Mac: brew install poppler")
        print(f"   Linux: sudo apt-get install poppler-utils")
