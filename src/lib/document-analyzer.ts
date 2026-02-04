import { OpenAI } from 'openai';
import * as XLSX from 'xlsx';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error('OPENAI_API_KEY not set');

const openai = new OpenAI({ apiKey });

export interface ComponenteInspecao {
  nome: string;
  quantidade: number;
  estado?: string; // OK, Substituído, Reparado, etc
  validade?: string;
  tipo?: string; // cilindro, valvula, pack, outros, interior, exterior
  localizacao?: string; // interior, exterior, pack
  notas?: string; // additional inspection notes
  resultado_teste?: string; // OK, FALHA, N/A
  data_teste?: string; // DD/MM/YYYY
}

interface ExtractionResult {
  type: 'certificado' | 'quadro_inspecao' | 'navios_csv' | 'jangadas_csv' | 'stock_csv' | 'clientes_csv' | 'unknown';
  confidence?: number; // Add confidence score
  navio?: {
    nome?: string;
    matricula?: string;
    imo?: string;
    tipo?: string;
    armador?: string;
    proprietario?: string;
    bandeira?: string;
    anoConstrucao?: number;
    status?: string;
    portoRegisto?: string;
    arqueacaoBruta?: number;
    arqueacaoLiquida?: number;
    comprimento?: number;
    largura?: number;
    calado?: number;
    cliente?: string;
    dataInspecao?: string;
    dataProximaInspecao?: string;
  };
  jangada?: {
    numeroSerie?: string;
    marca?: string;
    modelo?: string;
    tipo?: string;
    capacidade?: number;
    dataFabricacao?: string;
    navioMatricula?: string;
    status?: string;
    estado?: string;
    dataInspecao?: string;
    dataProximaInspecao?: string;
  };
  componentes?: ComponenteInspecao[];
  navios?: Array<{
    nome: string;
    matricula: string;
    imo?: string;
    tipo: string;
    armador?: string;
    proprietario?: string;
    bandeira?: string;
    anoConstrucao?: number;
    status: string;
    portoRegisto?: string;
    arqueacaoBruta?: number;
    arqueacaoLiquida?: number;
    comprimento?: number;
    largura?: number;
    calado?: number;
  }>;
  jangadas?: Array<{
    numeroSerie: string;
    marca: string;
    modelo: string;
    tipo: string;
    capacidade: number;
    dataFabricacao?: string;
    navioMatricula?: string;
    status: string;
    estado: string;
  }>;
  stock?: Array<{
    nome: string;
    categoria: string;
    quantidade: number;
    quantidadeMinima: number;
    precoUnitario?: number;
    fornecedor?: string;
    localizacao?: string;
    refOrey?: string;
    refFabricante?: string;
    lote?: string;
    descricao?: string;
  }>;
  clientes?: Array<{
    nome: string;
    email: string;
    telefone?: string;
    nif?: string;
    morada?: string;
    cidade?: string;
    codigoPostal?: string;
    pais?: string;
    tipoCliente?: string;
    notas?: string;
  }>;
  raw_analysis?: string;
}

// Function to convert Excel to CSV for analysis
async function excelToText(buffer: Buffer): Promise<string> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let text = '';

    // Process all sheets
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(worksheet);

      // Identify sheet type based on name or content
      const sheetType = identifySheetType(sheetName, csv);
      text += `\n\n=== SHEET: ${sheetName} (${sheetType}) ===\n${csv}`;
    }

    return text;
  } catch (error) {
    console.error('Error converting Excel to text:', error);
    throw error;
  }
}

// Function to identify sheet type
function identifySheetType(sheetName: string, csvContent: string): string {
  const name = sheetName.toLowerCase();
  const content = csvContent.toLowerCase();

  if (name.includes('certificado') || name.includes('certificate') ||
      content.includes('navio') || content.includes('ship')) {
    return 'CERTIFICADO';
  }

  if (name.includes('inspec') || name.includes('inspection') ||
      name.includes('quadro') || content.includes('jangada') ||
      content.includes('liferaft') || content.includes('componentes')) {
    return 'QUADRO_INSPECAO';
  }

  return 'UNKNOWN';
}

