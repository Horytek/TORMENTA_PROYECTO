import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Pencil, Trash2, Ban, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection";
import {
  getVendedores, createVendedor, updateVendedor,
  deactivateVendedor, deleteVendedor,
} from "../api/vendedores";
import type { Vendedor, VendedorInput, VendedorUpdate } from "../types";

interface FormState {
  dni: string;
  id_usuario: string;
  nombres: string;
  apellidos: string;
  telefono: string;
}

const emptyForm: FormState = { dni: "", id_usuario: "", nombres: "", apellidos: "", telefono: "" };

export default function EmployeesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vendedor | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: vendedores = [], isLoading } = useQuery({
    queryKey: ["empleados"],
    queryFn: getVendedores,
  });

  const createMut = useMutation({ mutationFn: (v: VendedorInput) => createVendedor(v) });
  const updateMut = useMutation({ mutationFn: ({ dni, v }: { dni: string; v: VendedorUpdate }) => updateVendedor(dni, v) });
  const deactivateMut = useMutation({ mutationFn: (dni: string) => deactivateVendedor(dni) });
  const deleteMut = useMutation({ mutationFn: (dni: string) => deleteVendedor(dni) });

  const filtered = vendedores.filter(v => {
    if (!search) return true;
    const t = search.toLowerCase();
    return v.nombre?.toLowerCase().includes(t) || v.dni.includes(t) || v.usua?.toLowerCase().includes(t);
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setIsFormOpen(true); };
  const openEdit = (v: Vendedor) => {
    setEditing(v);
    setForm({ dni: v.dni, id_usuario: String(v.id_usuario), nombres: v.nombres, apellidos: v.apellidos, telefono: v.telefono ?? "" });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await updateMut.mutateAsync({ dni: editing.dni, v: { ...form, id_usuario: Number(form.id_usuario), dni: form.dni } });
    } else {
      await createMut.mutateAsync({ ...form, id_usuario: Number(form.id_usuario) });
    }
    qc.invalidateQueries({ queryKey: ["empleados"] });
    setIsFormOpen(false);
  };

  const handleDeactivate = async (dni: string) => {
    await deactivateMut.mutateAsync(dni);
    qc.invalidateQueries({ queryKey: ["empleados"] });
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteMut.mutateAsync(confirmDelete);
    qc.invalidateQueries({ queryKey: ["empleados"] });
    setConfirmDelete(null);
  };

  const activos = vendedores.filter(v => v.estado_vendedor === 1).length;
  const inactivos = vendedores.filter(v => v.estado_vendedor === 0).length;

  const fields: FieldDef<Vendedor>[] = [
    {
      key: "nombre",
      priority: "primary",
      semantic: "title",
      label: "Empleado",
    },
    {
      key: "usua",
      priority: "secondary",
      semantic: "subtitle",
      label: "Usuario",
      format: (v) => v ? `@${v}` : "—",
    },
    {
      key: "dni",
      priority: "meta",
      semantic: "code",
      label: "DNI",
    },
    {
      key: "telefono",
      priority: "meta",
      semantic: "code",
      label: "Teléfono",
      format: (v) => (v as string) || "—",
    },
    {
      key: "estado_vendedor",
      priority: "secondary",
      semantic: "badge",
      label: "Estado",
      format: (v) => Number(v) === 1 ? "Activo" : "Inactivo",
    },
  ];

  const actions: RecordAction[] = [
    {
      id: "edit",
      label: "Editar",
      icon: <Pencil className="h-3.5 w-3.5" />,
      onClick: (item) => openEdit(item as Vendedor),
    },
    {
      id: "deactivate",
      label: "Dar de baja",
      icon: <Ban className="h-3.5 w-3.5" />,
      onClick: (item) => handleDeactivate((item as Vendedor).dni),
      hidden: (item) => (item as Vendedor).estado_vendedor !== 1,
      variant: "secondary",
    },
    {
      id: "reactivate",
      label: "Reactivar",
      icon: <RotateCcw className="h-3.5 w-3.5" />,
      onClick: (item) => openEdit(item as Vendedor),
      hidden: (item) => (item as Vendedor).estado_vendedor === 1,
      variant: "secondary",
    },
    {
      id: "delete",
      label: "Eliminar",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: (item) => setConfirmDelete((item as Vendedor).dni),
      variant: "destructive",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Empleados / Vendedores</h1>
          <p className="text-sm text-muted-foreground">
            {vendedores.length} empleados ({activos} activos · {inactivos} inactivos)
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <UserPlus className="h-4 w-4" />Nuevo empleado
        </Button>
      </div>



      {/* Search */}
      <div className="relative max-w-md">
        <Input
          placeholder="Buscar por nombre, DNI o usuario…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-9"
        />
      </div>

      {/* Grid of AdaptiveCards via AdaptiveCollection */}
      <AdaptiveCollection<Vendedor>
        items={filtered}
        fields={fields}
        actions={actions}
        layout="card"
        isLoading={isLoading}
        getItemId={(item) => item.dni}
        getRhythm={(v) => ({
          type: "dot",
          color: v.estado_vendedor === 0 ? "rose" : "emerald",
        })}
        empty={{
          title: "No se encontraron empleados",
          description: search
            ? `Ningún empleado coincide con "${search}"`
            : "No hay empleados registrados.",
        }}
      />

      {/* Form modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar empleado" : "Nuevo empleado"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">DNI *</label>
                <Input
                  value={form.dni}
                  onChange={e => setForm(f => ({ ...f, dni: e.target.value }))}
                  placeholder="12345678"
                  maxLength={8}
                  pattern="\d{8}"
                  required
                  disabled={!!editing}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">ID Usuario *</label>
                <Input
                  type="number"
                  value={form.id_usuario}
                  onChange={e => setForm(f => ({ ...f, id_usuario: e.target.value }))}
                  placeholder="1"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Nombres *</label>
              <Input
                value={form.nombres}
                onChange={e => setForm(f => ({ ...f, nombres: e.target.value }))}
                placeholder="Juan"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Apellidos</label>
              <Input
                value={form.apellidos}
                onChange={e => setForm(f => ({ ...f, apellidos: e.target.value }))}
                placeholder="Pérez García"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Teléfono</label>
              <Input
                value={form.telefono}
                onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                placeholder="999123456"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                {editing ? "Guardar cambios" : "Crear empleado"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <Dialog open={!!confirmDelete} onOpenChange={v => !v && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar empleado</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar al empleado con DNI <strong className="text-foreground">{confirmDelete}</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMut.isPending}>Eliminar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
