import re
import json
from pathlib import Path

def parse_seasava_plus(text):
    """Analisa especificações do SEASAVA Plus"""
    
    specs = {
        "modelo": "SEASAVA Plus",
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
    
    # Buscar sistema de insuflação
    if re.search(r'Thanner|THANNER', text, re.I):
        specs["sistema_insuflacao"] = "Thanner"
    if re.search(r'Leafield|LEAFIELD', text, re.I):
        if specs["sistema_insuflacao"]:
            specs["sistema_insuflacao"] += "/Leafield"
        else:
            specs["sistema_insuflacao"] = "Leafield"
    
    # Buscar válvulas
    valvulas = set()
    for match in re.finditer(r'\b(OTS\s*\d+|A\d+|B\d+|C\d+|D\d+)\b', text, re.I):
        valvulas.add(match.group(1).upper().replace(' ', ''))
    specs["valvulas_padrao"] = sorted(list(valvulas))
    
    # Buscar pressões de trabalho
    # PSI
    psi_matches = re.findall(r'(\d+(?:\.\d+)?)\s*[- ]?\s*(?:PSI|psi)', text)
    if psi_matches:
        psi_values = [float(x) for x in psi_matches]
        # Filtrar valores razoáveis (normalmente entre 1-5 PSI)
        psi_values = [x for x in psi_values if 0.5 <= x <= 10]
        if psi_values:
            specs["pressao_trabalho"]["PSI"] = psi_values[0]
    
    # mmWG
    mmwg_matches = re.findall(r'(\d+(?:\.\d+)?)\s*mm\s*[wW]\.?[gG]', text)
    if mmwg_matches:
        specs["pressao_trabalho"]["mmWG"] = float(mmwg_matches[0])
    
    # inH2O
    inh2o_matches = re.findall(r'(\d+(?:\.\d+)?)\s*in\s*[hH]2[oO]', text)
    if inh2o_matches:
        specs["pressao_trabalho"]["inH2O"] = float(inh2o_matches[0])
    
    # mbar
    mbar_matches = re.findall(r'(\d+(?:\.\d+)?)\s*m[bB]ar', text)
    if mbar_matches:
        specs["pressao_trabalho"]["mbar"] = float(mbar_matches[0])
    
    # Buscar tabelas de capacidades e CO2
    # Padrão comum: "6 PERSON ... 2 x 160g"
    lines = text.split('\n')
    
    for i, line in enumerate(lines):
        # Procurar por capacidade
        cap_match = re.search(r'(\d+)\s*(?:PERSON|MAN|PERS)', line, re.I)
        if cap_match:
            capacidade = int(cap_match.group(1))
            
            # Buscar CO2 na mesma linha ou próximas
            search_text = '\n'.join(lines[max(0, i-2):min(len(lines), i+5)])
            
            cap_info = {
                "capacidade_pessoas": capacidade,
                "cilindros_co2": {},
                "peso_total_kg": None,
                "referencia_cilindro": ""
            }
            
            # Padrão: 2 x 160g ou 1 x 350g
            co2_match = re.search(r'(\d+)\s*[xX×]\s*(\d+)\s*g', search_text, re.I)
            if co2_match:
                qtd = int(co2_match.group(1))
                peso_g = int(co2_match.group(2))
                cap_info["cilindros_co2"]["quantidade"] = qtd
                cap_info["cilindros_co2"]["peso_individual_g"] = peso_g
                cap_info["cilindros_co2"]["peso_total_kg"] = (qtd * peso_g) / 1000
            
            # Buscar peso total
            peso_match = re.search(r'(\d+(?:\.\d+)?)\s*kg', search_text, re.I)
            if peso_match:
                cap_info["peso_total_kg"] = float(peso_match.group(1))
            
            specs["capacidades"][f"{capacidade}P"] = cap_info
    
    # Weak Link
    weak_link_kn = re.findall(r'(\d+(?:\.\d+)?)\s*kN', text)
    weak_link_lbf = re.findall(r'(\d+)\s*lbf', text, re.I)
    
    if weak_link_kn:
        kn_values = [float(x) for x in weak_link_kn]
        # Filtrar valores típicos de weak link (geralmente 1-10 kN)
        kn_values = [x for x in kn_values if 1 <= x <= 15]
        if kn_values:
            specs["weak_link"]["kN"] = sorted(set(kn_values))
    
    if weak_link_lbf:
        lbf_values = [int(x) for x in weak_link_lbf]
        lbf_values = [x for x in lbf_values if 200 <= x <= 3500]
        if lbf_values:
            specs["weak_link"]["lbf"] = sorted(set(lbf_values))
    
    # Torques
    torque_matches = re.findall(r'(\d+(?:\.\d+)?)\s*Nm', text, re.I)
    if torque_matches:
        torque_values = [float(x) for x in torque_matches]
        torque_values = [x for x in torque_values if 0.5 <= x <= 200]
        if torque_values:
            specs["torques"]["valores_nm"] = sorted(set(torque_values))
    
    # Davit Launch
    if re.search(r'davit', text, re.I):
        specs["davit_launch"]["disponivel"] = True
        # Buscar capacidades DL
        dl_matches = re.findall(r'(\d+)\s*(?:PERSON|MAN).*?davit', text, re.I)
        if dl_matches:
            specs["davit_launch"]["capacidades_pessoas"] = sorted(set([int(x) for x in dl_matches]))
    
    return specs


def main():
    base_path = Path(".")
    
    files = [
        ("Seasava Plus-extracted.txt", "SEASAVA Plus"),
        ("Seasava Plus X E R-extracted.txt", "SEASAVA Plus X/E/R")
    ]
    
    all_specs = []
    
    for filename, model_name in files:
        filepath = base_path / filename
        if filepath.exists():
            print(f"\n{'='*80}")
            print(f"Analisando: {filename}")
            print(f"{'='*80}\n")
            
            with open(filepath, 'r', encoding='utf-8') as f:
                text = f.read()
            
            specs = parse_seasava_plus(text)
            specs["modelo"] = model_name
            
            # Exibir resumo
            print(f"Modelo: {specs['modelo']}")
            print(f"Sistema de Insuflação: {specs['sistema_insuflacao']}")
            print(f"Válvulas: {', '.join(specs['valvulas_padrao'])}")
            print(f"Capacidades encontradas: {len(specs['capacidades'])}")
            print(f"Pressões: {specs['pressao_trabalho']}")
            print(f"Weak Link: {specs['weak_link']}")
            
            all_specs.append(specs)
        else:
            print(f"Arquivo não encontrado: {filepath}")
    
    # Salvar resultado
    output_file = "seasava-specs-detalhadas.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_specs, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*80}")
    print(f"ANÁLISE CONCLUÍDA!")
    print(f"Resultado salvo em: {output_file}")
    print(f"{'='*80}\n")
    
    # Criar versão formatada
    print("\n" + "="*80)
    print("RESUMO DAS ESPECIFICAÇÕES EXTRAÍDAS")
    print("="*80)
    
    for spec in all_specs:
        print(f"\n{'─'*80}")
        print(f"MODELO: {spec['modelo']}")
        print(f"{'─'*80}")
        print(f"Sistema: {spec['sistema_insuflacao']}")
        print(f"Válvulas: {', '.join(spec['valvulas_padrao'])}")
        print(f"\nCapacidades ({len(spec['capacidades'])}):")
        for cap_key, cap_data in sorted(spec['capacidades'].items()):
            print(f"  {cap_key}:", json.dumps(cap_data, indent=4, ensure_ascii=False))
        print(f"\nPressão de Trabalho:")
        for key, val in spec['pressao_trabalho'].items():
            print(f"  {key}: {val}")
        if spec['weak_link']:
            print(f"\nWeak Link:")
            for key, val in spec['weak_link'].items():
                print(f"  {key}: {val}")
        if spec['torques']:
            print(f"\nTorques:")
            for key, val in spec['torques'].items():
                print(f"  {key}: {val}")
        if spec.get('davit_launch', {}).get('disponivel'):
            print(f"\nDavit Launch: Disponível")
            if 'capacidades_pessoas' in spec['davit_launch']:
                print(f"  Capacidades: {spec['davit_launch']['capacidades_pessoas']}")

if __name__ == "__main__":
    main()
