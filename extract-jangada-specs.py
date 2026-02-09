#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extrai especificações técnicas de PDFs de jangadas/life rafts
Foco: pressão de trabalho, pesos, cargas de davit launch
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

MARCAS_PATH = Path(r"c:\Users\julio\Desktop\APLICACAO MASTER\LIFERAFT1.0\gestor-naval-pro\MARCAS")

PDFS = {
    "RFD SURVIVA MKIII": MARCAS_PATH / "SURVIVA MKIII" / "MkIII.pdf",
    "DSB LR05": MARCAS_PATH / "LR05.pdf",
    "RFD SURVIVA MKIV": MARCAS_PATH / "SURVIVA MKIV" / "MK IV.pdf",
    "DSB LR97": MARCAS_PATH / "LR97.pdf",
}

def extract_pressure_from_text(text):
    """Extrai valores de pressão em diferentes unidades"""
    pressure = {}
    
    # PSI
    match = re.search(r'(\d+\.?\d*)\s*(?:PSI|psi|PSI)', text)
    if match:
        pressure['psi'] = float(match.group(1))
    
    # mm WG (milímetros coluna de água)
    match = re.search(r'(\d+\.?\d*)\s*(?:mm\s*WG|mmWG|mm\s*H2O|mm\s*H2O)', text)
    if match:
        pressure['mmWG'] = float(match.group(1))
    
    # inH2O (polegadas coluna de água)
    match = re.search(r'(\d+\.?\d*)\s*(?:in\s*H2O|inH2O|in\.?\s*H2O|inches\s*H2O)', text)
    if match:
        pressure['inH2O'] = float(match.group(1))
    
    # milibares ou hPa
    match = re.search(r'(\d+\.?\d*)\s*(?:mb|mbar|hPa)', text)
    if match:
        pressure['milibares'] = float(match.group(1))
    
    # bar
    match = re.search(r'(\d+\.?\d*)\s*(?:\s*bar(?:\s|,|\.)|bar(?:\s|,|\.))', text)
    if match:
        pressure['bar'] = float(match.group(1))
    
    return pressure

def extract_davit_specs(text):
    """Extrai especificações de davit launch"""
    davit = {
        "bridle_weight": None,
        "weak_link": None,
        "capacity_specs": {}
    }
    
    # Procura por "weak link" ou "chain" com valores em kN ou lbf
    weak_link_match = re.search(r'(?:weak\s*link|safety\s*chain|breaking\s*strength)[\s:=]*(\d+\.?\d*)\s*(?:kN|lbf|kgf|N)', text, re.IGNORECASE)
    if weak_link_match:
        davit['weak_link'] = weak_link_match.group(1)
    
    # Procura por peso máximo da bridle
    bridle_match = re.search(r'(?:bridle|bridle.*weight|bridle.*max)[\s:=]*(\d+\.?\d*)\s*(?:kg|lb|lbs)', text, re.IGNORECASE)
    if bridle_match:
        davit['bridle_weight'] = bridle_match.group(1)
    
    return davit

def extract_from_pdf(modelo_name, pdf_path, max_pages=50):
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
            "davit": {
                "bridle_weight": None,
                "weak_link": None,
                "capacity_specs": {}
            },
            "total_paginas": 0,
            "paginas_processadas": 0,
            "paginas_com_pressao": 0
        }
        
        with pdfplumber.open(pdf_path) as pdf:
            total = len(pdf.pages)
            result['total_paginas'] = total
            pages_to_process = min(max_pages, total)
            
            print(f"   📊 Total de páginas: {total} (processando primeiras {pages_to_process})")
            
            for page_num in range(pages_to_process):
                try:
                    page = pdf.pages[page_num]
                    text = page.extract_text()
                    
                    if text:
                        result['paginas_processadas'] += 1
                        
                        # Extrai pressão
                        pressure = extract_pressure_from_text(text)
                        if pressure:
                            result['paginas_com_pressao'] += 1
                            result['pressaoTrabalho'].update(pressure)
                        
                        # Extrai especificações de davit
                        davit = extract_davit_specs(text)
                        if davit['weak_link']:
                            result['davit']['weak_link'] = davit['weak_link']
                        if davit['bridle_weight']:
                            result['davit']['bridle_weight'] = davit['bridle_weight']
                            
                except Exception as e:
                    print(f"   ⚠️  Erro na página {page_num + 1}: {type(e).__name__}")
                    continue
        
        print(f"   ✅ Extraído com sucesso!")
        if result['pressaoTrabalho']:
            print(f"      Pressão de trabalho: {result['pressaoTrabalho']}")
        if result['davit']['weak_link']:
            print(f"      Weak link: {result['davit']['weak_link']}")
        
        return result
        
    except Exception as e:
        print(f"   ❌ Erro ao processar PDF: {str(e)}")
        return None

def list_pdfs_in_marcas():
    """Lista todos os PDFs no diretório MARCAS"""
    pdfs_found = []
    
    # Procura PDFs na raiz de MARCAS
    for pdf in MARCAS_PATH.glob("*.pdf"):
        pdfs_found.append(str(pdf.name))
    
    # Procura PDFs em subdiretórios
    for subdir in MARCAS_PATH.glob("*/"):
        for pdf in subdir.glob("*.pdf"):
            pdfs_found.append(str(pdf.relative_to(MARCAS_PATH)))
    
    return pdfs_found

def main():
    print("=" * 70)
    print("EXTRAÇÃO DE ESPECIFICAÇÕES TÉCNICAS DE JANGADAS (LIFE RAFTS)")
    print("=" * 70)
    
    # Lista todos os PDFs encontrados
    print("\n📂 PDFs encontrados em MARCAS/:")
    all_pdfs = list_pdfs_in_marcas()
    for i, pdf in enumerate(all_pdfs, 1):
        print(f"   {i}. {pdf}")
    print(f"\n   Total: {len(all_pdfs)} PDFs")
    
    results = []
    
    # Processa cada PDF definido
    for modelo, pdf_path in PDFS.items():
        data = extract_from_pdf(modelo, pdf_path, max_pages=100)
        if data:
            results.append(data)
    
    # Salva resultado em JSON
    output_file = MARCAS_PATH.parent / "technical-specs-extracted.json"
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
        print(f"   Páginas processadas: {result['paginas_processadas']}/{result['total_paginas']}")
        if result['pressaoTrabalho']:
            print(f"   ✓ Pressão de trabalho encontrada:")
            for unit, value in result['pressaoTrabalho'].items():
                print(f"     - {unit}: {value}")
        if result['davit']['weak_link']:
            print(f"   ✓ Weak link: {result['davit']['weak_link']}")
        if result['davit']['bridle_weight']:
            print(f"   ✓ Peso bridle: {result['davit']['bridle_weight']}")
    
    return results

if __name__ == "__main__":
    results = main()
    
    # Exibe em JSON
    print(f"\n\n📊 DADOS EM JSON:")
    print("-" * 70)
    print(json.dumps(results, indent=2, ensure_ascii=False))
