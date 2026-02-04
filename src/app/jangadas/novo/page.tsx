'use client'

import { JangadaFormQuick } from '@/components/jangadas/jangada-form-quick'

export default function NovaJangadaPage() {
  return (
    <div className="container mx-auto py-6">
      <JangadaFormQuick />
    </div>
  )
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'