export async function sendWhatsAppMessage(params: {
  waId: string;
  advisorId: number;
  message: string;
}) {
  const url = process.env.N8N_PORTAL_SEND_WEBHOOK_URL;
  const secret = process.env.PORTAL_WEBHOOK_SECRET;

  if (!url || !secret) {
    throw new Error(
      "El envio no esta configurado: faltan N8N_PORTAL_SEND_WEBHOOK_URL o PORTAL_WEBHOOK_SECRET en las variables de entorno."
    );
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-portal-token": secret,
    },
    body: JSON.stringify({
      wa_id: params.waId,
      advisor_id: params.advisorId,
      message: params.message,
    }),
  });

  if (!res.ok) {
    const detail = res.status === 401 ? " (token del portal invalido)" : res.status === 404 ? " (webhook no encontrado o workflow inactivo)" : "";
    throw new Error(`n8n respondio ${res.status} al enviar el mensaje${detail}.`);
  }

  return res.json().catch(() => ({}));
}
