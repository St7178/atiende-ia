import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, createSessionToken, safeEqual, sessionCookieOptions } from "@/lib/auth";
import { GOOGLE_STATE_COOKIE, exchangeCodeForEmail, googleEnabled } from "@/lib/google-auth";

function loginError(origin: string, code: string) {
  const response = NextResponse.redirect(new URL(`/login?error=${code}`, origin));
  response.cookies.delete(GOOGLE_STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  if (!googleEnabled()) return loginError(origin, "google_off");

  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state") ?? "";

  let saved: { state?: string; from?: string } = {};
  try {
    saved = JSON.parse(request.cookies.get(GOOGLE_STATE_COOKIE)?.value ?? "{}");
  } catch {}

  if (!code || !saved.state || !safeEqual(state, saved.state)) return loginError(origin, "google_error");

  let email: string | null;
  try {
    email = await exchangeCodeForEmail(code, origin);
  } catch (e) {
    console.error("Login con Google fallo:", e);
    return loginError(origin, "google_error");
  }

  const advisor = email
    ? await prisma.advisor.findFirst({ where: { email: { equals: email, mode: "insensitive" }, isActive: true } })
    : null;
  if (!advisor) return loginError(origin, "google_no_account");

  const from = saved.from ?? "";
  const target = from.startsWith("/") && !from.startsWith("//") ? from : "/conversaciones";

  const response = NextResponse.redirect(new URL(target, origin));
  response.cookies.set(SESSION_COOKIE, await createSessionToken(advisor.id), sessionCookieOptions);
  response.cookies.delete(GOOGLE_STATE_COOKIE);
  return response;
}
