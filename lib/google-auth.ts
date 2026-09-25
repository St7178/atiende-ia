// Inicio de sesion con Google (OAuth 2.0 / OpenID Connect) sin librerias extra.
// Solo entran asesores activos cuyo correo registrado coincida con el de Google.

export const GOOGLE_STATE_COOKIE = "portal_google_state";

export function googleEnabled() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri(origin: string) {
  return `${origin}/api/auth/google/callback`;
}

export function googleAuthUrl(origin: string, state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** Intercambia el codigo por tokens y devuelve el correo verificado de la cuenta de Google. */
export async function exchangeCodeForEmail(code: string, origin: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google respondio ${res.status} al canjear el codigo`);

  const { id_token } = (await res.json()) as { id_token?: string };
  if (!id_token) throw new Error("Google no devolvio id_token");

  // El id_token llega directo de Google por HTTPS, asi que basta validar sus campos.
  const payload = JSON.parse(Buffer.from(id_token.split(".")[1], "base64url").toString("utf8")) as {
    iss?: string;
    aud?: string;
    exp?: number;
    email?: string;
    email_verified?: boolean;
  };

  const validIssuer = payload.iss === "https://accounts.google.com" || payload.iss === "accounts.google.com";
  if (!validIssuer || payload.aud !== process.env.GOOGLE_CLIENT_ID || (payload.exp ?? 0) * 1000 < Date.now()) {
    throw new Error("id_token de Google no valido");
  }
  if (!payload.email || !payload.email_verified) return null;
  return payload.email.toLowerCase();
}
