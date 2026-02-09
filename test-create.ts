import 'dotenv/config'
import { PrismaClient } from './prisma/app/generated-prisma-client'
import { withAccelerate } from '@prisma/extension-accelerate'

// URL do Prisma Accelerate
const ACCELERATE_URL = "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19vUGw0S2F4emFsSDVUa2prLUpVTDQiLCJhcGlfa2V5IjoiMDFLR0o4TjBSVzRLSzZKRTZEMkhWTjRCRzUiLCJ0ZW5hbnRfaWQiOiI2Y2Y2ODlmZGI4MzkzODViYmI0ZDI1MzNlYTg3YzBjZDFkYjU4ZTNkYmI0ZjdkNDE5MzQ1Y2VjZDBjOTMyN2U0IiwiaW50ZXJuYWxfc2VjcmV0IjoiNDVmNzI2ZjItZDQ2YS00ODNjLWIyZjgtOGYyNTk3MzVhM2I5In0.S3sEic1XPPYbZwcQ1Od0TW63XHlsnWAPwPBjWvp-W7Q"

const prisma = new PrismaClient({
  accelerateUrl: ACCELERATE_URL,
}).$extends(withAccelerate())

async function testCreate() {
  try {
    const jangada = await prisma.jangada.create({
      data: {
        numeroSerie: 'TEST-001',
        tipo: 'inflável',
        status: 'ativo',
        estado: 'instalada',
        tecnico: 'Julio Correia',
      },
    })
    console.log('✅ Jangada criada:', jangada)
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCreate()