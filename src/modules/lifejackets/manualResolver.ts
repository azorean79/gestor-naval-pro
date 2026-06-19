import { lifejacketModelData, type LifejacketBrandCatalog, type LifejacketModel } from "@/modules/lifejackets/lifejacketModelData";
import { getManualLibraryUrl } from "@/lib/external-tech-docs";

export type LifejacketManualLink = {
  fileName: string;
  label: string;
  href: string;
};

export type ResolvedLifejacketManuals = {
  brandCatalog: LifejacketBrandCatalog | null;
  matchedModel: LifejacketModel | null;
  displayLabel: string;
  manuals: LifejacketManualLink[];
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

function buildManualHref(relativePath: string) {
  return getManualLibraryUrl();
}

function getManualCandidatePaths(brand: string | null | undefined, fileName: string) {
  const normalizedBrand = normalizeText(brand);

  const brandFolderMap: Record<string, string[]> = {
    crewsaver: ["coletes/crewsaver"],
  };

  const brandFolders = brandFolderMap[normalizedBrand] || [];

  return unique([
    ...brandFolders.map((folder) => `${folder}/${fileName}`),
    `coletes/${fileName}`,
    `${normalizedBrand ? `${normalizedBrand}/` : ""}${fileName}`,
  ].filter((value) => !value.startsWith("/")));
}

function findMatchingModel(models: LifejacketModel[], model: string | null | undefined) {
  const normalizedModel = normalizeText(model);
  if (!normalizedModel) return null;

  return models.find((entry) => {
    const candidate = normalizeText(entry.model);
    return candidate === normalizedModel || candidate.includes(normalizedModel) || normalizedModel.includes(candidate);
  }) || null;
}

export function resolveLifejacketManuals(brand: string | null | undefined, model: string | null | undefined): ResolvedLifejacketManuals {
  const normalizedBrand = normalizeText(brand);
  const brandCatalog = lifejacketModelData.find((entry) => normalizeText(entry.brand) === normalizedBrand) || null;

  if (!brandCatalog) {
    return { brandCatalog: null, matchedModel: null, displayLabel: "", manuals: [] };
  }

  const matchedModel = findMatchingModel(brandCatalog.models, model);
  const manualFiles = unique(
    (matchedModel?.manualFiles && matchedModel.manualFiles.length > 0
      ? matchedModel.manualFiles
      : brandCatalog.models.flatMap((entry) => entry.manualFiles || []))
      .filter(Boolean)
  );

  const manuals = manualFiles.map((fileName) => {
    const relativePath = getManualCandidatePaths(brandCatalog.brand, fileName)[0] || `coletes/${fileName}`;
    return {
      fileName,
      label: matchedModel ? `${brandCatalog.brand} · ${matchedModel.model}` : brandCatalog.brand,
      href: buildManualHref(relativePath),
    };
  });

  const displayLabel = matchedModel ? `${brandCatalog.brand} · ${matchedModel.model}` : brandCatalog.brand;

  return { brandCatalog, matchedModel, displayLabel, manuals };
}