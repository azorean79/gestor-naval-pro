import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const clientId = process.env.AZURE_CLIENT_ID!;
const clientSecret = process.env.AZURE_CLIENT_SECRET!;
const tenantId = process.env.AZURE_TENANT_ID!;
const rootFolder = process.env.ONEDRIVE_ROOT_FOLDER!;
const userPrincipalName = 'azores.tecnica@orey.com'; // OneDrive account UPN
const mainFolderId = 'IgAl42MsmqJ3S5UBumbbxGWYAZObmr7015ccLid_IX9bvAQ'; // ID da pasta principal do link fornecido

let client: Client | null = null;

function getClient() {
  if (!client) {
    if (!clientId || !clientSecret || !tenantId) {
      throw new Error('Azure AD credentials not configured');
    }
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await credential.getToken('https://graph.microsoft.com/.default');
          return token.token;
        },
      },
    });
  }
  return client;
}

// Function to ensure the main folder exists (using the provided folder ID)
async function ensureMainFolder(): Promise<string> {
  const graphClient = getClient();

  try {
    // Verify that the main folder exists using the provided ID
    const folderResult = await graphClient
      .api(`/users/${userPrincipalName}/drive/items/${mainFolderId}`)
      .get();

    if (folderResult && folderResult.id) {
      console.log(`Pasta principal encontrada: ${folderResult.name}`);
      return `items/${mainFolderId}`;
    } else {
      throw new Error(`Pasta principal não encontrada ou inválida`);
    }
  } catch (error) {
    console.error(`Erro ao acessar a pasta principal com ID ${mainFolderId}:`, error);
    throw new Error(`Pasta principal não encontrada. Verifique se o ID da pasta está correto: ${mainFolderId}`);
  }
}

// Function to initialize year folders (2023, 2024, 2025, 2026)
export async function initializeYearFolders(): Promise<void> {
  const graphClient = getClient();
  const mainFolderPath = await ensureMainFolder();
  const years = ['2023', '2024', '2025', '2026'];

  for (const year of years) {
    try {
      // Check if year folder exists
      const searchResult = await graphClient
        .api(`/users/${userPrincipalName}/drive/${mainFolderPath}/children`)
        .filter(`name eq '${year}'`)
        .get();

      if (searchResult.value.length === 0) {
        // Create year folder
        await graphClient
          .api(`/users/${userPrincipalName}/drive/${mainFolderPath}/children`)
          .post({
            name: year,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'rename',
          });
        console.log(`Pasta do ano ${year} criada com sucesso.`);
      } else {
        console.log(`Pasta do ano ${year} já existe.`);
      }
    } catch (error) {
      console.error(`Erro ao criar/verificar pasta do ano ${year}:`, error);
    }
  }
}

