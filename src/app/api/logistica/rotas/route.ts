import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Return mock data for now - this would normally come from database
    const rotas = [
      {
        id: 'rota-jangada-1',
        nome: 'Ponta Delgada → Estação de Serviço',
        origem: 'Porto de Ponta Delgada',
        destino: 'Estação de Serviço - Cabouco',
        distancia: 8,
        tempoEstimado: 0.5,
        status: 'Ativa',
        ultimoTransporte: '2024-01-15',
        naveAtual: 'Jangada Transport 01',
        metodoTransporte: 'transitario',
        transitario: 'Transportes Açores Lda',
        dataChegadaEstacao: '2024-01-16',
        dataPrevistaEnvio: '2024-01-15'
      },
      {
        id: 'rota-jangada-2',
        nome: 'Estação de Serviço → Ponta Delgada',
        origem: 'Estação de Serviço - Cabouco',
        destino: 'Porto de Ponta Delgada',
        distancia: 8,
        tempoEstimado: 0.5,
        status: 'Ativa',
        ultimoTransporte: '2024-01-16',
        naveAtual: 'Jangada Transport 02',
        metodoTransporte: 'empresa',
        dataChegadaEstacao: null,
        dataPrevistaEnvio: null
      },
      {
        id: 'rota-jangada-3',
        nome: 'Furnas → Estação de Serviço',
        origem: 'Porto de Furnas',
        destino: 'Estação de Serviço - Cabouco',
        distancia: 12,
        tempoEstimado: 0.8,
        status: 'Ativa',
        ultimoTransporte: '2024-01-17',
        naveAtual: 'Jangada Transport 03',
        metodoTransporte: 'cliente',
        dataChegadaEstacao: null,
        dataPrevistaEnvio: null
      },
      {
        id: 'rota-jangada-4',
        nome: 'Estação de Serviço → Furnas',
        origem: 'Estação de Serviço - Cabouco',
        destino: 'Porto de Furnas',
        distancia: 12,
        tempoEstimado: 0.8,
        status: 'Ativa',
        ultimoTransporte: '2024-01-18',
        naveAtual: 'Jangada Transport 04',
        metodoTransporte: 'transitario',
        transitario: 'Marítima Express',
        dataChegadaEstacao: '2024-01-19',
        dataPrevistaEnvio: '2024-01-18'
      },
      {
        id: 'rota-jangada-5',
        nome: 'Vila Franca do Campo → Estação de Serviço',
        origem: 'Porto de Vila Franca do Campo',
        destino: 'Estação de Serviço - Cabouco',
        distancia: 6,
        tempoEstimado: 0.4,
        status: 'Ativa',
        ultimoTransporte: '2024-01-19',
        naveAtual: 'Jangada Transport 05',
        metodoTransporte: 'empresa',
        dataChegadaEstacao: null,
        dataPrevistaEnvio: null
      },
      {
        id: 'rota-jangada-6',
        nome: 'Estação de Serviço → Vila Franca do Campo',
        origem: 'Estação de Serviço - Cabouco',
        destino: 'Porto de Vila Franca do Campo',
        distancia: 6,
        tempoEstimado: 0.4,
        status: 'Manutenção',
        ultimoTransporte: '2024-01-10',
        naveAtual: '-',
        metodoTransporte: 'transitario',
        transitario: 'Açores Logistics',
        dataChegadaEstacao: '2024-01-11',
        dataPrevistaEnvio: '2024-01-10'
      }
    ];

    return NextResponse.json(rotas);
  } catch (error) {
    console.error('Erro ao carregar rotas:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar rotas' },
      { status: 500 }
    );
  }
}
