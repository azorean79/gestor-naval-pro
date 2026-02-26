# Sistema de Conhecimento Integrado

Este documento demonstra como o sistema de gestão naval integra **Base de Conhecimento**, **Boletins de Serviço** e **Legislação** aos módulos existentes (EPIRBs, Importações, Análise IA).

## Visão Geral

O sistema implementa um framework completo de gestão do conhecimento que conecta documentação técnica, comunicados oficiais e normas regulatórias aos processos operacionais do sistema.

## Componentes do Sistema

### 1. Base de Conhecimento (`BaseConhecimento`)
Documentação técnica e procedimentos operacionais:
- **Manutenção**: Guias de operação, teste e manutenção
- **Segurança**: Protocolos de emergência e procedimentos de segurança
- **Regulamentação**: Processos administrativos e compliance
- **Procedimentos**: Diretrizes operacionais e melhores práticas

### 2. Boletins de Serviço (`BoletimServico`)
Comunicados oficiais sobre equipamentos e processos:
- **Urgente**: Requer ação imediata (recalls, falhas críticas)
- **Preventivo**: Manutenção programada e atualizações
- **Corretivo**: Correções de problemas identificados
- **Informativo**: Mudanças administrativas e atualizações gerais

### 3. Legislação (`Legislacao`)
Normas e regulamentos aplicáveis:
- **Vigente**: Leis e regulamentos atualmente em vigor
- **Revogada**: Normas que perderam validade
- **Em Revisão**: Documentos em processo de atualização

## Integração aos Módulos

### EPIRBs (Equipamentos de Posicionamento e Identificação de Radiofarol)

**Base de Conhecimento Aplicável:**
- Funcionamento e Manutenção de EPIRBs
- Procedimentos de Emergência com EPIRB

**Boletins de Serviço:**
- Recall de EPIRBs Modelo XYZ-2000 (CRÍTICO)
- Atualização de Firmware EPIRB (ALTA)

**Legislação:**
- Regulamento de Equipamentos de Segurança Marítima (Decreto-Lei n.º 145/2015)
- Norma Internacional para EPIRBs (SOLAS Capítulo IV)

### Importações

**Base de Conhecimento Aplicável:**
- Processo de Importação de Equipamentos Marítimos
- Certificações Necessárias para Equipamentos Importados

**Boletins de Serviço:**
- Novos Requisitos Aduaneiros para Equipamentos Marítimos

**Legislação:**
- Código Aduaneiro Comunitário (Regulamento (UE) n.º 952/2013)

### Análise IA

**Base de Conhecimento Aplicável:**
- Interpretação de Resultados de Análise Preditiva
- Limitações e Considerações Éticas da IA em Inspeções

**Boletins de Serviço:**
- Atualização do Modelo de IA para Detecção de Anomalias

**Legislação:**
- Regulamento Geral sobre a Proteção de Dados (RGPD)

## Implementação Técnica

### Estrutura de Dados

```typescript
interface BaseConhecimento {
  id: string;
  titulo: string;
  categoria: 'manutencao' | 'seguranca' | 'regulamentacao' | 'procedimentos';
  aplicavelA: string[];
  resumo: string;
  documentoFonte: string;
  vinculacoes?: VinculacaoEntidade[];
}

interface BoletimServico {
  id: string;
  numero: string;
  titulo: string;
  tipo: 'urgente' | 'preventivo' | 'corretivo' | 'informativo';
  prioridade: 'critica' | 'alta' | 'normal' | 'baixa';
  aplicavelA: string[];
  dataValidade: string;
  vinculacoes?: VinculacaoEntidade[];
}

interface Legislacao {
  id: string;
  titulo: string;
  numero: string;
  categoria: string;
  status: 'vigente' | 'revogada' | 'em_revisao';
  aplicavelA: string[];
  vinculacoes?: VinculacaoEntidade[];
}

interface VinculacaoEntidade {
  entidadeTipo: string; // 'epirb', 'navio', 'jangada', etc.
  entidadeId: string;
  relevancia: 'alta' | 'media' | 'baixa';
}
```

### Componente `ConhecimentoIntegrado`

Componente React que integra conhecimento contextual aos módulos:

```tsx
<ConhecimentoIntegrado
  modulo="epirbs"
  entidadeId={selectedEPIRB}
  entidadeTipo="epirb"
/>
```

**Funcionalidades:**
- Exibe resumo de itens de conhecimento aplicáveis
- Destaca itens críticos/urgentes
- Mostra documentação técnica relevante
- Lista boletins de serviço ativos
- Apresenta legislação aplicável
- Permite visualização detalhada de cada item

### Hooks de Dados

```typescript
// Hooks para buscar conhecimento por módulo
const useBaseConhecimento = (modulo: string) => { ... }
const useBoletinsServico = (modulo: string) => { ... }
const useLegislacao = (modulo: string) => { ... }
```

## Benefícios da Integração

### 1. **Conformidade Regulatória**
- Acesso imediato a legislação aplicável
- Alertas sobre mudanças normativas
- Rastreamento de compliance

### 2. **Segurança Operacional**
- Procedimentos de emergência atualizados
- Alertas sobre recalls e manutenções críticas
- Documentação técnica sempre acessível

### 3. **Eficiência Operacional**
- Redução de tempo de busca por informações
- Contexto relevante para tomadas de decisão
- Padronização de procedimentos

### 4. **Gestão de Riscos**
- Identificação proativa de problemas
- Alertas sobre equipamentos afetados
- Histórico de compliance

## Casos de Uso Práticos

### Cenário 1: Inspeção de EPIRB
1. Técnico acessa módulo de EPIRBs
2. Sistema mostra automaticamente:
   - Boletim de recall crítico para modelo específico
   - Procedimentos de manutenção atualizados
   - Legislação aplicável sobre equipamentos de segurança

### Cenário 2: Processo de Importação
1. Usuário inicia processo de importação
2. Sistema apresenta:
   - Requisitos aduaneiros atualizados
   - Certificações necessárias
   - Código aduaneiro aplicável

### Cenário 3: Análise de IA
1. Sistema gera resultado de análise preditiva
2. Conhecimento integrado mostra:
   - Como interpretar o resultado
   - Considerações éticas da IA
   - Requisitos do RGPD

## Próximos Passos

1. **Integração com Base de Dados**: Migrar dados simulados para Prisma
2. **API Routes**: Criar endpoints para CRUD de conhecimento
3. **Interface Administrativa**: Painel para gestão de conhecimento
4. **Notificações**: Sistema de alertas para itens críticos
5. **Auditoria**: Rastreamento de acesso e compliance

## Conclusão

O sistema de conhecimento integrado transforma o gestor naval de uma ferramenta operacional em uma plataforma de gestão inteligente, garantindo que todos os usuários tenham acesso ao conhecimento mais atualizado e relevante para suas atividades, mantendo conformidade regulatória e maximizando a segurança operacional.