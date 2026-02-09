import pdfplumber
import json

pdf_path = r'MARCAS\Eurovinil Leisure Syntesy Liferafts & Crewsaver ISO Type1(2) Mk 2 Mariner Mk 2_1.pdf'

print("="*80)
print("EXTRAÇÃO TABELA 3.3 - PÁGINAS 44-60")
print("="*80)

pdf = pdfplumber.open(pdf_path)

# Páginas 44-60 (índices 43-59)
for i in range(43, 60):
    if i >= len(pdf.pages):
        break
        
    page = pdf.pages[i]
    text = page.extract_text()
    
    print(f"\n{'='*80}")
    print(f"PAGINA {i+1}")
    print(f"{'='*80}")
    
    if text:
        print(text)
        
        tables = page.extract_tables()
        if tables:
            print(f"\n[{len(tables)} TABELAS]:")
            for idx, table in enumerate(tables):
                print(f"\n--- Tabela {idx+1} ---")
                for row in table:
                    if row:
                        print(row)

pdf.close()
print("\nCOMPLETO!")
