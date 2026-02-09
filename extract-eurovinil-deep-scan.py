import pdfplumber
import json
import re

pdf_path = r'MARCAS\Eurovinil Leisure Syntesy Liferafts & Crewsaver ISO Type1(2) Mk 2 Mariner Mk 2_1.pdf'

print("="*80)
print("BUSCA COMPLETA POR TABELAS DE ESPECIFICAÇÕES")
print("="*80)

pdf = pdfplumber.open(pdf_path)
total_pages = len(pdf.pages)
print(f'\n📄 Total de páginas: {total_pages}')

# Procurar páginas com keywords críticas
print("\n🔍 ESCANEANDO TODO O PDF POR PÁGINAS COM ESPECIFICAÇÕES...")
print("="*80)

paginas_relevantes = []

for i in range(total_pages):
    page = pdf.pages[i]
    text = page.extract_text()
    
    if text:
        text_upper = text.upper()
        
        # Procurar por keywords que indicam tabelas de specs
        keywords_criticas = [
            'CYLINDER SIZE', 'CYLINDER TYPE', 'CO2 CAPACITY',
            'PERSONS', 'CAPACITY', 'WEAK LINK',
            'BREAKING LOAD', 'LASHING', 'STRAP',
            'CONTAINER WEIGHT', 'CONTAINER DIMENSION',
            'WORKING PRESSURE', 'INFLATION PRESSURE'
        ]
        
        found = [kw for kw in keywords_criticas if kw in text_upper]
        
        if found or ('TABLE' in text_upper and ('CO2' in text_upper or 'CYLINDER' in text_upper)):
            paginas_relevantes.append({
                'pagina': i+1,
                'keywords': found,
                'tem_tabela': len(page.extract_tables()) > 0,
                'num_tabelas': len(page.extract_tables())
            })
            print(f"\n✅ PÁGINA {i+1}: {', '.join(found)} | Tabelas: {len(page.extract_tables())}")

print(f"\n\n📊 TOTAL DE PÁGINAS RELEVANTES: {len(paginas_relevantes)}")
print("="*80)

# Extrair detalhes das páginas relevantes
print("\n\n🔍 ANALISANDO PÁGINAS RELEVANTES EM DETALHE...")
print("="*80)

especificacoes_encontradas = {
    'capacidades_co2': [],
    'weak_link': [],
    'pressoes': [],
    'container_specs': [],
    'straps_specs': []
}

for info in paginas_relevantes[:30]:  # Primeiras 30 páginas relevantes
    i = info['pagina'] - 1
    page = pdf.pages[i]
    
    print(f"\n{'='*80}")
    print(f"PÁGINA {info['pagina']} - Keywords: {', '.join(info['keywords'])}")
    print(f"{'='*80}")
    
    text = page.extract_text()
    if text:
        print(text)
        
        # Extrair tabelas
        tables = page.extract_tables()
        if tables:
            print(f"\n📊 {len(tables)} TABELA(S):")
            for idx, table in enumerate(tables):
                print(f"\n--- Tabela {idx+1} ---")
                for row in table:
                    if row:
                        print(row)
                        
                        # Detectar linhas com dados de CO2
                        row_str = str(row).upper()
                        if 'CO2' in row_str or 'CYLINDER' in row_str:
                            especificacoes_encontradas['capacidades_co2'].append({
                                'pagina': info['pagina'],
                                'dados': row
                            })
                        
                        # Detectar weak link
                        if 'WEAK' in row_str or 'LASHING' in row_str or 'STRAP' in row_str:
                            especificacoes_encontradas['weak_link'].append({
                                'pagina': info['pagina'],
                                'dados': row
                            })
                        
                        # Detectar pressão
                        if 'PRESSURE' in row_str or 'PSI' in row_str or 'BAR' in row_str:
                            especificacoes_encontradas['pressoes'].append({
                                'pagina': info['pagina'],
                                'dados': row
                            })
                        
                        # Detectar container
                        if 'CONTAINER' in row_str or 'WEIGHT' in row_str or 'DIMENSION' in row_str:
                            especificacoes_encontradas['container_specs'].append({
                                'pagina': info['pagina'],
                                'dados': row
                            })

# Salvar dados brutos encontrados
with open('eurovinil-crewsaver-dados-brutos.json', 'w', encoding='utf-8') as f:
    json.dump({
        'paginas_relevantes': paginas_relevantes,
        'especificacoes': especificacoes_encontradas
    }, f, indent=2, ensure_ascii=False)

print("\n\n" + "="*80)
print("RESUMO DE DADOS ENCONTRADOS")
print("="*80)
print(f"\n📊 Capacidades/CO2: {len(especificacoes_encontradas['capacidades_co2'])} registros")
print(f"🔗 Weak Link/Lashing: {len(especificacoes_encontradas['weak_link'])} registros")
print(f"📏 Pressões: {len(especificacoes_encontradas['pressoes'])} registros")
print(f"📦 Container: {len(especificacoes_encontradas['container_specs'])} registros")

print("\n\n" + "="*80)
print("✅ ANÁLISE COMPLETA!")
print("="*80)
print("\n📁 Arquivo gerado: eurovinil-crewsaver-dados-brutos.json")

pdf.close()
