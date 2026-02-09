import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const CERT_DIR = 'C:\\Users\\julio\\Desktop\\APLICACAO MASTER\\LIFERAFT1.0\\gestor-naval-pro\\OREY DIGITAL 2026\\2025\\CERTIFICADOS 2025';
const API_URL = 'http://localhost:3000/api/jangadas/import-quadro';

// Teste com apenas um arquivo primeiro
const testFile = 'AZ25-001 NANCI MARIA.xlsx';

async function testImport() {
  const filePath = path.join(CERT_DIR, testFile);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ Arquivo de teste não encontrado: ${filePath}`);
    return;
  }

  console.log(`🧪 Testando importação com: ${testFile}`);
  console.log(`📁 Caminho: ${filePath}`);
  console.log(`🔗 API: ${API_URL}`);
  console.log('');

  try {
    // Read file as base64
    const fileBuffer = fs.readFileSync(filePath);
    const fileBase64 = fileBuffer.toString('base64');

    const payload = {
      fileName: testFile,
      fileData: fileBase64,
      fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };

    console.log('📤 Enviando arquivo como JSON/base64...');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    console.log(`📊 Status da resposta: ${response.status}`);
    console.log(`📄 Response completa:`, JSON.stringify(result, null, 2));
    console.log('');

    if (response.ok && result.success) {
      console.log('✅ Sucesso!');
      console.log(`📄 Arquivo: ${result.fileName || testFile}`);

      if (result.jangada) {
        console.log('🚤 Jangada:');
        console.log(`   Número de Série: ${result.jangada.numeroSerie || 'N/A'}`);
        console.log(`   Marca: ${result.jangada.marca?.nome || 'N/A'}`);
        console.log(`   Modelo: ${result.jangada.modelo?.nome || 'N/A'}`);
        console.log(`   Lotação: ${result.jangada.lotacao?.capacidade ? `${result.jangada.lotacao.capacidade} pessoas` : 'N/A'}`);
        console.log(`   Data Fabricação: ${result.jangada.dataFabricacao ? new Date(result.jangada.dataFabricacao).getFullYear() : 'N/A'}`);
      }

      if (result.certificado) {
        console.log('📋 Certificado:');
        console.log(`   Número: ${result.certificado.numero || 'N/A'}`);
        console.log(`   Tipo: ${result.certificado.tipo || 'N/A'}`);
        console.log(`   Data Emissão: ${result.certificado.dataEmissao ? new Date(result.certificado.dataEmissao).toLocaleDateString('pt-PT') : 'N/A'}`);
        console.log(`   Data Validade: ${result.certificado.dataValidade ? new Date(result.certificado.dataValidade).toLocaleDateString('pt-PT') : 'N/A'}`);
      }

      if (result.componentes) {
        console.log('🔧 Componentes:');
        console.log(`   Interiores: ${result.componentes.interiores?.length || 0}`);
        console.log(`   Exteriores: ${result.componentes.exteriores?.length || 0}`);
        console.log(`   Pack: ${result.componentes.pack?.length || 0}`);
      }

      if (result.cilindros && result.cilindros.length > 0) {
        console.log('🌀 Cilindros CO2:');
        result.cilindros.forEach((cil: any, idx: number) => {
          console.log(`   ${idx + 1}. ${cil.numero || 'N/A'} - ${cil.tipo || 'N/A'} - ${cil.pressao ? `${cil.pressao} bar` : 'N/A'}`);
        });
      }

      console.log(`🎯 Confiança: ${result.confianca || 'N/A'}%`);
    } else {
      console.log('❌ Erro na importação:');
      console.log(`   ${result.error || result.errors?.join(', ') || 'Erro desconhecido'}`);
    }
  } catch (error) {
    console.log('💥 Erro de conexão:');
    if (error instanceof Error) {
      console.log(`   ${error.message}`);
    } else {
      console.log('   Erro desconhecido:', error);
    }
  }
}

// Executar teste
testImport().catch(console.error);