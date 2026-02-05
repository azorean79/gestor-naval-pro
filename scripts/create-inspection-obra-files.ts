import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script para criar ficheiros Excel de inspeções e obras
 */

interface InspectionData {
  numeroSerie: string;
  dataInspecao: string;
  tecnico: string;
  resultado: string;
}

interface ObraData {
  codigo: string;
  titulo: string;
  tipo: string;
  jangadaNumeroSerie?: string;
  dataInicio?: string;
  status: string;
}

/**
 * Cria ficheiro Excel de inspeção
 */
function createInspectionExcel(data: InspectionData, outputPath: string) {
  const wb = XLSX.utils.book_new();

  // Folha 1: Informações Gerais
  const infoData = [
    ['QUADRO DE INSPEÇÃO DE JANGADA SALVA-VIDAS'],
    [''],
    ['Número de Série:', data.numeroSerie],
    ['Data da Inspeção:', data.dataInspecao],
    ['Técnico Responsável:', data.tecnico],
    ['Resultado:', data.resultado],
    [''],
  ];

  // Folha 2: Checklist de Inspeção Visual
  const checklistVisual = [
    ['ITEM', 'CONFORME', 'NÃO CONFORME', 'OBSERVAÇÕES'],
    ['1. Estado geral da embalagem', '', '', ''],
    ['2. Identificação e marcação', '', '', ''],
    ['3. Data de validade', '', '', ''],
    ['4. Sistema de suspensão (HRU)', '', '', ''],
    ['5. Estanqueidade da embalagem', '', '', ''],
    ['6. Danos visíveis na estrutura', '', '', ''],
    ['7. Corrosão ou oxidação', '', '', ''],
    ['8. Estado das cintas', '', '', ''],
    ['9. Lacres de segurança', '', '', ''],
    ['10. Placa de identificação', '', '', ''],
  ];

  // Folha 3: Checklist de Inspeção Mecânica
  const checklistMecanica = [
    ['ITEM', 'CONFORME', 'NÃO CONFORME', 'OBSERVAÇÕES'],
    ['1. Sistema de insuflação', '', '', ''],
    ['2. Válvulas de alívio', '', '', ''],
    ['3. Válvulas de enchimento', '', '', ''],
    ['4. Cilindro de CO2', '', '', ''],
    ['5. Cilindro de N2', '', '', ''],
    ['6. Pressão dos cilindros', '', '', ''],
    ['7. Data de validade dos cilindros', '', '', ''],
    ['8. Conexões e tubagens', '', '', ''],
    ['9. Mecanismo de abertura', '', '', ''],
    ['10. Testagem de válvulas', '', '', ''],
  ];

  // Folha 4: Checklist de Segurança
  const checklistSeguranca = [
    ['ITEM', 'CONFORME', 'NÃO CONFORME', 'OBSERVAÇÕES'],
    ['1. Kit de primeiros socorros', '', '', ''],
    ['2. Rações de emergência', '', '', ''],
    ['3. Água potável', '', '', ''],
    ['4. Sinais pirotécnicos', '', '', ''],
    ['5. Lanternas', '', '', ''],
    ['6. Apitos', '', '', ''],
    ['7. Kit de pesca', '', '', ''],
    ['8. Kit de reparação', '', '', ''],
    ['9. Manual de sobrevivência', '', '', ''],
    ['10. Remos e equipamentos', '', '', ''],
  ];

  // Folha 5: Resumo e Ações
  const resumoData = [
    ['RESUMO DA INSPEÇÃO'],
    [''],
    ['Total de Itens Verificados:', '30'],
    ['Itens Conformes:', ''],
    ['Itens Não Conformes:', ''],
    ['Itens Críticos:', ''],
    [''],
    ['AÇÕES RECOMENDADAS'],
    ['Ação', 'Prioridade', 'Prazo'],
    ['', '', ''],
    ['', '', ''],
    ['', '', ''],
    [''],
    ['ASSINATURAS'],
    [''],
    ['Técnico: _______________________', 'Data: _______'],
    ['Responsável: ___________________', 'Data: _______'],
  ];

  const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
  const wsVisual = XLSX.utils.aoa_to_sheet(checklistVisual);
  const wsMecanica = XLSX.utils.aoa_to_sheet(checklistMecanica);
  const wsSeguranca = XLSX.utils.aoa_to_sheet(checklistSeguranca);
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);

  XLSX.utils.book_append_sheet(wb, wsInfo, 'Informações');
  XLSX.utils.book_append_sheet(wb, wsVisual, 'Inspeção Visual');
  XLSX.utils.book_append_sheet(wb, wsMecanica, 'Inspeção Mecânica');
  XLSX.utils.book_append_sheet(wb, wsSeguranca, 'Segurança');
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

  XLSX.writeFile(wb, outputPath);
  console.log(`✅ Ficheiro de inspeção criado: ${outputPath}`);
}

