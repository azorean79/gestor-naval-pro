import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('⚙️  Adicionando marca EUROVINIL...\n');

  // Criar marca EUROVINIL
  const eurovinil = await prisma.marcaJangada.upsert({
    where: { nome: 'EUROVINIL' },
    update: {
      ativo: true
    },
    create: { 
      nome: 'EUROVINIL',
      ativo: true
    },
  });

  console.log(`✅ Marca EUROVINIL criada: ${eurovinil.id}`);
  console.log(`   - Nome: ${eurovinil.nome}`);
  console.log(`   - Status: ${eurovinil.ativo ? 'Ativa' : 'Inativa'}`);

  console.log('\n✅ Marca EUROVINIL adicionada com sucesso!');
  console.log('   Próximos passos:');
  console.log('   1. Adicionar modelos de jangadas EUROVINIL');
  console.log('   2. Configurar especificações técnicas');
  console.log('   3. Adicionar spares ao armazém');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  });
