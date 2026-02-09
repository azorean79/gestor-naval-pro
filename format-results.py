#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Formata dados extraídos em estrutura JSON conforme solicitado
"""

import json
from pathlib import Path

# Caminho dos dados
DETAILED_JSON = Path(r"c:\Users\julio\Desktop\APLICACAO MASTER\LIFERAFT1.0\gestor-naval-pro\technical-specs-detailed.json")

def format_pressure_data(model_data):
    """Formata dados de pressão para o formato solicitado"""
    pressure = model_data['pressaoTrabalho_convertida']
    
    return {
        "psi": pressure.get('psi'),
        "mmWG": pressure.get('mmWG'),
        "inH2O": pressure.get('inH2O'),
        "milibares": pressure.get('milibares') or pressure.get('bar')
    }

def extract_davit_data(model_data):
    """Extrai dados de davit launch"""
    davit_raw = model_data.get('davitLaunch', {})
    
    davit_findings = {
        "referencias_encontradas": len(davit_raw.get('raw_findings', [])),
        "mencoes": []
    }
    
    # Coleta menções relevantes
    for finding in davit_raw.get('raw_findings', [])[:5]:
        davit_findings['mencoes'].append({
            "localizacao": finding.get('linha', '')[:80],
            "contexto": finding.get('contexto', '')[:100]
        })
    
    return davit_findings

def format_capacities(model_data):
    """Formata especificações por capacidade"""
    capacities = {}
    
    spec_data = model_data.get('especificacoesPorCapacidade', {})
    
    for capacity, data in spec_data.items():
        if isinstance(data, dict):
            numeros = data.get('numeros', [])
            if isinstance(numeros, str):
                try:
                    numeros = [float(n) for n in numeros.split() if n.replace('.', '').isdigit()]
                except:
                    numeros = []
            
            capacities[capacity] = {
                "numeros_extraidos": numeros,
                "descricao": data.get('linha', '')[:100]
            }
    
    return capacities

def main():
    print("\nLendo dados detalhados extraídos...")
    
    with open(DETAILED_JSON, 'r', encoding='utf-8') as f:
        detailed_data = json.load(f)
    
    # Cria estrutura final conforme solicitado
    resultado_final = []
    
    for model in detailed_data:
        modelo_nome = model['modelo']
        
        resultado = {
            "modelo": modelo_nome,
            "arquivo": model['arquivo'],
            "total_paginas": model['total_paginas'],
            "pressaoTrabalho": format_pressure_data(model),
            "davitLaunch": extract_davit_data(model),
            "especificacoesPorCapacidade": format_capacities(model),
            "estatisticas": {
                "paginas_processadas": model.get('paginas_processadas', 0),
                "paginas_com_pressao": model.get('paginas_com_pressao', 0)
            }
        }
        
        resultado_final.append(resultado)
    
    # Salva resultado final estruturado
    output_file = DETAILED_JSON.parent / "jangadas-especificacoes-FINAL.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(resultado_final, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*80}")
    print(f"RESUMO DAS ESPECIFICAÇÕES TÉCNICAS - JANGADAS (LIFE RAFTS)")
    print(f"{'='*80}\n")
    
    print(f"PDFs ANALISADOS: {len(resultado_final)}\n")
    
    # Exibe resultado formatado
    for result in resultado_final:
        print(f"{'='*80}")
        print(f"MODELO: {result['modelo']}")
        print(f"Arquivo: {result['arquivo']} ({result['total_paginas']} páginas)")
        print(f"{'='*80}\n")
        
        # Pressão de trabalho
        print("PRESSÃO DE TRABALHO:")
        press = result['pressaoTrabalho']
        if press['psi']:
            print(f"  • PSI:       {press['psi']} psi")
        if press['mmWG']:
            print(f"  • mmWG:      {press['mmWG']} mm WG")
        if press['inH2O']:
            print(f"  • inH2O:     {press['inH2O']} inH2O")
        if press['milibares']:
            print(f"  • milibares: {press['milibares']} mb/hPa")
        print()
        
        # Davit Launch
        print("DAVIT LAUNCH:")
        davit = result['davitLaunch']
        print(f"  • Referências encontradas: {davit['referencias_encontradas']}")
        if davit['mencoes']:
            print("  • Primeiras menções:")
            for i, mencao in enumerate(davit['mencoes'][:3], 1):
                print(f"    {i}. {mencao['localizacao']}")
        print()
        
        # Capacidades
        print("ESPECIFICAÇÕES POR CAPACIDADE:")
        caps = result['especificacoesPorCapacidade']
        if caps:
            for cap, data in sorted(caps.items()):
                numeros = data['numeros_extraidos']
                if numeros:
                    print(f"  • {cap}: {data['descricao'][:60]}...")
        else:
            print("  Não extraído")
        print()
    
    print(f"\n{'='*80}")
    print(f"Arquivo salvo: {output_file}")
    print(f"{'='*80}\n")
    
    # Exibe JSON final
    print("\nFORMATO JSON ESTRUTURADO:\n")
    print(json.dumps(resultado_final, indent=2, ensure_ascii=False))
    
    return resultado_final

if __name__ == "__main__":
    results = main()
