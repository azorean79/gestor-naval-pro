"use client";
import React, { useState } from 'react';

export default function UploadForm() {
  const [folder, setFolder] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folder || !file) {
      setMessage('Preencha o nome da pasta e selecione um arquivo.');
      return;
    }
    const formData = new FormData();
    formData.append('folder', folder);
    formData.append('file', file);
    try {
      const res = await fetch('/api/backups/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Upload concluído: ${data.message}`);
      } else {
        setMessage(`Erro: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setMessage('Erro ao enviar o backup.');
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      <div>
        <label className="block font-medium mb-1" htmlFor="folder">
          Nome da pasta (criar ou sobrescrever)
        </label>
        <input
          id="folder"
          type="text"
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          className="w-full border rounded p-2"
          required
        />
      </div>
      <div>
        <label className="block font-medium mb-1" htmlFor="file">
          Arquivo de backup (ex.: .zip ou outro)
        </label>
        <input
          id="file"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full"
          required
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Upload
      </button>
      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
    </form>
  );
}
