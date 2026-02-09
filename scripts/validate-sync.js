#!/usr/bin/env node

/**
 * SCRIPT DE SINCRONIZAÇÃO
 * Verifica se todos os módulos, páginas e formulários estão sincronizados
 * 
 * Uso: npm run validate:sync
 * ou: node scripts/validate-sync.js
 */

const fs = require('fs');
const path = require('path');

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';

let errors = [];
let warnings = [];
let successes = [];

function log(color, text, icon = '') {
  console.log(`${color}${icon} ${text}${RESET}`);
}

function checkFile(filePath, name) {
  if (fs.existsSync(filePath)) {
    successes.push(`✓ ${name}`);
    return true;
  } else {
    errors.push(`✗ ${name} - ARQUIVO NÃO ENCONTRADO: ${filePath}`);
    return false;
  }
}

function checkFileContains(filePath, searchText, name) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(searchText)) {
      successes.push(`✓ ${name} - contém "${searchText}"`);
      return true;
    } else {
      warnings.push(`⚠ ${name} - NÃO contém "${searchText}"`);
      return false;
    }
  } catch (err) {
    errors.push(`✗ ${name} - Erro ao ler arquivo: ${err.message}`);
    return false;
  }
}

function checkDirectory(dirPath, name) {
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    successes.push(`✓ ${name} - diretório existe`);
    return true;
  } else {
    errors.push(`✗ ${name} - DIRETÓRIO NÃO ENCONTRADO: ${dirPath}`);
    return false;
  }
}

function getModulesFromAppDir() {
  const appDir = path.join(__dirname, '../src/app');
  return fs.readdirSync(appDir)
    .filter(item => {
      const fullPath = path.join(appDir, item);
      return fs.statSync(fullPath).isDirectory() && !item.startsWith('.');
    });
}

function validateSchema() {
  log(BLUE, '\n═══════════════════════════════════════════════════════════════');
  log(BLUE, 'VALIDANDO SCHEMAS E TIPOS');
  log(BLUE, '═══════════════════════════════════════════════════════════════');
  
  const libDir = path.join(__dirname, '../src/lib');
  
  // Verificar arquivos principais
  checkFile(path.join(libDir, 'index.ts'), 'lib/index.ts - Exportações centralizadas');
  checkFile(path.join(libDir, 'types.ts'), 'lib/types.ts - Tipos TypeScript');
  checkFile(path.join(libDir, 'validation-schemas.ts'), 'lib/validation-schemas.ts - Schemas Zod');
  checkFile(path.join(libDir, 'SINCRONIZACAO.md'), 'lib/SINCRONIZACAO.md - Documentação');
  
  // Verificar conteúdo de types.ts
  const typesPath = path.join(libDir, 'types.ts');
  checkFileContains(typesPath, 'type Envio', 'types.ts - tipo Envio');
  checkFileContains(typesPath, 'type EnvioItem', 'types.ts - tipo EnvioItem');
  checkFileContains(typesPath, 'type Correspondencia', 'types.ts - tipo Correspondencia');
  checkFileContains(typesPath, 'interface EnvioForm', 'types.ts - interface EnvioForm');
  checkFileContains(typesPath, 'interface TarefaForm', 'types.ts - interface TarefaForm');
  
  // Verificar conteúdo de validation-schemas.ts
  const schemasPath = path.join(libDir, 'validation-schemas.ts');
  checkFileContains(schemasPath, 'envioSchema', 'validation-schemas.ts - schema envio');
  checkFileContains(schemasPath, 'correspondenciaSchema', 'validation-schemas.ts - schema correspondencia');
  checkFileContains(schemasPath, 'tarefaSchema', 'validation-schemas.ts - schema tarefa');
  checkFileContains(schemasPath, 'inspecaoComponenteSchema', 'validation-schemas.ts - schema inspecao componente');
}

function validateModules() {
  log(BLUE, '\n═══════════════════════════════════════════════════════════════');
  log(BLUE, 'VALIDANDO MÓDULOS');
  log(BLUE, '═══════════════════════════════════════════════════════════════');
  
  const modules = getModulesFromAppDir();
  
  modules.forEach(module => {
    log(YELLOW, `\nMódulo: ${module}`);
    
    const modulePath = path.join(__dirname, '../src/app', module);
    const componentPath = path.join(__dirname, '../src/components', module);
    
    // Verificar página principal
    const pagePath = path.join(modulePath, 'page.tsx');
    if (fs.existsSync(pagePath)) {
      successes.push(`  ✓ ${module}/page.tsx existe`);
    } else {
      warnings.push(`  ⚠ ${module}/page.tsx - pode estar faltando`);
    }
    
    // Verificar componentes
    if (fs.existsSync(componentPath)) {
      successes.push(`  ✓ components/${module}/ existe`);
    } else {
      warnings.push(`  ⚠ components/${module}/ - pode estar faltando`);
    }
  });
}

