import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const DashboardInspecoes: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard de Inspeções</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Conteúdo do dashboard de inspeções aqui.</p>
      </CardContent>
    </Card>
  );
};