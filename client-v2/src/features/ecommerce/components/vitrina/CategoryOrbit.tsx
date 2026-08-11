type Props = {
  categorias: { nombre: string; count: number }[];
  activa: string | null;
  onSelect: (cat: string | null) => void;
};

export function CategoryOrbit({ categorias, activa, onSelect }: Props) {
  if (categorias.length === 0) return null;

  const pick = (cat: string | null) => {
    onSelect(cat);
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="border-b store-hairline bg-[var(--vitrina-fog)]">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="flex items-end justify-between gap-4 mb-4">
          <h2 className="vitrina-section-title text-xl sm:text-2xl">Categorías</h2>
          <button type="button" onClick={() => pick(null)} className="store-nav-btn text-sm store-muted min-h-11 px-2">
            Ver todo
          </button>
        </div>
        <div className="store-row-scroll">
          {categorias.map((c) => {
            const on = activa === c.nombre;
            return (
              <button
                key={c.nombre}
                type="button"
                onClick={() => pick(c.nombre)}
                className={`store-chip shrink-0 px-4 py-3 text-sm font-medium border min-h-11 ${
                  on ? "text-white border-transparent" : "bg-[var(--vitrina-elevated)] store-hairline"
                }`}
                style={on ? { background: "var(--vitrina-accent)" } : undefined}
              >
                {c.nombre}
                <span className={`ml-2 text-xs ${on ? "text-white/80" : "store-muted"}`}>{c.count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
