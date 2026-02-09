import pdfplumber
import json
import re

pdf_path = r'MARCAS\Eurovinil Leisure Syntesy Liferafts & Crewsaver ISO Type1(2) Mk 2 Mariner Mk 2_1.pdf'

print("="*80)
print("BUSCA ESPECÍFICA: TABELA 3.3 - ESPECIFICAÇÕES DE CILINDROS")
print("="*80)

pdf = pdfplumber.open(pdf_path)
total_pages = len(pdf.pages)

# Procurar por "TABLE 3.3" ou "table 3.3"
print("\nProcurando Tabela 3.3...")

for i in range(total_pages):
    page = pdf.pages[i]
    text = page.extract_text()
    
    if text and ('TABLE 3.3' in text.upper() or 'TABLE 3' in text.upper()):
        print(f"\n{'='*80}")
        print(f"[PÁGINA {i+1} - CONTÉM TABELA 3.X]")
        print(f"{'='*80}")
        print(text)
        
        tables = page.extract_tables()
        if tables:
            print(f"\n[{len(tables)} TABELA(S) ENCONTRADA(S)]:")
            for idx, table in enumerate(tables):
                print(f"\n--- Tabela {idx+1} ---")
                for row in table:
                    if row:
                        print(row)

# Também procurar por páginas com "CYLINDER" e numeros de capacidade
print("\n\n" + "="*80)
print("BUSCANDO PÁGINAS COM DADOS DE CILINDROS E CAPACIDADES")
print("="*80)

for i in range(total_pages):
    page = pdf.pages[i]
    text = page.extract_text()
    
    if text:
        text_upper = text.upper()
        
        # Procurar páginas que tenham CYLINDER + números como 4P, 6P, 8P etc
        if 'CYLINDER' in text_upper and any(cap in text_upper for cap in ['4P', '6P', '8P', '10P', '12P', '16P', '20P', '25P']):
            # E que também tenham dados de CO2 ou pesos
            if 'CO2' in text_upper or 'KG' in text_upper or 'WEIGHT' in text_upper:
                print(f"\n{'='*80}")
                print(f"[PÁGINA {i+1} - CILINDROS + CAPACIDADES + PESOS]")
                print(f"{'='*80}")
                print(text[:2000])  # Primeiros 2000 caracteres
                
                tables = page.extract_tables()
                if tables:
                    print(f"\n[{len(tables)} TABELA(S)]:")
                    for idx, table in enumerate(tables):
                        print(f"\n--- Tabela {idx+1} (completa) ---")
                        for row in table:
                            if row:
                                print(row)
                
                print("\n" + "="*80)

pdf.close()

print("\n\nBUSCA COMPLETA!")
