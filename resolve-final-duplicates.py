#!/usr/bin/env python3
"""
Script para resolver duplicados restantes atribuindo números únicos
"""

import json
from pathlib import Path

def resolve_remaining_duplicates(certificates):
    """Resolve duplicados restantes atribuindo números sequenciais"""
    
    # Casos específicos de duplicados
    duplicate_cases = {
        'AZ25-028': [
            ('AZ25-028 ILHA DE SÃO MIGUEL.xlsx', 'AZ25-028'),  # Manter
            ('AZ25-028 PRINCESA ARIEL.xlsx', 'AZ25-029'),       # Mudar para 029
        ],
        'AZ25-093': [
            ('AZ25-093 BETTY.xlsx', 'AZ25-093'),                # Manter
            ('AZ25-093 VITOR VELOSO.xlsx', 'AZ25-094'),         # Mudar para 094
        ],
        'AZ25-150': [
            ('AZ25-150 GARAJAU DOS D.xlsx', 'AZ25-150'),        # Manter
            ('AZ25-150 NANNY.xlsx', 'AZ25-151'),                # Mudar para 151
        ],
        'AZ25-223': [
            ('AZ25-223 ANDRE E TIAGO.xlsx', 'AZ25-223'),        # Manter
            ('AZ25-223 CAFRE.xlsx', 'AZ25-225'),                # Mudar para 225 (224 já existe)
        ]
    }
    
    corrections = []
    
    for cert in certificates:
        filename = cert.get('ficheiro', '')
        original_number = cert.get('numero_certificado')
        
        # Verificar se este certificado precisa de correção
        for dup_num, cases in duplicate_cases.items():
            for case_file, new_number in cases:
                if filename == case_file and original_number != new_number:
                    corrections.append({
                        'ficheiro': filename,
                        'original': original_number,
                        'corrigido': new_number
                    })
                    cert['numero_certificado'] = new_number
                    break
    
    return certificates, corrections

def verify_no_duplicates(certificates):
    """Verifica se ainda existem duplicados"""
    from collections import Counter
    cert_numbers = [cert['numero_certificado'] for cert in certificates if cert.get('numero_certificado')]
    duplicates = [num for num, count in Counter(cert_numbers).items() if count > 1]
    return duplicates

def main():
    """Função principal"""
    input_file = Path("certificados-orey-2025-fixed.json")
    
    if not input_file.exists():
        print(f"[ERRO]: Ficheiro nao encontrado: {input_file}")
        return
    
    # Carregar dados
    print(f"\n{'='*80}")
    print(f"RESOLUCAO FINAL DE DUPLICADOS")
    print(f"{'='*80}\n")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        certificates = json.load(f)
    
    print(f"Total de certificados: {len(certificates)}")
    
    # Verificar duplicados antes
    duplicates_before = verify_no_duplicates(certificates)
    print(f"Duplicados encontrados: {len(duplicates_before)}")
    
    # Resolver duplicados
    fixed_certificates, corrections = resolve_remaining_duplicates(certificates)
    
    if corrections:
        print(f"\nCorrecoes efetuadas: {len(corrections)}\n")
        for correction in corrections:
            print(f"  {correction['ficheiro']}")
            print(f"    {correction['original']} -> {correction['corrigido']}")
            print()
    
    # Verificar duplicados depois
    duplicates_after = verify_no_duplicates(fixed_certificates)
    
    if duplicates_after:
        print(f"\n[AVISO]: Ainda existem {len(duplicates_after)} duplicados:")
        for dup in duplicates_after:
            count = sum(1 for cert in fixed_certificates if cert.get('numero_certificado') == dup)
            print(f"  - {dup}: {count} ocorrencias")
    else:
        print("\n[OK] Todos os duplicados foram resolvidos!")
    
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

if __name__ == "__main__":
    main()
