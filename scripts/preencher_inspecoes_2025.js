// Script para preencher inspeções a partir dos certificados de 2025
// Gera inspecoes_2025.json com número de obra de exemplo se não existir

const fs = require('fs');
const path = require('path');

// Lendo o arquivo forçando o enconding correto para evitar problemas com BOM (Byte Order Mark)
const jsonPath = path.join(__dirname, '..', 'jangadas_certificados_2025.json');
const rawData = fs.readFileSync(jsonPath, 'utf16le');
// Limpando possível caractere BOM no início da string antes do parse
const cleanData = rawData.replace(/^\uFEFF/, '');
const certificados = JSON.parse(cleanData);

// Função para gerar número de obra de exemplo
function gerarNumeroObra(idx) {
  return `OBRA-${String(idx + 1).padStart(3, '0')}`;
}

// Função para extrair dados relevantes de cada certificado
function extrairInspecao(cert, idx) {
  // Exemplo: extrair serial, modelo, capacidade, datas, etc
  // Ajuste conforme a estrutura real do JSON
  const serial = cert.dados?.find(d => d && d.result && String(d.result).length > 8)?.result || '';
  const modelo = cert.dados?.find(d => typeof d === 'string' && d.toLowerCase().includes('model')) || '';
  const capacidade = cert.dados?.find(d => typeof d === 'number') || '';
  const dataInspecao = cert.dados?.find(d => typeof d === 'string' && d.match(/\d{4}-\d{2}-\d{2}/)) || '';
  // Número de obra: se não existir, gera um de exemplo
  let numeroObra = cert.numeroObra || gerarNumeroObra(idx);
  return {
    arquivo: cert.arquivo,
    serial,
    modelo,
    capacidade,
    dataInspecao,
    numeroObra
  };
}

const inspecoes = certificados.map(extrairInspecao);

fs.writeFileSync('inspecoes_2025.json', JSON.stringify(inspecoes, null, 2), 'utf-8');

console.log('Arquivo inspecoes_2025.json gerado com sucesso!');
