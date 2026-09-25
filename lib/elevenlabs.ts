// Integracion con ElevenLabs Agents: llamadas salientes (SIP trunk o Twilio) y
// verificacion de los webhooks de fin de llamada.
import { createHmac, timingSafeEqual } from "node:crypto";

// Endpoint segun el proveedor del numero importado en ElevenLabs
// (ELEVENLABS_PHONE_PROVIDER = "sip_trunk" por defecto, o "twilio").
const OUTBOUND_URL: Record<string, string> = {
  sip_trunk: "https://api.elevenlabs.io/v1/convai/sip-trunk/outbound-call",
  twilio: "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
};
const SIGNATURE_TOLERANCE_SECS = 30 * 60; // ventana de ElevenLabs contra reenvios

export function elevenLabsConfig() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const phoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID;
  const missing = [
    !apiKey && "ELEVENLABS_API_KEY",
    !agentId && "ELEVENLABS_AGENT_ID",
    !phoneNumberId && "ELEVENLABS_PHONE_NUMBER_ID",
  ].filter(Boolean);
  return { apiKey, agentId, phoneNumberId, missing: missing as string[] };
}

export async function startOutboundCall(params: {
  toNumber: string;
  dynamicVariables: Record<string, string>;
}) {
  const { apiKey, agentId, phoneNumberId, missing } = elevenLabsConfig();
  if (missing.length > 0) {
    throw new Error(`Las llamadas con IA no estan configuradas: faltan ${missing.join(", ")} en las variables de entorno.`);
  }

  const provider = process.env.ELEVENLABS_PHONE_PROVIDER || "sip_trunk";
  const url = OUTBOUND_URL[provider];
  if (!url) throw new Error(`ELEVENLABS_PHONE_PROVIDER no valido: "${provider}" (usa "sip_trunk" o "twilio").`);

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "xi-api-key": apiKey! },
    body: JSON.stringify({
      agent_id: agentId,
      agent_phone_number_id: phoneNumberId,
      to_number: params.toNumber,
      conversation_initiation_client_data: { dynamic_variables: params.dynamicVariables },
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
    conversation_id?: string;
    callSid?: string;
    detail?: unknown;
  };

  if (!res.ok || data.success === false) {
    const detail = data.message ?? (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail ?? ""));
    // Twilio en cuenta de prueba bloquea el <Stream> que usa ElevenLabs para conectar la voz.
    if (/trial account/i.test(detail)) {
      throw new Error(
        "Twilio rechazó la llamada: la cuenta de prueba de Twilio no permite llamadas con agentes de IA. Haz upgrade de la cuenta de Twilio para poder llamar."
      );
    }
    throw new Error(`ElevenLabs no pudo iniciar la llamada${res.ok ? "" : ` (${res.status})`}: ${detail}`);
  }

  return { conversationId: data.conversation_id ?? null, callSid: data.callSid ?? null };
}

/**
 * Verifica el header `elevenlabs-signature` ("t=<timestamp>,v0=<hmac>[,v0=<hmac>]").
 * La firma es HMAC-SHA256 en hex de "<timestamp>.<cuerpo crudo>" con el secreto del webhook.
 */
export function verifyWebhookSignature(rawBody: string, header: string | null, secret: string) {
  if (!header) return false;
  const parts = header.split(",").map((p) => p.trim());
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const signatures = parts.filter((p) => p.startsWith("v0=")).map((p) => p.slice(3));
  if (!timestamp || signatures.length === 0) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > SIGNATURE_TOLERANCE_SECS) return false;

  const expected = Buffer.from(createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex"));
  return signatures.some((sig) => {
    const given = Buffer.from(sig);
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
