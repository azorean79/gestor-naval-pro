
import { Card } from '@/components/ui/card';

interface Navio {
  id: string;
  nome: string;
  ilha?: string;
  tipo?: string;
}
interface Jangada {
  id: string;
  navioId?: string;
  dataProximaInspecao?: string;
}

function getBarData(groups: Record<string, Navio[]>, jangadas: Jangada[]) {
  return Object.entries(groups).map(([label, navios]) => {
    // Para cada navio, verifica se tem jangada associada e se a inspeção está válida
    const naviosInfo = navios.map(n => {
      const jangadasNavio = jangadas.filter(j => j.navioId === n.id);
      if (jangadasNavio.length === 0) return { ...n, status: 'sem-jangada' };
      // Inspeção válida: dataProximaInspecao futura
      const hasValid = jangadasNavio.some(j => j.dataProximaInspecao && new Date(j.dataProximaInspecao) > new Date());
      return { ...n, status: hasValid ? 'valid' : 'invalid' };
    });
    return {
      label,
      value: navios.length,
      naviosInfo,
    };
  });
}

export default function DashboardNaviosBar({ navios, jangadas }: { navios: Navio[]; jangadas: Jangada[] }) {
  // Agrupar por ilha
  const naviosPorIlha: Record<string, Navio[]> = {};
  navios.forEach(n => {
    const ilha = n.ilha || 'Desconhecida';
    if (!naviosPorIlha[ilha]) naviosPorIlha[ilha] = [];
    naviosPorIlha[ilha].push(n);
  });

  // Agrupar por tipo de pesca
  const naviosPorTipo: Record<string, Navio[]> = {};
  navios.forEach(n => {
    const tipo = n.tipo || 'Desconhecido';
    if (!naviosPorTipo[tipo]) naviosPorTipo[tipo] = [];
    naviosPorTipo[tipo].push(n);
  });

  const ilhaBarData = getBarData(naviosPorIlha, jangadas);
  const tipoBarData = getBarData(naviosPorTipo, jangadas);

  // Cores: verde = inspeção válida, vermelho = inválida, cinza = sem jangada
  const getColor = (status: string) => {
    if (status === 'valid') return 'bg-green-600';
    if (status === 'invalid') return 'bg-red-600';
    return 'bg-gray-400';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
      <Card className="p-4 animate-fade-in">
        <div className="text-lg font-bold mb-2 text-blue-700">Navios por Ilha (Barras)</div>
        <div className="space-y-2">
          {ilhaBarData.map(({ label, naviosInfo }) => (
            <div key={label} className="mb-2">
              <div className="font-semibold text-blue-900 mb-1">{label}</div>
              {naviosInfo.map(n => (
                <div key={n.id} className="flex items-center gap-2 mb-1">
                  <div className="w-32 text-xs font-semibold">{n.nome}</div>
                  <div className={`h-4 w-16 rounded ${getColor(n.status)}`}></div>
                  <span className="text-xs">
                    {n.status === 'valid' && 'Inspeção válida'}
                    {n.status === 'invalid' && 'Inspeção vencida'}
                    {n.status === 'sem-jangada' && 'Sem jangada'}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-4 animate-fade-in">
        <div className="text-lg font-bold mb-2 text-green-700">Navios por Tipo de Pesca (Barras)</div>
        <div className="space-y-2">
          {tipoBarData.map(({ label, naviosInfo }) => (
            <div key={label} className="mb-2">
              <div className="font-semibold text-green-900 mb-1">{label}</div>
              {naviosInfo.map(n => (
                <div key={n.id} className="flex items-center gap-2 mb-1">
                  <div className="w-32 text-xs font-semibold">{n.nome}</div>
                  <div className={`h-4 w-16 rounded ${getColor(n.status)}`}></div>
                  <span className="text-xs">
                    {n.status === 'valid' && 'Inspeção válida'}
                    {n.status === 'invalid' && 'Inspeção vencida'}
                    {n.status === 'sem-jangada' && 'Sem jangada'}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
