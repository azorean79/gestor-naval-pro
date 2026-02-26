import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddClienteForm } from './add-cliente-form';

describe('AddClienteForm', () => {
  it('renderiza campos básicos do formulário', async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AddClienteForm />
      </QueryClientProvider>
    );
    // O formulário só aparece após clicar no botão
    const openButton = screen.getByRole('button', { name: /adicionar cliente/i });
    await userEvent.click(openButton);
    expect(await screen.findByLabelText(/nome completo/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/telefone/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/email/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /criar cliente/i })).toBeInTheDocument();
  });
});
