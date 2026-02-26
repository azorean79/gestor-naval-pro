import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddJangadaForm } from './add-jangada-form';

describe('AddJangadaForm', () => {
  it('renderiza campos básicos do formulário', async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AddJangadaForm />
      </QueryClientProvider>
    );
    const openButton = screen.getByRole('button', { name: /nova jangada/i });
    await userEvent.click(openButton);
    expect(await screen.findByLabelText(/número de série/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/marca/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/lotação/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/modelo/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /criar/i })).toBeInTheDocument();
  });
});
