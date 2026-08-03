import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection/types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getExpressUsers, createExpressUser, updateExpressUser, deleteExpressUser } from "../api/express";
import type { ExpressUser } from "../types";

const emptyForm = { name: "", username: "", password: "", sales: true, inventory: false, status: 1 };

export default function ExpressUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpressUser | null>(null);
  const [deleting, setDeleting] = useState<ExpressUser | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["express-users"],
    queryFn: getExpressUsers,
  });

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name, username: editing.username, password: "",
        sales: !!editing.permissions?.sales, inventory: !!editing.permissions?.inventory,
        status: editing.status,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editing]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["express-users"] });

  const createMutation = useMutation({
    mutationFn: createExpressUser,
    onSuccess: () => { invalidate(); setIsFormOpen(false); toast.success("Usuario creado"); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "No se pudo crear el usuario"),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Parameters<typeof updateExpressUser>[1] }) => updateExpressUser(id, input),
    onSuccess: () => { invalidate(); setIsFormOpen(false); toast.success("Usuario actualizado"); },
    onError: (err: any) => toast.error(err?.response?.data?.message || "No se pudo actualizar el usuario"),
  });
  const deleteMutation = useMutation({
    mutationFn: (u: ExpressUser) => deleteExpressUser(u.id),
    onSuccess: () => { invalidate(); setDeleting(null); toast.success("Usuario eliminado"); },
    onError: () => toast.error("No se pudo eliminar el usuario"),
  });

  const openCreate = () => { setEditing(null); setIsFormOpen(true); };
  const openEdit = (u: ExpressUser) => { setEditing(u); setIsFormOpen(true); };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.username.trim()) {
      toast.error("Nombre y usuario son obligatorios");
      return;
    }
    if (!editing && form.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    const input = {
      name: form.name.trim(),
      username: form.username.trim(),
      permissions: { sales: form.sales, inventory: form.inventory },
      status: form.status,
      ...(form.password ? { password: form.password } : {}),
    };
    if (editing) updateMutation.mutate({ id: editing.id, input });
    else createMutation.mutate({ ...input, role: "cashier" });
  };

  const filtered = users.filter((u) => u.name.toLowerCase().includes(search.trim().toLowerCase()));

  const fields: FieldDef<ExpressUser>[] = [
    { key: "name", label: "Nombre", priority: "primary", semantic: "title" },
    { key: "username", label: "Usuario", priority: "secondary", semantic: "code", format: (v, u) => `${u.name.replace(/\s+/g, "")}@${v}` },
    { key: "status", label: "Estado", priority: "secondary", semantic: "badge", format: (v) => (Number(v) === 1 ? "Activo" : "Inactivo") },
  ];

  const actions: RecordAction[] = [
    { id: "edit", label: "Editar", icon: <Pencil className="h-3.5 w-3.5" />, onClick: (u) => openEdit(u as ExpressUser) },
    { id: "delete", label: "Eliminar", icon: <Trash2 className="h-3.5 w-3.5" />, onClick: (u) => setDeleting(u as ExpressUser), variant: "destructive" },
  ];

  return (
    <>
      <AdaptiveCollection<ExpressUser>
        title="Equipo"
        items={filtered}
        fields={fields}
        actions={actions}
        isLoading={isLoading}
        search={search}
        searchPlaceholder="Buscar empleado…"
        onSearch={setSearch}
        layout="auto"
        getItemId={(u) => u.id}
        empty={{
          title: "Sin empleados",
          description: search ? "Ajusta la búsqueda." : "Agrega tu primer empleado.",
          action: !search ? { label: "Agregar", onClick: openCreate } : undefined,
        }}
        globalActions={[{ id: "create", label: "Agregar", icon: <Plus className="h-4 w-4" />, onClick: openCreate }]}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar empleado" : "Nuevo empleado"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Usuario</Label>
              <Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{editing ? "Nueva contraseña (opcional)" : "Contraseña"}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Permisos</Label>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.sales} onCheckedChange={(v) => setForm((f) => ({ ...f, sales: !!v }))} />
                <span className="text-sm text-foreground">Ventas</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.inventory} onCheckedChange={(v) => setForm((f) => ({ ...f, inventory: !!v }))} />
                <span className="text-sm text-foreground">Inventario</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.status === 1} onCheckedChange={(v) => setForm((f) => ({ ...f, status: v ? 1 : 0 }))} />
              <span className="text-sm text-foreground">Activo</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
        title="¿Eliminar empleado?"
        description={<span className="font-medium text-foreground">{deleting?.name}</span>}
        confirmLabel="Eliminar"
        variant="danger"
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
