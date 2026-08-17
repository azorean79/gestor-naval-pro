import { isInfinireachConfigured, sendInfinireachSms } from "./infinireach-sms";

/**
 * Por enquanto, o envio de SMS é feito exclusivamente através do InfiniReach
 * (api.infinireach.io). Os fornecedores alternativos (TextBee, Zapier) ficam
 * disponíveis no repositório mas desligados até serem novamente ativados.
 */
export async function sendSms(
  phoneRaw: string,
  message: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isInfinireachConfigured()) {
    return {
      ok: false,
      error: "SMS não configurado. Defina INFINIREACH_API_KEY e INFINIREACH_FROM.",
    };
  }
  return sendInfinireachSms(phoneRaw, message);
}
