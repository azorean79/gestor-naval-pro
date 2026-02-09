#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OCR para PDFs SEASAVA - Extrai especificações técnicas
Processa páginas específicas dos PDFs escaneados
"""

import os
import json
import re
from pathlib import Path
from pdf2image import convert_from_path
import pytesseract
from datetime import datetime

class ExtractorSEASAVA:
    def __init__(self):
        self.pdfs = {
            'SEASAVA PLUS': 'MARCAS/Seasava Plus.pdf',
            'SEASAVA X E R': 'MARCAS/Seasava Plus X E R.pdf'
        }
        self.results = {}
        
    def extract_pages(self, pdf_path, start_page=1, end_page=None, pages_list=None):
        """Extrai OCR de páginas específicas"""
        print(f"\n📄 Processando: {pdf_path}")
        print("  Convertendo PDF em imagens...")
        
        try:
            if pages_list:
                images = convert_from_path(pdf_path, first_page=min(pages_list), 
                                          last_page=max(pages_list))
                filtered_images = [images[i-1] for i in pages_list if i <= len(images)]
                images = filtered_images
            else:
                images = convert_from_path(pdf_path, first_page=start_page, 
                                          last_page=end_page)
            
            print(f"  ✅ {len(images)} página(s) convertidas")
            
            all_text = []
            for i, image in enumerate(images):
                page_num = (pages_list[i] if pages_list else start_page + i)
                print(f"  🔤 Extraindo OCR página {page_num}...", end='')
                
                text = pytesseract.image_to_string(image, lang='eng')
                all_text.append({
                    'page': page_num,
                    'text': text
                })
                print(" ✓")
            
            return all_text
            
        except Exception as e:
            print(f"  ❌ Erro: {e}")
            return []
    
    def procesar_seasava_plus(self):
        """Extrai SEASAVA PLUS"""
        print("\n" + "="*80)
        print("SEASAVA PLUS - EXTRAÇÃO OCR")
        print("="*80)
        
        # Extrair primeiras 100 páginas que provavelmente contem especificações
        pages_to_extract = list(range(1, 101))  # Primeiras 100 páginas
        
        text_data = self.extract_pages(self.pdfs['SEASAVA PLUS'], pages_list=pages_to_extract)
        
        if text_data:
            all_text = '\n'.join([item['text'] for item in text_data])
            
            # Salvar texto bruto
            with open('seasava-plus-ocr-raw.txt', 'w', encoding='utf-8') as f:
                for item in text_data:
                    f.write(f"\n--- PÁGINA {item['page']} ---\n")
                    f.write(item['text'])
            
            print(f"\n✅ Texto salvo em: seasava-plus-ocr-raw.txt")
            
            # Tentar extrair especificações
            specs = self.extract_specs_from_text(all_text)
            return specs
        
        return None
    
    def procesar_seasava_x_e_r(self):
        """Extrai SEASAVA X E R"""
        print("\n" + "="*80)
        print("SEASAVA X E R - EXTRAÇÃO OCR")
        print("="*80)
        
        # Extrair todas as páginas disponíveis
        pages_to_extract = list(range(1, 152))
        
        text_data = self.extract_pages(self.pdfs['SEASAVA X E R'], pages_list=pages_to_extract)
        
        if text_data:
            all_text = '\n'.join([item['text'] for item in text_data])
            
            # Salvar texto bruto
            with open('seasava-xe-r-ocr-raw.txt', 'w', encoding='utf-8') as f:
                for item in text_data:
                    f.write(f"\n--- PÁGINA {item['page']} ---\n")
                    f.write(item['text'])
            
            print(f"\n✅ Texto salvo em: seasava-xe-r-ocr-raw.txt")
            
            # Tentar extrair especificações
            specs = self.extract_specs_from_text(all_text)
            return specs
        
        return None
    
    def extract_specs_from_text(self, text):
        """Extrai números e especificações do texto OCR"""
        specs = {}
        
        # Procurar por padrões de capacidades
        capacities = re.findall(r'(\d+)\s*p(?:erson|essoa|erspoon)', text, re.IGNORECASE)
        if capacities:
            specs['capacidades_encontradas'] = list(set(capacities))
        
        # Procurar pressões em PSI
        pressoes_psi = re.findall(r'([\d.]+)\s*psi', text, re.IGNORECASE)
        if pressoes_psi:
            specs['pressoes_psi'] = pressoes_psi
        
        # Procurar pesos de CO2
        pesos_co2 = re.findall(r'([\d.]+)\s*kg\s*co2', text, re.IGNORECASE)
        if pesos_co2:
            specs['pesos_co2'] = pesos_co2
        
        return specs
    
    def run(self):
        """Executa extração de todos os PDFs"""
        print("\n" + "="*80)
        print("EXTRATOR OCR - SEASAVA PLUS e SEASAVA X E R")
        print("="*80)
        print(f"Iniciado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        self.results['seasava_plus'] = self.procesar_seasava_plus()
        self.results['seasava_x_e_r'] = self.procesar_seasava_x_e_r()
        
        # Salvar resultados em JSON
        with open('seasava-ocr-specs.json', 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
        
        print("\n" + "="*80)
        print("✅ EXTRAÇÃO CONCLUÍDA!")
        print("="*80)
        print("\nArquivos gerados:")
        print("  📄 seasava-plus-ocr-raw.txt - Texto bruto SEASAVA PLUS")
        print("  📄 seasava-xe-r-ocr-raw.txt - Texto bruto SEASAVA X E R")
        print("  📄 seasava-ocr-specs.json - Especificações estruturadas")
        print("\n💡 Próximo passo: Revisar arquivos .txt e preencher SEASAVA-TEMPLATE-SPECS.json manualmente")
        print("\n" + "="*80)

if __name__ == '__main__':
    extrator = ExtractorSEASAVA()
    extrator.run()
