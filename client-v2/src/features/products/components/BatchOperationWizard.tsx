import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Percent, Tag, Power, Check, ArrowLeft, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getCategories, getSubcategories, getBrands, batchUpdateProducts, type BatchOperationPayload } from "../api/products";
import type { Product } from "../types";

// ─────────────────────────────────────────────────────────────────
// BatchOperationWizard — 4 pasos: confirmar selección → elegir
// operación → previsualizar → confirmar. Una operación por corrida.
// ─────────────────────────────────────────────────────────────────

interface BatchOperationWizardProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  onSuccess: () => void;
}

type TipoOperacion = "precio" | "categoria" | "estado";

const PASOS = ["Selección", "Operación", "Previsualizar", "Confirmar"] as const;

export default function BatchOperationWizard({ open, onClose, products, onSuccess }: BatchOperationWizardProps) {
  const [paso, setPaso] = useState(0);
  const [tipo, setTipo] = useState<TipoOperacion | null>(null);

  const [ajusteTipo, setAjusteTipo] = useState<"porcentaje" | "monto">("porcentaje");
  const [ajusteValor, setAjusteValor] = useState("");

  const [idSubcategoria, setIdSubcategoria] = useState<string>("");
  const [idMarca, setIdMarca] = useState<string>("");

  const [estadoProducto, setEstadoProducto] = useState<0 | 1>(1);

  const { data: categorias = [] } = useQuery({ queryKey: ["categorias"], queryFn: getCategories, enabled: tipo === "categoria" });
  const { data: subcategorias = [] } = useQuery({ queryKey: ["subcategorias"], queryFn: getSubcategories, enabled: tipo === "categoria" });
  const { data: marcas = [] } = useQuery({ queryKey: ["marcas"], queryFn: getBrands, enabled: tipo === "categoria" });
  const [idCategoriaFiltro, setIdCategoriaFiltro] = useState<string>("");
  const subcategoriasFiltradas = idCategoriaFiltro
    ? subcategorias.filter((s) => String(s.id_categoria) === idCategoriaFiltro)
    : subcategorias;

  const reset = () => {
    setPaso(0);
    setTipo(null);
    setAjusteTipo("porcentaje");
    setAjusteValor("");
    setIdSubcategoria("");
    setIdMarca("");
    setIdCategoriaFiltro("");
    setEstadoProducto(1);
  };

  const cerrar = () => { reset(); onClose(); };

  // Preview: [{ producto, antes, despues }] — puramente cliente, sin ida y vuelta al backend.
  const preview = useMemo(() => {
    if (!tipo) return [];
    return products.map((p) => {
      if (tipo === "precio") {
        const actual = Number(p.precio);
        const valor = Number(ajusteValor) || 0;
        const nuevo = ajusteTipo === "porcentaje"
          ? Math.max(0, Math.round(actual * (1 + valor / 100) * 100) / 100)
          : Math.max(0, Math.round((actual + valor) * 100) / 100);
        return { producto: p, antes: `S/ ${actual.toFixed(2)}`, despues: `S/ ${nuevo.toFixed(2)}` };
      }
      if (tipo === "categoria") {
        const marcaNueva = idMarca ? marcas.find((m) => String(m.id_marca) === idMarca)?.nombre : null;
        const subNueva = idSubcategoria ? subcategorias.find((s) => String(s.id_subcategoria) === idSubcategoria)?.nombre_sub : null;
        const cambios = [subNueva && `Categoría: ${subNueva}`, marcaNueva && `Marca: ${marcaNueva}`].filter(Boolean).join(" · ");
        return { producto: p, antes: `${p.nom_subcat ?? "-"} · ${p.nom_marca ?? "-"}`, despues: cambios || "(sin cambios)" };
      }
      return { producto: p, antes: p.estado_producto === 1 ? "Activo" : "Inactivo", despues: estadoProducto === 1 ? "Activo" : "Inactivo" };
    });
  }, [tipo, products, ajusteTipo, ajusteValor, idSubcategoria, idMarca, subcategorias, marcas, estadoProducto]);

  const payload: BatchOperationPayload | null = useMemo(() => {
    if (tipo === "precio") {
      const valor = Number(ajusteValor);
      if (!Number.isFinite(valor) || valor === 0) return null;
      return { tipo: "precio", ajuste_tipo: ajusteTipo, ajuste_valor: valor };
    }
    if (tipo === "categoria") {
      if (!idSubcategoria && !idMarca) return null;
      return {
        tipo: "categoria",
        ...(idSubcategoria ? { id_subcategoria: Number(idSubcategoria) } : {}),
        ...(idMarca ? { id_marca: Number(idMarca) } : {}),
      };
    }
    if (tipo === "estado") return { tipo: "estado", estado_producto: estadoProducto };
    return null;
  }, [tipo, ajusteTipo, ajusteValor, idSubcategoria, idMarca, estadoProducto]);

  const aplicar = useMutation({
    mutationFn: () => batchUpdateProducts(products.map((p) => p.id_producto), payload!),
    onSuccess: () => { onSuccess(); cerrar(); },
  });

  const puedeAvanzarDesdeOperacion = payload !== null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && cerrar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Operación en lote — {products.length} producto{products.length === 1 ? "" : "s"}</DialogTitle>
        </DialogHeader>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          {PASOS.map((label, i) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                  i < paso ? "border-brand bg-brand text-white" : i === paso ? "border-brand text-brand font-bold" : "border-border text-muted-foreground"
                )}
              >
                {i < paso ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className={i === paso ? "text-foreground" : ""}>{label}</span>
              {i < PASOS.length - 1 && <span className="mx-1 text-border">—</span>}
            </div>
          ))}
        </div>

        {/* Paso 0: confirmar selección */}
        {paso === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Se aplicará la operación a estos {products.length} productos:</p>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
              {products.map((p) => (
                <div key={p.id_producto} className="border-b border-border/40 px-3 py-1.5 text-sm last:border-b-0">
                  {p.descripcion}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paso 1: elegir operación */}
        {paso === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "precio" as const, label: "Ajuste de precio", Icon: Percent },
                { id: "categoria" as const, label: "Categoría/Marca", Icon: Tag },
                { id: "estado" as const, label: "Activar/Desactivar", Icon: Power },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTipo(id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors",
                    tipo === id ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground hover:bg-accent/40"
                  )}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>

            {tipo === "precio" && (
              <div className="flex items-end gap-2">
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={ajusteTipo} onValueChange={(v) => setAjusteTipo(v as "porcentaje" | "monto")}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="porcentaje">Porcentaje</SelectItem>
                      <SelectItem value="monto">Monto fijo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label>{ajusteTipo === "porcentaje" ? "% (ej. 10 o -5)" : "S/ (ej. 5 o -2.50)"}</Label>
                  <Input type="number" step="0.01" value={ajusteValor} onChange={(e) => setAjusteValor(e.target.value)} placeholder="0" />
                </div>
              </div>
            )}

            {tipo === "categoria" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Categoría (filtra subcategorías)</Label>
                  <Select value={idCategoriaFiltro || "__none__"} onValueChange={(v) => { setIdCategoriaFiltro(v === "__none__" ? "" : v); setIdSubcategoria(""); }}>
                    <SelectTrigger><SelectValue placeholder="Sin filtrar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin filtrar</SelectItem>
                      {categorias.map((c) => <SelectItem key={c.id_categoria} value={String(c.id_categoria)}>{c.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Nueva subcategoría (opcional)</Label>
                  <Select value={idSubcategoria || "__none__"} onValueChange={(v) => setIdSubcategoria(v === "__none__" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="No cambiar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No cambiar</SelectItem>
                      {subcategoriasFiltradas.map((s) => <SelectItem key={s.id_subcategoria} value={String(s.id_subcategoria)}>{s.nombre_sub}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Nueva marca (opcional)</Label>
                  <Select value={idMarca || "__none__"} onValueChange={(v) => setIdMarca(v === "__none__" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="No cambiar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No cambiar</SelectItem>
                      {marcas.map((m) => <SelectItem key={m.id_marca} value={String(m.id_marca)}>{m.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {tipo === "estado" && (
              <div className="flex gap-2">
                <Button type="button" variant={estadoProducto === 1 ? "default" : "outline"} size="sm" onClick={() => setEstadoProducto(1)}>Activar</Button>
                <Button type="button" variant={estadoProducto === 0 ? "default" : "outline"} size="sm" onClick={() => setEstadoProducto(0)}>Desactivar</Button>
              </div>
            )}
          </div>
        )}

        {/* Paso 2: previsualizar */}
        {paso === 2 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Así quedarán los productos seleccionados:</p>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-muted text-[10px] uppercase text-muted-foreground">
                  <tr><th className="px-3 py-2">Producto</th><th className="px-3 py-2">Antes</th><th className="px-3 py-2">Después</th></tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {preview.map(({ producto, antes, despues }) => (
                    <tr key={producto.id_producto}>
                      <td className="px-3 py-1.5 font-medium">{producto.descripcion}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{antes}</td>
                      <td className="px-3 py-1.5 font-medium text-brand">{despues}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Paso 3: confirmar */}
        {paso === 3 && (
          <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
            <p className="font-medium text-foreground">
              ¿Aplicar este cambio a {products.length} producto{products.length === 1 ? "" : "s"}?
            </p>
            <p className="text-xs text-muted-foreground">Esta acción actualiza los productos directamente. No hay deshacer automático.</p>
            {aplicar.isError && <p className="text-xs text-destructive">No se pudo aplicar la operación.</p>}
          </div>
        )}

        <DialogFooter className="justify-between sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => (paso === 0 ? cerrar() : setPaso((p) => p - 1))} disabled={aplicar.isPending}>
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> {paso === 0 ? "Cancelar" : "Atrás"}
          </Button>
          {paso < 3 ? (
            <Button
              type="button"
              onClick={() => setPaso((p) => p + 1)}
              disabled={(paso === 1 && !puedeAvanzarDesdeOperacion) || (paso === 0 && products.length === 0)}
            >
              Siguiente <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button type="button" onClick={() => aplicar.mutate()} disabled={aplicar.isPending}>
              {aplicar.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Aplicar cambios
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
