import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { buildLoginProductOptions } from "@/features/platform/catalog/horytekProducts";
import { getLoginAccent } from "@/features/auth/loginAccents";

export type ProductPickerMode = string;

interface ProductPickerProps {
  value: ProductPickerMode;
  onChange: (mode: ProductPickerMode) => void;
  onOpenValidar?: () => void;
}

/**
 * Selector escalable de superficie de auth — una tarjeta por loginMode del catálogo.
 * La card activa usa la tonalidad del producto.
 */
export function ProductPicker({ value, onChange, onOpenValidar }: ProductPickerProps) {
  const [q, setQ] = useState("");
  const options = useMemo(() => buildLoginProductOptions(), []);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(term) || o.description.toLowerCase().includes(term)
    );
  }, [options, q]);

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-end justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Elige producto
        </p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrar…"
          className="h-7 w-28 rounded-md border border-border/70 bg-transparent px-2 text-[11px] outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="max-h-[14.5rem] overflow-y-auto pr-0.5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filtered.map((opt) => {
            const active = value === opt.mode;
            const accent = getLoginAccent(opt.mode);
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => onChange(opt.mode)}
                className={cn(
                  "rounded-md border px-3 py-2.5 text-left transition-colors",
                  active
                    ? "border-transparent text-white"
                    : "border-border/70 bg-background hover:border-foreground/40"
                )}
                style={active ? { backgroundColor: accent } : undefined}
              >
                <span className="block text-[13px] font-semibold">{opt.label}</span>
                <span
                  className={cn(
                    "mt-0.5 block text-[11px] leading-snug",
                    active ? "text-white/80" : "text-muted-foreground"
                  )}
                >
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <p className="py-4 text-center text-[12px] text-muted-foreground">Sin coincidencias</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          onChange("validar");
          onOpenValidar?.();
        }}
        className={cn(
          "text-[12px] font-medium underline-offset-4 hover:underline",
          value === "validar" ? "text-foreground" : "text-muted-foreground"
        )}
      >
        ¿Necesitas validar / activar tu cuenta?
      </button>
    </div>
  );
}
