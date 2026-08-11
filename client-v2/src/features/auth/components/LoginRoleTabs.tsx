/** Selector de rol / superficie — mismo patrón en Taxi, Delivery y LoginPage. */

type Tab<T extends string> = { id: T; label: string };

export function LoginRoleTabs<T extends string>({
  tabs,
  value,
  onChange,
  accent,
}: {
  tabs: Tab<T>[];
  value: T;
  onChange: (id: T) => void;
  accent: string;
}) {
  return (
    <div className="flex gap-1 rounded-lg border border-border/70 p-1">
      {tabs.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`min-h-11 flex-1 rounded-md px-2 py-2 text-[12px] font-semibold transition-colors ${
              active ? "" : "text-muted-foreground hover:text-foreground"
            }`}
            style={active ? { backgroundColor: accent, color: "#fff" } : undefined}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
