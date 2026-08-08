import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { HORYTEK_PRODUCTS, type HorytekProduct } from "@/features/platform/catalog/horytekProducts";
import { getLandingModule } from "../modules/landingModules.registry";

interface ProductSwitcherProps {
  productId: string;
  onProductChange: (productId: string) => void;
  /** Mostrar también en mobile (sin hidden sm:block) */
  alwaysVisible?: boolean;
}

/**
 * Selector in-page de todo el catálogo — nunca navega fuera de la landing.
 */
export function ProductSwitcher({
  productId,
  onProductChange,
  alwaysVisible = false,
}: ProductSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const module = getLandingModule(productId);
  const active = HORYTEK_PRODUCTS.find((p) => p.id === productId) || HORYTEK_PRODUCTS[0];

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return HORYTEK_PRODUCTS;
    return HORYTEK_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.job.toLowerCase().includes(term) ||
        p.slug.includes(term)
    );
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pick = (p: HorytekProduct) => {
    setOpen(false);
    setQ("");
    onProductChange(p.id);
  };

  return (
    <div ref={rootRef} className={cn("relative", !alwaysVisible && "hidden sm:block")}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex max-w-[9.5rem] items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-foreground transition-colors sm:max-w-none sm:px-3"
        style={{
          borderColor: module.accent.headerBorder || undefined,
          backgroundColor: module.accent.headerBg || undefined,
        }}
      >
        <span className="max-w-[7.5rem] truncate">{active.name}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Productos Horytek"
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-background shadow-lg"
        >
          <div className="flex items-center gap-2 border-b border-border/70 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar producto…"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {filtered.map((p) => {
              const selected = p.id === productId;
              const m = getLandingModule(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => pick(p)}
                    className={cn(
                      "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors hover:bg-muted/60",
                      selected && "bg-muted/80"
                    )}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-foreground">{p.name}</span>
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: m.accent.accent }}
                        aria-hidden
                      />
                    </span>
                    <span className="line-clamp-1 text-[11px] text-muted-foreground">{p.job}</span>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-[12px] text-muted-foreground">Sin resultados</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
