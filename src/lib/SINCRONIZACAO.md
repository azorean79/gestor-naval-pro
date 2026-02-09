/**
 * SINCRONIZAÇÃO CENTRALIZADA DE MÓDULOS
 * ==========================================
 *
 * Este arquivo documenta e sincroniza todos os padrões entre módulos.
 * Siga EXATAMENTE estes padrões ao criar novas funcionalidades.
 */

// ============================================================================
// PADRÃO 1: SEMPRE USE OS SCHEMAS E TIPOS DO lib/index.ts
// ============================================================================
// ❌ ERRADO:
// import { jangadaSchema } from '@/lib/validation-schemas';
// import { JangadaForm } from '@/lib/types';

// ✅ CORRETO:
// import { jangadaSchema, type JangadaForm } from '@/lib';

// ============================================================================
// PADRÃO 2: ESTRUTURA DE PÁGINAS
// ============================================================================
/*
 * Toda página deve seguir esta estrutura:
 * 
 * 'use client'
 * import { useState } from 'react'
 * import { useRouter } from 'next/navigation'
 * import { useQuery, useMutation } from '@tanstack/react-query'
 * import { useForm } from 'react-hook-form'
 * import { zodResolver } from '@hookform/resolvers/zod'
 * import { type NomeSchema } from '@/lib'
 * 
 * export default function NomePage() {
 *   // 1. Hooks (always in this order)
 *   const router = useRouter()
 *   const { control, handleSubmit, formState: { errors } } = useForm<NomeSchema>({
 *     resolver: zodResolver(nomeSchema)
 *   })
 *   
 *   // 2. Queries
 *   const { data, isLoading } = useQuery({ ... })
 *   
 *   // 3. Mutations
 *   const { mutate } = useMutation({ ... })
 *   
 *   // 4. Handlers
 *   const onSubmit = (data) => { ... }
 *   
 *   // 5. Render
 *   return JSX
 * }
 */

// ============================================================================
// PADRÃO 3: ESTRUTURA DE COMPONENTES
// ============================================================================
/*
 * Todo componente deve:
 * 1. Aceitar props com tipos bem definidos
 * 2. Usar hooks customizados quando aplicável
 * 3. Seguir o padrão de naming: ComponentName.tsx
 * 4. Exportar o componente como default
 * 
 * EXEMPLO:
 * 
 * interface JangadaFormProps {
 *   initialData?: Jangada
 *   onSuccess?: (data: Jangada) => void
 * }
 * 
 * export default function JangadaForm({ initialData, onSuccess }: JangadaFormProps) {
 *   return JSX
 * }
 */

// ============================================================================
// PADRÃO 4: ESTRUTURA DE HOOKS
// ============================================================================
/*
 * Todo hook deve:
 * 1. Estar em src/hooks/
 * 2. Seguir o padrão: use-recurso.ts
 * 3. Usar @tanstack/react-query
 * 4. Retornar todos os métodos CRUD
 * 
 * EXEMPLO:
 * 
 * export function useJangadas(filters?: JangadaFilters) {
 *   const queryClient = useQueryClient()
 *   
 *   // Read
 *   const { data, isLoading } = useQuery({
 *     queryKey: ['jangadas', filters],
 *     queryFn: () => fetch(`/api/jangadas?...`).then(r => r.json())
 *   })
 *   
 *   // Create
 *   const createMutation = useMutation({
 *     mutationFn: (data: JangadaForm) => fetch('/api/jangadas', {...})
 *   })
 *   
 *   return { data, isLoading, create: createMutation.mutate }
 * }
 */

// ============================================================================
// PADRÃO 5: ESTRUTURA DE FORMULÁRIOS
// ============================================================================
/*
 * Todo formulário deve:
 * 1. Importar o schema do lib/index.ts
 * 2. Usar useForm com zodResolver
 * 3. Ter inicialização de dados
 * 4. Validar com o schema Zod
 * 
 * EXEMPLO:
 * 
 * import { jangadaSchema, type JangadaForm } from '@/lib'
 * 
 * export function JangadaForm({ initialData }: Props) {
 *   const form = useForm<JangadaForm>({
 *     resolver: zodResolver(jangadaSchema),
 *     defaultValues: initialData || {}
 *   })
 *   
 *   return (
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       {/* ... */}
 *     </form>
 *   )
 * }
 */

// ============================================================================
// PADRÃO 6: MODELOS DE API
// ============================================================================
/*
 * Toda rota API deve:
 * 1. Validar input com o schema Zod
 * 2. Retornar ApiResponse<T>
 * 3. Tratar erros consistentemente
 * 
 * EXEMPLO (src/app/api/jangadas/route.ts):
 * 
 * import { jangadaSchema, type ApiResponse } from '@/lib'
 * 
 * export async function POST(req: Request) {
 *   try {
 *     const body = await req.json()
 *     const validatedData = jangadaSchema.parse(body)
 *     
 *     const result = await prisma.jangada.create({ data: validatedData })
 *     
 *     return Response.json({
 *       data: result,
 *       message: 'Jangada criada com sucesso'
 *     } as ApiResponse<Jangada>)
 *   } catch (error) {
 *     return Response.json(
 *       { error: error.message },
 *       { status: 400 }
 *     )
 *   }
 * }
 */

