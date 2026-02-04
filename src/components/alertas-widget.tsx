'use client'

import { useState } from 'react'
import { Bell, AlertCircle, Info, Trash2, CheckCircle2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useResumoAlertas, useMarcarNotificacaoComoLida, useRemoverNotificacao, useGerarAlertas } from '@/hooks/use-notificacoes'
import { cn } from '@/lib/utils'

export function AlertasWidget() {
  const [expandido, setExpandido] = useState(false)
  const { data: resumo, isLoading: loadingResumo, refetch: refetchResumo } = useResumoAlertas()
  const { mutate: marcarComoLida } = useMarcarNotificacaoComoLida()
  const { mutate: removerNotificacao } = useRemoverNotificacao()
  const { mutate: gerarAlertas, isPending: gerando } = useGerarAlertas()

  if (loadingResumo) {
    return (
      <Card className="p-4 bg-slate-50">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <div className="animate-spin">
            <Bell className="w-4 h-4" />
          </div>
          Carregando alertas...
        </div>
      </Card>
    )
  }

  const temAlertas = (resumo?.totalNaoLidas ?? 0) > 0

  return (
    <div className="space-y-2">
      <Button
        variant={temAlertas ? 'default' : 'outline'}
        className="w-full justify-between"
        onClick={() => setExpandido(!expandido)}
      >
        <div className="flex items-center gap-2">
          <Bell className={cn(
            'w-4 h-4',
            temAlertas && 'text-red-500 animate-pulse'
          )} />
          <span>Alertas</span>
          {temAlertas && (
            <Badge variant="destructive" className="ml-2">
              {resumo?.totalNaoLidas}
            </Badge>
          )}
        </div>
        <span className="text-xs">
          {expandido ? '▼' : '▶'}
        </span>
      </Button>

      {expandido && resumo && (
        <Card className="p-4 space-y-3">
          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-red-50 p-2 rounded border border-red-200">
              <div className="font-semibold text-red-700">
                {resumo.alertasWarning}
              </div>
              <div className="text-xs text-red-600">Avisos Urgentes</div>
            </div>
            <div className="bg-blue-50 p-2 rounded border border-blue-200">
              <div className="font-semibold text-blue-700">
                {resumo.alertasInfo}
              </div>
              <div className="text-xs text-blue-600">Informações</div>
            </div>
          </div>

          {/* Lista de notificações recentes */}
          {resumo.notificacoesRecentes.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <h3 className="text-xs font-semibold text-slate-600">Recentes</h3>
              {resumo.notificacoesRecentes.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    'p-2 rounded border text-xs space-y-1',
                    notif.tipo === 'warning'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-blue-50 border-blue-200'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {notif.tipo === 'warning' ? (
                      <AlertCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Info className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">
                        {notif.titulo}
                      </div>
                      <div className="text-xs text-slate-600">
                        {new Date(notif.dataEnvio).toLocaleString('pt-PT')}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={() => marcarComoLida(notif.id)}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                      onClick={() => removerNotificacao(notif.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {resumo.notificacoesRecentes.length === 0 && (
            <div className="text-center py-4 text-sm text-slate-600">
              ✓ Nenhum alerta no momento
            </div>
          )}

          {/* Botão para gerar alertas manualmente */}
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => gerarAlertas()}
            disabled={gerando}
          >
            <RefreshCw className={cn(
              'w-3 h-3 mr-2',
              gerando && 'animate-spin'
            )} />
            {gerando ? 'Verificando...' : 'Verificar Alertas Agora'}
          </Button>
        </Card>
      )}
    </div>
  )
}
