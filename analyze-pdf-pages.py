import fitz  # PyMuPDF
from pathlib import Path
import json

def analyze_pdf_structure(pdf_path):
    """Analisa estrutura do PDF para identificar páginas com potenciais tabelas"""
    
    print(f"\n{'='*80}")
    print(f"Analisando estrutura: {pdf_path.name}")
    print(f"{'='*80}\n")
    
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    
    analysis = {
        "arquivo": pdf_path.name,
        "total_paginas": total_pages,
        "paginas_com_tabelas_potenciais": [],
        "paginas_com_texto": [],
        "paginas_com_muitas_linhas": [],
        "metadados": {}
    }
    
    # Metadados
    metadata = doc.metadata
    if metadata:
        analysis["metadados"] = metadata
        print("METADADOS DO PDF:")
        for key, value in metadata.items():
            if value:
                print(f"  {key}: {value}")
        print()
    
    # Analisar cada página
    print("Analisando páginas...")
    print("(Procurando por páginas com mais elementos gráficos = possíveis tabelas)\n")
    
    for page_num in range(total_pages):
        page = doc[page_num]
        
        # Contar elementos
        num_images = len(page.get_images())
        text = page.get_text()
        text_length = len(text.strip())
        
        # Contar linhas/retângulos (indicativo de tabelas)
        drawings = page.get_drawings()
        num_lines = len(drawings) if drawings else 0
        
        # Páginas com texto
        if text_length > 50:
            analysis["paginas_com_texto"].append({
                "pagina": page_num + 1,
                "caracteres": text_length,
                "preview": text[:200].replace('\n', ' ')
            })
        
        # Páginas com muitas linhas (possíveis tabelas)
        if num_lines > 20:
            analysis["paginas_com_muitas_linhas"].append({
                "pagina": page_num + 1,
                "linhas": num_lines,
                "imagens": num_images
            })
        
        # Heurística: páginas com texto específico técnico
        text_upper = text.upper()
        keywords_specs = [
            'CAPACITY', 'PERSON', 'CO2', 'CYLINDER',
            'PRESSURE', 'PSI', 'VALVE', 'WEAK LINK',
            'DAVIT', 'TORQUE', 'SPECIFICATION', 'WEIGHT'
        ]
        
        keywords_found = sum(1 for kw in keywords_specs if kw in text_upper)
        
        if keywords_found >= 3:  # Se encontrar 3+ palavras-chave
            analysis["paginas_com_tabelas_potenciais"].append({
                "pagina": page_num + 1,
                "keywords_encontradas": keywords_found,
                "linhas_graficas": num_lines,
                "preview": text[:150].replace('\n', ' ') if text else "(escaneada)"
            })
    
    doc.close()
    
    # Relatório
    print(f"\n{'─'*80}")
    print("RESUMO DA ANÁLISE")
    print(f"{'─'*80}\n")
    
    print(f"Total de páginas: {total_pages}")
    print(f"Páginas com texto editável: {len(analysis['paginas_com_texto'])}")
    print(f"Páginas com muitos elementos gráficos: {len(analysis['paginas_com_muitas_linhas'])}")
    print(f"Páginas com keywords técnicas: {len(analysis['paginas_com_tabelas_potenciais'])}")
    
    if analysis['paginas_com_tabelas_potenciais']:
        print(f"\n{'─'*80}")
        print("PÁGINAS PROMISSORAS (possíveis especificações):")
        print(f"{'─'*80}\n")
        for page_info in analysis['paginas_com_tabelas_potenciais'][:20]:  # Top 20
            print(f"  Página {page_info['pagina']:3d} - "
                  f"{page_info['keywords_encontradas']} keywords, "
                  f"{page_info['linhas_graficas']} linhas")
            if page_info.get('preview'):
                print(f"    {page_info['preview'][:100]}")
    
    if analysis['paginas_com_muitas_linhas']:
        print(f"\n{'─'*80}")
        print("PÁGINAS COM TABELAS/GRÁFICOS (muitas linhas):")
        print(f"{'─'*80}\n")
        top_pages = sorted(analysis['paginas_com_muitas_linhas'], 
                          key=lambda x: x['linhas'], reverse=True)[:15]
        for page_info in top_pages:
            print(f"  Página {page_info['pagina']:3d} - "
                  f"{page_info['linhas']} linhas gráficas, "
                  f"{page_info['imagens']} imagens")
    
    return analysis


