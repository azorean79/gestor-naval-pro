import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddStockItemForm } from './add-stock-item-form';

describe('AddStockItemForm', () => {
  it('renderiza campos básicos do formulário', async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AddStockItemForm />
      </QueryClientProvider>
    );
    const openButton = screen.getByRole('button', { name: /adicionar item/i });
    await userEvent.click(openButton);
    expect(await screen.findByLabelText(/nome/i)).toBeInTheDocument();
    const quantidadeFields = await screen.findAllByLabelText(/quantidade/i);
    expect(quantidadeFields.length).toBeGreaterThanOrEqual(3);
    expect(await screen.findByLabelText(/categoria/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /criar item/i })).toBeInTheDocument();
  });
});
