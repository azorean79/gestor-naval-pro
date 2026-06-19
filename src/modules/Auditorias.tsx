"use client";

import React from "react";
import { upload as uploadToBlob } from "@vercel/blob/client";

export type AuditoriaItem = {
  id: number;
  tabela: string;
  tipoOperacao: string;
  idRegisto: number;
  descricao?: string | null;
  usuario?: string | null;
  createdAt: string;
};

type AuditoriaDocumentoCategoria =
  | "calibracao"
  | "tecnicos-rfd"
  | "tecnicos-dsb"
  | "tecnicos-zodiac"
  | "estacao-servico";

type AuditoriaDocumento = {
  name: string;
  originalName?: string;
  size: number;
  modified: string;
  uploadedAt?: string;
  directUrl?: string | null;
  categoria: AuditoriaDocumentoCategoria;
};

const DOC_CATEGORIES: Array<{ id: AuditoriaDocumentoCategoria; label: string; hint: string }> = [
  {
    id: "calibracao",
    label: "Certificados de calibração",
    hint: "Instrumentos de medição e ensaio",
  },
  {
    id: "tecnicos-rfd",
    label: "Certificados técnicos - RFD",
    hint: "Qualificação por marca RFD",
  },
  {
    id: "tecnicos-dsb",
    label: "Certificados técnicos - DSB",
    hint: "Qualificação por marca DSB",
  },
  {
    id: "tecnicos-zodiac",
    label: "Certificados técnicos - ZODIAC",
    hint: "Qualificação por marca ZODIAC",
  },
  {
    id: "estacao-servico",
    label: "Certificados da oficina técnica",
    hint: "Aprovação/licenciamento operacional",
  },
];

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

function fmtDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("pt-PT");
}

function fmtFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[<>:"|?*]/g, "_").replace(/\.\./g, "_");
}

function isAllowedUploadExtension(filename: string): boolean {
  const ext = filename.toLowerCase().split(".").pop();
  return Boolean(ext && ["pdf", "doc", "docx", "xls", "xlsx", "txt", "jpg", "jpeg", "png"].includes(ext));
}

function isProbablyClientUploadTokenError(error: unknown): boolean {
  const msg = String((error as any)?.message || "").toLowerCase();
  return (
    msg.includes("client token") ||
    msg.includes("fetching client token") ||
    msg.includes("blob") ||
    msg.includes("failed to fetch") ||
    msg.includes("auditorias/documentos/client-upload")
  );
}

