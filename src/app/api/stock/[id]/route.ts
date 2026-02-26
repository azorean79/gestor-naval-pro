// src/app/api/stock/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/stock/[id] - Buscar item de stock por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const item = await prisma.itemStock.findUnique({
      where: { id },
      include: {
        movimentacoes: true,
        itensOrdemServico: true,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item de stock não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Erro ao buscar item de stock:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/stock/[id] - Atualizar item de stock
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log('API PUT /api/stock/' + id + ' body:', JSON.stringify(body));

    // Verificar se o item existe
    const existingItem = await prisma.itemStock.findUnique({
      where: { id }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item de stock não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o novo nome já existe (se foi alterado)
    if (body.nome && body.nome !== existingItem.nome) {
      const nomeExists = await prisma.itemStock.findFirst({
        where: { nome: body.nome }
      });

      if (nomeExists) {
        return NextResponse.json(
          { error: 'Já existe um item com este nome' },
          { status: 400 }
        );
      }
    }

    const item = await prisma.itemStock.update({
      where: { id },
      data: {
        nome: body.nome,
        descricao: body.descricao,
        categoria: body.categoria,
        quantidadeAtual: body.quantidadeAtual,
        quantidadeMinima: body.quantidadeMinima,
        unidade: body.unidade,
        precoUnitario: body.precoUnitario,
        precoCompra: body.precoCompra,
        precoVenda: body.precoVenda,
        codigo: body.codigo,
        codigoFabricante: body.codigoFabricante,
        lote: body.lote,
        dataValidade: body.dataValidade ? new Date(body.dataValidade) : undefined,
        localizacao: body.localizacao,
        status: body.status,
        observacoes: body.observacoes,
        fornecedor: body.fornecedor,
      },
      include: {
        movimentacoes: true,
        itensOrdemServico: true,
      },
    });

    // handle base64 image upload (optional)
    if (body.imagemBase64) {
      try {
        const matches = body.imagemBase64.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          const buffer = Buffer.from(matches[2], 'base64');
          const fs = await import('fs');
          const path = await import('path');
          const uploadDir = path.join(process.cwd(), 'public', 'uploads');
          await fs.promises.mkdir(uploadDir, { recursive: true });
          const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.png`;
          const filepath = path.join(uploadDir, filename);
          await fs.promises.writeFile(filepath, buffer);
          // update item imagem path
          await prisma.itemStock.update({ where: { id }, data: { imagem: `/uploads/${filename}` } });
          item.imagem = `/uploads/${filename}`;
        }
      } catch (e) {
        console.error('Erro ao salvar imagem:', e);
      }
    }

    // If numeroSerieJangada was provided, upsert a Cilindro record and ensure installed state on ItemStock
    if (body.numeroSerieJangada) {
      try {
        // Persist cilindro data safely into Cilindro model (only provided fields)
        const cilCreate: any = { numeroSerie: body.numeroSerieJangada };
        const cilUpdate: any = {};
        if (body.pesoBruto !== undefined) { cilCreate.pesoBruto = body.pesoBruto; cilUpdate.pesoBruto = body.pesoBruto; }
        if (body.tara !== undefined) { cilCreate.tara = body.tara; cilUpdate.tara = body.tara; }
        if (body.quantidadeCO2 !== undefined) { cilCreate.quantidadeCO2 = body.quantidadeCO2; cilUpdate.quantidadeCO2 = body.quantidadeCO2; }
        if (body.quantidadeN2 !== undefined) { cilCreate.quantidadeN2 = body.quantidadeN2; cilUpdate.quantidadeN2 = body.quantidadeN2; }
        if (body.testeHidraulico) { cilCreate.testeHidraulico = new Date(body.testeHidraulico); cilUpdate.testeHidraulico = new Date(body.testeHidraulico); }
        if (body.proximoTesteHidraulico) { cilCreate.proximoTesteHidraulico = new Date(body.proximoTesteHidraulico); cilUpdate.proximoTesteHidraulico = new Date(body.proximoTesteHidraulico); }
        if (body.tipoSistemaInsuflacao !== undefined) { cilCreate.tipoSistemaInsuflacao = body.tipoSistemaInsuflacao; cilUpdate.tipoSistemaInsuflacao = body.tipoSistemaInsuflacao; }
        if (body.localizacao !== undefined) { cilCreate.localizacao = body.localizacao; cilUpdate.localizacao = body.localizacao; }
        if (body.observacoes !== undefined) { cilCreate.observacoes = body.observacoes; cilUpdate.observacoes = body.observacoes; }

        try {
          await prisma.cilindro.upsert({
            where: { numeroSerie: body.numeroSerieJangada },
            create: cilCreate,
            update: cilUpdate,
          });
        } catch (cilErr) {
          console.warn('Upsert cilindro falhou (continuando):', cilErr?.message || cilErr);
        }

        const installedLocation = body.localizacao || `Instalado na Jangada ${body.numeroSerieJangada}`;
        await prisma.itemStock.update({ where: { id }, data: { localizacao: installedLocation, quantidadeAtual: 1 } });
        const refreshed = await prisma.itemStock.findUnique({ where: { id }, include: { movimentacoes: true, itensOrdemServico: true } });
        return NextResponse.json(refreshed);
      } catch (e) {
        console.error('Erro ao aplicar estado instalado:', e);
      }
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Erro ao atualizar item de stock:', error);
    return NextResponse.json(
      { error: (error && (error as any).message) ? (error as any).message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/stock/[id] - Deletar item de stock
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se o item existe
    const item = await prisma.itemStock.findUnique({
      where: { id }
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item de stock não encontrado' },
        { status: 404 }
      );
    }

    await prisma.itemStock.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Item de stock deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar item de stock:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}