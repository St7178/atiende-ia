"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, adminCredentialsMatch, authEnabled, createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { ensureAdminAdvisor } from "@/lib/currentAdvisor";

export type LoginState = { error?: string };

function safeRedirectTarget(from: FormDataEntryValue | null) {
  const value = typeof from === "string" ? from : "";
  // Solo rutas internas, para no permitir redirecciones abiertas.
  return value.startsWith("/") && !value.startsWith("//") ? value : "/conversaciones";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const target = safeRedirectTarget(formData.get("from"));

  if (!authEnabled()) {
    redirect(target);
  }

  const user = String(formData.get("user") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  let advisorId: number | null = null;

  if (adminCredentialsMatch(user, password)) {
    // Credenciales maestras del administrador (variables de entorno).
    advisorId = (await ensureAdminAdvisor()).id;
  } else {
    const advisor = await prisma.advisor.findUnique({ where: { username: user } });
    if (advisor?.isActive && (await verifyPassword(password, advisor.passwordHash))) {
      advisorId = advisor.id;
    }
  }

  if (!advisorId) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await createSessionToken(advisorId), sessionCookieOptions);
  redirect(target);
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
