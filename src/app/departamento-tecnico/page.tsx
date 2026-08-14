"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { upload as uploadToBlob } from "@vercel/blob/client";
import { BOLETINS_SERVICO_DRIVE_URL, COLETES_MANUAIS_DRIVE_URL, TECHNICAL_LIBRARY_DRIVE_URL } from "@/lib/external-tech-docs";
import { formatContainerClosureCapacities, getContainerClosureCatalogForModel, getContainerClosureMatchBundle } from "@/modules/rafts/containerClosureStraps";
import { raftModelData } from "@/modules/rafts/raftModelData";
import { buildTechnicalBulletinUrl, formatTechnicalBulletinShortLabel, getMatchingBulletinRulesForModel, getTechnicalBulletinsForBrand } from "@/modules/rafts/serviceBulletins";
import type { FileInfo, FolderType, FolderData, ManualCategory, JangadaBrandCount, JangadaBrandModelCount, TechnicalItem } from "@/types/departamento-tecnico-page";
import { FIXED_BRAND_ORDER, EXTERNAL_ONLY_FOLDERS, INTERNAL_MANAGED_FOLDERS } from "@/types/departamento-tecnico-page";
import { normalizeToken, isGenericManualBrand, buildBrandModelCountKey, inferManualCategory, getMaxUploadBytesByFolder, sanitizeFilename, isAllowedUploadExtension, getModelTubes, getModelKeyTechnicalDisplay, getModelCompleteness, getSpecN2DisplayValue, normalizeConfig, getItemSubsystem, getItemCriticality, groupItemsBySubsystem, getModelConsistencyIssues } from "@/lib/departamento-tecnico-page-helpers";

