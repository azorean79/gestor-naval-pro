#!/usr/bin/env python3
"""
Inspeciona as páginas do manual LR97 para encontrar a estrutura das spare parts
"""

import fitz
import re

pdf_path = "manuais/LR 97 for 6 to 25 persons TO & LR 97 L for 12 to 25 persons DL_0.pdf"
doc = fitz.open(pdf_path)

print(f"Total de páginas: {doc.page_count}\n")

# Procurar por páginas com keywords relevantes
keywords = [
    r'spare\s*part',
    r'parts?\s*list',
    r'component',
    r'item\s*no',
    r'part\s*no',
    r'article',
    r'pièce',
    r'ersatzteil'
]

print("Procurando páginas com keywords relevantes...\n")

relevant_pages = []

for page_num in range(doc.page_count):
    page = doc[page_num]
    text = page.get_text().lower()
    
    for keyword in keywords:
        if re.search(keyword, text):
            if page_num not in [p[0] for p in relevant_pages]:
                relevant_pages.append((page_num, keyword))
            break

print(f"Encontradas {len(relevant_pages)} páginas relevantes:\n")

for page_num, keyword in relevant_pages[:20]:  # Mostrar primeiras 20
    print(f"Página {page_num + 1}: keyword '{keyword}'")

# Mostrar texto completo das páginas 20-30 (onde normalmente estão spare parts)
print("\n" + "="*80)
print("TEXTO DAS PÁGINAS 20-30:")
print("="*80 + "\n")

for page_num in range(19, min(30, doc.page_count)):
    page = doc[page_num]
    text = page.get_text()
    
    if any(re.search(kw, text, re.IGNORECASE) for kw in keywords):
        print(f"\n{'='*80}")
        print(f"PÁGINA {page_num + 1}")
        print(f"{'='*80}\n")
        print(text[:2000])  # Primeiros 2000 caracteres
        print("\n[... truncado ...]\n")

# Também verificar páginas específicas que foram mencionadas no JSON original (24 e 88)
print("\n" + "="*80)
print("PÁGINAS ESPECÍFICAS (24 e 88):")
print("="*80 + "\n")

for page_num in [23, 87]:  # 0-indexed
    if page_num < doc.page_count:
        page = doc[page_num]
        text = page.get_text()
        
        print(f"\n{'='*80}")
        print(f"PÁGINA {page_num + 1}")
        print(f"{'='*80}\n")
        print(text)

doc.close()
