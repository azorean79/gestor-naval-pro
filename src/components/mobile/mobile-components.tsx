'use client'

import { ReactNode } from 'react'
import { useDeviceType } from '@/hooks/use-device'
import { cn } from '@/lib/utils'

interface MobileTableProps {
  children: ReactNode
  className?: string
}

export function MobileTable({ children, className }: MobileTableProps) {
  const { isMobile } = useDeviceType()

  if (!isMobile) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <div className="min-w-max">
        {children}
      </div>
    </div>
  )
}

interface MobileCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function MobileCard({ children, className, onClick }: MobileCardProps) {
  const { isMobile } = useDeviceType()

  if (!isMobile) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm",
        onClick && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface MobileGridProps {
  children: ReactNode
  columns?: number
  className?: string
}

export function MobileGrid({ children, columns = 1, className }: MobileGridProps) {
  const { isMobile } = useDeviceType()

  if (!isMobile) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={cn("grid gap-4", `grid-cols-${columns}`, className)}>
      {children}
    </div>
  )
}