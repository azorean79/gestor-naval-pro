import pdfplumber
import json
import re

pdf_path = r'MARCAS\Eurovinil Leisure Syntesy Liferafts & Crewsaver ISO Type1(2) Mk 2 Mariner Mk 2_1.pdf'

print("="*80)
print("ANALISANDO PDF: EUROVINIL & CREWSAVER")
print("="*80)

pdf = pdfplumber.open(pdf_path)
print(f'\n📄 Total de páginas: {len(pdf.pages)}')
print('='*80)

# Estrutura para armazenar dados
resultado = {
    "marcas": []
}

eurovinil_data = {
    "nome": "EUROVINIL",
    "modelos": []
}

crewsaver_data = {
    "nome": "CREWSAVER", 
    "modelos": []
}

# Extrair texto de todas as páginas
all_text = ""
for i, page in enumerate(pdf.pages[:150]):  # Primeiras 150 páginas
    print(f'\n{"="*80}')
    print(f'PÁGINA {i+1}')
    print(f'{"="*80}')
    
    text = page.extract_text()
    
    if text:
        all_text += f"\n\n=== PÁGINA {i+1} ===\n{text}"
        print(text)
        
        # Tentar extrair tabelas também
        tables = page.extract_tables()
        if tables:
            print(f"\n📊 TABELAS ENCONTRADAS: {len(tables)}")
            for idx, table in enumerate(tables):
                print(f"\n--- Tabela {idx+1} ---")
                for row in table:
                    if row:
                        print(row)
    else:
        print("⚠️ Página sem texto extraível (pode ser imagem)")

# Salvar texto bruto
with open('eurovinil-crewsaver-extracted.txt', 'w', encoding='utf-8') as f:
    f.write(all_text)

print("\n\n" + "="*80)
print("✅ Texto extraído salvo em: eurovinil-crewsaver-extracted.txt")
print("="*80)

# Análise de padrões para extração estruturada
print("\n\n" + "="*80)
print("ANALISANDO PADRÕES E ESPECIFICAÇÕES")
print("="*80)

# Procurar por capacidades (4P, 6P, 8P, etc)
capacidades_pattern = r'(\d+)\s*(?:P|PERSONS?|PAX|PEOPLE)'
capacidades = re.findall(capacidades_pattern, all_text, re.IGNORECASE)
print(f"\n📊 Capacidades encontradas: {set(capacidades)}")

# Procurar por CO2
co2_pattern = r'CO2.*?(\d+\.?\d*)\s*(?:kg|KG)'
co2_values = re.findall(co2_pattern, all_text, re.IGNORECASE)
print(f"\n⚗️ Valores CO2 encontrados: {co2_values}")

# Procurar por N2
n2_pattern = r'N2.*?(\d+\.?\d*)\s*(?:kg|KG)'
n2_values = re.findall(n2_pattern, all_text, re.IGNORECASE)
print(f"\n⚗️ Valores N2 encontrados: {n2_values}")

# Procurar por pressões (PSI)
psi_pattern = r'(\d+\.?\d*)\s*(?:PSI|psi)'
psi_values = re.findall(psi_pattern, all_text)
print(f"\n📏 Valores PSI encontrados: {set(psi_values)}")

# Procurar por weak link
weak_link_pattern = r'(?:weak\s*link|breaking\s*load).*?(\d+\.?\d*)\s*(?:kN|KN)'
weak_link_values = re.findall(weak_link_pattern, all_text, re.IGNORECASE)
print(f"\n🔗 Weak Link valores (kN): {weak_link_values}")

# Procurar por modelos mencionados
modelos = {
    'EUROVINIL': [],
    'CREWSAVER': []
}

if 'LEISURE' in all_text.upper():
    modelos['EUROVINIL'].append('LEISURE')
    print("✅ Modelo EUROVINIL LEISURE encontrado")
    
if 'SYNTESY' in all_text.upper():
    modelos['EUROVINIL'].append('SYNTESY')
    print("✅ Modelo EUROVINIL SYNTESY encontrado")

if 'ISO TYPE 1' in all_text.upper() or 'ISO TYPE1' in all_text.upper():
    modelos['CREWSAVER'].append('ISO TYPE 1')
    print("✅ Modelo CREWSAVER ISO TYPE 1 encontrado")

if 'ISO TYPE 2' in all_text.upper() or 'ISO TYPE2' in all_text.upper():
    modelos['CREWSAVER'].append('ISO TYPE 2')
    print("✅ Modelo CREWSAVER ISO TYPE 2 encontrado")

if 'MARINER MK 2' in all_text.upper() or 'MARINER MK2' in all_text.upper():
    modelos['CREWSAVER'].append('MARINER MK 2')
    print("✅ Modelo CREWSAVER MARINER MK 2 encontrado")

# Procurar por sistemas de insuflação
if 'THANNER' in all_text.upper():
    print("✅ Sistema THANNER mencionado")
if 'LEAFIELD' in all_text.upper():
    print("✅ Sistema LEAFIELD mencionado")

# Procurar por válvulas
valvulas_pattern = r'(?:OTS|A10|C7|VALVE)[\s-]*\d+[A-Z]*'
valvulas = re.findall(valvulas_pattern, all_text, re.IGNORECASE)
print(f"\n🔧 Válvulas encontradas: {set(valvulas)}")

print("\n\n" + "="*80)
print("ESTRUTURA DE MODELOS DETECTADA:")
print("="*80)
print(json.dumps(modelos, indent=2, ensure_ascii=False))

# Salvar análise preliminar
with open('eurovinil-crewsaver-analysis.json', 'w', encoding='utf-8') as f:
    json.dump({
        'modelos_detectados': modelos,
        'capacidades': list(set(capacidades)),
        'valores_co2': co2_values,
        'valores_n2': n2_values,
        'valores_psi': list(set(psi_values)),
        'weak_link_kn': weak_link_values,
        'valvulas': list(set(valvulas))
    }, f, indent=2, ensure_ascii=False)

pdf.close()

print("\n\n" + "="*80)
print("✅ ANÁLISE COMPLETA!")
print("="*80)
print("\n📁 Arquivos gerados:")
print("  - eurovinil-crewsaver-extracted.txt  (texto completo)")
print("  - eurovinil-crewsaver-analysis.json  (análise preliminar)")
print("\n⚠️ PRÓXIMO PASSO: Revisar o texto extraído e estruturar manualmente")
print("   as especificações em formato JSON completo.")
