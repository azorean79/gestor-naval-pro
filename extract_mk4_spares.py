#!/usr/bin/env python3
import json
import re
from pathlib import Path

extracted_dir = Path("extracted_manuals")
output_file = Path("MK_IV_spare_parts.json")

print("\n🔧 Extraindo spare parts do MK IV...\n")

# Ler arquivo extraído
text_file = extracted_dir / "MK IV_extracted.txt"
tables_file = extracted_dir / "MK IV_tables.json"

spare_parts = {
    "manual": "MK IV",
    "spares": [],
    "componentes": [],
    "materiais": []
}

if text_file.exists():
    with open(text_file, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Procurar seções de spare parts
    print("📄 Processando texto extraído...")
    
    # Padrões para spares
    spare_patterns = [
        r'spare\s+parts?[:\s]+(.+?)(?=\n[A-Z]|\Z)',
        r'replacement\s+parts?[:\s]+(.+?)(?=\n[A-Z]|\Z)',
        r'component[s]?[:\s]+(.+?)(?=\n[A-Z]|\Z)',
        r'equipment[:\s]+(.+?)(?=\n[A-Z]|\Z)',
        r'(?:^|\n)\d+\.\s+(.+?)(?=\n\d+\.|\Z)'
    ]
    
    for pattern in spare_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE | re.DOTALL)
        for match in matches:
            content = match.group(1).strip()
            if len(content) > 10 and len(content) < 500:
                # Limpar
                content = re.sub(r'\s+', ' ', content)
                if content not in spare_parts["spares"]:
                    spare_parts["spares"].append(content)
    
    # Procurar por listas numeradas (componentes)
    component_lines = re.findall(r'^(\d+)\.\s+(.+?)$', text, re.MULTILINE)
    for num, name in component_lines:
        if len(name) > 5 and len(name) < 200:
            name = name.strip()
            if name not in spare_parts["componentes"]:
                spare_parts["componentes"].append({
                    "numero": int(num),
                    "nome": name
                })
    
    # Procurar materiais
    material_keywords = ['inflation', 'valve', 'strap', 'rope', 'glue', 'tape', 'seal', 'patch', 
                        'light', 'mirror', 'pack', 'knife', 'seasickness', 'seasick', 'first aid', 'repair']
    
    for line in text.split('\n'):
        line = line.strip()
        for keyword in material_keywords:
            if keyword.lower() in line.lower() and len(line) > 10 and len(line) < 300:
                if line not in spare_parts["materiais"] and not line.startswith('Page'):
                    spare_parts["materiais"].append(line)
                    break

# Ler tabelas (se existirem)
if tables_file.exists():
    print("📊 Processando tabelas...")
    with open(tables_file, 'r', encoding='utf-8') as f:
        tables_data = json.load(f)
    
    spare_parts["tabelas_total"] = tables_data.get("tabelas_total", 0)
    
    # Procurar tabelas que mencionem spares
    for table_info in tables_data.get("data", []):
        page = table_info.get("página", "?")
        table_data = table_info.get("dados", [])
        
        # Converter para string para análise
        table_str = json.dumps(table_data).lower()
        
        if any(keyword in table_str for keyword in ['spare', 'component', 'equipment', 'part', 'item']):
            spare_parts["spares"].append({
                "tipo": "tabela",
                "página": page,
                "dados": table_data[:10]  # Primeiras 10 linhas
            })

# Limpar duplicatas e ordenar
spare_parts["spares"] = list(dict.fromkeys(spare_parts["spares"]))[:100]
spare_parts["componentes"] = spare_parts["componentes"][:100]
spare_parts["materiais"] = list(dict.fromkeys(spare_parts["materiais"]))[:50]

# Salvar
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(spare_parts, f, indent=2, ensure_ascii=False)

print(f"\n{'='*60}")
print(f"✅ Extração completa!")
print(f"📁 Spare parts salvos em: {output_file}\n")

print(f"📊 RESUMO MK IV:\n")
print(f"  Spares encontrados: {len(spare_parts['spares'])}")
print(f"  Componentes numerados: {len(spare_parts['componentes'])}")
print(f"  Materiais/Equipment: {len(spare_parts['materiais'])}")
print(f"  Tabelas no manual: {spare_parts.get('tabelas_total', '?')}\n")

if spare_parts['componentes'][:10]:
    print(f"📋 Primeiros 10 componentes:\n")
    for comp in spare_parts['componentes'][:10]:
        print(f"  {comp['numero']}. {comp['nome']}")

print()
