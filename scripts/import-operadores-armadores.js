const { PrismaClient } = require('../prisma/app/generated-prisma-client');
// ...existing code...

// Configurar Prisma Accelerate
const ACCELERATE_URL = "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19TTVZ5LXJiWktoUUtZMHpmSm5Yd3YiLCJhcGlfa2V5IjoiMDFLR0FCQjI2RjRQMTFTR0dQOEY5RjlCRkoiLCJ0ZW5hbnRfaWQiOiIyMDkxNzE0YjM5OTA5NzkzMzVjM2M1MWUxZjQxNTY0NGE0ZDk0ZmM5MzhkODU4NWY4MGExM2VlYjdkODQwOGZkIiwiaW50ZXJuYWxfc2VjcmV0IjoiN2U1MDI0MGUtYjdmYS00NjhjLTljZTQtZTM5NTA2OGQ1NmJlIn0.A-eGaWSZG_w0sMQ4BmVZ13ckdGeYuRb6lMG4T4yvblk";

const prisma = new PrismaClient();
  accelerateUrl: ACCELERATE_URL,
});

// Lista de operadores e armadores para adicionar como clientes
const operadoresArmadores = [
  // Armadores de pesca
  { nome: 'Armadores de Ponta Delgada', tipo: 'armador', delegacao: 'São Miguel', email: 'armadores.pdl@azores.pt' },
  { nome: 'Pescas Açorianas Lda', tipo: 'armador', delegacao: 'São Miguel', email: 'pescas.acorianas@azores.pt' },
  { nome: 'Pescas do Atlântico', tipo: 'armador', delegacao: 'São Miguel', email: 'pescas.atlantico@azores.pt' },
  { nome: 'Armadores de Angra', tipo: 'armador', delegacao: 'Terceira', email: 'armadores.angra@azores.pt' },
  { nome: 'Pescas da Terceira', tipo: 'armador', delegacao: 'Terceira', email: 'pescas.terceira@azores.pt' },
  { nome: 'Mar do Norte Lda', tipo: 'armador', delegacao: 'Terceira', email: 'mar.norte@azores.pt' },
  { nome: 'Pescas da Graciosa', tipo: 'armador', delegacao: 'Graciosa', email: 'pescas.graciosa@azores.pt' },
  { nome: 'Armadores da Graciosa', tipo: 'armador', delegacao: 'Graciosa', email: 'armadores.graciosa@azores.pt' },
  { nome: 'Pescas de São Jorge', tipo: 'armador', delegacao: 'São Jorge', email: 'pescas.sjorge@azores.pt' },
  { nome: 'Marítima de Velas', tipo: 'armador', delegacao: 'São Jorge', email: 'maritima.velas@azores.pt' },
  { nome: 'Pescas do Pico', tipo: 'armador', delegacao: 'Pico', email: 'pescas.pico@azores.pt' },
  { nome: 'Armadores de Madalena', tipo: 'armador', delegacao: 'Pico', email: 'armadores.madalena@azores.pt' },
  { nome: 'Pescas da Horta', tipo: 'armador', delegacao: 'Faial', email: 'pescas.horta@azores.pt' },
  { nome: 'Marítima do Faial', tipo: 'armador', delegacao: 'Faial', email: 'maritima.faial@azores.pt' },
  { nome: 'Pescas das Flores', tipo: 'armador', delegacao: 'Flores', email: 'pescas.flores@azores.pt' },
  { nome: 'Armadores das Flores', tipo: 'armador', delegacao: 'Flores', email: 'armadores.flores@azores.pt' },
  { nome: 'Pescas do Corvo', tipo: 'armador', delegacao: 'Corvo', email: 'pescas.corvo@azores.pt' },

  // Operadores marítimo-turísticos
  { nome: 'Aqua Açores, Turismo Aquático, Venda e Aluguer de Equipamentos, Lda.', tipo: 'operador', delegacao: 'Açores', email: 'aqua.acores@azores.pt' },
  { nome: 'Oceanus Yacht Charter Lda', tipo: 'operador', delegacao: 'Açores', email: 'oceanus@azores.pt' },
  { nome: 'Atlantis Tours Açores', tipo: 'operador', delegacao: 'Açores', email: 'atlantis.tours@azores.pt' },
  { nome: 'Poseidon Maritime Tours', tipo: 'operador', delegacao: 'Açores', email: 'poseidon@azores.pt' },
  { nome: 'Calipso Yachting Açores', tipo: 'operador', delegacao: 'Açores', email: 'calipso@azores.pt' },
  { nome: 'Tritao Maritime Adventures', tipo: 'operador', delegacao: 'Açores', email: 'tritao@azores.pt' },
  { nome: 'Nerida Ocean Tours', tipo: 'operador', delegacao: 'Açores', email: 'nerida@azores.pt' },
  { nome: 'Delfino Diving & Tours', tipo: 'operador', delegacao: 'Açores', email: 'delfino@azores.pt' },
  { nome: 'Aquila Yacht Tours', tipo: 'operador', delegacao: 'Açores', email: 'aquila@azores.pt' },
  { nome: 'Marlin Fishing Tours', tipo: 'operador', delegacao: 'Açores', email: 'marlin@azores.pt' },
  { nome: 'Coral Reef Explorers', tipo: 'operador', delegacao: 'Açores', email: 'coral@azores.pt' },
  { nome: 'Vento do Mar Tours', tipo: 'operador', delegacao: 'Açores', email: 'vento@azores.pt' },
  { nome: 'Estrela do Atlântico', tipo: 'operador', delegacao: 'Açores', email: 'estrela@azores.pt' },
  { nome: 'Golfinho Dolphin Watching', tipo: 'operador', delegacao: 'Açores', email: 'golfinho@azores.pt' },
  { nome: 'São Pedro Maritime', tipo: 'operador', delegacao: 'Açores', email: 'saopedro@azores.pt' },

  // Armadores adicionais
  { nome: 'Pescas da Madeira Lda', tipo: 'armador', delegacao: 'Madeira', email: 'pescas.madeira@mail.pt' },
  { nome: 'Marítima Açoreana', tipo: 'armador', delegacao: 'Açores', email: 'maritima@azores.pt' },
];

async function main() {
  console.log('👥 Iniciando importação de operadores e armadores como clientes...');

  let criados = 0;
  let existentes = 0;
  let erros = 0;

  for (const clienteData of operadoresArmadores) {
    try {
      // Verificar se o cliente já existe
      const clienteExistente = await prisma.cliente.findFirst({
        where: { nome: clienteData.nome }
      });

      if (clienteExistente) {
        console.log(`⚠️  Cliente já existe: ${clienteData.nome}`);
        existentes++;
        continue;
      }

      // Criar o cliente
      const cliente = await prisma.cliente.create({
        data: {
          nome: clienteData.nome,
          email: clienteData.email,
          tipo: clienteData.tipo,
          delegacao: clienteData.delegacao,
          tecnico: 'Julio Correia',
        }
      });

      console.log(`✅ Criado cliente: ${cliente.nome} (${cliente.tipo})`);
      criados++;

    } catch (error) {
      console.error(`❌ Erro ao criar cliente ${clienteData.nome}:`, error.message);
      erros++;
    }
  }

  console.log(`\n🎉 Importação concluída!`);
  console.log(`✅ Clientes criados: ${criados}`);
  console.log(`⚠️  Clientes já existentes: ${existentes}`);
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