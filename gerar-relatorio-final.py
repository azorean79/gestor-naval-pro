#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera relatório final em JSON estruturado conforme solicitado pelo usuário
"""

import json
import sys
from pathlib import Path

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DETAILED_JSON = Path(r"c:\Users\julio\Desktop\APLICACAO MASTER\LIFERAFT1.0\gestor-naval-pro\technical-specs-detailed.json")

class PressureConverter:
    """Converte entre unidades de pressão"""
    
    @staticmethod
    def to_all_units(value, from_unit):
        """Converte um valor para todas as unidades"""
        # Constantes de conversão para PSI
        to_psi = {
            'psi': 1.0,
            'mmWG': 1.0 / 703.06957964,
            'inH2O': 1.0 / 27.68064,
            'milibares': 1.0 / 68.948,
            'bar': 1.0 / 14.5038
        }
        
        # Converte para PSI
        if from_unit not in to_psi:
            return None
        
        psi_value = value * to_psi[from_unit]
        
        # Retorna todas as conversões
        return {
            'psi': round(psi_value, 2),
            'mmWG': round(psi_value * 703.06957964, 1),
            'inH2O': round(psi_value * 27.68064, 2),
            'milibares': round(psi_value * 68.948, 1)
        }

def extract_model_data(raw_model):
    """Extrai e formata dados de um modelo"""
    modelo_nome = raw_model['modelo']
    
    # Extrai pressão trabalhada
    pressao_original = raw_model.get('pressaoTrabalho', {})
    
    # Encontra conversão completa
    pressao_convertida = {}
    if raw_model.get('pressaoTrabalho_convertida'):
        pressao_convertida = raw_model['pressaoTrabalho_convertida']
    elif pressao_original:
        # Se não houver conversão, cria
        unit = list(pressao_original.keys())[0] if pressao_original else None
        value = list(pressao_original.values())[0] if pressao_original else None
        if unit and value:
            pressao_convertida = PressureConverter.to_all_units(value, unit)
    
    # Extrai dados de davit launch
    davit_info = raw_model.get('davitLaunch', {})
    davit_launch = {
        "referencias_encontradas": len(davit_info.get('raw_findings', [])),
        "detalhes": []
    }
    
    for finding in davit_info.get('raw_findings', [])[:10]:
        davit_launch['detalhes'].append({
            "localizacao": finding.get('linha', '')[:80],
            "contexto": finding.get('contexto', '')[:150]
        })
    
    # Extrai especificações por capacidade
    specs_cap = {}
    for cap, data_cap in raw_model.get('especificacoesPorCapacidade', {}).items():
        if isinstance(data_cap, dict):
            specs_cap[cap] = {
                "descricao": data_cap.get('linha', '')[:100],
                "numeros": data_cap.get('numeros', [])
            }
    
    return {
        "modelo": modelo_nome,
        "arquivo_pdf": raw_model.get('arquivo', ''),
        "total_paginas": raw_model.get('total_paginas', 0),
        "pressaoTrabalho": {
            "psi": pressao_convertida.get('psi'),
            "mmWG": pressao_convertida.get('mmWG'),
            "inH2O": pressao_convertida.get('inH2O'),
            "milibares": pressao_convertida.get('milibares')
        },
        "bridle": {
            "pesos": [],  # Sem dados específicos extraídos automaticamente
            "mencoesEncontradas": len([finding for finding in davit_info.get('raw_findings', []) 
                                      if 'bridle' in finding.get('linha', '').lower() or 
                                         'bridle' in finding.get('contexto', '').lower()])
        },
        "davitLaunch": davit_launch,
        "especificacoesPorCapacidade": specs_cap
    }

def main():
    print("\n" + "="*90)
    print("RELATÓRIO FINAL: ESPECIFICAÇÕES TÉCNICAS DE JANGADAS (LIFE RAFTS)")
    print("="*90 + "\n")
    
    # Lê dados extraídos
    with open(DETAILED_JSON, 'r', encoding='utf-8') as f:
        dados_brutos = json.load(f)
    
    # Formata cada modelo
    resultado = []
    for raw in dados_brutos:
        formatted = extract_model_data(raw)
        resultado.append(formatted)
    
    # Salva resultado final
    output_file = DETAILED_JSON.parent / "JANGADAS-ESPECIFICACOES-ESTRUTURADO.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(resultado, f, indent=2, ensure_ascii=False)
    
    print("DADOS ESTRUTURADOS CONFORME SOLICITADO:\n")
    
    # Exibe cada modelo
    for dados in resultado:
        print("="*90)
        print(f"MODELO: {dados['modelo']}")
        print(f"Arquivo: {dados['arquivo_pdf']} ({dados['total_paginas']} páginas)")
        print("="*90)
        
        print("\n### PRESSÃO DE TRABALHO (Todas as unidades):")
        press = dados['pressaoTrabalho']
        print(f"  - PSI:        {press['psi']} lbf/in²")
        print(f"  - mmWG:       {press['mmWG']} mm H₂O")
        print(f"  - inH2O:      {press['inH2O']} in H₂O")
        print(f"  - milibares:  {press['milibares']} mb/hPa")
        
        print(f"\n### DAVIT LAUNCH:")
        print(f"  - Referências encontradas: {dados['davitLaunch']['referencias_encontradas']}")
        print(f"  - Menções sobre bridle: {dados['bridle']['mencoesEncontradas']}")
        if dados['davitLaunch']['detalhes']:
            print("  - Primeiras menções nos manuais:")
            for i, detalhe in enumerate(dados['davitLaunch']['detalhes'][:3], 1):
                print(f"    • {detalhe['localizacao']}")
        
        print(f"\n### ESPECIFICAÇÕES POR CAPACIDADE:")
        if dados['especificacoesPorCapacidade']:
            for cap in sorted(dados['especificacoesPorCapacidade'].keys()):
                info = dados['especificacoesPorCapacidade'][cap]
                print(f"  - {cap}: {info['descricao']}")
        else:
            print("  [Nenhuma especificação específica extraída]")
        
        print("\n")
    
    print("="*90)
    print(f"\n✅ Arquivo salvo: {output_file}")
    print("\nFORMATO JSON ESTRUTURADO:\n")
    
    # Exibe JSON final
    json_output = json.dumps(resultado, indent=2, ensure_ascii=False)
    print(json_output)
    
    return resultado

if __name__ == "__main__":
    results = main()
