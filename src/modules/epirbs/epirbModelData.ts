export type EpirbServiceItem = {
  name: string;
  notes?: string;
  interval?: string;
  mandatory?: boolean;
};

export type EpirbModel = {
  model: string;
  aliases?: string[];
  family?: string;
  approvals: string[];
  programming: string[];
  characteristics: string[];
  serviceItems: EpirbServiceItem[];
  manualFiles?: string[];
};

export type EpirbBrandCatalog = {
  brand: string;
  aliases?: string[];
  summary: string;
  models: EpirbModel[];
};

export const epirbModelData: EpirbBrandCatalog[] = [
  {
    brand: "Ocean Signal",
    aliases: ["OCEAN SIGNAL", "OCEANSIGNAL"],
    summary: "EPIRBs da gama Ocean Signal com programação eletrónica, rotinas de auto-teste e manutenção focada em bateria, invólucro, HRU/suporte e identificação HEX/MMSI.",
    models: [
      {
        model: "EPIRB1",
        aliases: ["EPIRB 1", "EPIRB-1"],
        family: "406 MHz / GNSS / CAT II ou bracket manual",
        approvals: ["Cospas-Sarsat", "MED / Wheelmark (consoante configuração)", "SOLAS carriage quando aplicável"],
        programming: ["Programming Wand TB040", "Configuração HEX ID / MMSI / country code conforme fabricante"],
        characteristics: [
          "EPIRB compacta com GNSS integrado",
          "Rotina de self-test e GNSS test suportada pelo fabricante",
          "Substituição de bateria conforme instruções dedicadas do fabricante",
          "Compatível com suporte de libertação e configuração de navio/identificação"
        ],
        serviceItems: [
          { name: "Bateria principal", notes: "Confirmar validade, vedação e critérios do boletim/instrução de substituição.", interval: "Conforme validade do fabricante", mandatory: true },
          { name: "Programming Wand / programação", notes: "Usar a Programming Wand quando necessário para confirmação/atualização de parâmetros aprovados.", interval: "Quando aplicável", mandatory: false },
          { name: "Self-test funcional", notes: "Executar e registar resultado sem consumo indevido de bateria.", interval: "Inspeção periódica", mandatory: true },
          { name: "Suporte / HRU / etiqueta HEX", notes: "Verificar fixação, data/estado do HRU quando instalado e legibilidade da identificação.", interval: "Inspeção periódica", mandatory: true }
        ],
        manualFiles: [
          "EPIRBS/912S-02352 Issue 01.00 EPIRB1 Battery Replacement Instructions.pdf",
            "EPIRBS/TB040 Using Programming Wand with EPIRB1 & EPIRB1 Pro.pdf",
            "EPIRBS/912S-00864 Issue 02.00 (LB2E Installation Instructions)"
        ]
      },
      {
        model: "EPIRB1 Pro",
        aliases: ["EPIRB 1 PRO", "EPIRB-1 PRO", "EPIRB1PRO"],
        family: "406 MHz / GNSS / versão profissional",
        approvals: ["Cospas-Sarsat", "MED / Wheelmark (consoante configuração)", "SOLAS carriage quando aplicável"],
        programming: ["Programming Wand TB040", "Configuração HEX ID / MMSI / country code conforme fabricante"],
        characteristics: [
          "Variante profissional da família EPIRB1",
          "Suporta programação com a mesma Programming Wand TB040",
          "Integra procedimentos dedicados de configuração aprovados pelo fabricante"
        ],
        serviceItems: [
          { name: "Programming Wand / programação", notes: "Aplicar procedimento TB040 quando for necessário validar ou atualizar a programação.", interval: "Quando aplicável", mandatory: true },
          { name: "Self-test funcional", notes: "Executar e registar o teste previsto pelo fabricante.", interval: "Inspeção periódica", mandatory: true },
          { name: "Suporte / HRU / identificação", notes: "Confirmar estado mecânico, datas e identificação do equipamento.", interval: "Inspeção periódica", mandatory: true }
        ],
        manualFiles: [
          "EPIRBS/TB040 Using Programming Wand with EPIRB1 & EPIRB1 Pro.pdf",
          "EPIRBS/912S-00864 Issue 02.00 (LB2E Installation Instructions)"
        ]
      },
      {
        model: "E100",
        aliases: ["OCEAN SIGNAL E100", "EPIRB E100", "E-100"],
        family: "406 MHz / GNSS / compacta",
        approvals: ["Cospas-Sarsat", "Programação e certificação conforme configuração do fabricante"],
        programming: ["Configuração HEX ID / MMSI / country code conforme fabricante"],
        characteristics: [
          "EPIRB Ocean Signal da família compacta para registo e acompanhamento no módulo",
          "Verificação orientada a identificação, bateria, auto-teste e suporte/instalação",
          "Associação direta ao navio e controlo documental na ficha técnica"
        ],
        serviceItems: [
          { name: "Identificação e programação", notes: "Confirmar HEX ID, MMSI, país e etiquetas legíveis conforme dados do navio.", interval: "Inspeção periódica", mandatory: true },
          { name: "Bateria principal", notes: "Validar prazo, integridade e critérios de substituição do fabricante.", interval: "Conforme validade do fabricante", mandatory: true },
          { name: "Self-test funcional", notes: "Executar o auto-teste previsto pelo fabricante e registar o resultado.", interval: "Inspeção periódica", mandatory: true },
          { name: "Suporte / fixação / HRU", notes: "Verificar instalação, libertação e estado físico dos acessórios quando aplicável.", interval: "Inspeção periódica", mandatory: true }
        ],
        manualFiles: []
      }
    ]
  }
];
