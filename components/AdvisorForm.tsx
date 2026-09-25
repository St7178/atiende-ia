"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ChevronRight, UserPlus } from "lucide-react";
import { createAdvisor, updateAdvisor, type AdvisorFormState } from "@/app/(dashboard)/asesores/actions";
import { ChatAvatar } from "@/components/shell/ChatAvatar";
import { cn } from "@/lib/utils";

const input = "ios-row w-full bg-transparent outline-none placeholder:text-ios-label-2";

function RoleSelect({ defaultValue = "asesor" }: { defaultValue?: string }) {
  return (
    <label className="ios-row">
      <span className="flex-1">Rol</span>
      <select
        name="role"
        defaultValue={defaultValue}
        className="appearance-none bg-transparent text-right text-ios-label-2 outline-none [&>option]:bg-[#2c2c2e]"
      >
        <option value="asesor">Asesor</option>
        <option value="admin">Administrador</option>
      </select>
    </label>
  );
}

function Feedback({ state, okText }: { state: AdvisorFormState; okText: string }) {
  if (state.error) return <p className="px-4 pt-2 text-[13px] text-[#ff453a]">{state.error}</p>;
  if (state.ok) return <p className="px-4 pt-2 text-[13px] text-[#30d158]">{okText}</p>;
  return null;
}

/** Formulario para crear un asesor con usuario y contraseña. */
export function AdvisorForm() {
  const [state, formAction, isPending] = useActionState<AdvisorFormState, FormData>(createAdvisor, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction}>
      <div className="ios-group">
        <input name="name" placeholder="Nombre completo" required autoComplete="off" className={input} />
        <input
          name="username"
          placeholder="Usuario (ej. laura.gomez)"
          required
          autoComplete="off"
          autoCapitalize="none"
          className={input}
        />
        <input
          name="password"
          type="password"
          placeholder="Contraseña inicial (mín. 8 caracteres)"
          required
          autoComplete="new-password"
          className={input}
        />
        <input
          name="email"
          type="email"
          placeholder="Correo de Google (opcional)"
          autoComplete="off"
          className={input}
        />
        <RoleSelect />
        <button type="submit" disabled={isPending} className="ios-row w-full font-medium text-brand">
          <UserPlus className="size-5" /> {isPending ? "Guardando..." : "Agregar asesor"}
        </button>
      </div>
      <Feedback state={state} okText="Asesor agregado. Ya puede iniciar sesión con su usuario." />
    </form>
  );
}

type AdvisorRowData = {
  id: number;
  name: string;
  username: string | null;
  email: string | null;
  role: string;
  isActive: boolean;
  avatarColor: string;
  chats: number;
  isSelf: boolean;
};

/** Fila de la lista de asesores; se expande para editar. */
export function AdvisorRow({ advisor }: { advisor: AdvisorRowData }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<AdvisorFormState, FormData>(updateAdvisor, {});

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.04]"
      >
        <ChatAvatar name={advisor.name} size={40} color={advisor.avatarColor} className={cn(!advisor.isActive && "opacity-40")} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("truncate text-[16px] font-medium", !advisor.isActive && "text-ios-label-2")}>{advisor.name}</span>
            {advisor.role === "admin" && (
              <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-semibold text-brand">Admin</span>
            )}
            {!advisor.isActive && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-ios-label-2">Inactivo</span>
            )}
          </div>
          <div className="truncate text-[13.5px] text-ios-label-2">
            {advisor.username ? `@${advisor.username}` : "Sin usuario"}
            {advisor.email ? ` · ${advisor.email}` : ""}
          </div>
        </div>
        <span className="shrink-0 text-[14px] text-ios-label-2">
          {advisor.chats} {advisor.chats === 1 ? "chat" : "chats"}
        </span>
        <ChevronRight className={cn("size-4 shrink-0 text-ios-label-2 transition-transform", open && "rotate-90")} />
      </button>

      {open && (
        <form action={formAction} className="border-t border-ios-separator bg-black/20 pb-3">
          <input type="hidden" name="id" value={advisor.id} />
          <div className="divide-y divide-ios-separator">
            <label className="ios-row">
              <span className="w-28 shrink-0 text-ios-label-2">Nombre</span>
              <input name="name" defaultValue={advisor.name} required className="min-w-0 flex-1 bg-transparent outline-none" />
            </label>
            <label className="ios-row">
              <span className="w-28 shrink-0 text-ios-label-2">Usuario</span>
              <input
                name="username"
                defaultValue={advisor.username ?? ""}
                placeholder="ej. laura.gomez"
                required
                autoCapitalize="none"
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-ios-label-2"
              />
            </label>
            <label className="ios-row">
              <span className="w-28 shrink-0 text-ios-label-2">Google</span>
              <input
                name="email"
                type="email"
                defaultValue={advisor.email ?? ""}
                placeholder="correo@gmail.com"
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-ios-label-2"
              />
            </label>
            <label className="ios-row">
              <span className="w-28 shrink-0 text-ios-label-2">Contraseña</span>
              <input
                name="password"
                type="password"
                placeholder="Dejar vacío para no cambiarla"
                autoComplete="new-password"
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-ios-label-2"
              />
            </label>
            <RoleSelect defaultValue={advisor.role} />
            <label className="ios-row">
              <span className="flex-1">Activo (puede iniciar sesión)</span>
              <input name="isActive" type="checkbox" defaultChecked={advisor.isActive} className="size-5 accent-[var(--brand)]" />
            </label>
          </div>
          {advisor.isSelf && (
            <p className="px-4 pt-2 text-[12.5px] text-ios-label-2">
              Esta es tu cuenta. Además de la contraseña maestra del portal, puedes entrar con la contraseña que pongas aquí o con tu correo de Google.
            </p>
          )}
          <Feedback state={state} okText="Cambios guardados." />
          <div className="flex justify-end gap-2 px-4 pt-3">
            <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-full px-4 text-[15px] text-ios-label-2">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="h-9 rounded-full bg-brand px-5 text-[15px] font-semibold text-on-brand disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
