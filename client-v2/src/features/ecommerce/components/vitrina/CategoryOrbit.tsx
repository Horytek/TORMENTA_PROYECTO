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
    <section className="bg-[var(--vitrina-fog)] border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Orientación</p>
            <h2 className="vitrina-display text-3xl sm:text-4xl mt-1 text-[var(--vitrina-ink)]">
              Explora por categoría
            </h2>
          </div>
          <button
            type="button"
            onClick={() => pick(null)}
            className="text-sm text-slate-500 hover:text-[var(--vitrina-accent)] transition-colors shrink-0"
          >
            Ver todo
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto vitrina-hide-scrollbar pb-1">
          {categorias.map((c) => {
            const on = activa === c.nombre;
            return (
              <button
                key={c.nombre}
                type="button"
                onClick={() => pick(c.nombre)}
                className={`vitrina-pill shrink-0 px-5 py-3 text-sm font-semibold border transition-all ${
                  on
                    ? "text-white border-transparent shadow-md"
                    : "bg-white text-[var(--vitrina-ink)] border-slate-200 hover:border-[var(--vitrina-accent)]"
                }`}
                style={on ? { background: "var(--vitrina-accent)" } : undefined}
              >
                {c.nombre}
                <span className={`ml-2 text-xs ${on ? "text-white/80" : "text-slate-400"}`}>{c.count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