// ============================================================================
// PADRÃO 7: ESTRUTURA DE PASTAS DE MÓDULOS
// ============================================================================
/*
 * Cada módulo deve ter esta estrutura:
 * 
 * src/app/nomeModulo/
 *   ├── page.tsx                  # Página principal
 *   ├── [id]/
 *   │   └── page.tsx              # Página de detalhes
 *   └── components/
 *       ├── add-form.tsx          # Formulário de adição
 *       ├── edit-form.tsx         # Formulário de edição
 *       ├── list.tsx              # Lista/Tabela
 *       └── detail-card.tsx       # Card de detalhes
 *
 * src/components/nomeModulo/
 *   ├── index.ts                  # Reexporta todos
 *   ├── nome-subcomponent.tsx
 *   └── nome-outro.tsx
 */

// ============================================================================
// PADRÃO 8: ENUMS E CONSTANTES
// ============================================================================
/*
 * Todos os enums e constantes devem estar em lib/jangada-options.ts
 * ou em um arquivo similar para outro módulo
 * 
 * NUNCA defina constantes em componentes!
 * 
 * EXEMPLO:
 * 
 * export const TIPOS_JANGADA = ['SOLAS A', 'SOLAS B', ...] as const
 * export const SISTEMAS_INSUFLACAO = ['THANNER', 'LEAFIELD', ...] as const
 * export const STATUS = ['ativo', 'manutencao', 'inativo'] as const
 */

// ============================================================================
// PADRÃO 9: IMPORTAÇÕES
// ============================================================================
/*
 * Sempre use path aliases:
 * ✅ import { Jangada } from '@/lib'
 * ✅ import { useJangadas } from '@/hooks'
 * ❌ import { Jangada } from '../../../lib/types'
 * ❌ import { useJangadas } from '../../../hooks/use-jangadas'
 */

// ============================================================================
// PADRÃO 10: NOMES DE ARQUIVOS E FUNÇÕES
// ============================================================================
/*
 * Componentes React: PascalCase
 * - exemplo: JangadaForm.tsx, EditJangada.tsx
 * 
 * Funções utilitárias: camelCase
 * - exemplo: calculateCapacity.ts, formatDate.ts
 * 
 * Hooks: use prefixado
 * - exemplo: useJangadas.ts, useQuery.ts
 * 
 * Tipos: PascalCase
 * - exemplo: JangadaForm, ClienteFilters
 * 
 * Constantes: UPPER_SNAKE_CASE
 * - exemplo: TIPOS_JANGADA, STATUS_ATIVO
 */

// ============================================================================
// SINCRONIZAÇÃO DE CAMPOS
// ============================================================================
/*
 * Campos obrigatórios em TODAS as entidades:
 * - id (String @id @default(cuid()))
 * - createdAt (DateTime @default(now()))
 * - updatedAt (DateTime @updatedAt)
 * 
 * Campos de Status padrão:
 * - status (enum: ativo, manutencao, inativo)
 * 
 * Campos de Dados comuns:
 * - dataInspecao (DateTime?)
 * - dataProximaInspecao (DateTime?)
 * - resultado (enum: aprovada, reprovada, pendente)
 * - tecnico (String)
 * - observacoes (String?)
 */

// ============================================================================
// VERIFICAÇÃO DE SINCRONIZAÇÃO
// ============================================================================
/*
 * Para verificar se está sincronizado, use este checklist:
 * 
 * ☐ Prisma schema para a entidade existe
 * ☐ Tipo exportado em lib/types.ts
 * ☐ Schema de validação em lib/validation-schemas.ts
 * ☐ Form interface em lib/types.ts
 * ☐ Hook customizado em src/hooks/
 * ☐ API route em src/app/api/
 * ☐ Página principal em src/app/nomeModulo/
 * ☐ Componentes em src/components/nomeModulo/
 * ☐ Tudo re-exportado em lib/index.ts
 */

// ============================================================================
// EXEMPLO COMPLETO: NOVO MÓDULO
// ============================================================================
/*
 * 1. Adicionar ao Prisma schema:
 *    model MeuModelo {
 *      id String @id @default(cuid())
 *      nome String
 *      status String @default("ativo")
 *      createdAt DateTime @default(now())
 *      updatedAt DateTime @updatedAt
 *      @@map("meu_modulo")
 *    }
 * 
 * 2. Executar: npx prisma migrate dev --name add_meu_modulo
 * 
 * 3. Adicionar tipo em lib/types.ts:
 *    export type MeuModelo = Prisma.MeuModeloGetPayload<Record<string, unknown>>
 * 
 * 4. Adicionar Form interface:
 *    export interface MeuModuloForm {
 *      nome: string
 *      status?: 'ativo' | 'inativo'
 *    }
 * 
 * 5. Adicionar schema em lib/validation-schemas.ts:
 *    export const meuModuloSchema = z.object({
 *      nome: z.string().min(1, 'Nome é obrigatório'),
 *      status: z.enum(['ativo', 'inativo']).optional()
 *    })
 * 
 * 6. Criar hook: src/hooks/use-meu-modulo.ts
 * 
 * 7. Criar API routes: src/app/api/meu-modulo/
 * 
 * 8. Criar páginas: src/app/meu-modulo/
 * 
 * 9. Criar componentes: src/components/meu-modulo/
 * 
 * 10. Re-exportar em lib/index.ts
 */

export const SINCRONIZACAO_DOCUMENTACAO = {
  versao: '1.0.0',
  datacriacao: new Date('2024-02-05'),
  status: 'ativo',
  modulos: [
    'clientes',
    'navios',
    'jangadas',
    'cilindros',
    'stock',
    'inspecoes',
    'agendamento',
    'faturas',
    'logistica',
    'marcas',
    'modelos',
    'obras'
  ]
}
