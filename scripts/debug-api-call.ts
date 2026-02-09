import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const CERT_DIR = 'C:\\Users\\julio\\Desktop\\APLICACAO MASTER\\LIFERAFT1.0\\gestor-naval-pro\\OREY DIGITAL 2026\\2025\\CERTIFICADOS 2025';
const API_URL = 'http://localhost:3000/api/jangadas/import-quadro';
const testFile = 'AZ25-001 NANCI MARIA.xlsx';

async function debugApiCall() {
  const filePath = path.join(CERT_DIR, testFile);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ Arquivo não encontrado: ${filePath}`);
    return;
  }

  console.log(`🧪 Debug API call com: ${testFile}`);

  try {
    // Read file as base64
    const fileBuffer = fs.readFileSync(filePath);
    const fileBase64 = fileBuffer.toString('base64');

    const payload = {
      fileName: testFile,
      fileData: fileBase64,
      fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };

    console.log('📤 Enviando requisição com base64...');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Headers:`, Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📄 Response body:');
    console.log(responseText);

  } catch (error) {
    console.error('💥 Erro de conexão:', error);
  }
}

debugApiCall().catch(console.error);