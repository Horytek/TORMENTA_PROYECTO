import type { ProductAttribute } from "../types";
import type { MatrixCell } from "./MatrixVariantGrid";
import { cartesianCombos, comboKey, comboLabel } from "../lib/variantMatrix";

interface VariantTableBuilderProps {
  /** Atributos con valores elegidos, 3 o más — con 2 se usa la grilla visual (MatrixVariantGrid). */
  attrs: ProductAttribute[];
  seleccionados: Record<number, string[]>;
  precioBase: number;
  cells: Record<string, MatrixCell>;
  onChange: (cells: Record<string, MatrixCell>) => void;
}

const celdaVacia = (): MatrixCell => ({ selected: true, precio: "", stock: "" });

/**
 * Tabla plana para dar de alta variantes con 3+ atributos (ej. Talla × Color
 * × Material). Una grilla visual deja de tener sentido pasado de 2 ejes, así
 * que cada fila es una combinación completa — mismo patrón de bulk-edit
 * (precio/stock por fila, incluir/excluir) que ya usa MatrixVariantGrid en 2D.
 */
export function VariantTableBuilder({ attrs, seleccionados, precioBase, cells, onChange }: VariantTableBuilderProps) {
  const combos = cartesianCombos(attrs, seleccionados);
  if (combos.length === 0) return null;

  const toggle = (key: string) => {
    const actual = cells[key] ?? celdaVacia();
    onChange({ ...cells, [key]: { ...actual, selected: !actual.selected } });
  };

  const setCampo = (key: string, campo: "precio" | "stock", valor: string) => {
    const actual = cells[key] ?? celdaVacia();
    onChange({ ...cells, [key]: { ...actual, [campo]: valor } });
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">
        {combos.length} combinaciones posibles. Clic en una fila para excluirla; precio y stock quedan en blanco si son iguales a los del producto.
      </p>
      <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-100 dark:border-zinc-800/30">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-slate-50 dark:bg-zinc-900/60">
            <tr>
              <th className="p-2 text-left font-semibold text-slate-500 dark:text-slate-400">Combinación</th>
              <th className="w-24 p-2 text-center font-semibold text-slate-500 dark:text-slate-400">Estado</th>
              <th className="w-28 p-2 text-center font-semibold text-slate-500 dark:text-slate-400">Precio</th>
              <th className="w-24 p-2 text-center font-semibold text-slate-500 dark:text-slate-400">Stock</th>
            </tr>
          </thead>
          <tbody>
            {combos.map((combo) => {
              const key = comboKey(combo);
              const celda = cells[key] ?? celdaVacia();
              return (
                <tr key={key} className={`border-t border-slate-100 dark:border-zinc-800/30 ${celda.selected ? "" : "opacity-40"}`}>
                  <td className="p-2 font-medium text-slate-700 dark:text-slate-300">{comboLabel(combo)}</td>
                  <td className="p-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className={`w-full cursor-pointer rounded-md border px-1.5 py-1 text-[10px] font-medium transition-colors ${
                        celda.selected
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-slate-200 text-slate-400 dark:border-zinc-800"
                      }`}
                    >
                      {celda.selected ? "Incluida" : "Excluida"}
                    </button>
                  </td>
                  <td className="p-1.5">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder={`S/ ${precioBase.toFixed(2)}`}
                      value={celda.precio}
                      onChange={(e) => setCampo(key, "precio", e.target.value)}
                      disabled={!celda.selected}
                      className="w-full rounded border border-slate-200 bg-transparent px-1 py-0.5 text-[10px] dark:border-zinc-800"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={celda.stock}
                      onChange={(e) => setCampo(key, "stock", e.target.value)}
                      disabled={!celda.selected}
                      className="w-full rounded border border-slate-200 bg-transparent px-1 py-0.5 text-[10px] dark:border-zinc-800"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
