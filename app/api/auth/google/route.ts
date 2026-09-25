import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { GOOGLE_STATE_COOKIE, googleAuthUrl, googleEnabled } from "@/lib/google-auth";

// Inicia el login con Google: guarda un "state" aleatorio (anti-CSRF) y la ruta de regreso.
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  if (!googleEnabled()) return NextResponse.redirect(new URL("/login?error=google_off", origin));

  const from = request.nextUrl.searchParams.get("from") ?? "";
  const state = randomBytes(16).toString("hex");

  const response = NextResponse.redirect(googleAuthUrl(origin, state));
  response.cookies.set(GOOGLE_STATE_COOKIE, JSON.stringify({ state, from }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
