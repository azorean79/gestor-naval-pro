// Script para testar API de navios
const testNavioId = 233; // ID de teste

async function testNaviosAPI() {
  console.log(`🔍 Testando API de navios com ID: ${testNavioId}`);
  
  try {
    const response = await fetch(`http://localhost:3000/api/navios/${testNavioId}`);
    console.log(`📡 Status: ${response.status}`);
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Erro: ${error}`);
      return;
    }
    
    const data = await response.json();
    console.log(`✅ Navio encontrado:`);
    console.log(JSON.stringify(data, null, 2));
    
    // Testar também a página
    console.log(`\n🌐 Testando página /navios/${testNavioId}`);
    const pageResponse = await fetch(`http://localhost:3000/navios/${testNavioId}`);
    console.log(`📄 Status da página: ${pageResponse.status}`);
    
    if (pageResponse.ok) {
      const html = await pageResponse.text();
      if (html.includes('Navio não encontrado')) {
        console.error('❌ Página mostra "Navio não encontrado"');
      } else if (html.includes('A carregar')) {
        console.warn('⚠️ Página está em loading infinito');
      } else {
        console.log('✅ Página carregada com sucesso');
      }
    }
    
  } catch (error) {
    console.error(`❌ Erro ao testar: ${error.message}`);
  }
}

testNaviosAPI();
