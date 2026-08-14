import { type Cliente, type Navio, type ClienteProfileField, type ClienteListColumnKey, CLIENTE_LIST_COLUMNS } from "@/types/clientes-page";

export function buildDefaultClienteListColumns(): Record<ClienteListColumnKey, boolean> {
  return CLIENTE_LIST_COLUMNS.reduce((acc, col) => {
    acc[col.key] = true;
    return acc;
  }, {} as Record<ClienteListColumnKey, boolean>);
}

export function normalizeNaviosResponse(payload: unknown): Navio[] {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload as Navio[];
  }

  if (typeof payload === "object" && payload !== null) {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) {
      return obj.data as Navio[];
    }
  }

  return [];
}

export function normalizePhoneSearch(value: string | null | undefined) {
  return String(value || "").replace(/\D+/g, "");
}

export function getMissingProfileFields(cliente: Cliente): { key: ClienteProfileField; label: string }[] {
  const checks: { key: ClienteProfileField; label: string; value: string | null | undefined }[] = [
    { key: "numeroCliente", label: "Nº Cliente", value: cliente.numeroCliente },
    { key: "moradaNumero", label: "Nº Porta", value: cliente.moradaNumero },
    { key: "codigoPostal", label: "Código Postal", value: cliente.codigoPostal },
    { key: "localidade", label: "Localidade", value: cliente.localidade },
    { key: "modoPagamento", label: "Modo de Pagamento", value: cliente.modoPagamento },
    { key: "nif", label: "NIF", value: cliente.nif },
    { key: "email", label: "Email", value: cliente.email },
    { key: "telefone", label: "Telefone", value: cliente.telefone },
    { key: "telmovel", label: "Telemóvel", value: cliente.telmovel },
    { key: "morada", label: "Morada", value: cliente.morada },
    { key: "ilha", label: "Ilha", value: cliente.ilha }
  ];

  return checks
    .filter((field) => !String(field.value || "").trim())
    .map((field) => ({ key: field.key, label: field.label }));
}
