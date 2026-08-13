import type { BranchAvailability } from "../types/storefront";
import { BranchAvailabilityBadge } from "./BranchAvailabilityBadge";
import { AvailabilityStatus } from "./AvailabilityStatus";

type Props = {
  availability: BranchAvailability[];
  activeBranchId?: number | null;
  onSelectBranch?: (id: number) => void;
  allowConsultEmpty?: boolean;
};

export function ProductAvailabilityPanel({
  availability,
  activeBranchId,
  onSelectBranch,
  allowConsultEmpty = false,
}: Props) {
  if (!availability.length) return null;
  return (
    <div className="mt-2 border store-hairline rounded-[var(--store-radius-lg)] p-4 bg-[var(--vitrina-elevated)]">
      <h3 className="font-semibold text-sm mb-1">¿Dónde quieres consultar disponibilidad?</h3>
      <p className="text-xs store-muted mb-4">Elige la sucursal. El WhatsApp se abre con ese local.</p>
      <ul className="divide-y store-hairline">
        {availability.map((a) => {
          const empty = a.disponible <= 0;
          const disabled = empty && !allowConsultEmpty;
          return (
            <li key={a.sucursal.id_sucursal}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelectBranch?.(a.sucursal.id_sucursal)}
                className={`w-full text-left transition-colors ${
                  a.sucursal.id_sucursal === activeBranchId ? "bg-[var(--vitrina-accent-soft)]" : ""
                } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[var(--vitrina-fog)]"}`}
              >
                <div className="flex items-start justify-between gap-3 py-3 px-1">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{a.sucursal.nombre}</p>
                    <p className="text-xs store-muted mt-0.5 line-clamp-2">{a.sucursal.direccion}</p>
                  </div>
                  {a.disponibilidad ? (
                    <AvailabilityStatus disp={a.disponibilidad} showHint={false} />
                  ) : (
                    <BranchAvailabilityBadge disponible={a.disponible} />
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
