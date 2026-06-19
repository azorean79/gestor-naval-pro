// Script: import_certificados_ia.ts
// Descrição: Importa certificados de ficheiros (CSV/JSON) e usa IA para validar e enriquecer os dados.

import fs from 'fs';
import path from 'path';
// Se quiseres usar uma API de IA, importa aqui (ex: OpenAI, HuggingFace, etc)
// import { analyzeCertificate } from './ia/analyzeCertificate';

const INPUT_PATH = './certificados_scan_result.json';
const OUTPUT_PATH = './certificados_enriquecidos.json';

function loadCertificados() {
  const raw = fs.readFileSync(INPUT_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function enrichCertificado(cert: any) {
  // Exemplo: chamada a IA para validar e enriquecer
  // const iaResult = await analyzeCertificate(cert);
  // return { ...cert, ...iaResult };
  // Por agora, simula enriquecimento
  return {
    ...cert,
    ia_validado: true,
    ia_sugestoes: ['Validade parece correta', 'Todos os campos obrigatórios presentes']
  };
}

async function main() {
  const certificados = loadCertificados();
  const enriched = [];
  for (const cert of certificados) {
    enriched.push(await enrichCertificado(cert));
  }
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(enriched, null, 2), 'utf-8');
  console.log('Certificados enriquecidos guardados em', OUTPUT_PATH);
}

main();
