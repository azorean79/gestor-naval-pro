import { useState, useCallback } from 'react';
import { ItemChecklist, TesteInspecao } from './use-gestao-inspecoes';

export interface ValidacaoChecklistResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function useValidacaoChecklist() {
  const [validacaoResult, setValidacaoResult] = useState<ValidacaoChecklistResult>({
    isValid: true,
    errors: [],
    warnings: []
  });

  const validarChecklist = useCallback((checklist: ItemChecklist[]): ValidacaoChecklistResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Verificar se todos os itens têm status definido
    const itensSemStatus = checklist.filter(item => !item.status || item.status === 'pendente');
    if (itensSemStatus.length > 0) {
      errors.push(`${itensSemStatus.length} item(s) do checklist ainda estão pendentes`);
    }

    // Verificar se itens reprovados têm observações
    const reprovadosSemObservacoes = checklist.filter(
      item => item.status === 'reprovado' && (!item.observacoes || item.observacoes.trim() === '')
    );
    if (reprovadosSemObservacoes.length > 0) {
      errors.push(`${reprovadosSemObservacoes.length} item(s) reprovado(s) não possuem observações`);
    }

    // Verificar testes obrigatórios
    checklist.forEach(item => {
      if (item.testes && item.testes.length > 0) {
        const testesPendentes = item.testes.filter(teste => teste.status === 'pendente');
        if (testesPendentes.length > 0) {
          warnings.push(`Item "${item.item}" possui ${testesPendentes.length} teste(s) pendente(s)`);
        }

        // Verificar se testes falharam mas item foi aprovado
        const testesFalharam = item.testes.filter(teste => teste.status === 'falhou');
        if (testesFalharam.length > 0 && item.status === 'aprovado') {
          errors.push(`Item "${item.item}" foi aprovado mas possui teste(s) que falharam`);
        }
      }
    });

    // Verificar categorias críticas
    const categoriasCriticas = ['Motor', 'Sistema Elétrico', 'Estrutura/Casco'];
    categoriasCriticas.forEach(categoria => {
      const itensCategoria = checklist.filter(item => item.categoria === categoria);
      const reprovadosCriticos = itensCategoria.filter(item => item.status === 'reprovado');

      if (reprovadosCriticos.length > 0) {
        warnings.push(`Categoria crítica "${categoria}" possui ${reprovadosCriticos.length} item(s) reprovado(s)`);
      }
    });

    const isValid = errors.length === 0;

    const result = { isValid, errors, warnings };
    setValidacaoResult(result);
    return result;
  }, []);

  const validarTeste = useCallback((teste: TesteInspecao): boolean => {
    // Validações básicas do teste
    if (!teste.nome || teste.nome.trim() === '') return false;
    if (!teste.descricao || teste.descricao.trim() === '') return false;
    if (!teste.valorEsperado || teste.valorEsperado.trim() === '') return false;

    // Se o teste foi executado, deve ter valor obtido
    if (teste.status !== 'pendente' && (!teste.valorObtido || teste.valorObtido.trim() === '')) {
      return false;
    }

    return true;
  }, []);

  const resetValidacao = useCallback(() => {
    setValidacaoResult({
      isValid: true,
      errors: [],
      warnings: []
    });
  }, []);

  return {
    validacaoResult,
    validarChecklist,
    validarTeste,
    resetValidacao
  };
}