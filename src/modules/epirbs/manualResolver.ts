import { getManualLibraryUrl } from "@/lib/external-tech-docs";
import { epirbModelData, type EpirbBrandCatalog, type EpirbModel } from "@/modules/epirbs/epirbModelData";

export type EpirbManualLink = {
  fileName: string;
  label: string;
  href: string;
};

export type ResolvedEpirbManuals = {
  brandCatalog: EpirbBrandCatalog | null;
  matchedModel: EpirbModel | null;
  displayLabel: string;
  manuals: EpirbManualLink[];
};

function normalizeText(value: string | null | undefined) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ");
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function buildManualHref(_relativePath: string) {
  return getManualLibraryUrl();
}

function getBrandCatalog(brand: string | null | undefined) {
  const normalizedBrand = normalizeText(brand);

  return epirbModelData.find((entry) => {
    const candidates = [entry.brand, ...(entry.aliases || [])].map((value) => normalizeText(value));
    return candidates.includes(normalizedBrand);
  }) || null;
}

function findMatchingModel(models: EpirbModel[], model: string | null | undefined) {
  const normalizedModel = normalizeText(model);
  if (!normalizedModel) return null;

  return models.find((entry) => {
    const candidates = [entry.model, ...(entry.aliases || [])].map((value) => normalizeText(value));
    return candidates.some((candidate) => candidate === normalizedModel || candidate.includes(normalizedModel) || normalizedModel.includes(candidate));
  }) || null;
}

function getManualCandidatePaths(brand: string | null | undefined, fileName: string) {
  const normalizedBrand = normalizeText(brand);

  const brandFolderMap: Record<string, string[]> = {
    "ocean signal": ["epirbs/ocean-signal", "epirbs/ocean signal", "epirbs"],
  };

  const brandFolders = brandFolderMap[normalizedBrand] || [];

  return unique(
    [
      ...brandFolders.map((folder) => `${folder}/${fileName}`),
      `epirbs/${fileName}`,
      `${normalizedBrand ? `${normalizedBrand}/` : ""}${fileName}`,
    ].filter((value) => !value.startsWith("/"))
  );
}

export function resolveEpirbManuals(brand: string | null | undefined, model: string | null | undefined): ResolvedEpirbManuals {
  const brandCatalog = getBrandCatalog(brand);

  if (!brandCatalog) {
    return { brandCatalog: null, matchedModel: null, displayLabel: "", manuals: [] };
  }

  const matchedModel = findMatchingModel(brandCatalog.models, model);
  const manualFiles = unique(
    (matchedModel?.manualFiles && matchedModel.manualFiles.length > 0
      ? matchedModel.manualFiles
      : brandCatalog.models.flatMap((entry) => entry.manualFiles || [])).filter(Boolean)
  );

  const manuals = manualFiles.map((fileName) => {
    const relativePath = getManualCandidatePaths(brandCatalog.brand, fileName)[0] || `epirbs/${fileName}`;
    return {
      fileName,
      label: matchedModel ? `${brandCatalog.brand} · ${matchedModel.model}` : brandCatalog.brand,
      href: buildManualHref(relativePath),
    };
  });

  const displayLabel = matchedModel ? `${brandCatalog.brand} · ${matchedModel.model}` : brandCatalog.brand;

  return { brandCatalog, matchedModel, displayLabel, manuals };
}
