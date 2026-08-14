export type PostalCodeDirectory = Record<string, string[]>;

export const POSTAL_CODE_DIRECTORY: PostalCodeDirectory = {};

export function lookupPostalCodeLocality(codigoPostal?: string | null) {
  const key = String(codigoPostal || '').trim();
  if (!key) return null;
  const localities = POSTAL_CODE_DIRECTORY[key] || [];
  return localities[0] || null;
}
