import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddCilindroForm } from './add-cilindro-form';

describe('AddCilindroForm', () => {
  it('renderiza campos básicos do formulário', async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AddCilindroForm />
      </QueryClientProvider>
    );
    const openButton = screen.getByRole('button', { name: /adicionar cilindro/i });
    await userEvent.click(openButton);
    expect(await screen.findByLabelText(/número de série/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/peso bruto/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/tara/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /criar cilindro/i })).toBeInTheDocument();
  });
});
