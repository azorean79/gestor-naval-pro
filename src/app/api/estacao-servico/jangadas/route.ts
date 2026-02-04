import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // For now, return mock data - this would normally come from database
    // Filter jangadas where status is NOT "Instalado"
    const jangadas = [
      {
        id: 'jangada-1',
        numeroSerie: 'JL-2024-001',
        modelo: 'Liferaft 25P',
        marca: 'Viking',
        status: 'Aguardando Inspeção',
        localizacaoAtual: 'Estação de Serviço - Cabouco',
        dataUltimaInspecao: '2024-01-15',
        proximaInspecao: '2024-07-15',
        navioInstalado: null,
        cliente: 'Transportes Açores'
      },
      {
        id: 'jangada-2',
        numeroSerie: 'JL-2024-002',
        modelo: 'Liferaft 15P',
        marca: 'RFD',
        status: 'Em Manutenção',
        localizacaoAtual: 'Estação de Serviço - Cabouco',
        dataUltimaInspecao: '2024-01-10',
        proximaInspecao: '2024-07-10',
        navioInstalado: null,
        cliente: 'Naviera Açor'
      },
      {
        id: 'jangada-3',
        numeroSerie: 'JL-2024-003',
        modelo: 'Liferaft 20P',
        marca: 'Viking',
        status: 'Defeituoso',
        localizacaoAtual: 'Estação de Serviço - Cabouco',
        dataUltimaInspecao: '2024-01-08',
        proximaInspecao: '2024-07-08',
        navioInstalado: null,
        cliente: 'Atlantic Lines'
      },
      {
        id: 'jangada-4',
        numeroSerie: 'JL-2024-004',
        modelo: 'Liferaft 25P',
        marca: 'Schrader',
        status: 'Aguardando Inspeção',
        localizacaoAtual: 'Estação de Serviço - Cabouco',
        dataUltimaInspecao: '2024-01-12',
        proximaInspecao: '2024-07-12',
        navioInstalado: null,
        cliente: 'Portos dos Açores'
      },
      {
        id: 'jangada-5',
        numeroSerie: 'JL-2024-005',
        modelo: 'Liferaft 12P',
        marca: 'RFD',
        status: 'Em Manutenção',
        localizacaoAtual: 'Estação de Serviço - Cabouco',
        dataUltimaInspecao: '2024-01-05',
        proximaInspecao: '2024-07-05',
        navioInstalado: null,
        cliente: 'Frota Açoriana'
      },
      {
        id: 'jangada-6',
        numeroSerie: 'JL-2024-006',
        modelo: 'Liferaft 30P',
        marca: 'Viking',
        status: 'Aguardando Inspeção',
        localizacaoAtual: 'Estação de Serviço - Cabouco',
        dataUltimaInspecao: '2024-01-18',
        proximaInspecao: '2024-07-18',
        navioInstalado: null,
        cliente: 'Marítima Açores'
      }
    ];

    return NextResponse.json(jangadas);
  } catch (error) {
    console.error('Erro ao carregar jangadas da estação de serviço:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar jangadas da estação de serviço' },
      { status: 500 }
    );
  }
}