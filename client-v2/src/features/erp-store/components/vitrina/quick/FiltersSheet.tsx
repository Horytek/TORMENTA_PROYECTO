import type { ReactNode } from "react";

export function FiltersSheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="store-sheet lg:hidden" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0" aria-label="Cerrar" onClick={onClose} />
      <div className="store-sheet-panel relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Filtros</h3>
          <button type="button" onClick={onClose} className="text-sm store-muted min-h-11 px-2">
            Listo
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
