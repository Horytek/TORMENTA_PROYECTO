import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Check, Tags } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { IconAction } from "@/components/shared/IconAction";
import { cn } from "@/lib/utils";

import {
  getAttributeValues,
  createAttributeValue,
  updateAttributeValue,
  deleteAttributeValue,
} from "../api/content";
import type { Attribute, AttributeValue } from "../types";

const DEFAULT_HEX = "#1F2A44";

export default function AttributeValuesPanel({ attribute, canEdit }: { attribute: Attribute; canEdit: boolean }) {
  const qc = useQueryClient();
  const isColor = attribute.tipo_input === "COLOR";

  const { data: values = [], isLoading } = useQuery({
    queryKey: ["attribute-values", attribute.id_atributo],
    queryFn: () => getAttributeValues(attribute.id_atributo),
  });

  const [editing, setEditing] = useState<AttributeValue | null>(null);
  const [valor, setValor] = useState("");
  const [hex, setHex] = useState(DEFAULT_HEX);
  const [deleting, setDeleting] = useState<AttributeValue | null>(null);

  const resetForm = () => { setEditing(null); setValor(""); setHex(DEFAULT_HEX); };
  useEffect(() => { resetForm(); }, [attribute.id_atributo]);

  const startEdit = (v: AttributeValue) => {
    setEditing(v);
    setValor(v.valor);
    setHex(v.metadata?.hex || DEFAULT_HEX);
  };

  const save = useMutation({
    mutationFn: () => {
      const meta = isColor ? { hex } : undefined;
      return editing
        ? updateAttributeValue(editing.id_valor, valor, meta)
        : createAttributeValue(attribute.id_atributo, valor, meta);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attribute-values", attribute.id_atributo] }); resetForm(); },
  });

  const del = useMutation({
    mutationFn: (v: AttributeValue) => deleteAttributeValue(v.id_valor),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attribute-values", attribute.id_atributo] }); setDeleting(null); },
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Valores de <span className="text-brand">{attribute.nombre}</span>
        </h3>
        <p className="text-xs text-muted-foreground">
          {values.length} {values.length === 1 ? "valor" : "valores"}
        </p>
      </div>

      {/* Alta / edición inline */}
      {canEdit && (
        <form
          onSubmit={(e) => { e.preventDefault(); if (valor.trim()) save.mutate(); }}
          className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-2"
        >
          {isColor && (
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : DEFAULT_HEX}
              onChange={(e) => setHex(e.target.value)}
              className="h-9 w-11 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1"
              aria-label="Color"
            />
          )}
          <Input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={editing ? "Editar valor…" : `Nuevo valor de ${attribute.nombre.toLowerCase()}…`}
            className="h-9 min-w-[10rem] flex-1"
          />
          <Button type="submit" size="sm" className="gap-1.5" disabled={save.isPending || !valor.trim()}>
            {editing ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {editing ? "Guardar" : "Agregar"}
          </Button>
          {editing && (
            <Button type="button" size="sm" variant="ghost" onClick={resetForm}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </form>
      )}

      {/* Lista de valores */}
      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-3">{[...Array(3)].map((_, i) => <div key={i} className="h-9 animate-pulse rounded-md bg-muted" />)}</div>
        ) : values.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-8 text-center">
            <Tags className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Aún no hay valores. Agrega el primero arriba.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {values.map((v) => (
              <li key={v.id_valor} className={cn("flex items-center gap-3 px-3 py-2", editing?.id_valor === v.id_valor && "bg-accent/40")}>
                {isColor && (
                  <span className="h-5 w-5 shrink-0 rounded-md ring-1 ring-border" style={{ backgroundColor: v.metadata?.hex || "transparent" }} />
                )}
                <span className="flex-1 truncate text-sm text-foreground">{v.valor}</span>
                {isColor && v.metadata?.hex && <span className="num text-xs text-muted-foreground">{v.metadata.hex}</span>}
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <IconAction label="Editar" onClick={() => startEdit(v)}><Pencil className="h-4 w-4" /></IconAction>
                    <IconAction label="Eliminar" danger onClick={() => setDeleting(v)}><Trash2 className="h-4 w-4" /></IconAction>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && del.mutate(deleting)}
        title="¿Eliminar valor?"
        description={<span className="font-medium text-foreground">{deleting?.valor}</span>}
        confirmLabel="Eliminar"
        variant="danger"
        isPending={del.isPending}
      />
    </div>
  );
}
