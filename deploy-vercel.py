#!/usr/bin/env python3
"""
Gestor Naval Pro - Deploy Vercel Helper
Automatiza o processo de deploy para Vercel
"""

import os
import sys
import subprocess
import json
from pathlib import Path

class VercelDeployer:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.env_file = self.project_root / '.env.local'
        self.vercel_json = self.project_root / 'vercel.json'
        
    def check_prerequisites(self):
        """Verificar pré-requisitos para deploy"""
        print("\n🔍 Verificando pré-requisitos...")
        checks = {
            'Node.js': ['node', '--version'],
            'npm': ['npm', '--version'],
            'Vercel CLI': ['vercel', '--version'],
            'Git': ['git', '--version']
        }
        
        for tool, cmd in checks.items():
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    version = result.stdout.strip().split()[-1]
                    print(f"  ✓ {tool}: {version}")
                else:
                    print(f"  ✗ {tool}: Não encontrado")
                    return False
            except Exception as e:
                print(f"  ✗ {tool}: Erro - {e}")
                return False
        return True
    
    def check_build(self):
        """Verificar se o build está OK"""
        print("\n🏗️  Verificando build...")
        try:
            result = subprocess.run(
                ['npm', 'run', 'build'],
                cwd=str(self.project_root),
                capture_output=True,
                text=True,
                timeout=300
            )
            if result.returncode == 0:
                print("  ✓ Build bem-sucedido")
                return True
            else:
                print("  ✗ Build falhou:")
                print(result.stderr)
                return False
        except subprocess.TimeoutExpired:
            print("  ✗ Build timeout")
            return False
        except Exception as e:
            print(f"  ✗ Erro ao verificar build: {e}")
            return False
    
    def check_env_vars(self):
        """Verificar variáveis de ambiente necessárias"""
        print("\n🔐 Verificando variáveis de ambiente...")
        required_vars = [
            'DATABASE_URL',
            'NEXTAUTH_SECRET',
            'NEXTAUTH_URL',
            'GEMINI_API_KEY',
            'NEXT_PUBLIC_SUPABASE_URL',
            'NEXT_PUBLIC_SUPABASE_ANON_KEY'
        ]
        
        missing = []
        for var in required_vars:
            if var in os.environ:
                print(f"  ✓ {var}: Configurada")
            else:
                print(f"  ✗ {var}: Ausente")
                missing.append(var)
        
        return len(missing) == 0
    
    def deploy_preview(self):
        """Deploy para preview"""
        print("\n📦 Iniciando deploy para preview...")
        try:
            result = subprocess.run(
                ['vercel', 'deploy'],
                cwd=str(self.project_root),
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                print("  ✓ Deploy preview bem-sucedido")
                return True
            else:
                print("  ✗ Deploy preview falhou:")
                print(result.stderr)
                return False
        except Exception as e:
            print(f"  ✗ Erro no deploy: {e}")
            return False
    
    def deploy_production(self):
        """Deploy para produção"""
        print("\n🚀 Iniciando deploy para PRODUÇÃO...")
        confirm = input("   ⚠️  Tem certeza? [sim/nao]: ").lower()
        
        if confirm != 'sim':
            print("   Cancelado")
            return False
        
        try:
            result = subprocess.run(
                ['vercel', 'deploy', '--prod'],
                cwd=str(self.project_root),
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                print("  ✓ Deploy produção bem-sucedido!")
                print("\n📍 Aplicação disponível em:")
                print("   https://gestor-naval-pro.vercel.app")
                return True
            else:
                print("  ✗ Deploy produção falhou:")
                print(result.stderr)
                return False
        except Exception as e:
            print(f"  ✗ Erro no deploy: {e}")
            return False
    
    def test_health(self):
        """Testar health check da aplicação"""
        print("\n🏥 Testando health check...")
        import urllib.request
        import urllib.error
        
        try:
            response = urllib.request.urlopen('https://gestor-naval-pro.vercel.app/api/health', timeout=5)
            if response.status == 200:
                print("  ✓ Health check OK")
                return True
            else:
                print(f"  ✗ Health check retornou status {response.status}")
                return False
        except urllib.error.URLError as e:
            print(f"  ✗ Erro ao conectar: {e}")
            return False
        except Exception as e:
            print(f"  ✗ Erro: {e}")
            return False
    
    def run(self):
        """Executar o processo completo"""
        print("=" * 60)
        print("🚀 GESTOR NAVAL PRO - DEPLOY VERCEL")
        print("=" * 60)
        
        # Checklist
        if not self.check_prerequisites():
            print("\n❌ Pré-requisitos não atendidos")
            return False
        
        if not self.check_env_vars():
            print("\n⚠️  Variáveis de ambiente incompletas")
            print("   Configure em .env.local ou no Vercel Dashboard")
        
        if not self.check_build():
            print("\n❌ Build falhou - não é possível fazer deploy")
            return False
        
        print("\n" + "=" * 60)
        print("📋 OPÇÕES DE DEPLOY")
        print("=" * 60)
        print("1. Deploy para preview")
        print("2. Deploy para produção")
        print("3. Testar health check")
        print("0. Sair")
        
        choice = input("\nEscolha uma opção: ").strip()
        
        if choice == '1':
            return self.deploy_preview()
        elif choice == '2':
            return self.deploy_production()
        elif choice == '3':
            return self.test_health()
        else:
            print("Saindo...")
            return False

if __name__ == '__main__':
    deployer = VercelDeployer()
    success = deployer.run()
    sys.exit(0 if success else 1)
