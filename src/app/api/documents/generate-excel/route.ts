import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Tipo e dados são obrigatórios' },
        { status: 400 }
      );
    }

    let filePath: string;
    let fileName: string;

    switch (type) {
      case 'inspecao':
        fileName = `INSPECAO_${data.numeroSerie}_${data.tipo || 'GERAL'}_${data.dataInspecao}.xlsx`;
        filePath = path.join(process.cwd(), 'quadros-inspecao', fileName);
        createInspectionExcel(data, filePath);
        break;

      case 'obra':
        fileName = `OBRA_${data.codigo}.xlsx`;
        filePath = path.join(process.cwd(), 'obras', fileName);
        createObraExcel(data, filePath);
        break;

      case 'certificado':
        fileName = `CERTIFICADO_${data.numero}.xlsx`;
        filePath = path.join(process.cwd(), 'certificates', fileName);
        createCertificadoExcel(data, filePath);
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo inválido. Use: inspecao, obra ou certificado' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      fileName,
      filePath: filePath.replace(process.cwd(), ''),
    });
  } catch (error) {
    console.error('Erro ao criar ficheiro Excel:', error);
    return NextResponse.json(
      { error: 'Erro ao criar ficheiro Excel' },
      { status: 500 }
    );
  }
}

function createInspectionExcel(data: any, outputPath: string) {
  const wb = XLSX.utils.book_new();

  const infoData = [
    ['QUADRO DE INSPEÇÃO DE JANGADA SALVA-VIDAS'],
    [''],
    ['Número de Série:', data.numeroSerie || ''],
    ['Data da Inspeção:', data.dataInspecao || ''],
    ['Técnico Responsável:', data.tecnico || ''],
    ['Tipo de Inspeção:', data.tipo || 'GERAL'],
    ['Resultado:', data.resultado || 'PENDENTE'],
    [''],
  ];

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
}

function createObraExcel(data: any, outputPath: string) {
  const wb = XLSX.utils.book_new();

  const infoData = [
    ['FOLHA DE OBRA / MANUTENÇÃO'],
    [''],
    ['Código da Obra:', data.codigo || ''],
    ['Título:', data.titulo || ''],
    ['Tipo:', data.tipo || ''],
    ['Jangada (Nº Série):', data.jangadaNumeroSerie || 'N/A'],
    ['Data de Início:', data.dataInicio || ''],
    ['Status:', data.status || 'PLANEJADA'],
    [''],
  ];

  const servicosData = [
    ['SERVIÇOS A EXECUTAR'],
    [''],
    ['ITEM', 'DESCRIÇÃO', 'QUANTIDADE', 'UNIDADE', 'STATUS'],
    ['1', '', '', '', ''],
    ['2', '', '', '', ''],
    ['3', '', '', '', ''],
    ['4', '', '', '', ''],
    ['5', '', '', '', ''],
  ];

  const materialData = [
    ['MATERIAL UTILIZADO'],
    [''],
    ['ITEM', 'DESCRIÇÃO', 'REF. STOCK', 'QUANTIDADE', 'VALOR UNIT.', 'VALOR TOTAL'],
    ['1', '', '', '', '', ''],
    ['2', '', '', '', '', ''],
    ['3', '', '', '', '', ''],
    ['', '', '', 'TOTAL:', '', ''],
  ];

  const maoObraData = [
    ['MÃO DE OBRA'],
    [''],
    ['TÉCNICO', 'FUNÇÃO', 'DATA', 'HORAS', 'VALOR/HORA', 'VALOR TOTAL'],
    ['', '', '', '', '', ''],
    ['', '', '', 'TOTAL:', '', ''],
  ];

  const testesData = [
    ['TESTES E VERIFICAÇÕES REALIZADAS'],
    [''],
    ['TESTE', 'RESULTADO', 'OBSERVAÇÕES'],
    ['Teste de pressão', '', ''],
    ['Teste de insuflação', '', ''],
    ['Teste de válvulas', '', ''],
    ['Teste de estanqueidade', '', ''],
    ['Inspeção visual final', '', ''],
  ];

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
}

function createCertificadoExcel(data: any, outputPath: string) {
  const wb = XLSX.utils.book_new();

  const certData = [
    ['CERTIFICADO DE INSPEÇÃO'],
    [''],
    ['Número do Certificado:', data.numero || ''],
    ['Data de Emissão:', data.dataEmissao || new Date().toLocaleDateString('pt-PT')],
    ['Entidade Emissora:', data.entidadeEmissora || 'OREY - Gestor Naval Pro'],
    [''],
    ['OBJETO DA CERTIFICAÇÃO'],
    [''],
    ['Tipo:', data.tipo || 'Jangada Salva-Vidas'],
    ['Número de Série:', data.numeroSerie || ''],
    ['Marca:', data.marca || ''],
    ['Modelo:', data.modelo || ''],
    ['Capacidade:', data.capacidade || ''],
    [''],
    ['RESULTADO DA INSPEÇÃO'],
    [''],
    ['Status:', data.status || 'APROVADA'],
    ['Data da Inspeção:', data.dataInspecao || ''],
    ['Técnico Responsável:', data.tecnico || ''],
    [''],
    ['VALIDADE'],
    [''],
    ['Data de Início:', data.dataEmissao || ''],
    ['Data de Validade:', data.dataValidade || ''],
    [''],
    ['OBSERVAÇÕES'],
    [''],
    [data.observacoes || ''],
    [''],
    [''],
    ['ASSINATURA E CARIMBO'],
    [''],
    ['_______________________________'],
    ['Técnico Certificador'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(certData);
  XLSX.utils.book_append_sheet(wb, ws, 'Certificado');

  XLSX.writeFile(wb, outputPath);
}
