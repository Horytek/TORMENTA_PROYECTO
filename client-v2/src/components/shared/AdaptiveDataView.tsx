import React, { useState, useMemo } from "react";
import { LayoutGrid, Table as TableIcon, Grid, Search, RefreshCw } from "lucide-react";
import { useAttributeVisibility } from "@/hooks/useAttributeVisibility";

export type LayoutMode = "cards" | "table" | "matrix";

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  /** `atributo.codigo` (ej. "talla", "color") — oculta la columna si el atributo está desactivado (`es_visible = 0`). */
  attributeKey?: string;
}

export interface AdaptiveDataViewProps<T> {
  title: string;
  subtitle?: string;
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  searchFields?: (keyof T)[];
  cardRender?: (item: T) => React.ReactNode;
  matrixRender?: (data: T[]) => React.ReactNode;
  actions?: (item: T) => React.ReactNode;
  globalActions?: React.ReactNode;
  onRefresh?: () => void;
  defaultLayout?: LayoutMode;
}

export function AdaptiveDataView<T extends Record<string, any>>({
  title,
  subtitle,
  data,
  columns,
  loading = false,
  searchFields = [],
  cardRender,
  matrixRender,
  actions,
  globalActions,
  onRefresh,
  defaultLayout = "cards",
}: AdaptiveDataViewProps<T>) {
  const [layout, setLayout] = useState<LayoutMode>(defaultLayout);
  const [searchQuery, setSearchQuery] = useState("");
  const { isAttributeActive } = useAttributeVisibility();

  // Filtrar columnas basadas en variantes activas del tenant
  const activeColumns = useMemo(() => {
    return columns.filter((col) => {
      if (col.attributeKey) {
        return isAttributeActive(col.attributeKey);
      }
      return true;
    });
  }, [columns, isAttributeActive]);

  // Filtrado reactivo en tiempo real
  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || searchFields.length === 0) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((item) =>
      searchFields.some((field) => {
        const val = item[field];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, searchFields]);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h1>
          {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {globalActions}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          )}

          {/* Layout Selector */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setLayout("cards")}
              className={`p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                layout === "cards"
                  ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
              title="Cards Inteligentes"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">Cards</span>
            </button>
            <button
              onClick={() => setLayout("table")}
              className={`p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                layout === "table"
                  ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
              title="Tabla Densa"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden md:inline">Tabla</span>
            </button>
            {matrixRender && (
              <button
                onClick={() => setLayout("matrix")}
                className={`p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                  layout === "matrix"
                    ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
                title="Grilla Matricial 2D"
              >
                <Grid className="w-4 h-4" />
                <span className="hidden md:inline">Matriz 2D</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 self-end sm:self-center font-medium">
          {filteredData.length} registro{filteredData.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Content Rendering based on Layout */}
      {loading ? (
        <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-sm">Cargando información...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-sm font-medium mb-1">No se encontraron resultados</p>
          <p className="text-xs text-zinc-400">Intenta cambiar el término de búsqueda o aplicar otros filtros.</p>
        </div>
      ) : layout === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredData.map((item, index) => (
            <div
              key={item.id || item.codigo || index}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:shadow-md transition-shadow relative flex flex-col justify-between"
            >
              <div>
                {cardRender ? (
                  cardRender(item)
                ) : (
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {item.nombre || item.descripcion || item.title || `Item #${index + 1}`}
                    </h3>
                    {activeColumns.slice(0, 4).map((col) => (
                      <div key={col.key} className="flex justify-between text-xs">
                        <span className="text-zinc-500">{col.header}:</span>
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {col.render ? col.render(item) : String(item[col.key] ?? "-")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {actions && <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">{actions(item)}</div>}
            </div>
          ))}
        </div>
      ) : layout === "matrix" && matrixRender ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 overflow-x-auto">
          {matrixRender(filteredData)}
        </div>
      ) : (
        /* Table Layout */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
              <thead className="bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700 uppercase font-semibold text-zinc-600 dark:text-zinc-400">
                <tr>
                  {activeColumns.map((col) => (
                    <th key={col.key} className="px-4 py-3">
                      {col.header}
                    </th>
                  ))}
                  {actions && <th className="px-4 py-3 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredData.map((item, index) => (
                  <tr key={item.id || item.codigo || index} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                    {activeColumns.map((col) => (
                      <td key={col.key} className="px-4 py-3 font-medium">
                        {col.render ? col.render(item) : String(item[col.key] ?? "-")}
                      </td>
                    ))}
                    {actions && <td className="px-4 py-3 text-right">{actions(item)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
