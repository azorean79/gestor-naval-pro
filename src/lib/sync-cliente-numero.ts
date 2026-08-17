import { PrismaClient } from "@prisma/client";

const PLACEHOLDER_RE = /^C\d+$/i;

/**
 * Sincroniza o `numeroCliente` de um Cliente com o número externo (importado)
 * presente nas obras/faturas históricas.
 *
 * Regras:
 *  - Não faz nada se o cliente já tiver um número real (diferente de placeholder `Cxxx`)
 *    para não sobrepor um número já escolhido/correto.
 *  - Apenas define o número quando o atual é placeholder ou está vazio.
 *  - Não rouba um número já atribuído a outro cliente.
 */
export async function syncClienteNumeroFromExterno(
  prisma: PrismaClient,
  clienteId: number | null | undefined,
  externo: string | null | undefined
): Promise<boolean> {
  if (!clienteId || !externo) return false;
  const target = String(externo).trim();
  if (!target) return false;

  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: { id: true, numeroCliente: true },
  });
  if (!cliente) return false;

  const cur = cliente.numeroCliente;
  if (cur && cur === target) return false;
  if (cur && !PLACEHOLDER_RE.test(cur)) return false; // já tem número real

  const clash = await prisma.cliente.findFirst({ where: { numeroCliente: target } });
  if (clash && clash.id !== clienteId) return false; // em uso por outro cliente

  await prisma.cliente.update({
    where: { id: clienteId },
    data: { numeroCliente: target },
  });
  return true;
}

/**
 * Extrai o `numeroClienteExterno` do campo `metadados` (JSON string) de uma ordem/fatura.
 */
export function extractNumeroClienteExterno(metadados: unknown): string | null {
  if (typeof metadados !== "string" || !metadados.includes("numeroClienteExterno")) {
    return null;
  }
  try {
    const m = JSON.parse(metadados) as Record<string, unknown>;
    const v = m.numeroClienteExterno;
    return v ? String(v) : null;
  } catch {
    return null;
  }
}
