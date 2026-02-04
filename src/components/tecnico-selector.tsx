'use client';

import { useTecnico, Tecnico } from '@/hooks/use-tecnico';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function TecnicoSelector() {
  const { tecnico, changeTecnico } = useTecnico();

  const tecnicos: Tecnico[] = ['Julio Correia', 'Alex Santos'];

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Técnico Atual</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span>Técnico:</span>
          <Badge variant="secondary" className="text-sm">
            {tecnico}
          </Badge>
        </div>

        <div className="flex gap-2">
          {tecnicos.map((nomeTecnico) => (
            <Button
              key={nomeTecnico}
              variant={tecnico === nomeTecnico ? "default" : "outline"}
              size="sm"
              onClick={() => changeTecnico(nomeTecnico)}
              className="flex-1"
            >
              {nomeTecnico}
            </Button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          Selecione o técnico para visualizar apenas os dados associados a ele.
        </p>
      </CardContent>
    </Card>
  );
}