// Function to generate certificate Excel file from template
function generateCertificateWorkbook(navioNome: string, matricula: string, tipo: string, clienteNome?: string | null, dataInspecao?: Date | null, dataProximaInspecao?: Date | null) {
  try {
    // Read template file
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'certificado-template.xlsx');
    const templateBuffer = fs.readFileSync(templatePath);
    const workbook = XLSX.read(templateBuffer, { type: 'buffer' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Format dates
    const formatDate = (date: Date | null | undefined) => {
      if (!date) return '';
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    // Update specific cells with navio data
    const data = [
      { cell: 'B2', value: navioNome }, // Nome do navio
      { cell: 'D2', value: matricula }, // Matrícula
      { cell: 'B3', value: tipo }, // Tipo
      { cell: 'D3', value: clienteNome || '' }, // Cliente
      { cell: 'B4', value: formatDate(dataInspecao) }, // Data última inspeção
      { cell: 'D4', value: formatDate(dataProximaInspecao) }, // Data próxima inspeção
    ];
    
    // Apply data to cells
    data.forEach(({ cell, value }) => {
      worksheet[cell] = { v: value, t: 's' };
    });
    
    return workbook;
  } catch (error) {
    console.error('Error reading certificate template:', error);
    // Fallback to creating a basic workbook if template not found
    const workbook = XLSX.utils.book_new();
    const certificateData = [
      ['Certificado de Navio'],
      [''],
      ['Nome do Navio:', navioNome],
      ['Matrícula:', matricula],
      ['Tipo:', tipo],
      ['Cliente:', clienteNome || ''],
      ['Data da Inspeção:', dataInspecao ? new Date(dataInspecao).toLocaleDateString('pt-PT') : ''],
      ['Próxima Inspeção:', dataProximaInspecao ? new Date(dataProximaInspecao).toLocaleDateString('pt-PT') : ''],
    ];
    const certificateSheet = XLSX.utils.aoa_to_sheet(certificateData);
    XLSX.utils.book_append_sheet(workbook, certificateSheet, 'Certificado');
    return workbook;
  }
}

// Function to generate inspection report Excel file from template
function generateInspectionReportWorkbook(navioNome: string, numeroSerie: string, marca?: string | null, modelo?: string | null, capacidade?: number | null, dataInspecao?: Date | null, dataProximaInspecao?: Date | null, clienteNome?: string | null) {
  try {
    // Read template file
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'quadro-inspecao-template.xlsx');
    const templateBuffer = fs.readFileSync(templatePath);
    const workbook = XLSX.read(templateBuffer, { type: 'buffer' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Fill in the header information
    const year = new Date().getFullYear().toString();
    
    // Update specific cells with jangada data
    // These are based on the template structure shown in the image
    const data = [
      { cell: 'C3', value: numeroSerie }, // JANGADA number
      { cell: 'D4', value: navioNome }, // NAVIO
      { cell: 'G3', value: `${marca || 'Unknown'} ${modelo || 'Unknown'}` }, // MARCA/MODELO
      { cell: 'I3', value: `${capacidade || 'Unknown'}P` }, // CAPACIDADE
      { cell: 'I4', value: year }, // YEAR
      { cell: 'C4', value: clienteNome || 'N/A' }, // CLIENTE
      { cell: 'F4', value: dataInspecao ? dataInspecao.toLocaleDateString('pt-PT') : 'N/A' }, // DATA INSPEÇÃO
      { cell: 'H4', value: dataProximaInspecao ? dataProximaInspecao.toLocaleDateString('pt-PT') : 'N/A' }, // PRÓXIMA INSPEÇÃO
    ];
    
    // Apply data to cells
    data.forEach(({ cell, value }) => {
      worksheet[cell] = { v: value, t: 's' };
    });
    
    return workbook;
  } catch (error) {
    console.error('Error reading template:', error);
    // Fallback to creating a basic workbook if template not found
    const workbook = XLSX.utils.book_new();
    const inspectionData = [
      ['Quadro de Inspeção - Jangada Salva-Vidas'],
      [''],
      ['Informações da Jangada'],
      ['Número de Série:', numeroSerie],
      ['Marca:', marca || ''],
      ['Modelo:', modelo || ''],
      ['Capacidade:', capacidade ? `${capacidade} pessoas` : ''],
      ['Navio:', navioNome],
      ['Cliente:', clienteNome || ''],
      ['Data Inspeção:', dataInspecao ? dataInspecao.toLocaleDateString('pt-PT') : 'N/A'],
      ['Próxima Inspeção:', dataProximaInspecao ? dataProximaInspecao.toLocaleDateString('pt-PT') : 'N/A'],
    ];
    const inspectionSheet = XLSX.utils.aoa_to_sheet(inspectionData);
    XLSX.utils.book_append_sheet(workbook, inspectionSheet, 'Quadro_Inspecao');
    return workbook;
  }
}

// Function to create folder structure for a navio
export async function createNavioFolder(navioNome: string): Promise<string> {
  const graphClient = getClient();
  const mainFolderPath = await ensureMainFolder();

  // Initialize year folders first
  await initializeYearFolders();

  const year = new Date().getFullYear().toString();

  // Create navios subfolder under the year
  let naviosFolderPath = mainFolderPath;
  try {
    // Check if year folder exists (should exist after initializeYearFolders)
    const yearSearch = await graphClient
      .api(`/users/${userPrincipalName}/drive/${mainFolderPath}/children`)
      .filter(`name eq '${year}'`)
      .get();

    if (yearSearch.value.length > 0) {
      const yearFolderId = yearSearch.value[0].id;

      // Check if navios folder exists under year
      const naviosSearch = await graphClient
        .api(`/users/${userPrincipalName}/drive/items/${yearFolderId}/children`)
        .filter(`name eq 'navios'`)
        .get();

      if (naviosSearch.value.length === 0) {
        // Create navios folder
        const naviosResult = await graphClient
          .api(`/users/${userPrincipalName}/drive/items/${yearFolderId}/children`)
          .post({
            name: 'navios',
            folder: {},
            '@microsoft.graph.conflictBehavior': 'rename',
          });
        naviosFolderPath = `items/${naviosResult.id}`;
      } else {
        naviosFolderPath = `items/${naviosSearch.value[0].id}`;
      }

      // Now create or get navio folder under navios
      const navioSearch = await graphClient
        .api(`/users/${userPrincipalName}/drive/${naviosFolderPath}/children`)
        .filter(`name eq '${navioNome}'`)
        .get();

      if (navioSearch.value.length === 0) {
        // Create navio folder
        const navioResult = await graphClient
          .api(`/users/${userPrincipalName}/drive/${naviosFolderPath}/children`)
          .post({
            name: navioNome,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'rename',
          });
        console.log(`Pasta do navio ${navioNome} criada com sucesso.`);
        return `items/${navioResult.id}`;
      } else {
        console.log(`Pasta do navio ${navioNome} já existe.`);
        return `items/${navioSearch.value[0].id}`;
      }
    } else {
      throw new Error(`Pasta do ano ${year} não foi encontrada após inicialização.`);
    }
  } catch (error) {
    console.error(`Erro ao criar/verificar pasta do navio ${navioNome}:`, error);
    throw error;
  }
}

// Function to create folder for a jangada within its navio folder
export async function createJangadaFolder(navioNome: string, numeroSerie: string, marca?: string | null, modelo?: string | null, capacidade?: number | null, dataInspecao?: Date | null, dataProximaInspecao?: Date | null, clienteNome?: string | null) {
  const year = new Date().getFullYear().toString();
  const folderName = `${numeroSerie}-${marca || 'Unknown'}-${modelo || 'Unknown'}-${capacidade || 'Unknown'}`;

  // First ensure navio folder exists
  const navioPath = await createNavioFolder(navioNome);

  const graphClient = getClient();

  try {
    // Check if jangada folder exists
    const searchResult = await graphClient
      .api(`/users/${userPrincipalName}/drive/${navioPath}/children`)
      .filter(`name eq '${folderName}'`)
      .get();

    let jangadaPath: string;
    if (searchResult.value.length > 0) {
      jangadaPath = `items/${searchResult.value[0].id}`;
    } else {
      // Create folder
      const createResult = await graphClient
        .api(`/users/${userPrincipalName}/drive/${navioPath}/children`)
        .post({
          name: folderName,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename',
        });
      jangadaPath = `items/${createResult.id}`;
    }

    // Create Excel file
    const workbook = generateInspectionReportWorkbook(navioNome, numeroSerie, marca, modelo, capacidade, dataInspecao, dataProximaInspecao, clienteNome);
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const year = new Date().getFullYear().toString();
    const fileName = `${marca || 'Unknown'} ${modelo || 'Unknown'} ${capacidade || 'Unknown'}P Nº ${numeroSerie} (${year}).xlsx`;

    // Check if file already exists
    const fileSearch = await graphClient
      .api(`/users/${userPrincipalName}/drive/${jangadaPath}/children`)
      .filter(`name eq '${fileName}'`)
      .get();

    if (fileSearch.value.length === 0) {
      // Upload the file
      await graphClient
        .api(`/users/${userPrincipalName}/drive/${jangadaPath}:/${fileName}:/content`)
        .put(buffer);
    }

    return jangadaPath;
  } catch (error) {
    console.error(`Error creating jangada folder ${folderName}:`, error);
    throw error;
  }
}

// Function to create certificate file for navio in its OneDrive folder
export async function createNavioCertificate(navioNome: string, navioData: { matricula: string; tipo: string; clienteNome?: string | null; dataInspecao?: Date | null; dataProximaInspecao?: Date | null }) {
  const year = new Date().getFullYear().toString();

  // First ensure navio folder exists
  const navioPath = await createNavioFolder(navioNome);

  const graphClient = getClient();

  try {
    // Create certificate Excel file
    const workbook = generateCertificateWorkbook(navioNome, navioData.matricula, navioData.tipo, navioData.clienteNome, navioData.dataInspecao, navioData.dataProximaInspecao);
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const fileName = `Certificado_${navioNome}_${year}.xlsx`;

    // Check if file already exists
    const fileSearch = await graphClient
      .api(`/users/${userPrincipalName}/drive/${navioPath}/children`)
      .filter(`name eq '${fileName}'`)
      .get();

    if (fileSearch.value.length === 0) {
      // Upload the file
      await graphClient
        .api(`/users/${userPrincipalName}/drive/${navioPath}:/${fileName}:/content`)
        .put(buffer);
    }

    return fileName;
  } catch (error) {
    console.error(`Error creating certificate for navio ${navioNome}:`, error);
    throw error;
  }
}