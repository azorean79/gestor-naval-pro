import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddNavioForm } from './add-navio-form';

describe('AddNavioForm', () => {
  it('renderiza campos básicos do formulário', async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AddNavioForm />
      </QueryClientProvider>
    );
    const openButton = screen.getByRole('button', { name: /adicionar navio/i });
    await userEvent.click(openButton);
    expect(await screen.findByLabelText(/nome/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/tipo/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/bandeira/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /criar navio/i })).toBeInTheDocument();
  });
});
