import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import type { Jangada } from '@/lib/types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) return NextResponse.json({ erro: 'ID não informado' }, { status: 400 })

  // Busca dados da jangada

  // Busca dados da jangada, incluindo proprietário, certificados e inspeções
  const jangada = await prisma.jangada.findUnique({
    where: { id },
    include: {
      marca: true,
      modelo: true,
      lotacao: true,
      navio: true,
      cliente: true,
      proprietario: true,
      certificados: { orderBy: { dataEmissao: 'desc' }, take: 1 },
      inspecoes: { orderBy: { dataInspecao: 'desc' }, take: 1 }
    }
  }) as Jangada | null
  if (!jangada) return NextResponse.json({ erro: 'Jangada não encontrada' }, { status: 404 })

  // País de fabricação automático
  let paisFabricacao = 'Desconhecido'
  if (jangada.marca?.nome === 'RFD') paisFabricacao = 'Inglaterra'
  if (jangada.marca?.nome === 'DSB') paisFabricacao = 'Alemanha'
  if (jangada.marca?.nome === 'ZODIAC') paisFabricacao = 'França'


  // Extrai dados adicionais
  // Busca manual do último certificado e inspeção
  const certificado = await prisma.certificado.findFirst({
    where: { jangadaId: id },
    orderBy: { dataEmissao: 'desc' }
  });
  const inspecao = await prisma.inspecao.findFirst({
    where: { jangadaId: id },
    orderBy: { dataInspecao: 'desc' }
  });
  const proprietario = jangada.proprietario
  const cliente = jangada.cliente
  const navio = jangada.navio
  const marca = jangada.marca
  const modelo = jangada.modelo
  const lotacao = jangada.lotacao

  // Monta documento com campos obrigatórios
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'Ficha de Identificação de Jangada', bold: true, size: 32 }),
            ],
            spacing: { after: 400 },
          }),
          new Paragraph(`Número de Série: ${jangada.numeroSerie}`),
          new Paragraph(`Marca: ${marca?.nome || ''}`),
          new Paragraph(`Modelo: ${modelo?.nome || ''}`),
          new Paragraph(`Capacidade: ${lotacao?.capacidade || ''}`),
          new Paragraph(`Ano de Fabricação: ${jangada.dataFabricacao ? new Date(jangada.dataFabricacao).getFullYear() : ''}`),
          new Paragraph(`País de Fabricação: ${paisFabricacao}`),
          new Paragraph(`Cliente: ${cliente?.nome || ''}`),
          new Paragraph(`Proprietário: ${proprietario?.nome || ''}`),
          new Paragraph(`Navio: ${navio?.nome || ''}`),
          new Paragraph(`Nº do Relatório (Certificado): ${certificado?.numero || ''}`),
          new Paragraph(`Data da Última Inspeção: ${inspecao?.dataInspecao ? new Date(inspecao.dataInspecao).toLocaleDateString('pt-PT') : ''}`),
          new Paragraph(`Data da Inspeção (geração): ${new Date().toLocaleDateString('pt-PT')}`),
        ],
      },
    ],
  })

  // Gera buffer
  const buffer = await Packer.toBuffer(doc)
  const pasta = join(process.cwd(), 'DGRM')
  if (!existsSync(pasta)) mkdirSync(pasta)
  const nomeArquivo = join(pasta, `ficha de identificação de jangada - ${jangada.numeroSerie}.docx`)
  writeFileSync(nomeArquivo, buffer)

  return NextResponse.json({ sucesso: true, arquivo: nomeArquivo })
}
