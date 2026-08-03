import type { ProductAttribute } from "../types";

export interface MatrixCell {
  selected: boolean;
  precio: string;
  stock: string;
}

export const matrixCellKey = (idValorA: string, idValorB: string) => `${idValorA}:${idValorB}`;

const celdaVacia = (): MatrixCell => ({ selected: true, precio: "", stock: "" });

interface MatrixVariantGridProps {
  attrA: ProductAttribute;
  attrB: ProductAttribute;
  seleccionadosA: string[];
  seleccionadosB: string[];
  precioBase: number;
  cells: Record<string, MatrixCell>;
  onChange: (cells: Record<string, MatrixCell>) => void;
}

/**
 * Grilla 2D para dar de alta variantes por combinación (ej. Talla × Color)
 * con precio/stock inicial editable por celda. Reemplaza al cartesiano
 * "todas las combinaciones posibles" del flujo de checkboxes cuando hay
 * exactamente 2 atributos con valores elegidos — deja excluir celdas que no
 * existen en la realidad (ej. no hay talla XL en negro) en vez de forzar a
 * crear el SKU y luego borrarlo.
 */
export function MatrixVariantGrid({
  attrA, attrB, seleccionadosA, seleccionadosB, precioBase, cells, onChange,
}: MatrixVariantGridProps) {
  const valoresA = (attrA.values ?? []).filter((v) => seleccionadosA.includes(String(v.id_valor)));
  const valoresB = (attrB.values ?? []).filter((v) => seleccionadosB.includes(String(v.id_valor)));

  if (valoresA.length === 0 || valoresB.length === 0) return null;

  const toggle = (a: string, b: string) => {
    const key = matrixCellKey(a, b);
    const actual = cells[key] ?? celdaVacia();
    onChange({ ...cells, [key]: { ...actual, selected: !actual.selected } });
  };

  const setCampo = (a: string, b: string, campo: "precio" | "stock", valor: string) => {
    const key = matrixCellKey(a, b);
    const actual = cells[key] ?? celdaVacia();
    onChange({ ...cells, [key]: { ...actual, [campo]: valor } });
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">
        Clic en una celda para incluirla o excluirla. Precio y stock quedan en blanco si son iguales a los del producto.
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-zinc-800/30">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-slate-50 p-2 text-left font-semibold text-slate-500 dark:bg-zinc-900/60 dark:text-slate-400">
                {attrA.nombre} \ {attrB.nombre}
              </th>
              {valoresB.map((vb) => (
                <th key={vb.id_valor} className="min-w-[110px] bg-slate-50 p-2 text-center font-semibold text-slate-700 dark:bg-zinc-900/60 dark:text-slate-300">
                  {vb.valor}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {valoresA.map((va) => (
              <tr key={va.id_valor} className="border-t border-slate-100 dark:border-zinc-800/30">
                <td className="sticky left-0 bg-slate-50/60 p-2 font-semibold text-slate-700 dark:bg-zinc-900/30 dark:text-slate-300">
                  {va.valor}
                </td>
                {valoresB.map((vb) => {
                  const key = matrixCellKey(String(va.id_valor), String(vb.id_valor));
                  const celda = cells[key] ?? celdaVacia();
                  return (
                    <td key={vb.id_valor} className={`p-1.5 align-top ${celda.selected ? "" : "opacity-40"}`}>
                      <button
                        type="button"
                        onClick={() => toggle(String(va.id_valor), String(vb.id_valor))}
                        className={`w-full cursor-pointer rounded-md border px-1.5 py-1 text-[10px] font-medium transition-colors ${
                          celda.selected
                            ? "border-brand bg-brand/10 text-brand"
                            : "border-slate-200 text-slate-400 dark:border-zinc-800"
                        }`}
                      >
                        {celda.selected ? "Incluida" : "Excluida"}
                      </button>
                      {celda.selected && (
                        <div className="mt-1 space-y-1">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder={`S/ ${precioBase.toFixed(2)}`}
                            value={celda.precio}
                            onChange={(e) => setCampo(String(va.id_valor), String(vb.id_valor), "precio", e.target.value)}
                            className="w-full rounded border border-slate-200 bg-transparent px-1 py-0.5 text-[10px] dark:border-zinc-800"
                          />
                          <input
                            type="number"
                            min={0}
                            placeholder="Stock 0"
                            value={celda.stock}
                            onChange={(e) => setCampo(String(va.id_valor), String(vb.id_valor), "stock", e.target.value)}
                            className="w-full rounded border border-slate-200 bg-transparent px-1 py-0.5 text-[10px] dark:border-zinc-800"
                          />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
