"use client";

import { useMemo } from 'react';
import { EXEMPLOS_JANGADAS } from '@/lib/exemplos-jangadas';

export interface JangadaTemplate {
  marca: string;
  modelo: string;
  tipo: string;
  capacidade: number;
  tipoPack: string;
  componentesSelecionados: Record<string, { incluido: boolean; quantidade?: number; validade?: string }>;
  validadeComponentes: Record<string, string>;
  dataFabricacao?: Date;
  dataInspecao?: Date;
  dataProximaInspecao?: Date;
  status: string;
  // Novos campos adicionados
  lotacao?: number;
  hru?: string;
  tubosAltaPressao?: number;
  validadeTubosAltaPressao?: string;
  tubosAltaPressaoSuperior?: number;
  validadeTubosAltaPressaoSuperior?: string;
  tubosAltaPressaoInferior?: number;
  validadeTubosAltaPressaoInferior?: string;
  valvulasAlivio?: number;
  validadeValvulasAlivio?: string;
  cabecasDisparo?: number;
  validadeCabecasDisparo?: string;
  valvulasInsuflacao?: number;
  bateriaLitio?: number;
  luzExterior?: number;
  // Campos do cilindro
  cilindroNumeroSerie?: string;
  cilindroTipo?: string;
  cilindroSistema?: string;
  cilindroCapacidade?: number;
  cilindroTara?: number;
  cilindroPesoBruto?: number;
  cilindroQuantidadeCO2?: number;
  cilindroQuantidadeN2?: number;
  cilindroTesteHidraulico?: Date;
  cilindroProximoTesteHidraulico?: Date;
  cilindroValidade?: string;
}

export function useJangadaTemplates() {
  const templates: JangadaTemplate[] = useMemo(() => {
    return EXEMPLOS_JANGADAS.map(exemplo => {
      // Converter componentesSelecionados para incluir validade
      const componentesSelecionados: Record<string, { incluido: boolean; quantidade?: number; validade?: string }> = {};
      
      Object.entries(exemplo.componentesSelecionados).forEach(([componente, config]) => {
        componentesSelecionados[componente] = {
          incluido: config.incluido,
          quantidade: config.quantidade,
          validade: exemplo.validadeComponentes && typeof exemplo.validadeComponentes === 'object' 
            ? (exemplo.validadeComponentes as Record<string, string>)[componente] 
            : undefined
        };
      });

      return {
        marca: exemplo.marca,
        modelo: exemplo.modelo,
        tipo: exemplo.tipo,
        capacidade: exemplo.capacidade,
        tipoPack: exemplo.tipoPack,
        componentesSelecionados,
        validadeComponentes: exemplo.validadeComponentes as Record<string, string>,
        dataFabricacao: exemplo.dataFabricacao,
        dataInspecao: exemplo.dataInspecao,
        dataProximaInspecao: exemplo.dataProximaInspecao,
        status: exemplo.status,
        // Novos campos adicionados
        lotacao: exemplo.lotacao,
        hru: exemplo.hru,
        tubosAltaPressao: exemplo.tubosAltaPressao,
        validadeTubosAltaPressao: (exemplo as any).validadeTubosAltaPressao,
        valvulasAlivio: exemplo.valvulasAlivio,
        validadeValvulasAlivio: (exemplo as any).validadeValvulasAlivio,
        cabecasDisparo: (exemplo as any).cabecasDisparo,
        validadeCabecasDisparo: (exemplo as any).validadeCabecasDisparo,
        valvulasInsuflacao: exemplo.valvulasInsuflacao,
        bateriaLitio: exemplo.bateriaLitio,
        luzExterior: exemplo.luzExterior,
        // Campos do cilindro
        cilindroNumeroSerie: (exemplo as any).cilindroNumeroSerie,
        cilindroTipo: (exemplo as any).cilindroTipo,
        cilindroSistema: (exemplo as any).cilindroSistema,
        cilindroCapacidade: (exemplo as any).cilindroCapacidade,
        cilindroTara: (exemplo as any).cilindroTara,
        cilindroPesoBruto: (exemplo as any).cilindroPesoBruto,
        cilindroQuantidadeCO2: (exemplo as any).cilindroQuantidadeCO2,
        cilindroQuantidadeN2: (exemplo as any).cilindroQuantidadeN2,
        cilindroTesteHidraulico: (exemplo as any).cilindroTesteHidraulico,
        cilindroProximoTesteHidraulico: (exemplo as any).cilindroProximoTesteHidraulico,
        cilindroValidade: (exemplo as any).cilindroValidade,
      };
    });
  }, []);

  const marcas = useMemo(() => {
    const uniqueMarcas = [...new Set(templates.map(t => t.marca))];
    return uniqueMarcas.sort();
  }, [templates]);

  const getModelosByMarca = (marca: string) => {
    const modelos = templates
      .filter(t => t.marca === marca)
      .map(t => ({
        modelo: t.modelo,
        capacidade: t.capacidade,
        tipoPack: t.tipoPack,
      }));
    return modelos.sort((a, b) => a.modelo.localeCompare(b.modelo));
  };

  const getTemplateByMarcaModelo = (marca: string, modelo: string): JangadaTemplate | null => {
    return templates.find(t => t.marca === marca && t.modelo === modelo) || null;
  };

  const getTemplateByTipoPackCapacidade = (tipoPack: string, capacidade: number): JangadaTemplate | null => {
    return templates.find(t => t.tipoPack === tipoPack && t.capacidade === capacidade) || null;
  };

  return {
    templates,
    marcas,
    getModelosByMarca,
    getTemplateByMarcaModelo,
    getTemplateByTipoPackCapacidade,
  };
}