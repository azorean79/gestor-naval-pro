import { OpenAI } from 'openai';
import * as XLSX from 'xlsx';
import { ComponenteInspecao } from './document-analyzer';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('OPENAI_API_KEY not set');

const openai = new OpenAI({ apiKey });

export interface QuadroInspecaoExtraction {
  jangada: {
    numeroSerie: string;
    marca: string;
    modelo: string;
    lotacao: number;
    tipo?: string;
    dataFabricacao?: string;
    dataInspecao?: string;
    dataProximaInspecao?: string;
    certificadoNumero?: string;
    navio?: string;
    tecnico?: string;
  };
  componentes: {
    interiores: ComponenteInspecao[];
    exteriores: ComponenteInspecao[];
    pack: ComponenteInspecao[];
  };
  cilindros?: {
    numero?: string;
    tipo?: string;
    pressao?: number;
    gas?: string;
    validade?: string;
    dataProximo_teste?: string;
    tipoCabecaDisparo?: string;
    tipoValvulas?: string;
    tiposValvulas?: string[]; // Array se houver múltiplas válvulas
  }[];
  testes?: {
    tipo: string;
    data?: string;
    resultado?: string;
    pressao?: number;
  }[];
  notas?: string;
  confianca: number;
}

// Convert Excel to text preserving structure
async function excelToStructuredText(buffer: Buffer): Promise<string> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    
    let text = '';
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    
    // Extract all cells with their values in order
    for (let row = range.s.r; row <= range.e.r; row++) {
      const rowData = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col });
        const cellValue = sheet[cell]?.v || '';
        rowData.push(String(cellValue).trim());
      }
      // Join row data and add to text
      const rowText = rowData.filter(v => v).join(' | ');
      if (rowText) text += rowText + '\n';
    }
    
    return text;
  } catch (error) {
    console.error('Error converting Excel to text:', error);
    throw error;
  }
}