// Function to extract text from PDF
async function pdfToText(buffer: Buffer): Promise<string> {
  try {
    // For now, return a placeholder. PDF processing needs proper setup
    console.warn('PDF processing not fully implemented. Returning placeholder text.');
    return 'PDF content extraction not available. Please convert to Excel format.';
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF. Please ensure the PDF is not password-protected and contains extractable text.');
  }
}

// Function to encode buffer to base64
function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

// Function to analyze document using OpenAI GPT-4
export async function analyzeDocument(buffer: Buffer, filename: string): Promise<ExtractionResult> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not configured');
  }

  try {
    // Convert document to text based on file type
    let documentText: string;

    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      documentText = await excelToText(buffer);
    } else if (filename.endsWith('.pdf')) {
      documentText = await pdfToText(buffer);
    } else if (filename.endsWith('.csv')) {
      documentText = buffer.toString('utf-8');
    } else {
      throw new Error('Unsupported file format. Please upload PDF, Excel (.xlsx/.xls), or CSV file.');
    }

    // Improved prompt for better extraction based on templates
    const prompt = `You are an expert maritime document analyzer specializing in Portuguese naval management systems. Analyze the following document content and extract structured data accurately.

CRITICAL: Determine the document type based on the actual data present, not just the filename or headers:
- If the document contains ship/vessel information (nome do navio, matricula, imo, tipo de navio): type is "certificado" or "navios_csv"
- If the document contains liferaft/bote information (jangada, numeroSerie, bote salva-vidas, marca, modelo, capacidade): type is "quadro_inspecao" or "jangadas_csv"
- If the document contains inspection items/components (coletes, cilindro, epirb, componentes): type is "quadro_inspecao"
- Always examine the actual data, not just headers or sheet names

The documents follow specific CSV templates used in the system:

NAVIOS TEMPLATE: nome,matricula,imo,tipo,armador,proprietario,bandeira,ano_construcao,status,porto_registo,arqueacao_bruta,arqueacao_liquida,comprimento,boca,calado

JANGADAS TEMPLATE: numero_serie,marca,modelo,tipo,capacidade,data_fabricacao,navio_matricula,status,estado

STOCK TEMPLATE: nome,categoria,quantidade,quantidade_minima,preco_unitario,fornecedor,localizacao,ref_orey,ref_fabricante,lote,descricao

CLIENTES TEMPLATE: nome,email,telefone,nif,morada,cidade,codigo_postal,pais,tipo_cliente,notas

DOCUMENT CONTENT:
${documentText}

INSTRUCTIONS:
This document may contain multiple sheets/sections marked with === SHEET: Name (Type) ===

Analyze ALL sheets and combine information intelligently:

1. CERTIFICADO sheets: Extract ship certificate data (navio information)
2. QUADRO_INSPECAO sheets: Extract liferaft inspection data (jangada and componentes)
3. Combine data from all relevant sheets into a single result

Document Type Priority based on DATA, not labels:
- If document contains navio (ship) data: Classify as "certificado" or "navios_csv"
- If document contains jangada (liferaft) data OR componentes (inspection items): Classify as "quadro_inspecao" or "jangadas_csv"
- If only CSV-like rows with multiple entries: Classify as appropriate "_csv" type

RESPONSE FORMAT (JSON only):
{
  "type": "certificado" | "quadro_inspecao" | "navios_csv" | "jangadas_csv" | "stock_csv" | "clientes_csv" | "unknown",
  "confidence": 85,
  "navio": {
    "nome": "string or null",
    "matricula": "string or null",
    "imo": "string or null",
    "tipo": "string or null",
    "armador": "string or null",
    "proprietario": "string or null",
    "bandeira": "string or null",
    "anoConstrucao": number or null,
    "status": "string or null",
    "portoRegisto": "string or null",
    "arqueacaoBruta": number or null,
    "arqueacaoLiquida": number or null,
    "comprimento": number or null,
    "largura": number or null,
    "calado": number or null,
    "cliente": "string or null",
    "dataInspecao": "DD/MM/YYYY or null",
    "dataProximaInspecao": "DD/MM/YYYY or null"
  },
  "jangada": {
    "numeroSerie": "string or null",
    "marca": "string or null",
    "modelo": "string or null",
    "tipo": "string or null",
    "capacidade": number or null,
    "dataFabricacao": "MM/YYYY or null",
    "navioMatricula": "string or null",
    "status": "string or null",
    "estado": "string or null",
    "dataInspecao": "DD/MM/YYYY or null",
    "dataProximaInspecao": "DD/MM/YYYY or null"
  },
  "componentes": [
    {
      "nome": "string (e.g., 'Coletes Salva-Vidas', 'EPIRB', 'Cilindro CO2', 'Válvula Reguladora')",
      "quantidade": number,
      "estado": "string or null (OK/Substituído/Reparado/etc)",
      "validade": "MM/YYYY or DD/MM/YYYY or null - EXTRACT ALL EXPIRY DATES",
      "tipo": "cilindro | valvula | pack | outros or null",
      "notas": "string or null (inspection notes, test results)"
    }
  ] or null,
  "navios": [
    {
      "nome": "string",
      "matricula": "string",
      "imo": "string or null",
      "tipo": "string",
      "armador": "string or null",
      "proprietario": "string or null",
      "bandeira": "string or null",
      "anoConstrucao": number or null,
      "status": "string",
      "portoRegisto": "string or null",
      "arqueacaoBruta": number or null,
      "arqueacaoLiquida": number or null,
      "comprimento": number or null,
      "largura": number or null,
      "calado": number or null
    }
  ] or null,
  "jangadas": [
    {
      "numeroSerie": "string",
      "marca": "string",
      "modelo": "string",
      "tipo": "string",
      "capacidade": number,
      "dataFabricacao": "string or null",
      "navioMatricula": "string or null",
      "status": "string",
      "estado": "string"
    }
  ] or null,
  "stock": [...] or null,
  "clientes": [...] or null
}`;

    // Call OpenAI API with retry logic
    let lastError: Error | null = null;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const fullPrompt = `You are a maritime document analysis expert specializing in Portuguese naval management systems. Extract data accurately and return only valid JSON.

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - no markdown, no explanations, no code blocks
2. If uncertain about data, use null instead of guessing
3. For dates, use DD/MM/YYYY or MM/YYYY format consistently
4. Extract ALL expiry dates found in the document
5. Be precise with Portuguese maritime terminology

${prompt}`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 4096,
          temperature: 0.1,
          messages: [
            {
              role: "user",
              content: fullPrompt
            }
          ]
        });

        const responseText = completion.choices[0]?.message?.content || '';

        // Parse JSON response with better error handling
        try {
          // Clean the response text - remove any markdown formatting
          let cleanResponseText = responseText.trim();

          // Remove markdown code blocks if present
          if (cleanResponseText.startsWith('```json')) {
            cleanResponseText = cleanResponseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleanResponseText.startsWith('```')) {
            cleanResponseText = cleanResponseText.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }

          const parsedResult = JSON.parse(cleanResponseText) as ExtractionResult;
          parsedResult.raw_analysis = cleanResponseText;

          // Enhanced validation with smarter type detection
          if (!parsedResult.type || !['certificado', 'quadro_inspecao', 'navios_csv', 'jangadas_csv', 'stock_csv', 'clientes_csv', 'unknown'].includes(parsedResult.type)) {
            // Try to infer type from available data
            if (parsedResult.navio && (parsedResult.navio.matricula || parsedResult.navio.nome)) {
              parsedResult.type = 'certificado';
            } else if ((parsedResult.jangada && parsedResult.jangada.numeroSerie) || (parsedResult.componentes && parsedResult.componentes.length > 0)) {
              parsedResult.type = 'quadro_inspecao';
            } else if (Array.isArray(parsedResult.navios) && parsedResult.navios.length > 0) {
              parsedResult.type = 'navios_csv';
            } else if (Array.isArray(parsedResult.jangadas) && parsedResult.jangadas.length > 0) {
              parsedResult.type = 'jangadas_csv';
            } else if (Array.isArray(parsedResult.stock) && parsedResult.stock.length > 0) {
              parsedResult.type = 'stock_csv';
            } else if (Array.isArray(parsedResult.clientes) && parsedResult.clientes.length > 0) {
              parsedResult.type = 'clientes_csv';
            } else {
              parsedResult.type = 'unknown';
            }
          }

          // Validate data presence based on type
          if (parsedResult.type === 'certificado') {
            const hasNavioData = parsedResult.navio?.nome || parsedResult.navio?.matricula;
            const hasJangadaData = parsedResult.jangada?.numeroSerie;
            if (!hasNavioData && !hasJangadaData) {
              parsedResult.type = 'unknown';
              parsedResult.confidence = Math.min(parsedResult.confidence || 0, 20);
            }
          }

          if (parsedResult.type === 'quadro_inspecao') {
            const hasJangadaData = parsedResult.jangada?.numeroSerie;
            const hasComponentesData = parsedResult.componentes && parsedResult.componentes.length > 0;
            if (!hasJangadaData && !hasComponentesData) {
              parsedResult.type = 'unknown';
              parsedResult.confidence = Math.min(parsedResult.confidence || 0, 20);
            }
          }

          // Set default confidence if not provided
          if (typeof parsedResult.confidence !== 'number') {
            parsedResult.confidence = parsedResult.type === 'unknown' ? 0 : 75;
          }

          return parsedResult;
        } catch (parseError) {
          console.error(`Attempt ${attempt}: Error parsing Gemini response:`, parseError);
          lastError = parseError as Error;

          if (attempt === maxRetries) {
            // Try to extract JSON from response if it's wrapped in text
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                const result = JSON.parse(jsonMatch[0]) as ExtractionResult;
                result.raw_analysis = jsonMatch[0];
                
                // Try to infer type from data if not specified
                if (!result.type || result.type === 'unknown') {
                  if (result.navio || result.navios) {
                    result.type = result.navios ? 'navios_csv' : 'certificado';
                  } else if (result.jangada || result.jangadas || result.componentes) {
                    result.type = result.jangadas ? 'jangadas_csv' : 'quadro_inspecao';
                  }
                }
                
                return result;
              } catch (secondParseError) {
                console.error('Failed to extract JSON from response');
              }
            }
          }
        }
      } catch (apiError) {
        console.error(`Attempt ${attempt}: Gemini API error:`, apiError);
        lastError = apiError as Error;

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // All retries failed
    return {
      type: 'unknown',
      confidence: 0,
      raw_analysis: `Failed after ${maxRetries} attempts. Last error: ${lastError?.message}`,
    };
  } catch (error) {
    console.error('Error analyzing document with AI:', error);
    throw error;
  }
}

