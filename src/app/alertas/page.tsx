'use client'

import { useState } from 'react'
import { AlertCircle, Info, CheckCircle2, Trash2, RefreshCw, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNotificacoes, useMarcarNotificacaoComoLida, useRemoverNotificacao, useGerarAlertas } from '@/hooks/use-notificacoes'
import { cn } from '@/lib/utils'

export default function AlertasPage() {
  const [tipo, setTipo] = useState<string | undefined>()
  const [lida, setLida] = useState<string>('false')
  const [search, setSearch] = useState('')

  const { data: notificacoesResponse = { data: [] }, isLoading, isFetching } = useNotificacoes({
    tipo: tipo === 'todas' ? undefined : tipo,
    lida: lida === 'todas' ? undefined : lida === 'true'
  })

  const notificacoes = notificacoesResponse?.data || []

  const { mutate: marcarComoLida } = useMarcarNotificacaoComoLida()
  const { mutate: removerNotificacao } = useRemoverNotificacao()
  const { mutate: gerarAlertas, isPending: gerando } = useGerarAlertas()

  const notificacoesFiltradas = notificacoes.filter(n =>
    !search || n.titulo.toLowerCase().includes(search.toLowerCase()) ||
    n.mensagem.toLowerCase().includes(search.toLowerCase())
  )

  const totalWarnings = notificacoes.filter(n => n.tipo === 'warning' && !n.lida).length
  const totalInfos = notificacoes.filter(n => n.tipo === 'info' && !n.lida).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Alertas e Notificações</h1>
        <p className="text-slate-600 mt-1">
          Gestão centralizada de alertas do sistema
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-2xl font-bold text-red-700">{totalWarnings}</div>
              <div className="text-sm text-red-600 mt-1">Avisos Urgentes</div>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-700">{totalInfos}</div>
              <div className="text-sm text-blue-600 mt-1">Informações</div>
            </div>
            <Info className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-2xl font-bold text-green-700">
                {notificacoes.filter(n => n.lida).length}
              </div>
              <div className="text-sm text-green-600 mt-1">Lidas</div>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Controles */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => gerarAlertas()}
            disabled={gerando}
          >
            <RefreshCw className={cn(
              'w-4 h-4 mr-2',
              gerando && 'animate-spin'
            )} />
            {gerando ? 'Verificando...' : 'Verificar Agora'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            placeholder="Buscar por título ou mensagem..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select value={tipo || 'todas'} onValueChange={(v) => setTipo(v === 'todas' ? undefined : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de alerta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos os tipos</SelectItem>
              <SelectItem value="warning">Avisos</SelectItem>
              <SelectItem value="info">Informações</SelectItem>
              <SelectItem value="error">Erros</SelectItem>
              <SelectItem value="success">Sucessos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={lida} onValueChange={setLida}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">Não Lidas</SelectItem>
              <SelectItem value="true">Lidas</SelectItem>
              <SelectItem value="todas">Todas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Lista de notificações */}
      <div className="space-y-2">
        {isLoading ? (
          <Card className="p-8 text-center">
            <div className="text-slate-600">Carregando alertas...</div>
          </Card>
        ) : notificacoesFiltradas.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-slate-600">
              {notificacoes.length === 0
                ? '✓ Nenhum alerta no momento'
                : 'Nenhum alerta corresponde aos filtros'}
            </div>
          </Card>
        ) : (
          notificacoesFiltradas.map((notif) => (
            <Card
              key={notif.id}
              className={cn(
                'p-4 transition-opacity cursor-pointer hover:shadow-md',
                !notif.lida && 'border-l-4',
                notif.tipo === 'warning'
                  ? 'bg-red-50 border-red-400'
                  : notif.tipo === 'info'
                    ? 'bg-blue-50 border-blue-400'
                    : 'bg-slate-50'
              )}
              onClick={() => !notif.lida && marcarComoLida(notif.id)}
            >
              <div className="flex items-start gap-3">
                {/* Ícone */}
                <div className="flex-shrink-0 mt-1">
                  {notif.tipo === 'warning' ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : notif.tipo === 'info' ? (
                    <Info className="w-5 h-5 text-blue-600" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                </div>

                {/* Conteúdo */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">
                      {notif.titulo}
                    </h3>
                    {!notif.lida && (
                      <Badge variant="default" className="text-xs">
                        Novo
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 mb-2">
                    {notif.mensagem}
                  </p>
                  
                  {/* Detalhes contextuais */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {notif.navio && (
                      <Badge variant="outline" className="text-xs">
                        Navio: {notif.navio.nome}
                      </Badge>
                    )}
                    {notif.jangada && (
                      <Badge variant="outline" className="text-xs">
                        Jangada: {notif.jangada.numeroSerie}
                      </Badge>
                    )}
                    {notif.cilindro && (
                      <Badge variant="outline" className="text-xs">
                        Cilindro: {notif.cilindro.numeroSerie}
                      </Badge>
                    )}
                  </div>

                  {/* Data e ações */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {new Date(notif.dataEnvio).toLocaleString('pt-PT')}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (notif.lida) {
                            // marcar como não lida
                          } else {
                            marcarComoLida(notif.id)
                          }
                        }}
                      >
                        {notif.lida ? 'Desmarcar' : 'Marcar como lida'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs text-red-600 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          removerNotificacao(notif.id)
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Informações de disponibilidade automática */}
      <Card className="p-4 bg-slate-50 border-slate-200">
        <h3 className="font-semibold text-sm mb-2">ℹ️ Sobre os Alertas Automáticos</h3>
        <ul className="text-sm text-slate-700 space-y-1">
          <li>
            • <strong>Cilindros:</strong> Avisos com 30 dias de antecedência do vencimento do teste hidráulico
          </li>
          <li>
            • <strong>Stock Baixo:</strong> Quando quantidade está abaixo do mínimo estabelecido
          </li>
          <li>
            • <strong>Inspeções:</strong> Lembretes 7 dias antes das inspeções programadas
          </li>
          <li>
            • <strong>Atualização:</strong> Sistema verifica automaticamente a cada 30 segundos
          </li>
        </ul>
      </Card>
    </div>
  )
}