/**
 * Cria ficheiro Excel de obra
 */
function createObraExcel(data: ObraData, outputPath: string) {
  const wb = XLSX.utils.book_new();

  // Folha 1: Informações da Obra
  const infoData = [
    ['FOLHA DE OBRA / MANUTENÇÃO'],
    [''],
    ['Código da Obra:', data.codigo],
    ['Título:', data.titulo],
    ['Tipo:', data.tipo],
    ['Jangada (Nº Série):', data.jangadaNumeroSerie || 'N/A'],
    ['Data de Início:', data.dataInicio || ''],
    ['Status:', data.status],
    [''],
  ];

  // Folha 2: Serviços a Executar
  const servicosData = [
    ['SERVIÇOS A EXECUTAR'],
    [''],
    ['ITEM', 'DESCRIÇÃO', 'QUANTIDADE', 'UNIDADE', 'STATUS'],
    ['1', '', '', '', ''],
    ['2', '', '', '', ''],
    ['3', '', '', '', ''],
    ['4', '', '', '', ''],
    ['5', '', '', '', ''],
    ['6', '', '', '', ''],
    ['7', '', '', '', ''],
    ['8', '', '', '', ''],
    ['9', '', '', '', ''],
    ['10', '', '', '', ''],
  ];

  // Folha 3: Material Utilizado
  const materialData = [
    ['MATERIAL UTILIZADO'],
    [''],
    ['ITEM', 'DESCRIÇÃO', 'REF. STOCK', 'QUANTIDADE', 'VALOR UNIT.', 'VALOR TOTAL'],
    ['1', '', '', '', '', ''],
    ['2', '', '', '', '', ''],
    ['3', '', '', '', '', ''],
    ['4', '', '', '', '', ''],
    ['5', '', '', '', '', ''],
    ['6', '', '', '', '', ''],
    ['7', '', '', '', '', ''],
    ['8', '', '', '', '', ''],
    ['', '', '', 'TOTAL:', '', ''],
  ];

  // Folha 4: Mão de Obra
  const maoObraData = [
    ['MÃO DE OBRA'],
    [''],
    ['TÉCNICO', 'FUNÇÃO', 'DATA', 'HORAS', 'VALOR/HORA', 'VALOR TOTAL'],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', 'TOTAL:', '', ''],
  ];

  // Folha 5: Testes e Verificações
  const testesData = [
    ['TESTES E VERIFICAÇÕES REALIZADAS'],
    [''],
    ['TESTE', 'RESULTADO', 'OBSERVAÇÕES'],
    ['Teste de pressão', '', ''],
    ['Teste de insuflação', '', ''],
    ['Teste de válvulas', '', ''],
    ['Teste de estanqueidade', '', ''],
    ['Inspeção visual final', '', ''],
    ['Verificação de equipamentos', '', ''],
    [''],
    ['CONCLUSÃO'],
    [''],
    ['Status Final:', ''],
    ['Observações Gerais:', ''],
    [''],
    ['Próxima Manutenção:', ''],
  ];

  // Folha 6: Orçamento e Faturação
  const orcamentoData = [
    ['ORÇAMENTO E CUSTOS'],
    [''],
    ['DESCRIÇÃO', 'VALOR'],
    ['Material', ''],
    ['Mão de Obra', ''],
    ['Deslocações', ''],
    ['Outros Custos', ''],
    [''],
    ['SUBTOTAL', ''],
    ['IVA (23%)', ''],
    ['TOTAL', ''],
    [''],
    [''],
    ['ASSINATURAS'],
    [''],
    ['Técnico Executante: _______________________', 'Data: _______'],
    ['Supervisor: _______________________________', 'Data: _______'],
    ['Cliente: __________________________________', 'Data: _______'],
  ];

  const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
  const wsServicos = XLSX.utils.aoa_to_sheet(servicosData);
  const wsMaterial = XLSX.utils.aoa_to_sheet(materialData);
  const wsMaoObra = XLSX.utils.aoa_to_sheet(maoObraData);
  const wsTestes = XLSX.utils.aoa_to_sheet(testesData);
  const wsOrcamento = XLSX.utils.aoa_to_sheet(orcamentoData);

  XLSX.utils.book_append_sheet(wb, wsInfo, 'Informações');
  XLSX.utils.book_append_sheet(wb, wsServicos, 'Serviços');
  XLSX.utils.book_append_sheet(wb, wsMaterial, 'Material');
  XLSX.utils.book_append_sheet(wb, wsMaoObra, 'Mão de Obra');
  XLSX.utils.book_append_sheet(wb, wsTestes, 'Testes');
  XLSX.utils.book_append_sheet(wb, wsOrcamento, 'Orçamento');

  XLSX.writeFile(wb, outputPath);
  console.log(`✅ Ficheiro de obra criado: ${outputPath}`);
}

