'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Home,
  Anchor,
  Ship,
  Users,
  Package,
  Calendar,
  AlertTriangle,
  Settings,
  Menu,
  X
} from 'lucide-react'
import { useDeviceType } from '@/hooks/use-device'
import { cn } from '@/lib/utils'

interface MobileNavigationProps {
  className?: string
}

const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/jangadas', label: 'Jangadas', icon: Anchor },
  { href: '/navios', label: 'Navios', icon: Ship },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/stock', label: 'Stock', icon: Package },
  { href: '/inspecoes', label: 'Inspeções', icon: Calendar },
  { href: '/alertas', label: 'Alertas', icon: AlertTriangle },
  { href: '/settings', label: 'Config', icon: Settings },
]

export function MobileNavigation({ className }: MobileNavigationProps) {
  const { isMobile } = useDeviceType()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Only show on mobile devices
  if (!isMobile) return null

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700",
        "safe-area-inset-bottom", // iOS safe area
        className
      )}>
        <div className="flex items-center justify-around px-2 py-2">
          {navigationItems.slice(0, 5).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-0",
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              </Link>
            )
          })}

          {/* Menu Button for additional items */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-0 text-gray-600 dark:text-gray-400"
          >
            <Menu className="h-5 w-5" />
            <span className="text-xs font-medium">Mais</span>
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsOpen(false)}>
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-xl p-4 safe-area-inset-bottom">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Menu</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {navigationItems.slice(5).map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full h-16 flex flex-col items-center gap-2",
                        isActive
                          ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950"
                          : "text-gray-600 dark:text-gray-400"
                      )}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Spacer for bottom navigation */}
      <div className="h-20" />
    </>
  )
}