import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

import { ActionFormDialog } from "./ActionFormDialog";
import { getActions, deleteAction } from "../api/developer";
import type { CatalogAction } from "../types";

export function ActionCatalogTab() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<{ open: boolean; action: CatalogAction | null }>({ open: false, action: null });
  const [deleteTarget, setDeleteTarget] = useState<CatalogAction | null>(null);

  const { data: actions = [], isLoading } = useQuery({ queryKey: ["developer-actions"], queryFn: getActions });

  const deleteMutation = useMutation({
    mutationFn: (a: CatalogAction) => deleteAction(a.id_action),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["developer-actions"] }); setDeleteTarget(null); },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Define las acciones globales disponibles para los permisos.</p>
        <Button size="sm" className="gap-1.5" onClick={() => setDialog({ open: true, action: null })}>
          <Plus className="h-4 w-4" /> Nueva acción
        </Button>
      </div>

      <div className="rounded-xl border border-border">
        <div className="grid grid-cols-[1fr_1fr_1.5fr_auto_auto] gap-3 border-b border-border bg-muted/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Clave</span><span>Nombre</span><span>Descripción</span><span>Estado</span><span className="text-right">Acciones</span>
        </div>
        {actions.filter((a) => a?.id_action).map((a) => (
          <div key={a.id_action} className="grid grid-cols-[1fr_1fr_1.5fr_auto_auto] items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0">
            <code className="w-fit truncate rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{a.action_key}</code>
            <span className="truncate text-sm font-medium text-foreground">{a.name}</span>
            <span className="truncate text-xs text-muted-foreground">{a.description}</span>
            <Badge variant={a.is_active ? "success" : "secondary"} className="justify-self-start font-normal">{a.is_active ? "Activo" : "Inactivo"}</Badge>
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDialog({ open: true, action: a })}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(a)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
        {actions.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No hay acciones definidas.</p>}
      </div>

      <ActionFormDialog isOpen={dialog.open} onClose={() => setDialog({ open: false, action: null })} action={dialog.action} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        title="¿Eliminar esta acción?"
        description={`Se eliminará "${deleteTarget?.name}" del catálogo global.`}
        confirmLabel="Eliminar"
        variant="danger"
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
