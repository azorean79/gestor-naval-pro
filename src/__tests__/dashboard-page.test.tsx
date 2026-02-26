import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '@/app/dashboard/page';

import * as hookModule from '@/hooks/use-dados-cruzados';

describe('DashboardPage', () => {
  afterEach(() => jest.restoreAllMocks());

  it('renderiza os dados principais do dashboard', () => {
    jest.spyOn(hookModule, 'useDadosCruzados').mockReturnValue({
      data: {
        jangadas: { total: 10, ativas: 7, manutencao: 2, expirando: 1 },
        navios: { total: 5 },
        clientes: { total: 20 },
        cilindros: { total: 30 },
        agendamentos: { total: 3 },
        certificados: { total: 8 },
        alertas: { total: 2 },
        stock: { valorTotal: 10000, itensBaixo: 2 },
        agenda: { hoje: 1, semana: 2, mes: 3 },
      },
      isLoading: false,
      error: null,
    });
    render(<DashboardPage />);
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Jangadas/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Navios/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Clientes/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Cilindros/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Agendamentos|Agenda/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Alertas/i).length).toBeGreaterThan(0);
    expect(screen.getByText('10')).toBeInTheDocument(); // total jangadas
    expect(screen.getByText('5')).toBeInTheDocument(); // total navios
    expect(screen.getByText('20')).toBeInTheDocument(); // total clientes
    expect(screen.getByText('30')).toBeInTheDocument(); // total cilindros
  });

  it('exibe mensagem de carregando', () => {
    jest.spyOn(hookModule, 'useDadosCruzados').mockReturnValue({ data: null, isLoading: true, error: null });
    render(<DashboardPage />);
    expect(screen.getByText(/Carregando dados do dashboard/)).toBeInTheDocument();
  });

  it('exibe mensagem de erro', () => {
    jest.spyOn(hookModule, 'useDadosCruzados').mockReturnValue({ data: null, isLoading: false, error: true });
    render(<DashboardPage />);
    expect(screen.getByText(/Erro ao carregar dados do dashboard/)).toBeInTheDocument();
  });
});
