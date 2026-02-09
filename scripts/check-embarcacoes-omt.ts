import { prisma } from '../src/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'
import type { Prisma } from '../prisma/app/generated-prisma-client'

interface EmbarcacaoCheck {
  nome: string
  existe: boolean
  clienteNome?: string
  tipo?: string
  matricula?: string
}

async function extrairNomesEmbarcacoesPDF(pdfPath: string): Promise<string[]> {
  const dataBuffer = fs.readFileSync(pdfPath)
  const pdfModule = (await import('pdf-parse')) as unknown as {
    default?: (data: Buffer) => Promise<{ text: string }>
  }
  const pdfParse = pdfModule.default || (pdfModule as unknown as (data: Buffer) => Promise<{ text: string }>)
  const data = await pdfParse(dataBuffer)
  
  // Extrair nomes de embarcações do texto
  // Vamos retornar todas as linhas não vazias por agora
  const linhas = data.text
    .split('\n')
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0)
  
  return linhas
}

async function verificarEmbarcacoes() {
  try {
    console.log('🔍 Verificando embarcações existentes...\n')
    
    const pdfPath = path.join(process.cwd(), 'public', 'templates', 'OMT - Lista Embarcações.pdf')
    
    if (!fs.existsSync(pdfPath)) {
      console.log('⚠️  Ficheiro PDF não encontrado')
      console.log('📊 A mostrar todas as embarcações na base de dados...\n')
    }
    
    // Buscar todas as embarcações/navios na base de dados
    type NavioComRelacoes = Prisma.NavioGetPayload<{
      include: {
        cliente: { select: { nome: true; tipo: true } }
        proprietario: { select: { nome: true } }
      }
    }>

    const navios = await prisma.navio.findMany({
      include: {
        cliente: {
          select: {
            nome: true,
            tipo: true,
          }
        },
        proprietario: {
          select: {
            nome: true,
          }
        }
      },
      orderBy: {
        nome: 'asc'
      }
    }) as NavioComRelacoes[]
    
    console.log('═'.repeat(100))
    console.log('🚢 EMBARCAÇÕES NA BASE DE DADOS')
    console.log('═'.repeat(100))
    console.log(`Total: ${navios.length} embarcações\n`)
    
    // Criar relatório HTML com código de cores
    let htmlContent = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Embarcações - OMT</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 20px;
      background-color: #f5f5f5;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
    }
    .stats {
      display: flex;
      gap: 20px;
      margin: 20px 0;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      flex: 1;
    }
    .stat-number {
      font-size: 2em;
      font-weight: bold;
      color: #3498db;
    }
    .stat-label {
      color: #7f8c8d;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    th {
      background-color: #3498db;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #ecf0f1;
    }
    tr:hover {
      background-color: #f8f9fa;
    }
    .row-exists {
      background-color: #d4edda !important;
    }
    .row-new {
      background-color: #fff3cd !important;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85em;
      font-weight: 600;
    }
    .badge-success {
      background-color: #28a745;
      color: white;
    }
    .badge-warning {
      background-color: #ffc107;
      color: #212529;
    }
    .badge-info {
      background-color: #17a2b8;
      color: white;
    }
  </style>
</head>
<body>
  <h1>🚢 Relatório de Embarcações - Marítica Turística (OMT)</h1>
  
  <div class="stats">
    <div class="stat-card">
      <div class="stat-number">${navios.length}</div>
      <div class="stat-label">Total de Embarcações</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${navios.filter(n => n.status === 'ativo').length}</div>
      <div class="stat-label">Embarcações Ativas</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${navios.filter(n => n.cliente?.tipo === 'armador').length}</div>
      <div class="stat-label">Com Armador</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Nome da Embarcação</th>
        <th>Tipo</th>
        <th>Matrícula</th>
        <th>Cliente/Operador</th>
        <th>Comprimento</th>
        <th>Capacidade</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
`
    
    for (const navio of navios) {
      const clienteNome = navio.cliente?.nome || navio.proprietario?.nome || 'Não definido'
      const comprimento = navio.comprimento ? `${navio.comprimento}m` : '-'
      const capacidade = navio.capacidade ? `${navio.capacidade} pax` : '-'
      const matricula = navio.matricula || '-'
      
      console.log(`✅ ${navio.nome.padEnd(40)} | Cliente: ${clienteNome.padEnd(30)} | Tipo: ${navio.tipo}`)
      
      htmlContent += `
      <tr class="row-exists">
        <td><strong>${navio.nome}</strong></td>
        <td>${navio.tipo}</td>
        <td>${matricula}</td>
        <td>${clienteNome}</td>
        <td>${comprimento}</td>
        <td>${capacidade}</td>
        <td><span class="badge badge-success">✓ EXISTE</span></td>
      </tr>
`
    }
    
    htmlContent += `
    </tbody>
  </table>
  
  <div style="margin-top: 30px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h3>Legenda:</h3>
    <p>🟢 <strong>Verde</strong> - Embarcação já existe na base de dados</p>
    <p>🟡 <strong>Amarelo</strong> - Embarcação nova (ainda não importada)</p>
    <p style="margin-top: 20px; color: #7f8c8d; font-size: 0.9em;">
      Relatório gerado em: ${new Date().toLocaleString('pt-PT')}
    </p>
  </div>
</body>
</html>
`
    
    // Guardar relatório HTML
    const reportPath = path.join(process.cwd(), 'tmp', 'relatorios', 'embarcacoes-omt-check.html')
    const reportDir = path.dirname(reportPath)
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }
    
    fs.writeFileSync(reportPath, htmlContent)
    
    console.log('\n' + '═'.repeat(100))
    console.log(`✅ Relatório HTML gerado: ${reportPath}`)
    console.log('═'.repeat(100))
    
    // Buscar também obras relacionadas
    type ObraComCliente = Prisma.ObraGetPayload<{
      include: { cliente: { select: { nome: true } } }
    }>

    const obras = await prisma.obra.findMany({
      include: {
        cliente: {
          select: {
            nome: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    }) as ObraComCliente[]
    
    if (obras.length > 0) {
      console.log('\n📋 OBRAS RECENTES:')
      console.log('─'.repeat(100))
      for (const obra of obras) {
        console.log(`📌 ${obra.descricao || 'Sem descrição'.padEnd(50)} | Cliente: ${obra.cliente?.nome || 'N/A'}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  }
}

verificarEmbarcacoes()
  .then(() => {
    console.log('\n✅ Verificação concluída!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Falha:', error)
    process.exit(1)
  })
