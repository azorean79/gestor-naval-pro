import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { FichaJangada } from './FichaJangada';

describe('FichaJangada', () => {
  it('renderiza dados básicos da jangada', () => {
    render(
      <FichaJangada jangada={{
        numero: 'J-001',
        marca: 'MarcaX',
        modelo: 'ModeloY',
        lotacao: 10,
        status: 'Ativa',
      }} />
    );
    expect(screen.getByText('J-001')).toBeInTheDocument();
    expect(screen.getByText('MarcaX')).toBeInTheDocument();
    expect(screen.getByText('ModeloY')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
