import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { Plus, Pencil, Layers, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";

import AttributeForm from "../components/AttributeForm";
import AttributeValuesPanel from "../components/AttributeValuesPanel";
import { getAttributes } from "../api/content";
import type { Attribute } from "../types";
import { TIPO_LABELS } from "../types";

export default function ContentPage() {
  const capabilities = useUserStore((s) => s.capabilities);
  const user = useUserStore((s) => s.user);
  const canEdit = user?.roleId === 10 || capabilities.has("gestor-contenidos.edit") || capabilities.has("*");

  const [selected, setSelected] = useQueryState("attr", parseAsString.withDefault(""));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Attribute | null>(null);

  const { data: attributes = [], isLoading } = useQuery({ queryKey: ["attributes"], queryFn: getAttributes });

  // Selecciona el primero por defecto.
  useEffect(() => {
    if (!selected && attributes.length > 0) setSelected(String(attributes[0].id_atributo));
  }, [attributes, selected, setSelected]);

  const current = attributes.find((a) => String(a.id_atributo) === selected) ?? null;

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (a: Attribute) => { setEditing(a); setFormOpen(true); };

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Gestor de contenidos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Atributos dinámicos de tu empresa (color, talla, material…) y sus valores.
          </p>
        </div>
        <Button onClick={openCreate} disabled={!canEdit} className="gap-2 self-start md:self-auto">
          <Plus className="h-4 w-4" /> Nuevo atributo
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
        {/* Lista de atributos */}
        <aside className="space-y-2">
          {isLoading ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)
          ) : attributes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-8 text-center">
              <Layers className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Crea tu primer atributo.</p>
            </div>
          ) : (
            attributes.map((a) => {
              const isActive = String(a.id_atributo) === selected;
              return (
                <button
                  key={a.id_atributo}
                  onClick={() => setSelected(String(a.id_atributo))}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    isActive
                      ? "border-brand/40 bg-brand/5"
                      : "border-border bg-card hover:bg-accent/50"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium capitalize text-foreground">{a.nombre}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <Badge variant="secondary" className="text-[10px]">{TIPO_LABELS[a.tipo_input] ?? a.tipo_input}</Badge>
                      {a.es_requerido ? <Badge variant="warning" className="text-[10px]">Obligatorio</Badge> : null}
                      {a.es_filtro ? <Badge variant="outline" className="text-[10px]">Filtro</Badge> : null}
                    </div>
                  </div>
                  {canEdit && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); openEdit(a); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); openEdit(a); } }}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground group-hover:opacity-100"
                      aria-label={`Editar ${a.nombre}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <ChevronRight className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-brand" : "text-muted-foreground/40")} />
                </button>
              );
            })
          )}
        </aside>

        {/* Valores del atributo seleccionado */}
        <section>
          {current ? (
            <AttributeValuesPanel attribute={current} canEdit={canEdit} />
          ) : (
            !isLoading && (
              <div className="flex h-full min-h-[16rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center">
                <Layers className="h-9 w-9 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Selecciona un atributo para ver sus valores.</p>
              </div>
            )
          )}
        </section>
      </div>

      {formOpen && (
        <AttributeForm isOpen={formOpen} onClose={() => setFormOpen(false)} initialData={editing} />
      )}
    </div>
  );
}
