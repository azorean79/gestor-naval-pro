import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CalendarAgenda({ events, onAddEvent }: { events: any[], onAddEvent: (event: any) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', date: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEvent({ ...form });
    setForm({ title: '', date: '' });
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded shadow p-4 mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold">Agenda / Calendário</h3>
        <Button variant="default" size="sm" onClick={() => setShowForm(true)}>Adicionar Evento</Button>
      </div>
      {showForm && (
        <form className="mb-4 flex gap-2" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Título"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="border rounded p-2"
            required
          />
          <input
            type="date"
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
            className="border rounded p-2"
            required
          />
          <Button type="submit" variant="default" size="sm">Salvar</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
        </form>
      )}
      <ul className="space-y-2">
        {events.map((ev, idx) => (
          <li key={idx} className="flex items-center gap-2 border rounded p-2">
            <span className="font-medium">{ev.title}</span>
            <span className="text-xs text-muted-foreground">{ev.date}</span>
          </li>
        ))}
        {events.length === 0 && <li className="text-muted-foreground">Nenhum evento agendado</li>}
      </ul>
    </div>
  );
}
