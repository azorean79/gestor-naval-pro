import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script de teste para criar um ficheiro Excel de exemplo
 * com o layout do Quadro de Inspeção da Jangada
 * 
 * Uso: npx ts-node scripts/create-test-quadro.ts
 */

function createTestQuadroInspecao() {
  const workbook = XLSX.utils.book_new();

  // Dados da jangada
  const jangadaData = [
    ['QUADRO DE INSPEÇÃO DA JANGADA'],
    [''],
    ['JANGADA:'],
    ['Número de Série', '6017330300330'],
    ['Navio', 'MESTRE MIGUEL'],
    ['Marca/Modelo', 'RFD SEASAVE PLUS R'],
    ['Lotação', '8'],
    [''],
    ['CERTIFICADO:'],
    ['Número do Certificado', 'AZ25-002'],
    ['Data de Inspeção', '07-01-2025'],
    ['Data Próxima Inspeção', '07-01-2026'],
    ['Técnico Responsável', 'Julio Correia'],
    [''],
  ];

  // Componentes interiores
  const componentesInteriores = [
    ['COMPONENTES INTERIORES'],
    ['Nome', 'Quantidade', 'Estado', 'Validade', 'Observações'],
    ['Coletes Salva-Vidas', 8, 'OK', '06/2027', 'Completos'],
    ['EPIRB', 1, 'OK', '12/2026', 'Funcionando'],
    ['Sinalizador Fumígeno', 4, 'OK', '03/2025', 'Válidos'],
    ['Sinalizador Luminoso', 4, 'OK', '03/2025', 'Válidos'],
    ['Espelho de Sinalização', 1, 'OK', null, 'Sem validade'],
    ['Manual de Instruções', 1, 'OK', null, 'Íntegro'],
    [''],
  ];

  // Componentes exteriores
  const componentesExteriores = [
    ['COMPONENTES EXTERIORES'],
    ['Nome', 'Quantidade', 'Estado', 'Validade', 'Observações'],
    ['Proteções de Juntas', 2, 'OK', null, 'Em bom estado'],
    ['Válvulas Atenuador', 2, 'OK', null, 'Sem sinal de corrosão'],
    ['Amarras Técnicas', 2, 'OK', null, 'Resistência OK'],
    ['Reparos na Escada', 1, 'Substituído', '06/2025', 'Reparados'],
    [''],
  ];

  // Cilindros CO2
  const cilindros = [
    ['CILINDROS CO2'],
    ['Nº de Série', 'Tipo', 'Pressão (bar)', 'Gás', 'Validade', 'Data Próximo Teste'],
    ['17W63103', 'CO2', 57.25, 'CO2', '12/2026', '12-12-2025'],
    ['17W63104', 'CO2', 55.0, 'CO2', '11/2026', '11-11-2025'],
    [''],
  ];

  // Testes realizados
  const testes = [
    ['TESTES REALIZADOS'],
    ['Tipo de Teste', 'Data', 'Resultado', 'Pressão (bar)'],
    ['NAP - TEST', '07-01-2025', 'OK', '57.25'],
    ['F3 - TEST', '07-01-2025', 'OK', null],
    ['QI - TEST', '07-01-2025', 'OK', null],
    ['LOAD - TEST', '07-01-2025', 'OK', '1.1'],
  ];

  // Combinar todas as seções
  const allData = [
    ...jangadaData,
    ...componentesInteriores,
    ...componentesExteriores,
    ...cilindros,
    ...testes,
  ];

  // Criar sheet
  const sheet = XLSX.utils.aoa_to_sheet(allData);

  // Configurar larguras das colunas
  sheet['!cols'] = [
    { wch: 25 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
  ];

  // Adicionar sheet ao workbook
  XLSX.utils.book_append_sheet(workbook, sheet, 'Quadro_Inspecao');

  // Salvar ficheiro
  const outputPath = path.join(process.cwd(), 'public', 'templates', 'test-quadro-inspecao.xlsx');
  
  // Criar diretório se não existir
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  XLSX.writeFile(workbook, outputPath);
  console.log(`✅ Ficheiro de teste criado: ${outputPath}`);
}

// Executar
createTestQuadroInspecao();
