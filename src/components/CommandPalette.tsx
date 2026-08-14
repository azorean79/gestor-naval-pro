"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type SearchResult = {
  type: string;
  label: string;
  href: string;
};

const TYPE_ICONS: Record<string, string> = {
  Jangada: "🛟",
  Navio: "🚢",
  Cliente: "👤",
  Colete: "🦺",
  EPIRB: "📡",
  "Ordem de Serviço": "📋",
};

const TYPE_COLORS: Record<string, string> = {
  Jangada: "bg-blue-100 text-blue-700",
  Navio: "bg-cyan-100 text-cyan-700",
  Cliente: "bg-green-100 text-green-700",
  Colete: "bg-orange-100 text-orange-700",
  EPIRB: "bg-purple-100 text-purple-700",
  "Ordem de Serviço": "bg-amber-100 text-amber-700",
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  // Abrir/fechar com Ctrl+K ou Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reset de pesquisa quando o painel abre (padrão React "adjusting state during render")
  if (open) {
    if (query !== "") setQuery("");
    if (results.length !== 0) setResults([]);
    if (selectedIndex !== 0) setSelectedIndex(0);
  }

  // Focus no input quando abre
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Pesquisa com debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    // Cancelar request anterior
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch(`/api/search/global?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setSelectedIndex(0);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => doSearch(query), 250);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, doSearch]);

  // Navegação com teclado
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      navigateTo(results[selectedIndex].href);
    }
  }

  function navigateTo(href: string) {
    setOpen(false);
    router.push(href);
  }

  // Scroll automático para item selecionado
  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;
    const selected = listEl.querySelector(`[data-index="${selectedIndex}"]`);
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!open) return null;

  // Agrupar resultados por tipo
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Painel */}
      <div className="relative w-full max-w-lg mx-4 rounded-xl shadow-2xl border border-white/20 overflow-hidden"
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Input de pesquisa */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pesquisar jangadas, navios, clientes, coletes..."
            className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400 text-sm"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
          <kbd className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-mono bg-gray-100 text-gray-500 rounded border border-gray-200">
            ESC
          </kbd>
        </div>

        {/* Resultados */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto">
          {query.length >= 2 && results.length === 0 && !loading && (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              Nenhum resultado encontrado para &quot;{query}&quot;
            </div>
          )}

          {query.length < 2 && (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">
              <p>Escreva pelo menos 2 caracteres para pesquisar</p>
              <p className="text-xs mt-1 text-gray-300">Jangadas · Navios · Clientes · Coletes · EPIRBs · Ordens de Serviço</p>
            </div>
          )}

          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50">
                {TYPE_ICONS[type] || "📄"} {type} ({items.length})
              </div>
              {items.map((item) => {
                const idx = flatIndex++;
                return (
                  <button
                    key={`${item.type}-${item.href}`}
                    data-index={idx}
                    onClick={() => navigateTo(item.href)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      idx === selectedIndex
                        ? "bg-blue-50 text-blue-900"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded ${TYPE_COLORS[type] || "bg-gray-100 text-gray-600"}`}>
                      {TYPE_ICONS[type] || "📄"}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {idx === selectedIndex && (
                      <kbd className="text-[10px] font-mono text-gray-400">↵</kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50 text-[10px] text-gray-400">
          <div className="flex items-center gap-3">
            <span>↑↓ navegar</span>
            <span>↵ abrir</span>
            <span>esc fechar</span>
          </div>
          <span className="hidden sm:inline">
            <kbd className="px-1 py-0.5 bg-gray-200 rounded text-gray-500 font-mono">Ctrl</kbd>
            +
            <kbd className="px-1 py-0.5 bg-gray-200 rounded text-gray-500 font-mono">K</kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
