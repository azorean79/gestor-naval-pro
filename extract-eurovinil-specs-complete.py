import pdfplumber
import json
import re

pdf_path = r'MARCAS\Eurovinil Leisure Syntesy Liferafts & Crewsaver ISO Type1(2) Mk 2 Mariner Mk 2_1.pdf'

print("="*80)
print("EXTRAÇÃO COMPLETA: EUROVINIL & CREWSAVER - ESPECIFICAÇÕES TÉCNICAS")
print("="*80)

pdf = pdfplumber.open(pdf_path)
print(f'\n📄 Total de páginas no PDF: {len(pdf.pages)}')
print('='*80)

# Extrair primeiras 50 páginas (onde geralmente estão as specs)
all_text = ""
tabelas_importantes = []

print("\n🔍 ANALISANDO PRIMEIRAS 50 PÁGINAS (ESPECIFICAÇÕES)...")
print("="*80)

for i in range(min(50, len(pdf.pages))):
    page = pdf.pages[i]
    print(f'\n{"="*80}')
    print(f'PÁGINA {i+1}')
    print(f'{"="*80}')
    
    text = page.extract_text()
    
    if text:
        all_text += f"\n\n=== PÁGINA {i+1} ===\n{text}"
        print(text[:1000])  # Primeiros 1000 caracteres
        
        # Procurar por palavras-chave importantes
        keywords = ['CYLINDER', 'CO2', 'PRESSURE', 'WEAK LINK', 'CAPACITY', 
                   'PEOPLE', 'PERSONS', 'PSI', 'SPECIFICATIONS', 'TABLE']
        
        found_keywords = [kw for kw in keywords if kw.upper() in text.upper()]
        if found_keywords:
            print(f"\n🔑 KEYWORDS: {', '.join(found_keywords)}")
        
        # Extrair tabelas
        tables = page.extract_tables()
        if tables:
            print(f"\n📊 {len(tables)} TABELA(S) ENCONTRADA(S)")
            for idx, table in enumerate(tables):
                if table and len(table) > 0:
                    print(f"\n--- Tabela {idx+1} (primeiras 5 linhas) ---")
                    for row in table[:5]:
                        if row:
                            print(row)
                    
                    # Guardar tabelas com dados de cilindros ou capacidades
                    table_text = str(table).upper()
                    if any(word in table_text for word in ['CYLINDER', 'CO2', 'CAPACITY', 'PERSON']):
                        tabelas_importantes.append({
                            'pagina': i+1,
                            'dados': table
                        })
    else:
        print("⚠️ Página sem texto extraível")

# Salvar texto completo
with open('eurovinil-crewsaver-specs-full.txt', 'w', encoding='utf-8') as f:
    f.write(all_text)

print("\n\n" + "="*80)
print("EXTRAÇÃO DE DADOS ESTRUTURADOS")
print("="*80)

# Estrutura de dados final
dados_completos = {
    "marcas": []
}

# EUROVINIL
eurovinil = {
    "nome": "EUROVINIL",
    "modelos": []
}

# CREWSAVER  
crewsaver = {
    "nome": "CREWSAVER",
    "modelos": []
}

# Padrões de busca aprimorados
print("\n🔍 Procurando especificações...")

# Buscar informações de cilindros por capacidade
cylinder_pattern = r'(\d+)\s*(?:P|PERSONS?|PEOPLE|PAX).*?(\d+\.?\d*)\s*(?:kg|KG).*?CO2'
matches = re.findall(cylinder_pattern, all_text, re.IGNORECASE | re.DOTALL)
print(f"\n⚗️ Relações Capacidade-CO2 encontradas: {matches}")

# Buscar pressões
pressure_patterns = [
    (r'(\d+\.?\d*)\s*PSI', 'PSI'),
    (r'(\d+\.?\d*)\s*(?:mmWG|mm\s*WG)', 'mmWG'),
    (r'(\d+\.?\d*)\s*(?:inH2O|in\s*H2O)', 'inH2O'),
    (r'(\d+\.?\d*)\s*(?:mbar|MBAR)', 'mbar')
]