function validateHooks() {
  log(BLUE, '\n═══════════════════════════════════════════════════════════════');
  log(BLUE, 'VALIDANDO HOOKS');
  log(BLUE, '═══════════════════════════════════════════════════════════════');
  
  const hooksDir = path.join(__dirname, '../src/hooks');
  
  if (!fs.existsSync(hooksDir)) {
    errors.push(`✗ Diretório hooks não encontrado: ${hooksDir}`);
    return;
  }
  
  const hooks = fs.readdirSync(hooksDir)
    .filter(f => f.startsWith('use-') && f.endsWith('.ts'));
  
  if (hooks.length > 0) {
    successes.push(`✓ Encontrados ${hooks.length} hooks customizados`);
    hooks.slice(0, 5).forEach(hook => {
      successes.push(`  • ${hook}`);
    });
  } else {
    warnings.push(`⚠ Nenhum hook customizado encontrado`);
  }
}

function validateAPIs() {
  log(BLUE, '\n═══════════════════════════════════════════════════════════════');
  log(BLUE, 'VALIDANDO ROTAS API');
  log(BLUE, '═══════════════════════════════════════════════════════════════');
  
  const apiDir = path.join(__dirname, '../src/app/api');
  
  if (!fs.existsSync(apiDir)) {
    warnings.push(`⚠ Diretório api não encontrado: ${apiDir}`);
    return;
  }
  
  const apiModules = fs.readdirSync(apiDir)
    .filter(item => {
      const fullPath = path.join(apiDir, item);
      return fs.statSync(fullPath).isDirectory() && !item.startsWith('.');
    });
  
  if (apiModules.length > 0) {
    successes.push(`✓ Encontradas ${apiModules.length} rotas API`);
  } else {
    warnings.push(`⚠ Nenhuma rota API encontrada`);
  }
}

function validateImports() {
  log(BLUE, '\n═══════════════════════════════════════════════════════════════');
  log(BLUE, 'VALIDANDO IMPORTAÇÕES');
  log(BLUE, '═══════════════════════════════════════════════════════════════');
  
  const pagesDir = path.join(__dirname, '../src/app');
  
  // Verificar algumas páginas principais
  const mainPages = ['jangadas/page.tsx', 'clientes/page.tsx', 'stock/page.tsx'];
  
  mainPages.forEach(pagePath => {
    const fullPath = path.join(pagesDir, pagePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes("from '@/lib'") || 
          content.includes("from '@/hooks'") || 
          content.includes("from '@/components'")) {
        successes.push(`✓ ${pagePath} - usa path aliases`);
      } else {
        warnings.push(`⚠ ${pagePath} - pode não estar usando path aliases`);
      }
    }
  });
}

function generateReport() {
  log(BLUE, '\n═══════════════════════════════════════════════════════════════');
  log(BLUE, 'RELATÓRIO FINAL');
  log(BLUE, '═══════════════════════════════════════════════════════════════\n');
  
  if (successes.length > 0) {
    log(GREEN, `✓ SUCESSOS (${successes.length})`);
    successes.slice(0, 10).forEach(s => log(GREEN, `  ${s}`));
    if (successes.length > 10) {
      log(GREEN, `  ... e mais ${successes.length - 10}`);
    }
  }
  
  if (warnings.length > 0) {
    log(YELLOW, `\n⚠ AVISOS (${warnings.length})`);
    warnings.forEach(w => log(YELLOW, `  ${w}`));
  }
  
  if (errors.length > 0) {
    log(RED, `\n✗ ERROS (${errors.length})`);
    errors.forEach(e => log(RED, `  ${e}`));
  }
  
  log(BLUE, '\n═══════════════════════════════════════════════════════════════');
  
  if (errors.length === 0) {
    log(GREEN, `\n✓ SINCRONIZAÇÃO OK - ${successes.length} verificações passaram\n`);
    process.exit(0);
  } else {
    log(RED, `\n✗ ERROS ENCONTRADOS - Corrija os erros acima\n`);
    process.exit(1);
  }
}

// Executar validações
log(BLUE, '\n╔═══════════════════════════════════════════════════════════════╗');
log(BLUE, '║  VALIDADOR DE SINCRONIZAÇÃO - Gestor Naval Pro                 ║');
log(BLUE, '╚═══════════════════════════════════════════════════════════════╝');

validateSchema();
validateModules();
validateHooks();
validateAPIs();
validateImports();
generateReport();
