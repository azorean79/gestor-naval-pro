'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QuadroInspecaoUploadDialog } from '@/components/ui/quadro-inspecao-upload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function QuadroInspecaoPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Importar Quadro de Inspeção</h1>
        <p className="text-gray-600 mt-2">
          Analise e importe automaticamente os dados dos Quadros de Inspeção da Jangada usando IA
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload de Ficheiro</CardTitle>
            <CardDescription>
              Carregue o seu ficheiro Excel do Quadro de Inspeção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuadroInspecaoUploadDialog />
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Formato Esperado</CardTitle>
            <CardDescription>
              O ficheiro deve conter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <p className="font-semibold">Dados Principais:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Número de série</li>
                <li>Marca e modelo</li>
                <li>Lotação</li>
                <li>Número do certificado</li>
                <li>Data de inspeção</li>
              </ul>
            </div>
            <div className="text-sm space-y-2">
              <p className="font-semibold">Componentes:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Interiores com validades</li>
                <li>Exteriores com estados</li>
                <li>Itens do Pack</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades Automáticas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold">✓ Análise com IA</h3>
            <p className="text-sm text-gray-600">
              Extrai automaticamente todos os dados usando Google Gemini
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">✓ Criação de Jangada</h3>
            <p className="text-sm text-gray-600">
              Cria ou atualiza a jangada no sistema
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">✓ Certificado Automático</h3>
            <p className="text-sm text-gray-600">
              Gera certificado com base nos dados da inspeção
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">✓ Sincronização de Stock</h3>
            <p className="text-sm text-gray-600">
              Atualiza automaticamente as quantidades no stock
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">✓ Componentes Categorizados</h3>
            <p className="text-sm text-gray-600">
              Interiores, exteriores e pack com validades
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">✓ Cilindros CO2</h3>
            <p className="text-sm text-gray-600">
              Extrai dados completos dos cilindros e testes
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Como Usar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="list-decimal list-inside space-y-2 text-blue-900">
            <li>Clique em "Importar Quadro de Inspeção"</li>
            <li>Arraste ou selecione o ficheiro Excel do Quadro de Inspeção</li>
            <li>O sistema analisará automaticamente usando IA</li>
            <li>Verifique os dados extraídos (número de série, componentes, etc.)</li>
            <li>Os dados serão importados para a jangada, stock será atualizado</li>
            <li>Um certificado será criado automaticamente</li>
          </ol>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Requisitos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>✓ Ficheiro em formato Excel (.xlsx ou .xls)</p>
          <p>✓ Layout baseado no Quadro de Inspeção da OREY Técnica Naval</p>
          <p>✓ Incluir número de série da jangada</p>
          <p>✓ Listar componentes com estados e validades</p>
          <p>✓ Conexão ativa com a IA (Google Gemini)</p>
        </CardContent>
      </Card>
    </div>
  );
}