// Function to extract dates from various formats
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;

  // Try DD/MM/YYYY format
  const ddMmYyyyMatch = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (ddMmYyyyMatch) {
    const [, day, month, year] = ddMmYyyyMatch;
    return new Date(`${year}-${month}-${day}`);
  }

  // Try other common formats
  try {
    return new Date(dateString);
  } catch {
    return null;
  }
}

// Function to parse capacity as number
export function parseCapacity(capacityString: string | null | undefined): number | null {
  if (!capacityString) return null;

  const match = capacityString.toString().match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

// Function to extract and standardize expiry dates
export function extractExpiryDate(text: string): string | null {
  if (!text) return null;

  // Look for Portuguese expiry patterns
  const expiryPatterns = [
    /válido até\s*(\d{1,2}\/\d{4})/i,
    /expira em\s*(\d{1,2}\/\d{4})/i,
    /validade\s*(\d{1,2}\/\d{4})/i,
    /validade até\s*(\d{1,2}\/\d{4})/i,
    /próxima inspecção\s*(\d{1,2}\/\d{4})/i,
    /next inspection\s*(\d{1,2}\/\d{4})/i,
    /teste hidrostático\s*(\d{1,2}\/\d{4})/i,
    /hydrostatic test\s*(\d{1,2}\/\d{4})/i,
    // Full date patterns
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    // Month/Year patterns
    /(\d{1,2}\/\d{4})/
  ];

  for (const pattern of expiryPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Function to identify component types
export function identifyComponentType(componentName: string): string {
  const name = componentName.toLowerCase();

  if (name.includes('cilindro') || name.includes('cylinder') || name.includes('co2') || name.includes('gas')) {
    return 'cilindro';
  }
  if (name.includes('válvula') || name.includes('valve') || name.includes('regulador') || name.includes('regulator')) {
    return 'valvula';
  }
  if (name.includes('pack') || name.includes('pacote') || name.includes('conjunto')) {
    return 'pack';
  }

  return 'outros';
}
