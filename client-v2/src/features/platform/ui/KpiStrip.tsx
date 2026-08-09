type Kpi = { label: string; value: string | number; hint?: string };

export function KpiStrip({ items }: { items: Kpi[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((k) => (
        <li
          key={k.label}
          className="border-b border-black/10 bg-white/60 px-3 py-3"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-black/45">
            {k.label}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
            {k.value}
          </p>
          {k.hint ? <p className="mt-0.5 text-[12px] text-black/45">{k.hint}</p> : null}
        </li>
      ))}
    </ul>
  );
}