export function AuditoriaDocumentosLegais() {
  const [filesByCategory, setFilesByCategory] = React.useState<Record<AuditoriaDocumentoCategoria, AuditoriaDocumento[]>>({
    calibracao: [],
    "tecnicos-rfd": [],
    "tecnicos-dsb": [],
    "tecnicos-zodiac": [],
    "estacao-servico": [],
  });
  const [loading, setLoading] = React.useState<Record<AuditoriaDocumentoCategoria, boolean>>({
    calibracao: false,
    "tecnicos-rfd": false,
    "tecnicos-dsb": false,
    "tecnicos-zodiac": false,
    "estacao-servico": false,
  });
  const [uploading, setUploading] = React.useState<AuditoriaDocumentoCategoria | null>(null);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadCategory(categoria: AuditoriaDocumentoCategoria) {
    setLoading((prev) => ({ ...prev, [categoria]: true }));
    try {
      const res = await fetch(`/api/auditorias/documentos?categoria=${categoria}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao listar documentos");
      setFilesByCategory((prev) => ({ ...prev, [categoria]: Array.isArray(data?.files) ? data.files : [] }));
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Erro ao carregar documentos" });
    } finally {
      setLoading((prev) => ({ ...prev, [categoria]: false }));
    }
  }

  React.useEffect(() => {
    for (const c of DOC_CATEGORIES) {
      loadCategory(c.id);
    }
  }, []);

  async function upload(categoria: AuditoriaDocumentoCategoria, file: File | null) {
    if (!file) return;
    setMessage(null);
    setUploading(categoria);
    try {
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error(`Ficheiro muito grande. Máximo: 500 MB. Tamanho: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      }

      if (!isAllowedUploadExtension(file.name)) {
        throw new Error("Tipo de ficheiro não permitido. Use: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG");
      }

      const safeName = sanitizeFilename(file.name);
      const ext = safeName.includes(".") ? `.${safeName.split(".").pop()}` : "";
      const base = ext ? safeName.slice(0, -ext.length) : safeName;
      const storedName = `${base}_${Date.now()}${ext}`;

      try {
        await uploadToBlob(`auditorias-documentos/${categoria}/${storedName}`, file, {
          access: "public",
          handleUploadUrl: "/api/auditorias/documentos/client-upload",
          multipart: file.size >= 5 * 1024 * 1024,
        });

        const registerRes = await fetch("/api/auditorias/documentos", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "registerBlobUpload",
            categoria,
            storedName,
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
          }),
        });

        const registerData = await registerRes.json().catch(() => ({}));
        if (!registerRes.ok) {
          throw new Error(registerData?.error || "Falha ao registar metadados do upload");
        }
      } catch (directUploadError) {
        if (!isProbablyClientUploadTokenError(directUploadError)) {
          throw directUploadError;
        }

        const form = new FormData();
        form.append("file", file);
        form.append("categoria", categoria);
        const res = await fetch("/api/auditorias/documentos", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Falha ao carregar ficheiro");
      }

      setMessage({ type: "success", text: `${DOC_CATEGORIES.find((x) => x.id === categoria)?.label}: upload concluído.` });
      await loadCategory(categoria);
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Erro no upload" });
    } finally {
      setUploading(null);
    }
  }

  async function deleteFile(categoria: AuditoriaDocumentoCategoria, name: string) {
    if (!window.confirm(`Eliminar o ficheiro "${name}"?`)) return;
    setMessage(null);
    try {
      const res = await fetch(`/api/auditorias/documentos/${categoria}/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao eliminar ficheiro");
      setMessage({ type: "success", text: data?.message || "Documento eliminado." });
      await loadCategory(categoria);
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Erro ao eliminar ficheiro" });
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-gray-900">Documentos de auditoria e conformidade</h2>
      <p className="mt-1 text-xs text-gray-600">
        Upload e gestão de certificados por categoria (calibração, técnicos por marca e documentação operacional).
      </p>

      {message && (
        <div
          className={`mt-3 rounded border px-3 py-2 text-sm ${
            message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {DOC_CATEGORIES.map((category) => {
          const files = filesByCategory[category.id] || [];
          const isLoading = loading[category.id];
          const isUploading = uploading === category.id;

          return (
            <section key={category.id} className="rounded-lg border border-gray-200 p-3">
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-gray-900">{category.label}</h3>
                <p className="text-xs text-gray-500">{category.hint}</p>
              </div>

              <label className="inline-flex cursor-pointer items-center rounded bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800">
                {isUploading ? "A carregar..." : "Upload"}
                <input
                  type="file"
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    upload(category.id, file);
                    e.currentTarget.value = "";
                  }}
                />
              </label>

              <div className="mt-3">
                {isLoading ? (
                  <p className="text-xs text-gray-500">A carregar documentos...</p>
                ) : files.length === 0 ? (
                  <p className="text-xs text-gray-500">Sem documentos nesta categoria.</p>
                ) : (
                  <ul className="space-y-2">
                    {files.map((file) => (
                      <li key={`${category.id}-${file.name}`} className="rounded border border-gray-100 px-2 py-1.5">
                        <p className="truncate text-xs font-medium text-gray-800">{file.originalName || file.name}</p>
                        {file.originalName && file.originalName !== file.name && (
                          <p className="truncate text-[11px] text-gray-500">Guardado como: {file.name}</p>
                        )}
                        <p className="text-[11px] text-gray-500">
                          {fmtFileSize(file.size)} • Upload: {fmtDate(file.uploadedAt || file.modified)}
                        </p>
                        <div className="mt-1 flex gap-3 text-xs">
                          <a
                            href={`/api/auditorias/documentos/${category.id}/${encodeURIComponent(file.name)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-700 hover:underline"
                          >
                            Abrir
                          </a>
                          <a
                            href={`/api/auditorias/documentos/${category.id}/${encodeURIComponent(file.name)}`}
                            download={file.name}
                            className="text-emerald-700 hover:underline"
                          >
                            Download
                          </a>
                          {file.directUrl && (
                            <a
                              href={file.directUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-700 hover:underline"
                            >
                              Link direto
                            </a>
                          )}
                          <button
                            className="text-red-700 hover:underline"
                            onClick={() => deleteFile(category.id, file.name)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

type MarcaConformidade = {
  marca: "RFD" | "DSB" | "ZODIAC";
  calibracao: number;
  tecnico: number;
  estacao: number;
  status: "completo" | "parcial" | "vazio";
};

type PlaneamentoAuditoriaResponse = {
  ultimaAuditoria: string | null;
  proximaAuditoria: string | null;
  updatedAt?: string;
};

function formatPlaneamentoDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-PT");
}

function addOneYear(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const next = new Date(d);
  next.setFullYear(next.getFullYear() + 1);
  return next.toISOString();
}

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function daysUntil(value?: string | null) {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const startNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((startTarget.getTime() - startNow.getTime()) / (1000 * 60 * 60 * 24));
}

export function AuditoriaPlaneamentoCard() {
  const [savingDate, setSavingDate] = React.useState(false);
  const [dateMessage, setDateMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const [ultimaAuditoriaManual, setUltimaAuditoriaManual] = React.useState<string | null>(null);
  const [dateInput, setDateInput] = React.useState("");

  async function fetchPlaneamento() {
    try {
      const res = await fetch("/api/auditorias/planeamento", { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao carregar planeamento");
      const data = (await res.json()) as PlaneamentoAuditoriaResponse;
      setUltimaAuditoriaManual(data.ultimaAuditoria ?? null);
      setDateInput(toDateInputValue(data.ultimaAuditoria));
    } catch {
      setUltimaAuditoriaManual(null);
      setDateInput("");
    }
  }

  async function saveUltimaAuditoria() {
    setSavingDate(true);
    setDateMessage(null);
    try {
      const payload = { ultimaAuditoria: dateInput || null };
      const res = await fetch("/api/auditorias/planeamento", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as PlaneamentoAuditoriaResponse & { message?: string; error?: string };
      if (!res.ok) throw new Error(data?.error || "Falha ao guardar data");

      setUltimaAuditoriaManual(data.ultimaAuditoria ?? null);
      setDateInput(toDateInputValue(data.ultimaAuditoria));
      setDateMessage({ type: "success", text: data.message || "Data da última auditoria atualizada." });
    } catch (error: any) {
      setDateMessage({ type: "error", text: error?.message || "Erro ao guardar data." });
    } finally {
      setSavingDate(false);
    }
  }

  React.useEffect(() => {
    fetchPlaneamento();
  }, []);

  const nextAuditoriaDate = addOneYear(ultimaAuditoriaManual);
  const diasParaProxima = daysUntil(nextAuditoriaDate);

  return (
    <div className="mb-4 grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500">Data da última auditoria</p>
        <p className="mt-1 text-xl font-semibold text-gray-900">{formatPlaneamentoDate(ultimaAuditoriaManual)}</p>

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-xs text-gray-600">
            Editar data
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="mt-1 block rounded border px-2 py-1 text-sm"
            />
          </label>
          <button
            className="rounded bg-blue-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            onClick={saveUltimaAuditoria}
            disabled={savingDate}
          >
            {savingDate ? "A guardar..." : "Guardar"}
          </button>
        </div>

        {dateMessage && (
          <p className={`mt-2 text-xs ${dateMessage.type === "success" ? "text-emerald-700" : "text-red-700"}`}>
            {dateMessage.text}
          </p>
        )}
      </div>
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs uppercase tracking-wide text-blue-700">Data da próxima auditoria</p>
        <p className="mt-1 text-xl font-semibold text-blue-900">{formatPlaneamentoDate(nextAuditoriaDate)}</p>
        <p className="mt-1 text-xs text-blue-700">Cálculo automático: +12 meses após o último registo.</p>

        {typeof diasParaProxima === "number" && (
          <p
            className={`mt-2 text-xs font-semibold ${
              diasParaProxima <= 7
                ? "text-red-700"
                : diasParaProxima <= 30
                  ? "text-amber-700"
                  : "text-blue-700"
            }`}
          >
            {diasParaProxima < 0
              ? `⚠ Auditoria em atraso há ${Math.abs(diasParaProxima)} dias.`
              : diasParaProxima === 0
                ? "⚠ Auditoria prevista para hoje."
                : `Faltam ${diasParaProxima} dias para a próxima auditoria.`}
          </p>
        )}
      </div>
    </div>
  );
}

export function AuditoriaConformidadePorMarca() {
  const [marcas, setMarcas] = React.useState<MarcaConformidade[]>([
    { marca: "RFD", calibracao: 0, tecnico: 0, estacao: 0, status: "vazio" },
    { marca: "DSB", calibracao: 0, tecnico: 0, estacao: 0, status: "vazio" },
    { marca: "ZODIAC", calibracao: 0, tecnico: 0, estacao: 0, status: "vazio" },
  ]);
  const [loading, setLoading] = React.useState(true);

  async function carregarConformidade() {
    setLoading(true);
    try {
      const categorias = ["calibracao", "tecnicos-rfd", "tecnicos-dsb", "tecnicos-zodiac", "estacao-servico"];
      const results = await Promise.all(
        categorias.map((cat) => fetch(`/api/auditorias/documentos?categoria=${cat}`).then((r) => r.json()))
      );

      const cals = (results[0]?.files || []).length;
      const techRfd = (results[1]?.files || []).length;
      const techDsb = (results[2]?.files || []).length;
      const techZodiac = (results[3]?.files || []).length;
      const estacao = (results[4]?.files || []).length;

      const nextMarcas: MarcaConformidade[] = [
        { marca: "RFD", calibracao: cals, tecnico: techRfd, estacao, status: "vazio" },
        { marca: "DSB", calibracao: cals, tecnico: techDsb, estacao, status: "vazio" },
        { marca: "ZODIAC", calibracao: cals, tecnico: techZodiac, estacao, status: "vazio" },
      ];

      nextMarcas.forEach((m) => {
        if (m.calibracao > 0 && m.tecnico > 0 && m.estacao > 0) {
          m.status = "completo";
        } else if (m.calibracao > 0 || m.tecnico > 0 || m.estacao > 0) {
          m.status = "parcial";
        } else {
          m.status = "vazio";
        }
      });

      setMarcas(nextMarcas);
    } catch {
      setMarcas([
        { marca: "RFD", calibracao: 0, tecnico: 0, estacao: 0, status: "vazio" },
        { marca: "DSB", calibracao: 0, tecnico: 0, estacao: 0, status: "vazio" },
        { marca: "ZODIAC", calibracao: 0, tecnico: 0, estacao: 0, status: "vazio" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    carregarConformidade();
  }, []);

  function statusEmoji(status: string) {
    if (status === "completo") return "🟢";
    if (status === "parcial") return "🟡";
    return "🔴";
  }

  function statusLabel(status: string) {
    if (status === "completo") return "Completo";
    if (status === "parcial") return "Parcial";
    return "Sem certificados";
  }

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-gray-900">Conformidade documental por marca</h2>
      <p className="mt-1 text-xs text-gray-600">
        Status de completude: calibração + técnicos + documentação operacional.
      </p>

      {loading ? (
        <p className="mt-3 text-sm text-gray-500">A carregar conformidade...</p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {marcas.map((marca) => (
            <div key={marca.marca} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{marca.marca}</p>
                  <p className="mt-0.5 text-xs text-gray-600">
                    {statusEmoji(marca.status)} {statusLabel(marca.status)}
                  </p>
                </div>
              </div>

              <ul className="mt-3 space-y-1 text-xs text-gray-700">
                <li>📋 Calibração: <b>{marca.calibracao}</b></li>
                <li>👤 Técnico: <b>{marca.tecnico}</b></li>
                <li>🏢 Oficina: <b>{marca.estacao}</b></li>
              </ul>

              {marca.status === "completo" && (
                <p className="mt-2 rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                  ✓ Conformidade total
                </p>
              )}
              {marca.status === "parcial" && (
                <p className="mt-2 rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                  ⚠ Upload em falta
                </p>
              )}
              {marca.status === "vazio" && (
                <p className="mt-2 rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                  ✕ Adicione documentos
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AuditoriasList({ items }: { items: AuditoriaItem[] }) {
  if (!items.length) {
    return <div className="text-sm text-gray-500">Sem registos de auditoria.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
            <th className="px-3 py-2">Data</th>
            <th className="px-3 py-2">Operação</th>
            <th className="px-3 py-2">Tabela</th>
            <th className="px-3 py-2">Registo</th>
            <th className="px-3 py-2">Utilizador</th>
            <th className="px-3 py-2">Descrição</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-gray-100 align-top">
              <td className="px-3 py-2 text-xs text-gray-700">{fmtDate(item.createdAt)}</td>
              <td className="px-3 py-2">
                <span
                  className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                    item.tipoOperacao === "DELETE"
                      ? "bg-red-100 text-red-700"
                      : item.tipoOperacao === "UPDATE"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {item.tipoOperacao}
                </span>
              </td>
              <td className="px-3 py-2 font-medium text-gray-800">{item.tabela}</td>
              <td className="px-3 py-2 text-gray-700">#{item.idRegisto}</td>
              <td className="px-3 py-2 text-gray-700">{item.usuario || "—"}</td>
              <td className="px-3 py-2 text-gray-700">{item.descricao || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
