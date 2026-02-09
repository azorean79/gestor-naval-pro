import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

export const maxDuration = 300 // 5 minutos timeout

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação (adicionar token se necessário)
    const authToken = request.headers.get('x-admin-token')
    if (authToken !== process.env.ADMIN_TOKEN) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    console.log('🔧 Iniciando importação de spares MK IV...')

    // Ler arquivo SQL gerado
    const sqlFile = path.join(process.cwd(), 'import-mk4-spares.sql')
    
    if (!fs.existsSync(sqlFile)) {
      return NextResponse.json(
        { 
          error: 'Arquivo SQL não encontrado. Execute primeiro: npx tsx scripts/generate-mk4-import-sql.ts',
          status: 'error'
        },
        { status: 404 }
      )
    }

    const sqlContent = fs.readFileSync(sqlFile, 'utf-8')
    console.log(`📄 SQL file size: ${(sqlContent.length / 1024).toFixed(2)} KB`)

    // Usar DATABASE_URL direto para execução de SQL raw
    const databaseUrl = process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL
    
    if (!databaseUrl) {
      return NextResponse.json(
        { error: 'DATABASE_URL não configurada', status: 'error' },
        { status: 500 }
      )
    }

    // Criar client para executar SQL raw
    let prisma: any
    
    try {
      prisma = new PrismaClient()
    } catch (e) {
      prisma = new PrismaClient()
    }

    // Separar comandos SQL (por ;)
    const commands = sqlContent
      .split(';')
      .map((cmd: string) => cmd.trim())
      .filter((cmd: string) => cmd && !cmd.startsWith('--'))

    console.log(`📊 Total de comandos SQL: ${commands.length}`)

    let executados = 0
    let erros = 0

    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i]
      
      try {
        if (cmd.toUpperCase() === 'BEGIN' || cmd.toUpperCase() === 'COMMIT') {
          continue
        }
        
        await prisma.$executeRawUnsafe(cmd)
        executados++

        if (executados % 10 === 0) {
          console.log(`   ✓ ${executados} comandos executados...`)
        }
      } catch (error: any) {
        console.error(`❌ Erro no comando ${i + 1}:`, error.message)
        erros++
      }
    }

    await prisma.$disconnect()

    const result = {
      status: 'success',
      message: 'Importação concluída',
      total_comandos: commands.length,
      executados,
      erros,
      sala: 'MK_IV_SPARES'
    }

    console.log(`\n✅ Importação finalizada!`)
    console.log(`   Executados: ${executados}`)
    console.log(`   Erros: ${erros}\n`)

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('❌ Erro na importação:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Erro ao importar',
        status: 'error',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST para executar a importação',
    method: 'POST',
    example: 'curl -X POST -H "x-admin-token: sua_senha" http://localhost:3000/api/admin/import-mk4-spares',
  })
  }
