"use client";
import React, { useState } from 'react';
import { useColeteWizardStore } from './store/useColeteWizardStore';
import { Camera, Upload, Trash2, FileText } from 'lucide-react';

export default function Step5_Evidencias() {
  const { coleteId, inspectionData } = useColeteWizardStore();
  const [uploading, setUploading] = useState(false);
  const [evidencias, setEvidencias] = useState<any[]>([]); // This should ideally be fetched from the API

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !coleteId) return;

    setUploading(true);
    try {
      // Fake upload for demonstration, normally would call API
      // const formData = new FormData();
      // formData.append("file", file);
      // await fetch(`/api/coletes/${coleteId}/evidencias`, { method: "POST", body: formData });
      
      const novaEvidencia = {
        name: file.name,
        originalName: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString()
      };
      
      setEvidencias((prev) => [...prev, novaEvidencia]);
    } catch (error) {
      console.error("Erro no upload", error);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeEvidencia = (name: string) => {
    setEvidencias(evidencias.filter(e => e.name !== name));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">5. Evidências da Inspecção</h2>
        <p className="text-slate-600 mt-1">Faça o upload de fotografias do colete, do mecanismo e de quaisquer anomalias encontradas.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-10 bg-slate-50">
          <Camera className="w-12 h-12 text-slate-400 mb-4" />
          <p className="text-sm font-medium text-slate-700 mb-2">Arraste fotos ou clique para fazer upload</p>
          <p className="text-xs text-slate-500 mb-4">Formatos suportados: JPG, PNG, WEBP, PDF</p>
          
          <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-semibold cursor-pointer transition-colors flex items-center gap-2">
            <Upload size={18} />
            {uploading ? 'A enviar...' : 'Selecionar Arquivo'}
            <input 
              type="file" 
              className="hidden" 
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleUpload}
              disabled={uploading || !coleteId}
            />
          </label>
        </div>
      </div>

      {evidencias.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Ficheiros Anexados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evidencias.map((ev, index) => (
              <div key={index} className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                  {ev.name.toLowerCase().endsWith('.pdf') ? (
                    <FileText className="text-slate-400" />
                  ) : (
                    <img src={ev.url} alt={ev.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{ev.name}</p>
                  <p className="text-xs text-slate-500">{(ev.size / 1024).toFixed(1)} KB</p>
                </div>
                <button 
                  onClick={() => removeEvidencia(ev.name)}
                  className="text-slate-400 hover:text-red-600 transition-colors p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
