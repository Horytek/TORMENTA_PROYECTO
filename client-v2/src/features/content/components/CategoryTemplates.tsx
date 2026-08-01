import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, Bookmark, ChevronRight, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import { getCategories } from "@/features/products/api/products";
import type { Category } from "@/features/products/types";

import { getAttributes, getCategoryAttributeIds, linkCategoryAttributes } from "../api/content";
import { TIPO_LABELS } from "../types";

export default function CategoryTemplates({ canEdit }: { canEdit: boolean }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const { data: categories = [], isLoading: loadingCats } = useQuery({ queryKey: ["categorias"], queryFn: getCategories });
  const { data: attributes = [] } = useQuery({ queryKey: ["attributes"], queryFn: getAttributes });

  useEffect(() => {
    if (selected == null && categories.length > 0) setSelected(categories[0].id_categoria);
  }, [categories, selected]);

  const { data: linkedIds = [], isLoading: loadingLinked } = useQuery({
    queryKey: ["category-attributes", selected],
    queryFn: () => getCategoryAttributeIds(selected as number),
    enabled: selected != null,
  });

  useEffect(() => { setChecked(new Set(linkedIds)); }, [linkedIds]);

  const currentCat = useMemo(() => categories.find((c) => c.id_categoria === selected) ?? null, [categories, selected]);

  const toggle = (id: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const save = useMutation({
    mutationFn: () => linkCategoryAttributes(selected as number, [...checked]),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["category-attributes", selected] }); },
  });

  const dirty = useMemo(() => {
    const a = new Set(linkedIds);
    if (a.size !== checked.size) return true;
    for (const id of checked) if (!a.has(id)) return true;
    return false;
  }, [linkedIds, checked]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
      {/* Categorías */}
      <aside className="space-y-2">
        {loadingCats ? (
          [...Array(5)].map((_, i) => <div key={i} className="h-11 animate-pulse rounded-lg bg-muted" />)
        ) : categories.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No hay categorías.</p>
        ) : (
          categories.map((c: Category) => {
            const isActive = c.id_categoria === selected;
            return (
              <button
                key={c.id_categoria}
                onClick={() => setSelected(c.id_categoria)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                  isActive ? "border-brand/40 bg-brand/5 font-medium text-foreground" : "border-border bg-card text-muted-foreground hover:bg-accent/50"
                )}
              >
                <Bookmark className={cn("h-4 w-4 shrink-0", isActive ? "text-brand" : "text-muted-foreground/60")} />
                <span className="flex-1 truncate capitalize">{c.nombre}</span>
                <ChevronRight className={cn("h-4 w-4 shrink-0", isActive ? "text-brand" : "text-muted-foreground/30")} />
              </button>
            );
          })
        )}
      </aside>

      {/* Atributos de la categoría */}
      <section className="space-y-4">
        <div className="rounded-lg border border-brand/20 bg-brand/5 p-3.5 text-xs text-foreground">
          <p className="font-semibold text-brand mb-0.5">📋 Plantillas de Atributos por Categoría</p>
          <p className="text-muted-foreground leading-relaxed">
            Define qué atributos (Color, Talla, Material...) aplican automáticamente al seleccionar cada categoría. Al crear un producto, se filtrarán solo los atributos de su plantilla para acelerar el registro.
          </p>
        </div>

        {currentCat ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold capitalize text-foreground">{currentCat.nombre}</h3>
                <p className="text-xs text-muted-foreground">
                  <span className="num font-medium text-foreground">{checked.size}</span> de {attributes.length} atributos aplican a esta categoría
                </p>
              </div>
              {canEdit && (
                <Button size="sm" className="gap-2" disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
                  {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Guardar plantilla
                </Button>
              )}
            </div>

            {loadingLinked ? (
              <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-brand" /></div>
            ) : attributes.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-8 text-center">
                <Layers className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Crea atributos en la pestaña "Atributos" primero.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {attributes.map((a) => (
                  <label
                    key={a.id_atributo}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                      checked.has(a.id_atributo) ? "border-brand/40 bg-brand/5" : "border-border bg-card hover:bg-accent/40",
                      !canEdit && "cursor-default"
                    )}
                  >
                    <Checkbox checked={checked.has(a.id_atributo)} disabled={!canEdit} onCheckedChange={() => toggle(a.id_atributo)} />
                    <span className="flex-1 truncate text-sm font-medium capitalize text-foreground">{a.nombre}</span>
                    <Badge variant="secondary" className="text-[10px]">{TIPO_LABELS[a.tipo_input] ?? a.tipo_input}</Badge>
                  </label>
                ))}
              </div>
            )}
          </>
        ) : (
          !loadingCats && (
            <div className="flex h-full min-h-[16rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center">
              <Bookmark className="h-9 w-9 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Selecciona una categoría.</p>
            </div>
          )
        )}
      </section>
    </div>
  );
}
