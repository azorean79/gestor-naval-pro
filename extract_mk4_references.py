#!/usr/bin/env python3
import json
from pathlib import Path
import re

extracted_dir = Path("extracted_manuals")
spares_dir = Path("spare_parts_images")
output_file = Path("MK_IV_spare_parts_complete.json")

print("\n🔧 Extraindo referências de spare parts do MK IV...\n")

# Ler texto extraído
text_file = extracted_dir / "MK IV_extracted.txt"
tables_file = extracted_dir / "MK IV_tables.json"
index_file = spares_dir / "MK_IV_index.json"

spare_parts = {
    "manual": "MK IV",
    "total_paraginas": 680,
    "total_imagens": 680,
    "spares": [],
    "referencias": [],
    "componentes_numerados": [],
}

print("📄 Processando texto extraído...")

if text_file.exists():
    with open(text_file, 'r', encoding='utf-8') as f:
        full_text = f.read()
    
    # Procurar padrões de spares e referencias
    # Padrão: números + pontos + nomes
    numbered_items = re.findall(r'^(\d+)\.\s+([A-Z].+?)(?=\n|$)', full_text, re.MULTILINE)
    
    for num, item_name in numbered_items:
        if len(item_name.strip()) > 3 and len(item_name.strip()) < 200:
            spare_parts["componentes_numerados"].append({
                "numero": int(num),
                "nome": item_name.strip(),
                "tipo": "componente"
            })
    
    # Procurar por "Spare Parts" ou "Spares" sections
    spare_sections = re.split(r'(?:SPARE\s+PARTS?|SPARES|REPLACEMENT\s+PARTS?)', full_text, flags=re.IGNORECASE)
    
    for section_idx, section in enumerate(spare_sections[1:], 1):
        lines = section.split('\n')[:20]  # Primeiras 20 linhas de cada seção
        for line in lines:
            line = line.strip()
            if line and len(line) > 5 and len(line) < 300:
                if line not in [s.get("descricao", "") for s in spare_parts["spares"]]:
                    spare_parts["spares"].append({
                        "descricao": line,
                        "secao": section_idx,
                        "fonte": "texto"
                    })

# Procurar por referências (códigos, IDs, etc)
print("🔎 Procurando por referências e códigos...")

# Padrões comuns de referências
reference_patterns = [
    r'(?:Ref\.?|Reference|Código|Code|Part\s+No\.?|P/N)[:]?\s*([A-Za-z0-9\-\.]+)',
    r'([A-Z]{1,3}[-_]?\d{2,4})',  # Códigos tipo ABC-1234
    r'(?:PN|SKU)[:]?\s*([A-Za-z0-9\-]+)',
]

for pattern in reference_patterns:
    matches = re.findall(pattern, full_text, re.MULTILINE)
    for ref in matches[:50]:  # Limitar a 50 referências por padrão
        if ref not in spare_parts["referencias"] and len(ref) < 50:
            spare_parts["referencias"].append(ref)

# Mapear imagens para componentes
print("🖼️  Associando imagens aos componentes...")

if index_file.exists():
    with open(index_file, 'r', encoding='utf-8') as f:
        index_data = json.load(f)
    
    spare_parts["imagens_total"] = index_data.get("total_imagens", 0)
    
    # Associar imagens aos componentes baseado em posição
    # Assumindo que componentes aparecem em ordem nas páginas
    for comp_idx, comp in enumerate(spare_parts["componentes_numerados"]):
        # Mapear número do componente para página aproximada
        # Assumindo ~5-10 componentes por página
        page_num = min((comp_idx // 5) + 1, 680)
        
        comp["imagem"] = f"page_{page_num:03d}.png"
        comp["pagina"] = page_num

# Salvar resultado completo
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(spare_parts, f, indent=2, ensure_ascii=False)

print(f"\n{'='*60}")
print(f"✅ Extração de referências completa!\n")

print(f"📊 RESUMO - MK IV SPARE PARTS:\n")
print(f"   Total de componentes: {len(spare_parts['componentes_numerados'])}")
print(f"   Spares encontradas: {len(spare_parts['spares'])}")
print(f"   Referências extraídas: {len(spare_parts['referencias'])}")
print(f"   Imagens disponíveis: {spare_parts.get('imagens_total', 0)}\n")

if spare_parts['componentes_numerados'][:10]:
    print(f"📋 Primeiros 10 componentes:\n")
    for comp in spare_parts['componentes_numerados'][:10]:
        print(f"   {comp['numero']}. {comp['nome']}")
        print(f"      └─ Imagem: {comp.get('imagem', 'N/A')}")

if spare_parts['referencias'][:10]:
    print(f"\n🔍 Primeiras 10 referências encontradas:\n")
    for ref in spare_parts['referencias'][:10]:
        print(f"   • {ref}")

print(f"\n📁 Dados completos salvo em: {output_file}\n")
