// Script: validar_relatorio_inspecoes_ia.ts
// Descrição: Valida quadros de inspeção e gera relatório automático com IA.

import fs from 'fs';
import path from 'path';
// import { analyzeInspection } from './ia/analyzeInspection';

const INPUT_PATH = './inspecoes_2025.json';
const OUTPUT_PATH = './relatorio_inspecoes_ia.json';

function loadInspecoes() {
  const raw = fs.readFileSync(INPUT_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function validarInspecao(inspecao: any) {
  // Exemplo: chamada a IA para validar e sugerir melhorias
  // const iaResult = await analyzeInspection(inspecao);
  // return { ...inspecao, ...iaResult };
  // Simulação de validação
  const artigosCriticos = ['Luz flutuante', 'Kit de primeiros socorros', 'Água potável'];
  const faltas = artigosCriticos.filter(a => !inspecao.artigos?.some((art: any) => art.name === a));
  return {
    ...inspecao,
    ia_validado: true,
    ia_alertas: faltas.length ? [`Faltam artigos críticos: ${faltas.join(', ')}`] : ['Todos os artigos críticos presentes']
  };
}

async function main() {
  const inspecoes = loadInspecoes();
  const relatorio = [];
  for (const insp of inspecoes) {
    relatorio.push(await validarInspecao(insp));
  }
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(relatorio, null, 2), 'utf-8');
  console.log('Relatório IA guardado em', OUTPUT_PATH);
}

main();
