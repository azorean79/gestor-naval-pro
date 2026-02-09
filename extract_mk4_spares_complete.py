#!/usr/bin/env python3
"""
Extrai spares do MK IV com:
- Número do spare
- Descrição/Nome
- Referência do fabricante
- Página e imagens associadas
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

print(f"\n🔧 Extraindo spares detalhados do MK IV...\n")

if not pdf_path.exists():
    print(f"❌ PDF não encontrado: {pdf_path}")
    exit(1)

# Abrir PDF
doc = fitz.open(str(pdf_path))
total_pages = doc.page_count

print(f"📄 PDF aberto: {total_pages} páginas")

spares_data = {
    "manual": "MK IV",
    "total_paginas": total_pages,
    "spares": [],
    "componentes_com_referencia": [],
    "tabelas_spares": [],
    "referencias_encontradas": set()
}

# Padrões para detectar referências de fabricante
ref_patterns = [
    r'(?:P/N|P/NO|part\s+(?:no|number)|reference|ref\.?|código)[\s:]*([A-Z0-9\-\.]+)',
    r'([A-Z]{2}\d{2,})',  # Padrão tipo BT17, LR07
    r'(\d{8,})',  # Códigos numéricos longos
]

# Padrões para spares (linhas que iniciam com número)
spare_pattern = r'^\s*(\d+)\s+[-–•]\s+(.+?)(?:\n|$)'

spares_by_page = {}
current_section = ""

print(f"🔍 Processando páginas...\n")

for page_num in range(total_pages):
    page = doc[page_num]
    text = page.get_text()
    
    # Detectar se é seção de spares
    if any(keyword in text.upper() for keyword in ['SPARE', 'PART', 'COMPONENT', 'EQUIPMENT', 'KIT']):
        spares_by_page[page_num + 1] = {
            "conteudo": text,
            "has_spares_section": True
        }
        
        # Procurar linhas com spares
        lines = text.split('\n')
        for i, line in enumerate(lines):
            line = line.strip()
            
            # Padrão: número + descrição + possível referência
            match = re.match(r'^(\d+)\s+[–\-•]\s+(.+?)(?:\s{2,}|$)', line)
            if match:
                num, desc = match.groups()
                
                # Procurar referência na linha e próximas
                reference = None
                search_text = desc
                
                if i < len(lines) - 1:
                    search_text += "\n" + lines[i + 1]
                
                for pattern in ref_patterns:
                    ref_match = re.search(pattern, search_text, re.IGNORECASE)
                    if ref_match:
                        reference = ref_match.group(1).strip()
                        spares_data["referencias_encontradas"].add(reference)
                        break
                
                if reference:
                    spare_entry = {
                        "numero": int(num),
                        "descricao": desc.strip(),
                        "refFabricante": reference,
                        "pagina": page_num + 1,
                        "imagem": f"page_{page_num + 1:03d}.png"
                    }
                    spares_data["componentes_com_referencia"].append(spare_entry)

# Extrair tabelas com estrutura (tipo lista de spares)
print(f"📊 Processando tabelas e listas estruturadas...\n")

for page_num in range(total_pages):
    page = doc[page_num]
    text = page.get_text()
    
    # Procurar padrões de tabela/lista
    # Formato: coluna1 | coluna2 | coluna3
    if any(keyword in text.upper() for keyword in ['SPARE', 'PART NUMBER', 'REFERENCE', 'COMPONENT']):
        
        # Tentar extrair como tabela
        lines = text.split('\n')
        for i, line in enumerate(lines):
            if '|' in line or '\t' in line:
                # Pode ser tabela
                parts = re.split(r'[|\t]', line)
                parts = [p.strip() for p in parts if p.strip()]
                
                # Se tem 2-4 colunas e alguma parece ser referência
                if 2 <= len(parts) <= 4:
                    for part in parts:
                        # Procurar referência
                        for pattern in ref_patterns:
                            if re.search(pattern, part, re.IGNORECASE):
                                spares_data["referencias_encontradas"].add(part.strip())

# Converter set para lista
spares_data["referencias_encontradas"] = sorted(list(spares_data["referencias_encontradas"]))

# Limpar nomes duplicados
seen_descricoes = set()
spares_unicos = []
for spare in spares_data["componentes_com_referencia"]:
    key = (spare["descricao"], spare["refFabricante"])
    if key not in seen_descricoes:
        spares_unicos.append(spare)
        seen_descricoes.add(key)

spares_data["componentes_com_referencia"] = spares_unicos

# Salvar JSON
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(spares_data, f, indent=2, ensure_ascii=False)

# Resumo
print(f"\n{'='*60}")
print(f"✅ Extração completa!")
print(f"\n📊 RESUMO DO MK IV:\n")
print(f"  Total páginas: {spares_data['total_paginas']}")
print(f"  Componentes com referência: {len(spares_data['componentes_com_referencia'])}")
print(f"  Referências únicas encontradas: {len(spares_data['referencias_encontradas'])}")
print(f"  Arquivo salvo: {output_file}\n")

if spares_data['componentes_com_referencia']:
    print(f"📋 Primeiros 10 componentes com referência:\n")
    for spare in spares_data['componentes_com_referencia'][:10]:
        print(f"  #{spare['numero']}: {spare['descricao']}")
        print(f"     ├─ Ref: {spare['refFabricante']}")
        print(f"     └─ Pág: {spare['pagina']} ({spare['imagem']})\n")

if spares_data['referencias_encontradas']:
    print(f"🔖 Primeiras 15 referências encontradas:\n")
    for ref in spares_data['referencias_encontradas'][:15]:
        print(f"   • {ref}")

print()

doc.close()
