import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface ItemObra {
  id: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  precoUnitario: number;
  total: number;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
  observacoes?: string;
}

export interface Obra {
  id: string;
  numero: string;
  tipo: 'manutencao' | 'reparo' | 'modernizacao' | 'inspecao';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  equipamentoId: string;
  equipamentoNome: string;
  clienteId: string;
  clienteNome: string;
  tecnico: string;
  descricao: string;
  dataInicio: string;
  dataPrevistaFim: string;
  dataFim?: string;
  status: 'planejada' | 'em_andamento' | 'concluida' | 'cancelada' | 'pausada';
  valorEstimado: number;
  valorReal?: number;
  observacoes?: string;
  itens: ItemObra[];
  faturaId?: string;
  createdAt: string;
  updatedAt: string;
}

export function useObras() {
  // Dados offline com exemplos realistas baseados nos clientes existentes
  const dadosOffline: Obra[] = [
    {
      id: 'obra-001',
      numero: 'OBRA-2026-001',
      tipo: 'manutencao',
      prioridade: 'media',
      equipamentoId: 'cml0u95va000ohz4tagye14y3',
      equipamentoNome: 'Atlantis Explorer',
      clienteId: 'cml0u95rj0000hz4t0wd4hs0u',
      clienteNome: 'Atlantis Azores',
      tecnico: 'Julio Correia',
      descricao: 'Manutenção preventiva anual - Motor Yamaha F200',
      dataInicio: '2026-01-16',
      dataPrevistaFim: '2026-01-18',
      dataFim: '2026-01-17',
      status: 'concluida',
      valorEstimado: 850.00,
      valorReal: 780.00,
      observacoes: 'Manutenção realizada conforme plano. Motor em perfeitas condições.',
      itens: [
        {
          id: 'item-obra-001',
          descricao: 'Troca de óleo e filtros - Motor Yamaha F200',
          quantidade: 1,
          unidade: 'serviço',
          precoUnitario: 150.00,
          total: 150.00,
          status: 'concluido',
          observacoes: 'Óleo sintético 4T'
        },
        {
          id: 'item-obra-002',
          descricao: 'Verificação sistema de refrigeração',
          quantidade: 1,
          unidade: 'serviço',
          precoUnitario: 120.00,
          total: 120.00,
          status: 'concluido',
          observacoes: 'Sistema funcionando perfeitamente'
        },
        {
          id: 'item-obra-003',
          descricao: 'Peças sobressalentes - velas de ignição',
          quantidade: 4,
          unidade: 'unidade',
          precoUnitario: 25.00,
          total: 100.00,
          status: 'concluido',
          observacoes: 'Velas NGK padrão'
        }
      ],
      faturaId: 'FAT-2026-001',
      createdAt: '2026-01-15T15:00:00.000Z',
      updatedAt: '2026-01-17T16:30:00.000Z'
    },
    {
      id: 'obra-002',
      numero: 'OBRA-2026-002',
      tipo: 'reparo',
      prioridade: 'alta',
      equipamentoId: 'navio-4',
      equipamentoNome: 'Flores Mariner',
      clienteId: 'cliente-4',
      clienteNome: 'Pesca Artesanal Flores',
      tecnico: 'Alex Santos',
      descricao: 'Reparo sistema de refrigeração - Urgente',
      dataInicio: '2026-01-12',
      dataPrevistaFim: '2026-01-15',
      dataFim: '2026-01-14',
      status: 'concluida',
      valorEstimado: 1200.00,
      valorReal: 1100.00,
      observacoes: 'Reparo realizado com sucesso. Sistema funcionando normalmente.',
      itens: [
        {
          id: 'item-obra-004',
          descricao: 'Compressor de refrigeração',
          quantidade: 1,
          unidade: 'unidade',
          precoUnitario: 450.00,
          total: 450.00,
          status: 'concluido',
          observacoes: 'Compressor Danfoss 12V'
        },
        {
          id: 'item-obra-005',
          descricao: 'Mão de obra - instalação',
          quantidade: 6,
          unidade: 'hora',
          precoUnitario: 45.00,
          total: 270.00,
          status: 'concluido',
          observacoes: 'Instalação e testes'
        },
        {
          id: 'item-obra-006',
          descricao: 'Tubulação refrigerante',
          quantidade: 5,
          unidade: 'metro',
          precoUnitario: 15.00,
          total: 75.00,
          status: 'concluido',
          observacoes: 'Tubo de cobre 1/4"'
        }
      ],
      faturaId: 'FAT-2026-002',
      createdAt: '2026-01-11T10:00:00.000Z',
      updatedAt: '2026-01-14T14:20:00.000Z'
    },
    {
      id: 'obra-003',
      numero: 'OBRA-2026-003',
      tipo: 'reparo',
      prioridade: 'urgente',
      equipamentoId: 'navio-7',
      equipamentoNome: 'Corvo Navigator',
      clienteId: 'cliente-7',
      clienteNome: 'Corvo Marítimo',
      tecnico: 'Julio Correia',
      descricao: 'Reparo sistema de direção - Leme com folga',
      dataInicio: '2026-01-30',
      dataPrevistaFim: '2026-02-02',
      status: 'em_andamento',
      valorEstimado: 680.00,
      observacoes: 'Reparo urgente identificado na inspeção.',
      itens: [
        {
          id: 'item-obra-007',
          descricao: 'Mancais de leme',
          quantidade: 2,
          unidade: 'unidade',
          precoUnitario: 85.00,
          total: 170.00,
          status: 'em_andamento',
          observacoes: 'Mancais de bronze'
        },
        {
          id: 'item-obra-008',
          descricao: 'Mão de obra - reparo leme',
          quantidade: 8,
          unidade: 'hora',
          precoUnitario: 45.00,
          total: 360.00,
          status: 'pendente',
          observacoes: 'Desmontagem e remontagem'
        }
      ],
      createdAt: '2026-01-29T09:15:00.000Z',
      updatedAt: '2026-01-30T11:00:00.000Z'
    },
    {
      id: 'obra-004',
      numero: 'OBRA-2026-004',
      tipo: 'modernizacao',
      prioridade: 'baixa',
      equipamentoId: 'navio-5',
      equipamentoNome: 'São Jorge Explorer',
      clienteId: 'cliente-5',
      clienteNome: 'Náutica São Jorge',
      tecnico: 'Alex Santos',
      descricao: 'Instalação GPS moderno e atualização equipamentos',
      dataInicio: '2026-02-10',
      dataPrevistaFim: '2026-02-15',
      status: 'planejada',
      valorEstimado: 2500.00,
      observacoes: 'Modernização solicitada pelo cliente para melhorar navegação.',
      itens: [
        {
          id: 'item-obra-009',
          descricao: 'GPS Garmin GPSMAP 8612xsv',
          quantidade: 1,
          unidade: 'unidade',
          precoUnitario: 1800.00,
          total: 1800.00,
          status: 'pendente',
          observacoes: 'GPS touchscreen 12"'
        },
        {
          id: 'item-obra-010',
          descricao: 'Instalação e configuração',
          quantidade: 1,
          unidade: 'serviço',
          precoUnitario: 400.00,
          total: 400.00,
          status: 'pendente',
          observacoes: 'Integração com sistema existente'
        }
      ],
      createdAt: '2026-01-25T14:30:00.000Z',
      updatedAt: '2026-01-25T14:30:00.000Z'
    },
    {
      id: 'obra-005',
      numero: 'OBRA-2026-005',
      tipo: 'manutencao',
      prioridade: 'media',
      equipamentoId: 'navio-6',
      equipamentoNome: 'Graciosa Spirit',
      clienteId: 'cliente-6',
      clienteNome: 'Ilha Verde Turismo',
      tecnico: 'Julio Correia',
      descricao: 'Manutenção sistema elétrico e baterias',
      dataInicio: '2026-01-25',
      dataPrevistaFim: '2026-01-27',
      dataFim: '2026-01-26',
      status: 'concluida',
      valorEstimado: 320.00,
      valorReal: 295.00,
      observacoes: 'Manutenção preventiva realizada com sucesso.',
      itens: [
        {
          id: 'item-obra-011',
          descricao: 'Baterias marinhas 12V',
          quantidade: 2,
          unidade: 'unidade',
          precoUnitario: 85.00,
          total: 170.00,
          status: 'concluido',
          observacoes: 'Baterias AGM 100Ah'
        },
        {
          id: 'item-obra-012',
          descricao: 'Verificação sistema elétrico',
          quantidade: 1,
          unidade: 'serviço',
          precoUnitario: 95.00,
          total: 95.00,
          status: 'concluido',
          observacoes: 'Testes de continuidade e tensão'
        }
      ],
      faturaId: 'FAT-2026-003',
      createdAt: '2026-01-24T10:45:00.000Z',
      updatedAt: '2026-01-26T15:20:00.000Z'
    },
    {
      id: 'obra-006',
      numero: 'OBRA-2026-006',
      tipo: 'inspecao',
      prioridade: 'media',
      equipamentoId: 'cml0u95wm000whz4t93b0w07v',
      equipamentoNome: 'Jangada São Miguel I',
      clienteId: 'cml0u95rj0000hz4t0wd4hs0u',
      clienteNome: 'Atlantis Azores',
      tecnico: 'Alex Santos',
      descricao: 'Instalação coletes salva-vidas adicionais',
      dataInicio: '2026-01-22',
      dataPrevistaFim: '2026-01-23',
      dataFim: '2026-01-22',
      status: 'concluida',
      valorEstimado: 180.00,
      valorReal: 165.00,
      observacoes: 'Equipamentos de segurança instalados conforme recomendação da inspeção.',
      itens: [
        {
          id: 'item-obra-013',
          descricao: 'Coletes salva-vidas adultos',
          quantidade: 3,
          unidade: 'unidade',
          precoUnitario: 35.00,
          total: 105.00,
          status: 'concluido',
          observacoes: 'Coletes com dispositivo luminoso'
        },
        {
          id: 'item-obra-014',
          descricao: 'Instalação equipamentos',
          quantidade: 1,
          unidade: 'serviço',
          precoUnitario: 60.00,
          total: 60.00,
          status: 'concluido',
          observacoes: 'Fixação e testes'
        }
      ],
      faturaId: 'FAT-2026-004',
      createdAt: '2026-01-21T13:00:00.000Z',
      updatedAt: '2026-01-22T16:45:00.000Z'
    },
    {
      id: 'obra-007',
      numero: 'OBRA-2026-007',
      tipo: 'manutencao',
      prioridade: 'baixa',
      equipamentoId: 'navio-9',
      equipamentoNome: 'Faial Cruiser',
      clienteId: 'cliente-9',
      clienteNome: 'Faial Náutica',
      tecnico: 'Julio Correia',
      descricao: 'Limpeza e polimento casco',
      dataInicio: '2026-02-05',
      dataPrevistaFim: '2026-02-07',
      status: 'planejada',
      valorEstimado: 450.00,
      observacoes: 'Manutenção estética e proteção do casco.',
      itens: [
        {
          id: 'item-obra-015',
          descricao: 'Produtos limpeza casco',
          quantidade: 1,
          unidade: 'kit',
          precoUnitario: 120.00,
          total: 120.00,
          status: 'pendente',
          observacoes: 'Kit completo para fibra de vidro'
        },
        {
          id: 'item-obra-016',
          descricao: 'Mão de obra - limpeza e polimento',
          quantidade: 12,
          unidade: 'hora',
          precoUnitario: 27.50,
          total: 330.00,
          status: 'pendente',
          observacoes: 'Inclui aplicação de cera protetora'
        }
      ],
      createdAt: '2026-01-28T11:30:00.000Z',
      updatedAt: '2026-01-28T11:30:00.000Z'
    },
    {
      id: 'obra-008',
      numero: 'OBRA-2026-008',
      tipo: 'reparo',
      prioridade: 'media',
      equipamentoId: 'navio-2',
      equipamentoNome: 'Ocean Voyager',
      clienteId: 'cliente-2',
      clienteNome: 'Ocean Tours Açores',
      tecnico: 'Alex Santos',
      descricao: 'Reparo sistema elétrico - Fusíveis queimados',
      dataInicio: '2026-01-28',
      dataPrevistaFim: '2026-01-30',
      status: 'em_andamento',
      valorEstimado: 220.00,
      observacoes: 'Problema identificado durante inspeção elétrica.',
      itens: [
        {
          id: 'item-obra-017',
          descricao: 'Fusíveis marítimos',
          quantidade: 6,
          unidade: 'unidade',
          precoUnitario: 8.50,
          total: 51.00,
          status: 'concluido',
          observacoes: 'Fusíveis de 10A e 15A'
        },
        {
          id: 'item-obra-018',
          descricao: 'Reparo fiação danificada',
          quantidade: 3,
          unidade: 'metro',
          precoUnitario: 12.00,
          total: 36.00,
          status: 'em_andamento',
          observacoes: 'Cabo marítimo 2.5mm'
        }
      ],
      createdAt: '2026-01-27T09:00:00.000Z',
      updatedAt: '2026-01-28T14:15:00.000Z'
    },
    {
      id: 'obra-009',
      numero: 'OBRA-2026-009',
      tipo: 'modernizacao',
      prioridade: 'baixa',
      equipamentoId: 'navio-10',
      equipamentoNome: 'Santa Maria Yacht',
      clienteId: 'cliente-10',
      clienteNome: 'Santa Maria Yacht Club',
      tecnico: 'Julio Correia',
      descricao: 'Instalação sistema de som premium',
      dataInicio: '2026-02-15',
      dataPrevistaFim: '2026-02-20',
      status: 'planejada',
      valorEstimado: 1800.00,
      observacoes: 'Modernização solicitada para melhorar experiência dos passageiros.',
      itens: [
        {
          id: 'item-obra-019',
          descricao: 'Sistema de som Fusion MS-RA70N',
          quantidade: 1,
          unidade: 'unidade',
          precoUnitario: 1200.00,
          total: 1200.00,
          status: 'pendente',
          observacoes: 'Rádio VHF/AIS com Bluetooth'
        },
        {
          id: 'item-obra-020',
          descricao: 'Alto-falantes marítimos',
          quantidade: 4,
          unidade: 'unidade',
          precoUnitario: 85.00,
          total: 340.00,
          status: 'pendente',
          observacoes: 'Alto-falantes resistentes à água'
        }
      ],
      createdAt: '2026-01-30T10:00:00.000Z',
      updatedAt: '2026-01-30T10:00:00.000Z'
    },
    {
      id: 'obra-010',
      numero: 'OBRA-2026-010',
      tipo: 'manutencao',
      prioridade: 'media',
      equipamentoId: 'navio-3',
      equipamentoNome: 'Terceira Star',
      clienteId: 'cliente-3',
      clienteNome: 'Marítima Terceira',
      tecnico: 'Alex Santos',
      descricao: 'Revisão completa motores e sistemas',
      dataInicio: '2026-02-03',
      dataPrevistaFim: '2026-02-08',
      status: 'planejada',
      valorEstimado: 950.00,
      observacoes: 'Manutenção preventiva antes da temporada de pesca.',
      itens: [
        {
          id: 'item-obra-021',
          descricao: 'Kit manutenção motor Mercury',
          quantidade: 1,
          unidade: 'kit',
          precoUnitario: 280.00,
          total: 280.00,
          status: 'pendente',
          observacoes: 'Óleo, filtros e velas'
        },
        {
          id: 'item-obra-022',
          descricao: 'Verificação sistemas auxiliares',
          quantidade: 1,
          unidade: 'serviço',
          precoUnitario: 180.00,
          total: 180.00,
          status: 'pendente',
          observacoes: 'Bombas, refrigeração, elétrica'
        }
      ],
      createdAt: '2026-01-29T16:20:00.000Z',
      updatedAt: '2026-01-29T16:20:00.000Z'
    }
  ];

  return useQuery({
    queryKey: ['obras'],
    queryFn: async (): Promise<Obra[]> => {
      return dadosOffline;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
}

export function useObra(id: string) {
  return useQuery({
    queryKey: ['obras', id],
    queryFn: async (): Promise<Obra | null> => {
      const obras = await useObras().queryFn();
      return obras.find(o => o.id === id) || null;
    },
    enabled: !!id,
  });
}

export function useCreateObra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Obra, 'id' | 'createdAt' | 'updatedAt'>): Promise<Obra> => {
      const newObra: Obra = {
        ...data,
        id: `obra-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newObra;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      toast.success('Obra criada com sucesso!');
    },
  });
}

export function useUpdateObra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Obra> }): Promise<Obra> => {
      // Simulação de atualização
      return { ...data, id, updatedAt: new Date().toISOString() } as Obra;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] });
      toast.success('Obra atualizada com sucesso!');
    },
  });
}
