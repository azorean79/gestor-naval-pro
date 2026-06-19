#!/usr/bin/env python3
"""
Extrai spare parts do manual MK IV PDF
Procura por seções com "SPARE PARTS", "PARTS LIST", "PART NUMBER", etc
Gera SQL para inserir na tabela Stock
"""

import fitz  # PyMuPDF
import re
import json
import argparse
from pathlib import Path
from typing import List, Dict, Any

def search_pages_for_keywords(pdf_path: str, keywords: List[str]) -> Dict[int, List[str]]:
    """Procura por keywords específicas em todas as páginas"""
    doc = fitz.open(pdf_path)
    results = {}
    
    for page_num in range(doc.page_count):
        page = doc[page_num]
        text = page.get_text()
        
        found_keywords = []
        for keyword in keywords:
            if re.search(keyword, text, re.IGNORECASE):
                found_keywords.append(keyword)
        
        if found_keywords:
            results[page_num + 1] = {
                'keywords': found_keywords,
                'text_preview': text[:1000]
            }
            print(f"✓ Página {page_num + 1}: encontradas keywords {found_keywords}")
    
    doc.close()
    return results

def extract_part_numbers_from_text(text: str) -> List[Dict[str, str]]:
    """Extrai part numbers e descrições de texto"""
    parts = []
    
    # Padrões comuns para part numbers
    patterns = [
        # Pattern: código alfanumérico seguido de descrição
        r'([A-Z0-9]{3,}[-/]?[A-Z0-9]+)\s+(.{10,100})',
        # Pattern: número de parte em tabelas
        r'Part\s*No[.:]?\s*([A-Z0-9-/]+)\s+(.{10,100})',
        r'Part\s*Number[:]?\s*([A-Z0-9-/]+)\s+(.{10,100})',
        r'Item\s*[:]?\s*([A-Z0-9-/]+)\s+(.{10,100})',
    ]
    
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
        for match in matches:
            part_num = match.group(1).strip()
            description = match.group(2).strip()
            
            # Filtrar resultados irrelevantes
            if len(part_num) >= 3 and len(description) >= 5:
                parts.append({
                    'part_number': part_num,
                    'description': description[:200]  # Limitar tamanho
                })
    
    return parts

def extract_spare_parts_from_pdf(pdf_path: str, output_json: str = None) -> List[Dict[str, Any]]:
    """Extrai todas as spare parts do PDF"""
    doc = fitz.open(pdf_path)
    all_parts = []
    seen_part_numbers = set()
    
    print(f"\n📖 Analisando {doc.page_count} páginas do manual...\n")
    
    # Primeiro, encontrar seções relevantes
    keywords = [
        r'SPARE\s*PARTS?',
        r'PARTS?\s*LIST',
        r'PART\s*NUMBER',
        r'REPLACEMENT\s*PARTS?',
        r'COMPONENTS?',
        r'KIT\s*CONTENTS?',
        r'ITEMS?\s*LIST'
    ]
    
    relevant_pages = search_pages_for_keywords(pdf_path, keywords)
    
    print(f"\n📋 Encontradas {len(relevant_pages)} páginas relevantes\n")
    
    # Extrair de páginas relevantes primeiro
    for page_num, info in relevant_pages.items():
        page = doc[page_num - 1]
        text = page.get_text()
        
        parts_on_page = extract_part_numbers_from_text(text)
        for part in parts_on_page:
            pn = part['part_number']
            if pn not in seen_part_numbers:
                seen_part_numbers.add(pn)
                all_parts.append({
                    'part_number': pn,
                    'description': part['description'],
                    'source_page': page_num,
                    'categoria': 'Jangada MK IV',
                    'associavelJangada': True,
                    'aplicavelModeloJangada': 'MK IV'
                })
                print(f"  + {pn}: {part['description'][:60]}...")
    
    # Se encontrarmos poucas partes, fazer scan completo
    if len(all_parts) < 50:
        print("\n🔍 Poucas partes encontradas, fazendo scan completo...\n")
        
        for page_num in range(doc.page_count):
            if (page_num + 1) % 50 == 0:
                print(f"  Processando página {page_num + 1}/{doc.page_count}...")
            
            page = doc[page_num]
            text = page.get_text()
            
            parts_on_page = extract_part_numbers_from_text(text)
            for part in parts_on_page:
                pn = part['part_number']
                if pn not in seen_part_numbers:
                    seen_part_numbers.add(pn)
                    all_parts.append({
                        'part_number': pn,
                        'description': part['description'],
                        'source_page': page_num + 1,
                        'categoria': 'Jangada MK IV',
                        'associavelJangada': True,
                        'aplicavelModeloJangada': 'MK IV'
                    })
    
    doc.close()
    
    print(f"\n✅ Total de {len(all_parts)} spare parts únicas extraídas\n")
    
    # Salvar JSON se solicitado
    if output_json:
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(all_parts, f, indent=2, ensure_ascii=False)
        print(f"💾 JSON salvo em: {output_json}\n")
    
    return all_parts

def generate_stock_sql(parts: List[Dict[str, Any]], output_sql: str):
    """Gera SQL para inserir na tabela Stock"""
    
    sql_inserts = [
        "-- Spare Parts extraídas do Manual MK IV",
        "-- Gerado automaticamente",
        ""
    ]
    
    for part in parts:
        # Escapar aspas simples
        desc = part['description'].replace("'", "''")
        pn = part['part_number'].replace("'", "''")
        
        sql = f"""INSERT INTO "Stock" (
  "referencia",
  "descricao",
  "categoria",
  "codigoFabricante",
  "associavelJangada",
  "aplicavelModeloJangada",
  "precoVenda",
  "quantidade",
  "createdAt",
  "updatedAt"
) VALUES (
  '{pn}',
  '{desc}',
  'Jangada MK IV',
  '{pn}',
  true,
  'MK IV',
  0.00,
  0,
  NOW(),
  NOW()
) ON CONFLICT ("referencia") DO UPDATE SET
  "descricao" = EXCLUDED."descricao",
  "categoria" = EXCLUDED."categoria",
  "associavelJangada" = EXCLUDED."associavelJangada",
  "aplicavelModeloJangada" = EXCLUDED."aplicavelModeloJangada",
  "updatedAt" = NOW();
"""
        sql_inserts.append(sql)
    
    # Salvar SQL
    with open(output_sql, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_inserts))
    
    print(f"📝 SQL gerado em: {output_sql}")
    print(f"   Total de {len(parts)} registos")

def main():
    parser = argparse.ArgumentParser(description='Extrair spare parts do manual MK IV')
    parser.add_argument('--pdf', required=True, help='Caminho para o PDF do manual')
    parser.add_argument('--json', help='Ficheiro JSON de saída (opcional)')
    parser.add_argument('--sql', help='Ficheiro SQL de saída (opcional)')
    
    args = parser.parse_args()
    
    # Valores por defeito
    if not args.json:
        args.json = 'tmp_spare_parts_mk4.json'
    if not args.sql:
        args.sql = 'tmp_spare_parts_mk4.sql'
    
    # Extrair spare parts
    parts = extract_spare_parts_from_pdf(args.pdf, args.json)
    
    # Gerar SQL
    if parts:
        generate_stock_sql(parts, args.sql)
        print("\n✅ Concluído!")
        print(f"\n📊 Próximos passos:")
        print(f"   1. Revisar ficheiro JSON: {args.json}")
        print(f"   2. Executar SQL no PostgreSQL: {args.sql}")
        print(f"   3. Verificar Stock na aplicação")
    else:
        print("\n⚠️  Nenhuma spare part encontrada!")

if __name__ == '__main__':
    main()
