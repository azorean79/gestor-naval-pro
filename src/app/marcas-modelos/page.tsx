'use client'

import { useState } from 'react'
import { Package, Tag, Layers } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MarcasManagement from '@/components/marcas-modelos/marcas-management'
import ModelosManagement from '@/components/marcas-modelos/modelos-management'

export default function MarcasModelosPage() {
  const [activeTab, setActiveTab] = useState('marcas')

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Layers className="h-8 w-8 text-purple-600" />
            Marcas e Modelos
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestão integrada de marcas e modelos de jangadas
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="marcas" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Marcas
          </TabsTrigger>
          <TabsTrigger value="modelos" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Modelos
          </TabsTrigger>
        </TabsList>

        {/* Marcas Tab */}
        <TabsContent value="marcas" className="space-y-4">
          <MarcasManagement />
        </TabsContent>

        {/* Modelos Tab */}
        <TabsContent value="modelos" className="space-y-4">
          <ModelosManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
