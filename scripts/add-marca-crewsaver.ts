import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('⚙️  Adicionando marca CREWSAVER...\n')

  const crewsaver = await prisma.marcaJangada.upsert({
    where: { nome: 'CREWSAVER' },
    update: { ativo: true },
    create: { nome: 'CREWSAVER', ativo: true }
  })

  console.log(`✅ Marca CREWSAVER criada: ${crewsaver.id}`)
  console.log(`   - Nome: ${crewsaver.nome}`)
  console.log(`   - Status: ${crewsaver.ativo ? 'Ativa' : 'Inativa'}`)

  console.log('\n✅ Marca CREWSAVER adicionada com sucesso!')
}

main().catch((e) => {
  console.error('❌ Erro:', e)
  process.exit(1)
})
