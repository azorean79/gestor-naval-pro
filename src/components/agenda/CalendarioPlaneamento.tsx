import { useState } from "react";
import { useUpdateJangada } from "@/hooks/use-jangadas";
import { toast } from "sonner";
// Tipagem básica de evento
export interface EventoAgenda {
  id: string;
  titulo: string;
  tipo: string;
  data: string; // yyyy-mm-dd
  hora: string; // HH:mm
  local: string;
  responsavel: string;
  status: string;
  prioridade: string;
  descricao: string;
}
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Card, CardContent } from "../ui/card";
import { Calendar } from "../ui/calendar";
import { Button } from "../ui/button";
import { formatDate } from "@/lib/formatDate";


function DiaView({ date, eventos }: { date: Date; eventos: EventoAgenda[] }) {
  const dataStr = date.toISOString().split('T')[0];
  const eventosDia = eventos.filter(e => e.data === dataStr);
  const [editando, setEditando] = useState<string | null>(null);
  const [novaData, setNovaData] = useState<string>("");
  const [novaHora, setNovaHora] = useState<string>("");
  const updateJangada = useUpdateJangada();
  const handleSalvar = (ev: EventoAgenda) => {
    // Extrair o id real da jangada do id do evento
    const match = ev.id.match(/^inspecao-jangada-(.+)$/);
    const jangadaId = match ? match[1] : null;
    if (!jangadaId) {
      toast.error("ID da jangada não encontrado.");
      setEditando(null);
      return;
    }
    const novaDataHora = novaData + (novaHora ? `T${novaHora}:00` : "T09:00:00");
    updateJangada.mutate(
      { id: jangadaId, data: { proximaInspecao: novaDataHora } },
      {
        onSuccess: () => {
          toast.success("Data da próxima inspeção atualizada!");
          setEditando(null);
        },
        onError: () => {
          toast.error("Erro ao atualizar inspeção.");
        },
      }
    );
  };
  return (
    <div>
      <h3 className="font-semibold mb-2">Eventos do dia {formatDate(date)}</h3>
      {eventosDia.length === 0 ? (
        <div className="text-gray-500">Nenhum evento para este dia.</div>
      ) : (
        <ul className="space-y-2">
          {eventosDia.map(ev => (
            <li key={ev.id} className="border rounded p-2 flex flex-col">
              <span className="font-medium">{ev.titulo}</span>
              <span className="text-xs text-gray-500">{ev.hora} • {ev.local}</span>
              <span className="text-xs">{ev.tipo} • {ev.status} • {ev.prioridade}</span>
              {ev.tipo === 'Inspeção Jangada' && (
                editando === ev.id ? (
                  <div className="flex flex-col gap-2 mt-2">
                    <input
                      type="date"
                      value={novaData}
                      onChange={e => setNovaData(e.target.value)}
                      className="border rounded px-2 py-1"
                    />
                    <input
                      type="time"
                      value={novaHora}
                      onChange={e => setNovaHora(e.target.value)}
                      className="border rounded px-2 py-1"
                    />
                    <div className="flex gap-2">
                      <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={() => handleSalvar(ev)}>
                        Salvar
                      </button>
                      <button className="bg-gray-300 px-2 py-1 rounded" onClick={() => setEditando(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="mt-2 bg-blue-100 text-blue-800 px-2 py-1 rounded w-max" onClick={() => { setEditando(ev.id); setNovaData(ev.data); setNovaHora(ev.hora); }}>
                    Editar Inspeção
                  </button>
                )
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SemanaView({ date, eventos }: { date: Date; eventos: EventoAgenda[] }) {
  // Pega o domingo anterior/igual
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  return (
    <div>
      <h3 className="font-semibold mb-2">Semana de {formatDate(dias[0])} a {formatDate(dias[6])}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {dias.map(dia => (
            <div key={dia.toISOString()} className="border rounded p-2">
            <span className="font-semibold">{formatDate(dia)}</span>
            <DiaView date={dia} eventos={eventos} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MesView({ date, eventos }: { date: Date; eventos: EventoAgenda[] }) {
  const ano = date.getFullYear();
  const mes = date.getMonth();
  // Todos os dias do mês
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const dias = Array.from({ length: diasNoMes }, (_, i) => new Date(ano, mes, i + 1));
  return (
    <div>
      <h3 className="font-semibold mb-2">Eventos de {date.toLocaleString('default', { month: 'long' })} {ano}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {dias.map(dia => (
          <div key={dia.toISOString()} className="border rounded p-2">
            <span className="font-semibold">{dia.getDate()}</span>
            <DiaView date={dia} eventos={eventos} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarioPlaneamento({ eventos = [] }: { eventos: EventoAgenda[] }) {
  const [tab, setTab] = useState("mes");
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <Card>
      <CardContent className="p-4">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="dia">Diário</TabsTrigger>
            <TabsTrigger value="semana">Semanal</TabsTrigger>
            <TabsTrigger value="mes">Mensal</TabsTrigger>
          </TabsList>
          <div className="flex gap-8">
            <div>
              <Calendar
                mode="single"
                required
                selected={selectedDate}
                onSelect={date => setSelectedDate(date ?? new Date())}
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => setSelectedDate(new Date())}>Hoje</Button>
              </div>
            </div>
            <div className="flex-1">
              <TabsContent value="dia">
                <DiaView date={selectedDate} eventos={eventos} />
              </TabsContent>
              <TabsContent value="semana">
                <SemanaView date={selectedDate} eventos={eventos} />
              </TabsContent>
              <TabsContent value="mes">
                <MesView date={selectedDate} eventos={eventos} />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
