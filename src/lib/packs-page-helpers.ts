import { type CustomPack, type PackDraft } from "@/types/packs-page";

export function matchesPathPrefix(pathname: string, prefix: string) {
  if (prefix === "/") return pathname === "/";
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function normalizeText(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function normalizeReference(value: string) {
  return String(value || "")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();
}

export function tokenizeSearchText(value: string) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

export function serializePackToDraft(pack: CustomPack): PackDraft {
  return {
    id: pack.id,
    name: pack.name,
    description: pack.description || "",
    isActive: pack.isActive,
    canonicalSource: false,
    items: pack.items.map((item) => ({
      stockId: item.stockId,
      stockReference: item.stockReference,
      stockDescription: item.stockDescription,
      stockCategory: item.stockCategory,
      quantity: Math.max(1, Number(item.quantity || 1)),
    })),
  };
}
