import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importAllQuadros() {
  const certPath = path.join(__dirname, '..', 'OREY DIGITAL 2026', '2025', 'CERTIFICADOS 2025');

  if (!fs.existsSync(certPath)) {
    console.error('❌ Pasta CERTIFICADOS 2025 não encontrada:', certPath);
    return;
  }

  const files = fs.readdirSync(certPath)
    .filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'))
    .sort();

  console.log(`📁 Encontrados ${files.length} arquivos Excel para processar`);
  console.log('='.repeat(60));

  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(certPath, file);

    console.log(`\n🔄 [${i + 1}/${files.length}] Processando: ${file}`);

    try {
      // Read file as base64
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');

      // Send to API
      const response = await fetch('http://localhost:3000/api/jangadas/import-quadro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file,
          fileData: base64Data,
          fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Sucesso: ${file}`);
        console.log(`   🚤 Jangada: ${result.jangada?.numeroSerie || 'N/A'}`);
        console.log(`   📦 Pack: ${result.componentes?.pack?.length || 0} componentes`);
        console.log(`   🔋 Baterias: ${result.componentes?.pack?.filter((c: any) => c.descricao?.includes('Bateria') || c.descricao?.includes('luz')).length || 0}`);
        console.log(`   🌀 Cilindros: ${result.cilindros?.length || 0}`);
        results.push({ file, success: true, result });
      } else {
        console.log(`❌ Falhou: ${file}`);
        console.log(`   Erros: ${result.errors?.join(', ') || 'Desconhecido'}`);
        results.push({ file, success: false, errors: result.errors });
      }

    } catch (error: any) {
      console.log(`💥 Erro: ${file} - ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      results.push({ file, success: false, error: error.message });
    }

    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO FINAL:');
  console.log(`   ✅ Sucessos: ${results.filter(r => r.success).length}`);
  console.log(`   ❌ Falhas: ${results.filter(r => !r.success).length}`);
  console.log(`   📁 Total: ${results.length}`);

  // Save detailed results
  const outputPath = path.join(__dirname, 'import-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Resultados detalhados salvos em: ${outputPath}`);
}

// Run the import
importAllQuadros().catch(console.error);