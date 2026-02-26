# Componentes de Inspeção Marítima

Este documento descreve os componentes criados para o sistema de inspeções marítimas do Gestor Naval Pro.

## 📋 Visão Geral

Os componentes de inspeção fornecem uma interface completa para realizar inspeções técnicas em embarcações, incluindo checklists detalhados, testes técnicos e validação de conformidade com as normas portuguesas de segurança marítima.

## 🏗️ Arquitetura dos Componentes

### 1. QuadroInspecao (`src/components/inspecoes/quadro-inspecao.tsx`)

Componente principal para realização de inspeções interativas.

#### Props
```typescript
interface QuadroInspecaoProps {
  inspecaoId: string;
  equipamentoNome: string;
  clienteNome: string;
  tipoInspecao: 'anual' | 'extraordinaria' | 'inicial' | 'final';
  tecnico: string;
  dataInspecao: string;
  onSalvar: (checklist: ItemChecklist[]) => void;
  checklistInicial?: ItemChecklist[];
}
```

#### Funcionalidades
- ✅ Checklist interativo organizado por categorias
- 🔧 Testes técnicos com valores esperados e obtidos
- 📸 Suporte para anexar fotos e documentos
- 📝 Campo de observações para cada item
- 📊 Barra de progresso em tempo real
- ⚠️ Alertas automáticos para itens reprovados
- 🎯 Status automático baseado nos resultados

### 2. Hook useGestaoInspecoes (`src/hooks/use-gestao-inspecoes.ts`)

Hook personalizado para gerenciamento completo de inspeções.

#### Funcionalidades Principais
- 📊 CRUD completo de inspeções
- 🔍 Busca por equipamento ou cliente
- 📈 Estatísticas e métricas
- ✅ Validação de checklists
- 🔄 Sincronização com estado do servidor

#### Métodos Disponíveis
```typescript
const {
  inspecoes,
  loading,
  error,
  criarInspecao,
  atualizarInspecao,
  excluirInspecao,
  buscarInspecao,
  buscarInspecoesPorEquipamento,
  buscarInspecoesPorCliente,
  finalizarInspecao
} = useInspecoes();
```

## 📋 Estrutura do Checklist

### Categorias de Inspeção

1. **Documentação**
   - Certificado de Segurança
   - Licença de Navegação
   - Seguro da Embarcação

2. **Sistema de Motor**
   - Verificação Geral do Motor
   - Sistema de Arrefecimento
   - Sistema Elétrico do Motor

3. **Equipamentos de Segurança**
   - Coletes Salva-Vidas
   - Extintores
   - Equipamentos de Sinalização
   - Sistema de Segurança Contra Incêndio

4. **Estrutura e Casco**
   - Inspeção do Casco
   - Sistema de Lastro
   - Escotilhas e Aberturas

5. **Equipamentos de Pesca** (apenas para jangadas)
   - Equipamento de Pesca
   - Sistema de Refrigeração

## 🔧 Testes Técnicos

Cada item do checklist pode incluir testes técnicos específicos:

```typescript
interface TesteInspecao {
  id: string;
  nome: string;
  descricao: string;
  valorEsperado: string;
  valorObtido?: string;
  unidade?: string;
  status: 'pendente' | 'passou' | 'falhou';
  observacoes?: string;
}
```

### Exemplos de Testes
- **Temperatura do Óleo**: `< 100°C`
- **Pressão do Óleo**: `3.5 - 4.5 bar`
- **RPM Máximo**: `5800 - 6200 RPM`
- **Espessura do Casco**: `> 4 mm`

## 🚀 Como Usar

### Exemplo Básico

```tsx
import { QuadroInspecao } from '@/components/inspecoes/quadro-inspecao';
import { useGestaoInspecoes } from '@/hooks/use-gestao-inspecoes';

function PaginaInspecao() {
  const { finalizarInspecao } = useGestaoInspecoes();

  const handleSalvar = async (checklist: ItemChecklist[]) => {
    await finalizarInspecao('INSP-2024-001', checklist);
    console.log('Inspeção salva com sucesso!');
  };

  return (
    <QuadroInspecao
      inspecaoId="INSP-2024-001"
      equipamentoNome="Yacht Atlantis Explorer"
      clienteNome="Atlantis Azores"
      tipoInspecao="anual"
      tecnico="João Silva"
      dataInspecao="2024-01-15T10:00:00Z"
      onSalvar={handleSalvar}
    />
  );
}
```

