#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extrator OCR para PDFs SEASAVA - Especificações Técnicas
Processa PDFs escaneados e extrai especificações de jangadas
"""

import os
import sys
import subprocess
from pathlib import Path

# Verificar se Tesseract está instalado
def check_tesseract():
    try:
        result = subprocess.run(['tesseract', '--version'], capture_output=True, text=True)
        print("✅ Tesseract OCR detectado")
        return True
    except FileNotFoundError:
        print("❌ Tesseract não instalado")
        print("Instale com: choco install tesseract -y")
        return False

def check_pytesseract():
    try:
        import pytesseract
        from PIL import Image
        import pdf2image
        print("✅ Bibliotecas OCR disponíveis")
        return True
    except ImportError as e:
        print(f"⚠️  Faltam bibliotecas: {e}")
        print("Instale com: pip install pytesseract pillow pdf2image")
        return False

def main():
    print("=" * 80)
    print("EXTRATOR OCR PARA PDFs SEASAVA")
    print("=" * 80)
    print()
    
    # Verificar requisitos
    print("📋 Verificando requisitos...")
    tesseract_ok = check_tesseract()
    libs_ok = check_pytesseract()
    print()
    
    if not tesseract_ok or not libs_ok:
        print("❌ Ambiente não configurado para OCR")
        print()
        print("ALTERNATIVA: Processamento Manual")
        print("-" * 80)
        create_manual_guide()
        return
    
    # Se chegou aqui, fazer OCR
    print("🔄 Iniciando extração OCR...")
    try:
        from ocr_processor import ProcessadorOCR
        processor = ProcessadorOCR()
        processor.processar_seasava()
    except Exception as e:
        print(f"❌ Erro durante OCR: {e}")
        create_manual_guide()

def create_manual_guide():
    """Cria guia para extração manual"""
    guide = """
GUIA DE EXTRAÇÃO MANUAL - SEASAVA PLUS e SEASAVA PLUS X/E/R
============================================================

PASSO 1 - Localize as Tabelas de Especificações
───────────────────────────────────────────────
Abra os PDFs e procure por:
  ✓ Tabela de "Capacidades" (4P, 6P, 8P, 10P, 12P, 16P, 20P, 25P)
  ✓ "Sistema de Insuflação" (Thanner ou Leafield)
  ✓ "Válvulas Principais" (OTS65, A10, B10, etc.)
  ✓ Tabela de "Cilindros CO2"
  ✓ "Pressão de Trabalho" (PSI)
  ✓ "Weak Link Specifications" (kN, lbf)
  ✓ "Davit Launch Capacities"

PASSO 2 - Informações a Extrair
───────────────────────────────
Para CADA MODELO (SEASAVA PLUS e SEASAVA X/E/R):

A) Sistema Básico
   - Nome exato do modelo
   - Sistema de insuflação
   - Válvulas padrão

B) Para CADA CAPACIDADE (4P até 25P, se disponível):
   - Quantidade de cilindros CO2
   - Peso de CO2 (kg)
   - Peso de N2 (kg) - se aplicável
   - Referência do cilindro

C) Pressões (se encontrar):
   - PSI
   - mmWG (milímetros de coluna de água)
   - inH2O (polegadas de coluna de água)
   - milibares

D) Weak Link (resistência):
   - Valor em kN (Kilonewtons)
   - Valor em lbf (libras-força)

E) Davit Launch (lançamento por guindaste):
   - Capacidades disponíveis (12P, 16P, 20P, 25P, etc.)

PASSO 3 - Preenchimento do JSON
────────────────────────────────
Use o arquivo: SEASAVA-TEMPLATE-SPECS.json
Estruture como:
{
  "seasava_plus": {
    "modelo": "SEASAVA PLUS",
    "sistema": "Thanner",
    "valvulas": ["OTS65", "A10", "B10"],
    "especificacoes": {
      "4p": {
        "cilindros_co2": 1,
        "peso_co2_kg": X.XX,
        "peso_n2_kg": X.XX,
        "referencia": "XXXXX"
      },
      ...
    },
    "pressoes": {
      "psi": X.X,
      "mmwg": XXX.XX,
      "inh2o": XX.XX,
      "milibares": XXX
    },
    "weak_link": {
      "kn": X.X,
      "lbf": XXX.X
    }
  }
}

PASSO 4 - Validação
───────────────────
python -m json.tool SEASAVA-TEMPLATE-SPECS.json

PASSO 5 - Criação de Scripts
────────────────────────────
Após preencher JSON, avisarei para criar scripts:
- add-rfd-seasava-plus.ts
- add-rfd-seasava-rx.ts

E adicionar:
- Pressões de trabalho
- Testes (WP, NAP, B)
- Torques
- Specs de Davit Launch
    """
    
    with open('GUIA-EXTRACAO-MANUAL-SEASAVA.txt', 'w', encoding='utf-8') as f:
        f.write(guide)
    
    print(guide)
    print("\n✅ Guia salvo em: GUIA-EXTRACAO-MANUAL-SEASAVA.txt")

if __name__ == '__main__':
    main()
