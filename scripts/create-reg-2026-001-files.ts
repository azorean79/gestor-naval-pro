import { createInspectionExcel, createObraExcel, createCertificadoExcel } from './create-inspection-obra-files';
import * as path from 'path';

/**
 * Cria ficheiros Excel para o registro REG-2026-001
 * Jangada: 5086010100001
 * Inspeção: 01/01/2026
 * Obra: FO10260001
 * Certificado: AZ26-001
 */

const baseDir = path.join(__dirname, '..');

console.log('📝 Criando ficheiros para REG-2026-001...\n');

// Criar Inspeção 5086010100001
createInspectionExcel(
  {
    numeroSerie: '5086010100001',
    dataInspecao: '2026-01-01',
    tecnico: 'Julio Correia',
    resultado: 'APROVADA',
  },
  path.join(baseDir, 'quadros-inspecao', 'INSPECAO_5086010100001_GERAL_2026-01-01.xlsx')
);

// Criar Obra FO10260001
createObraExcel(
  {
    codigo: 'FO10260001',
    titulo: 'Manutenção Geral e Substituição de Componentes',
    tipo: 'MANUTENCAO',
    jangadaNumeroSerie: '5086010100001',
    dataInicio: '2026-01-15',
    status: 'CONCLUIDA',
  },
  path.join(baseDir, 'obras', 'OBRA_FO10260001_DETALHADA.xlsx')
);

// Criar Certificado AZ26-001
createCertificadoExcel(
  'AZ26-001',
  path.join(baseDir, 'certificates', 'CERTIFICADO_AZ26-001_DETALHADO.xlsx')
);

console.log('\n✅ Ficheiros para REG-2026-001 criados com sucesso!');
console.log('\n📋 Relação de ficheiros:');
console.log('   - quadros-inspecao/INSPECAO_5086010100001_GERAL_2026-01-01.xlsx');
console.log('   - obras/OBRA_FO10260001_DETALHADA.xlsx');
console.log('   - certificates/CERTIFICADO_AZ26-001_DETALHADO.xlsx');
