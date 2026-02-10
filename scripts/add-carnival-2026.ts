import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import path from 'path'

// Load .env files
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const prisma = new PrismaClient()

async function addCarnival2026() {
  console.log('Adicionando Carnaval 2026...');

  try {
    // Ajuste: Certifique-se de que o modelo 'feriado' existe no schema Prisma
    // Se não existir, substitua por um modelo válido, por exemplo 'Feriado'
    const feriado = await prisma.Feriado.upsert({
      where: {
        nome_data: {
          nome: 'Carnaval',
          data: new Date('2026-02-17')
        }
      },
      update: {
        nome: 'Carnaval',
        data: new Date('2026-02-17'),
        tipo: 'nacional',
        recorrente: false,
        descricao: 'Terça-feira de Carnaval'
      },
      create: {
        nome: 'Carnaval',
        data: new Date('2026-02-17'),
        tipo: 'nacional',
        recorrente: false,
        descricao: 'Terça-feira de Carnaval'
      }
    });

    console.log('✅ Carnaval 2026 adicionado:', feriado);
  } catch (error) {
    console.error('❌ Erro ao adicionar Carnaval:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addCarnival2026();