#!/usr/bin/env python3
"""
Examina páginas específicas do LR97 para encontrar tabelas de spare parts
"""

import fitz

pdf_path = "manuais/LR 97 for 6 to 25 persons TO & LR 97 L for 12 to 25 persons DL_0.pdf"
doc = fitz.open(pdf_path)

# Examinar páginas 150-160 e 180-190 (onde "article" foi encontrado)
pages_to_check = list(range(150, 165)) + list(range(180, 195))

for page_num in pages_to_check:
    if page_num < doc.page_count:
        page = doc[page_num]
        text = page.get_text()
        
        # Verificar se tem conteúdo que pareça spare parts / article numbers
        if any(keyword in text.lower() for keyword in ['article', 'art.', 'part', 'spare', 'component', 'item']):
            print(f"\n{'='*80}")
            print(f"PAGINA {page_num + 1}")
            print(f"{'='*80}\n")
            print(text)
            print("\n")

doc.close()
