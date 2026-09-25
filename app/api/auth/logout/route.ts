import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

// Cierra la sesion cuando el asesor fue desactivado o eliminado (la cookie
// sigue siendo valida pero ya no corresponde a un asesor activo).
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login?error=inactive", request.nextUrl.origin));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
