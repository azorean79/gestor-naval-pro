import { analyzeQuadroInspecao } from '../src/lib/simple-analyzer';
import fs from 'fs';
import path from 'path';

const CERT_DIR = 'C:\\Users\\julio\\Desktop\\APLICACAO MASTER\\LIFERAFT1.0\\gestor-naval-pro\\OREY DIGITAL 2026\\2025\\CERTIFICADOS 2025';
const testFile = 'AZ25-001 NANCI MARIA.xlsx';

async function testGeminiAnalysis() {
  const filePath = path.join(CERT_DIR, testFile);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ Arquivo não encontrado: ${filePath}`);
    return;
  }

  console.log(`🤖 Testando análise Gemini: ${testFile}`);
  console.log('');

  try {
    const buffer = fs.readFileSync(filePath);
    console.log('📤 Enviando para análise Gemini...');

    const analysis = await analyzeQuadroInspecao(buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    console.log('✅ Análise concluída!');    console.log('');
    console.log('📄 Texto extraído (debug):');
    // Let's also show the raw text extraction
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[1]];
    let text = '';
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    for (let row = range.s.r; row <= range.e.r; row++) {
      const rowData = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col });
        const cellValue = sheet[cell]?.v || '';
        rowData.push(String(cellValue).trim());
      }
      const rowText = rowData.filter(v => v).join(' | ');
      if (rowText) text += rowText + '\n';
    }
    console.log(text.substring(0, 500) + '...');
    console.log('');    console.log('');
    console.log('📊 Resultado da análise:');
    console.log('=' .repeat(60));

    console.log('🚤 JANGADA:');
    if (analysis.jangada) {
      console.log(`   Número de Série: ${analysis.jangada.numeroSerie || 'N/A'}`);
      console.log(`   Marca: ${analysis.jangada.marca || 'N/A'}`);
      console.log(`   Modelo: ${analysis.jangada.modelo || 'N/A'}`);
      console.log(`   Lotação: ${analysis.jangada.lotacao || 'N/A'}`);
      console.log(`   Data Fabricação: ${analysis.jangada.dataFabricacao || 'N/A'}`);
      console.log(`   Data Inspeção: ${analysis.jangada.dataInspecao || 'N/A'}`);
      console.log(`   Certificado: ${analysis.jangada.certificadoNumero || 'N/A'}`);
      console.log(`   Navio: ${analysis.jangada.navio || 'N/A'}`);
    } else {
      console.log('   ❌ Dados da jangada não encontrados');
    }

    console.log('');
    console.log('🔧 COMPONENTES:');
    if (analysis.componentes) {
      console.log(`   Interiores: ${analysis.componentes.interiores?.length || 0}`);
      console.log(`   Exteriores: ${analysis.componentes.exteriores?.length || 0}`);
      console.log(`   Pack: ${analysis.componentes.pack?.length || 0}`);
    }

    console.log('');
    console.log('🌀 CILINDROS:');
    if (analysis.cilindros && analysis.cilindros.length > 0) {
      analysis.cilindros.forEach((cil, idx) => {
        console.log(`   ${idx + 1}. ${cil.numero || 'N/A'} - ${cil.tipo || 'N/A'} - ${cil.pressao ? `${cil.pressao} bar` : 'N/A'}`);
      });
    } else {
      console.log('   Nenhum cilindro encontrado');
    }

    console.log('');
    console.log(`🎯 Confiança: ${analysis.confianca || 'N/A'}%`);

  } catch (error) {
    if (error instanceof Error) {
      console.log(`💥 Erro na análise: ${error.message}`);
      console.log('Stack trace:', error.stack);
    } else {
      console.log('💥 Erro na análise desconhecida:', error);
    }
  }
}

testGeminiAnalysis();