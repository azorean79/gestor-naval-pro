import { useState, useEffect } from 'react';

export type Tecnico = 'Julio Correia' | 'Alex Santos';

const TECNICO_STORAGE_KEY = 'tecnico_atual';

export function useTecnico() {
  const [tecnico, setTecnico] = useState<Tecnico>('Julio Correia');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Only access localStorage after hydration
    const stored = localStorage.getItem(TECNICO_STORAGE_KEY);
    if (stored === 'Julio Correia' || stored === 'Alex Santos') {
      setTecnico(stored as Tecnico);
    }
    setIsHydrated(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const changeTecnico = (novoTecnico: Tecnico) => {
    setTecnico(novoTecnico);
    localStorage.setItem(TECNICO_STORAGE_KEY, novoTecnico);
  };

  return { tecnico, changeTecnico, isHydrated };
}