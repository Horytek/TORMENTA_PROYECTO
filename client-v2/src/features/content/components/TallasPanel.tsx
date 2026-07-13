import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Ruler } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { IconAction } from "@/components/shared/IconAction";
import { useUserStore } from "@/store/useUserStore";

import { getTallas, createTalla, updateTalla, deleteTalla } from "../api/content";
import type { Talla } from "../types";

export default function TallasPanel() {
  const qc = useQueryClient();
  const capabilities = useUserStore((s) => s.capabilities);
  const user = useUserStore((s) => s.user);
  const can = user?.roleId === 10 || capabilities.has("gestor-contenidos.edit") || capabilities.has("*");

  const { data: tallas = [], isLoading } = useQuery({ queryKey: ["tallas"], queryFn: getTallas });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Talla | null>(null);
  const [nombre, setNombre] = useState("");
  const [deleting, setDeleting] = useState<Talla | null>(null);

  const openCreate = () => { setEditing(null); setNombre(""); setFormOpen(true); };
  const openEdit = (t: Talla) => { setEditing(t); setNombre(t.nombre); setFormOpen(true); };

  const save = useMutation({
    mutationFn: () => (editing ? updateTalla(editing.id_talla, nombre) : createTalla(nombre)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tallas"] }); setFormOpen(false); },
  });
  const del = useMutation({
    mutationFn: (t: Talla) => deleteTalla(t.id_talla),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tallas"] }); setDeleting(null); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="num font-medium text-foreground">{tallas.length}</span> tallas
        </p>
        <Button onClick={openCreate} disabled={!can} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Nueva talla
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">{[...Array(4)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />)}</div>
        ) : tallas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <Ruler className="h-9 w-9 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No hay tallas registradas.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Talla</TableHead>
                <TableHead className="pr-4 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tallas.map((t) => (
                <TableRow key={t.id_talla}>
                  <TableCell className="pl-4 text-sm font-medium text-foreground">{t.nombre}</TableCell>
                  <TableCell className="pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <IconAction label="Editar" onClick={() => openEdit(t)} disabled={!can}><Pencil className="h-4 w-4" /></IconAction>
                      <IconAction label="Eliminar" danger onClick={() => setDeleting(t)} disabled={!can}><Trash2 className="h-4 w-4" /></IconAction>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {formOpen && (
        <FormDialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          title={editing ? "Editar talla" : "Nueva talla"}
          submitLabel={editing ? "Guardar" : "Crear"}
          isSubmitting={save.isPending}
          error={save.isError ? "No se pudo guardar la talla." : null}
          onSubmit={(e) => { e.preventDefault(); if (nombre.trim()) save.mutate(); }}
        >
          <FormField label="Nombre" htmlFor="talla-nombre">
            <Input id="talla-nombre" autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="S, M, L, 30, 32…" />
          </FormField>
        </FormDialog>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && del.mutate(deleting)}
        title="¿Eliminar talla?"
        description={<span className="font-medium text-foreground">{deleting?.nombre}</span>}
        confirmLabel="Eliminar"
        variant="danger"
        isPending={del.isPending}
      />
    </div>
  );
}
