#!/usr/bin/env python3
"""
Importar spares do MK IV para banco PostgreSQL
Usa psycopg2 para conectar diretamente
"""

import os
import json
from pathlib import Path

# Tentar importar psycopg2
try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    import subprocess
    import sys
    print("📥 Instalando psycopg2...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "psycopg2-binary"])
    import psycopg2
    import psycopg2.extras

# Tentar importar python-dotenv
try:
    from dotenv import load_dotenv
except ImportError:
    import subprocess
    import sys
    print("📥 Instalando python-dotenv...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "python-dotenv"])
    from dotenv import load_dotenv
load_dotenv('.env.local', override=True)

database_url = os.getenv('POSTGRES_URL')
if not database_url:
    print("❌ POSTGRES_URL não está configurada em .env.local")
    exit(1)

print("\n🔧 Importando spare parts do MK IV...\n")

# Ler arquivo JSON
spares_file = Path("MK_IV_spares_detailed.json")
if not spares_file.exists():
    print(f"❌ {spares_file} não encontrado")
    exit(1)

with open(spares_file) as f:
    spares_data = json.load(f)

categoria = 'SPARE_PARTS_MK_IV'
references = spares_data.get('referencias_encontradas', [])
components = spares_data.get('spares', [])
imagens = spares_data.get('imagens_por_pagina', {})

print(f"📊 Dados carregados:")
print(f"   Referências: {len(references)}")
print(f"   Componentes: {len(components)}")
print(f"   Imagens disponíveis: {len(imagens)}\n")

# Conectar ao banco
try:
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    print("✅ Conectado ao PostgreSQL\n")
    
    ref_adicionadas = 0
    ref_existentes = 0
    comp_adicionados = 0
    
    # Inserir referências
    print(f"📦 Processando {len(references)} referências...\n")
    
    for ref in references:
        if not ref or ref == '.' or len(ref) < 3:
            continue
        
        # Verificar se existe
        cursor.execute(
            'SELECT id FROM stock WHERE "refFabricante" = %s AND categoria = %s',
            (ref.strip(), categoria)
        )
        
        if cursor.fetchone():
            ref_existentes += 1
            continue
        
        # Quebra de página aleatória para imagem
        paginas = list(imagens.keys())
        imagem_page = paginas[len(ref) % len(paginas)] if paginas else None
        imagem_path = f"/api/spares/mk4/{imagem_page}" if imagem_page else None
        
        nome = f"MK IV Spare Part - {ref.upper()}"
        descricao = f"MK IV Spare Part - Referência do fabricante: {ref}"
        
        try:
            cursor.execute(
                """INSERT INTO stock (nome, descricao, categoria, quantidade, "quantidadeMinima", "refFabricante", imagem, lote, status, "createdAt", "updatedAt")
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                   ON CONFLICT ("refFabricante") DO NOTHING""",
                (nome, descricao, categoria, 0, 0, ref.strip(), imagem_path, 'MK_IV_SPARES', 'ativo')
            )
            ref_adicionadas += 1
            
            if ref_adicionadas % 10 == 0:
                print(f"   ✓ {ref_adicionadas} referências processadas")
        except Exception as e:
            print(f"   ❌ Erro ao inserir {ref}: {e}")
    
    print(f"\n✅ Referências: {ref_adicionadas} adicionadas, {ref_existentes} existentes\n")
    
    # Inserir componentes
    print(f"📦 Processando {len(components)} componentes...\n")
    
    for comp in components:
        if not comp.get('descricao') and not comp.get('refFabricante'):
            continue
        
        ref = comp.get('refFabricante', '')
        if not ref:
            continue
        
        # Verificar se existe
        cursor.execute(
            'SELECT id FROM stock WHERE "refFabricante" = %s AND categoria = %s',
            (ref, categoria)
        )
        
        if cursor.fetchone():
            continue
        
        imagem_path = None
        if comp.get('pagina'):
            imagem_path = f"/api/spares/mk4/page_{comp['pagina']:03d}.png"
        
        nome = comp.get('descricao', f"MK IV - {ref}")
        descricao = f"{comp.get('descricao', 'MK IV Spare Part')} - Ref: {ref}"
        
        try:
            cursor.execute(
                """INSERT INTO stock (nome, descricao, categoria, quantidade, "quantidadeMinima", "refFabricante", imagem, lote, status, "createdAt", "updatedAt")
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                   ON CONFLICT ("refFabricante") DO NOTHING""",
                (nome, descricao, categoria, 0, 0, ref, imagem_path, 'MK_IV_SPARES', 'ativo')
            )
            comp_adicionados += 1
        except Exception as e:
            print(f"   ❌ Erro ao inserir componente: {e}")
    
    print(f"\n✅ Componentes: {comp_adicionados} adicionados\n")
    
    # Confirmar transação
    conn.commit()
    cursor.close()
    conn.close()
    
    # Resumo
    total = ref_adicionadas + comp_adicionados
    print(f"\n{'='*60}")
    print(f"✨ IMPORTAÇÃO CONCLUÍDA!\n")
    print(f"📊 RESUMO:")
    print(f"   Total adicionado: {total}")
    print(f"   Referências: {ref_adicionadas}")
    print(f"   Componentes: {comp_adicionados}")
    print(f"   Já existentes: {ref_existentes}")
    print(f"   Categoria: {categoria}\n")

except (Exception, psycopg2.DatabaseError) as error:
    print(f"❌ Erro de conexão: {error}")
    exit(1)
