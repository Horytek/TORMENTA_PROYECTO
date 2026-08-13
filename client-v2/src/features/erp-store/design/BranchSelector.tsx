import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { StoreSucursal } from "../types/storefront";
import { BranchAddressCard } from "./BranchAddressCard";
import { cn } from "@/lib/utils";

type Props = {
  sucursales: StoreSucursal[];
  activeId: number | null;
  onSelect: (id: number) => void;
  className?: string;
  /** compact = chip con texto truncado; icon = solo pin (móvil header) */
  variant?: "compact" | "default" | "icon";
};

export function BranchSelector({
  sucursales,
  activeId,
  onSelect,
  className = "",
  variant = "default",
}: Props) {
  const [open, setOpen] = useState(false);
  if (!sucursales.length) return null;
  const active = sucursales.find((s) => s.id_sucursal === activeId) || sucursales[0];
  const isCompact = variant === "compact";
  const isIcon = variant === "icon";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {isIcon ? (
          <button
            type="button"
            className={cn(
              "store-focus-ring store-icon-btn size-10 sm:size-11 flex items-center justify-center shrink-0 rounded-full",
              className
            )}
            aria-label={`Sucursal: ${active.nombre}`}
            title={active.nombre}
          >
            <MapPin className="size-5" style={{ color: "var(--vitrina-accent)" }} />
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              "store-focus-ring flex items-center gap-2 text-left rounded-full border store-hairline bg-[var(--vitrina-elevated)] h-9 shrink-0 min-w-0",
              isCompact ? "px-2.5 max-w-[9rem]" : "px-3 max-w-[min(100%,16rem)]",
              className
            )}
          >
            <MapPin className="size-3.5 shrink-0" style={{ color: "var(--vitrina-accent)" }} />
            <span className="min-w-0 flex-1 leading-tight">
              {isCompact ? (
                <span className="block text-xs font-medium truncate">{active.nombre}</span>
              ) : (
                <>
                  <span className="block text-[10px] uppercase tracking-wide store-muted leading-none mb-0.5">
                    Recojo en
                  </span>
                  <span className="block text-xs font-semibold truncate">{active.nombre}</span>
                </>
              )}
            </span>
            <ChevronDown className="size-3.5 shrink-0 store-muted" />
          </button>
        )}
      </SheetTrigger>

      {/* Móvil: bottom sheet full-bleed. Desktop: panel centrado con ancho máximo */}
      <SheetContent
        side="bottom"
        className={cn(
          "vitrina bg-[var(--vitrina-mist)] gap-0 p-0",
          "max-h-[85dvh]",
          "rounded-t-2xl",
          "sm:inset-x-auto sm:left-1/2 sm:right-auto sm:-translate-x-1/2",
          "sm:bottom-8 sm:w-full sm:max-w-md sm:rounded-2xl sm:border store-hairline sm:shadow-xl"
        )}
      >
        <SheetHeader className="px-5 pt-5 pb-3 pr-12 text-left border-b store-hairline">
          <SheetTitle className="text-base sm:text-lg">Elige sucursal de recojo</SheetTitle>
        </SheetHeader>
        <ul className="overflow-y-auto overscroll-contain px-3 sm:px-4 py-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-1.5">
          {sucursales.map((s) => {
            const selected = s.id_sucursal === activeId;
            return (
              <li key={s.id_sucursal}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(s.id_sucursal);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left rounded-xl px-3.5 py-3.5 min-h-14 transition-colors",
                    "hover:bg-[var(--vitrina-fog)] active:scale-[0.99]",
                    selected
                      ? "bg-[var(--vitrina-accent-soft)] ring-1 ring-[var(--vitrina-accent)]/35"
                      : "bg-[var(--vitrina-elevated)] border store-hairline"
                  )}
                >
                  <BranchAddressCard
                    sucursal={s}
                    compact
                    showMapLink={false}
                    className="border-0 bg-transparent p-0 rounded-none"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
