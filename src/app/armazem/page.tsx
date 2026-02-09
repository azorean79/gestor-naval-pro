'use client'

import { useState } from 'react'
import { Package, Box, Warehouse } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import StockManagement from '@/components/armazem/stock-management'
import ComponentesManagement from '@/components/armazem/componentes-management'

export default function ArmazemPage() {
  const [activeTab, setActiveTab] = useState('stock')

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Warehouse className="h-8 w-8 text-blue-600" />
            Armazém
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestão integrada de stock e componentes
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="componentes" className="flex items-center gap-2">
            <Box className="h-4 w-4" />
            Componentes
          </TabsTrigger>
        </TabsList>

        {/* Stock Tab */}
        <TabsContent value="stock" className="space-y-4">
          <StockManagement />
        </TabsContent>

        {/* Componentes Tab */}
        <TabsContent value="componentes" className="space-y-4">
          <ComponentesManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
