import { ArtigoJangada } from '@prisma/client';

/**
 * Extracts the required stock items from a single ArtigoJangada.
 * Each non‑null field that represents a consumable or part is counted as one unit.
 * The field name (camelCase) is converted to a readable stock reference.
 */
export function extractNeededItems(article: any): Record<string, number> {
  const needed: Record<string, number> = {};

  // List of fields that map directly to stock items.
  const stockFields = [
    'valvulasAlivio',
    'valvulasAtestar',
    'testelavoracao', // example – adjust to real fields if existent
    // add other fields that correspond to physical items
  ];

  for (const field of stockFields) {
    const value = article[field] as unknown as string | null;
    if (value && typeof value === 'string' && value.trim() !== '') {
      const key = field;
      needed[key] = (needed[key] ?? 0) + 1;
    }
  }

  // Additional logic for cylinder serials – each distinct serial represents a cylinder.
  if (article.cylinderSerial) {
    needed['cylinder'] = (needed['cylinder'] ?? 0) + 1;
  }

  return needed;
}
