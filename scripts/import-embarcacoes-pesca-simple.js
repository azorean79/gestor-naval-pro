const { PrismaClient } = require('../prisma/app/generated-prisma-client');
const { withAccelerate } = require('@prisma/extension-accelerate');

// Configurar Prisma Accelerate
const ACCELERATE_URL = "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19vUGw0S2F4emFsSDVUa2prLUpVTDQiLCJhcGlfa2V5IjoiMDFLR0o4TjBSVzRLSzZKRTZEMkhWTjRCRzUiLCJ0ZW5hbnRfaWQiOiI2Y2Y2ODlmZGI4MzkzODViYmI0ZDI1MzNlYTg3YzBjZDFkYjU4ZTNkYmI0ZjdkNDE5MzQ1Y2VjZDBjOTMyN2U0IiwiaW50ZXJuYWxfc2VjcmV0IjoiNDVmNzI2ZjItZDQ2YS00ODNjLWIyZjgtOGYyNTk3MzVhM2I5In0.S3sEic1XPPYbZwcQ1Od0TW63XHlsnWAPwPBjWvp-W7Q";

const prisma = new PrismaClient({
  accelerateUrl: ACCELERATE_URL,
}).$extends(withAccelerate());

// Dados de embarcações de pesca dos Açores (exemplo baseado em dados reais)
const embarcacoesPesca = [
  // São Miguel
  { nome: 'SANTA MARIA', matricula: 'PDL-001-2024', ilha: 'São Miguel', armador: 'Armadores de Ponta Delgada' },
  { nome: 'NOSSA SENHORA', matricula: 'PDL-002-2024', ilha: 'São Miguel', armador: 'Pescas Açorianas Lda' },
  { nome: 'ATLÂNTICO', matricula: 'PDL-003-2024', ilha: 'São Miguel', armador: 'Marítima Açoreana' },
  { nome: 'MARIA DO MAR', matricula: 'PDL-004-2024', ilha: 'São Miguel', armador: 'Pescas do Atlântico' },

  // Terceira
  { nome: 'SÃO JORGE', matricula: 'ANG-001-2024', ilha: 'Terceira', armador: 'Armadores de Angra' },
  { nome: 'TERCEIRA', matricula: 'ANG-002-2024', ilha: 'Terceira', armador: 'Pescas da Terceira' },
  { nome: 'GRACIOSA', matricula: 'ANG-003-2024', ilha: 'Terceira', armador: 'Mar do Norte Lda' },

  // Graciosa
  { nome: 'GRACIOSA I', matricula: 'GRC-001-2024', ilha: 'Graciosa', armador: 'Pescas da Graciosa' },
  { nome: 'CARAPAU', matricula: 'GRC-002-2024', ilha: 'Graciosa', armador: 'Armadores da Graciosa' },

  // São Jorge
  { nome: 'VELAS', matricula: 'VLX-001-2024', ilha: 'São Jorge', armador: 'Pescas de São Jorge' },
  { nome: 'CALHETA', matricula: 'VLX-002-2024', ilha: 'São Jorge', armador: 'Marítima de Velas' },

  // Pico
  { nome: 'MADALENA', matricula: 'MDL-001-2024', ilha: 'Pico', armador: 'Pescas do Pico' },
  { nome: 'SANTO AMARO', matricula: 'MDL-002-2024', ilha: 'Pico', armador: 'Armadores de Madalena' },

  // Faial
  { nome: 'HORTA', matricula: 'HRT-001-2024', ilha: 'Faial', armador: 'Pescas da Horta' },
  { nome: 'CAPELO', matricula: 'HRT-002-2024', ilha: 'Faial', armador: 'Marítima do Faial' },

  // Flores
  { nome: 'FLORES', matricula: 'FLR-001-2024', ilha: 'Flores', armador: 'Pescas das Flores' },
  { nome: 'CORVO', matricula: 'FLR-002-2024', ilha: 'Flores', armador: 'Armadores das Flores' },

  // Corvo
  { nome: 'CORVO I', matricula: 'CRV-001-2024', ilha: 'Corvo', armador: 'Pescas do Corvo' },
];

async function main() {
  console.log('🚢 Iniciando importação de embarcações de pesca dos Açores...');

  let importados = 0;
  let erros = 0;

  for (const embarcacao of embarcacoesPesca) {
    try {
      // Primeiro, tentar encontrar um cliente existente com base no nome do armador
      let cliente = await prisma.cliente.findFirst({
        where: {
          nome: { contains: embarcacao.armador }
        }
      });

      // Se não encontrar cliente, criar um novo
      if (!cliente) {
        cliente = await prisma.cliente.create({
          data: {
            nome: embarcacao.armador,
            tipo: 'armador',
            delegacao: embarcacao.ilha,
            tecnico: 'Julio Correia',
          }
        });
        console.log(`✅ Criado cliente: ${cliente.nome}`);
      }

      // Verificar se o navio já existe
      const navioExistente = await prisma.navio.findFirst({
        where: { matricula: embarcacao.matricula }
      });

      if (navioExistente) {
        console.log(`⚠️  Navio já existe: ${embarcacao.matricula} - ${embarcacao.nome}`);
        continue;
      }

      // Inferir tipo baseado na matrícula
      const tipo = embarcacao.matricula.includes('-C') ? 'pesca-costeiro' :
                   embarcacao.matricula.includes('-L') ? 'pesca-local' : 'pesca-alto-mar';

      // Criar o navio
      const navio = await prisma.navio.create({
        data: {
          nome: embarcacao.nome,
          matricula: embarcacao.matricula,
          tipo: tipo,
          bandeira: 'Portugal',
          status: 'ativo',
          clienteId: cliente.id,
          delegacao: embarcacao.ilha,
          tecnico: 'Julio Correia',
        }
      });

      console.log(`🚢 Criado navio: ${navio.nome} (${navio.matricula}) - ${embarcacao.ilha}`);
      importados++;

    } catch (error) {
      console.error(`❌ Erro ao importar ${embarcacao.matricula}:`, error.message);
      erros++;
    }
  }

  console.log(`\n🎉 Importação concluída!`);
  console.log(`✅ Navios importados: ${importados}`);
  console.log(`❌ Erros: ${erros}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro geral:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });