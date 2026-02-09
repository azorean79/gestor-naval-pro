#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extrator avançado de especificações técnicas de jangadas/life rafts
Busca: pressão, davit launch, pesos, especificações por capacidade
"""

import json
import re
import sys
from pathlib import Path
from collections import defaultdict

# Fix para encoding no Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

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

class PressureConverter:
    """Converte unidades de pressão"""
    
    # Constantes de conversão
    PSI_TO_MMWG = 703.06957964  # 1 PSI = 703.07 mm WG
    PSI_TO_INHWO = 27.68064  # 1 PSI = 27.68 inH2O
    PSI_TO_MB = 68.948  # 1 PSI = 68.948 mbar
    
    @classmethod
    def convert(cls, value, from_unit, to_unit):
        """Converte valor de uma unidade para outra"""
        if from_unit == to_unit:
            return value
        
        # Converte tudo para PSI primeiro
        if from_unit == 'psi':
            psi_val = value
        elif from_unit == 'mmWG':
            psi_val = value / cls.PSI_TO_MMWG
        elif from_unit == 'inH2O':
            psi_val = value / cls.PSI_TO_INHWO
        elif from_unit in ['mb', 'mbar', 'hPa']:
            psi_val = value / cls.PSI_TO_MB
        elif from_unit == 'bar':
            psi_val = value * 14.5038
        else:
            return None
        
        # Converte de PSI para unidade destino
        if to_unit == 'psi':
            return psi_val
        elif to_unit == 'mmWG':
            return psi_val * cls.PSI_TO_MMWG
        elif to_unit == 'inH2O':
            return psi_val * cls.PSI_TO_INHWO
        elif to_unit in ['mb', 'mbar', 'hPa']:
            return psi_val * cls.PSI_TO_MB
        elif to_unit == 'bar':
            return psi_val / 14.5038
        
        return None

def extract_all_numbers(text, context_lines=3):
    """Extrai todos os números de um texto com contexto"""
    lines = text.split('\n')
    numbers = []
    
    for i, line in enumerate(lines):
        matches = re.finditer(r'(\d+\.?\d*)', line)
        for match in matches:
            start = max(0, i - context_lines)
            end = min(len(lines), i + context_lines + 1)
            context = ' '.join(lines[start:end])
            
            numbers.append({
                'value': float(match.group(1)),
                'line': line.strip(),
                'context': context.strip()[:200]
            })
    
    return numbers

def find_capacity_specs(text):
    """Procura especificações por capacidade (10p, 12p, etc)"""
    specs = {}
    
    # Padrão para encontrar capacidade
    capacity_pattern = r'(\d+)\s*(?:person|p|people|persons)(?:\s|,|\.)'
    
    lines = text.split('\n')
    for line in lines:
        cap_match = re.search(capacity_pattern, line, re.IGNORECASE)
        if cap_match:
            capacity = f"{cap_match.group(1)}p"
            
            # Extrai números da linha
            numbers = re.findall(r'(\d+\.?\d*)', line)
            
            if numbers and capacity not in specs:
                specs[capacity] = {
                    'linha': line.strip(),
                    'numeros': [float(n) for n in numbers]
                }
    
    return specs

def find_davit_launch_data(text):
    """Procura dados específicos de davit launch"""
    davit_data = {
        "weak_link": [],
        "bridle": [],
        "safety_factors": [],
        "test_weights": [],
        "raw_findings": []
    }
    
    # Palavras-chave para davit launch
    keywords = [
        r'davit\s*launch',
        r'weak\s*link',
        r'safety\s*chain',
        r'bridle.*weight',
        r'breaking\s*strength',
        r'maximum.*bridle',
        r'lifting.*lug',
        r'davit.*attachment',
        r'test.*load'
    ]
    
    lines = text.split('\n')
    for i, line in enumerate(lines):
        # Procura por keywords
        for keyword in keywords:
            if re.search(keyword, line, re.IGNORECASE):
                # Coleta contexto (linha anterior e posterior)
                context = []
                if i > 0:
                    context.append(lines[i-1])
                context.append(line)
                if i < len(lines) - 1:
                    context.append(lines[i+1])
                
                davit_data['raw_findings'].append({
                    'keyword': keyword,
                    'linha': line.strip(),
                    'contexto': ' | '.join(context)
                })
                
                # Procura por números próximos
                numbers = re.findall(r'(\d+\.?\d*)\s*(?:kN|lbf|lbs|kg|N|mm)', line)
                if numbers:
                    if 'weak' in keyword.lower() or 'chain' in keyword.lower():
                        davit_data['weak_link'].extend(numbers)
                    if 'bridle' in keyword.lower():
                        davit_data['bridle'].extend(numbers)
    
    return davit_data

def extract_from_pdf_advanced(modelo_name, pdf_path, debug=False):
    """Extrai dados técnicos avançados de um PDF"""
    print(f"\n📄 {modelo_name}")
    print(f"   Arquivo: {pdf_path.name}")
    
    if not pdf_path.exists():
        print(f"   ❌ Não encontrado")
        return None
    
    try:
        result = {
            "modelo": modelo_name,
            "arquivo": pdf_path.name,
            "pressaoTrabalho": {},
            "pressaoTrabalho_convertida": {},
            "davitLaunch": {},
            "especificacoesPorCapacidade": {},
            "numeros_encontrados": [],
            "total_paginas": 0,
            "status": "sucesso"
        }
        
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)
            result['total_paginas'] = total_pages
            
            print(f"   Páginas: {total_pages}")
            
            # Coleta texto completo (estratégia: primeiras páginas + últimas páginas)
            text_parts = []
            
            # Primeiras 50 páginas
            for page_num in range(min(50, total_pages)):
                try:
                    page = pdf.pages[page_num]
                    text = page.extract_text()
                    if text:
                        text_parts.append(text)
                except:
                    pass
            
            # Últimas 20 páginas
            for page_num in range(max(0, total_pages - 20), total_pages):
                try:
                    page = pdf.pages[page_num]
                    text = page.extract_text()
                    if text:
                        text_parts.append(text)
                except:
                    pass
            
            full_text = '\n'.join(text_parts)
            
            if debug:
                result['texto_amostrado'] = full_text[:1000]
            
            # Extrai pressão
            pressure_patterns = [
                (r'(\d+\.?\d*)\s*(?:PSI|psi)', 'psi'),
                (r'(\d+\.?\d*)\s*mm\s*WG', 'mmWG'),
                (r'(\d+\.?\d*)\s*(?:mm\s*)?H2O|in\s*H2O', 'inH2O'),
                (r'(\d+\.?\d*)\s*(?:mb|mbar|hPa)', 'milibares'),
                (r'(\d+\.?\d*)\s*bar', 'bar'),
            ]
            
            for pattern, unit in pressure_patterns:
                match = re.search(pattern, full_text, re.IGNORECASE)
                if match:
                    value = float(match.group(1))
                    result['pressaoTrabalho'][unit] = value
            
            # Converte para todas as unidades
            if result['pressaoTrabalho']:
                source_unit = list(result['pressaoTrabalho'].keys())[0]
                source_value = result['pressaoTrabalho'][source_unit]
                
                for target_unit in ['psi', 'mmWG', 'inH2O', 'milibares']:
                    converted = PressureConverter.convert(source_value, source_unit, target_unit)
                    if converted:
                        result['pressaoTrabalho_convertida'][target_unit] = round(converted, 2)
            
            # Extrai especificações por capacidade
            capacity_specs = find_capacity_specs(full_text)
            if capacity_specs:
                result['especificacoesPorCapacidade'] = capacity_specs
            
            # Extrai dados de davit launch
            davit_data = find_davit_launch_data(full_text)
            if davit_data['raw_findings']:
                result['davitLaunch'] = davit_data
            
            # Extrai amostra de números encontrados
            all_numbers = extract_all_numbers(full_text)
            result['numeros_encontrados'] = all_numbers[:20]  # Primeiros 20
            
        return result
        
    except Exception as e:
        print(f"   ❌ Erro: {type(e).__name__}")
        return None

def main():
    print("\n" + "=" * 80)
    print("EXTRATOR AVANÇADO DE ESPECIFICAÇÕES TÉCNICAS DE JANGADAS")
    print("=" * 80)
    
    # Lista todos os PDFs
    print(f"\n📂 PDFs em MARCAS/:")
    all_pdfs = list(MARCAS_PATH.glob("**/*.pdf"))
    for i, pdf in enumerate(all_pdfs, 1):
        print(f"   {i}. {pdf.relative_to(MARCAS_PATH)}")
    print(f"   Total: {len(all_pdfs)} PDFs\n")
    
    results = []
    
    # Processa cada PDF
    for modelo, pdf_path in PDFS.items():
        data = extract_from_pdf_advanced(modelo, pdf_path, debug=True)
        if data:
            results.append(data)
    
    # Salva resultado detalhado
    output_file = MARCAS_PATH.parent / "technical-specs-detailed.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n" + "=" * 80)
    print(f"✅ Dados salvos: {output_file}")
    print("=" * 80)
    
    # Exibe resumo
    print("\n📋 RESUMO DOS DADOS EXTRAÍDOS:\n")
    for result in results:
        print(f"🛟 {result['modelo']}")
        print(f"   Páginas: {result['total_paginas']}")
        
        if result['pressaoTrabalho']:
            print(f"   Pressão encontrada:")
            for unit, value in result['pressaoTrabalho'].items():
                print(f"     • {unit}: {value}")
        
        if result['pressaoTrabalho_convertida']:
            print(f"   Conversões automáticas:")
            for unit, value in result['pressaoTrabalho_convertida'].items():
                print(f"     • {unit}: {value}")
        
        if result['davitLaunch']['raw_findings']:
            print(f"   Dados de davit launch encontrados: {len(result['davitLaunch']['raw_findings'])}")
            for finding in result['davitLaunch']['raw_findings'][:3]:
                print(f"     • {finding['linha'][:60]}...")
        
        if result['especificacoesPorCapacidade']:
            print(f"   Capacidades encontradas: {', '.join(result['especificacoesPorCapacidade'].keys())}")
        
        print()
    
    return results

if __name__ == "__main__":
    results = main()
    
    # Exibe JSON completo
    print("\n📊 JSON COMPLETO:")
    print("-" * 80)
    print(json.dumps(results, indent=2, ensure_ascii=False)[:3000])
    print("\n... [dados salvos em technical-specs-detailed.json] ...")
