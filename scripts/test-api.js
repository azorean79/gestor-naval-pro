const fs = require('fs');
const FormData = require('form-data');

async function testAPI() {
  try {
    const form = new FormData();
    const filePath = 'C:\\Users\\julio\\Desktop\\APLICACAO MASTER\\LIFERAFT1.0\\gestor-naval-pro\\OREY DIGITAL 2026\\2025\\CERTIFICADOS 2025\\AZ25-004 ANA BEATRIZ.xlsx';

    if (!fs.existsSync(filePath)) {
      console.log('File does not exist:', filePath);
      return;
    }

    form.append('file', fs.createReadStream(filePath), {
      filename: 'AZ25-004 ANA BEATRIZ.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    console.log('Sending request to API...');

    const response = await fetch('http://localhost:3002/api/jangadas/import-quadro', {
      method: 'POST',
      body: form
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    console.log('Response body:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();