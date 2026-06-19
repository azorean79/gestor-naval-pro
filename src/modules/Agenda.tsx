// Módulo de Agenda de Inspeções

"use client";
import { useEffect, useState } from "react";

export type InspectionEvent = {
  id?: number;
  raftSerial: string;
  title: string;
  date: string;
  type: "Inspeção" | "Próxima Inspeção";
};

export default function Agenda() {
  const [events, setEvents] = useState<InspectionEvent[]>([]);

  // Função para adicionar evento com autosave
  function addEvent(event: InspectionEvent) {
    setEvents(prev => {
      const updated = [...prev, event];
      // Autosave no backend
      fetch("/api/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      localStorage.setItem("agenda", JSON.stringify(updated));
      return updated;
    });
  }

  useEffect(() => {
    const stored = localStorage.getItem("agenda");
    if (stored) setEvents(JSON.parse(stored));
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Agenda de Inspeções</h2>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
        onClick={() => {
          // Exemplo de cadastro rápido
          const newEvent: InspectionEvent = {
            id: Date.now(),
            raftSerial: "Jangada Exemplo",
            title: "Inspeção Exemplo",
            date: new Date().toISOString().slice(0, 10),
            type: "Inspeção",
          };
          addEvent(newEvent);
        }}
      >Cadastrar Evento Exemplo</button>
      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-blue-100">
            <th className="p-2">Jangada</th>
            <th className="p-2">Tipo</th>
            <th className="p-2">Data</th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 && (
            <tr><td colSpan={3} className="text-center p-4 text-gray-400">Nenhum evento agendado.</td></tr>
          )}
          {events.map((ev) => (
            <tr key={ev.id} className="border-t">
              <td className="p-2">{ev.raftSerial}</td>
              <td className="p-2">{ev.type}</td>
              <td className="p-2">{ev.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
