#!/usr/bin/env python3
import os
from pathlib import Path

try:
    import pdfplumber
    from PIL import Image
except ImportError:
    import subprocess
    import sys
    print("📥 Instalando pdfplumber e Pillow...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "pdfplumber", "pillow"])
    import pdfplumber
    from PIL import Image

# Diretório com PDFs e output
pdf_dir = Path("MARCAS")
output_dir = Path("extracted_images")
output_dir.mkdir(exist_ok=True)

# Procurar espares keywords
spare_keywords = [
    "spare", "part", "component", "inflation", "valve", "strap", "rope",
    "glue", "tape", "seal", "patch", "light", "mirror", "pack", "knife",
    "seasickness", "seasick", "first aid", "aid kit", "repair", "reparação"
]

pdf_files = list(pdf_dir.rglob("*.pdf"))
print(f"\n🖼️  Extraindo imagens de {len(pdf_files)} manuais...\n")

for pdf_file in sorted(pdf_files):
    base_name = pdf_file.stem
    manual_dir = output_dir / base_name
    manual_dir.mkdir(exist_ok=True)
    
    print(f"📄 {base_name}...")
    
    image_count = 0
    spare_images = 0
    
    try:
        with pdfplumber.open(str(pdf_file)) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                # Extrair imagens
                for image_index, image in enumerate(page.images):
                    try:
                        # Pegar o objeto da imagem
                        x0 = image["x0"]
                        y0 = image["y0"]
                        x1 = image["x1"]
                        y1 = image["y1"]
                        
                        # Extrair usando crop
                        cropped = page.crop((x0, y0, x1, y1))
                        img_array = cropped.to_image()
                        
                        # Verificar se é próximo a keywords de spares
                        page_text = (page.extract_text() or "").lower()
                        is_spare = any(keyword in page_text for keyword in spare_keywords)
                        
                        # Salvar imagem
                        if img_array.size[0] > 50 and img_array.size[1] > 50:  # Filtrar muito pequenas
                            filename = f"page_{page_num:03d}_image_{image_index:02d}.png"
                            filepath = manual_dir / filename
                            img_array.save(filepath)
                            
                            image_count += 1
                            if is_spare:
                                spare_images += 1
                            
                            if image_count % 10 == 0:
                                print(f"   ... {image_count} imagens", end="\r")
                    except Exception as e:
                        pass
        
        print(f"   ✅ {image_count} imagens extraídas ({spare_images} próximas a spares)    ")
        
    except Exception as e:
        print(f"   ❌ Erro: {str(e)}")

print(f"\n{'='*60}")
print(f"✅ Extração de imagens completa!")
print(f"📁 Imagens salvas em: {output_dir}/")
print(f"{'='*60}\n")

# Listar estrutura de pastas
print("📋 Estrutura de imagens:")
for manual_folder in sorted(output_dir.iterdir()):
    if manual_folder.is_dir():
        img_count = len(list(manual_folder.glob("*.png")))
        if img_count > 0:
            print(f"   📦 {manual_folder.name}/")
            print(f"      └─ {img_count} imagens")
