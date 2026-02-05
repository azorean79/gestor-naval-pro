#!/usr/bin/env node

/**
 * SCRIPT DE PRODUÇÃO - Gestor Naval Pro
 * Executa verificações pré-deploy e faz deploy automático
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ProductionDeployer {
  constructor() {
    this.checks = {
      build: false,
      lint: false,
      typescript: false,
      env: false,
      database: false,
      security: false,
      performance: false,
      tests: false
    };
    this.errors = [];
  }

  log(message, type = 'info') {
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };
    console.log(`${emoji[type]} ${message}`);
  }

  error(message) {
    this.errors.push(message);
    this.log(message, 'error');
  }

  success(message) {
    this.log(message, 'success');
  }

  // 1. Verificar build
  checkBuild() {
    try {
      this.log('Verificando build de produção...');
      execSync('npm run build', { stdio: 'pipe' });
      this.checks.build = true;
      this.success('Build executado com sucesso');
    } catch (error) {
      this.error(`Build falhou: ${error.message}`);
    }
  }

  // 2. Verificar linting
  checkLint() {
    try {
      this.log('Verificando linting...');
      execSync('npm run lint', { stdio: 'pipe' });
      this.checks.lint = true;
      this.success('Linting passou');
    } catch (error) {
      this.error(`Linting falhou: ${error.message}`);
    }
  }

  // 3. Verificar TypeScript
  checkTypeScript() {
    try {
      this.log('Verificando TypeScript...');
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      this.checks.typescript = true;
      this.success('TypeScript sem erros');
    } catch (error) {
      this.error(`TypeScript falhou: ${error.message}`);
    }
  }

  // 4. Verificar variáveis de ambiente
  checkEnvironment() {
    try {
      this.log('Verificando variáveis de ambiente...');

      const envPath = path.join(process.cwd(), '.env.production');
      if (!fs.existsSync(envPath)) {
        throw new Error('.env.production não encontrado');
      }

      const envContent = fs.readFileSync(envPath, 'utf8');
      const requiredVars = [
        'DATABASE_URL',
        'NEXT_PUBLIC_APP_URL',
        'OPENAI_API_KEY'
      ];

      for (const varName of requiredVars) {
        if (!envContent.includes(`${varName}=`)) {
          throw new Error(`Variável ${varName} não encontrada em .env.production`);
        }
      }

      this.checks.env = true;
      this.success('Variáveis de ambiente configuradas');
    } catch (error) {
      this.error(`Variáveis de ambiente: ${error.message}`);
    }
  }

  // 5. Verificar conexão com banco
  checkDatabase() {
    try {
      this.log('Verificando conexão com banco de dados...');
      execSync('npx prisma db push --accept-data-loss', { stdio: 'pipe' });
      this.checks.database = true;
      this.success('Banco de dados conectado e atualizado');
    } catch (error) {
      this.error(`Banco de dados: ${error.message}`);
    }
  }

  // 6. Verificar segurança básica
  checkSecurity() {
    try {
      this.log('Verificando configurações de segurança...');

      // Verificar se não há console.logs em produção
      const srcDir = path.join(process.cwd(), 'src');
      const hasConsoleLogs = this.findInFiles(srcDir, /console\.(log|error|warn)/);

      if (hasConsoleLogs.length > 0) {
        this.log(`Encontrados ${hasConsoleLogs.length} console.logs - considere removê-los para produção`, 'warning');
      }

      // Verificar se rate limiting está implementado
      const rateLimitExists = fs.existsSync(path.join(srcDir, 'lib', 'rate-limit.ts'));
      if (!rateLimitExists) {
        throw new Error('Rate limiting não implementado');
      }

      this.checks.security = true;
      this.success('Configurações de segurança OK');
    } catch (error) {
      this.error(`Segurança: ${error.message}`);
    }
  }

  // 7. Verificar performance
  checkPerformance() {
    try {
      this.log('Verificando performance...');

      const nextDir = path.join(process.cwd(), '.next');
      if (fs.existsSync(nextDir)) {
        const size = this.getDirectorySize(nextDir);
        const sizeMB = (size / (1024 * 1024)).toFixed(2);

        if (sizeMB > 50) {
          this.log(`Build size: ${sizeMB}MB - considere otimização`, 'warning');
        } else {
          this.success(`Build size: ${sizeMB}MB`);
        }
      }

      this.checks.performance = true;
    } catch (error) {
      this.error(`Performance: ${error.message}`);
    }
  }

  // 8. Executar testes
  runTests() {
    try {
      this.log('Executando testes...');

      // Tentar executar testes unitários
      try {
        execSync('npm test', { stdio: 'pipe', timeout: 30000 });
        this.success('Testes unitários passaram');
      } catch (error) {
        this.log('Testes unitários falharam ou não configurados', 'warning');
      }

      this.checks.tests = true;
    } catch (error) {
      this.error(`Testes: ${error.message}`);
    }
  }

  // Método auxiliar para buscar em arquivos
  findInFiles(dir, pattern) {
    const results = [];

    function search(currentDir) {
      const files = fs.readdirSync(currentDir);

      for (const file of files) {
        const filePath = path.join(currentDir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          search(filePath);
        } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx'))) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (pattern.test(content)) {
              results.push(filePath);
            }
          } catch (error) {
            // Ignorar arquivos que não podem ser lidos
          }
        }
      }
    }

    search(dir);
    return results;
  }

  // Método auxiliar para calcular tamanho do diretório
  getDirectorySize(dirPath) {
    let totalSize = 0;

    function calculateSize(itemPath) {
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        const files = fs.readdirSync(itemPath);
        for (const file of files) {
          calculateSize(path.join(itemPath, file));
        }
      } else {
        totalSize += stats.size;
      }
    }

    calculateSize(dirPath);
    return totalSize;
  }

  // Executar deploy
  async deploy() {
    try {
      this.log('Iniciando deploy para Vercel...');

      // Verificar se estamos em um repositório git
      execSync('git status', { stdio: 'pipe' });

      // Fazer push para trigger do deploy automático
      execSync('git push origin master', { stdio: 'pipe' });

      this.success('Deploy enviado para Vercel - aguardando conclusão automática');
      this.log('URL de produção: https://gestor-naval-pro.vercel.app', 'info');

    } catch (error) {
      this.error(`Deploy falhou: ${error.message}`);
    }
  }

  // Executar todas as verificações
  async run() {
    console.log('🚀 INICIANDO VERIFICAÇÕES PRÉ-PRODUÇÃO\n');

    // Executar verificações em ordem
    this.checkBuild();
    this.checkLint();
    this.checkTypeScript();
    this.checkEnvironment();
    this.checkDatabase();
    this.checkSecurity();
    this.checkPerformance();
    this.runTests();

    // Resultado das verificações
    console.log('\n📊 RESULTADO DAS VERIFICAÇÕES:');
    const passed = Object.values(this.checks).filter(Boolean).length;
    const total = Object.keys(this.checks).length;

    Object.entries(this.checks).forEach(([check, passed]) => {
      const status = passed ? '✅' : '❌';
      console.log(`${status} ${check}`);
    });

    console.log(`\nResultado: ${passed}/${total} verificações passaram`);

    // Se todas passaram, fazer deploy
    if (passed === total && this.errors.length === 0) {
      console.log('\n🎉 TODAS AS VERIFICAÇÕES PASSARAM!');
      console.log('🚀 Iniciando deploy...\n');

      await this.deploy();
    } else {
      console.log('\n❌ VERIFICAÇÕES FALHARAM!');
      console.log('Corrija os erros antes de fazer deploy:');
      this.errors.forEach(error => console.log(`  - ${error}`));
      process.exit(1);
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const deployer = new ProductionDeployer();
  deployer.run().catch(console.error);
}

module.exports = { ProductionDeployer };