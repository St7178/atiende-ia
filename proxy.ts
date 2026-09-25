import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, authEnabled, verifySessionToken } from "@/lib/auth";

// Exige sesion de asesor (ver /login). La validez del asesor (activo, rol) se
// revisa en el servidor; aqui solo se comprueba la firma de la cookie.
export async function proxy(request: NextRequest) {
  if (!authEnabled()) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;

  // Webhooks externos (firma propia) y rutas del flujo de login.
  if (pathname.startsWith("/api/elevenlabs/") || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const loggedIn = (await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) !== null;

  if (pathname === "/login") {
    return loggedIn ? NextResponse.redirect(new URL("/conversaciones", request.url)) : NextResponse.next();
  }

  if (loggedIn) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
