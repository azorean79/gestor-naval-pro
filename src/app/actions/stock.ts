"use server"

import prisma from "@/lib/prisma"
import { buildDatabaseErrorResponse } from "@/lib/database-errors"
import { beginApiRequest, captureApiError, finishApiRequest, withRequestId } from '@/lib/observability'
import { NextRequest, NextResponse } from 'next/server'
import { getAccessContext } from '@/lib/access-control'
import { normalizeStockPayload, findDuplicateCylinderStock, canEditStock } from '@/lib/stock-utils'
import { resolveActiveServiceStationId } from '@/lib/station-selection'

type StockCreateSchema = {
  referencia?: string
  descricao: string
  nome?: string
  categoria?: string
  associavelJangada: boolean
  aplicavelMarcaJangada?: string
  aplicavelModeloJangada?: string
  precoCompra?: number | null
  codigoFabricante?: string | null
  inventario?: string | null
  lote?: string | null
  validade?: string | null
  testeHidraulico?: string | null
  estadoCargaCilindro?: string | null
  precoVenda: number
  quantidade: number
  quantidadeMinima?: number | null
  localizacao?: string | null
  codigoBarras?: string | null
  estadoArtigo: string
  referenciaSubstituta?: string | null
}

export async function createStockItem(data: StockCreateSchema) {
  const context = beginApiRequest(new NextRequest('http://localhost'), 'stock')
  const respond = (body: unknown, init?: ResponseInit, extra?: Record<string, unknown>) => {
    const response = NextResponse.json(body, init)
    finishApiRequest(context, response.status, extra)
    return withRequestId(response, context)
  }

  try {
    const access = await getAccessContext()
    if (!access) {
      return respond({ error: "Sessão obrigatória." }, { status: 401 })
    }
    if (!canEditStock(access)) {
      return respond({ error: "Sem permissão para editar stock." }, { status: 403 })
    }

    const activeStationId = resolveActiveServiceStationId(new NextRequest('http://localhost'), access)
    
    const payload = normalizeStockPayload({
      nome: data.nome || data.descricao,
      descricao: data.descricao,
      referencia: data.referencia,
      categoria: data.categoria,
      associavelJangada: data.associavelJangada,
      aplicavelMarcaJangada: data.aplicavelMarcaJangada,
      aplicavelModeloJangada: data.aplicavelModeloJangada,
      precoCompra: data.precoCompra,
      codigoFabricante: data.codigoFabricante,
      inventario: data.inventario,
      lote: data.lote,
      validade: data.validade,
      testeHidraulico: data.testeHidraulico,
      estadoCargaCilindro: data.estadoCargaCilindro,
      precoVenda: data.precoVenda,
      quantidade: data.quantidade,
      quantidadeMinima: data.quantidadeMinima,
      localizacao: data.localizacao,
      codigoBarras: data.codigoBarras,
      estadoArtigo: data.estadoArtigo,
      referenciaSubstituta: data.referenciaSubstituta,
    })

    const duplicate = await findDuplicateCylinderStock(payload)
    if (duplicate) {
      return respond(
        {
          error: `Já existe um cilindro com essa referência/número de série no stock (ID ${duplicate.id}).`,
          duplicateId: duplicate.id,
        },
        { status: 409 },
      )
    }

    const created = await prisma.stock.create({
      data: {
        ...payload,
        serviceStationId: activeStationId,
      },
    })

    return respond(created, undefined, { batch: false, stockId: created.id })
  } catch (error) {
    captureApiError(context, error)
    const response = buildDatabaseErrorResponse(error, 'Erro ao criar stock')
    finishApiRequest(context, response.status)
    return withRequestId(response, context)
  }
}

