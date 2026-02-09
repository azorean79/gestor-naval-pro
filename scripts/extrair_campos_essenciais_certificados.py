# Script para extrair campos essenciais de todos os certificados Excel da pasta CERTIFICADOS 2025 e gerar CSVs compatíveis para importação

import os
import re
import pandas as pd
import openpyxl

CERT_DIR = r"OREY DIGITAL 2026/2025/CERTIFICADOS 2025"
OUTPUT_DIR = r"OREY DIGITAL 2026/2025/IMPORT_CSVS"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Regex para capturar campos essenciais

# Novos padrões mais flexíveis
patterns = {
    'certificado': re.compile(r'CERTIFICADO\s*[Nº:]*\s*([A-Z0-9-]+)', re.I),
    'jangada': re.compile(r'JANGADA\s*[:|]*\s*([A-Z0-9-]+)', re.I),
    'marca': re.compile(r'MARCA\s*[:|]*\s*([A-Z0-9\s]+)', re.I),
    'modelo': re.compile(r'MODELO\s*[:|]*\s*([A-Z0-9\s]+)', re.I),
    'marca_modelo': re.compile(r'MARCA/MODELO\s*[:|]*\s*([A-Z0-9\s]+)', re.I),
    'data_inspecao': re.compile(r'DATA INSPE[ÇC][AÃ]O\s*[:|]*\s*([0-9/]+)', re.I),
    'data_proxima': re.compile(r'DATA PR[ÓO]XIMA INSPE[ÇC][AÃ]O\s*[:|]*\s*([0-9/]+)', re.I),
    'lotacao': re.compile(r'LOTA[ÇC][AÃ]O\s*[:|]*\s*([0-9]+)', re.I),
    'data_fabrico': re.compile(r'DATA DE FABRICO\s*[:|]*\s*([0-9/]+)', re.I),
    'tipo': re.compile(r'TIPO\s*[:|]*\s*([A-Z0-9\s]+)', re.I),
    'tipo_pack': re.compile(r'TIPO DE PACK\s*[:|]*\s*([A-Z0-9\s]+)', re.I)
}


def extract_fields_from_excel(filepath):
    wb = openpyxl.load_workbook(filepath, data_only=True)
    sheet = wb.active
    fields = {k: '' for k in patterns}
    # Para marca/modelo, tentar capturar separados ou juntos
    for row in sheet.iter_rows(values_only=True):
        for cell in row:
            if not cell or not isinstance(cell, str):
                continue
            for key, pat in patterns.items():
                m = pat.search(cell)
                if m and not fields[key]:
                    fields[key] = m.group(1).strip()
    # Se não encontrou marca/modelo juntos, tenta separados
    if not fields['marca_modelo']:
        mm = []
        if fields['marca']:
            mm.append(fields['marca'])
        if fields['modelo']:
            mm.append(fields['modelo'])
        if mm:
            fields['marca_modelo'] = ' '.join(mm)

    # Heurística: se JANGADA contém 'RFD' e 'SEASAVA', preenche marca/modelo
    jangada_val = fields['jangada'].upper() if fields['jangada'] else ''
    if 'RFD' in jangada_val and 'SEASAVA' in jangada_val:
        fields['marca'] = 'RFD'
        fields['modelo'] = 'SEASAVA PLUS'
        fields['marca_modelo'] = 'RFD SEASAVA PLUS'
    return fields


def main():
    for fname in os.listdir(CERT_DIR):
        if not fname.lower().endswith('.xlsx'):
            continue
        fpath = os.path.join(CERT_DIR, fname)
        fields = extract_fields_from_excel(fpath)
        out_csv = os.path.join(OUTPUT_DIR, fname.replace('.xlsx', '-essencial.csv'))
        with open(out_csv, 'w', encoding='utf-8') as f:
            f.write(f"CERTIFICADO Nº: {fields['certificado']}\n")
            f.write(f"JANGADA: | {fields['jangada']}\n")
            f.write(f"MARCA/MODELO: {fields['marca_modelo']}\n")
            f.write(f"LOTAÇÃO: {fields['lotacao']}\n")
            f.write(f"TIPO: {fields['tipo']}\n")
            f.write(f"TIPO DE PACK: {fields['tipo_pack']}\n")
            f.write(f"DATA DE FABRICO: {fields['data_fabrico']}\n")
            f.write(f"DATA INSPEÇÃO: {fields['data_inspecao']}\n")
            f.write(f"DATA PRÓXIMA INSPEÇÃO: {fields['data_proxima']}\n")
        print(f"Gerado: {out_csv}")

if __name__ == "__main__":
    main()