// Specialized analyzer for "Quadro de Inspeção da Jangada"
export async function analyzeQuadroInspecao(buffer: Buffer, filename: string): Promise<QuadroInspecaoExtraction> {
  try {
    // Convert Excel to structured text
    const documentText = await excelToStructuredText(buffer);
    
    const prompt = `You are a maritime inspection expert analyzing a "Quadro de Inspeção da Jangada" (Liferaft Inspection Schedule) document.

Extract ALL information from this inspection report with maximum precision.

DOCUMENT CONTENT:
${documentText}

Extract the following data exactly as it appears in the document:

1. JANGADA (Liferaft) INFORMATION:
   - Número de Série (Serial Number): exact value from document
   - Marca (Brand/Manufacturer)
   - Modelo (Model)
   - Lotação (Capacity/persons)
   - Tipo (Type - usually "Jangada Pneumática" or similar)
   - Data de Fabrico (Manufacturing Date) in DD/MM/YYYY format - CRITICAL: Look for "Date of Manuf." or similar
   - Data de Inspeção (Inspection Date) in DD/MM/YYYY format
   - Data Próxima Inspeção (Next Inspection Date) in DD/MM/YYYY format
   - Número do Certificado (Certificate Number)
   - Nome do Navio (Ship name) if mentioned
   - Técnico Responsável (Responsible Technician)

2. COMPONENTES (Components) - List EVERY item with:
   - Nome completo (Full name)
   - Quantidade (Quantity)
   - Localização (Interior/Exterior/Pack)
   - Validade (Expiry date in MM/YYYY or DD/MM/YYYY)
   - Estado (Status: OK, Substituído, Reparado, etc)
   - Resultado de Teste (Test result: OK, FALHA, N/A)

Separate into THREE categories:
   - COMPONENTES_INTERIORES (Interior components)
   - COMPONENTES_EXTERIORES (Exterior components)
   - COMPONENTES_PACK (Pack items)

3. CILINDROS CO2 (CO2 Cylinders) - For each cylinder found:
   - Número de Série/Identif
   - Tipo (CO2, Ar, Nitrogénio)
   - Pressão (Pressure)
   - Gás (Gas type)
   - Validade (Expiry date)
   - Data Próximo Teste (Next test date)
   - Tipo de Cabeça de Disparo (Firing head type: manual, automático, etc.)
   - Tipo de Válvulas (Valve types: reguladora, atenuadora, de retenção, etc.) - List ALL valve types

4. TESTES REALIZADOS (Tests Performed):
   - Tipo de Teste (Test type: NAP, F3, QI, LOAD)
   - Data do Teste
   - Resultado
   - Pressão (se aplicável)

5. NOTAS (Notes/Observations):
   - Any additional remarks or observations

RESPONSE FORMAT (VALID JSON ONLY):
{
  "jangada": {
    "numeroSerie": "exact value from document",
    "marca": "exact value",
    "modelo": "exact value",
    "lotacao": number or null,
    "tipo": "exact type",
    "dataFabricacao": "DD/MM/YYYY or null - LOOK FOR 'Date of Manuf.' IN CERTIFICATE",
    "dataInspecao": "DD/MM/YYYY or null",
    "dataProximaInspecao": "DD/MM/YYYY or null",
    "certificadoNumero": "exact number or null",
    "navio": "ship name or null",
    "tecnico": "technician name or null"
  },
  "componentes": {
    "interiores": [
      {
        "nome": "exact component name",
        "quantidade": number,
        "estado": "OK/Substituído/Reparado/etc or null",
        "validade": "MM/YYYY or DD/MM/YYYY or null",
        "tipo": "component type or null",
        "localizacao": "interior",
        "resultado_teste": "OK/FALHA/N/A or null",
        "data_teste": "DD/MM/YYYY or null",
        "notas": "any notes or null"
      }
    ],
    "exteriores": [
      {
        "nome": "exact component name",
        "quantidade": number,
        "estado": "OK/Substituído/Reparado/etc or null",
        "validade": "MM/YYYY or DD/MM/YYYY or null",
        "tipo": "component type or null",
        "localizacao": "exterior",
        "resultado_teste": "OK/FALHA/N/A or null",
        "data_teste": "DD/MM/YYYY or null",
        "notas": "any notes or null"
      }
    ],
    "pack": [
      {
        "nome": "exact component name",
        "quantidade": number,
        "estado": "OK/Substituído/Reparado/etc or null",
        "validade": "MM/YYYY or DD/MM/YYYY or null",
        "tipo": "pack",
        "localizacao": "pack",
        "resultado_teste": "OK/FALHA/N/A or null",
        "data_teste": "DD/MM/YYYY or null",
        "notas": "any notes or null"
      }
    ]
  },
  "cilindros": [
    {
      "numero": "identification number",
      "tipo": "CO2/Ar/Nitrogénio or null",
      "pressao": number or null,
      "gas": "gas type or null",
      "validade": "MM/YYYY or DD/MM/YYYY or null",
      "dataProximo_teste": "DD/MM/YYYY or null",
      "tipoCabecaDisparo": "firing head type (manual/automático/etc) or null",
      "tipoValvulas": "main valve type or null",
      "tiposValvulas": ["array", "of", "all", "valve", "types", "found"]
    }
  ],
  "testes": [
    {
      "tipo": "NAP/F3/QI/LOAD or other",
      "data": "DD/MM/YYYY or null",
      "resultado": "OK/FALHA/INCONCLUSIVE or null",
      "pressao": number or null
    }
  ],
  "notas": "any general notes or observations or null",
  "confianca": 85
}

CRITICAL RULES:
1. Extract dates in DD/MM/YYYY format
2. For expiry dates use MM/YYYY format if that's how they appear
3. Extract EVERY component listed - do not skip any
4. Keep original component names from document
5. Return ONLY valid JSON - no markdown, no text, no explanations
6. Use null for missing values - never guess
7. Confidence should be 0-100 based on data completeness
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      max_tokens: 4096,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const responseText = completion.choices[0].message.content || '';

    // Clean and parse response
    let cleanText = responseText.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const extraction = JSON.parse(cleanText) as QuadroInspecaoExtraction;
    
    // Ensure confianca is set
    if (typeof extraction.confianca !== 'number') {
      extraction.confianca = 75;
    }

    return extraction;
  } catch (error) {
    console.error('Error analyzing Quadro de Inspeção:', error);
    throw error;
  }
}

// Helper function to check if file looks like a Quadro de Inspeção
export function isQuadroInspecaoFile(filename: string, sheetNames?: string[]): boolean {
  const nameLower = filename.toLowerCase();
  
  // Check filename
  if (nameLower.includes('quadro') || 
      nameLower.includes('inspe') || 
      nameLower.includes('inspec') ||
      nameLower.includes('inspection')) {
    return true;
  }

  // Check sheet names if provided
  if (sheetNames) {
    for (const sheet of sheetNames) {
      const sheetLower = sheet.toLowerCase();
      if (sheetLower.includes('quadro') || 
          sheetLower.includes('inspe') || 
          sheetLower.includes('inspection')) {
        return true;
      }
    }
  }

  return false;
}
