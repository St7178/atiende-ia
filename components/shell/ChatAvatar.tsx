import { initialsFor } from "@/lib/advisors";
import { cn } from "@/lib/utils";

// Avatar estilo Contactos de iOS: degradado gris con iniciales. La API oficial
// de WhatsApp no entrega la foto de perfil del cliente.
export function ChatAvatar({
  name,
  size = 48,
  color,
  className,
}: {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "grid shrink-0 select-none place-items-center rounded-full font-semibold text-white",
        !color && "bg-gradient-to-b from-[#a5abb8] to-[#7c818c]",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38), background: color }}
    >
      {initialsFor(name) || "?"}
    </div>
  );
}
