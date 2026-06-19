"use client";

import { useEffect, useState } from "react";
import { upload as uploadToBlob } from "@vercel/blob/client";

type UploadedFile = {
  name: string;
  url: string;
  size: number;
  updatedAt: string;
  jangada?: { id: number; serial: string; brand?: string; model?: string } | null;
  shipName?: string | null;
};

type Jangada = {
  id: number;
  serial: string;
  brand?: string;
  model?: string;
};

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

function sanitizeFilename(filename: string): string {
  return filename.replace(/[<>:"|?*]/g, "_").replace(/\.\./g, "_");
}

function isProbablyClientUploadTokenError(error: unknown): boolean {
  const msg = String((error as any)?.message || "").toLowerCase();
  return (
    msg.includes("client token") ||
    msg.includes("fetching client token") ||
    msg.includes("blob") ||
    msg.includes("failed to fetch") ||
    msg.includes("upload-certificados/client-upload")
  );
}

export default function CertificadosExternosPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [jangadas, setJangadas] = useState<Jangada[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [selectedJangadaId, setSelectedJangadaId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterJangada, setFilterJangada] = useState<string>("");
  const [filterNavio, setFilterNavio] = useState<string>("");

  const safeReadJson = async (res: Response) => {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return res.json().catch(() => null);
    }
    const text = await res.text().catch(() => "");
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  };

  const getErrorMessage = async (res: Response, fallback: string) => {
    const data = await safeReadJson(res);
    if (data && typeof data === "object") {
      const message = (data as any)?.error || (data as any)?.message || (data as any)?.details;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }

    const text = await res.text().catch(() => "");
    return text || fallback;
  };

  const loadFiles = async () => {
    try {
      const res = await fetch("/api/upload-certificados");
      if (!res.ok) throw new Error(await res.text());
      const data = await safeReadJson(res);
      setFiles(Array.isArray(data?.files) ? data.files : []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadJangadas = async () => {
    try {
      const res = await fetch("/api/jangadas");
      if (!res.ok) throw new Error(await res.text());
      const data = await safeReadJson(res);
      setJangadas(Array.isArray(data) ? data : []);
    } catch {
      setJangadas([]);
    }
  };

  useEffect(() => {
    loadFiles();
    loadJangadas();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) return;

    try {
      setUploading(true);
      const filesToUpload = Array.from(selectedFiles);
      const invalidFile = filesToUpload.find((f) => !f.name.toLowerCase().endsWith(".pdf"));
      if (invalidFile) {
        throw new Error(`Apenas PDF é permitido: ${invalidFile.name}`);
      }

      const oversized = filesToUpload.find((f) => f.size > MAX_UPLOAD_BYTES);
      if (oversized) {
        throw new Error(`Ficheiro muito grande: ${oversized.name}. Máximo: 500 MB`);
      }

      try {
        const uploadedNames: string[] = [];
        for (const file of filesToUpload) {
          const safeName = sanitizeFilename(file.name);
          await uploadToBlob(`certificados-externos/${safeName}`, file, {
            access: "public",
            handleUploadUrl: "/api/upload-certificados/client-upload",
            multipart: file.size >= 5 * 1024 * 1024,
          });
          uploadedNames.push(safeName);
        }

        const registerRes = await fetch("/api/upload-certificados", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "registerUploadedFiles",
            fileNames: uploadedNames,
            jangadaId: selectedJangadaId || null,
          }),
        });

        if (!registerRes.ok) {
          throw new Error(await getErrorMessage(registerRes, "Falha ao registar os certificados enviados."));
        }

        const data = await safeReadJson(registerRes);
        setFiles(Array.isArray(data?.files) ? data.files : []);
      } catch (directUploadError) {
        if (!isProbablyClientUploadTokenError(directUploadError)) {
          throw directUploadError;
        }

        const form = new FormData();
        filesToUpload.forEach((file) => form.append("file", file));
        if (selectedJangadaId) {
          form.append("jangadaId", selectedJangadaId);
        }

        const res = await fetch("/api/upload-certificados", {
          method: "POST",
          body: form,
        });

        if (!res.ok) {
          throw new Error(await getErrorMessage(res, "Falha ao enviar os certificados."));
        }

        const data = await safeReadJson(res);
        setFiles(Array.isArray(data?.files) ? data.files : []);
      }

      setSelectedFiles(null);
      setSelectedJangadaId("");
      const input = document.getElementById("certificadosInput") as HTMLInputElement | null;
      if (input) {
        input.value = "";
      }
    } catch (error: any) {
      alert(error?.message || "Erro ao enviar certificados.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!window.confirm("Remover este certificado externo?")) return;
    try {
      const res = await fetch(`/api/upload-certificados?name=${encodeURIComponent(name)}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Não foi possível remover o ficheiro.");
        return;
      }
      const data = await safeReadJson(res);
      setFiles(Array.isArray(data?.files) ? data.files : []);
    } catch {
      alert("Não foi possível remover o ficheiro.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h1 className="text-2xl font-bold text-gray-900">Upload de Certificados Externos (PDF)</h1>
          <p className="text-sm text-gray-600 mt-1">Carregue certificados externos em PDF para consulta e download no sistema.</p>
        </div>

        <form onSubmit={handleUpload} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div>
            <label className="block text-xs mb-1 text-gray-600 font-medium">Jangada associada (opcional)</label>
            <select
              value={selectedJangadaId}
              onChange={(e) => setSelectedJangadaId(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full"
            >
              <option value="">Sem jangada associada</option>
              {jangadas
                .slice()
                .sort((a, b) => (a.serial || "").localeCompare(b.serial || ""))
                .map((jangada) => (
                  <option key={jangada.id} value={jangada.id}>
                    {jangada.serial} {jangada.brand || jangada.model ? `- ${[jangada.brand, jangada.model].filter(Boolean).join(" ")}` : ""}
                  </option>
                ))}
            </select>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs mb-1 text-gray-600 font-medium">Ficheiros PDF</label>
              <input
                id="certificadosInput"
                type="file"
                accept="application/pdf,.pdf"
                multiple
                onChange={(e) => setSelectedFiles(e.target.files)}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>
            <button
              type="submit"
              disabled={uploading || !selectedFiles || selectedFiles.length === 0}
              className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white rounded px-4 py-2 text-sm font-medium"
            >
              {uploading ? "A enviar..." : "Enviar PDF"}
            </button>
          </div>
        </form>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Certificados carregados</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{files.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs mb-1 text-gray-600 font-medium">Filtrar por jangada</label>
              <input
                type="text"
                value={filterJangada}
                onChange={(e) => setFilterJangada(e.target.value)}
                placeholder="Serial da jangada..."
                className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-gray-600 font-medium">Filtrar por navio</label>
              <input
                type="text"
                value={filterNavio}
                onChange={(e) => setFilterNavio(e.target.value)}
                placeholder="Nome do navio..."
                className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
              />
            </div>
          </div>

          <div className="overflow-auto border border-gray-200 rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2">Nome</th>
                  <th className="text-left px-3 py-2">Jangada</th>
                  <th className="text-left px-3 py-2">Navio</th>
                  <th className="text-left px-3 py-2">Tamanho</th>
                  <th className="text-left px-3 py-2">Atualizado</th>
                  <th className="text-right px-3 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {!loading && files
                  .filter((file) => {
                    const matchJangada = !filterJangada || (file.jangada?.serial || "").toLowerCase().includes(filterJangada.toLowerCase());
                    const matchNavio = !filterNavio || (file.shipName || "").toLowerCase().includes(filterNavio.toLowerCase());
                    return matchJangada && matchNavio;
                  })
                  .map((file) => (
                  <tr key={file.name} className="border-t border-gray-100">
                    <td className="px-3 py-2">{file.name}</td>
                    <td className="px-3 py-2">
                      {file.jangada ? (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {file.jangada.serial}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {file.shipName ? (
                        <span className="text-xs">{file.shipName}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{(file.size / 1024).toFixed(1)} KB</td>
                    <td className="px-3 py-2">{new Date(file.updatedAt).toLocaleString("pt-PT")}</td>
                    <td className="px-3 py-2 text-right">
                      <a href={file.url} target="_blank" rel="noreferrer" className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white rounded px-3 py-1.5 text-xs font-medium mr-2">
                        Abrir PDF
                      </a>
                      <button type="button" onClick={() => handleDelete(file.name)} className="bg-red-600 hover:bg-red-700 text-white rounded px-3 py-1.5 text-xs font-medium">
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}

                {!loading && files.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-gray-500">Ainda não existem certificados externos carregados.</td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-gray-500">A carregar ficheiros...</td>
                  </tr>
                )}
                
                {!loading && files.length > 0 && files.filter((file) => {
                  const matchJangada = !filterJangada || (file.jangada?.serial || "").toLowerCase().includes(filterJangada.toLowerCase());
                  const matchNavio = !filterNavio || (file.shipName || "").toLowerCase().includes(filterNavio.toLowerCase());
                  return matchJangada && matchNavio;
                }).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-gray-500">Nenhum certificado corresponde aos filtros.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
