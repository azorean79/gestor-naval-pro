import { Card } from '@/components/ui/card';
import { useAgendamentos } from '@/hooks/use-agendamentos';
import { useJangadas } from '@/hooks/use-jangadas';
import { useTecnico } from '@/hooks/use-tecnico';
import { useEffect, useState } from 'react';

export default function Dashboard() {
        // Agenda/calendário
        const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
        const CalendarAgenda = require('@/components/calendar-agenda').CalendarAgenda;
        const handleAddEvent = (event: any) => setCalendarEvents(prev => [...prev, event]);

  // ...existing code...

  const { data: agendamentosResponse } = useAgendamentos();
  const { data: jangadasResponse } = useJangadas();
  const { tecnico } = useTecnico();
  const { data: naviosResponse } = require('@/hooks/use-navios')();

  const agendamentos = Array.isArray(agendamentosResponse?.data)
    ? agendamentosResponse.data
    : [];
  const jangadas = Array.isArray(jangadasResponse?.data)
    ? jangadasResponse.data
    : [];
  const navios = Array.isArray(naviosResponse?.data)
    ? naviosResponse.data
    : [];

  // KPIs
  const totalAgendamentos = agendamentos.length;
  const totalJangadas = jangadas.length;
  const inspecoesPendentes = agendamentos.filter((a: any) => a.status === 'agendado').length;
  const inspecoesFinalizadas = agendamentos.filter((a: any) => a.status === 'finalizado').length;
  const inspecoesUrgentes = agendamentos.filter((a: any) => a.prioridade === 'urgente').length;
  const agendamentosTecnico = agendamentos.filter((a: any) => a.responsavel === tecnico);

  // Tendência de inspeções por mês (exemplo)
  const meses = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const inspecoesPorMes = Array(12).fill(0);
  agendamentos.forEach((a: any) => {
    if (a.data) {
      const d = new Date(a.data);
      const m = d.getMonth();
      inspecoesPorMes[m]++;
    }
  });

  // Notificações automáticas para inspeções
  const hoje = new Date();
  const notificacoes = jangadas
    .filter((j: any) => j.dataProximaInspecao)
    .map((j: any) => {
      const dataProxima = new Date(j.dataProximaInspecao);
      const diffDias = Math.ceil((dataProxima.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: j.id,
        numeroSerie: j.numeroSerie,
        diasRestantes: diffDias,
        dataProxima: j.dataProximaInspecao,
        status: diffDias < 0 ? 'vencida' : diffDias <= 30 ? 'proxima' : 'ok',
      };
    })
    .filter((n: { status: string }) => n.status !== 'ok');

  const kpiData = [
    { label: 'Agendamentos', value: totalAgendamentos },
    { label: 'Jangadas', value: totalJangadas },
    { label: 'Inspeções Pendentes', value: inspecoesPendentes },
    { label: 'Inspeções Finalizadas', value: inspecoesFinalizadas },
    { label: 'Urgentes', value: inspecoesUrgentes },
  ];
  const [filtroIlha, setFiltroIlha] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const ilhas = Array.from(new Set(navios.map((n: any) => n.ilha ? String(n.ilha) : 'Desconhecida')));
  const tipos: string[] = Array.from(new Set(navios.map((n: any) => n.tipo ? String(n.tipo) : 'Desconhecido')));
  const naviosFiltrados = navios.filter((n: any) =>
    (!filtroIlha || n.ilha === filtroIlha) && (!filtroTipo || n.tipo === filtroTipo)
  );


  // Busca global
  const [globalSearch, setGlobalSearch] = useState('');
  const filteredNavios = navios.filter((n: any) =>
    n.nome?.toLowerCase().includes(globalSearch.toLowerCase()) ||
    n.matricula?.toLowerCase().includes(globalSearch.toLowerCase()) ||
    n.imo?.toLowerCase().includes(globalSearch.toLowerCase())
  );
  const filteredJangadas = jangadas.filter((j: any) =>
    j.numeroSerie?.toLowerCase().includes(globalSearch.toLowerCase()) ||
    j.tipo?.toLowerCase().includes(globalSearch.toLowerCase()) ||
    j.marca?.nome?.toLowerCase().includes(globalSearch.toLowerCase()) ||
    j.modelo?.nome?.toLowerCase().includes(globalSearch.toLowerCase())
  );
  const filteredAgendamentos = agendamentos.filter((a: any) =>
    a.status?.toLowerCase().includes(globalSearch.toLowerCase()) ||
    a.responsavel?.toLowerCase().includes(globalSearch.toLowerCase())
  );

  // Renderizar busca global
  // ...existing code...
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <input
            type="text"
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
            placeholder="Buscar navios, jangadas, inspeções, componentes..."
            className="w-full p-3 rounded border border-gray-300 shadow-sm"
          />
        </div>
        {globalSearch && (
          <div className="mb-8">
            <h3 className="font-semibold mb-2">Resultados da Busca</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Navios</h4>
                <ul className="list-disc ml-6">
                  {filteredNavios.map((n: any) => (
                    <li key={n.id}>{n.nome} ({n.matricula})</li>
                  ))}
                  {filteredNavios.length === 0 && <li className="text-muted-foreground">Nenhum navio encontrado</li>}
                </ul>
              </div>
              <div>
                <h4 className="font-medium">Jangadas</h4>
                <ul className="list-disc ml-6">
                  {filteredJangadas.map((j: any) => (
                    <li key={j.id}>{j.numeroSerie} ({j.tipo})</li>
                  ))}
                  {filteredJangadas.length === 0 && <li className="text-muted-foreground">Nenhuma jangada encontrada</li>}
                </ul>
              </div>
              <div>
                <h4 className="font-medium">Inspeções</h4>
                <ul className="list-disc ml-6">
                  {filteredAgendamentos.map((a: any) => (
                    <li key={a.id}>{a.status} ({a.responsavel})</li>
                  ))}
                  {filteredAgendamentos.length === 0 && <li className="text-muted-foreground">Nenhuma inspeção encontrada</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
        {/* Notificações de inspeções */}
        {notificacoes.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold mb-2">Notificações de Inspeções</h3>
            <ul className="space-y-2">
              {notificacoes.map((n: any) => (
                <li key={n.id} className={`p-3 rounded border ${n.status === 'vencida' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}`}>
                  <span className="font-medium">Jangada {n.numeroSerie}</span> - Próxima inspeção: <span>{n.dataProxima}</span>
                  {n.status === 'vencida' ? (
                    <span className="ml-2 text-red-600 font-bold">Inspeção vencida!</span>
                  ) : (
                    <span className="ml-2 text-yellow-600 font-semibold">Faltam {n.diasRestantes} dias</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Gráficos de KPIs */}
        <div className="mb-8">
          <h3 className="font-semibold mb-2">KPIs</h3>
          <div className="flex gap-4">
            {kpiData.map(kpi => (
              <div key={kpi.label} className="p-4 rounded bg-blue-50 border border-blue-200 min-w-[120px] text-center">
                <div className="text-lg font-bold text-blue-700">{kpi.value}</div>
                <div className="text-xs text-blue-900">{kpi.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de tendência de inspeções */}
        <div className="mb-8">
          <h3 className="font-semibold mb-2">Tendência de Inspeções (por mês)</h3>
          <svg width="100%" height="120" viewBox="0 0 600 120">
            {inspecoesPorMes.map((v, i) => (
              <rect
                key={i}
                x={i * 50 + 20}
                y={120 - v * 10}
                width={30}
                height={v * 10}
                fill="#3b82f6"
              />
            ))}
            {meses.map((m, i) => (
              <text
                key={m}
                x={i * 50 + 35}
                y={115}
                fontSize="12"
                textAnchor="middle"
                fill="#374151"
              >{m}</text>
            ))}
          </svg>
        </div>
        <CalendarAgenda events={calendarEvents} onAddEvent={handleAddEvent} />
        {/* ...restante do dashboard... */}
      </div>
    </div>
  );
  const DashboardNaviosBar = require('./dashboard-navios-bar').default;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-6">
        <Card className="p-4 flex flex-col items-center animate-fade-in">
          <div className="text-2xl font-bold text-blue-700">{totalAgendamentos}</div>
          <div className="text-sm text-gray-600">Agendamentos Totais</div>
        </Card>
        <Card className="p-4 flex flex-col items-center animate-fade-in">
          <div className="text-2xl font-bold text-green-700">{totalJangadas}</div>
          <div className="text-sm text-gray-600">Jangadas Totais</div>
        </Card>
        <Card className="p-4 flex flex-col items-center animate-fade-in">
          <div className="text-2xl font-bold text-orange-700">{inspecoesPendentes}</div>
          <div className="text-sm text-gray-600">Inspeções Pendentes</div>
        </Card>
        <Card className="p-4 flex flex-col items-center animate-fade-in">
          <div className="text-2xl font-bold text-gray-700">{inspecoesFinalizadas}</div>
          <div className="text-sm text-gray-600">Inspeções Finalizadas</div>
        </Card>
        <Card className="p-4 flex flex-col items-center animate-fade-in">
          <div className="text-2xl font-bold text-red-700">{inspecoesUrgentes}</div>
          <div className="text-sm text-gray-600">Inspeções Urgentes</div>
        </Card>
        <Card className="p-4 flex flex-col items-center animate-fade-in">
          <div className="text-2xl font-bold text-blue-700">{agendamentosTecnico.length}</div>
          <div className="text-sm text-gray-600">Agendamentos do Técnico</div>
        </Card>
      </div>

      {/* Filtros dinâmicos */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <label className="font-medium">Filtrar por Ilha:</label>
        <select value={filtroIlha} onChange={e => setFiltroIlha(e.target.value)} className="border rounded px-2 py-1">
          <option value="">Todas</option>
          {ilhas.map(ilha => (
            <option key={String(ilha)} value={String(ilha)}>{String(ilha)}</option>
          ))}
        </select>
        <label className="font-medium">Filtrar por Tipo de Pesca:</label>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="border rounded px-2 py-1">
          <option value="">Todos</option>
          {(tipos as string[]).map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>
      </div>

      {/* DashboardNaviosBar integrado */}
      <DashboardNaviosBar navios={naviosFiltrados} jangadas={jangadas} />
    </div>
  );
}
