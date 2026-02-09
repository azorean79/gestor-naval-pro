import fitz  # PyMuPDF
import re
import json
from pathlib import Path
from collections import defaultdict

def extract_with_pymupdf(pdf_path):
    """Extrai texto usando PyMuPDF (mais robusto)"""
    
    print(f"\n{'='*80}")
    print(f"Processando: {pdf_path.name}")
    
    all_text = ""
    doc = fitz.open(pdf_path)
    
    print(f"Total de páginas: {len(doc)}")
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        all_text += f"\n--- PÁGINA {page_num + 1} ---\n{text}\n"
    
    doc.close()
    
    # Salvar texto extraído
    output_txt = pdf_path.stem + "-pymupdf.txt"
    with open(output_txt, 'w', encoding='utf-8') as f:
        f.write(all_text)
    
    print(f"Texto salvo em: {output_txt}")
    print(f"Total de caracteres extraídos: {len(all_text)}")
    
    return all_text, output_txt


def analyze_specifications(text, model_name):
    """Analisa especificações técnicas do texto"""
    
    specs = {
        "modelo": model_name,
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
    
    text_upper = text.upper()
    
    # 1. Sistema de insuflação
    if "THANNER" in text_upper:
        specs["sistema_insuflacao"] = "Thanner"
    if "LEAFIELD" in text_upper:
        if specs["sistema_insuflacao"]:
            specs["sistema_insuflacao"] += " / Leafield"
        else:
            specs["sistema_insuflacao"] = "Leafield"
    
    # 2. Válvulas - padrões comuns em jangadas
    valvulas_encontradas = set()
    
    # Padrões de válvulas
    valve_patterns = [
        r'\bOTS\s*-?\s*(\d+)\b',  # OTS-65, OTS 65
        r'\b([ABCD])\s*-?\s*(\d+)\b',  # A-10, B10, C-8
        r'\bVALVE\s+([A-Z0-9\-]+)\b',  # VALVE A10
    ]
    
    for pattern in valve_patterns:
        matches = re.finditer(pattern, text_upper)
        for match in matches:
            if 'OTS' in pattern:
                valvulas_encontradas.add(f"OTS{match.group(1)}")
            elif 'VALVE' in pattern:
                valvulas_encontradas.add(match.group(1))
            else:
                # A10, B10, etc
                letter = match.group(1)
                num = match.group(2)
                if letter in ['A', 'B', 'C', 'D'] and num.isdigit():
                    valvulas_encontradas.add(f"{letter}{num}")
    
    specs["valvulas_padrao"] = sorted(list(valvulas_encontradas))
    
    # 3. Pressões
    # PSI
    psi_matches = re.findall(r'(\d+\.?\d*)\s*PSI', text_upper)
    if psi_matches:
        psi_vals = [float(x) for x in psi_matches if 0.5 <= float(x) <= 10]
        if psi_vals:
            specs["pressao_trabalho"]["PSI"] = psi_vals[0]
    
    # mmWG (milímetros de coluna d'água)
    mmwg_matches = re.findall(r'(\d+\.?\d*)\s*MM\s*W\.?G', text_upper)
    if mmwg_matches:
        specs["pressao_trabalho"]["mmWG"] = float(mmwg_matches[0])
    
    # inH2O (polegadas de coluna d'água)
    inh2o_matches = re.findall(r'(\d+\.?\d*)\s*IN\s*H2O', text_upper)
    if inh2o_matches:
        specs["pressao_trabalho"]["inH2O"] = float(inh2o_matches[0])
    
    # mbar (milibares)
    mbar_matches = re.findall(r'(\d+\.?\d*)\s*MBAR', text_upper)
    if mbar_matches:
        specs["pressao_trabalho"]["mbar"] = float(mbar_matches[0])
    
    # 4. Capacidades e cilindros CO2
    # Procurar padrões como:
    # "6 PERSON" ou "6 MAN" seguido de informações de cilindro
    
    lines = text.split('\n')
    
    for i, line in enumerate(lines):
        # Buscar capacidade
        cap_matches = re.finditer(r'(\d+)\s*(?:PERSON|MAN|PERS|P\b)', line, re.I)
        
        for cap_match in cap_matches:
            capacidade = int(cap_match.group(1))
            
            # Limitar a capacidades razoáveis
            if capacidade < 4 or capacidade > 100:
                continue
            
            # Buscar informações nas linhas próximas
            context_start = max(0, i - 3)
            context_end = min(len(lines), i + 10)
            context = '\n'.join(lines[context_start:context_end])
            context_upper = context.upper()
            
            cap_key = f"{capacidade}P"
            
            if cap_key not in specs["capacidades"]:
                cap_info = {
                    "capacidade_pessoas": capacidade,
                    "cilindros_co2": {},
                    "cilindros_n2": {},
                    "peso_total_kg": None,
                    "referencia_cilindro": ""
                }
                
                # Buscar padrão de CO2: "2 x 160g" ou "1 x 350g"
                co2_pattern = re.search(r'(\d+)\s*[xX×]\s*(\d+)\s*G', context_upper)
                if co2_pattern:
                    qtd = int(co2_pattern.group(1))
                    peso_g = int(co2_pattern.group(2))
                    
                    cap_info["cilindros_co2"]["quantidade"] = qtd
                    cap_info["cilindros_co2"]["peso_individual_g"] = peso_g
                    cap_info["cilindros_co2"]["peso_total_kg"] = round((qtd * peso_g) / 1000, 3)
                
                # Buscar N2 (se aplicável)
                n2_pattern = re.search(r'N2.*?(\d+)\s*G', context_upper)
                if n2_pattern:
                    cap_info["cilindros_n2"]["peso_g"] = int(n2_pattern.group(1))
                
                # Buscar peso total
                peso_pattern = re.search(r'WEIGHT.*?(\d+\.?\d*)\s*KG', context_upper)
                if not peso_pattern:
                    peso_pattern = re.search(r'(\d+\.?\d*)\s*KG', context_upper)
                
                if peso_pattern:
                    peso = float(peso_pattern.group(1))
                    # Filtrar pesos razoáveis para jangadas
                    if 20 <= peso <= 500:
                        cap_info["peso_total_kg"] = peso
                
                # Buscar referência do cilindro
                ref_pattern = re.search(r'REF[:\s]+([A-Z0-9\-]+)', context_upper)
                if ref_pattern:
                    cap_info["referencia_cilindro"] = ref_pattern.group(1)
                
                specs["capacidades"][cap_key] = cap_info
    
    # 5. Weak Link
    weak_kn = re.findall(r'(\d+\.?\d*)\s*KN', text_upper)
    weak_lbf = re.findall(r'(\d+)\s*LBF', text_upper)
    
    if weak_kn:
        kn_vals = [float(x) for x in weak_kn if 1 <= float(x) <= 15]
        if kn_vals:
            specs["weak_link"]["kN"] = sorted(list(set(kn_vals)))
    
    if weak_lbf:
        lbf_vals = [int(x) for x in weak_lbf if 200 <= int(x) <= 3500]
        if lbf_vals:
            specs["weak_link"]["lbf"] = sorted(list(set(lbf_vals)))
    
    # 6. Torques
    torque_matches = re.findall(r'(\d+\.?\d*)\s*NM', text_upper)
    if torque_matches:
        torque_vals = [float(x) for x in torque_matches if 0.5 <= float(x) <= 200]
        if torque_vals:
            specs["torques"]["valores_nm"] = sorted(list(set(torque_vals)))
    
    # 7. Davit Launch
    if re.search(r'DAVIT\s+LAUNCH', text_upper):
        specs["davit_launch"]["disponivel"] = True
        
        # Procurar capacidades DL
        dl_pattern = re.finditer(r'(\d+)\s*(?:PERSON|MAN).*?DAVIT', text_upper)
        dl_caps = set()
        for match in dl_pattern:
            cap = int(match.group(1))
            if 4 <= cap <= 100:
                dl_caps.add(cap)
        
        if dl_caps:
            specs["davit_launch"]["capacidades_pessoas"] = sorted(list(dl_caps))
    
    return specs


def main():
    base_path = Path(r"c:\Users\julio\Desktop\APLICACAO MASTER\LIFERAFT1.0\gestor-naval-pro\MARCAS")
    
    pdfs_info = [
        (base_path / "Seasava Plus.pdf", "SEASAVA Plus"),
        (base_path / "Seasava Plus X E R.pdf", "SEASAVA Plus X/E/R")
    ]
    
    all_specs = []
    
    for pdf_path, model_name in pdfs_info:
        if pdf_path.exists():
            print(f"\n{'#'*80}")
            print(f"PROCESSANDO: {pdf_path.name}")
            print(f"{'#'*80}")
            
            try:
                text, txt_file = extract_with_pymupdf(pdf_path)
                
                print(f"\nAnalisando especificações...")
                specs = analyze_specifications(text, model_name)
                
                # Exibir resumo
                print(f"\n{'─'*80}")
                print(f"RESUMO: {model_name}")
                print(f"{'─'*80}")
                print(f"Sistema de Insuflação: {specs['sistema_insuflacao']}")
                print(f"Válvulas Padrão: {', '.join(specs['valvulas_padrao']) if specs['valvulas_padrao'] else 'Não encontrado'}")
                print(f"Capacidades encontradas: {len(specs['capacidades'])}")
                if specs['capacidades']:
                    print(f"  Pessoas: {', '.join(sorted(specs['capacidades'].keys()))}")
                print(f"Pressões: {specs['pressao_trabalho']}")
                print(f"Weak Link: {specs['weak_link']}")
                print(f"Torques: {specs['torques']}")
                print(f"Davit Launch: {specs['davit_launch']}")
                
                all_specs.append(specs)
                
            except Exception as e:
                print(f"ERRO ao processar {pdf_path.name}: {e}")
        else:
            print(f"ARQUIVO NÃO ENCONTRADO: {pdf_path}")
    
    # Salvar resultado final
    output_file = "SEASAVA-ESPECIFICACOES-COMPLETAS.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_specs, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*80}")
    print(f"EXTRAÇÃO FINALIZADA!")
    print(f"Arquivo salvo: {output_file}")
    print(f"Total de modelos: {len(all_specs)}")
    print(f"{'='*80}\n")
    
    # Exibir JSON completo
    print("\n" + "="*80)
    print("ESPECIFICAÇÕES COMPLETAS (JSON)")
    print("="*80)
    print(json.dumps(all_specs, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
