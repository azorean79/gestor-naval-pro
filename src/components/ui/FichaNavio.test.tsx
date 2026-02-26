import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FichaNavio } from './FichaNavio';

describe('FichaNavio', () => {
  it('renderiza dados básicos do navio', () => {
    const queryClient = new QueryClient();
        render(
          <QueryClientProvider client={queryClient}>
            <FichaNavio
              navio={{
                id: '1',
                nome: 'Navio Teste',
                tipo: 'Cargueiro',
                bandeira: 'Norte',
                proprietario: 'Proprietário X',
                armador: '',
                comprimento: '',
                largura: '',
                calado: '',
                capacidade: '',
                observacoes: '',
                certificados: [],
                equipamentos: [],
                jangadas: [],
                imo: '',
                mmsi: '',
                matricula: '',
                ultimaInspecao: '',
                proximaInspecao: '',
              }}
            />
          </QueryClientProvider>
        );
        expect(screen.getByText('Navio Teste')).toBeInTheDocument();
        // "Cargueiro" aparece mais de uma vez, então usamos getAllByText
        const tipoTexts = screen.getAllByText('Cargueiro');
        expect(tipoTexts.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Norte')).toBeInTheDocument();
        expect(screen.getByText('Proprietário X')).toBeInTheDocument();
  });
});
