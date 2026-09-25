// Sesion firmada con HMAC (Web Crypto, funciona en proxy y en el servidor).
// El token identifica al asesor: "<advisorId>.<expira>.<firma>".

export const SESSION_COOKIE = "portal_session";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 horas

// El login se exige cuando existen las credenciales del administrador
// (PORTAL_USER / PORTAL_PASSWORD). Sin ellas (desarrollo local) el portal
// queda abierto y actua como el primer administrador.
export function authEnabled() {
  return !!(process.env.PORTAL_USER && process.env.PORTAL_PASSWORD);
}

function sessionSecret() {
  return process.env.SESSION_SECRET || process.env.PORTAL_PASSWORD || "";
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(advisorId: number) {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${advisorId}.${expiresAt}`;
  return `${payload}.${await sign(payload)}`;
}

/** Devuelve el id del asesor si el token es valido y no ha expirado. */
export async function verifySessionToken(token: string | undefined): Promise<number | null> {
  if (!token) return null;
  const [id, expiresAt, signature] = token.split(".");
  if (!id || !expiresAt || !signature) return null;
  if (Number(expiresAt) < Date.now()) return null;
  if (!safeEqual(signature, await sign(`${id}.${expiresAt}`))) return null;
  const advisorId = Number(id);
  return Number.isInteger(advisorId) && advisorId > 0 ? advisorId : null;
}

export function adminCredentialsMatch(user: string, password: string) {
  return (
    safeEqual(user.toLowerCase(), (process.env.PORTAL_USER ?? "").toLowerCase()) &&
    safeEqual(password, process.env.PORTAL_PASSWORD ?? "")
  );
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
