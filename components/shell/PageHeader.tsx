import { AccountMenu } from "@/components/shell/AccountMenu";
import { cn } from "@/lib/utils";

/** Titulo grande estilo iOS. En movil incluye el menu de cuenta a la derecha. */
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("shrink-0 px-4 pb-3 pt-3 md:px-6 md:pt-6", className)}>
      <div className="flex items-center justify-end gap-2 md:hidden">
        {actions}
        <AccountMenu />
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-[34px] font-bold leading-tight tracking-[-0.02em] md:text-[28px]">{title}</h1>
          {subtitle && <p className="mt-0.5 text-[15px] text-ios-label-2">{subtitle}</p>}
        </div>
        {actions && <div className="hidden shrink-0 items-center gap-2 md:flex">{actions}</div>}
      </div>
    </header>
  );
}
