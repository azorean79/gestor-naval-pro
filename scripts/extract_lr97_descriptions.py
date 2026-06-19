#!/usr/bin/env python3
"""
Extrai descrições limpas para os part numbers do LR97
"""

import fitz
import re
import json

pdf_path = "manuais/LR 97 for 6 to 25 persons TO & LR 97 L for 12 to 25 persons DL_0.pdf"
doc = fitz.open(pdf_path)

# Carregar part numbers existentes
with open('tmp_lr97_parts_corrected.json', 'r', encoding='utf-8') as f:
    parts = json.load(f)

print(f"Processando {len(parts)} part numbers para extrair descricoes...\n")

# Criar mapeamento de part_number -> melhor descrição
descriptions = {}

for part in parts:
    pn = part['part_number']
    page_num = part['source_page'] - 1  # 0-indexed
    
    page = doc[page_num]
    text = page.get_text()
    
    # Encontrar a linha com o part number
    lines = text.split('\n')
    
    # Procurar contexto ao redor do part number
    for i, line in enumerate(lines):
        if pn in line:
            # Coletar linhas antes e depois para contexto
            context_before = lines[max(0, i-5):i]
            context_after = lines[i:min(len(lines), i+6)]
            
            # Tentar extrair descrição das linhas próximas
            description = ""
            
            # Padrão 1: DSB-Art.-No.: X.XX.XX.XX.X [descrição antes]
            if 'DSB-Art.-No.:' in line or 'DSB-art.-no.:' in line or 'Art.-No.:' in line or 'art.-no.:' in line or 'part-no:' in line or 'part.-no.' in line:
                # Descrição geralmente está nas linhas anteriores
                for prev_line in reversed(context_before):
                    prev_line = prev_line.strip()
                    if prev_line and len(prev_line) > 5 and not prev_line.startswith('DSB') and not prev_line.startswith('Chapter') and not re.match(r'^\d+$', prev_line):
                        description = prev_line
                        break
           
            # Padrão 2: tabelas (Art.-No. em coluna, descrição pode estar em outra)
            # Isso requer análise mais sofisticada, vou registrar "context" por enquanto
           
            if not description:
                # Fallback: usar a própria linha ou linha anterior
                current = line.replace(pn, '').replace('DSB-Art.-No.:', '').replace('DSB-art.-no.:', '').replace('Art.-No.:', '').replace('art.-no.:', '').replace('part-no:', '').replace('part.-no.', '').strip()
                if current and len(current) > 5:
                    description = current
                elif context_before:
                    for prev_line in reversed(context_before[-3:]):
                        prev_line = prev_line.strip()
                        if prev_line and len(prev_line) > 5:
                            description = prev_line
                            break
            
            # Limpar e truncar descrição
            if description:
                description = ' '.join(description.split())  # Normalizar espaços
                description = description[:150]  # Truncar
            
            descriptions[pn] = description if description else f"Peça LR97 - Página {part['source_page']}"
            
            print(f"{pn}: {descriptions[pn]}")
            break

# Atualizar JSON com descrições melhores
for part in parts:
    pn = part['part_number']
    if pn in descriptions:
        part['description'] = descriptions[pn]

# Salvar JSON atualizado
with open('tmp_lr97_parts_final.json', 'w', encoding='utf-8') as f:
    json.dump(parts, f, indent=2, ensure_ascii=False)

print(f"\nJSON atualizado salvo em: tmp_lr97_parts_final.json")

doc.close()
