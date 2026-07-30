import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Pencil, Trash2, Ban, RotateCcw, Users, Percent, Receipt, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  getVendedores, createVendedor, updateVendedor,
  deactivateVendedor, reactivateVendedor, deleteVendedor,
} from "../api/vendedores";
import { getUsuarios } from "@/features/users/api/users";
import { getVentas } from "@/features/sales/api/ventas";
import type { Vendedor, VendedorInput, VendedorUpdate } from "../types";
import { ComisionesPanel } from "../components/ComisionesPanel";

interface FormState {
  dni: string;
  id_usuario: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  porcentaje_comision: string;
  meta_mensual: string;
}

const emptyForm: FormState = { dni: "", id_usuario: "", nombres: "", apellidos: "", telefono: "", porcentaje_comision: "", meta_mensual: "" };

export default function EmployeesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vendedor | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<Vendedor | null>(null);
  const [viewingSales, setViewingSales] = useState<Vendedor | null>(null);

  const { data: vendedores = [], isLoading } = useQuery({
    queryKey: ["empleados"],
    queryFn: getVendedores,
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ["usuarios-para-empleado"],
    queryFn: getUsuarios,
    enabled: isFormOpen,
  });

  const { data: ventasVendedor = [], isLoading: isLoadingVentas } = useQuery({
    queryKey: ["ventas-vendedor", viewingSales?.dni],
    queryFn: () => getVentas({ dni_vendedor: viewingSales!.dni }),
    enabled: !!viewingSales,
  });

  const createMut = useMutation({ mutationFn: (v: VendedorInput) => createVendedor(v) });
  const updateMut = useMutation({ mutationFn: ({ dni, v }: { dni: string; v: VendedorUpdate }) => updateVendedor(dni, v) });
  const deactivateMut = useMutation({
    mutationFn: (dni: string) => deactivateVendedor(dni),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["empleados"] }); setConfirmDeactivate(null); },
  });
  const reactivateMut = useMutation({
    mutationFn: (dni: string) => reactivateVendedor(dni),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["empleados"] }),
  });
  const deleteMut = useMutation({ mutationFn: (dni: string) => deleteVendedor(dni) });

  const filtered = vendedores.filter(v => {
    if (!search) return true;
    const t = search.toLowerCase();
    return v.nombre?.toLowerCase().includes(t) || v.dni.includes(t) || v.usua?.toLowerCase().includes(t);
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setIsFormOpen(true); };
  const openEdit = (v: Vendedor) => {
    setEditing(v);
    setForm({
      dni: v.dni, id_usuario: String(v.id_usuario), nombres: v.nombres, apellidos: v.apellidos, telefono: v.telefono ?? "",
      porcentaje_comision: v.porcentaje_comision != null ? String(v.porcentaje_comision) : "",
      meta_mensual: v.meta_mensual != null ? String(v.meta_mensual) : "",
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id_usuario) return;
    const porcentaje_comision = form.porcentaje_comision.trim() ? Number(form.porcentaje_comision) : null;
    const meta_mensual = form.meta_mensual.trim() ? Number(form.meta_mensual) : null;
    if (editing) {
      await updateMut.mutateAsync({ dni: editing.dni, v: { ...form, id_usuario: Number(form.id_usuario), dni: form.dni, porcentaje_comision, meta_mensual } });
    } else {
      await createMut.mutateAsync({ ...form, id_usuario: Number(form.id_usuario), porcentaje_comision, meta_mensual });
    }
    qc.invalidateQueries({ queryKey: ["empleados"] });
    setIsFormOpen(false);
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
    {
      key: "nombre_sucursal",
      priority: "meta",
      semantic: "chip",
      label: "Sucursal",
      format: (v) => (v as string) || "Sin sucursal asignada",
      collapsible: true,
    },
  ];

  const actions: RecordAction[] = [
    {
      id: "ventas",
      label: "Ver ventas",
      icon: <Receipt className="h-3.5 w-3.5" />,
      onClick: (item) => setViewingSales(item as Vendedor),
    },
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
      onClick: (item) => setConfirmDeactivate(item as Vendedor),
      hidden: (item) => (item as Vendedor).estado_vendedor !== 1,
      variant: "secondary",
    },
    {
      id: "reactivate",
      label: "Reactivar",
      icon: <RotateCcw className="h-3.5 w-3.5" />,
      onClick: (item) => reactivateMut.mutate((item as Vendedor).dni),
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

      <Tabs defaultValue="empleados" className="space-y-4">
        <TabsList className="h-10 w-fit rounded-lg bg-muted p-1">
          <TabsTrigger value="empleados" className="gap-1.5 rounded-md text-xs font-semibold">
            <Users className="h-3.5 w-3.5" /> Empleados
          </TabsTrigger>
          <TabsTrigger value="comisiones" className="gap-1.5 rounded-md text-xs font-semibold">
            <Percent className="h-3.5 w-3.5" /> Comisiones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empleados" className="space-y-4 focus-visible:outline-none">
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
            layout="auto"
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
        </TabsContent>

        <TabsContent value="comisiones" className="focus-visible:outline-none">
          <ComisionesPanel />
        </TabsContent>
      </Tabs>

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
                <label className="text-xs text-muted-foreground font-medium">Usuario *</label>
                <Select value={form.id_usuario || undefined} onValueChange={(v) => setForm(f => ({ ...f, id_usuario: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios.map((u) => (
                      <SelectItem key={u.id_usuario} value={String(u.id_usuario)}>@{u.usua}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Comisión (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={form.porcentaje_comision}
                onChange={e => setForm(f => ({ ...f, porcentaje_comision: e.target.value }))}
                placeholder="Sin comisión configurada"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Meta mensual (S/)</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.meta_mensual}
                onChange={e => setForm(f => ({ ...f, meta_mensual: e.target.value }))}
                placeholder="Sin meta configurada"
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

      {/* Confirm dar de baja */}
      <ConfirmDialog
        open={!!confirmDeactivate}
        onClose={() => setConfirmDeactivate(null)}
        onConfirm={() => confirmDeactivate && deactivateMut.mutate(confirmDeactivate.dni)}
        title="¿Dar de baja al empleado?"
        description={
          <>
            El empleado quedará inactivo, pero podrás reactivarlo después.
            <br />
            <span className="mt-1 inline-block font-medium text-foreground">
              {confirmDeactivate?.nombre}
            </span>
          </>
        }
        confirmLabel="Dar de baja"
        isPending={deactivateMut.isPending}
      />

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

      {/* Ventas recientes del empleado */}
      <Sheet open={!!viewingSales} onOpenChange={(o) => !o && setViewingSales(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Receipt className="h-4 w-4" /> Ventas de {viewingSales?.nombre}
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4 space-y-2">
            {isLoadingVentas ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : ventasVendedor.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin ventas registradas para este empleado.
              </p>
            ) : (
              ventasVendedor.map((v) => (
                <div key={v.id_venta} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{v.num_comprobante || `Venta #${v.id_venta}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.f_venta} · {v.nom_cliente || "Cliente general"}
                    </p>
                  </div>
                  <span className="font-semibold text-foreground">
                    S/ {Number(v.total_t ?? 0).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