### Exemplo com Checklist Pré-preenchido

```tsx
function EditarInspecao() {
  const checklistInicial: ItemChecklist[] = [
    {
      id: 'doc-1',
      categoria: 'Documentação',
      item: 'Certificado de Segurança',
      descricao: 'Verificar validade do certificado',
      status: 'aprovado',
      observacoes: 'Certificado válido até 2025-03-15'
    }
    // ... outros itens
  ];

  return (
    <QuadroInspecao
      // ... outras props
      checklistInicial={checklistInicial}
      onSalvar={handleSalvar}
    />
  );
}
```

## 📊 Validação e Regras de Negócio

### Validação Automática
- ✅ Verificação de itens pendentes
- ✅ Validação de testes não executados
- ✅ Obrigatoriedade de observações em itens reprovados
- ✅ Cálculo automático do status final da inspeção

### Status da Inspeção
- **Em Andamento**: Inspeção iniciada mas não finalizada
- **Concluída**: Todos os itens avaliados
- **Aprovada**: Todos os itens aprovados ou N/A
- **Reprovada**: Pelo menos um item reprovado

## 🎨 Personalização

### Temas e Estilos
O componente utiliza shadcn/ui e suporta personalização via CSS classes:

```css
/* Exemplo de personalização */
.quadro-inspecao {
  --primary-color: #0ea5e9;
  --success-color: #10b981;
  --error-color: #ef4444;
}
```

### Idiomas
O componente está preparado para internacionalização. As strings podem ser externalizadas para arquivos de tradução.

## 🔍 Debugging e Desenvolvimento

### Logs de Desenvolvimento
```typescript
// Habilitar logs detalhados
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Checklist atualizado:', checklist);
  console.log('Progresso:', progressoConcluido, '/', progressoTotal);
}
```

### Testes
Os componentes incluem validação automática e podem ser testados com dados mock:

```tsx
// Arquivo de teste
import { render, screen, fireEvent } from '@testing-library/react';
import { QuadroInspecao } from './quadro-inspecao';

const mockProps = {
  inspecaoId: 'TEST-001',
  equipamentoNome: 'Test Boat',
  clienteNome: 'Test Client',
  tipoInspecao: 'anual' as const,
  tecnico: 'Test Technician',
  dataInspecao: '2024-01-01T00:00:00Z',
  onSalvar: jest.fn()
};

test('renderiza quadro de inspeção', () => {
  render(<QuadroInspecao {...mockProps} />);
  expect(screen.getByText('Quadro de Inspeção')).toBeInTheDocument();
});
```

## 📈 Métricas e Relatórios

### Estatísticas Disponíveis
- 📊 Total de inspeções realizadas
- ✅ Taxa de aprovação
- 📈 Inspeções por tipo
- ⏰ Próximas inspeções agendadas
- 🔄 Status atual das inspeções

### Relatórios
Os dados das inspeções podem ser exportados para relatórios em PDF ou Excel, incluindo:
- Checklist completo com status
- Testes técnicos realizados
- Observações e recomendações
- Fotos e documentos anexados

## 🔒 Segurança e Conformidade

### Normas Aplicadas
- 📋 Regulamento da Segurança Marítima (Decreto-Lei n.º 61/2017)
- 🛟 Convenção SOLAS (Safety of Life at Sea)
- 🇵🇹 Normas da Direção-Geral de Recursos Naturais, Segurança e Serviços Marítimos (DGRM)

### Validações de Segurança
- 🔐 Autenticação obrigatória do técnico
- 📝 Rastreabilidade de todas as alterações
- 🔒 Criptografia de dados sensíveis
- 📊 Auditoria completa das inspeções

## 🚀 Próximos Passos

### Melhorias Planejadas
- 📱 Versão mobile otimizada
- 📷 Integração com câmera do dispositivo
- 🔊 Comandos de voz para ditar observações
- 🤖 IA para análise automática de fotos
- 📊 Dashboards avançados com gráficos
- 🔗 Integração com sistemas externos

### API Integration
- 🔌 Endpoints REST para CRUD de inspeções
- 📡 WebSocket para atualizações em tempo real
- ☁️ Sincronização com cloud storage para fotos
- 🔄 Cache offline para trabalho desconectado

---

## 📞 Suporte

Para dúvidas ou problemas com os componentes de inspeção, consulte:
- 📖 Documentação técnica completa
- 🐛 Issues no repositório do projeto
- 💬 Canal de suporte da equipe