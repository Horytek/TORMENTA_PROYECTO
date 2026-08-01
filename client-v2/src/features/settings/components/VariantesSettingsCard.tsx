import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sliders, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { IconAction } from "@/components/shared/IconAction";
import { getAttributes, updateAttribute, reorderAttributes } from "@/features/content/api/content";
import { AttributeImpactDialog } from "@/features/content/components/AttributeImpactDialog";
import { TIPO_LABELS } from "@/features/content/types";
import type { Attribute, AttributeInput } from "@/features/content/types";

// ─────────────────────────────────────────────────────────────────
// VariantesSettingsCard — Activar/desactivar atributos (Talla, Color…) a
// nivel de toda la empresa, desde un solo lugar. Reusa `atributo.es_visible`
// (el mismo flag que ya filtra qué atributos se ofrecen al crear variantes
// en Productos) — no crea tabla ni endpoint nuevo, solo junta el toggle acá.
// ─────────────────────────────────────────────────────────────────

export function VariantesSettingsCard() {
  const queryClient = useQueryClient();
  // Atributo pendiente de desactivar: se muestra su impacto antes de confirmar.
  // Activar (sentido inverso) no necesita advertencia, se aplica directo.
  const [porDesactivar, setPorDesactivar] = useState<Attribute | null>(null);

  const { data: atributos = [], isLoading } = useQuery({
    queryKey: ["attributes"],
    queryFn: getAttributes,
  });

  const toggle = useMutation({
    mutationFn: (attr: Attribute) =>
      updateAttribute(attr.id_atributo, {
        nombre: attr.nombre,
        tipo_input: attr.tipo_input as AttributeInput["tipo_input"],
        es_filtro: !!attr.es_filtro,
        es_requerido: !!attr.es_requerido,
        es_visible: !attr.es_visible,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
      setPorDesactivar(null);
    },
  });

  const handleToggle = (attr: Attribute) => {
    if (attr.es_visible) setPorDesactivar(attr); // se está por desactivar: avisar primero
    else toggle.mutate(attr); // se está reactivando: sin fricción
  };

  const reorder = useMutation({
    mutationFn: (ids: number[]) => reorderAttributes(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attributes"] }),
  });

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= atributos.length) return;
    const ids = atributos.map((a) => a.id_atributo);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate(ids);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sliders className="h-4 w-4 text-brand" />
          Variantes y atributos
        </CardTitle>
        <CardDescription>
          Desactivar un atributo lo oculta al crear variantes nuevas en Productos. Las variantes ya creadas con ese atributo no se tocan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando atributos…
          </div>
        ) : atributos.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            Todavía no creas atributos. Ve a Productos → Atributos y variantes.
          </p>
        ) : (
          atributos.map((attr, i) => (
            <div
              key={attr.id_atributo}
              className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-zinc-50 px-4 py-3 dark:bg-zinc-900/50"
            >
              <div className="flex items-center gap-1">
                <IconAction label="Subir" onClick={() => move(i, -1)} disabled={i === 0 || reorder.isPending}><ArrowUp className="h-4 w-4" /></IconAction>
                <IconAction label="Bajar" onClick={() => move(i, 1)} disabled={i === atributos.length - 1 || reorder.isPending}><ArrowDown className="h-4 w-4" /></IconAction>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium capitalize">{attr.nombre}</p>
                <p className="text-xs text-muted-foreground">{TIPO_LABELS[attr.tipo_input] ?? attr.tipo_input}</p>
              </div>
              <Switch
                checked={!!attr.es_visible}
                disabled={toggle.isPending}
                onCheckedChange={() => handleToggle(attr)}
              />
            </div>
          ))
        )}
      </CardContent>

      <AttributeImpactDialog
        attribute={porDesactivar}
        onCancel={() => setPorDesactivar(null)}
        onConfirm={() => porDesactivar && toggle.mutate(porDesactivar)}
        isPending={toggle.isPending}
      />
    </Card>
  );
}