/**
 * Cria ficheiro Excel de certificado
 */
function createCertificadoExcel(numero: string, outputPath: string) {
  const wb = XLSX.utils.book_new();

  const data = [
    ['CERTIFICADO DE INSPEÇÃO'],
    [''],
    ['Número do Certificado:', numero],
    ['Data de Emissão:', new Date().toLocaleDateString('pt-PT')],
    ['Entidade Emissora:', 'OREY - Gestor Naval Pro'],
    [''],
    ['OBJETO DA CERTIFICAÇÃO'],
    [''],
    ['Tipo:', 'Jangada Salva-Vidas'],
    ['Número de Série:', ''],
    ['Marca:', ''],
    ['Modelo:', ''],
    ['Capacidade:', ''],
    [''],
    ['RESULTADO DA INSPEÇÃO'],
    [''],
    ['Status:', 'APROVADA'],
    ['Data da Inspeção:', ''],
    ['Técnico Responsável:', ''],
    [''],
    ['VALIDADE'],
    [''],
    ['Data de Início:', ''],
    ['Data de Validade:', ''],
    [''],
    ['OBSERVAÇÕES'],
    [''],
    [''],
    [''],
    [''],
    ['ASSINATURA E CARIMBO'],
    [''],
    ['_______________________________'],
    ['Técnico Certificador'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Certificado');

  XLSX.writeFile(wb, outputPath);
  console.log(`✅ Ficheiro de certificado criado: ${outputPath}`);
}

// Exemplo de uso
if (require.main === module) {
  const baseDir = path.join(__dirname, '..');

  // Criar diretórios se não existirem
  const dirs = [
    path.join(baseDir, 'quadros-inspecao'),
    path.join(baseDir, 'obras'),
    path.join(baseDir, 'certificates'),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Criar exemplos
  console.log('📝 Criando ficheiros de exemplo...\n');

  // Inspeção
  createInspectionExcel(
    {
      numeroSerie: '5086010100002',
      dataInspecao: '2026-02-05',
      tecnico: 'Julio Correia',
      resultado: 'APROVADA',
    },
    path.join(baseDir, 'quadros-inspecao', '5086010100002_2026-02-05.xlsx')
  );

  // Obra
  createObraExcel(
    {
      codigo: 'FO10260002',
      titulo: 'Manutenção Preventiva Anual',
      tipo: 'MANUTENCAO',
      jangadaNumeroSerie: '5086010100002',
      dataInicio: '2026-02-10',
      status: 'PLANEJADA',
    },
    path.join(baseDir, 'obras', 'FO10260002.xlsx')
  );

  // Certificado
  createCertificadoExcel(
    'AZ26-002',
    path.join(baseDir, 'certificates', 'AZ26-002.xlsx')
  );

  console.log('\n✅ Todos os ficheiros foram criados com sucesso!');
}

export { createInspectionExcel, createObraExcel, createCertificadoExcel };
