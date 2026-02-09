import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const CERT_DIR = 'C:\\Users\\julio\\Desktop\\APLICACAO MASTER\\LIFERAFT1.0\\gestor-naval-pro\\OREY DIGITAL 2026\\2025\\CERTIFICADOS 2025';
const API_URL = 'http://localhost:3000/api/test-upload';
const testFile = 'AZ25-001 NANCI MARIA.xlsx';

async function testSimpleUpload() {
  const filePath = path.join(CERT_DIR, testFile);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ Arquivo não encontrado: ${filePath}`);
    return;
  }

  console.log(`🧪 Testando upload simples com: ${testFile}`);

  try {
    const stats = fs.statSync(filePath);
    console.log(`📊 Tamanho do arquivo: ${stats.size} bytes`);

    // Read file completely into buffer
    const fileBuffer = fs.readFileSync(filePath);
    console.log(`📊 Buffer size: ${fileBuffer.length} bytes`);

    // Try JSON upload first
    const fileBase64 = fileBuffer.toString('base64');
    const jsonPayload = {
      fileName: testFile,
      fileData: fileBase64,
      fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };

    console.log('📤 Enviando como JSON...');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsonPayload)
    });

    const result = await response.json();

    console.log(`📊 Status: ${response.status}`);
    console.log('📄 Response:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

testSimpleUpload().catch(console.error);