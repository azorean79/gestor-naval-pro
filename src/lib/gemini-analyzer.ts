import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

// Initialize only if API key is available (allows build without key)
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface DocumentAnalysis {
  type: string;
  confidence: number;
  data?: any;
  raw_analysis?: string;
}

/**
 * Analyze a document using Google Gemini (FREE)
 * @param fileBuffer Buffer containing the file data
 * @param fileName Name of the file
 * @param mimeType MIME type of the file
 * @returns Document analysis result
 */
export async function analyzeDocument(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<DocumentAnalysis> {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert buffer to base64
    const base64Data = fileBuffer.toString('base64');

    const prompt = `Analise este documento e identifique o tipo. Responda APENAS com um JSON no seguinte formato:
{
  "type": "tipo_do_documento",
  "confidence": 0.95,
  "data": { campos_extraídos }
}

Tipos possíveis:
- "certificado_inspecao" - Certificado de inspeção de jangada salva-vidas
- "relatorio_acidente" - Relatório de acidente ou ocorrência
- "quadro_inspecao" - Quadro de inspeção com testes e componentes
- "fatura" - Fatura ou documento financeiro
- "outros"

Extraia os dados relevantes no campo "data" baseado no tipo identificado.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data
        }
      },
      prompt
    ]);

    const response = await result.response;
    const text = response.text();

    // Try to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        type: parsed.type || 'unknown',
        confidence: parsed.confidence || 0,
        data: parsed.data,
        raw_analysis: text
      };
    }

    return {
      type: 'unknown',
      confidence: 0,
      raw_analysis: text
    };
  } catch (error: any) {
    console.error('Gemini analysis error:', error);
    return {
      type: 'unknown',
      confidence: 0,
      raw_analysis: `Error: ${error.message}`
    };
  }
}

/**
 * Analyze multiple documents using Google Gemini
 * @param files Array of file data {buffer, fileName, mimeType}
 * @returns Array of document analysis results
 */
export async function analyzeMultipleDocuments(
  files: Array<{ buffer: Buffer; fileName: string; mimeType: string }>
): Promise<DocumentAnalysis[]> {
  const analysisPromises = files.map(file =>
    analyzeDocument(file.buffer, file.fileName, file.mimeType)
  );
  return Promise.all(analysisPromises);
}

/**
 * Analyze quadro de inspeção (inspection report) using Gemini
 * @param fileBuffer Buffer containing the file data
 * @param mimeType MIME type of the file
 * @returns Extracted inspection data
 */
export async function analyzeQuadroInspecao(
  fileBuffer: Buffer,
  mimeType: string
): Promise<any> {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const base64Data = fileBuffer.toString('base64');

    const prompt = `Analise este quadro de inspeção de jangada salva-vidas e extraia TODOS os dados em formato JSON.

ESTRUTURA ESPERADA:
{
  "jangada": {
    "numero_serie": "string",
    "marca": "string",
    "modelo": "string",
    "lotacao": number,
    "ano_fabrico": number
  },
  "cilindro": {
    "numero_serie": "string",
    "capacidade": "string",
    "pressao_servico": number,
    "pressao_teste": number
  },
  "testes": [
    {
      "tipo": "TESTE_PRESSAO|TESTE_VISUAL|TESTE_FUNCIONAMENTO",
      "resultado": "APROVADO|REPROVADO|NAO_REALIZADO",
      "observacoes": "string"
    }
  ],
  "componentes_substituidos": [
    {
      "descricao": "string",
      "quantidade": number,
      "motivo": "string"
    }
  ],
  "observacoes_gerais": "string"
}

Extraia TODOS os dados que conseguir identificar. Se algum campo não estiver presente, use null.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data
        }
      },
      prompt
    ]);

    const response = await result.response;
    const text = response.text();

    // Try to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Could not extract JSON from Gemini response');
  } catch (error: any) {
    console.error('Quadro analysis error:', error);
    throw new Error(`Failed to analyze quadro: ${error.message}`);
  }
}
