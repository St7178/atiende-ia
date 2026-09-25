"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { colorForId } from "@/lib/advisors";
import { hashPassword } from "@/lib/password";
import { getCurrentAdvisor, isAdmin } from "@/lib/currentAdvisor";

export type AdvisorFormState = { error?: string; ok?: boolean };

const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

async function requireAdmin() {
  const current = await getCurrentAdvisor();
  if (!isAdmin(current)) throw new Error("Solo el administrador puede gestionar asesores.");
  return current!;
}

function readCommon(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase() || null,
    role: formData.get("role") === "admin" ? "admin" : "asesor",
    password: String(formData.get("password") ?? ""),
  };
}

async function emailTaken(email: string | null, exceptId?: number) {
  if (!email) return false;
  const other = await prisma.advisor.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  return !!other && other.id !== exceptId;
}

export async function createAdvisor(_prev: AdvisorFormState, formData: FormData): Promise<AdvisorFormState> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const { name, email, role, password } = readCommon(formData);
  const username = String(formData.get("username") ?? "").trim().toLowerCase();

  if (!name) return { error: "Escribe el nombre del asesor." };
  if (!USERNAME_RE.test(username)) {
    return { error: "El usuario debe tener de 3 a 30 caracteres: letras minúsculas, números, punto, guion o guion bajo." };
  }
  if (password.length < MIN_PASSWORD) return { error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.` };
  if (email && !EMAIL_RE.test(email)) return { error: "El correo de Google no es válido." };

  if (await prisma.advisor.findUnique({ where: { username } })) return { error: "Ese usuario ya existe." };
  if (await emailTaken(email)) return { error: "Ese correo ya está asignado a otro asesor." };

  const count = await prisma.advisor.count();
  await prisma.advisor.create({
    data: { name, username, email, role, passwordHash: await hashPassword(password), avatarColor: colorForId(count) },
  });

  revalidatePath("/asesores");
  return { ok: true };
}

export async function updateAdvisor(_prev: AdvisorFormState, formData: FormData): Promise<AdvisorFormState> {
  let current;
  try {
    current = await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const id = Number(formData.get("id"));
  const advisor = await prisma.advisor.findUnique({ where: { id } });
  if (!advisor) return { error: "El asesor no existe." };

  const { name, email, role, password } = readCommon(formData);
  const isActive = formData.get("isActive") === "on";
  const username = String(formData.get("username") ?? "").trim().toLowerCase();

  if (!name) return { error: "El nombre no puede quedar vacío." };
  if (!USERNAME_RE.test(username)) {
    return { error: "El usuario debe tener de 3 a 30 caracteres: letras minúsculas, números, punto, guion o guion bajo." };
  }
  const sameUsername = await prisma.advisor.findUnique({ where: { username } });
  if (sameUsername && sameUsername.id !== id) return { error: "Ese usuario ya existe." };
  if (!advisor.passwordHash && !password && advisor.role !== "admin") {
    return { error: "Asigna una contraseña para que pueda iniciar sesión." };
  }
  if (email && !EMAIL_RE.test(email)) return { error: "El correo de Google no es válido." };
  if (password && password.length < MIN_PASSWORD) {
    return { error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.` };
  }
  if (await emailTaken(email, id)) return { error: "Ese correo ya está asignado a otro asesor." };

  if (id === current.id && (role !== "admin" || !isActive)) {
    return { error: "No puedes quitarte el rol de administrador ni desactivarte a ti mismo." };
  }

  await prisma.advisor.update({
    where: { id },
    data: {
      name,
      username,
      email,
      role,
      isActive,
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    },
  });

  revalidatePath("/asesores");
  return { ok: true };
}
