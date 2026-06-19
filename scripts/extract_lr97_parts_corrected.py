#!/usr/bin/env python3
"""
Extrai spare parts do manual LR97 usando padrões específicos de part numbers DSB
Padrão: X.XX.XX.XX.X (ex: 8.07.25.29.0, 0.03.03.17.0)
"""

import fitz
import re
import json

pdf_path = "manuais/LR 97 for 6 to 25 persons TO & LR 97 L for 12 to 25 persons DL_0.pdf"
doc = fitz.open(pdf_path)

all_parts = {}  # Use dict to avoid duplicates, key = part_number

print(f"Analisando {doc.page_count} paginas do manual LR97...\n")

# Padrão específico para DSB part numbers: X.XX.XX.XX.X
part_number_pattern = r'\b(\d\.\d{2}\.\d{2}\.\d{2}\.\d)\b'

for page_num in range(doc.page_count):
    page = doc[page_num]
    text = page.get_text()
    
    # Encontrar todos os part numbers nesta página
    matches = re.finditer(part_number_pattern, text)
    
    for match in matches:
        part_num = match.group(1)
        
        if part_num not in all_parts:
            # Extrair contexto ao redor do part number para descrição
            start_pos = max(0, match.start() - 200)
            end_pos = min(len(text), match.end() + 200)
            context = text[start_pos:end_pos]
            
            # Tentar extrair uma descrição limpa
            lines = context.split('\n')
            description = ' '.join([l.strip() for l in lines if l.strip()])[:200]
            
            all_parts[part_num] = {
                'part_number': part_num,
                'description': description,
                'source_page': page_num + 1,
                'categoria': 'Jangada LR97',
                'associavelJangada': True,
                'aplicavelModeloJangada': 'LR97'
            }
            
            print(f"Pagina {page_num + 1}: {part_num}")

print(f"\nTotal de {len(all_parts)} spare parts extraidas.\n")

# Salvar JSON
parts_list = list(all_parts.values())
with open('tmp_lr97_parts_corrected.json', 'w', encoding='utf-8') as f:
    json.dump(parts_list, f, indent=2, ensure_ascii=False)

print("JSON salvo em: tmp_lr97_parts_corrected.json\n")

# Mostrar primeiros 20
print("\nPrimeiras 20 peças:")
for i, part in enumerate(parts_list[:20]):
    print(f"{i+1}. {part['part_number']}: (página {part['source_page']})")

doc.close()
