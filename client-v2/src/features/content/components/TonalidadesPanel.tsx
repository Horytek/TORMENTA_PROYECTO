import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Palette } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { IconAction } from "@/components/shared/IconAction";
import { useUserStore } from "@/store/useUserStore";

import { getTonalidades, createTonalidad, updateTonalidad, deleteTonalidad } from "../api/content";
import type { Tonalidad } from "../types";

const DEFAULT_HEX = "#1F2A44";

export default function TonalidadesPanel() {
  const qc = useQueryClient();
  const capabilities = useUserStore((s) => s.capabilities);
  const user = useUserStore((s) => s.user);
  const can = user?.roleId === 10 || capabilities.has("gestor-contenidos.edit") || capabilities.has("*");

  const { data: tonos = [], isLoading } = useQuery({ queryKey: ["tonalidades"], queryFn: getTonalidades });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tonalidad | null>(null);
  const [nombre, setNombre] = useState("");
  const [hex, setHex] = useState(DEFAULT_HEX);
  const [deleting, setDeleting] = useState<Tonalidad | null>(null);

  const openCreate = () => { setEditing(null); setNombre(""); setHex(DEFAULT_HEX); setFormOpen(true); };
  const openEdit = (t: Tonalidad) => { setEditing(t); setNombre(t.nombre); setHex(t.hex || DEFAULT_HEX); setFormOpen(true); };

  const save = useMutation({
    mutationFn: () => (editing ? updateTonalidad(editing.id_tonalidad, { nombre, hex }) : createTonalidad({ nombre, hex })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tonalidades"] }); setFormOpen(false); },
  });
  const del = useMutation({
    mutationFn: (t: Tonalidad) => deleteTonalidad(t.id_tonalidad),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tonalidades"] }); setDeleting(null); },
  });

  const validHex = /^#[0-9a-fA-F]{6}$/.test(hex);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="num font-medium text-foreground">{tonos.length}</span> tonalidades
        </p>
        <Button onClick={openCreate} disabled={!can} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Nueva tonalidad
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">{[...Array(4)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />)}</div>
        ) : tonos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <Palette className="h-9 w-9 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No hay tonalidades registradas.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Color</TableHead>
                <TableHead>Tonalidad</TableHead>
                <TableHead className="pr-4 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tonos.map((t) => (
                <TableRow key={t.id_tonalidad}>
                  <TableCell className="pl-4">
                    <span
                      className="inline-block h-6 w-6 rounded-md ring-1 ring-border"
                      style={{ backgroundColor: t.hex || "transparent" }}
                      title={t.hex || "sin color"}
                    />
                  </TableCell>
                  <TableCell className="text-sm font-medium capitalize text-foreground">
                    {t.nombre}
                    {t.hex && <span className="num ml-2 text-xs text-muted-foreground">{t.hex}</span>}
                  </TableCell>
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
          title={editing ? "Editar tonalidad" : "Nueva tonalidad"}
          submitLabel={editing ? "Guardar" : "Crear"}
          isSubmitting={save.isPending}
          error={save.isError ? "No se pudo guardar la tonalidad." : null}
          onSubmit={(e) => { e.preventDefault(); if (nombre.trim() && validHex) save.mutate(); }}
        >
          <FormField label="Nombre" htmlFor="tono-nombre">
            <Input id="tono-nombre" autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Azul marino, Fucsia…" />
          </FormField>
          <FormField label="Color" error={!validHex ? "Usa un color hex válido (#RRGGBB)" : undefined}>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={validHex ? hex : DEFAULT_HEX}
                onChange={(e) => setHex(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background p-1"
                aria-label="Selector de color"
              />
              <Input value={hex} onChange={(e) => setHex(e.target.value)} placeholder="#1F2A44" className="num w-32" />
            </div>
          </FormField>
        </FormDialog>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && del.mutate(deleting)}
        title="¿Eliminar tonalidad?"
        description={<span className="font-medium capitalize text-foreground">{deleting?.nombre}</span>}
        confirmLabel="Eliminar"
        variant="danger"
        isPending={del.isPending}
      />
    </div>
  );
}
