import { normalizeE164 } from "./textbee-sms";

const INFINIREACH_API_KEY = process.env.INFINIREACH_API_KEY || "";
const INFINIREACH_FROM = process.env.INFINIREACH_FROM || "";

const BASE_URL = "https://api.infinireach.io";

export function isInfinireachConfigured(): boolean {
  return Boolean(INFINIREACH_API_KEY && INFINIREACH_FROM);
}

export async function sendInfinireachSms(
  phoneRaw: string,
  message: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isInfinireachConfigured()) {
    return { ok: false, error: "SMS não configurado. Faltam INFINIREACH_API_KEY / INFINIREACH_FROM." };
  }

  const phone = normalizeE164(phoneRaw);
  if (!phone) {
    return { ok: false, error: "Número de telemóvel inválido." };
  }
  if (!String(message || "").trim()) {
    return { ok: false, error: "A mensagem não pode estar vazia." };
  }

  try {
    const response = await fetch(`${BASE_URL}/api/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": INFINIREACH_API_KEY,
      },
      body: JSON.stringify({
        to: phone,
        message,
        from: INFINIREACH_FROM,
        channel: "sms",
        externalId: `orey-${Date.now()}`,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || (data && typeof data === "object" && (data as { success?: unknown }).success === false)) {
      const errorDetail =
        data && typeof data === "object" && "message" in data
          ? String((data as { message?: unknown }).message || "")
          : "";
      console.error("[infinireach-sms] Falhou:", response.status, errorDetail);
      return { ok: false, error: `Falha ao enviar SMS (${response.status}).` };
    }
    return { ok: true };
  } catch (error) {
    console.error("[infinireach-sms] Erro:", error);
    return { ok: false, error: "Erro de rede ao enviar SMS." };
  }
}
