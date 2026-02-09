import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const CERT_DIR = 'C:\\Users\\julio\\Desktop\\APLICACAO MASTER\\LIFERAFT1.0\\gestor-naval-pro\\OREY DIGITAL 2026\\2025\\CERTIFICADOS 2025';
const API_URL = 'http://localhost:3000/api/jangadas/import-quadro';

async function importQuadro(filePath: string, fileName: string) {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), {
      filename: fileName,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    console.log(`📤 Importando: ${fileName}`);

    const response = await fetch(API_URL, {
      method: 'POST',
      body: form as unknown as BodyInit,
      // Se necessário, ajuste o cabeçalho Content-Type para multipart/form-data
      // headers: { 'Content-Type': 'multipart/form-data' },
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log(`✅ Sucesso: ${fileName}`);
      console.log(`   Jangada: ${result.jangada?.numeroSerie || 'N/A'}`);
      console.log(`   Certificado: ${result.certificado?.numero || 'N/A'}`);
    } else {
      console.log(`❌ Erro: ${fileName}`);
      console.log(`   ${result.error || result.errors?.join(', ') || 'Erro desconhecido'}`);
    }

    return result;
  } catch (error) {
    console.log(`💥 Exceção: ${fileName}`);
        if (error instanceof Error) {
          console.log(`   ${error.message}`);
        } else {
          console.log('   Erro desconhecido:', error);
        }
    return null;
  }
}

async function importAllQuadros() {
  console.log('🚀 Iniciando importação em lote de quadros de inspeção...');
  console.log(`📁 Pasta: ${CERT_DIR}`);
  console.log(`🔗 API: ${API_URL}`);
  console.log('');

  // Verificar se a pasta existe
  if (!fs.existsSync(CERT_DIR)) {
    console.log(`❌ Pasta não encontrada: ${CERT_DIR}`);
    return;
  }

  // Listar arquivos Excel
  const files = fs.readdirSync(CERT_DIR)
    .filter(file => file.endsWith('.xlsx'))
    .sort();

  console.log(`📊 Encontrados ${files.length} arquivos Excel`);
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  // Processar cada arquivo
  for (const file of files) {
    const filePath = path.join(CERT_DIR, file);
    const result = await importQuadro(filePath, file);

    if (result && result.success) {
      successCount++;
    } else {
      errorCount++;
    }

    // Pequena pausa para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('');
  console.log('📈 Resumo da importação:');
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log(`📊 Total: ${files.length}`);
}

// Executar
importAllQuadros().catch(console.error);