import type { CatalogoProducto } from "../types";

type CatTile = {
  nombre: string;
  count: number;
  image: string | null;
};

type Props = {
  categorias: { nombre: string; count: number }[];
  productos: CatalogoProducto[];
  activa: string | null;
  onSelect: (cat: string | null) => void;
};

function pickImage(productos: CatalogoProducto[], categoria: string): string | null {
  const match = productos.find(
    (p) =>
      p.categoria === categoria &&
      (p.images?.[0] || p.imagen_url)
  );
  return match?.images?.[0] ?? match?.imagen_url ?? null;
}

export function CategoryVisualRail({ categorias, productos, activa, onSelect }: Props) {
  if (categorias.length === 0) return null;

  const tiles: CatTile[] = categorias.slice(0, 10).map((c) => ({
    nombre: c.nombre,
    count: c.count,
    image: pickImage(productos, c.nombre),
  }));

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
      <div className="flex items-end justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] cx-muted">Explorar</p>
          <h2 className="cx-display text-lg sm:text-xl font-bold mt-0.5">Categorías</h2>
        </div>
        {activa && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-xs font-medium text-[var(--cx-accent)] hover:underline"
          >
            Ver todas
          </button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory scrollbar-none">
        {tiles.map((t) => {
          const active = activa === t.nombre;
          return (
            <button
              key={t.nombre}
              type="button"
              onClick={() => onSelect(active ? null : t.nombre)}
              className={`cx-focus snap-start shrink-0 w-[7.5rem] sm:w-[8.5rem] text-left group ${
                active ? "opacity-100" : "opacity-95"
              }`}
            >
              <div
                className={`relative aspect-[3/4] rounded-2xl overflow-hidden bg-black/[0.05] ring-2 transition-all ${
                  active ? "ring-[var(--cx-accent)]" : "ring-transparent group-hover:ring-black/10"
                }`}
              >
                {t.image ? (
                  <img
                    src={t.image}
                    alt=""
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center text-[10px] cx-muted px-2 text-center">
                    {t.nombre}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2.5 text-white">
                  <p className="text-[11px] font-semibold leading-tight line-clamp-2">{t.nombre}</p>
                  <p className="text-[10px] text-white/70 mt-0.5">{t.count}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
