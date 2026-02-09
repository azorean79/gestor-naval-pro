#!/usr/bin/env python3
"""
Script para identificar e corrigir números de certificados duplicados
"""

import json
from pathlib import Path
from collections import Counter
import re

def find_duplicates(certificates):
    """Identifica certificados duplicados"""
    cert_numbers = [cert['numero_certificado'] for cert in certificates if cert.get('numero_certificado')]
    duplicates = [num for num, count in Counter(cert_numbers).items() if count > 1]
    return duplicates

def extract_cert_number_from_filename(filename):
    """Extrai número do certificado do nome do ficheiro"""
    # Padrão: AZ25-XXX no início do nome do ficheiro
    match = re.match(r'(AZ\d{2}-\d{3})', filename, re.IGNORECASE)
    if match:
        return match.group(1).upper()
    return None

def fix_duplicates(certificates):
    """Corrige certificados duplicados usando o nome do ficheiro"""
    fixed = []
    corrections = []
    
    for cert in certificates:
        original_number = cert.get('numero_certificado')
        filename = cert.get('ficheiro', '')
        
        # Extrair número correto do nome do ficheiro
        correct_number = extract_cert_number_from_filename(filename)
        
        if correct_number and original_number != correct_number:
            corrections.append({
                'ficheiro': filename,
                'original': original_number,
                'corrigido': correct_number
            })
            cert['numero_certificado'] = correct_number
        
        fixed.append(cert)
    
    return fixed, corrections

def main():
    """Função principal"""
    input_file = Path("certificados-orey-2025-extracted.json")
    
    if not input_file.exists():
        print(f"[ERRO]: Ficheiro nao encontrado: {input_file}")
        return
    
    # Carregar dados
    print(f"\n{'='*80}")
    print(f"CORRECAO DE CERTIFICADOS DUPLICADOS")
    print(f"{'='*80}\n")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        certificates = json.load(f)
    
    print(f"Total de certificados: {len(certificates)}")
    
    # Identificar duplicados
    duplicates = find_duplicates(certificates)
    
    if duplicates:
        print(f"\nCertificados duplicados encontrados: {len(duplicates)}")
        for dup in duplicates:
            count = sum(1 for cert in certificates if cert.get('numero_certificado') == dup)
            print(f"  - {dup}: {count} ocorrencias")
            
            # Mostrar quais ficheiros têm este número
            files_with_dup = [cert['ficheiro'] for cert in certificates if cert.get('numero_certificado') == dup]
            for f in files_with_dup:
                print(f"    -> {f}")
    else:
        print("\n[OK] Nenhum certificado duplicado encontrado!")
    
    # Corrigir duplicados
    print(f"\n{'='*80}")
    print("CORRIGINDO NUMEROS DE CERTIFICADO...")
    print(f"{'='*80}\n")
    
    fixed_certificates, corrections = fix_duplicates(certificates)
    
    if corrections:
        print(f"Total de correcoes efetuadas: {len(corrections)}\n")
        for correction in corrections:
            print(f"  {correction['ficheiro']}")
            print(f"    Original:  {correction['original']}")
            print(f"    Corrigido: {correction['corrigido']}")
            print()
    else:
        print("[OK] Nenhuma correcao necessaria!")
    
    # Verificar se ainda existem duplicados após correções
    remaining_duplicates = find_duplicates(fixed_certificates)
    
    if remaining_duplicates:
        print(f"\n[AVISO]: Ainda existem {len(remaining_duplicates)} duplicados apos correcao:")
        for dup in remaining_duplicates:
            count = sum(1 for cert in fixed_certificates if cert.get('numero_certificado') == dup)
            print(f"  - {dup}: {count} ocorrencias")
    else:
        print("\n[OK] Todos os duplicados foram corrigidos!")
    
    # Guardar ficheiro corrigido
    output_file = Path("certificados-orey-2025-fixed.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(fixed_certificates, f, ensure_ascii=False, indent=2)
    
    print(f"\n[OK] Ficheiro corrigido guardado em: {output_file.absolute()}")
    
    # Estatísticas finais
    print(f"\n{'='*80}")
    print("ESTATISTICAS FINAIS")
    print(f"{'='*80}")
    print(f"Total de certificados: {len(fixed_certificates)}")
    print(f"Certificados corrigidos: {len(corrections)}")
    print(f"Certificados duplicados restantes: {len(remaining_duplicates)}")

if __name__ == "__main__":
    main()
