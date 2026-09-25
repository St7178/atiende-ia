"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, MessageCircle, SquareKanban, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/BrandLogo";
import { AccountMenu } from "@/components/shell/AccountMenu";
import { useApp } from "@/components/shell/AppContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_ITEMS: { href: string; label: string; icon: typeof MessageCircle; badge?: boolean; adminOnly?: boolean }[] = [
  { href: "/conversaciones", label: "Chats", icon: MessageCircle, badge: true },
  { href: "/pipeline", label: "Pipeline", icon: SquareKanban },
  { href: "/asesores", label: "Asesores", icon: Users, adminOnly: true },
  { href: "/conocimiento", label: "Conocimiento", icon: BookOpen },
];

function Badge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[11px] font-bold leading-none text-on-brand",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** Barra lateral de iconos (escritorio), como WhatsApp Desktop. */
export function NavRail() {
  const pathname = usePathname();
  const { waitingCount, isAdmin } = useApp();
  const items = NAV_ITEMS.filter((item) => isAdmin || !item.adminOnly);

  return (
    <nav className="hidden w-[72px] shrink-0 flex-col items-center gap-1.5 border-r border-ios-separator bg-[#0b0b0c] py-4 md:flex">
      <Link href="/conversaciones" className="mb-4" aria-label="Inicio">
        <BrandLogo className="size-10 shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_25%,transparent)]" />
      </Link>

      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                aria-label={item.label}
                className={cn(
                  "relative grid size-12 place-items-center rounded-2xl transition-colors",
                  active ? "bg-white/[0.09] text-brand" : "text-[#8e8e93] hover:bg-white/[0.05] hover:text-white"
                )}
              >
                <item.icon className="size-[22px]" strokeWidth={active ? 2.3 : 1.9} />
                {item.badge && <Badge count={waitingCount} className="absolute -right-0.5 -top-0.5" />}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="rounded-lg border-white/10 text-[13px]">
              {item.label}
            </TooltipContent>
          </Tooltip>
        );
      })}

      <div className="flex-1" />
      <AccountMenu side="right" />
    </nav>
  );
}

/** Barra de pestañas inferior (movil), estilo iOS. Se oculta dentro de un chat. */
export function TabBar() {
  const pathname = usePathname();
  const { waitingCount, isAdmin } = useApp();
  const items = NAV_ITEMS.filter((item) => isAdmin || !item.adminOnly);

  if (/^\/conversaciones\/.+/.test(pathname)) return null;

  return (
    <nav className="flex shrink-0 border-t border-ios-separator bg-[#0b0b0c]/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 pb-1.5 pt-2 text-[10.5px] font-medium",
              active ? "text-brand" : "text-[#8e8e93]"
            )}
          >
            <span className="relative">
              <item.icon className="size-[25px]" strokeWidth={active ? 2.2 : 1.8} />
              {item.badge && <Badge count={waitingCount} className="absolute -right-2.5 -top-1" />}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
