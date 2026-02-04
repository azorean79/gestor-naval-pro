import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Return mock data for now - this would normally come from database
    const portos = [
      {
        id: 'porto-sao-miguel-1',
        nome: 'Porto de Ponta Delgada',
        pais: 'Portugal - Açores (São Miguel)',
        localizacao: { latitude: 37.7412, longitude: -25.6687 },
        tipoFacilidades: ['Reparações', 'Abastecimento', 'Inspeção', 'Contentores', 'Cruzeiros'],
        capacidade: 'Grande',
        telefone: '+351-296-301-000'
      },
      {
        id: 'porto-sao-miguel-2',
        nome: 'Porto da Ribeira Quente',
        pais: 'Portugal - Açores (São Miguel)',
        localizacao: { latitude: 37.7333, longitude: -25.3167 },
        tipoFacilidades: ['Marina', 'Abastecimento', 'Inspeção', 'Turismo'],
        capacidade: 'Pequeno',
        telefone: '+351-296-549-000'
      },
      {
        id: 'porto-sao-miguel-4',
        nome: 'Porto Formoso',
        pais: 'Portugal - Açores (São Miguel)',
        localizacao: { latitude: 37.8333, longitude: -25.4333 },
        tipoFacilidades: ['Pesca', 'Abastecimento', 'Marina'],
        capacidade: 'Pequeno',
        telefone: '+351-296-442-000'
      },
      {
        id: 'porto-sao-miguel-5',
        nome: 'Rabo de Peixe',
        pais: 'Portugal - Açores (São Miguel)',
        localizacao: { latitude: 37.8, longitude: -25.5833 },
        tipoFacilidades: ['Pesca', 'Abastecimento', 'Reparações'],
        capacidade: 'Médio',
        telefone: '+351-296-498-000'
      },
      {
        id: 'porto-sao-miguel-6',
        nome: 'Maia',
        pais: 'Portugal - Açores (São Miguel)',
        localizacao: { latitude: 37.8167, longitude: -25.3667 },
        tipoFacilidades: ['Pesca', 'Marina'],
        capacidade: 'Pequeno',
        telefone: '+351-296-443-000'
      },
      {
        id: 'porto-sao-miguel-7',
        nome: 'Povoação',
        pais: 'Portugal - Açores (São Miguel)',
        localizacao: { latitude: 37.75, longitude: -25.2333 },
        tipoFacilidades: ['Pesca', 'Abastecimento', 'Histórico'],
        capacidade: 'Pequeno',
        telefone: '+351-296-550-000'
      },
      {
        id: 'porto-sao-miguel-3',
        nome: 'Porto de Vila Franca do Campo',
        pais: 'Portugal - Açores (São Miguel)',
        localizacao: { latitude: 37.7167, longitude: -25.4333 },
        tipoFacilidades: ['Abastecimento', 'Inspeção', 'Histórico'],
        capacidade: 'Médio',
        telefone: '+351-296-539-000'
      },
      {
        id: 'estacao-servico-1',
        nome: 'Estação de Serviço - Cabouco',
        pais: 'Portugal - Açores (São Miguel)',
        localizacao: { latitude: 37.7500, longitude: -25.6000 }, // Coordenadas aproximadas para Cabouco
        tipoFacilidades: ['Manutenção Jangadas', 'Inspeção', 'Reparações', 'Armazenamento', 'Testes'],
        capacidade: 'Especializada',
        telefone: '+351-296-XXX-XXX'
      }
    ];

    return NextResponse.json(portos);
  } catch (error) {
    console.error('Erro ao carregar portos:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar portos' },
      { status: 500 }
    );
  }
}
