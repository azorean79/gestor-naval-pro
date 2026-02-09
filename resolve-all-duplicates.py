#!/usr/bin/env python3
"""
Script para resolver TODOS os duplicados encontrando números livres
"""

import json
from pathlib import Path
from collections import Counter
import re

def get_all_used_numbers(certificates):
    """Retorna todos os números de certificado já em uso"""
    used = set()
    for cert in certificates:
        num = cert.get('numero_certificado')
        if num:
            used.add(num)
    return used

def find_next_available_number(base_number, used_numbers):
    """Encontra o próximo número disponível após base_number"""
    # Extrair o ano e número base (ex: AZ25-028 -> 25, 28)
    match = re.match(r'(AZ)(\d{2})-(\d{3})', base_number)
    if not match:
        return None
    
    prefix, year, num_str = match.groups()
    num = int(num_str)
    
    # Procurar próximo número disponível
    while True:
        num += 1
        if num > 999:  # Limite de segurança
            return None
        
        candidate = f"{prefix}{year}-{num:03d}"
        if candidate not in used_numbers:
            return candidate

def resolve_all_duplicates(certificates):
    """Resolve TODOS os duplicados"""
    used_numbers = get_all_used_numbers(certificates)
    duplicates = find_duplicates(certificates)
    corrections = []
    
    for dup_number in duplicates:
        # Encontrar todos os certificados com este número
        dup_certs = [(i, cert) for i, cert in enumerate(certificates) 
                     if cert.get('numero_certificado') == dup_number]
        
        # Manter o primeiro, renumerar os outros
        for idx, (cert_idx, cert) in enumerate(dup_certs):
            if idx == 0:
                # Manter o primeiro certificado com o número original
                continue
            
            # Encontrar próximo número disponível
            new_number = find_next_available_number(dup_number, used_numbers)
            
            if new_number:
                corrections.append({
                    'ficheiro': cert['ficheiro'],
                    'original': dup_number,
                    'corrigido': new_number
                })
                
                # Atualizar certificado
                certificates[cert_idx]['numero_certificado'] = new_number
                
                # Adicionar novo número aos usados
                used_numbers.add(new_number)
    
    return certificates, corrections

def find_duplicates(certificates):
    """Identifica certificados duplicados"""
    cert_numbers = [cert['numero_certificado'] for cert in certificates if cert.get('numero_certificado')]
    duplicates = [num for num, count in Counter(cert_numbers).items() if count > 1]
    return duplicates

def main():
    """Função principal"""
    input_file = Path("certificados-orey-2025-final.json")
    
    if not input_file.exists():
        # Tentar ficheiro anterior
        input_file = Path("certificados-orey-2025-fixed.json")
        if not input_file.exists():
            print(f"[ERRO]: Nenhum ficheiro encontrado")
            return
    
    # Carregar dados
    print(f"\n{'='*80}")
    print(f"RESOLUCAO AUTOMATICA DE TODOS OS DUPLICADOS")
    print(f"{'='*80}\n")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        certificates = json.load(f)
    
    print(f"Total de certificados: {len(certificates)}")
    
    # Verificar duplicados antes
    duplicates_before = find_duplicates(certificates)
    print(f"Duplicados encontrados: {len(duplicates_before)}")
    
    if duplicates_before:
        for dup in duplicates_before:
            count = sum(1 for cert in certificates if cert.get('numero_certificado') == dup)
            files = [cert['ficheiro'] for cert in certificates if cert.get('numero_certificado') == dup]
            print(f"\n  {dup}: {count} ocorrencias")
            for f in files:
                print(f"    - {f}")
    
    # Resolver todos os duplicados
    print(f"\n{'='*80}")
    print("CORRIGINDO...")
    print(f"{'='*80}\n")
    
    fixed_certificates, corrections = resolve_all_duplicates(certificates)
    
    if corrections:
        print(f"Correcoes efetuadas: {len(corrections)}\n")
        for correction in corrections:
            print(f"  {correction['ficheiro']}")
            print(f"    {correction['original']} -> {correction['corrigido']}")
            print()
    
    # Verificar duplicados depois
    duplicates_after = find_duplicates(fixed_certificates)
    
    if duplicates_after:
        print(f"\n[ERRO]: Ainda existem {len(duplicates_after)} duplicados:")
        for dup in duplicates_after:
            count = sum(1 for cert in fixed_certificates if cert.get('numero_certificado') == dup)
            print(f"  - {dup}: {count} ocorrencias")
    else:
        print("\n[OK] TODOS os duplicados foram resolvidos com sucesso!")
    
    # Guardar ficheiro final
    output_file = Path("certificados-orey-2025-final.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(fixed_certificates, f, ensure_ascii=False, indent=2)
    
    print(f"\n[OK] Ficheiro final guardado em: {output_file.absolute()}")
    
    # Estatísticas
    print(f"\n{'='*80}")
    print("ESTATISTICAS FINAIS")
    print(f"{'='*80}")
    print(f"Total de certificados: {len(fixed_certificates)}")
    print(f"Duplicados antes: {len(duplicates_before)}")
    print(f"Duplicados depois: {len(duplicates_after)}")
    print(f"Correcoes efetuadas: {len(corrections)}")
    
    # Mostrar todos os números de certificado únicos
    unique_certs = sorted(set(cert['numero_certificado'] for cert in fixed_certificates if cert.get('numero_certificado')))
    print(f"Total de certificados unicos: {len(unique_certs)}")

if __name__ == "__main__":
    main()
