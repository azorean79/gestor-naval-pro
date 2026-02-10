import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNavioFolder, createNavioCertificate } from '@/lib/onedrive';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const tipo = searchParams.get('tipo');
    const clienteId = searchParams.get('clienteId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000');
    const tecnico = searchParams.get('tecnico');

    const where: any = {};

    if (tecnico) {
      where.tecnico = tecnico;
    }

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { matricula: { contains: search, mode: 'insensitive' } },
        { tipo: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (clienteId) {
      where.clienteId = clienteId;
    }

    const total = await prisma.navio.count({ 
      where
    });

    const navios = await prisma.navio.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        cliente: true,
        proprietario: true,
      }
    });

    return NextResponse.json({
      data: navios,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error('Erro ao buscar navios:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const navio = await prisma.navio.create({
      data: {
        nome: data.nome,
        tipo: data.tipo,
        matricula: data.matricula,
        imo: data.imo,
        mmsi: data.mmsi,
        callSign: data.callSign,
        bandeira: data.bandeira,
        comprimento: data.comprimento,
        largura: data.largura,
        calado: data.calado,
        capacidade: data.capacidade,
        status: data.status || 'ativo',
        dataInspecao: data.dataInspecao ? new Date(data.dataInspecao) : null,
        dataProximaInspecao: data.dataProximaInspecao ? new Date(data.dataProximaInspecao) : null,
        clienteId: data.clienteId,
        proprietarioId: data.proprietarioId,
        delegacao: data.delegacao || 'Açores',
        tecnico: data.tecnico,
      },
      include: {
        cliente: true,
        proprietario: true,
      },
    });

    // Create OneDrive folder structure
    try {
      const folderId = await createNavioFolder(navio.nome);
      console.log(`Pasta criada no OneDrive para o navio ${navio.nome}: ${folderId}`);

      // Create certificate file
      try {
        const certificateFile = await createNavioCertificate(navio.nome, {
          matricula: navio.matricula || 'N/A',
          tipo: navio.tipo,
          clienteNome: navio.cliente?.nome,
          dataInspecao: navio.dataInspecao,
          dataProximaInspecao: navio.dataProximaInspecao,
        });
        console.log(`Certificado criado no OneDrive para o navio ${navio.nome}: ${certificateFile}`);
      } catch (certificateError) {
        console.error('Erro ao criar certificado no OneDrive:', certificateError);
        // Don't fail if certificate creation fails
      }
    } catch (onedriveError) {
      console.error('Erro ao criar pasta no OneDrive:', onedriveError);
      // Don't fail the navio creation if OneDrive fails
    }

    return NextResponse.json(navio);

  } catch (error) {
    console.error('Erro ao criar navio:', error);
    
    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Já existe um navio com esta matrícula' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Erro ao criar navio' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}