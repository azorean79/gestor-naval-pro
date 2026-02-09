import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

async function testGeminiAPI() {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    console.log('API Key encontrada:', !!apiKey);
    console.log('API Key length:', apiKey?.length);

    if (!apiKey) {
      console.error('❌ Nenhuma chave da API encontrada');
      return;
    }

    console.log('🚀 Inicializando GoogleGenerativeAI...');
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ GoogleGenerativeAI inicializado');

    // Testar modelos conhecidos
    const modelsToTest = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'];

    for (const modelName of modelsToTest) {
      try {
        console.log(`🤖 Testando modelo: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Olá, teste simples');
        const response = await result.response;
        const text = response.text();
        console.log(`✅ Modelo ${modelName} funciona! Resposta:`, text.substring(0, 50) + '...');
        return; // Se funcionar, para aqui
      } catch (error) {
        console.log(`❌ Modelo ${modelName} falhou:`, error.message);
      }
    }

    console.error('❌ Nenhum modelo funcionou');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testGeminiAPI();