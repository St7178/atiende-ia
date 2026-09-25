"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAdvisor, isAdmin } from "@/lib/currentAdvisor";

export type SaveKnowledgeResult = { ok: true } | { ok: false; error: string };

// Solo el administrador puede cambiar lo que responde el asistente de IA.
export async function saveKnowledge(text: string): Promise<SaveKnowledgeResult> {
  if (!isAdmin(await getCurrentAdvisor())) {
    return { ok: false, error: "Solo el administrador puede modificar la base de conocimiento." };
  }

  const existing = await prisma.companyKnowledge.findFirst({ orderBy: { updatedAt: "desc" } });

  if (existing) {
    await prisma.companyKnowledge.update({
      where: { id: existing.id },
      data: { knowledgeText: text, updatedAt: new Date() },
    });
  } else {
    await prisma.companyKnowledge.create({ data: { knowledgeText: text } });
  }

  revalidatePath("/conocimiento");
  return { ok: true };
}
