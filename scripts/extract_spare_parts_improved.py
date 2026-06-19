#!/usr/bin/env python3
"""
Extrai spare parts do manual MK IV PDF - Versão melhorada
Foca nas seções de Illustrated Parts List e tabelas específicas
"""

import fitz  # PyMuPDF
import re
import json
import argparse
from typing import List, Dict, Any, Tuple

def extract_tables_from_page(page: fitz.Page) -> List[Dict]:
    """Extrai tabelas de uma página usando análise de layout"""
    text = page.get_text("dict")
    parts = []
    
    # Procurar por blocos de texto que parecem tabelas
    for block in text.get("blocks", []):
        if block.get("type") == 0:  # text block
            for line in block.get("lines", []):
                line_text = ""
                for span in line.get("spans", []):
                    line_text += span.get("text", "") + " "
                
                # Pattern para part number + descrição em tabelas
                # Formato típico: "12345-XX    Description here"
                match = re.match(r'^([A-Z0-9]{4,}[-/][A-Z0-9]+)\s{2,}(.+?)(?:\s{2,}|\$)', line_text.strip())
                if match:
                    parts.append({
                        'part_number': match.group(1).strip(),
                        'description': match.group(2).strip()[:150]
                    })
    
    return parts

def find_parts_list_sections(pdf_path: str) -> List[Tuple[int, int]]:
    """Identifica seções do Illustrated Parts List"""
    doc = fitz.open(pdf_path)
    sections = []
    in_parts_section = False
    section_start = None
    
    for page_num in range(doc.page_count):
        page = doc[page_num]
        text = page.get_text()
        
        # Detectar início de seção de parts list
        if re.search(r'ILLUSTRATED\s+PARTS?\s+LIST', text, re.IGNORECASE):
            if not in_parts_section:
                section_start = page_num + 1
                in_parts_section = True
                print(f"📖 Início de Parts List na página {page_num + 1}")
        
        # Detectar fim (normalmente quando começa nova seção ou índice)
        if in_parts_section and re.search(r'(APPENDIX|INDEX|END OF|NOTES?:)', text, re.IGNORECASE):
            sections.append((section_start, page_num))
            print(f"   Fim na página {page_num}")
            in_parts_section = False
            section_start = None
    
    # Se ainda estava numa seção, fechar
    if in_parts_section and section_start:
        sections.append((section_start, doc.page_count))
    
    doc.close()
    return sections

def extract_spare_parts_enhanced(pdf_path: str) -> List[Dict[str, Any]]:
    """Extração inteligente focada em spare parts reais"""
    doc = fitz.open(pdf_path)
    all_parts = []
    seen_parts = set()
    
    print(f"\n🔍 Analisando manual MK IV ({doc.page_count} páginas)...\n")
    
    # Páginas específicas conhecidas com spare parts (baseado no scan anterior)
    spare_parts_ranges = [
        (173, 182),   # Spare Parts section
        (440, 473),   # Illustrated Parts List principal
        (543, 572),   # Mais parts lists
    ]
    
    for start, end in spare_parts_ranges:
        print(f"📋 Processando páginas {start}-{end}...")
        
        for page_num in range(start - 1, min(end, doc.page_count)):
            page = doc[page_num]
            text = page.get_text()
            
            # Procurar padrões de part number mais rigorosos
            # Formato comum: XXXXX-XX ou XXX-XXXX seguido de descrição
            patterns = [
                # Pattern 1: código-número seguido de descrição (tabela)
                r'^([A-Z0-9]{3,6}[-/][A-Z0-9]{2,6})\s{2,}([A-Z][a-z\s,\(\)\.]+(?:[A-Z][a-z\s,\(\)\.]+)*)',
                # Pattern 2: "Part No:" ou "Part Number:" seguido de código
                r'Part\s+No\.?[:]\s*([A-Z0-9]{3,6}[-/][A-Z0-9]{2,6})\s+(.{15,100})',
                # Pattern 3: Tabela com Item | Part No | Description
                r'^\s*\d+\s+([A-Z0-9]{3,6}[-/][A-Z0-9]{2,6})\s+(.{10,100})',
            ]
            
            for pattern in patterns:
                matches = re.finditer(pattern, text, re.MULTILINE)
                for match in matches:
                    pn = match.group(1).strip()
                    desc = match.group(2).strip()
                    
                    # Filtros de qualidade
                    if (len(pn) >= 5 and 
                        len(desc) >= 10 and 
                        pn not in seen_parts and
                        not re.match(r'^(Page|MARINE|MKIV|Manual)', pn)):
                        
                        seen_parts.add(pn)
                        all_parts.append({
                            'part_number': pn,
                            'description': desc[:150],
                            'source_page': page_num + 1,
                            'categoria': 'Jangada MK IV',
                            'codigoFabricante': pn,
                            'associavelJangada': True,
                            'aplicavelModeloJangada': 'MK IV'
                        })
                        
                        print(f"  ✓ {pn}: {desc[:50]}...")
    
    doc.close()
    
    print(f"\n✅ {len(all_parts)} spare parts únicas extraídas\n")
    return all_parts

