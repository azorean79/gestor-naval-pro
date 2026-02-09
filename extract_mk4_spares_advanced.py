#!/usr/bin/env python3
"""
Extrai spares MK IV com busca mais precisa em seções específicas
"""

import json
import re
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    import subprocess
    import sys
    print("📥 Instalando PyMuPDF...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "PyMuPDF"])
    import fitz

pdf_path = Path("MARCAS/SURVIVA MKIV/MK IV.pdf")
output_file = Path("MK_IV_spares_detailed.json")

print(f"\n🔧 Extração avançada de spares do MK IV...\n")

if not pdf_path.exists():
    print(f"❌ PDF não encontrado: {pdf_path}")
    exit(1)

doc = fitz.open(str(pdf_path))
total_pages = doc.page_count

print(f"📄 PDF aberto: {total_pages} páginas")

spares_data = {
    "manual": "MK IV",
    "total_paginas": total_pages,
    "spares": [],
    "secoes_spares": [],
    "imagens_por_pagina": {}
}

print(f"🔍 Procurando seções de spares...\n")

# Primeiro passo: encontrar páginas com seções de "Spare Parts"
spare_pages = []

for page_num in range(total_pages):
    page = doc[page_num]
    text = page.get_text()
    
    # Detectar headers/títulos de seções
    if re.search(r'(?:SPARE\s+PARTS?|SPARES|SERVICE\s+PARTS|REPLACEMENT|EQUIPMENT\s+LIST|PARTS?\s+LIST)', text, re.IGNORECASE):
        spare_pages.append({
            "pagina": page_num + 1,
            "titulo_encontrado": True
        })
        print(f"  ✓ Página {page_num + 1}: Seção de spares detectada")

print(f"\n📄 {len(spare_pages)} páginas com seções de spares encontradas\n")
print(f"📊 Processando conteúdo...\n")

# Segundo passo: extrair dados das páginas com spares
for page_info in spare_pages:
    page_num = page_info["pagina"] - 1
    page = doc[page_num]
    text = page.get_text()
    
    # Salvar página completa como imagem potencial
    spares_data["imagens_por_pagina"][page_num + 1] = f"page_{page_num + 1:03d}.png"
    
    # Dividir em linhas
    lines = text.split('\n')
    
    # Procurar padrões estruturados
    for i, line in enumerate(lines):
        line_clean = line.strip()
        
        # PADRÃO 1: Listas numeradas "1. Item name - Reference"
        match1 = re.match(r'^(\d+)\s*[.)\-–]\s+([^0-9\-]{3,}?)(?:\s{2,}|\s*[-–]\s*)([A-Z0-9]+[\-.]?[A-Z0-9]*)$', line_clean)
        
        # PADRÃO 2: Listas com separação clara de colunas
        match2 = re.match(r'^(\d+)\s+(.+?)\s{2,}([A-Z0-9]+.*)$', line_clean)
        
        # PADRÃO 3: Formato com tabulação
        match3 = None
        if '\t' in line_clean:
            parts = line_clean.split('\t')
            if len(parts) >= 2:
                match3 = (parts[0].strip(), ' '.join(parts[1:-1]).strip(), parts[-1].strip())
        
        spare_entry = None
        
        if match1:
            num, desc, ref = match1.groups()
            spare_entry = {
                "numero": int(num),
                "descricao": desc.strip(),
                "refFabricante": ref.strip(),
                "pagina": page_num + 1,
                "source": "pattern1"
            }
        elif match2:
            num, desc, ref = match2.groups()
            if len(ref) > 2 and (ref[0].isalpha() or ref[0].isdigit()):
                spare_entry = {
                    "numero": int(num),
                    "descricao": desc.strip(),
                    "refFabricante": ref.strip(),
                    "pagina": page_num + 1,
                    "source": "pattern2"
                }
        elif match3:
            num, desc, ref = match3
            if num.isdigit() and len(ref) > 2:
                spare_entry = {
                    "numero": int(num),
                    "descricao": desc.strip(),
                    "refFabricante": ref.strip(),
                    "pagina": page_num + 1,
                    "source": "pattern3"
                }
        
        if spare_entry:
            # Verificar se não é duplicado
            is_dup = any(
                s["descricao"] == spare_entry["descricao"] and 
                s["refFabricante"] == spare_entry["refFabricante"]
                for s in spares_data["spares"]
            )
            if not is_dup:
                spares_data["spares"].append(spare_entry)
                print(f"  ✓ #{spare_entry['numero']}: {spare_entry['descricao'][:50]}... → {spare_entry['refFabricante']}")

# Terceiro passo: busca global de referências (mesmo fora das seções marcadas)
print(f"\n🔍 Fazendo busca global por referências...\n")

# Padrões de referência mais específicos
ref_only_patterns = [
    r'\b([A-Z]{2}\d{2,})\b',  # BT17, LR07, etc
    r'\b(\d{8,})\b',  # Códigos numéricos longos
    r'(?:P/N|Part ?N[o]?)[:\s]*([A-Z0-9\-\.]+)',  # Part numbers formatados
]

all_refs = set()
for page_num in range(total_pages):
    page = doc[page_num]
    text = page.get_text()
    
    for pattern in ref_only_patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            if len(match) <= 20:  # Evitar extrações muito longas
                all_refs.add(match)

print(f"  Encontradas {len(all_refs)} referências únicas")

spares_data["referencias_encontradas"] = sorted(list(all_refs))[:50]  # Top 50

# Salvar
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(spares_data, f, indent=2, ensure_ascii=False)

# Resumo
print(f"\n{'='*60}")
print(f"✅ Extração avançada completa!")
print(f"\n📊 RESUMO DO MK IV:\n")
print(f"  Total páginas: {spares_data['total_paginas']}")
print(f"  Páginas com spares: {len(spare_pages)}")
print(f"  Total spares extraído: {len(spares_data['spares'])}")
print(f"  Referências encontradas: {len(spares_data['referencias_encontradas'])}")
print(f"  Arquivo: {output_file}\n")

if spares_data['spares']:
    print(f"📋 SPARES EXTRAÍDOS:\n")
    for spare in spares_data['spares'][:15]:
        print(f"  #{spare['numero']}: {spare['descricao']}")
        print(f"     ├─ Ref: {spare['refFabricante']}")
        print(f"     ├─ Pág: {spare['pagina']}")
        print(f"     └─ Src: {spare['source']}\n")

if spares_data['referencias_encontradas']:
    print(f"🔖 REFERÊNCIAS ENCONTRADAS:\n")
    for ref in spares_data['referencias_encontradas'][:20]:
        print(f"   • {ref}")

print()
doc.close()