def create_page_guide(analyses):
    """Cria guia de páginas específicas para consulta"""
    
    print(f"\n\n{'='*80}")
    print("GUIA RÁPIDO DE PÁGINAS PARA CONSULTA MANUAL")
    print(f"{'='*80}\n")
    
    for analysis in analyses:
        print(f"\n📄 {analysis['arquivo']}")
        print(f"{'─'*80}")
        
        # Páginas promissoras organizadas
        if analysis['paginas_com_tabelas_potenciais']:
            paginas = [p['pagina'] for p in analysis['paginas_com_tabelas_potenciais']]
            ranges = get_page_ranges(paginas)
            print(f"  🎯 Verificar páginas: {ranges}")
        
        if analysis['paginas_com_muitas_linhas']:
            top_5 = sorted(analysis['paginas_com_muitas_linhas'], 
                          key=lambda x: x['linhas'], reverse=True)[:5]
            paginas = [p['pagina'] for p in top_5]
            print(f"  📊 Páginas com mais tabelas: {', '.join(map(str, paginas))}")
        
        # Sugestão de ordem de busca
        all_promising = set()
        for p in analysis['paginas_com_tabelas_potenciais']:
            all_promising.add(p['pagina'])
        for p in analysis['paginas_com_muitas_linhas'][:10]:
            all_promising.add(p['pagina'])
        
        if all_promising:
            sorted_pages = sorted(list(all_promising))[:15]
            print(f"  ✅ Ordem sugerida: {', '.join(map(str, sorted_pages))}")
        
        print()


def get_page_ranges(pages):
    """Converte lista de páginas em ranges (ex: 1-5, 10-12, 20)"""
    if not pages:
        return ""
    
    pages = sorted(set(pages))
    ranges = []
    start = pages[0]
    end = pages[0]
    
    for i in range(1, len(pages)):
        if pages[i] == end + 1:
            end = pages[i]
        else:
            if start == end:
                ranges.append(str(start))
            else:
                ranges.append(f"{start}-{end}")
            start = pages[i]
            end = pages[i]
    
    # Último range
    if start == end:
        ranges.append(str(start))
    else:
        ranges.append(f"{start}-{end}")
    
    return ", ".join(ranges)


def main():
    base_path = Path(r"c:\Users\julio\Desktop\APLICACAO MASTER\LIFERAFT1.0\gestor-naval-pro\MARCAS")
    
    pdfs = [
        base_path / "Seasava Plus.pdf",
        base_path / "Seasava Plus X E R.pdf"
    ]
    
    all_analyses = []
    
    for pdf_path in pdfs:
        if pdf_path.exists():
            analysis = analyze_pdf_structure(pdf_path)
            all_analyses.append(analysis)
        else:
            print(f"❌ Arquivo não encontrado: {pdf_path}")
    
    # Salvar análise
    output_file = "seasava-pdf-analysis.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_analyses, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*80}")
    print(f"Análise completa salva em: {output_file}")
    print(f"{'='*80}")
    
    # Criar guia
    create_page_guide(all_analyses)
    
    print(f"\n{'='*80}")
    print("RECOMENDAÇÃO FINAL")
    print(f"{'='*80}\n")
    print("""
Com base na análise estrutural dos PDFs:

1. Use o GUIA-EXTRACAO-SEASAVA.md para orientação completa
  
2. Consulte as páginas específicas identificadas acima
   (páginas com maior probabilidade de conter especificações)

3. Preencha SEASAVA-TEMPLATE-SPECS.json com as informações encontradas

4. Para páginas específicas que contenham tabelas importantes,
   posso criar scripts de OCR direcionados se você informar os números
    """)

if __name__ == "__main__":
    main()
