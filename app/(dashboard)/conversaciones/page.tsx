import { BrandLogo } from "@/components/BrandLogo";
import { brand } from "@/lib/brand";
import { ChatList } from "@/components/chat/ChatList";
import { loadChatList } from "@/lib/chat-data";

export const dynamic = "force-dynamic";

export default async function ConversacionesPage() {
  const items = await loadChatList();

  return (
    <div className="flex min-h-0 flex-1">
      <ChatList items={items} activeWaId={null} />

      {/* Escritorio: pantalla de bienvenida como WhatsApp Web */}
      <div className="chat-wallpaper hidden flex-1 flex-col items-center justify-center gap-4 border-l border-ios-separator px-8 text-center md:flex">
        <BrandLogo className="size-24 shadow-[0_0_0_6px_color-mix(in_srgb,var(--brand)_18%,transparent)]" />
        <div>
          <h2 className="text-[26px] font-bold tracking-[-0.01em]">{brand.name}</h2>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-ios-label-2">
            Selecciona un chat para ver la conversación. El número en amarillo indica mensajes del cliente que aún no
            tienen respuesta.
          </p>
        </div>
      </div>
    </div>
  );
}