export async function createStockBulk(items: StockCreateSchema[]) {
  const context = beginApiRequest(new NextRequest('http://localhost'), 'stock')
  const respond = (body: unknown, init?: ResponseInit, extra?: Record<string, unknown>) => {
    const response = NextResponse.json(body, init)
    finishApiRequest(context, response.status, extra)
    return withRequestId(response, context)
  }

  try {
    const access = await getAccessContext()
    if (!access) {
      return respond({ error: "Sessão obrigatória." }, { status: 401 })
    }
    if (!canEditStock(access)) {
      return respond({ error: "Sem permissão para editar stock." }, { status: 403 })
    }

    const activeStationId = resolveActiveServiceStationId(new NextRequest('http://localhost'), access)
    
    const data = items.map(item => ({
      ...normalizeStockPayload({
        nome: item.nome || item.descricao,
        descricao: item.descricao,
        referencia: item.referencia,
        categoria: item.categoria,
        associavelJangada: item.associavelJangada,
        aplicavelMarcaJangada: item.aplicavelMarcaJangada,
        aplicavelModeloJangada: item.aplicavelModeloJangada,
        precoCompra: item.precoCompra,
        codigoFabricante: item.codigoFabricante,
        inventario: item.inventario,
        lote: item.lote,
        validade: item.validade,
        testeHidraulico: item.testeHidraulico,
        estadoCargaCilindro: item.estadoCargaCilindro,
        precoVenda: item.precoVenda,
        quantidade: item.quantidade,
        quantidadeMinima: item.quantidadeMinima,
        localizacao: item.localizacao,
        codigoBarras: item.codigoBarras,
        estadoArtigo: item.estadoArtigo,
        referenciaSubstituta: item.referenciaSubstituta,
      }),
      serviceStationId: activeStationId,
    }))

    for (const item of data) {
      const duplicate = await findDuplicateCylinderStock(item)
      if (duplicate) {
        return respond(
          {
            error: `Já existe um cilindro com essa referência/número de série no stock (ID ${duplicate.id}).`,
            duplicateId: duplicate.id,
          },
          { status: 409 },
        )
      }
    }

    const created = await prisma.stock.createMany({ data })
    return respond({ count: created.count }, undefined, { batch: true })
  } catch (error) {
    captureApiError(context, error)
    const response = buildDatabaseErrorResponse(error, 'Erro ao criar stock em lote')
    finishApiRequest(context, response.status)
    return withRequestId(response, context)
  }
}

export async function updateStockItem(id: number, data: Partial<StockCreateSchema>) {
  const context = beginApiRequest(new NextRequest('http://localhost'), 'stock')
  const respond = (body: unknown, init?: ResponseInit, extra?: Record<string, unknown>) => {
    const response = NextResponse.json(body, init)
    finishApiRequest(context, response.status, extra)
    return withRequestId(response, context)
  }

  try {
    const access = await getAccessContext()
    if (!access) {
      return respond({ error: "Sessão obrigatória." }, { status: 401 })
    }
    if (!canEditStock(access)) {
      return respond({ error: "Sem permissão para editar stock." }, { status: 403 })
    }

    const existing = await prisma.stock.findUnique({ where: { id } })
    if (!existing) {
      return respond({ error: "Stock não encontrado." }, { status: 404 })
    }

    const payload = normalizeStockPayload({
      ...existing,
      ...data,
      referencia: data.referencia || existing.referencia,
      descricao: data.descricao || existing.descricao,
    })

    const duplicate = await findDuplicateCylinderStock(payload)
    if (duplicate && duplicate.id !== id) {
      return respond(
        {
          error: `Já existe um cilindro com essa referência/número de série no stock (ID ${duplicate.id}).`,
          duplicateId: duplicate.id,
        },
        { status: 409 },
      )
    }

    const updated = await prisma.stock.update({
      where: { id },
      data: payload,
    })

    return respond(updated, undefined, { stockId: updated.id })
  } catch (error) {
    captureApiError(context, error)
    const response = buildDatabaseErrorResponse(error, 'Erro ao atualizar stock')
    finishApiRequest(context, response.status)
    return withRequestId(response, context)
  }
}

export async function deleteStockItem(id: number) {
  const context = beginApiRequest(new NextRequest('http://localhost'), 'stock')
  const respond = (body: unknown, init?: ResponseInit, extra?: Record<string, unknown>) => {
    const response = NextResponse.json(body, init)
    finishApiRequest(context, response.status, extra)
    return withRequestId(response, context)
  }

  try {
    const access = await getAccessContext()
    if (!access) {
      return respond({ error: "Sessão obrigatória." }, { status: 401 })
    }
    if (!canEditStock(access)) {
      return respond({ error: "Sem permissão para editar stock." }, { status: 403 })
    }

    await prisma.stock.delete({ where: { id } })
    return respond({ success: true, count: 1 }, undefined, { deletedId: id })
  } catch (error) {
    captureApiError(context, error)
    const response = buildDatabaseErrorResponse(error, 'Erro ao eliminar stock')
    finishApiRequest(context, response.status)
    return withRequestId(response, context)
  }
}
