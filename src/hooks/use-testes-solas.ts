import { useMemo } from 'react';

export interface TesteSOLAS {
  nome: string;
  obrigatorio: boolean;
  frequencia: string;
  norma: string;
  custo: number;
  motivo: string;
  idadeMinima?: number;
  proximoTeste?: number;
}

export interface ResultadoTestesSOLAS {
  idadeAnos: number;
  anosFabrico: number;
  testes: {
    visualInspection: TesteSOLAS;
    pressureTest: TesteSOLAS;
    fsTest: TesteSOLAS;
    napTest: TesteSOLAS;
    gasInsufflationTest: TesteSOLAS;
  };
  testesObrigatorios: TesteSOLAS[];
  testesOpcionais: TesteSOLAS[];
  custoTotal: number;
}

export function calcularTestesSOLAS(
  dataFabricacao: Date,
  dataInspecao: Date = new Date()
): ResultadoTestesSOLAS {
  const idadeAnos = Math.floor(
    (dataInspecao.getTime() - dataFabricacao.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );
  const anosFabrico = Math.floor(
    (dataInspecao.getTime() - dataFabricacao.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );

  const testes = {
    // SEMPRE OBRIGATÓRIO (toda inspeção anual)
    visualInspection: {
      nome: 'Inspeção Visual Completa',
      obrigatorio: true,
      frequencia: 'Anual',
      norma: 'SOLAS III/20, IMO MSC.218(82)',
      custo: 150.0,
      motivo: 'Obrigatório em todas as inspeções anuais',
    },

    pressureTest: {
      nome: 'Teste de Pressão (Pressure Test)',
      obrigatorio: true,
      frequencia: 'Anual',
      norma: 'SOLAS III/20.8, IMO MSC.48(66)',
      custo: 200.0,
      motivo: 'Obrigatório - verificação de estanquicidade e integridade estrutural',
    },

    // A PARTIR DO 10º ANO
    fsTest: {
      nome: 'FS Test (Fabric Strength Test)',
      obrigatorio: idadeAnos >= 10,
      frequencia: idadeAnos >= 10 ? 'Anual' : 'Não aplicável',
      norma: 'IMO MSC.81(70) Annex 1',
      custo: 350.0,
      motivo:
        idadeAnos >= 10
          ? `OBRIGATÓRIO - Jangada com ${idadeAnos} anos (≥10 anos)`
          : `Não obrigatório - Jangada com ${idadeAnos} anos (<10 anos)`,
      idadeMinima: 10,
    },

    napTest: {
      nome: 'NAP Test (Necessary Additional Pressure)',
      obrigatorio: idadeAnos >= 10,
      frequencia: idadeAnos >= 10 ? 'Anual' : 'Não aplicável',
      norma: 'IMO MSC.81(70) Annex 2',
      custo: 300.0,
      motivo:
        idadeAnos >= 10
          ? `OBRIGATÓRIO - Jangada com ${idadeAnos} anos (≥10 anos)`
          : `Não obrigatório - Jangada com ${idadeAnos} anos (<10 anos)`,
      idadeMinima: 10,
    },

    // A CADA 5 ANOS DESDE O FABRICO
    gasInsufflationTest: {
      nome: 'Gas Insuflation Test',
      obrigatorio: anosFabrico % 5 === 0 || anosFabrico >= 5,
      frequencia: 'Quinquenal (5 em 5 anos)',
      norma: 'SOLAS III/20.11, IMO MSC.218(82)',
      custo: 450.0,
      motivo:
        anosFabrico >= 5 && anosFabrico % 5 === 0
          ? `OBRIGATÓRIO - Teste quinquenal (${anosFabrico} anos desde fabrico)`
          : anosFabrico < 5
          ? `Não obrigatório - Próximo teste aos 5 anos (faltam ${5 - anosFabrico} anos)`
          : `Próximo teste aos ${Math.ceil(anosFabrico / 5) * 5} anos`,
      proximoTeste: Math.ceil(anosFabrico / 5) * 5,
    },
  };

  const testesObrigatorios = Object.values(testes).filter((t) => t.obrigatorio);
  const testesOpcionais = Object.values(testes).filter((t) => !t.obrigatorio);
  const custoTotal = testesObrigatorios.reduce((sum, t) => sum + t.custo, 0);

  return {
    idadeAnos,
    anosFabrico,
    testes,
    testesObrigatorios,
    testesOpcionais,
    custoTotal,
  };
}

export function useTestesSOLAS(dataFabricacao: Date | null | undefined) {
  return useMemo(() => {
    if (!dataFabricacao) {
      return null;
    }
    return calcularTestesSOLAS(dataFabricacao);
  }, [dataFabricacao]);
}
