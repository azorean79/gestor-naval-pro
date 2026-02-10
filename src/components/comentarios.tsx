import { useState } from 'react';
import { Card } from '@/components/ui/card';

export interface Comentario {
  id: string;
  autor: string;
  texto: string;
  data: string;
}

export function Comentarios({ comentarios, onAdd }: { comentarios: Comentario[]; onAdd: (texto: string) => void }) {
  const [novoComentario, setNovoComentario] = useState('');

  return (
    <Card className="p-4 mb-4">
      <div className="font-bold mb-2">Comentários</div>
      <div className="space-y-2 mb-4">
        {comentarios.length === 0 && <div className="text-sm text-gray-500">Nenhum comentário ainda.</div>}
        {comentarios.map(c => (
          <div key={c.id} className="bg-gray-100 rounded p-2">
            <div className="text-xs text-gray-700 font-semibold">{c.autor} <span className="text-gray-400">({new Date(c.data).toLocaleString()})</span></div>
            <div className="text-sm text-gray-900 mt-1">{c.texto}</div>
          </div>
        ))}
      </div>
      <form
        onSubmit={e => {
          e.preventDefault();
          if (novoComentario.trim()) {
            onAdd(novoComentario);
            setNovoComentario('');
          }
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={novoComentario}
          onChange={e => setNovoComentario(e.target.value)}
          placeholder="Escreva um comentário..."
          className="flex-1 border rounded px-2 py-1"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">Enviar</button>
      </form>
    </Card>
  );
}
