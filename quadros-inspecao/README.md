# Quadros de Inspeção

Esta pasta armazena os quadros de inspeção das embarcações, incluindo inspeções periódicas, verificações de segurança e relatórios técnicos.

## Estrutura de Pastas

```
quadros-inspecao/
├── inspeções-visuais/      - Inspeções visuais de casco e estrutura
├── inspeções-mecânicas/    - Inspeções de motores e sistemas
├── inspeções-elétricas/    - Inspeções de sistemas elétricos
├── inspeções-segurança/    - Inspeções de equipamentos de segurança
├── inspeções-ambientais/   - Inspeções ambientais
├── relatórios/             - Relatórios consolidados
└── templates/              - Templates de quadros de inspeção
```

## Convenção de Nomenclatura

Recomenda-se usar o seguinte padrão:
- `INSPECAO_[JANGADA-ID]_[TIPO]_[DATA]_[INSPECTOR].pdf`

Exemplos:
- `INSPECAO_JANGADA-001_VISUAL_2026-02-05_JULIO.pdf`
- `INSPECAO_JANGADA-005_MECANICA_2026-02-03_CARLOS.pdf`
- `INSPECAO_JANGADA-003_SEGURANCA_2026-01-30_MARIA.pdf`

## Tipos de Inspeção

- **VISUAL**: Inspeção visual de casco, estrutura e pintura
- **MECANICA**: Inspeção de motores, sistemas de propulsão e hidráulicos
- **ELETRICA**: Inspeção de sistemas elétricos, baterias e geradores
- **SEGURANCA**: Inspeção de coletes salva-vidas, boias, extintores, etc.
- **AMBIENTAL**: Inspeção de conformidade ambiental
- **GERAL**: Inspeção geral completa
- **PREVENTIVA**: Manutenção preventiva
- **CORRETIVA**: Manutenção corretiva

## Status de Inspeção

- **AGENDADA**: Inspeção agendada
- **EM_EXECUCAO**: Em execução
- **CONCLUIDA**: Concluída
- **PENDENTE_REPARO**: Pendente de reparos identificados
- **REPROVADA**: Não passou na inspeção
- **APROVADA**: Aprovada

## Resultado da Inspeção

- **CONFORME**: Sem problemas encontrados
- **NAO_CONFORME**: Problemas encontrados
- **NAO_CONFORME_CRITICO**: Problemas críticos encontrados

## Formulário Padrão

Os quadros devem incluir:

1. **Identificação**
   - Número da jangada/embarcação
   - Data da inspeção
   - Inspector responsável
   - Tipo de inspeção

2. **Itens Verificados**
   - Item
   - Status (Conforme/Não Conforme)
   - Observações
   - Fotografia (se aplicável)

3. **Resumo**
   - Resultado geral
   - Não conformidades encontradas
   - Ações recomendadas
   - Data do próximo acompanhamento

4. **Assinatura**
   - Inspector
   - Responsável pela embarcação
   - Data

## Formatos Aceitos

- PDF (.pdf)
- Excel (.xlsx, .xls)
- Word (.docx, .doc)
- Imagens (JPG, PNG)
- CSV (.csv)

## Retenção de Documentos

- Manter mínimo de 2 anos
- Arquivar após 5 anos
- Manter em backup

## Frequência Recomendada

- **Mensal**: Inspeção visual básica
- **Trimestral**: Inspeção mecânica
- **Semestral**: Inspeção elétrica e de segurança
- **Anual**: Inspeção geral completa
