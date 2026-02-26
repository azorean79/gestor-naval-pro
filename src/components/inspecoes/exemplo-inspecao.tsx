import React from 'react';
import { QuadroInspecao, ItemChecklist } from './quadro-inspecao';

// Exemplo de uso do componente QuadroInspecao
export function ExemploInspecaoDashboard() {
  // Dados de exemplo realistas para uma inspeção
  const dadosInspecao = {
    inspecaoId: 'INSP-2024-001',
    equipamentoNome: 'Yacht Atlantis Explorer',
    clienteNome: 'Atlantis Azores',
    tipoInspecao: 'anual' as const,
    tecnico: 'João Silva',
    dataInspecao: '2024-01-15T10:00:00Z'
  };

  // Função para salvar a inspeção
  const handleSalvarInspecao = (checklist: ItemChecklist[]) => {
    console.log('Salvando inspeção:', {
      ...dadosInspecao,
      checklist,
      dataSalvamento: new Date().toISOString()
    });

    // Aqui você implementaria a lógica para salvar no banco de dados
    // Por exemplo: await salvarInspecaoAPI(dadosInspecao, checklist);
  };

  return (
    <div className="container mx-auto p-6">
      <QuadroInspecao
        {...dadosInspecao}
        onSalvar={handleSalvarInspecao}
      />
    </div>
  );
}

// Exemplo com dados de uma jangada de pesca
export function ExemploInspecaoJangada() {
  const dadosInspecao = {
    inspecaoId: 'INSP-2024-002',
    equipamentoNome: 'Jangada Tradicional Açoriana',
    clienteNome: 'Ocean Tours Açores',
    tipoInspecao: 'extraordinaria' as const,
    tecnico: 'Maria Santos',
    dataInspecao: '2024-01-16T14:30:00Z'
  };

  const handleSalvarInspecao = (checklist: ItemChecklist[]) => {
    console.log('Salvando inspeção de jangada:', {
      ...dadosInspecao,
      checklist
    });
  };

  return (
    <div className="container mx-auto p-6">
      <QuadroInspecao
        {...dadosInspecao}
        onSalvar={handleSalvarInspecao}
      />
    </div>
  );
}

// Exemplo com checklist parcialmente preenchido (edição)
export function ExemploInspecaoEdicao() {
  const dadosInspecao = {
    inspecaoId: 'INSP-2024-003',
    equipamentoNome: 'Navio de Passeio São Jorge',
    clienteNome: 'Atlantis Azores',
    tipoInspecao: 'inicial' as const,
    tecnico: 'Carlos Pereira',
    dataInspecao: '2024-01-17T09:00:00Z'
  };

  // Checklist com alguns itens já preenchidos
  const checklistInicial: ItemChecklist[] = [
    {
      id: 'doc-1',
      categoria: 'Documentação',
      item: 'Certificado de Segurança',
      descricao: 'Verificar validade do certificado de segurança da embarcação',
      status: 'aprovado',
      observacoes: 'Certificado válido até 2025-03-15',
      testes: [
        {
          id: 'teste-doc-1',
          nome: 'Validade Certificado',
          descricao: 'Verificar se o certificado está dentro do prazo de validade',
          valorEsperado: 'Válido',
          status: 'passou',
          valorObtido: 'Válido até 2025-03-15'
        }
      ]
    },
    {
      id: 'motor-1',
      categoria: 'Sistema de Motor',
      item: 'Verificação Geral do Motor',
      descricao: 'Inspeção visual geral do motor e componentes',
      status: 'reprovado',
      observacoes: 'Motor Yamaha 200HP apresenta vazamento de óleo',
      testes: [
        {
          id: 'teste-motor-1',
          nome: 'Temperatura Óleo',
          descricao: 'Medir temperatura do óleo do motor',
          valorEsperado: '< 100',
          unidade: '°C',
          status: 'passou',
          valorObtido: '85'
        },
        {
          id: 'teste-motor-2',
          nome: 'Pressão Óleo',
          descricao: 'Verificar pressão do óleo',
          valorEsperado: '3.5 - 4.5',
          unidade: 'bar',
          status: 'falhou',
          valorObtido: '2.8',
          observacoes: 'Pressão abaixo do mínimo - possível vazamento'
        }
      ]
    }
  ];

  const handleSalvarInspecao = (checklist: ItemChecklist[]) => {
    console.log('Atualizando inspeção:', {
      ...dadosInspecao,
      checklist
    });
  };

  return (
    <div className="container mx-auto p-6">
      <QuadroInspecao
        {...dadosInspecao}
        onSalvar={handleSalvarInspecao}
        checklistInicial={checklistInicial}
      />
    </div>
  );
}