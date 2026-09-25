"use client";

import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatAvatar } from "@/components/shell/ChatAvatar";
import { useApp } from "@/components/shell/AppContext";
import { logout } from "@/app/login/actions";
import { cn } from "@/lib/utils";

export function AccountMenu({ className, side = "bottom" }: { className?: string; side?: "top" | "bottom" | "right" }) {
  const { advisorName, isAdmin } = useApp();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Cuenta"
        className={cn("rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand", className)}
      >
        <ChatAvatar name={advisorName} size={34} color="var(--brand)" className="text-on-brand" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align="end" className="min-w-56 rounded-xl border-white/10 p-1.5">
        <DropdownMenuLabel className="flex items-center gap-3 py-2">
          <ChatAvatar name={advisorName} size={36} color="var(--brand)" className="text-on-brand" />
          <div className="flex flex-col">
            <span className="text-[15px] font-semibold">{advisorName}</span>
            <span className="text-xs font-normal text-ios-label-2">{isAdmin ? "Administrador" : "Asesor"}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <form action={logout}>
          <DropdownMenuItem asChild className="rounded-lg text-[15px] text-[#ff453a] focus:text-[#ff453a]">
            <button type="submit" className="w-full">
              <LogOut /> Cerrar sesión
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
