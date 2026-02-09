import { regrasLegislacao } from '@/legislacao/regras-legislacao';
import { decretos } from '@/legislacao';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const auditoriaChecklist = [
  {
    id: 'instalacoes',
    titulo: 'Instalações e Equipamentos',
    descricao: 'Verificar se a estação possui instalações adequadas, área de trabalho separada, ventilação, iluminação, equipamentos obrigatórios (bancada, ferramentas, EPI, extintores), conforme Portaria nº1231/95 Art. 2º, 3º e Decreto-Lei nº103/95 Art. 4º.',
    legislacao: ['Portaria nº1231/95 Art. 2º, 3º', 'Decreto-Lei nº103/95 Art. 4º'],
  },
  {
    id: 'tecnicos',
    titulo: 'Qualificação dos Técnicos',
    descricao: 'Conferir se os técnicos possuem formação específica, certificação válida e reciclagem periódica, conforme Portaria nº1231/95 Art. 5º e Decreto-Lei nº103/95 Art. 6º.',
    legislacao: ['Portaria nº1231/95 Art. 5º', 'Decreto-Lei nº103/95 Art. 6º'],
  },
  {
    id: 'procedimentos',
    titulo: 'Procedimentos de Serviço',
    descricao: 'Garantir que todos os procedimentos seguem as normas legais, com registo de cada operação, rastreabilidade e plano de emergência, conforme Portaria nº1231/95 Art. 7º e Decreto-Lei nº103/95 Art. 8º.',
    legislacao: ['Portaria nº1231/95 Art. 7º', 'Decreto-Lei nº103/95 Art. 8º'],
  },
  {
    id: 'registos',
    titulo: 'Registos e Documentação',
    descricao: 'Verificar se todos os registos obrigatórios (livro de registos, certificados, relatórios de vistoria) estão atualizados, disponíveis e arquivados por 5 anos, conforme Portaria nº1231/95 Art. 8º e Decreto-Lei nº103/95 Art. 10º.',
    legislacao: ['Portaria nº1231/95 Art. 8º', 'Decreto-Lei nº103/95 Art. 10º'],
  },
  {
    id: 'vistoria-dgrm',
    titulo: 'Vistoria DGRM',
    descricao: 'Garantir que a estação cumpre todos os requisitos da vistoria da DGRM: documentação obrigatória, instalações em conformidade, técnicos habilitados, registos acessíveis, plano de emergência, periodicidade anual da vistoria, conforme Normas DGRM, Portaria nº1231/95 e Decreto-Lei nº103/95.',
    legislacao: ['Normas DGRM', 'Portaria nº1231/95', 'Decreto-Lei nº103/95'],
  },
  {
    id: 'conformidade',
    titulo: 'Conformidade Geral',
    descricao: 'A estação deve estar em conformidade permanente com toda a legislação aplicável, pronta para auditoria ou vistoria a qualquer momento.',
    legislacao: ['Portaria nº1231/95', 'Decreto-Lei nº103/95'],
  },
];

export default function AuditoriaEstacaoPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Checklist de Auditoria - Estação de Serviço</h1>
      <p className="mb-6 text-muted-foreground">
        Este checklist garante que a estação de serviço está sempre em conformidade com a Portaria nº1231/95 e o Decreto-Lei nº103/95.
      </p>
      {auditoriaChecklist.map((item) => (
        <Card key={item.id} className="mb-4">
          <CardHeader>
            <CardTitle>{item.titulo}</CardTitle>
            <div className="flex gap-2 mt-2">
              {item.legislacao.map((leg, idx) => (
                <Badge key={leg+idx} className="bg-blue-100 text-blue-900">{leg}</Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-gray-700">{item.descricao}</p>
            {/* Futuro: linkar artigos/decretos e exibir texto relevante */}
          </CardContent>
        </Card>
      ))}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Legislação Aplicável</h2>
        {decretos.map((d, i) => (
          <Card key={d.arquivo + i} className="mb-2">
            <CardHeader>
              <CardTitle className="text-base">{d.arquivo}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-xs max-h-40 overflow-auto">{d.texto.slice(0, 1200)}{d.texto.length > 1200 ? '... (ver completo em legislação)' : ''}</pre>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
