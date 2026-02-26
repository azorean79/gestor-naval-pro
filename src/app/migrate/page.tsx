'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function MigratePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleMigrate = async () => {
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      // Coletar dados do localStorage
      const jangadas = JSON.parse(localStorage.getItem('jangadas_data') || '[]');
      const clientes = JSON.parse(localStorage.getItem('gestor-naval-clientes') || '[]');
      const navios = JSON.parse(localStorage.getItem('navios_data') || '[]');
      const inspecoes = JSON.parse(localStorage.getItem('inspecoes_data') || '[]');

      console.log('Dados coletados:', {
        jangadas: jangadas.length,
        clientes: clientes.length,
        navios: navios.length,
        inspecoes: inspecoes.length
      });

      // Enviar para a API
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jangadas,
          clientes,
          navios,
          inspecoes
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage('Migração concluída com sucesso! Os dados foram transferidos do localStorage para o banco de dados.');
      } else {
        setError(result.error || 'Erro na migração');
      }

    } catch (err) {
      console.error('Erro:', err);
      setError('Erro ao executar migração: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Migração de Dados</CardTitle>
          <CardDescription>
            Migrar dados do localStorage para o banco de dados Prisma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Esta ferramenta irá transferir todos os dados armazenados localmente (jangadas, clientes, navios, inspeções)
            para o banco de dados permanente. Após a migração, os dados estarão seguros e persistentes.
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleMigrate}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Migrando...' : 'Iniciar Migração'}
            </Button>
          </div>

          {message && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}