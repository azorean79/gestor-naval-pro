// src/app/api/seed/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Dados de teste simples para seed
const clientesTeste = [
  {
    nome: 'Cliente Teste 1',
    email: 'teste1@email.com',
    telefone: '+351 123 456 789',
    nif: '123456789',
    tipo: 'empresa',
    status: 'ativo',
    empresa: 'Empresa Teste 1',
    observacoes: 'Cliente de teste',
  },
  {
    nome: 'Cliente Teste 2',
    email: 'teste2@email.com',
    telefone: '+351 987 654 321',
    nif: '987654321',
    tipo: 'individual',
    status: 'ativo',
    profissao: 'Testador',
    observacoes: 'Cliente individual de teste',
  }
];

const naviosTeste = [
  {
    nome: 'Navio Teste 1',
    imo: 'IMO9999991',
    tipo: 'Barco de Turismo',
    bandeira: 'Portugal',
    status: 'ativo',
    observacoes: 'Navio de teste',
  },
  {
    nome: 'Navio Teste 2',
    imo: 'IMO9999992',
    tipo: 'Navio de Pesca',
    bandeira: 'Portugal',
    status: 'ativo',
    observacoes: 'Navio de pesca de teste',
  }
];

export async function POST() {
  try {
    console.log('🚀 Iniciando seed via API...');

    // Seed de clientes
    console.log('📝 Inserindo clientes de teste...');
    const clientesCriados = [];
    for (const cliente of clientesTeste) {
      const clienteCriado = await prisma.cliente.create({
        data: cliente as any,
      });
      clientesCriados.push(clienteCriado);
    }

    // Seed de navios
    console.log('🚢 Inserindo navios de teste...');
    const naviosCriados = [];
    for (const navio of naviosTeste) {
      const navioCriado = await prisma.navio.create({
        data: navio as any,
      });
      naviosCriados.push(navioCriado);
    }

    return NextResponse.json({
      success: true,
      message: 'Seed executado com sucesso',
      data: {
        clientes: clientesCriados.length,
        navios: naviosCriados.length,
      }
    });

  } catch (error) {
    console.error('❌ Erro no seed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Verificar status do banco
    const [clientesCount, naviosCount] = await Promise.all([
      prisma.cliente.count(),
      prisma.navio.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        clientes: clientesCount,
        navios: naviosCount,
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}