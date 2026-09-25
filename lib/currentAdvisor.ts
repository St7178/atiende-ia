import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, authEnabled, verifySessionToken } from "@/lib/auth";

/** Asesor con sesion iniciada (o null si la sesion no es valida o fue desactivado). */
export async function getCurrentAdvisor() {
  if (!authEnabled()) {
    // Desarrollo local sin credenciales: actuar como el primer administrador.
    return prisma.advisor.findFirst({ where: { isActive: true }, orderBy: [{ role: "asc" }, { id: "asc" }] });
  }

  const cookieStore = await cookies();
  const advisorId = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!advisorId) return null;

  const advisor = await prisma.advisor.findUnique({ where: { id: advisorId } });
  return advisor?.isActive ? advisor : null;
}

export function isAdmin(advisor: { role: string } | null | undefined) {
  return advisor?.role === "admin";
}

/** Primer administrador; se crea al primer ingreso con PORTAL_USER / PORTAL_PASSWORD. */
export async function ensureAdminAdvisor() {
  const existing = await prisma.advisor.findFirst({ where: { role: "admin" }, orderBy: { id: "asc" } });
  if (existing) return existing;
  return prisma.advisor.create({
    data: {
      name: "Administrador",
      username: (process.env.PORTAL_USER || "admin").toLowerCase(),
      role: "admin",
      avatarColor: "var(--brand)",
    },
  });
}
