import type { Viewport } from "next";
import { redirect } from "next/navigation";
import { AppProvider } from "@/components/shell/AppContext";
import { NavRail, TabBar } from "@/components/shell/Navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LiveUpdates } from "@/components/LiveUpdates";
import { getCurrentAdvisor } from "@/lib/currentAdvisor";
import { authEnabled } from "@/lib/auth";
import { countWaitingChats } from "@/lib/chat-data";

export const viewport: Viewport = {
  themeColor: "#000000",
  viewportFit: "cover",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [advisor, waitingCount] = await Promise.all([getCurrentAdvisor(), countWaitingChats().catch(() => 0)]);

  // Cookie valida pero el asesor fue desactivado o eliminado: cerrar la sesion.
  if (!advisor && authEnabled()) redirect("/api/auth/logout");

  return (
    <AppProvider
      value={{
        advisorName: advisor?.name ?? "Asesor",
        isAdmin: advisor?.role === "admin",
        waitingCount,
      }}
    >
      <TooltipProvider delayDuration={200}>
        <LiveUpdates />
        <div className="font-ios flex h-svh w-full overflow-hidden bg-background text-foreground">
          <NavRail />
          <div className="flex min-w-0 flex-1 flex-col">
            <main className="flex min-h-0 flex-1 flex-col">{children}</main>
            <TabBar />
          </div>
        </div>
      </TooltipProvider>
    </AppProvider>
  );
}
