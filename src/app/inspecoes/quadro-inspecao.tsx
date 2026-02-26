import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const QuadroInspecao: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quadro de Inspeção</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Conteúdo do quadro de inspeção aqui.</p>
      </CardContent>
    </Card>
  );
};