export default function DepartamentoTecnicoPage() {
  const [folders, setFolders] = useState<Record<FolderType, FolderData>>({
    manuais: { files: [], loading: true },
    documentacao: { files: [], loading: true },
    legislacao: { files: [], loading: true },
    boletins: { files: [], loading: true },
  });

  const [uploading, setUploading] = useState<FolderType | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [manualFilterEquipamento, setManualFilterEquipamento] = useState<"Todos" | "Jangadas" | "Coletes" | "Outros">("Todos");
  const [manualFilterMarca, setManualFilterMarca] = useState<string>("Todos");
  const [manualFilterModelo, setManualFilterModelo] = useState<string>("");
  const [kbFilterMarca, setKbFilterMarca] = useState<string>("Todas");
  const [kbFilterTexto, setKbFilterTexto] = useState<string>("");
  const [kbFilterLotacao, setKbFilterLotacao] = useState<string>("Todas");
  const [kbFilterConfiguracao, setKbFilterConfiguracao] = useState<string>("Todas");
  const [kbOnlyComplete, setKbOnlyComplete] = useState<boolean>(false);
  const [manualNamingEnabled, setManualNamingEnabled] = useState<boolean>(true);
  const [manualUploadMeta, setManualUploadMeta] = useState<{
    equipamento: "Jangadas" | "Coletes";
    marca: string;
    modelo: string;
  }>({
    equipamento: "Jangadas",
    marca: "",
    modelo: "",
  });
  const [jangadaBrandCounts, setJangadaBrandCounts] = useState<JangadaBrandCount[]>([]);
  const [jangadaBrandModelCounts, setJangadaBrandModelCounts] = useState<JangadaBrandModelCount[]>([]);
  const fileInputRefs = useRef<Record<FolderType, HTMLInputElement | null>>({
    manuais: null,
    documentacao: null,
    legislacao: null,
    boletins: null,
  });

  const jangadaBrandCountMap = jangadaBrandCounts.reduce<Map<string, number>>((acc, item) => {
    const key = normalizeToken(item.marca);
    acc.set(key, Math.max(acc.get(key) || 0, Number(item.total || 0)));
    return acc;
  }, new Map());

  const jangadaBrandModelCountMap = jangadaBrandModelCounts.reduce<Map<string, number>>((acc, item) => {
    const key = buildBrandModelCountKey(item.marca, item.modelo);
    acc.set(key, Math.max(acc.get(key) || 0, Number(item.total || 0)));
    return acc;
  }, new Map());

  const getBrandRaftCount = (brand: string) => jangadaBrandCountMap.get(normalizeToken(brand)) || 0;
  const getBrandModelRaftCount = (brand: string, model: string) =>
    jangadaBrandModelCountMap.get(buildBrandModelCountKey(brand, model)) || 0;

  useEffect(() => {
    loadAllFolders();
    loadJangadaStats();
  }, []);

  const loadJangadaStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) return;
      const data = await res.json();
      setJangadaBrandCounts(Array.isArray(data?.jangadasPorMarca) ? data.jangadasPorMarca : []);
      setJangadaBrandModelCounts(Array.isArray(data?.jangadasPorMarcaModelo) ? data.jangadasPorMarcaModelo : []);
    } catch {
      setJangadaBrandCounts([]);
      setJangadaBrandModelCounts([]);
    }
  };

  const loadAllFolders = async () => {
    setFolders(prev => ({
      ...prev,
      manuais: { files: [], loading: false },
      boletins: { files: [], loading: false },
    }));
    
    for (const folder of INTERNAL_MANAGED_FOLDERS) {
      try {
        const res = await fetch(`/api/upload-documento?folder=${folder}`);
        if (res.ok) {
          const data = await res.json();
          setFolders(prev => ({
            ...prev,
            [folder]: { files: data.files || [], loading: false },
          }));
        } else {
          setFolders(prev => ({
            ...prev,
            [folder]: { files: [], loading: false },
          }));
        }
      } catch (error) {
        setFolders(prev => ({
          ...prev,
          [folder]: { files: [], loading: false },
        }));
      }
    }
  };

  const handleFileSelect = (folder: FolderType, file: File | null) => {
    if (!file) return;

    if (EXTERNAL_ONLY_FOLDERS.includes(folder)) {
      setMessage({
        type: 'error',
        text: folder === 'manuais'
          ? 'Os manuais estão no Google Drive. Use os links externos desta página.'
          : 'Os boletins estão no Google Drive. Use os links externos desta página.',
      });
      if (fileInputRefs.current[folder]) {
        fileInputRefs.current[folder]!.value = '';
      }
      return;
    }

    if (folder === 'manuais' && manualNamingEnabled) {
      const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}` : '';
      const originalName = file.name.replace(/\.[^/.]+$/, '');
      const source = inferManualCategory(file.name, file.webkitRelativePath || undefined);
      const equipamento = manualUploadMeta.equipamento || source.equipamento;
      const marca = manualUploadMeta.marca.trim() || source.marca || 'Genérica';
      const modelo = manualUploadMeta.modelo.trim() || source.modelo || 'Geral';

      const sanitize = (value: string) =>
        value
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^A-Za-z0-9\-_. ]+/g, ' ')
          .trim()
          .replace(/\s+/g, '_');

      const suggestedName = `${sanitize(equipamento)}_${sanitize(marca)}_${sanitize(modelo)}_${sanitize(originalName)}${ext}`;
      const renamedFile = new File([file], suggestedName, { type: file.type, lastModified: file.lastModified });
      uploadFile(folder, renamedFile);
      return;
    }

    uploadFile(folder, file);
  };

  const uploadFile = async (folder: FolderType, file: File) => {
    if (EXTERNAL_ONLY_FOLDERS.includes(folder)) {
      setMessage({
        type: 'error',
        text: folder === 'manuais'
          ? 'Os manuais já são geridos no Google Drive e não são carregados pela aplicação.'
          : 'Os boletins já são geridos no Google Drive e não são carregados pela aplicação.',
      });
      return;
    }

    setUploading(folder);
    setUploadProgress(`A carregar ${file.name}...`);
    setMessage(null);

    try {
      const maxUploadBytes = getMaxUploadBytesByFolder(folder);
      const maxUploadMb = (maxUploadBytes / 1024 / 1024).toFixed(0);
      if (file.size > maxUploadBytes) {
        throw new Error(`Ficheiro muito grande. Máximo: ${maxUploadMb} MB. Tamanho: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      }

      if (!isAllowedUploadExtension(file.name)) {
        throw new Error("Tipo de ficheiro não permitido. Use: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG");
      }

      const safeName = sanitizeFilename(file.name);
      let uploaded = false;

      try {
        await uploadToBlob(`documentos-tecnicos/${folder}/${safeName}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload-documento/client-upload",
          multipart: file.size >= 5 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => {
            setUploadProgress(`A carregar ${file.name}... ${Math.round(percentage)}%`);
          },
        });
        uploaded = true;
      } catch (clientUploadError: any) {
        const msg = String(clientUploadError?.message || "").toLowerCase();
        const canFallbackToServerRoute =
          msg.includes("client token") ||
          msg.includes("fetching client token") ||
          msg.includes("blob") ||
          msg.includes("upload-documento/client-upload") ||
          msg.includes("failed to fetch");

        const LARGE_UPLOAD_FALLBACK_LIMIT = 4 * 1024 * 1024;
        const shouldAvoidFallbackForLargeFiles = file.size > LARGE_UPLOAD_FALLBACK_LIMIT;

        if (shouldAvoidFallbackForLargeFiles) {
          throw new Error(
            "Upload direto indisponível para ficheiros grandes. Configure BLOB_READ_WRITE_TOKEN na Vercel e faça novo deploy."
          );
        }

        if (canFallbackToServerRoute) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', folder);

          const res = await fetch('/api/upload-documento', {
            method: 'POST',
            body: formData,
          });

          const raw = await res.text();
          const data = (() => {
            try {
              return JSON.parse(raw);
            } catch {
              return { error: raw || 'Resposta inválida do servidor' };
            }
          })();

          if (!res.ok) {
            throw new Error(data.error || 'Erro ao carregar ficheiro');
          }

          uploaded = true;
        } else {
          throw clientUploadError;
        }
      }

      if (uploaded) {
        setMessage({ type: 'success', text: 'Ficheiro carregado com sucesso!' });
        const reloadRes = await fetch(`/api/upload-documento?folder=${folder}`);
        if (reloadRes.ok) {
          const reloadData = await reloadRes.json();
          setFolders(prev => ({
            ...prev,
            [folder]: { ...prev[folder], files: reloadData.files || [] },
          }));
        }
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `Erro: ${error.message}` });
    } finally {
      setUploading(null);
      setUploadProgress('');
      // Limpar input
      if (fileInputRefs.current[folder]) {
        fileInputRefs.current[folder]!.value = '';
      }
    }
  };

  const handleDelete = async (folder: FolderType, fileName: string) => {
    if (EXTERNAL_ONLY_FOLDERS.includes(folder)) {
      setMessage({
        type: 'error',
        text: folder === 'manuais'
          ? 'Os manuais são mantidos externamente no Google Drive.'
          : 'Os boletins são mantidos externamente no Google Drive.',
      });
      return;
    }

    const confirmed = window.confirm(`Tem a certeza que deseja eliminar "${fileName}"?`);
    if (!confirmed) return;

    setMessage(null);
    setUploadProgress(`A eliminar ${fileName}...`);

    try {
      const endpoint = `/api/${folder}/${encodeURIComponent(fileName)}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
      });

      const raw = await res.text();
      const data = (() => {
        try {
          return JSON.parse(raw);
        } catch {
          return { error: raw || 'Resposta inválida do servidor' };
        }
      })();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Ficheiro eliminado com sucesso!' });
        // Recarregar a pasta específica
        const reloadRes = await fetch(`/api/upload-documento?folder=${folder}`);
        if (reloadRes.ok) {
          const reloadData = await reloadRes.json();
          setFolders(prev => ({
            ...prev,
            [folder]: { ...prev[folder], files: reloadData.files || [] },
          }));
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao eliminar ficheiro' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `Erro: ${error.message}` });
    } finally {
      setUploadProgress('');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const manuaisOrganizados = (() => {
    const filteredManuais = folders.manuais.files.filter((file) => {
      const category = inferManualCategory(file.name, file.relativePath);

      if (manualFilterEquipamento !== "Todos" && category.equipamento !== manualFilterEquipamento) {
        return false;
      }

      if (manualFilterMarca !== "Todos" && category.marca !== manualFilterMarca) {
        return false;
      }

      if (manualFilterModelo.trim()) {
        const term = normalizeToken(manualFilterModelo.trim());
        const inModel = normalizeToken(category.modelo).includes(term);
        const inName = normalizeToken(file.name).includes(term);
        if (!inModel && !inName) return false;
      }

      return true;
    });

    const grouped: Record<string, Record<string, FileInfo[]>> = {};

    for (const file of filteredManuais) {
      const { marca, modelo } = inferManualCategory(file.name, file.relativePath);
      if (!grouped[marca]) grouped[marca] = {};
      if (!grouped[marca][modelo]) grouped[marca][modelo] = [];
      grouped[marca][modelo].push(file);
    }

    return grouped;
  })();

  const renderManualGroups = () => {
    if (folders.manuais.loading) {
      return <p className="text-sm text-gray-500">A carregar ficheiros...</p>;
    }

    if (folders.manuais.files.length === 0) {
      return (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 text-center">
          <p className="font-medium">Os manuais estão disponíveis no Google Drive.</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs">
            <a
              href={TECHNICAL_LIBRARY_DRIVE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Abrir biblioteca técnica
            </a>
            <a
              href={COLETES_MANUAIS_DRIVE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Abrir manuais de coletes
            </a>
          </div>
        </div>
      );
    }

    const totalFiltered = Object.values(manuaisOrganizados).reduce(
      (acc, models) => acc + Object.values(models).reduce((sub, items) => sub + items.length, 0),
      0
    );

    if (totalFiltered === 0) {
      return (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600 text-center">
          Nenhum manual corresponde aos filtros selecionados.
        </div>
      );
    }

    const discoveredBrands = Object.keys(manuaisOrganizados);
    const brands = [...discoveredBrands].sort((a, b) => {
      const aGeneric = isGenericManualBrand(a);
      const bGeneric = isGenericManualBrand(b);
      if (aGeneric !== bGeneric) return aGeneric ? 1 : -1;

      const countDiff = getBrandRaftCount(b) - getBrandRaftCount(a);
      if (countDiff !== 0) return countDiff;

      const fixedOrderDiff = FIXED_BRAND_ORDER.indexOf(a.toUpperCase()) - FIXED_BRAND_ORDER.indexOf(b.toUpperCase());
      const aFixed = FIXED_BRAND_ORDER.includes(a.toUpperCase());
      const bFixed = FIXED_BRAND_ORDER.includes(b.toUpperCase());
      if (aFixed && bFixed && fixedOrderDiff !== 0) return fixedOrderDiff;
      if (aFixed !== bFixed) return aFixed ? -1 : 1;

      return a.localeCompare(b, "pt-PT");
    });

    return (
      <div className="space-y-4">
        {brands.map((brand) => {
          const models = manuaisOrganizados[brand] || {};
          const modelKeys = Object.keys(models).sort((a, b) => {
            const countDiff = getBrandModelRaftCount(brand, b) - getBrandModelRaftCount(brand, a);
            if (countDiff !== 0) return countDiff;
            return a.localeCompare(b, "pt-PT");
          });
          const totalBrandFiles = modelKeys.reduce((sum, model) => sum + models[model].length, 0);
          const isGenericBrand = isGenericManualBrand(brand);
          const totalBrandRafts = getBrandRaftCount(brand);

          return (
            <details
              key={brand}
              className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden group"
              open={!isGenericBrand}
            >
              <summary className="flex items-center justify-between gap-3 p-3 cursor-pointer list-none hover:bg-gray-100">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">{brand}</h3>
                  <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-0.5">
                    {totalBrandRafts} jangada{totalBrandRafts !== 1 ? 's' : ''}
                  </span>
                  <span className="text-[11px] text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                    {totalBrandFiles} ficheiro{totalBrandFiles !== 1 ? 's' : ''}
                  </span>
                  {isGenericBrand && (
                    <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                      recolhível
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="px-3 pb-3">
              {modelKeys.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-3 text-xs text-gray-500">
                  Sem manuais desta marca para os filtros atuais.
                </div>
              ) : (
              <div className="space-y-3">
                {modelKeys.map((model) => (
                  <div key={`${brand}-${model}`} className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <p className="text-xs font-semibold text-blue-900">Modelo: {model}</p>
                      <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-0.5">
                        {getBrandModelRaftCount(brand, model)} jangada{getBrandModelRaftCount(brand, model) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {models[model].map((file, idx) => {
                        const category = inferManualCategory(file.name, file.relativePath);
                        const filePath = file.relativePath || file.name;
                        const manualHref = category.equipamento === 'Coletes'
                          ? COLETES_MANUAIS_DRIVE_URL
                          : TECHNICAL_LIBRARY_DRIVE_URL;
                        return (
                        <li
                          key={`${brand}-${model}-${idx}`}
                          className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 truncate font-medium">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)} • {new Date(file.modified).toLocaleDateString('pt-PT')} • {category.equipamento}
                            </p>
                          </div>
                          <div className="flex gap-3 text-xs ml-4">
                            <a
                              href={manualHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-700 hover:underline font-medium whitespace-nowrap"
                            >
                              Abrir
                            </a>
                            <a
                              href={manualHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 hover:underline font-medium whitespace-nowrap"
                            >
                              Abrir Drive
                            </a>
                            <button
                              onClick={() => handleDelete('manuais', filePath)}
                              className="text-red-700 hover:underline font-medium whitespace-nowrap"
                            >
                              Eliminar
                            </button>
                          </div>
                        </li>
                      )})}
                    </ul>
                  </div>
                ))}
              </div>
              )}
              </div>
            </details>
          );
        })}
      </div>
    );
  };

  const renderFolderSection = (
    folder: FolderType,
    title: string,
    icon: string,
    description: string,
    apiPath: string,
    externalLibraryHref?: string,
    externalOnly?: boolean
  ) => {
    const data = folders[folder];
    const isUploading = uploading === folder;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>{icon}</span>
              {title}
            </h2>
            <p className="text-xs text-gray-600 mt-1">{description}</p>
            {externalLibraryHref && (
              <a
                href={externalLibraryHref}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
              >
                Biblioteca externa no Drive ↗
              </a>
            )}
          </div>
          <div>
            {externalOnly ? (
              externalLibraryHref ? (
                <a
                  href={externalLibraryHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700"
                >
                  ☁ Abrir no Drive
                </a>
              ) : null
            ) : (
              <>
                <input
                  ref={(el) => { fileInputRefs.current[folder] = el; }}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileSelect(folder, e.target.files?.[0] || null)}
                  className="hidden"
                  id={`upload-${folder}`}
                />
                <label
                  htmlFor={`upload-${folder}`}
                  className={`inline-block px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                    isUploading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isUploading ? '⏳ A carregar...' : '📤 Upload'}
                </label>
              </>
            )}
          </div>
        </div>

        {externalOnly ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            Esta biblioteca é mantida externamente no Google Drive. A aplicação deixou de carregar, listar ou apagar estes ficheiros localmente.
          </div>
        ) : data.loading ? (
          <p className="text-sm text-gray-500">A carregar ficheiros...</p>
        ) : data.files.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600 text-center">
            Nenhum ficheiro nesta pasta. Use o botão Upload acima.
          </div>
        ) : (
          <ul className="space-y-2">
            {data.files.map((file, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {new Date(file.modified).toLocaleDateString('pt-PT')}
                  </p>
                </div>
                <div className="flex gap-3 text-xs ml-4">
                  <a
                    href={`/api/${apiPath}/${encodeURIComponent(file.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:underline font-medium whitespace-nowrap"
                  >
                    Abrir
                  </a>
                  <a
                    href={`/api/${apiPath}/${encodeURIComponent(file.name)}`}
                    download={file.name}
                    className="text-emerald-700 hover:underline font-medium whitespace-nowrap"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => handleDelete(folder, file.name)}
                    className="text-red-700 hover:underline font-medium whitespace-nowrap"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const kbEntries = Object.entries(raftModelData).filter(([, models]) => models.length > 0);
  const kbAvailableBrands = kbEntries.map(([brand]) => brand).sort((a, b) => a.localeCompare(b, "pt-PT"));
  const kbAvailableLotacoes = Array.from(
    new Set(
      kbEntries.flatMap(([, models]) =>
        models.flatMap((model) => model.specifications.map((spec) => spec.capacity).filter((capacity) => capacity > 0))
      )
    )
  ).sort((a, b) => a - b);

  const normalizedKbQuery = normalizeToken(kbFilterTexto.trim());
  const kbFiltered = kbEntries
    .map(([brand, models]) => {
      if (kbFilterMarca !== "Todas" && brand !== kbFilterMarca) {
        return [brand, []] as const;
      }

      const filteredModels = models.filter((model) => {
        if (kbFilterLotacao !== "Todas") {
          const lotacao = Number(kbFilterLotacao);
          if (!model.specifications.some((spec) => spec.capacity === lotacao)) {
            return false;
          }
        }

        if (kbOnlyComplete && getModelCompleteness(model).label !== 'Completo') {
          return false;
        }

        if (kbFilterConfiguracao !== "Todas") {
          const hasConfigAtModel = (model.configuration || []).some((cfg) => {
            const normalizedCfg = normalizeToken(cfg);
            if (kbFilterConfiguracao === "TO") return normalizedCfg.includes("throw") || normalizedCfg.includes("to");
            if (kbFilterConfiguracao === "DL") return normalizedCfg.includes("davit") || normalizedCfg.includes("dl");
            return false;
          });

          const hasConfigAtSpec = model.specifications.some((spec) => {
            const normalizedCfg = normalizeToken(spec.configuration || "");
            if (kbFilterConfiguracao === "TO") return normalizedCfg.includes("throw") || normalizedCfg === "to";
            if (kbFilterConfiguracao === "DL") return normalizedCfg.includes("davit") || normalizedCfg === "dl";
            return false;
          });

          const hasConfiguration = hasConfigAtModel || hasConfigAtSpec;
          if (!hasConfiguration) return false;
        }

        if (!normalizedKbQuery) return true;

        const searchableParts = [
          model.name,
          ...(model.inflationSystem || []),
          ...(model.valves || []),
          ...(model.notes || []),
          model.head || "",
          ...(model.specifications.map((spec) => spec.codRef || "")),
        ];

        return searchableParts.some((part) => normalizeToken(part).includes(normalizedKbQuery));
      });

      return [brand, filteredModels.sort((a, b) => {
        const countDiff = getBrandModelRaftCount(brand, b.name) - getBrandModelRaftCount(brand, a.name);
        if (countDiff !== 0) return countDiff;
        return a.name.localeCompare(b.name, "pt-PT");
      })] as const;
    })
    .filter(([, models]) => models.length > 0)
    .sort(([brandA], [brandB]) => {
      const countDiff = getBrandRaftCount(brandB) - getBrandRaftCount(brandA);
      if (countDiff !== 0) return countDiff;
      return brandA.localeCompare(brandB, "pt-PT");
    });

  const kbTotalModels = kbFiltered.reduce((acc, [, models]) => acc + models.length, 0);

  const buildKbCsvContent = () => {
    const header = [
      'Marca',
      'Modelo',
      'QualidadeDados',
      'Inconsistencias',
      'Ref',
      'Lotacao',
      'Configuracao',
      'Pack',
      'CO2_kg',
      'N2_kg',
      'Volume_L',
      'Fonte',
    ];

    const escapeCsv = (value: string | number | null | undefined) => {
      const text = String(value ?? '');
      if (/[,;\n"]/g.test(text)) return `"${text.replace(/"/g, '""')}"`;
      return text;
    };

    const rows = kbFiltered.flatMap(([brand, models]) =>
      models.flatMap((model) => {
        const quality = getModelCompleteness(model).label;
        const issues = getModelConsistencyIssues(model).join(' | ');

        return model.specifications.map((spec) => [
          brand,
          model.name,
          quality,
          issues,
          spec.codRef || '',
          spec.capacity > 0 ? `${spec.capacity}P` : '',
          spec.configuration || '',
          spec.pack || '',
          spec.cylinder?.co2 ?? '',
          getSpecN2DisplayValue(spec) ?? '',
          spec.cylinder?.volume ?? '',
          spec.source?.doc
            ? `${spec.source.doc}${spec.source.page ? ` p.${spec.source.page}` : ''}${spec.source.revision ? ` (${spec.source.revision})` : ''}`
            : '',
        ]);
      })
    );

    return [header, ...rows].map((line) => line.map(escapeCsv).join(';')).join('\n');
  };

  const handleExportKbCsv = () => {
    const csv = buildKbCsvContent();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `base-conhecimento-filtrada-${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h1 className="text-2xl font-bold text-gray-900">Departamento Técnico</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestão técnica centralizada com biblioteca externa no Google Drive para manuais e boletins, mantendo documentação e legislação na aplicação.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">☁ Biblioteca externa / Google Drive</h2>
              <p className="mt-1 text-sm text-slate-600">
                Pastas partilhadas por tipo de conteúdo técnico para acesso rápido do Departamento Técnico.
              </p>
            </div>
            <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
              Fonte: Google Drive partilhado
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <a
              href={COLETES_MANUAIS_DRIVE_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-blue-200 bg-blue-50 p-4 transition hover:bg-blue-100"
            >
              <p className="text-sm font-semibold text-blue-900">📖 Abrir manuais de coletes</p>
              <p className="mt-1 text-xs text-blue-700">Aceder à pasta externa para descarregar manuais técnicos de coletes.</p>
            </a>
            <a
              href={BOLETINS_SERVICO_DRIVE_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 transition hover:bg-amber-100"
            >
              <p className="text-sm font-semibold text-amber-900">📢 Abrir boletins de serviço (Jangadas)</p>
              <p className="mt-1 text-xs text-amber-700">Ir diretamente à origem externa para descarregar boletins de serviço das jangadas.</p>
            </a>
            <a
              href={TECHNICAL_LIBRARY_DRIVE_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100"
            >
              <p className="text-sm font-semibold text-slate-900">🗂 Abrir biblioteca técnica completa</p>
              <p className="mt-1 text-xs text-slate-700">Explorar a biblioteca externa no Google Drive para consulta rápida de manuais e boletins.</p>
            </a>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            Nota: o Google Drive pode pedir autenticação antes de mostrar ou permitir o download dos ficheiros.
          </p>
        </div>

        {/* Mensagem de feedback */}
        {message && (
          <div
            className={`rounded-lg p-4 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Progress */}
        {uploadProgress && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              {uploadProgress}
            </p>
          </div>
        )}

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-2">📦 Spare Parts MK IV</h2>
            <p className="text-xs text-gray-600 mb-3">162 peças sobressalentes do manual MK IV.</p>
            <Link href="/stock?modelo=MK IV" className="text-xs text-blue-700 font-medium hover:underline">
              Ver catálogo completo →
            </Link>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-4">
            <h2 className="font-semibold text-blue-900 mb-2">📖 Manuais no Drive</h2>
            <p className="text-xs text-blue-700">Biblioteca externa para consulta técnica</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-4">
            <h2 className="font-semibold text-purple-900 mb-2">📋 {folders.documentacao.files.length} Docs</h2>
            <p className="text-xs text-purple-700">Documentação interna</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 p-4">
            <h2 className="font-semibold text-amber-900 mb-2">📢 Boletins no Drive</h2>
            <p className="text-xs text-amber-700">Atualizações externas dos fabricantes</p>
          </div>
        </div>

        {/* Base de Conhecimento Técnico */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">🔬</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Base de Conhecimento Técnico</h2>
              <p className="text-xs text-gray-500 mt-0.5">Resumo dos manuais analisados — organizados por marca e modelo</p>
            </div>
            <span className="ml-auto text-xs text-gray-400 bg-gray-100 rounded-full px-2.5 py-1">
              {kbTotalModels} modelo{kbTotalModels !== 1 ? 's' : ''} no filtro
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
            <select
              value={kbFilterMarca}
              onChange={(e) => setKbFilterMarca(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="Todas">Todas as marcas</option>
              {kbAvailableBrands.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>

            <input
              value={kbFilterTexto}
              onChange={(e) => setKbFilterTexto(e.target.value)}
              placeholder="Pesquisar modelo/ref/sistema..."
              className="border rounded-lg px-3 py-2 text-sm"
            />

            <select
              value={kbFilterLotacao}
              onChange={(e) => setKbFilterLotacao(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="Todas">Todas as lotações</option>
              {kbAvailableLotacoes.map((lot) => (
                <option key={lot} value={String(lot)}>{lot}P</option>
              ))}
            </select>

            <select
              value={kbFilterConfiguracao}
              onChange={(e) => setKbFilterConfiguracao(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="Todas">Todas as configurações</option>
              <option value="TO">Apenas TO</option>
              <option value="DL">Apenas DL</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={kbOnlyComplete}
                onChange={(e) => setKbOnlyComplete(e.target.checked)}
              />
              Mostrar apenas modelos completos
            </label>

            <button
              type="button"
              onClick={handleExportKbCsv}
              className="px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
            >
              Exportar CSV (filtro atual)
            </button>
          </div>

          {kbFiltered.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600 text-center mb-4">
              Nenhum modelo corresponde aos filtros da base de conhecimento.
            </div>
          )}

          <div className="space-y-2">
            {kbFiltered
              .map(([brand, models]) => {
                const brandBulletins = getTechnicalBulletinsForBrand(brand);

                return (
                <details key={brand} className="border border-gray-200 rounded-lg overflow-hidden">
                  <summary className="flex items-center justify-between px-4 py-2.5 bg-gray-50 cursor-pointer hover:bg-gray-100 select-none list-none">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-gray-900 text-sm shrink-0">{brand}</span>
                      <span className="text-xs text-gray-500 bg-white border border-gray-200 rounded-full px-1.5 py-0.5 shrink-0">
                        {models.length} modelo{models.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-gray-400 truncate hidden sm:block">— {models.map(m => m.name).join(', ')}</span>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">▼</span>
                  </summary>
                  <div className="p-4 space-y-4 bg-white">
                    {brandBulletins.length > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div>
                            <p className="text-sm font-semibold text-amber-900">Boletins de serviço da marca</p>
                            <p className="text-xs text-amber-800">Resumo técnico dos modelos afetados e respetivos intervalos de fabrico.</p>
                          </div>
                          <span className="inline-flex rounded-full border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            {brandBulletins.length} boletim{brandBulletins.length === 1 ? '' : 's'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {brandBulletins.map((bulletin) => (
                            <div key={bulletin.id} className="rounded-lg border border-amber-200 bg-white p-3">
                              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                <div>
                                  <p className="font-medium text-amber-950">{formatTechnicalBulletinShortLabel(bulletin)}</p>
                                  {(bulletin.bulletinNumber || bulletin.issueDate) ? (
                                    <p className="text-xs text-amber-900 mt-1">
                                      {bulletin.bulletinNumber ? <><b>Nº:</b> {bulletin.bulletinNumber}</> : null}
                                      {bulletin.bulletinNumber && bulletin.issueDate ? ' · ' : ''}
                                      {bulletin.issueDate ? <><b>Data:</b> {bulletin.issueDate}</> : null}
                                    </p>
                                  ) : null}
                                  <p className="text-xs text-gray-600 mt-1">{bulletin.title}</p>
                                  <p className="text-xs text-amber-800 mt-1">{bulletin.description}</p>
                                </div>
                                <a
                                  href={buildTechnicalBulletinUrl(bulletin.fileName)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex rounded-lg border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200"
                                >
                                  Abrir PDF
                                </a>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {bulletin.rules.map((rule) => (
                                  <div key={`${bulletin.id}-${rule.label}`} className="rounded border border-amber-100 bg-amber-50/50 px-2 py-2 text-xs text-amber-950">
                                    <p className="font-semibold">{rule.label}</p>
                                    <p className="mt-1">Modelo sistema: {rule.canonicalModel || '—'}</p>
                                    <p>Contentor: {rule.containerAliases?.join(' / ') || '—'}</p>
                                    <p>Fabrico: {rule.yearFrom ?? '—'}–{rule.yearTo ?? '—'}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {models.map((model) => {
                      const itemGroupsService = groupItemsBySubsystem(model.serviceItems || []);
                      const itemGroupsSpare = groupItemsBySubsystem(model.spareParts || []);
                      const keyTechnicalDisplay = getModelKeyTechnicalDisplay(model);
                      const modelBulletinMatches = getMatchingBulletinRulesForModel(brand, model.name);
                      const containerClosureCatalog = getContainerClosureCatalogForModel({ brand, model: model.name, containerModel: model.containerModel || '' });
                      const containerClosureNotes = getContainerClosureMatchBundle({ brand, model: model.name, containerModel: model.containerModel || '' }).operationalNotes;

                      return (
                      <div key={model.name} className="border border-gray-100 rounded-lg p-3">
                        {(() => {
                          const modelTubos = getModelTubes(model);
                          const completeness = getModelCompleteness(model);
                          const consistencyIssues = getModelConsistencyIssues(model);
                          const hasSpecConfiguration = model.specifications.some((spec) => spec.configuration);
                          const hasSpecSource = model.specifications.some((spec) => spec.source?.doc);
                          const toDlPerCapacity = model.specifications.reduce<Record<number, { TO?: typeof model.specifications[number]; DL?: typeof model.specifications[number] }>>((acc, spec) => {
                            const cfg = normalizeConfig(spec.configuration);
                            if (!cfg) return acc;
                            if (!acc[spec.capacity]) acc[spec.capacity] = {};
                            if (cfg === 'TO') acc[spec.capacity].TO = spec;
                            if (cfg === 'DL') acc[spec.capacity].DL = spec;
                            return acc;
                          }, {});
                          const toDlDiffByCapacity = Object.entries(toDlPerCapacity).reduce<Record<number, string>>((acc, [cap, pair]) => {
                            if (!pair.TO || !pair.DL) return acc;
                            const toCo2 = pair.TO.cylinder?.co2;
                            const dlCo2 = pair.DL.cylinder?.co2;
                            const toN2 = getSpecN2DisplayValue(pair.TO);
                            const dlN2 = getSpecN2DisplayValue(pair.DL);
                            const toVol = pair.TO.cylinder?.volume;
                            const dlVol = pair.DL.cylinder?.volume;
                            const hasDiff = toCo2 !== dlCo2 || toN2 !== dlN2 || toVol !== dlVol;
                            acc[Number(cap)] = hasDiff
                              ? `Δ TO/DL · CO₂ ${toCo2 ?? '—'}→${dlCo2 ?? '—'} · N₂ ${toN2 ?? '—'}→${dlN2 ?? '—'}${toVol !== dlVol ? ` · Vol ${toVol ?? '—'}→${dlVol ?? '—'}` : ''}`
                              : 'TO = DL (gases)';
                            return acc;
                          }, {});
                          const hasToDlComparisons = Object.keys(toDlDiffByCapacity).length > 0;
                          return (
                            <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                              <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Dados técnicos-chave</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                <div className="text-gray-700">
                                  <span className="font-medium">Sistema de insuflação:</span>{' '}
                                  {keyTechnicalDisplay.inflationSystem}
                                </div>
                                <div className="text-gray-700">
                                  <span className="font-medium">Válvulas:</span>{' '}
                                  {keyTechnicalDisplay.valves}
                                </div>
                                <div className="text-gray-700 md:col-span-2">
                                  <span className="font-medium">Tubos:</span>{' '}
                                  {keyTechnicalDisplay.tubes}
                                </div>
                                <div className="text-gray-700 md:col-span-2">
                                  <span className="font-medium">Torques:</span>{' '}
                                  {keyTechnicalDisplay.torques}
                                </div>
                              </div>

                              <div className="mt-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ${completeness.className}`}>
                                  Qualidade de dados: {completeness.label}
                                </span>
                                {consistencyIssues.length > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium bg-amber-50 text-amber-700 border-amber-200 ml-2">
                                    ⚠️ {consistencyIssues.length} inconsistência(s)
                                  </span>
                                )}
                              </div>

                              {consistencyIssues.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {consistencyIssues.map((issue, idx) => (
                                    <p key={idx} className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                      {issue}
                                    </p>
                                  ))}
                                </div>
                              )}

                              {model.specifications && model.specifications.length > 0 && (
                                <div className="overflow-x-auto mt-2">
                                  <table className="min-w-[760px] text-xs border-collapse">
                                    <thead>
                                      <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="text-left px-2 py-1 text-gray-500 font-medium">Ref.</th>
                                        <th className="text-left px-2 py-1 text-gray-500 font-medium">Lotação</th>
                                        {hasSpecConfiguration && (
                                          <th className="text-left px-2 py-1 text-gray-500 font-medium">Config.</th>
                                        )}
                                        {model.specifications.some(s => s.pack) && (
                                          <th className="text-left px-2 py-1 text-gray-500 font-medium">Pack</th>
                                        )}
                                        <th className="text-right px-2 py-1 text-gray-500 font-medium">CO₂ (kg)</th>
                                        <th className="text-right px-2 py-1 text-gray-500 font-medium">N₂ (kg)</th>
                                        {model.specifications.some(s => s.cylinder?.volume) && (
                                          <th className="text-right px-2 py-1 text-gray-500 font-medium">Vol. (L)</th>
                                        )}
                                        {hasToDlComparisons && (
                                          <th className="text-left px-2 py-1 text-gray-500 font-medium">Comparação TO/DL</th>
                                        )}
                                        {hasSpecSource && (
                                          <th className="text-left px-2 py-1 text-gray-500 font-medium">Fonte</th>
                                        )}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {model.specifications.map((spec, i) => (
                                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                          <td className="px-2 py-1 text-gray-400 font-mono text-[10px]">{spec.codRef || '—'}</td>
                                          <td className="px-2 py-1 font-semibold text-gray-800">{spec.capacity}P</td>
                                          {hasSpecConfiguration && (
                                            <td className="px-2 py-1 text-gray-600">{spec.configuration || '—'}</td>
                                          )}
                                          {model.specifications.some(s => s.pack) && (
                                            <td className="px-2 py-1 text-gray-600">{spec.pack || '—'}</td>
                                          )}
                                          <td className="px-2 py-1 text-right text-gray-700">{spec.cylinder?.co2 ?? '—'}</td>
                                          <td className="px-2 py-1 text-right text-gray-700">{getSpecN2DisplayValue(spec) ?? '—'}</td>
                                          {model.specifications.some(s => s.cylinder?.volume) && (
                                            <td className="px-2 py-1 text-right text-gray-700">{spec.cylinder?.volume ?? '—'}</td>
                                          )}
                                          {hasToDlComparisons && (
                                            <td className="px-2 py-1 text-[11px]">
                                              {toDlDiffByCapacity[spec.capacity] ? (
                                                <span
                                                  className={`inline-flex items-center rounded-full border px-2 py-0.5 ${toDlDiffByCapacity[spec.capacity].startsWith('TO = DL')
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-purple-50 text-purple-700 border-purple-200'
                                                    }`}
                                                >
                                                  {toDlDiffByCapacity[spec.capacity]}
                                                </span>
                                              ) : '—'}
                                            </td>
                                          )}
                                          {hasSpecSource && (
                                            <td className="px-2 py-1 text-[11px] text-gray-600">
                                              {spec.source?.doc
                                                ? `${spec.source.doc}${spec.source.page ? ` p.${spec.source.page}` : ''}${spec.source.revision ? ` (${spec.source.revision})` : ''}`
                                                : '—'}
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-800 text-sm">🛟 {model.name}</h4>
                          {model.containerModel && (
                            <span className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5">Container: {model.containerModel}</span>
                          )}
                          {model.certification?.map(c => (
                            <span key={c} className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-full px-2 py-0.5">{c}</span>
                          ))}
                          {model.configuration?.map(c => (
                            <span key={c} className="text-xs text-purple-700 bg-purple-50 border border-purple-100 rounded-full px-2 py-0.5">{c}</span>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-xs mb-2">
                          {model.material && (
                            <div className="text-gray-600"><span className="font-medium">Material:</span> {model.material}</div>
                          )}
                          {model.inflationSystem && model.inflationSystem.length > 0 && (
                            <div className="text-gray-600"><span className="font-medium">Sistema insuflação:</span> {model.inflationSystem.join(' / ')}</div>
                          )}
                          {model.valves && model.valves.length > 0 && (
                            <div className="text-gray-600"><span className="font-medium">Válvulas:</span> {model.valves.join(', ')}</div>
                          )}
                          {model.head && (
                            <div className="text-gray-600"><span className="font-medium">Cabeça disparo:</span> {model.head}</div>
                          )}
                          {model.inflationTechnology && (
                            <div className="text-gray-600 sm:col-span-2"><span className="font-medium">Tecnologia:</span> {model.inflationTechnology}</div>
                          )}
                          {model.packTypes && model.packTypes.length > 0 && (
                            <div className="text-gray-600"><span className="font-medium">Packs:</span> {model.packTypes.join(', ')}</div>
                          )}
                          {model.battery && (
                            <div className="text-gray-600"><span className="font-medium">Bateria:</span> {model.battery}</div>
                          )}
                          {model.lights && model.lights.length > 0 && (
                            <div className="text-gray-600"><span className="font-medium">Luzes:</span> {model.lights.join(', ')}</div>
                          )}
                          {model.torques && model.torques.length > 0 && (
                            <div className="text-gray-600 sm:col-span-2"><span className="font-medium">Binários:</span> {model.torques.join(' · ')}</div>
                          )}
                        </div>
                        {model.notes && model.notes.length > 0 && (
                          <div className="mb-2 space-y-1">
                            {model.notes.map((note, i) => (
                              <p key={i} className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">ℹ️ {note}</p>
                            ))}
                          </div>
                        )}
                        {(containerClosureCatalog.length > 0 || containerClosureNotes.length > 0) && (
                          <div className="mb-2 rounded-lg border border-fuchsia-200 bg-fuchsia-50 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div>
                                <p className="text-xs font-medium text-fuchsia-900">Cintas de fecho do contentor</p>
                                <p className="text-[11px] text-fuchsia-700">Referências operacionais por contentor/tamanho conhecidas no repositório.</p>
                              </div>
                              <span className="inline-flex rounded-full border border-fuchsia-200 bg-white px-2 py-0.5 text-[11px] font-medium text-fuchsia-700">
                                {containerClosureCatalog.length} referência{containerClosureCatalog.length === 1 ? '' : 's'}
                              </span>
                            </div>

                            {containerClosureCatalog.length > 0 ? (
                              <div className="space-y-2">
                                {containerClosureCatalog.map((entry) => (
                                  <div key={`closure-${model.name}-${entry.key}`} className="rounded border border-fuchsia-100 bg-white px-3 py-2 text-xs text-fuchsia-950">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <p className="font-semibold">{entry.description}</p>
                                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${entry.certainty === 'exact' ? 'border-emerald-200 bg-emerald-100 text-emerald-700' : 'border-amber-200 bg-amber-100 text-amber-700'}`}>
                                        {entry.certainty === 'exact' ? 'Exato' : entry.certainty === 'operational' ? 'Operacional' : 'Família'}
                                      </span>
                                    </div>
                                    <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-1 text-[11px] text-gray-700">
                                      <div><span className="font-medium text-gray-900">Ref. stock:</span> {entry.stockReference}</div>
                                      <div><span className="font-medium text-gray-900">Qtd. cintas:</span> {entry.strapQuantity}</div>
                                      <div><span className="font-medium text-gray-900">Contentor:</span> {entry.containerLabel}{entry.size ? ` · Size ${entry.size}` : ''}</div>
                                      <div><span className="font-medium text-gray-900">Capacidades:</span> {formatContainerClosureCapacities(entry)}</div>
                                      {entry.page ? <div><span className="font-medium text-gray-900">Página:</span> {entry.page}</div> : null}
                                      <div><span className="font-medium text-gray-900">Lançamento:</span> {entry.launchType}</div>
                                    </div>
                                    {entry.notes ? <p className="mt-1 text-[11px] text-gray-500">{entry.notes}</p> : null}
                                  </div>
                                ))}
                              </div>
                            ) : null}

                            {containerClosureNotes.length > 0 ? (
                              <div className="mt-2 space-y-1">
                                {containerClosureNotes.map((note: string) => (
                                  <p key={`${model.name}-${note}`} className="rounded border border-fuchsia-100 bg-white px-2 py-1 text-[11px] text-fuchsia-900">
                                    ℹ️ {note}
                                  </p>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )}
                        {modelBulletinMatches.length > 0 && (
                          <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <p className="text-xs font-medium text-amber-900 mb-2">Service boletins associados a este modelo</p>
                            <div className="space-y-2">
                              {modelBulletinMatches.map(({ bulletin, rules }) => (
                                <div key={`${model.name}-${bulletin.id}`} className="rounded border border-amber-200 bg-white p-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <div>
                                      <p className="text-xs font-semibold text-amber-950">{formatTechnicalBulletinShortLabel(bulletin)}</p>
                                      {(bulletin.bulletinNumber || bulletin.issueDate) ? (
                                        <p className="text-[11px] text-amber-900">
                                          {bulletin.bulletinNumber ? <><b>Nº:</b> {bulletin.bulletinNumber}</> : null}
                                          {bulletin.bulletinNumber && bulletin.issueDate ? ' · ' : ''}
                                          {bulletin.issueDate ? <><b>Data:</b> {bulletin.issueDate}</> : null}
                                        </p>
                                      ) : null}
                                      <p className="text-[11px] text-gray-600">{bulletin.title}</p>
                                      <p className="text-[11px] text-amber-800">{bulletin.description}</p>
                                    </div>
                                    <a
                                      href={buildTechnicalBulletinUrl(bulletin.fileName)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex rounded border border-amber-300 bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-900 hover:bg-amber-200"
                                    >
                                      PDF
                                    </a>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {rules.map((rule) => (
                                      <span key={`${bulletin.id}-${rule.label}`} className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-900">
                                        {rule.label}
                                        {rule.containerAliases?.length ? ` · ${rule.containerAliases.join('/')}` : ''}
                                        {` · ${rule.yearFrom ?? '—'}–${rule.yearTo ?? '—'}`}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {(model.serviceItems && model.serviceItems.length > 0) && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-slate-700 mb-1">Itens de serviço ({model.serviceItems.length})</p>
                            <div className="space-y-2">
                              {Object.entries(itemGroupsService).map(([subsystem, items]) => (
                                <div key={`svc-group-${subsystem}`} className="border border-slate-200 rounded p-2 bg-slate-50">
                                  <p className="text-[11px] font-semibold text-slate-700 mb-1">{subsystem} · {items.length}</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                    {items.map((item, idx) => {
                                      const criticality = getItemCriticality(item);
                                      return (
                                        <div key={`svc-${subsystem}-${idx}`} className="text-[11px] text-slate-700 border border-slate-200 rounded px-2 py-1 bg-white">
                                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                            <span className="font-medium">{item.name}</span>
                                            <span className={`inline-flex rounded-full border px-1.5 py-0.5 text-[10px] ${criticality.className}`}>Criticidade {criticality.label}</span>
                                          </div>
                                          {item.reference ? <span className="text-slate-500">Ref: {item.reference} </span> : null}
                                          {item.quantity ? <span className="text-slate-500">· Qt: {item.quantity}</span> : null}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {(model.spareParts && model.spareParts.length > 0) && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-slate-700 mb-1">Peças sobressalentes ({model.spareParts.length})</p>
                            <div className="space-y-2">
                              {Object.entries(itemGroupsSpare).map(([subsystem, items]) => (
                                <div key={`spr-group-${subsystem}`} className="border border-slate-200 rounded p-2 bg-white">
                                  <p className="text-[11px] font-semibold text-slate-700 mb-1">{subsystem} · {items.length}</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                    {items.map((item, idx) => {
                                      const criticality = getItemCriticality(item);
                                      return (
                                        <div key={`spr-${subsystem}-${idx}`} className="text-[11px] text-slate-700 border border-slate-200 rounded px-2 py-1 bg-white">
                                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                            <span className="font-medium">{item.name}</span>
                                            <span className={`inline-flex rounded-full border px-1.5 py-0.5 text-[10px] ${criticality.className}`}>Criticidade {criticality.label}</span>
                                          </div>
                                          {item.reference ? <span className="text-slate-500">Ref: {item.reference} </span> : null}
                                          {item.quantity ? <span className="text-slate-500">· Qt: {item.quantity}</span> : null}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {model.spareParts && model.spareParts.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-600 mb-1">Peças sobressalentes documentadas: <span className="text-gray-800">{model.spareParts.length}</span></p>
                          </div>
                        )}
                      </div>
                    );})}
                  </div>
                </details>
              )})}
          </div>
        </div>

        {/* Seções de Upload e Listagem */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span>📖</span>
                  Manuais Técnicos (Jangadas e Coletes)
                </h2>
                <p className="text-xs text-gray-600 mt-1">Consulta e download feitos no Google Drive partilhado.</p>
                <a
                  href={COLETES_MANUAIS_DRIVE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
                >
                  Download externo de manuais de coletes (Drive dedicado) ↗
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={TECHNICAL_LIBRARY_DRIVE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700"
                >
                  ☁ Abrir biblioteca técnica
                </a>
                <a
                  href={COLETES_MANUAIS_DRIVE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  Abrir pasta de coletes
                </a>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-medium">Os manuais deixaram de ser geridos localmente nesta página.</p>
              <p className="mt-1 text-xs text-blue-800">
                Use os atalhos acima para abrir a biblioteca técnica geral ou a pasta dedicada aos coletes diretamente no Google Drive.
              </p>
            </div>

            {renderManualGroups()}
          </div>

          {renderFolderSection(
            'documentacao',
            'Documentação',
            '📋',
            'Documentação técnica e procedimentos internos',
            'documentacao'
          )}
          {renderFolderSection(
            'legislacao',
            'Legislação',
            '⚖️',
            'Normas e referências legais',
            'legislacao'
          )}
          {renderFolderSection(
            'boletins',
            'Boletins de Serviço (Jangadas)',
            '📢',
            'Comunicados e atualizações técnicas de jangadas',
            'boletins',
            BOLETINS_SERVICO_DRIVE_URL,
            true
          )}
        </div>

        {/* Info Footer */}
        <div className="bg-gray-100 rounded-lg p-4 text-xs text-gray-600">
          <p className="font-medium mb-1">ℹ️ Informação:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Formatos aceites: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG</li>
            <li>Documentação e legislação continuam disponíveis para gestão interna na aplicação.</li>
            <li>Manuais e boletins são mantidos externamente no Google Drive.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

