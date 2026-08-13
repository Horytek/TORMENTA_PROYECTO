import type {
  AttrSnapshotItem,
  StorefrontAttr,
  StorefrontVariante,
} from "../../types/storefront";
import type { AttrSeleccion } from "../../store/useEcommerceCartStore";
import { cn } from "@/lib/utils";

export function selectableAttrs(atributos: StorefrontAttr[]) {
  return atributos.filter((a) => a.requiere_seleccion || (a.visible_storefront && a.valores.length));
}

export function requiredAttrsIncomplete(atributos: StorefrontAttr[], sels: AttrSeleccion[]) {
  const map = new Map(sels.map((s) => [s.id_atributo, s]));
  return selectableAttrs(atributos).some((a) => {
    if (!a.obligatorio && !a.requiere_seleccion) return false;
    if (!a.requiere_seleccion) return false;
    const sel = map.get(a.id_atributo);
    if (a.valor_fijo) return false;
    if (!sel) return true;
    if (a.valores.length) return !sel.id_valor;
    return sel.valor == null || String(sel.valor).trim() === "";
  });
}

export function resolveVarianteId(
  variantes: StorefrontVariante[],
  atributos: StorefrontAttr[],
  sels: AttrSeleccion[]
): number | null {
  const variantDefs = atributos.filter((a) => a.es_variante);
  if (!variantDefs.length) return variantes[0]?.id_variante ?? null;
  const wanted: Record<string, number> = {};
  for (const d of variantDefs) {
    const sel = sels.find((s) => s.id_atributo === d.id_atributo);
    if (!sel?.id_valor) return null;
    wanted[String(d.id_atributo)] = Number(sel.id_valor);
  }
  const withAttrs = variantes.filter((v) => v.attrs && Object.keys(v.attrs).length > 0);
  const found = withAttrs.find((v) => {
    const json = v.attrs || {};
    return Object.entries(wanted).every(([k, val]) => Number(json[k]) === val);
  });
  if (found) return found.id_variante;
  // Misma regla que backend: sin cartesianas → variante default (stock global).
  if (!withAttrs.length) return variantes[0]?.id_variante ?? null;
  return null;
}

/** true si hay attrs es_variante seleccionados pero sin fila de variante coincidente */
export function varianteSelectionUnresolved(
  variantes: StorefrontVariante[],
  atributos: StorefrontAttr[],
  sels: AttrSeleccion[]
): boolean {
  const variantDefs = atributos.filter((a) => a.es_variante);
  if (!variantDefs.length) return false;
  if (requiredAttrsIncomplete(atributos, sels)) return false;
  return resolveVarianteId(variantes, atributos, sels) == null;
}

export function attrsLabel(atributos: StorefrontAttr[], sels: AttrSeleccion[]) {
  return sels
    .map((s) => {
      const def = atributos.find((a) => a.id_atributo === s.id_atributo);
      const val =
        def?.valores.find((v) => Number(v.id_valor) === Number(s.id_valor))?.valor || s.valor;
      return val ? `${def?.nombre || ""}: ${val}` : "";
    })
    .filter(Boolean)
    .join(" · ");
}

export function attrsSnapshotFromPicker(
  atributos: StorefrontAttr[],
  sels: AttrSeleccion[]
): AttrSnapshotItem[] {
  const out: AttrSnapshotItem[] = [];
  const selMap = new Map(sels.map((s) => [s.id_atributo, s]));
  for (const a of atributos) {
    if (a.valor_fijo) {
      out.push({
        id_atributo: a.id_atributo,
        nombre: a.nombre,
        tipo: a.tipo,
        valor: a.valor_fijo,
      });
      continue;
    }
    const sel = selMap.get(a.id_atributo);
    const opt = a.valores.find((v) => Number(v.id_valor) === Number(sel?.id_valor));
    const valor = opt?.valor || sel?.valor;
    if (valor) {
      out.push({
        id_atributo: a.id_atributo,
        nombre: a.nombre,
        tipo: a.tipo,
        valor: String(valor),
        hex: opt?.hex ?? null,
      });
    }
  }
  return out;
}

export function AttrPicker({
  atributos,
  value,
  onChange,
}: {
  atributos: StorefrontAttr[];
  value: AttrSeleccion[];
  onChange: (next: AttrSeleccion[]) => void;
}) {
  const list = selectableAttrs(atributos);
  if (!list.length) return null;

  const setSel = (id_atributo: number, patch: Partial<AttrSeleccion>) => {
    const rest = value.filter((s) => s.id_atributo !== id_atributo);
    onChange([...rest, { id_atributo, ...patch }]);
  };

  return (
    <div className="space-y-4">
      {list.map((a) => {
        const sel = value.find((s) => s.id_atributo === a.id_atributo);
        const isColor = a.tipo === "color" || a.codigo === "tonalidad" || a.codigo === "color";
        return (
          <div key={a.id_atributo}>
            <p className="text-xs uppercase tracking-wide store-muted mb-2">
              {a.nombre}
              {a.obligatorio || a.requiere_seleccion ? " *" : ""}
              {!a.es_variante && a.requiere_seleccion ? (
                <span className="normal-case tracking-normal font-normal ml-1 opacity-80">
                  (selección · stock a nivel producto)
                </span>
              ) : null}
            </p>
            {a.valores.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {a.valores.map((v) => {
                  const active = Number(sel?.id_valor) === Number(v.id_valor);
                  return (
                    <button
                      key={String(v.id_valor)}
                      type="button"
                      onClick={() => setSel(a.id_atributo, { id_valor: v.id_valor, valor: v.valor })}
                      className={cn(
                        "inline-flex items-center gap-1.5 min-h-10 px-3 text-sm border transition-colors",
                        active
                          ? "border-[var(--vitrina-accent,theme(colors.teal.700))] bg-[var(--vitrina-accent,theme(colors.teal.700))]/10"
                          : "store-hairline border-stone-200 hover:border-stone-400"
                      )}
                      aria-pressed={active}
                      title={
                        a.es_variante
                          ? undefined
                          : active
                            ? `${a.nombre} ${v.valor} seleccionada`
                            : `Seleccionar ${v.valor}`
                      }
                    >
                      {isColor && v.hex && (
                        <span
                          className="size-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: v.hex }}
                        />
                      )}
                      {v.valor}
                      {active && !a.es_variante ? (
                        <span className="text-[10px] uppercase tracking-wide opacity-70">seleccionada</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <input
                className="w-full h-10 px-3 text-sm border store-hairline bg-transparent"
                value={sel?.valor || ""}
                onChange={(e) => setSel(a.id_atributo, { valor: e.target.value })}
                placeholder={a.nombre}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