pressoes_encontradas = {}
for pattern, unit in pressure_patterns:
    values = re.findall(pattern, all_text, re.IGNORECASE)
    if values:
        pressoes_encontradas[unit] = list(set(values))
        print(f"📏 {unit}: {list(set(values))}")

# Buscar weak link
weak_link_pattern = r'WEAK\s*LINK.*?(\d+\.?\d*)\s*(?:kN|KN)'
weak_values_kn = re.findall(weak_link_pattern, all_text, re.IGNORECASE | re.DOTALL)
print(f"\n🔗 Weak Link (kN): {weak_values_kn}")

weak_link_lbf = r'(\d+\.?\d*)\s*(?:lbf|LBF)'
weak_values_lbf = re.findall(weak_link_lbf, all_text, re.IGNORECASE)
print(f"🔗 Weak Link (lbf): {weak_values_lbf[:5]}")  # Primeiros 5

# Análise de tabelas importantes
print(f"\n\n📊 TABELAS IMPORTANTES ENCONTRADAS: {len(tabelas_importantes)}")
for tab_info in tabelas_importantes:
    print(f"\n--- Página {tab_info['pagina']} ---")
    for row in tab_info['dados'][:10]:  # Primeiras 10 linhas
        if row:
            print(row)

# Criar estrutura preliminar baseada nos dados encontrados
print("\n\n" + "="*80)
print("CRIANDO ESTRUTURA JSON PRELIMINAR")
print("="*80)

# Template de modelo
modelo_template = {
    "nome": None,
    "sistema": None,  # THANNER ou LEAFIELD
    "valvulas": [],
    "capacidades": {},
    "pressoes": {
        "psi": None,
        "mmwg": None,
        "inh2o": None,
        "milibares": None
    },
    "weak_link": {
        "throw_over_kn": None,
        "throw_over_lbf": None,
        "davit_kn": None,
        "davit_lbf": None
    },
    "contentor": {
        "tipo": None,
        "sistema_abertura": None,
        "peso_kg": None
    },
    "cintas": {
        "material": None,
        "resistencia_kn": None,
        "quantidade": None
    }
}

# Detectar modelos e criar estrutura
if 'LEISURE' in all_text.upper():
    leisure = modelo_template.copy()
    leisure['nome'] = 'LEISURE'
    eurovinil['modelos'].append(leisure)

if 'SYNTESY' in all_text.upper():
    syntesy = modelo_template.copy()
    syntesy['nome'] = 'SYNTESY'
    eurovinil['modelos'].append(syntesy)

if 'ISO TYPE 1' in all_text.upper() or 'ISO TYPE1' in all_text.upper():
    iso1 = modelo_template.copy()
    iso1['nome'] = 'ISO TYPE 1'
    crewsaver['modelos'].append(iso1)

if 'ISO TYPE 2' in all_text.upper() or 'ISO TYPE2' in all_text.upper():
    iso2 = modelo_template.copy()
    iso2['nome'] = 'ISO TYPE 2'
    crewsaver['modelos'].append(iso2)

if 'MARINER' in all_text.upper():
    mariner = modelo_template.copy()
    mariner['nome'] = 'MARINER MK 2'
    crewsaver['modelos'].append(mariner)

dados_completos['marcas'] = [eurovinil, crewsaver]

# Salvar JSON preliminar
with open('eurovinil-crewsaver-specs.json', 'w', encoding='utf-8') as f:
    json.dump(dados_completos, f, indent=2, ensure_ascii=False)

print("\n✅ Estrutura preliminar criada")
print(json.dumps(dados_completos, indent=2, ensure_ascii=False))

print("\n\n" + "="*80)
print("✅ EXTRAÇÃO COMPLETA!")
print("="*80)
print("\n📁 Arquivos gerados:")
print("  1. eurovinil-crewsaver-specs-full.txt  - Texto completo (50 primeiras páginas)")
print("  2. eurovinil-crewsaver-specs.json      - Estrutura JSON preliminar")
print("\n⚠️ AÇÃO NECESSÁRIA:")
print("  - Revisar o arquivo .txt para preencher os dados faltantes no JSON")
print("  - Procurar tabelas com especificações de cilindros, pressões e capacidades")
print("  - Completar manualmente os valores null no JSON")

pdf.close()
