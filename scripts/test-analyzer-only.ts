import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { analyzeQuadroInspecao } from '../src/lib/simple-analyzer';

const CERT_DIR = 'C:\\Users\\julio\\Desktop\\APLICACAO MASTER\\LIFERAFT1.0\\gestor-naval-pro\\OREY DIGITAL 2026\\2025\\CERTIFICADOS 2025';
const testFile = 'AZ25-001 NANCI MARIA.xlsx';

async function testAnalyzer() {
  const filePath = path.join(CERT_DIR, testFile);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ Arquivo não encontrado: ${filePath}`);
    return;
  }

  console.log(`🧪 Testando analyzer com: ${testFile}`);

  try {
    const buffer = fs.readFileSync(filePath);

    console.log('📊 Executando análise...');
    const result = await analyzeQuadroInspecao(buffer, testFile);

    console.log('✅ Análise concluída!');
    console.log('📋 Resultado:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Erro no analyzer:', error);
  }
}

testAnalyzer().catch(console.error);