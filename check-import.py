import psycopg2
import os
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv('.env.local')

# Use standard PostgreSQL URL instead of Accelerate proxy
db_url = os.getenv('POSTGRES_URL')
print(f"Conectando ao banco de dados...")
print(f"URL (truncada): {db_url[:50]}...")

try:
    # Connect using standard PostgreSQL URL with timeout
    conn = psycopg2.connect(db_url, connect_timeout=10)
    cursor = conn.cursor()
    
    # Count records
    print("Contando certificados...")
    cursor.execute("SELECT COUNT(*) FROM \"Certificado\"")
    cert_count = cursor.fetchone()[0]
    
    print("Contando jangadas...")
    cursor.execute("SELECT COUNT(*) FROM \"Jangada\"")
    jangada_count = cursor.fetchone()[0]
    
    print("Contando navios...")
    cursor.execute("SELECT COUNT(*) FROM \"Navio\"")
    navio_count = cursor.fetchone()[0]
    
    print("=" * 50)
    print("RESUMO FINAL DA IMPORTACAO:")
    print("=" * 50)
    print(f"Certificados criados: {cert_count}")
    print(f"Jangadas criadas: {jangada_count}")
    print(f"Navios criados: {navio_count}")
    print("=" * 50)
    
    cursor.close()
    conn.close()
    
except Exception as e:
    import traceback
    print(f"Erro ao conectar: {e}")
    traceback.print_exc()
