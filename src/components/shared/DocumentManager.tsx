"use client";
import { useState, useEffect, useCallback } from "react";
import { FileText, Upload, Camera, Trash2, Download, ExternalLink, Loader2 } from "lucide-react";
import DocumentScanner from "./DocumentScanner";

type DocumentFile = {
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
};

type Props = {
  recordType: string; // e.g. "ordens-servico"
  recordId: number;
  allowedExtensions?: string;
};

export default function DocumentManager({ recordType, recordId, allowedExtensions = ".pdf,.doc,.docx,.jpg,.jpeg,.png" }: Props) {
  const [docs, setDocs] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null);

  const folder = `${recordType}/${recordId}`;

  const loadDocs = useCallback(async () => {
    try {
      const res = await fetch(`/api/documentos?folder=${folder}`);
      if (res.ok) setDocs(await res.json());
    } catch { /* */ }
    finally { setLoading(false); }
  }, [folder]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const res = await fetch("/api/upload-documento", { method: "POST", body: formData });
      if (res.ok) {
        await loadDocs();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao fazer upload");
      }
    } catch (e) {
      alert("Erro ao fazer upload");
    } finally {
      setUploading(false);
    }
  };

  const handleCapture = (file: File, _preview: string) => {
    handleUpload(file);
    setShowScanner(false);
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm("Tem a certeza que deseja eliminar este documento?")) return;
    try {
      const res = await fetch(`/api/documentos?folder=${folder}&file=${encodeURIComponent(fileName)}`, { method: "DELETE" });
      if (res.ok) await loadDocs();
    } catch { /* */ }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          <FileText size={16} className="text-indigo-500" /> Documentos
        </h4>
        <div className="flex gap-2">
          <input
            type="file"
            accept={allowedExtensions}
            className="hidden"
            ref={(el) => { if (el) fileInputRef[1](el); }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); if (e.target) e.target.value = ""; }}
          />
          <button
            onClick={() => fileInputRef[0]?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            Upload
          </button>
          <button
            onClick={() => setShowScanner(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
          >
            <Camera size={12} /> Digitalizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-slate-400 text-sm">A carregar...</div>
      ) : docs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-sm text-slate-400">
          Nenhum documento associado
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {docs.map((doc) => (
            <div key={doc.name} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={14} className="text-slate-400 shrink-0" />
                <span className="text-sm font-medium text-slate-700 truncate">{doc.name}</span>
                <span className="text-xs text-slate-400 shrink-0">{formatSize(doc.size)}</span>
              </div>
              <div className="flex gap-1 shrink-0">
                <a href={doc.url} target="_blank" rel="noreferrer" className="rounded p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition" title="Abrir">
                  <ExternalLink size={14} />
                </a>
                <a href={doc.url} download className="rounded p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition" title="Descarregar">
                  <Download size={14} />
                </a>
                <button onClick={() => handleDelete(doc.name)} className="rounded p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 transition" title="Eliminar">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showScanner && <DocumentScanner onCapture={handleCapture} onClose={() => setShowScanner(false)} />}
    </div>
  );
}
