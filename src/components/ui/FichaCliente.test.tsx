import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import { FichaCliente } from './FichaCliente';

describe('FichaCliente', () => {
  it('renderiza dados básicos do cliente', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <FichaCliente cliente={{
          nome: 'Cliente A',
          nif: '123456789',
          telefone: '912345678',
          email: 'cliente@teste.com',
          morada: 'Rua Exemplo, 123',
          status: 'Ativo',
        }} />
      </QueryClientProvider>
    );
    expect(screen.getByText('Cliente A')).toBeInTheDocument();
    expect(screen.getByText('123456789')).toBeInTheDocument();
    expect(screen.getByText('912345678')).toBeInTheDocument();
    expect(screen.getByText('cliente@teste.com')).toBeInTheDocument();
    expect(screen.getByText('Rua Exemplo, 123')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });
});
