#!/usr/bin/env python3
import json
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "pdfplumber"])
    import pdfplumber

pdf_dir = Path("MARCAS")
output_file = Path("page_orientations.json")

print("\n📋 Analisando orientações das páginas dos manuais...\n")

orientations = {}

for pdf_file in sorted(pdf_dir.rglob("*.pdf")):
    base_name = pdf_file.stem
    print(f"📄 {base_name}...")
    
    pages_info = []
    landscape_count = 0
    portrait_count = 0
    
    try:
        with pdfplumber.open(str(pdf_file)) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                width = page.width
                height = page.height
                
                # Determinar orientação
                is_landscape = width > height
                orientation = "LANDSCAPE" if is_landscape else "PORTRAIT"
                
                if is_landscape:
                    landscape_count += 1
                else:
                    portrait_count += 1
                
                pages_info.append({
                    "página": page_num,
                    "orientação": orientation,
                    "largura": width,
                    "altura": height,
                    "proporção": round(width / height, 2)
                })
        
        orientations[base_name] = {
            "arquivo": str(pdf_file),
            "total_páginas": len(pages_info),
            "landscape": landscape_count,
            "portrait": portrait_count,
            "páginas": pages_info
        }
        
        print(f"   ✅ {landscape_count} LANDSCAPE | {portrait_count} PORTRAIT")
        
    except Exception as e:
        print(f"   ❌ Erro: {e}")

# Salvar resultado
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(orientations, f, indent=2, ensure_ascii=False)

print(f"\n{'='*60}")
print(f"✅ Análise completa!")
print(f"📁 Orientações salvas em: {output_file}\n")

# Mostrar resumo
print("📊 RESUMO:\n")
for manual, data in orientations.items():
    total = data['total_páginas']
    landscape = data['landscape']
    portrait = data['portrait']
    
    landscape_pct = (landscape / total * 100) if total > 0 else 0
    portrait_pct = (portrait / total * 100) if total > 0 else 0
    
    print(f"  {manual}:")
    print(f"     Total: {total} | Landscape: {landscape} ({landscape_pct:.1f}%) | Portrait: {portrait} ({portrait_pct:.1f}%)")
    
    # Mostrar páginas em minoria
    if landscape < portrait and landscape > 0:
        landscape_pages = [p['página'] for p in data['páginas'] if p['orientação'] == 'LANDSCAPE']
        print(f"     ⚠️  Páginas LANDSCAPE: {landscape_pages}")
    elif portrait < landscape and portrait > 0:
        portrait_pages = [p['página'] for p in data['páginas'] if p['orientação'] == 'PORTRAIT']
        print(f"     ⚠️  Páginas PORTRAIT: {portrait_pages}")

print()