def categorize_parts(parts: List[Dict]) -> Dict[str, List[Dict]]:
    """Categoriza partes por tipo"""
    categories = {
        'Gás e Inflação': [],
        'Estrutural': [],
        'Equipamento': [],
        'Sinalizacão': [],
        'Sobrevivência': [],
        'Outros': []
    }
    
    keywords = {
        'Gás e Inflação': ['gas', 'cylinder', 'valve', 'inflation', 'co2', 'pressure'],
        'Estrutural': ['tube', 'chamber', 'floor', 'canopy', 'fabric', 'seam'],
        'Equipamento': ['kit', 'pack', 'rope', 'line', 'paddle', 'oar'],
        'Sinalizacão': ['light', 'beacon', 'flare', 'mirror', 'whistle'],
        'Sobrevivência': ['water', 'ration', 'medical', 'first aid', 'survival'],
    }
    
    for part in parts:
        desc_lower = part['description'].lower()
        categorized = False
        
        for category, kws in keywords.items():
            if any(kw in desc_lower for kw in kws):
                categories[category].append(part)
                categorized = True
                break
        
        if not categorized:
            categories['Outros'].append(part)
    
    return categories

def generate_stock_sql_enhanced(parts: List[Dict[str, Any]], output_sql: str):
    """Gera SQL otimizado para inserir na tabela Stock"""
    
    # Categorizar partes
    categorized = categorize_parts(parts)
    
    sql_lines = [
        "-- Spare Parts do Manual MK IV - Inserção Otimizada",
        "-- Gerado automaticamente",
        "-- Total: {} partes".format(len(parts)),
        ""
    ]
    
    for category, category_parts in categorized.items():
        if not category_parts:
            continue
            
        sql_lines.append(f"\n-- Categoria: {category} ({len(category_parts)} itens)")
        sql_lines.append("")
        
        for part in category_parts:
            desc = part['description'].replace("'", "''")
            pn = part['part_number'].replace("'", "''")
            cat = category if category != 'Outros' else 'Jangada MK IV'
            
            sql = f"""INSERT INTO "Stock" ("referencia", "descricao", "categoria", "codigoFabricante", "associavelJangada", "aplicavelModeloJangada", "precoVenda", "quantidade", "createdAt", "updatedAt")
VALUES ('{pn}', '{desc}', '{cat}', '{pn}', true, 'MK IV', 0.00, 0, NOW(), NOW())
ON CONFLICT ("referencia") DO UPDATE SET "descricao" = EXCLUDED."descricao", "categoria" = EXCLUDED."categoria", "updatedAt" = NOW();
"""
            sql_lines.append(sql)
    
    # Salvar SQL
    with open(output_sql, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    
    print(f"\n📝 SQL gerado: {output_sql}")
    print(f"   Categorias:")
    for cat, items in categorized.items():
        if items:
            print(f"   - {cat}: {len(items)} itens")

def main():
    parser = argparse.ArgumentParser(description='Extrair spare parts do manual MK IV (versão melhorada)')
    parser.add_argument('--pdf', required=True, help='Caminho para o PDF do manual')
    parser.add_argument('--json', default='tmp_spare_parts_mk4_clean.json', help='Ficheiro JSON de saída')
    parser.add_argument('--sql', default='tmp_spare_parts_mk4_clean.sql', help='Ficheiro SQL de saída')
    
    args = parser.parse_args()
    
    # Extrair spare parts com método melhorado
    parts = extract_spare_parts_enhanced(args.pdf)
    
    if parts:
        # Salvar JSON
        with open(args.json, 'w', encoding='utf-8') as f:
            json.dump(parts, f, indent=2, ensure_ascii=False)
        print(f"💾 JSON salvo: {args.json}")
        
        # Gerar SQL
        generate_stock_sql_enhanced(parts, args.sql)
        
        print(f"\n✅ Concluído!")
        print(f"\n📊 Próximos passos:")
        print(f"   1. Revisar: {args.json}")
        print(f"   2. Executar no PostgreSQL: {args.sql}")
        print(f"   3. Verificar tabela Stock na aplicação")
    else:
        print("\n⚠️  Nenhuma spare part válida encontrada!")

if __name__ == '__main__':
    main()
