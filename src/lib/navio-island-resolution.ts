import { inferAzoresIslandFromAddressParts, canonicalizeAzoresIsland } from "@/lib/azores-islands";

type ClienteIslandSource = {
  id?: number;
  ilha?: string | null;
  morada?: string | null;
  localidade?: string | null;
  codigoPostal?: string | null;
} | null | undefined;

export function normalizeManualNavioIsland(value: unknown) {
  const canonicalIsland = canonicalizeAzoresIsland(value);
  if (canonicalIsland) return canonicalIsland;

  const rawValue = String(value ?? "").trim();
  return rawValue || null;
}

export function resolveClienteIslandForNavio(cliente: ClienteIslandSource) {
  if (!cliente) return null;
  return inferAzoresIslandFromAddressParts({
    ilha: cliente.ilha,
    morada: cliente.morada,
    localidade: cliente.localidade,
    codigoPostal: cliente.codigoPostal,
  });
}

export async function getResolvedClienteIslandForNavio(clienteId: number) {
  const prismaModule = await import("@/lib/prisma");
  const prisma = prismaModule.default;

  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: {
      id: true,
      ilha: true,
      morada: true,
      localidade: true,
      codigoPostal: true,
    },
  });

  return {
    cliente,
    island: resolveClienteIslandForNavio(cliente),
  };
}