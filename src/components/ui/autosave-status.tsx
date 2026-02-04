import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AutoSaveStatusProps {
  isSaving: boolean
  hasUnsavedChanges: boolean
  error: Error | null
  lastSaved: Date | null
  className?: string
}

export function AutoSaveStatus({
  isSaving,
  hasUnsavedChanges,
  error,
  lastSaved,
  className
}: AutoSaveStatusProps) {
  if (error) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-sm text-red-600",
        className
      )}>
        <AlertCircle className="h-4 w-4" />
        <span>Erro ao salvar</span>
      </div>
    )
  }

  if (isSaving) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-sm text-blue-600",
        className
      )}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Salvando...</span>
      </div>
    )
  }

  if (lastSaved && !hasUnsavedChanges) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-sm text-green-600",
        className
      )}>
        <CheckCircle className="h-4 w-4" />
        <span>
          Salvo {lastSaved.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
    )
  }

  if (hasUnsavedChanges) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-sm text-orange-600",
        className
      )}>
        <Loader2 className="h-4 w-4 animate-pulse" />
        <span>Não salvo</span>
      </div>
    )
  }

  return null
}