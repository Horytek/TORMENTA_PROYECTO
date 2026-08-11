import type { StoreSucursal } from "../types/storefront";
import { MapPin } from "lucide-react";

type Props = {
  sucursal: StoreSucursal;
  compact?: boolean;
  showMapLink?: boolean;
  className?: string;
};

export function BranchAddressCard({ sucursal, compact = false, showMapLink = true, className = "" }: Props) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sucursal.direccion)}`;
  const outerClass = compact
    ? `border-0 bg-transparent p-0 rounded-none ${className}`
    : `rounded-[var(--store-radius-md)] border store-hairline bg-[var(--vitrina-elevated)] p-4 ${className}`;
  return (
    <div className={outerClass}>
      <div className={`flex gap-2.5 ${compact ? "items-center" : "gap-3 items-start"}`}>
        {!compact && (
          <MapPin className="size-5 shrink-0 mt-0.5" style={{ color: "var(--vitrina-accent)" }} />
        )}
        <div className="min-w-0 flex-1">
          <p className={`font-semibold ${compact ? "text-sm" : "text-sm"}`}>{sucursal.nombre}</p>
          {!compact && (
            <p className="text-sm store-muted mt-1 leading-relaxed">{sucursal.direccion}</p>
          )}
          {compact && (
            <p className="text-xs store-muted mt-0.5 line-clamp-1">{sucursal.direccion}</p>
          )}
          {showMapLink && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs font-medium mt-2 hover:underline"
              style={{ color: "var(--vitrina-accent)" }}
            >
              Ver en mapa
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
