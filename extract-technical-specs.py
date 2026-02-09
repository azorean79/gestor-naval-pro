#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extrai especificações técnicas de PDFs de jangadas/life rafts
Extrai: pressão de trabalho, pesos, cargas de davit launch
"""

import json
import re
import sys
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print("Instalando pdfplumber...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "-q"])
    import pdfplumber

# Caminho base
BASE_PATH = Path(r"c:\Users\julio\Desktop\APLICACAO MASTER\LIFERAFT1.0\gestor-naval-pro\MARCAS")

PDFS = {
    "RFD SURVIVA MKIII": BASE_PATH / "SURVIVA MKIII" / "MkIII.pdf",
    "DSB LR05": BASE_PATH / "LR05.pdf",
    "RFD SURVIVA MKIV": BASE_PATH / "SURVIVA MKIV" / "MK IV.pdf",
    "DSB LR97": BASE_PATH / "LR97.pdf",
}

def extract_pressure_values(text):
    """Extrai valores de pressão em diferentes unidades"""
    pressure = {}
    
    # PSI
    psi_match = re.search(r'(\d+\.?\d*)\s*(?:PSI|psi)', text, re.IGNORECASE)
    if psi_match:
        pressure['psi'] = float(psi_match.group(1))
    
    # mm WG (milímetros coluna de água)
    mmwg_match = re.search(r'(\d+\.?\d*)\s*(?:mm\s*WG|mmWG|mm\s*H2O)', text, re.IGNORECASE)
    if mmwg_match:
        pressure['mmWG'] = float(mmwg_match.group(1))
    
    # inH2O (polegadas coluna de água)
    inh2o_match = re.search(r'(\d+\.?\d*)\s*(?:in\s*H2O|inH2O|in\.\s*H2O)', text, re.IGNORECASE)
    if inh2o_match:
        pressure['inH2O'] = float(inh2o_match.group(1))
    
    # milibares ou hPa
    mb_match = re.search(r'(\d+\.?\d*)\s*(?:mb|mbar|hPa)', text, re.IGNORECASE)
    if mb_match:
        pressure['milibares'] = float(mb_match.group(1))
    
    return pressure

def extract_bridle_specs(text):
    """Extrai especificações de bridle para davit launch"""
    bridles_list = []
    
    # Padrão para encontrar linha com capacidade (10p, 12p, etc) e pesos
    # Procura por padrões como "10p", "12p", "16p", "20p", "25p"
    capacity_pattern = r'(\d+)\s*p[ersons]*'
    weights_pattern = r'(\d+\.?\d*)\s*(?:kg|kN|lbf|lbs)'
    
    lines = text.split('\n')
    for line in lines:
        if re.search(r'(\d+)\s*p(?:ersons)?', line, re.IGNORECASE):
            cap_match = re.search(r'(\d+)\s*p(?:ersons)?', line, re.IGNORECASE)
            if cap_match:
                capacity = f"{cap_match.group(1)}p"
                
                # Extrai todos os pesos da línea
                weights = re.findall(weights_pattern, line, re.IGNORECASE)
                
                bridles_list.append({
                    'capacidade': capacity,
                    'valoresExtraidos': weights,
                    'linhaOriginal': line.strip()
                })
    
    return bridles_list

def extract_from_pdf(modelo_name, pdf_path):
    """Extrai dados técnicos de um PDF"""
    print(f"\n📄 Processando: {modelo_name}")
    print(f"   Arquivo: {pdf_path}")
    
    if not pdf_path.exists():
        print(f"   ❌ Arquivo não encontrado!")
        return None
    
    try:
        result = {
            "modelo": modelo_name,
            "arquivo": str(pdf_path),
            "pressaoTrabalho": {},
            "bridle": {"specs": []},
            "dadosBrutos": []  # Salva o texto bruto para análise manual
        }
        
        with pdfplumber.open(pdf_path) as pdf:
            print(f"   📊 Total de páginas: {len(pdf.pages)}")
            
            # Extrai texto de todas as páginas
            full_text = ""
            for page_num, page in enumerate(pdf.pages, 1):
                text = page.extract_text() or ""
                full_text += f"\n--- PÁGINA {page_num} ---\n" + text
                
                # Extrai pressão de todas as páginas
                pressure = extract_pressure_values(text)
                if pressure:
                    result['pressaoTrabalho'].update(pressure)
            
            # Extrai especificações de bridle
            bridle_specs = extract_bridle_specs(full_text)
            if bridle_specs:
                result['bridle']['specs'] = bridle_specs
            
            # Salva texto completo para análise
            result['dadosBrutos'] = full_text[:2000]  # Primeiros 2000 caracteres
        
        print(f"   ✅ Extraído com sucesso!")
        if result['pressaoTrabalho']:
            print(f"      Pressão de trabalho encontrada: {result['pressaoTrabalho']}")
        
        return result
        
    except Exception as e:
        print(f"   ❌ Erro ao processar: {str(e)}")
        return None

def main():
    print("=" * 70)
    print("EXTRAÇÃO DE ESPECIFICAÇÕES TÉCNICAS DE JANGADAS (LIFE RAFTS)")
    print("=" * 70)
    
    results = []
    
    # Processa cada PDF
    for modelo, pdf_path in PDFS.items():
        data = extract_from_pdf(modelo, pdf_path)
        if data:
            results.append(data)
    
    # Salva resultado em JSON
    output_file = BASE_PATH.parent / "technical-specs-extracted.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n" + "=" * 70)
    print(f"✅ Dados extraídos salvos em: {output_file}")
    print(f"   Total de modelos processados: {len(results)}")
    
    # Exibe resumo
    print(f"\n📋 RESUMO DOS DADOS EXTRAÍDOS:")
    print("-" * 70)
    for result in results:
        print(f"\n{result['modelo']}:")
        if result['pressaoTrabalho']:
            for unit, value in result['pressaoTrabalho'].items():
                print(f"  - {unit}: {value}")
        if result['bridle']['specs']:
            print(f"  - Especificações de bridle encontradas: {len(result['bridle']['specs'])}")
    
    return results

if __name__ == "__main__":
    results = main()
    
    # Exibe também em JSON formatado
    print(f"\n\n📊 DADOS COMPLETOS EM JSON:")
    print("-" * 70)
    print(json.dumps(results, indent=2, ensure_ascii=False))
