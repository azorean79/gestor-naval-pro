import prisma from "./src/lib/prisma";
import { isKnownPackTypeName } from "./src/lib/custom-pack-types";

// Mimic the business logic of applyHruBusinessRules
function applyHruBusinessRules(args: any) {
  const { rawInput, targetData, current } = args;

  const hasAnyHruInput = ["hruAplicavel", "hruReferencia", "hruDataInstalacao", "hruValidade"].some((field) =>
    Object.prototype.hasOwnProperty.call(rawInput || {}, field)
  );

  if (!hasAnyHruInput) return { error: null };

  const explicitApplicability = Object.prototype.hasOwnProperty.call(rawInput || {}, "hruAplicavel")
    ? (rawInput.hruAplicavel === true || rawInput.hruAplicavel === 'true')
    : null;

  const resolveField = (field: string) => {
    if (Object.prototype.hasOwnProperty.call(targetData, field)) {
      return String(targetData[field] ?? "").trim();
    }
    return String(current?.[field] ?? "").trim();
  };

  const hruReferencia = resolveField("hruReferencia");
  const hruDataInstalacaoRaw = resolveField("hruDataInstalacao");

  const isApplicable = explicitApplicability ?? Boolean(hruReferencia || hruDataInstalacaoRaw);

  if (!isApplicable) {
    targetData.hruReferencia = "";
    targetData.hruDataInstalacao = "";
    targetData.hruValidade = "";
    return { error: null };
  }

  const hruReferenciaFinal = hruReferencia || "20701002";

  if (!hruDataInstalacaoRaw) {
    return { error: "HRU aplicável: informe uma data de instalação válida." };
  }

  targetData.hruReferencia = hruReferenciaFinal;
  targetData.hruDataInstalacao = hruDataInstalacaoRaw;
  targetData.hruValidade = hruDataInstalacaoRaw; // simplified

  return { error: null };
}

async function main() {
  const id = 8;
  const existing = await prisma.jangada.findUnique({
    where: { id },
    select: { 
      id: true, 
      brand: true, 
      model: true, 
      packType: true, 
      capacity: true, 
      serviceStationId: true, 
      hruReferencia: true, 
      hruDataInstalacao: true, 
      hruValidade: true,
      serial: true,
      shipId: true,
      shipNameManual: true,
      dataInspecao: true,
      dataProxInspecao: true,
      ultimoCertificadoNumero: true
    },
  });

  const rawInput = {
    ...existing,
    // Simulate UI payload
  };

  const jangadaData: any = { ...rawInput };

  // Validate Pack Type
  if (jangadaData.packType) {
    const nextPackType = String(jangadaData.packType || "");
    const isValidPackType = await isKnownPackTypeName(nextPackType, {
      includeInactiveCustom: nextPackType.trim().toUpperCase() === String(existing?.packType || "").trim().toUpperCase(),
    });
    if (!isValidPackType) {
      console.log("VALIDATION ERROR: Tipo de pack inválido: " + nextPackType);
      return;
    }
  }

  // Validate HRU
  const hruRules = applyHruBusinessRules({
    rawInput,
    targetData: jangadaData,
    current: existing,
  });
  if (hruRules.error) {
    console.log("VALIDATION ERROR: " + hruRules.error);
    return;
  }

  console.log("No validation errors found! All rules passed.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
