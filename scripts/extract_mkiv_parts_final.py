#!/usr/bin/env python3
"""
Extrai spare parts das tabelas do manual MK IV
Baseado na estrutura real das tabelas (TABLE 701, etc.)
"""

import fitz
import re
import json
from typing import List, Dict, Tuple

def extract_parts_from_tables(pdf_path: str) -> List[Dict]:
    """
    Extrai part numbers das tabelas do manual
    Formato encontrado:
    - Linha 1: Nome do item
    - Linha 2: Part number (8 dígitos numéricos)
    """
    doc = fitz.open(pdf_path)
    all_parts = []
    seen_parts = set()
    
    # Páginas com tabelas de equipamento (baseado no scan anterior)
    table_pages = list(range(173, 182)) + list(range(440, 474)) + list(range(543, 573))
    
    print(f"🔍 Analisando {len(table_pages)} páginas com tabelas...\n")
    
    for page_idx in table_pages:
        if page_idx >= doc.page_count:
            continue
            
        page = doc[page_idx]
        text = page.get_text()
        lines = text.split('\n')
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # Procurar por part numbers (geralmente 8 dígitos, às vezes com traço)
            # Formatos: 11105001, 05720107, 45201002, etc.
            part_match = re.match(r'^(\d{8}|\d{5}-\d{3}|[A-Z0-9]{3,6}-[A-Z0-9]{2,6})$', line)
            
            if part_match:
                part_num = part_match.group(1)
                
                # Tentar encontrar descrição (normalmente linha anterior)
                description = ""
                if i > 0:
                    desc_line = lines[i-1].strip()
                    # Limpar descrição de números de tabela
                    desc_line = re.sub(r'^\d+\s+', '', desc_line)
                    desc_line = re.sub(r'\s+\d+$', '', desc_line)
                    
                    if len(desc_line) > 3 and not desc_line.isdigit():
                        description = desc_line
                
                # Adicionar se for válido e único
                if part_num not in seen_parts and description:
                    seen_parts.add(part_num)
                    all_parts.append({
                        'part_number': part_num,
                        'description': description,
                        'source_page': page_idx + 1
                    })
                    print(f"✓ {part_num}: {description[:50]}")
            
            i += 1
    
    doc.close()
    
    print(f"\n✅ Total: {len(all_parts)} spare parts extraídas\n")
    return all_parts

def categorize_by_description(parts: List[Dict]) -> Dict[str, List[Dict]]:
    """Categoriza partes baseado na descrição"""
    categories = {
        'Gás e Inflação': [
            'cylinder', 'gas', 'valve', 'inflation', 'co2', 'pressure', 'prv'
        ],
        'Iluminação': [
            'light', 'torch', 'beacon', 'battery', 'bulb'
        ],
        'Sinalização': [
            'flare', 'smoke', 'signal', 'mirror', 'heliograph', 'whistle', 'reflector'
        ],
        'Sobrevivência': [
            'water', 'ration', 'food', 'first aid', 'medical', 'seasickness', 'thermal'
        ],
        'Ferramentas e Reparação': [
            'repair kit', 'knife', 'scissors', 'opener', 'leak stopper', 'bellows'
        ],
        'Cordas e Âncoras': [
            'rope', 'line', 'drogue', 'anchor', 'painter'
        ],
        'Equipamento Geral': [
            'bag', 'bailer', 'drinking', 'vessel', 'paddle', 'oar', 'fishing'
        ],
        'Containers e Embalagem': [
            'container', 'valise', 'pack', 'cover', 'bag'
        ]
    }
    
    categorized = {cat: [] for cat in categories.keys()}
    categorized['Outros'] = []
    
    for part in parts:
        desc_lower = part['description'].lower()
        found_category = False
        
        for category, keywords in categories.items():
            if any(kw in desc_lower for kw in keywords):
                categorized[category].append(part)
                found_category = True
                break
        
        if not found_category:
            categorized['Outros'].append(part)
    
    return categorized

def generate_sql_inserts(parts: List[Dict], output_file: str):
    """Gera SQL para inserir na tabela Stock"""
    categorized = categorize_by_description(parts)
    
    sql_lines = [
        "-- Spare Parts do Manual MK IV",
        "-- Extraídas automaticamente das tabelas",
        f"-- Total: {len(parts)} partes únicas",
        "-- Data: $(Get-Date).ToString('yyyy-MM-dd')",
        ""
    ]
    
    for category, category_parts in categorized.items():
        if not category_parts:
            continue
        
        sql_lines.append(f"\n-- ═══════════════════════════════════════════")
        sql_lines.append(f"-- {category} ({len(category_parts)} itens)")
        sql_lines.append(f"-- ═══════════════════════════════════════════\n")
        
        for part in category_parts:
            desc = part['description'].replace("'", "''")
            pn = part['part_number']
            
            sql = f"""INSERT INTO "Stock" (
  "referencia",
  "descricao",
  "categoria",
  "codigoFabricante",
  "associavelJangada",
  "aplicavelMarcaJangada",
  "aplicavelModeloJangada",
  "precoVenda",
  "quantidade",
  "createdAt",
  "updatedAt"
) VALUES (
  '{pn}',
  '{desc}',
  '{category}',
  '{pn}',
  true,
  'RFD,DSB,Survitec',
  'MK IV,Surviva MKIV',
  0.00,
  0,
  NOW(),
  NOW()
)
ON CONFLICT ("referencia") DO UPDATE SET
  "descricao" = EXCLUDED."descricao",
  "categoria" = EXCLUDED."categoria",
  "associavelJangada" = EXCLUDED."associavelJangada",
  "aplicavelModeloJangada" = EXCLUDED."aplicavelModeloJangada",
  "updatedAt" = NOW();
"""
            sql_lines.append(sql)
    
    # Salvar
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    
    print(f"📝 SQL gerado: {output_file}\n")
    print("📊 Distribuição por categoria:")
    for cat, items in categorized.items():
        if items:
            print(f"   {cat:.<35} {len(items):>3} itens")

def main():
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument('--pdf', required=True)
    parser.add_argument('--json', default='tmp_mkiv_parts.json')
    parser.add_argument('--sql', default='tmp_mkiv_parts.sql')
    args = parser.parse_args()
    
    # Extrair
    parts = extract_parts_from_tables(args.pdf)
    
    if not parts:
        print("⚠️ Nenhuma parte encontrada!")
        return
    
    # Salvar JSON
    with open(args.json, 'w', encoding='utf-8') as f:
        json.dump(parts, f, indent=2, ensure_ascii=False)
    print(f"💾 JSON salvo: {args.json}")
    
    # Gerar SQL
    generate_sql_inserts(parts, args.sql)
    
    print(f"\n✅ Concluído!\n")
    print("📋 Próximos passos:")
    print(f"   1. Revisar JSON: {args.json}")
    print(f"   2. Importar para PostgreSQL: psql -f {args.sql}")
    print(f"   3. Verificar na aplicação: /departamento-tecnico")

if __name__ == '__main__':
    main()
