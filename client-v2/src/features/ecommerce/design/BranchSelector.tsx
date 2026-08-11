import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { StoreSucursal } from "../types/storefront";
import { BranchAddressCard } from "./BranchAddressCard";

type Props = {
  sucursales: StoreSucursal[];
  activeId: number | null;
  onSelect: (id: number) => void;
  className?: string;
  /** compact = 1 línea (mobile/header); default = 2 líneas (desktop) */
  variant?: "compact" | "default";
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={`store-focus-ring flex items-center gap-2 text-left rounded-full border store-hairline bg-[var(--vitrina-elevated)] h-9 shrink min-w-0 ${
            isCompact ? "px-2.5 max-w-[10rem] sm:max-w-[12rem]" : "px-3 max-w-[min(100%,16rem)]"
          } ${className}`}
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
      </SheetTrigger>
      <SheetContent side="bottom" className="vitrina bg-[var(--vitrina-mist)] rounded-t-2xl max-h-[85dvh]">
        <SheetHeader>
          <SheetTitle>Elige sucursal de recojo</SheetTitle>
        </SheetHeader>
        <ul className="mt-4 overflow-y-auto pb-6 divide-y store-hairline">
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
                  className={`w-full text-left px-1 py-3 transition-colors hover:bg-[var(--vitrina-fog)] ${
                    selected ? "bg-[var(--vitrina-accent-soft)]" : ""
                  }`}
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
