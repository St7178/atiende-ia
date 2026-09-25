import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdvisorForm, AdvisorRow } from "@/components/AdvisorForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { getCurrentAdvisor, isAdmin } from "@/lib/currentAdvisor";
import { googleEnabled } from "@/lib/google-auth";

export const dynamic = "force-dynamic";

export default async function AsesoresPage() {
  const current = await getCurrentAdvisor();
  if (!isAdmin(current)) redirect("/conversaciones");

  const advisors = await prisma.advisor.findMany({
    orderBy: [{ isActive: "desc" }, { role: "asc" }, { name: "asc" }],
    include: { _count: { select: { conversations: true } } },
  });
  const active = advisors.filter((a) => a.isActive).length;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <PageHeader title="Asesores" subtitle={`${active} ${active === 1 ? "asesor activo" : "asesores activos"}`} />

      <div className="max-w-2xl px-4 pb-10 md:px-6">
        <p className="ios-section-title !pt-2">Nuevo asesor</p>
        <AdvisorForm />
        <p className="px-4 pt-2 text-[13px] leading-snug text-ios-label-2">
          El asesor inicia sesión en el portal con su usuario y contraseña.
          {googleEnabled()
            ? " Si registras su correo de Google, también puede entrar con “Continuar con Google”."
            : " El acceso con Google se activa cuando se configuren GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET."}
        </p>

        <p className="ios-section-title">Equipo</p>
        {advisors.length > 0 ? (
          <div className="ios-group">
            {advisors.map((a) => (
              <AdvisorRow
                key={a.id}
                advisor={{
                  id: a.id,
                  name: a.name,
                  username: a.username,
                  email: a.email,
                  role: a.role,
                  isActive: a.isActive,
                  avatarColor: a.avatarColor,
                  chats: a._count.conversations,
                  isSelf: a.id === current!.id,
                }}
              />
            ))}
          </div>
        ) : (
          <p className="px-4 text-[15px] text-ios-label-2">Aún no hay asesores registrados.</p>
        )}
      </div>
    </div>
  );
}
