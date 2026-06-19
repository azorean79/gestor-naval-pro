"use client";
import React, { useState } from "react";
import { uuidv4 } from "../utils/uuid";
import * as XLSX from "xlsx";

// Gestão de Clientes
export default function Clients() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [quickClient, setQuickClient] = useState({ name: "", email: "", phone: "" });
  const [clients, setClients] = useState(() => {
    try {
      const stored = localStorage.getItem("clients");
      if (stored && JSON.parse(stored).length > 0) {
        return JSON.parse(stored);
      }
      // Seed automático: operadores e armadores de pesca
      // Importa navios e armadores
      // (Ajuste os imports conforme necessário)
      let navios: any[] = [];
      try {
        navios = [
          ...(require('../database/navios_sao_miguel').naviosSaoMiguel || []),
          ...(require('../database/navios_sao_miguel').naviosCorvo || []),
          ...(require('../database/navios_sao_miguel').naviosFlores || []),
          ...(require('../database/navios_sao_miguel').naviosTerceira || []),
          ...(require('../database/navios_sao_miguel').naviosFaial || []),
          ...(require('../database/navios_sao_miguel').naviosPico || []),
          ...(require('../database/navios_sao_miguel').naviosSaoJorge || []),
          ...(require('../database/navios_sao_miguel').naviosGraciosa || []),
          ...(require('../database/navios_sao_miguel').naviosSantaMaria || [])
        ];
      } catch {}
      // Extrai proprietários dos navios
      const owners = Array.from(new Set(navios.map((n: any) => n.proprietario).filter(Boolean)));
      // Armadores de pesca (exemplo, ajuste para importar de fonte real)
      const armadores = [
        "ABEL VITORINO SEQUEIRA DE MELO",
        "ALBERTO FERNANDO MONIZ DA CAMARA ROSA",
        "ALEXANDRE DOS SANTOS PACHECO",
        "ALEXANDRINO DE ASCENSÃO MENDES NARCISO",
        "ALVARO MIGUEL DA COSTA CABRAL",
        "AMARO RUI MACHADO SOARES",
        "ANA MARIA CABRAL VIEIRA",
        "ANDRÉ AGUIAR ALMEIDA",
        "ANTÓNIO ALBERTO PONTE DOS SANTOS ARRAIAL",
        "ANTÓNIO FERNANDO BEZERRA FLORES",
        "ANTÓNIO JORGE DA SILVA",
        "ANTÓNIO MANUEL CABRAL ANDRADE",
        "ANTÓNIO MANUEL VALENTE BAGARRÃO",
        "ANTÓNIO MANUEL VIEGAS DE AZEVEDO",
        "ANTÓNIO SALVADOR FERREIRA VIEIRA"
      ];
      // Monta lista única de clientes
      const allClients = [
        ...owners.map(name => ({ id: uuidv4(), name })),
        ...armadores.map(name => ({ id: uuidv4(), name }))
      ];
      localStorage.setItem("clients", JSON.stringify(allClients));
      return allClients;
    } catch { return []; }
  });
  const [auditLog, setAuditLog] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("auditClients") || "[]");
    } catch { return []; }
  });
  

  const handleQuickClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuickClient({ ...quickClient, [e.target.name]: e.target.value });
  };

  const handleQuickClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClient.name) return;
    const newClient = {
      id: uuidv4(),
      ...quickClient,
    };
    const updatedClients = [...clients, newClient];
    setClients(updatedClients);
    localStorage.setItem("clients", JSON.stringify(updatedClients));
    addAudit("Cadastro rápido", newClient);
    setShowModal(false);
    setQuickClient({ name: "", email: "", phone: "" });
  };

  const addAudit = (action: string, client: any) => {
    const entry = {
      timestamp: new Date().toISOString(),
      action,
      client,
    };
    const updatedLog = [entry, ...auditLog];
    setAuditLog(updatedLog);
    localStorage.setItem("auditClients", JSON.stringify(updatedLog));
  };

  // Funções de backup/restauração
  const handleBackup = () => {
    const data = {
      clients,
      auditLog,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_clientes_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.clients) {
          setClients(data.clients);
          localStorage.setItem("clients", JSON.stringify(data.clients));
        }
        if (data.auditLog) {
          setAuditLog(data.auditLog);
          localStorage.setItem("auditClients", JSON.stringify(data.auditLog));
        }
      } catch {}
    };
    reader.readAsText(file);
  };

  // Função para importar CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = XLSX.read(ev.target?.result, { type: "binary" });
      const sheet = data.Sheets[data.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      const importedClients = rows.map((r: any) => ({
        id: uuidv4(),
        name: r.name || r.Nome || "",
        email: r.email || r.Email || "",
        phone: r.phone || r.Telefone || "",
      }));
      const updatedClients = [...clients, ...importedClients];
      setClients(updatedClients);
      localStorage.setItem("clients", JSON.stringify(updatedClients));
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4">
      <h2 className="text-2xl font-bold mb-4">Lista de Clientes</h2>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
        onClick={() => setShowModal(true)}
      >
        Cadastro rápido
      </button>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Cadastro rápido de Cliente</h3>
            <form onSubmit={handleQuickClientSubmit} className="space-y-3">
              <input
                name="name"
                value={quickClient.name}
                onChange={handleQuickClientChange}
                placeholder="Nome do cliente"
                className="border rounded px-2 py-1 w-full"
                required
              />
              <input
                name="email"
                value={quickClient.email}
                onChange={handleQuickClientChange}
                placeholder="Email (opcional)"
                className="border rounded px-2 py-1 w-full"
              />
              <input
                name="phone"
                value={quickClient.phone}
                onChange={handleQuickClientChange}
                placeholder="Telefone (opcional)"
                className="border rounded px-2 py-1 w-full"
              />
              <div className="flex gap-2 justify-end">
                <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar nome, email, telefone..."
          className="border rounded px-2 py-1 w-full"
        />
      </div>
      <h3 className="text-xl font-semibold mb-2">Clientes</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow mb-2 text-xs sm:text-sm">
          <thead>
            <tr className="bg-blue-100">
              <th className="p-2 whitespace-nowrap">Nome</th>
              <th className="p-2 whitespace-nowrap">Email</th>
              <th className="p-2 whitespace-nowrap">Telefone</th>
            </tr>
          </thead>
          <tbody>
            {clients.filter((c: any) =>
              !search ||
              c.name.toLowerCase().includes(search.toLowerCase()) ||
              (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
              (c.phone && c.phone.toLowerCase().includes(search.toLowerCase()))
            ).map((c: any) => (
              <tr key={c.id} className="border-t align-top">
                <td className="p-2 whitespace-nowrap">{c.name}</td>
                <td className="p-2 whitespace-nowrap">{c.email}</td>
                <td className="p-2 whitespace-nowrap">{c.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-8">
        <h3 className="text-lg font-bold mb-2">Histórico de alterações</h3>
        <ul className="bg-gray-50 rounded p-2 max-h-48 overflow-auto text-xs">
          {auditLog.map((entry: any, idx: number) => (
            <li key={idx} className="mb-1">
              <span className="font-semibold">{entry.action}</span> - {entry.client.name} em {new Date(entry.timestamp).toLocaleString()}
            </li>
          ))}
          {auditLog.length === 0 && <li className="text-gray-400">Nenhuma alteração registrada.</li>}
        </ul>
      </div>
      <div className="flex gap-2 mb-4">
        <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={handleBackup}>Backup</button>
        <label className="bg-yellow-500 text-white px-3 py-1 rounded cursor-pointer">
          Restaurar
          <input type="file" accept="application/json" className="hidden" onChange={handleRestore} />
        </label>
      </div>
      <div className="mb-4">
        <label className="bg-blue-600 text-white px-3 py-1 rounded cursor-pointer">
          Importar CSV
          <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleImportCSV} />
        </label>
      </div>
    </div>
  );
}
