import { normalizeText } from "@/lib/text-normalization";

export function normalizeCylinderSerialKey(value: unknown) {
  return normalizeText(value).replace(/[^a-z0-9]/g, "");
}
