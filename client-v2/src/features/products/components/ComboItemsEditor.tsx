import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProducts, getProductCombo, updateProductCombo } from "../api/products";
import type { ComboItem } from "../types";

// ─────────────────────────────────────────────────────────────────
// ComboItemsEditor — Composición de un combo/kit (qué productos lo
// forman y cuántas unidades de cada uno). Solo aplica a productos ya
// guardados (necesita id_producto).
// ─────────────────────────────────────────────────────────────────

interface ComboItemsEditorProps {
  productId: number;
}

export default function ComboItemsEditor({ productId }: ComboItemsEditorProps) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<ComboItem[]>([]);
  const [search, setSearch] = useState("");
  const [dirty, setDirty] = useState(false);

  const { data: comboItems, isLoading } = useQuery({
    queryKey: ["product-combo", productId],
    queryFn: () => getProductCombo(productId),
  });

  useEffect(() => {
    if (comboItems) {
      setItems(comboItems);
      setDirty(false);
    }
  }, [comboItems]);

  const { data: candidatos = [] } = useQuery({
    queryKey: ["products-search-combo", search],
    queryFn: () => getProducts({ q: search, limit: 8 }),
    enabled: search.trim().length >= 2,
  });

  const yaAgregado = (id: number) => items.some((it) => it.id_producto_componente === id);
  const listaCandidatos: any[] = Array.isArray(candidatos) ? candidatos : (candidatos as any)?.data || [];
  const opciones = listaCandidatos.filter(
    (p: any) => p.id_producto !== productId && !p.es_combo && !yaAgregado(p.id_producto)
  );

  const agregar = (id_producto_componente: number, descripcion: string) => {
    setItems((prev) => [...prev, { id_producto_componente, cantidad: 1, descripcion }]);
    setDirty(true);
    setSearch("");
  };

  const quitar = (id_producto_componente: number) => {
    setItems((prev) => prev.filter((it) => it.id_producto_componente !== id_producto_componente));
    setDirty(true);
  };

  const cambiarCantidad = (id_producto_componente: number, cantidad: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id_producto_componente === id_producto_componente ? { ...it, cantidad } : it))
    );
    setDirty(true);
  };

  const guardar = useMutation({
    mutationFn: () => updateProductCombo(productId, items),
    onSuccess: () => {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["product-combo", productId] });
    },
  });

  return (
    <div className="border-t border-slate-100 dark:border-zinc-900 pt-4 space-y-3">
      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        Composición del combo
      </h4>
      <p className="text-xs text-muted-foreground">
        Al vender este combo se descuenta el stock de cada componente, no del combo.
      </p>

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-brand" /> Cargando composición…
        </div>
      ) : (
        <>
          {items.length > 0 && (
            <div className="space-y-1.5">
              {items.map((it) => (
                <div
                  key={it.id_producto_componente}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-sm"
                >
                  <span className="flex-1 truncate">{it.descripcion ?? `Producto #${it.id_producto_componente}`}</span>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={it.cantidad}
                    onChange={(e) => cambiarCantidad(it.id_producto_componente, Math.max(1, Number(e.target.value) || 1))}
                    className="w-16 h-7 text-xs text-center"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => quitar(it.id_producto_componente)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <Label className="text-xs text-muted-foreground mb-1 block">Agregar componente</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto por nombre…"
              className="h-8 text-xs"
            />
            {search.trim().length >= 2 && opciones.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-md max-h-48 overflow-y-auto">
                {opciones.map((p: any) => (
                  <button
                    key={p.id_producto}
                    type="button"
                    onClick={() => agregar(p.id_producto, p.descripcion)}
                    className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-xs text-left hover:bg-muted/50 cursor-pointer"
                  >
                    <Plus className="h-3 w-3 text-brand shrink-0" /> {p.descripcion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={!dirty || guardar.isPending}
            onClick={() => guardar.mutate()}
          >
            {guardar.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Guardar composición
          </Button>
          {guardar.isError && (
            <p className="text-xs text-destructive">No se pudo guardar la composición.</p>
          )}
        </>
      )}
    </div>
  );
}
