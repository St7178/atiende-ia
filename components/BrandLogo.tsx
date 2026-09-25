import { cn } from "@/lib/utils";
import { brand } from "@/lib/brand";

// El logo se muestra recortado en circulo sobre fondo blanco para que se vea
// bien tanto en el login (claro) como en el portal (oscuro).
export function BrandLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={brand.logoUrl} alt={brand.shortName} className={cn("rounded-full bg-white object-contain", className)} />
  );
}
