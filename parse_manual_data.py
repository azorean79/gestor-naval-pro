#!/usr/bin/env python3
import json
import re
from pathlib import Path
from collections import defaultdict

# Mapear manuais para marcas/modelos
manual_mapping = {
    "LR97": {"marca": "DSB", "modelo": "LR97"},
    "LR05": {"marca": "DSB", "modelo": "LR05"},
    "MK IV": {"marca": "SURVIVA", "modelo": "MK IV"},
    "MkIII": {"marca": "SURVIVA", "modelo": "MkIII"},
    "Seasava Plus": {"marca": "SEASAVA", "modelo": "Plus"},
    "Seasava Plus X E R": {"marca": "SEASAVA", "modelo": "Plus X E R"},
    "Eurovinil": {"marca": "EUROVINIL", "modelo": "Leisure Syntesy"}
}

extracted_dir = Path("extracted_manuals")
output_file = Path("manual_specifications.json")

all_specs = {}

print("\n📊 Analisando manuais extraídos...\n")

for summary_file in sorted(extracted_dir.glob("*_summary.json")):
    with open(summary_file, 'r', encoding='utf-8') as f:
        summary = json.load(f)
    
    # Determinar marca/modelo
    base_name = summary_file.stem.replace("_summary", "")
    
    # Encontrar correspondência
    marca = "DESCONHECIDO"
    modelo = base_name
    
    for key, mapping in manual_mapping.items():
        if key in base_name:
            marca = mapping["marca"]
            modelo = mapping["modelo"]
            break
    
    print(f"📄 {base_name}")
    print(f"   Marca: {marca}, Modelo: {modelo}")
    print(f"   Páginas: {summary['páginas']}")
    print(f"   Tabelas: {summary['tabelas']}")
    print(f"   Keywords: {summary['keywords']}")
    
    # Extrair texto completo
    text_file = summary_file.parent / f"{summary_file.stem.replace('_summary', '')}_extracted.txt"
    if text_file.exists():
        with open(text_file, 'r', encoding='utf-8') as f:
            full_text = f.read()
        
        # Procurar especificações
        specs = {}
        
        # Capacidade
        capacity_match = re.search(r'(?:capacity|capacidade|persons?|pessoab|occupants?)[:\s]+(\d+)\s*(?:to|para|–|-)\s*(\d+)', full_text, re.IGNORECASE)
        if capacity_match:
            specs['capacidade_minima'] = int(capacity_match.group(1))
            specs['capacidade_maxima'] = int(capacity_match.group(2))
        
        # Peso
        weight_match = re.search(r'(?:weight|peso)[:\s]+(?:approx\.|aprox\.)?[\s]*(\d+(?:[.,]\d+)?)\s*(?:kg|kilogram)', full_text, re.IGNORECASE)
        if weight_match:
            specs['peso_kg'] = float(weight_match.group(1).replace(',', '.'))
        
        # Temperatura
        temp_match = re.search(r'temperature[:\s]+(?:from|de)?[\s]*(-?\d+)\s*(?:to|até|°|a)\s*(?:\+)?(\d+)\s*°?[CD]', full_text, re.IGNORECASE)
        if temp_match:
            specs['temperatura_min'] = int(temp_match.group(1))
            specs['temperatura_max'] = int(temp_match.group(2))
        
        # Dimensões
        dim_match = re.search(r'(?:dimension|length|comprimento)[:\s]+(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)\s*(?:[xX×]\s*(\d+(?:[.,]\d+)?))?', full_text, re.IGNORECASE)
        if dim_match:
            specs['dimensao'] = f"{dim_match.group(1)}x{dim_match.group(2)}" + (f"x{dim_match.group(3)}" if dim_match.group(3) else "")
        
        # SOLAS
        if 'SOLAS' in full_text:
            specs['solas_certificado'] = True
        
        # Extrair componentes/spares
        components = []
        
        # Procurar padrão "1. Item name ..."
        component_pattern = r'^(\d+)\.\s+(.+?)$'
        for line in full_text.split('\n'):
            line = line.strip()
            match = re.match(component_pattern, line)
            if match and len(line) > 10:
                components.append({
                    'numero': match.group(1),
                    'nome': match.group(2).strip()
                })
        
        specs['componentes'] = components[:50]  # Limitar a 50
        
        all_specs[f"{marca}_{modelo}"] = {
            'marca': marca,
            'modelo': modelo,
            'manual': base_name,
            'especificacoes': specs,
            'total_paginas': summary['páginas'],
            'total_tabelas': summary['tabelas'],
            'keywords_count': summary['keywords']
        }

# Salvar resultado
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(all_specs, f, indent=2, ensure_ascii=False)

print(f"\n✅ Análise completa!")
print(f"📁 Especificações salvas em: {output_file}")
print(f"\n📋 Summary das especificações encontradas:\n")

for key, data in all_specs.items():
    print(f"  {data['marca']} {data['modelo']}:")
    if data['especificacoes']:
        if 'capacidade_minima' in data['especificacoes']:
            cap_min = data['especificacoes']['capacidade_minima']
            cap_max = data['especificacoes']['capacidade_maxima']
            print(f"     • Capacidade: {cap_min} a {cap_max} pessoas")
        if 'peso_kg' in data['especificacoes']:
            print(f"     • Peso: {data['especificacoes']['peso_kg']} kg")
        if 'componentes' in data['especificacoes']:
            print(f"     • Componentes encontrados: {len(data['especificacoes']['componentes'])}")
    print()
