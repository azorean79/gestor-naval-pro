const fs = require('fs');

const path = 'src/app/agenda/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The file was broken by removing the sidebar rendering. We need to restore it.
// Let's find `handleDesmarcarTodos` and restore from there up to `<main className="flex-1 p-6 overflow-auto bg-slate-50/50">`.

const searchBlock = `  async function handleDesmarcarTodos() {
    if (!window.confirm("Tens a certeza que queres cancelar TODOS os agendamentos activos? Os registos ficam com estado 'Cancelado' para histórico.")) return;
    try {
      const res = await fetch("/api/agenda", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteAll: true }),
      });
      if (!res.ok) throw new Error("Falha na resposta do servidor");
      </aside>`;

const replacementBlock = `  async function handleDesmarcarTodos() {
    if (!window.confirm("Tens a certeza que queres cancelar TODOS os agendamentos activos? Os registos ficam com estado 'Cancelado' para histórico.")) return;
    try {
      const res = await fetch("/api/agenda", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteAll: true }),
      });
      if (!res.ok) throw new Error("Falha na resposta do servidor");
      setEvents(prev => prev.map(ev =>
        /^\\d+$/.test(String(ev.id)) && ['scheduled', 'confirmed'].includes(normalizeEventStatus(ev.status))
          ? { ...ev, status: 'cancelled' }
          : ev
      ));
      refreshOperationalPanels();
    } catch {
      alert("Não foi possível cancelar os agendamentos. Tenta novamente.");
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar: Jangadas prontas a agendar */}
      <aside className="w-80 border-r border-slate-200 bg-white p-5 flex flex-col h-full shadow-sm z-10 relative">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">Prontas a agendar</h2>
          <p className="text-xs text-slate-500 mt-1">
            Arraste para o calendário para agendar.
          </p>
        </div>
        
        <div className="flex-1 overflow-auto space-y-3 pr-2 -mr-2">
          {agendaPanels.serviceStationWaiting.length === 0 && (
             <div className="text-center mt-10">
               <span className="text-3xl">🎉</span>
               <p className="text-sm text-slate-500 mt-2">Sem jangadas pendentes.</p>
             </div>
          )}
          {agendaPanels.serviceStationWaiting.map(raft => {
            const isOverdue = raft.expectedDeliveryDate && new Date(raft.expectedDeliveryDate).getTime() < new Date().getTime();
            
            return (
              <div 
                key={raft.serial}
                draggable
                onDragStart={() => {
                  setExternalDragEvent({
                    id: \`new-\${raft.serial}\`,
                    title: \`Navio: \${raft.shipName} • Jangada: \${raft.label} • Inspeção\`,
                    start: new Date(),
                    end: new Date(),
                    raftSerial: raft.serial,
                    status: 'scheduled',
                  });
                }}
                className={\`bg-white border rounded-xl p-4 shadow-[0_2px_8px_rgb(0,0,0,0.04)] cursor-grab hover:shadow-md transition-all \${isOverdue ? 'border-rose-200 hover:border-rose-300' : 'border-slate-200 hover:border-indigo-300'}\`}
              >
                <div className="font-semibold text-slate-800 text-sm truncate">{raft.shipName}</div>
                <div className="text-xs text-slate-500 mt-1 font-medium bg-slate-50 px-2 py-1 rounded inline-block">Jangada: {raft.label}</div>
                
                {raft.expectedDeliveryDate && (
                  <div className={\`text-xs font-semibold mt-3 \${isOverdue ? 'text-rose-600' : 'text-amber-600'}\`}>
                    Entrega {isOverdue ? 'estava' : ''} prevista para: {formatDate(raft.expectedDeliveryDate)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>`;

if (content.includes(searchBlock)) {
    content = content.replace(searchBlock, replacementBlock);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Fix applied successfully!");
} else {
    console.log("Could not find the target block to replace.");
    console.log(content.substring(content.indexOf('async function handleDesmarcarTodos'), content.indexOf('async function handleDesmarcarTodos') + 500));
}
