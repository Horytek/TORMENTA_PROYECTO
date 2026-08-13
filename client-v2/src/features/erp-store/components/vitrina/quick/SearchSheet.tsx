import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatPen, type StoreProducto } from "../../../types/storefront";
import { searchStore } from "../../../api/erpStore";
import { useBranchStore } from "../../../store/useBranchStore";

type Props = {
  open: boolean;
  onClose: () => void;
  productos: StoreProducto[];
  slug: string;
};

export function SearchSheet({ open, onClose, productos, slug }: Props) {
  const [q, setQ] = useState("");
  const id_sucursal = useBranchStore((s) => s.id_sucursal);

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  const serverQ = useQuery({
    queryKey: ["store-search", slug, q, id_sucursal],
    queryFn: () => searchStore(slug, q, id_sucursal),
    enabled: open && q.trim().length >= 2,
    staleTime: 30_000,
  });

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length >= 2 && serverQ.data?.success) {
      return (serverQ.data.data.productos || []) as StoreProducto[];
    }
    if (!needle) return productos.slice(0, 8);
    return productos
      .filter((p) => `${p.nombre} ${p.sku ?? ""}`.toLowerCase().includes(needle))
      .slice(0, 12);
  }, [productos, q, serverQ.data]);

  if (!open) return null;

  return (
    <div className="store-sheet" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0" aria-label="Cerrar" onClick={onClose} />
      <div className="store-sheet-panel relative z-10 !justify-start !max-h-[90dvh] rounded-none sm:rounded-t-xl">
        <div className="flex items-center gap-2 mb-4">
          <Search className="size-4 store-muted shrink-0" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar productos…"
            className="flex-1 h-11 bg-transparent outline-none text-base"
          />
          <button type="button" onClick={onClose} className="size-11 flex items-center justify-center" aria-label="Cerrar">
            <X className="size-5" />
          </button>
        </div>
        {q.trim().length >= 2 && serverQ.isFetching && (
          <p className="text-xs store-muted mb-2">Buscando…</p>
        )}
        <ul className="divide-y" style={{ borderColor: "var(--vitrina-border)" }}>
          {results.map((p) => (
            <li key={p.id_producto}>
              <Link
                to={`/s/${slug}/producto/${p.id_producto}`}
                onClick={onClose}
                className="flex items-center gap-3 py-3 min-h-14"
              >
                <div className="size-12 shrink-0 bg-[var(--vitrina-fog)] overflow-hidden">
                  {p.imagen_url && <img src={p.imagen_url} alt="" className="size-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.nombre}</p>
                  <p className="text-xs store-muted">{formatPen(Number(p.precio))}</p>
                </div>
              </Link>
            </li>
          ))}
          {results.length === 0 && !serverQ.isFetching && (
            <li className="py-8 text-center text-sm store-muted">Sin resultados</li>
          )}
        </ul>
      </div>
    </div>
  );
}
