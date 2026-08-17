"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BellRing, CheckCircle2, AlertCircle, Loader2, Send, PencilLine,
  RefreshCcw, Settings, X, MessageSquare, Mail, ShieldCheck,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/date-utils";

type LembretePendente = {
  faturaId: number;
  tipo: "primeiro" | "segundo";
  criadoEm: string;
  mensagem: string;
  telefone: string;
  email: string;
  numeroFatura: string;
  numeroOrdem: string | null;
  clienteNome: string;
  valorTotal: number;
  dataEmissao: string | null;
  dataVencimento: string | null;
  pagamentoStatus: string;
};

type ConfigCobranca = {
  enabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  linkPublico: boolean;
  diasPrimeiroLembrete: number;
  diasSegundoLembrete: number;
  diasVencimento: number;
  smsTemplate: string;
  emailSubject: string;
};

const DEFAULT_CONFIG: ConfigCobranca = {
  enabled: true,
  smsEnabled: true,
  emailEnabled: true,
  linkPublico: true,
  diasPrimeiroLembrete: 15,
  diasSegundoLembrete: 35,
  diasVencimento: 30,
  smsTemplate: "",
  emailSubject: "Lembrete de pagamento — Fatura {numeroFatura}",
};

const PAGAMENTO_BADGE_CLASSES: Record<string, string> = {
  Pendente: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "Pago Parcialmente": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Pago: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Vencido: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

export default function CobrancasPage() {
  const [pendentes, setPendentes] = useState<LembretePendente[]>([]);
  const [config, setConfig] = useState<ConfigCobranca>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [editando, setEditando] = useState<LembretePendente | null>(null);
  const [editText, setEditText] = useState("");
  const [editSms, setEditSms] = useState(true);
  const [editEmail, setEditEmail] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [showConfig, setShowConfig] = useState(false);
  const [configDraft, setConfigDraft] = useState<ConfigCobranca>(DEFAULT_CONFIG);
  const [guardando, setGuardando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch("/api/lembretes-cobranca", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Erro ao carregar lembretes pendentes.");
      }
      const data = await res.json();
      setPendentes(Array.isArray(data.pendentes) ? data.pendentes : []);
      if (data.config) setConfig(data.config);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar lembretes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setLoading(true) no início do fetch assíncrono controla o estado de carregamento.
    carregar();
  }, [carregar]);

  const abrirConfig = () => {
    setConfigDraft(config);
    setShowConfig(true);
  };

  const guardarConfig = async () => {
    setGuardando(true);
    setErro(null);
    try {
      const res = await fetch("/api/lembretes-cobranca/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configDraft),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Erro ao guardar configuração.");
      setConfig(body.config);
      setShowConfig(false);
      setMensagem("Configuração guardada com sucesso.");
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao guardar configuração.");
    } finally {
      setGuardando(false);
    }
  };

  const gerarRascunhos = async () => {
    setGerando(true);
    setErro(null);
    try {
      const res = await fetch("/api/lembretes-cobranca/gerar", { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Erro ao gerar rascunhos.");
      setMensagem(
        `Rascunhos atualizados: ${body.gerados} novo(s), ${body.jaExistentes} já existente(s). Nada foi enviado automaticamente.`,
      );
      await carregar();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao gerar rascunhos.");
    } finally {
      setGerando(false);
    }
  };

  const abrirEdicao = (item: LembretePendente) => {
    setEditando(item);
    setEditText(item.mensagem);
    setEditSms(Boolean(item.telefone) && config.smsEnabled);
    setEditEmail(Boolean(item.email) && config.emailEnabled);
  };

  const confirmarEnvio = async () => {
    if (!editando) return;
    setEnviando(true);
    setErro(null);
    try {
      const canais: string[] = [];
      if (editSms) canais.push("sms");
      if (editEmail) canais.push("email");
      const res = await fetch("/api/lembretes-cobranca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faturaId: editando.faturaId,
          tipo: editando.tipo,
          mensagem: editText,
          canais,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Falha ao enviar lembrete.");
      const detalhes = Array.isArray(body.canais)
        ? body.canais.map((c: { canal: string; enviado: boolean }) => `${c.canal}: ${c.enviado ? "enviado" : "falhou"}`).join(", ")
        : "";
      setMensagem(`Lembrete da fatura ${editando.numeroFatura} processado — ${detalhes}`);
      setEditando(null);
      await carregar();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Falha ao enviar lembrete.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-1">
              <BellRing size={18} /> Lembretes de Cobrança
            </div>
            <h1 className="text-2xl font-black text-slate-900">Cobranças</h1>
            <p className="text-xs text-slate-500 mt-1">
              O sistema <strong>nunca envia</strong> SMS/e-mail automaticamente. Gere rascunhos e confirme cada envio individualmente.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={gerarRascunhos}
              disabled={gerando || !config.enabled}
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold text-sm transition disabled:opacity-50"
            >
              {gerando ? <Loader2 className="animate-spin" size={16} /> : <RefreshCcw size={16} />}
              Verificar agora
            </button>
            <button
              onClick={abrirConfig}
              className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-xl font-semibold text-sm transition"
            >
              <Settings size={16} /> Configuração
            </button>
          </div>
        </div>

        {mensagem && (
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            <span>{mensagem}</span>
            <button onClick={() => setMensagem(null)} className="ml-auto text-emerald-500 hover:text-emerald-700">
              <X size={16} />
            </button>
          </div>
        )}
        {erro && (
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{erro}</span>
            <button onClick={() => setErro(null)} className="ml-auto text-rose-400 hover:text-rose-600">
              <X size={16} />
            </button>
          </div>
        )}

        {!config.enabled && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={18} /> A deteção de lembretes está <strong>desativada</strong>. Ative-a na Configuração.
          </div>
        )}

        {/* Lista de pendentes */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Rascunhos pendentes de envio
            </h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-full px-3 py-1">
              {pendentes.length} pendente{pendentes.length === 1 ? "" : "s"}
            </span>
          </div>

          {loading ? (
            <div className="p-12 flex justify-center text-slate-400">
              <Loader2 className="animate-spin" size={28} />
            </div>
          ) : pendentes.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Sem lembretes pendentes. Clique em &quot;Verificar agora&quot; para procurar faturas por lembrar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                    <th className="p-3">Fatura</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Contactos</th>
                    <th className="p-3 text-right">Valor</th>
                    <th className="p-3">Vencimento</th>
                    <th className="p-3">Pagamento</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendentes.map((p) => (
                    <tr key={`${p.faturaId}-${p.tipo}`} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{p.numeroFatura}</div>
                        {p.numeroOrdem && <div className="text-xs text-slate-400">OT {p.numeroOrdem}</div>}
                      </td>
                      <td className="p-3 text-slate-700">{p.clienteNome}</td>
                      <td className="p-3 text-xs text-slate-500">
                        {p.telefone && <div>{p.telefone}</div>}
                        {p.email && <div className="truncate max-w-[180px]">{p.email}</div>}
                        {!p.telefone && !p.email && <span className="text-amber-600">Sem contactos</span>}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        € {p.valorTotal.toFixed(2)}
                      </td>
                      <td className="p-3 text-slate-600">{formatDate(p.dataVencimento)}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${PAGAMENTO_BADGE_CLASSES[p.pagamentoStatus] || PAGAMENTO_BADGE_CLASSES.Pendente}`}>
                          {p.pagamentoStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          p.tipo === "primeiro"
                            ? "bg-blue-500/10 text-blue-700 border-blue-500/30"
                            : "bg-rose-500/10 text-rose-700 border-rose-500/30"
                        }`}>
                          {p.tipo === "primeiro" ? "1º lembrete" : "2º lembrete"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => abrirEdicao(p)}
                          className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                        >
                          <PencilLine size={14} /> Editar e enviar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400">
          O envio é sempre manual: abra a janela de edição, ajuste o texto da SMS se necessário e confirme o canal de envio.
          Faturas sem contacto ficam marcadas para tratamento manual.
        </p>
      </div>

      {/* Modal de edição de SMS */}
      {editando && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900">Editar e enviar lembrete</h3>
                <p className="text-xs text-slate-500">
                  Fatura {editando.numeroFatura} · {editando.clienteNome} · {editando.tipo === "primeiro" ? "1º lembrete" : "2º lembrete"}
                </p>
              </div>
              <button onClick={() => setEditando(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-slate-400">Valor</div>
                  <div className="font-mono font-bold text-slate-800">€ {editando.valorTotal.toFixed(2)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-slate-400">Vencimento</div>
                  <div className="font-semibold text-slate-800">{formatDate(editando.dataVencimento)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-slate-400">Criado em</div>
                  <div className="font-semibold text-slate-800">{formatDateTime(editando.criadoEm)}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  Mensagem SMS (editável)
                </label>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-right text-xs text-slate-400 mt-1">
                  {editText.length} caracteres{editText.length > 160 ? " · excede 160 (pode ser dividida)" : ""}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase">Canais de envio</label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={editSms}
                    onChange={(e) => setEditSms(e.target.checked)}
                    disabled={!config.smsEnabled}
                    className="rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                  />
                  <MessageSquare size={15} className="text-blue-600" />
                  SMS {!editando.telefone && <span className="text-amber-600 text-xs">(sem telemóvel registado)</span>}
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={editEmail}
                    onChange={(e) => setEditEmail(e.target.checked)}
                    disabled={!config.emailEnabled}
                    className="rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                  />
                  <Mail size={15} className="text-blue-600" />
                  E-mail {!editando.email && <span className="text-amber-600 text-xs">(sem e-mail registado)</span>}
                </label>
              </div>

              {erro && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-lg text-sm">
                  <AlertCircle size={16} className="shrink-0" /> {erro}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200">
              <button
                onClick={() => setEditando(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEnvio}
                disabled={enviando || (!editSms && !editEmail)}
                className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold transition disabled:opacity-50"
              >
                {enviando ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                Confirmar envio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de configuração */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-700" />
                <h3 className="font-bold text-slate-900">Configuração de lembretes de cobrança</h3>
              </div>
              <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <label className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-700">
                Deteção de lembretes ativa
                <input
                  type="checkbox"
                  checked={configDraft.enabled}
                  onChange={(e) => setConfigDraft({ ...configDraft, enabled: e.target.checked })}
                  className="rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                />
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="block text-xs text-slate-600">
                  <span className="font-semibold">1º lembrete (dias)</span>
                  <input
                    type="number"
                    min={1}
                    value={configDraft.diasPrimeiroLembrete}
                    onChange={(e) => setConfigDraft({ ...configDraft, diasPrimeiroLembrete: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="block text-xs text-slate-600">
                  <span className="font-semibold">2º lembrete (dias)</span>
                  <input
                    type="number"
                    min={1}
                    value={configDraft.diasSegundoLembrete}
                    onChange={(e) => setConfigDraft({ ...configDraft, diasSegundoLembrete: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="block text-xs text-slate-600">
                  <span className="font-semibold">Vencimento (dias)</span>
                  <input
                    type="number"
                    min={1}
                    value={configDraft.diasVencimento}
                    onChange={(e) => setConfigDraft({ ...configDraft, diasVencimento: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <MessageSquare size={15} className="text-blue-600" /> Envio SMS disponível
                  <input
                    type="checkbox"
                    checked={configDraft.smsEnabled}
                    onChange={(e) => setConfigDraft({ ...configDraft, smsEnabled: e.target.checked })}
                    className="rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Mail size={15} className="text-blue-600" /> Envio e-mail disponível
                  <input
                    type="checkbox"
                    checked={configDraft.emailEnabled}
                    onChange={(e) => setConfigDraft({ ...configDraft, emailEnabled: e.target.checked })}
                    className="rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <BellRing size={15} className="text-blue-600" /> Link público na SMS
                  <input
                    type="checkbox"
                    checked={configDraft.linkPublico}
                    onChange={(e) => setConfigDraft({ ...configDraft, linkPublico: e.target.checked })}
                    className="rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  Assunto do e-mail
                </label>
                <input
                  type="text"
                  value={configDraft.emailSubject}
                  onChange={(e) => setConfigDraft({ ...configDraft, emailSubject: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  Modelo da SMS (variáveis: {"{cliente}, {numeroFatura}, {numeroOrdem}, {valorTotal}, {dataVencimento}, {pagamentoStatus}, {link}"})
                </label>
                <textarea
                  value={configDraft.smsTemplate}
                  onChange={(e) => setConfigDraft({ ...configDraft, smsTemplate: e.target.value })}
                  rows={7}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono text-slate-800"
                />
              </div>

              {erro && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-lg text-sm">
                  <AlertCircle size={16} className="shrink-0" /> {erro}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200">
              <button
                onClick={() => setShowConfig(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={guardarConfig}
                disabled={guardando}
                className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold transition disabled:opacity-50"
              >
                {guardando ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                Guardar configuração
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
