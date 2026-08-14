"use client";

import React, { useEffect, useState } from "react";
import FatoImersaoWizard from "./FatoImersaoWizard";
import { useFatoImersaoWizardStore } from "./store/useFatoImersaoWizardStore";
import { toDisplayValidade } from "@/lib/fato-date-utils";

export default function FatoImersaoWizardLoader({ fatoId }: { fatoId: number }) {
  const { setFatoId, setInspectionData, reset } = useFatoImersaoWizardStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      reset();
      try {
        const res = await fetch(`/api/fatos-imersao/${fatoId}`);
        if (!res.ok) throw new Error("Fato não encontrado");
        const data = await res.json();
        if (cancelled) return;
        setFatoId(fatoId);
        setInspectionData({
          serial: data.serial || "",
          brand: data.marca || "",
          model: data.modelo || "",
          designNo: data.designNo || "",
          tamanho: data.tamanho || "",
          material: data.material || "",
          dataFabrico: data.dataFabrico || "",
          dataInspecao: data.dataInspecao || new Date().toISOString().slice(0, 10),
          dataProxInspecao: data.dataProxInspecao || "",
          shipId: data.shipId || null,
          shipName: data.navio?.nome || "",
          intervaloServicoMeses: data.intervaloServicoMeses || null,
          componentes: [
            {
              id: "light",
              name: "Luz de emergência",
              reference: data.luzRef || "",
              stockId: null,
              validade: data.luzValidade || "",
              lote: data.luzLote || "",
            },
            {
              id: "whistle",
              name: "Apito",
              reference: data.apitoRef || "",
              stockId: null,
              validade: data.apitoValidade || "",
              lote: data.apitoLote || "",
            },
            { id: "buddy", name: "Buddy line", reference: "", stockId: null, validade: "", lote: "" },
            { id: "gloves", name: "Luvas", reference: "", stockId: null, validade: "", lote: "" },
            { id: "tape", name: "Fita retro-refletora", reference: "", stockId: null, validade: "", lote: "" },
            { id: "beeswax", name: "Beeswax / grease zip", reference: "", stockId: null, validade: "", lote: "" },
          ],
        });
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Erro");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fatoId, reset, setFatoId, setInspectionData]);

  if (loading) return <div className="p-10 text-slate-500">A carregar wizard...</div>;
  if (error) return <div className="p-10 text-red-600">{error}</div>;
  return <FatoImersaoWizard />;
}
