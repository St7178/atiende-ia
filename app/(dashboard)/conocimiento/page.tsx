import { Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { KnowledgeEditor } from "@/components/KnowledgeEditor";
import { PageHeader } from "@/components/shell/PageHeader";
import { getCurrentAdvisor, isAdmin } from "@/lib/currentAdvisor";

export const dynamic = "force-dynamic";

export default async function ConocimientoPage() {
  const [existing, current] = await Promise.all([
    prisma.companyKnowledge.findFirst({ orderBy: { updatedAt: "desc" } }),
    getCurrentAdvisor(),
  ]);
  const text = existing?.knowledgeText ?? "";
  const canEdit = isAdmin(current);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <PageHeader title="Conocimiento" subtitle="La información que usa el asistente IA para responder" />
      <div className="max-w-3xl px-4 pb-10 md:px-6">
        {canEdit ? (
          <KnowledgeEditor initialText={text} />
        ) : (
          <>
            <div className="ios-group">
              <p className="whitespace-pre-wrap p-4 text-[15px] leading-relaxed">
                {text || "Aún no hay información cargada."}
              </p>
            </div>
            <p className="flex items-center gap-1.5 px-1 pt-3 text-[13px] text-ios-label-2">
              <Lock className="size-3.5" /> Solo el administrador puede modificar la base de conocimiento.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
