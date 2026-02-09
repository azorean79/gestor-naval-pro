import re
import json
import pdfplumber
from pathlib import Path

def extract_seasava_specs(pdf_path):
    """Extrai especificações técnicas completas de manuais SEASAVA"""
    
    specs = {
        "modelo": "",
        "fabricante": "SEASAVA",
        "sistema_insuflacao": "",
        "valvulas_padrao": [],
        "capacidades": {},
        "pressao_trabalho": {},
        "davit_launch": {},
        "weak_link": {},
        "torques": {},
        "caracteristicas_especiais": []
    }
    
    all_text = ""
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"\n{'='*80}")
            print(f"Processando: {pdf_path.name}")
            print(f"Total de páginas: {len(pdf.pages)}")
            print(f"{'='*80}\n")
            
            # Extrair todo o texto
            for i, page in enumerate(pdf.pages, 1):
                text = page.extract_text()
                if text:
                    all_text += f"\n--- PÁGINA {i} ---\n{text}\n"
            
            # Extrair tabelas
            print("Extraindo tabelas...")
            for i, page in enumerate(pdf.pages, 1):
                tables = page.extract_tables()
                if tables:
                    print(f"\nPágina {i} - {len(tables)} tabela(s) encontrada(s)")
                    for j, table in enumerate(tables, 1):
                        print(f"\n  Tabela {j}:")
                        for row in table:
                            if row:
                                print(f"    {row}")
    
    except Exception as e:
        print(f"Erro ao processar PDF: {e}")
        return None
    
    # Salvar texto completo para análise
    output_txt = pdf_path.stem + "-extracted.txt"
    with open(output_txt, 'w', encoding='utf-8') as f:
        f.write(all_text)
    print(f"\nTexto completo salvo em: {output_txt}")
    
    # ANÁLISE DO TEXTO
    text_upper = all_text.upper()
    
    # 1. Nome do modelo
    if "SEASAVA PLUS X" in text_upper or "PLUS X" in text_upper:
        specs["modelo"] = "SEASAVA Plus X/E/R"
    elif "SEASAVA PLUS" in text_upper:
        specs["modelo"] = "SEASAVA Plus"
    
    # 2. Sistema de insuflação
    if "THANNER" in text_upper:
        specs["sistema_insuflacao"] = "Thanner"
    if "LEAFIELD" in text_upper:
        specs["sistema_insuflacao"] = "Leafield"
    
    # 3. Válvulas
    valvulas = re.findall(r'\b(OTS\d+|A\d+|B\d+|C\d+)\b', text_upper)
    specs["valvulas_padrao"] = list(set(valvulas))
    
    # 4. Capacidades e cilindros
    # Padrão: "6 PERSON" ou "6P" ou "6 MAN"
    capacidades_encontradas = re.findall(r'(\d+)\s*(?:PERSON|MAN|P\b)', text_upper)
    
    # Padrão CO2: "2 x 160g" ou "160g CO2"
    co2_patterns = [
        r'(\d+)\s*[xX×]\s*(\d+)\s*(?:G|GRAM)',  # 2 x 160g
        r'(\d+)\s*(?:G|GRAM).*?CO2',  # 160g CO2
        r'CO2.*?(\d+)\s*(?:G|GRAM)',  # CO2 160g
    ]
    
    # Peso total
    peso_patterns = [
        r'WEIGHT.*?(\d+(?:\.\d+)?)\s*(?:KG|KILO)',
        r'(\d+(?:\.\d+)?)\s*KG',
    ]
    
    # 5. Pressões
    pressao_psi = re.findall(r'(\d+(?:\.\d+)?)\s*PSI', all_text)
    pressao_mmwg = re.findall(r'(\d+(?:\.\d+)?)\s*(?:MM\s*WG|MMWG)', text_upper)
    pressao_inh2o = re.findall(r'(\d+(?:\.\d+)?)\s*(?:IN\s*H2O|INH2O)', text_upper)
    pressao_mbar = re.findall(r'(\d+(?:\.\d+)?)\s*(?:MBAR|MILLIBAR)', text_upper)
    
    if pressao_psi:
        specs["pressao_trabalho"]["PSI"] = float(pressao_psi[0])
    if pressao_mmwg:
        specs["pressao_trabalho"]["mmWG"] = float(pressao_mmwg[0])
    if pressao_inh2o:
        specs["pressao_trabalho"]["inH2O"] = float(pressao_inh2o[0])
    if pressao_mbar:
        specs["pressao_trabalho"]["mbar"] = float(pressao_mbar[0])
    
    # 6. Weak Link
    weak_link_kn = re.findall(r'(\d+(?:\.\d+)?)\s*KN', text_upper)
    weak_link_lbf = re.findall(r'(\d+(?:\.\d+)?)\s*LBF', text_upper)
    
    if weak_link_kn:
        specs["weak_link"]["kN"] = [float(x) for x in weak_link_kn]
    if weak_link_lbf:
        specs["weak_link"]["lbf"] = [float(x) for x in weak_link_lbf]
    
    # 7. Torques
    torques = re.findall(r'(\d+(?:\.\d+)?)\s*(?:NM|N\.M)', text_upper)
    if torques:
        specs["torques"]["valores_nm"] = [float(x) for x in torques]
    
    # 8. Davit Launch
    if "DAVIT" in text_upper:
        specs["davit_launch"]["disponivel"] = True
        dl_capacidades = re.findall(r'(\d+)\s*(?:PERSON|MAN).*?DAVIT', text_upper)
        if dl_capacidades:
            specs["davit_launch"]["capacidades"] = list(set(dl_capacidades))
    
    return specs

def main():
    base_path = Path(r"c:\Users\julio\Desktop\APLICACAO MASTER\LIFERAFT1.0\gestor-naval-pro\MARCAS")
    
    pdfs = [
        base_path / "Seasava Plus.pdf",
        base_path / "Seasava Plus X E R.pdf"
    ]
    
    all_specs = []
    
    for pdf_path in pdfs:
        if pdf_path.exists():
            print(f"\n{'#'*80}")
            print(f"PROCESSANDO: {pdf_path.name}")
            print(f"{'#'*80}")
            
            specs = extract_seasava_specs(pdf_path)
            if specs:
                all_specs.append(specs)
        else:
            print(f"ARQUIVO NÃO ENCONTRADO: {pdf_path}")
    
    # Salvar resultado final
    output_file = "seasava-especificacoes-completas.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_specs, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*80}")
    print(f"EXTRAÇÃO CONCLUÍDA!")
    print(f"Resultado salvo em: {output_file}")
    print(f"Total de modelos processados: {len(all_specs)}")
    print(f"{'='*80}\n")

if __name__ == "__main__":
    main()
