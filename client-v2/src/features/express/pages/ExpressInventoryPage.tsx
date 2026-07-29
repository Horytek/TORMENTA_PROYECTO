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
import {
  getExpressProducts, createExpressProduct, updateExpressProduct, deleteExpressProduct,
} from "../api/express";
import type { ExpressProduct } from "../types";

const emptyForm = { name: "", price: "", stock: "" };

export default function ExpressInventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpressProduct | null>(null);
  const [deleting, setDeleting] = useState<ExpressProduct | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["express-products"],
    queryFn: getExpressProducts,
  });

  useEffect(() => {
    if (editing) {
      setForm({ name: editing.name, price: String(editing.price), stock: String(editing.stock) });
    } else {
      setForm(emptyForm);
    }
  }, [editing]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["express-products"] });

  const createMutation = useMutation({
    mutationFn: createExpressProduct,
    onSuccess: () => { invalidate(); setIsFormOpen(false); toast.success("Producto creado"); },
    onError: () => toast.error("No se pudo crear el producto"),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: typeof createMutation.variables }) => updateExpressProduct(id, input!),
    onSuccess: () => { invalidate(); setIsFormOpen(false); toast.success("Producto actualizado"); },
    onError: () => toast.error("No se pudo actualizar el producto"),
  });
  const deleteMutation = useMutation({
    mutationFn: (p: ExpressProduct) => deleteExpressProduct(p.id),
    onSuccess: () => { invalidate(); setDeleting(null); toast.success("Producto eliminado"); },
    onError: () => toast.error("No se pudo eliminar el producto"),
  });

  const openCreate = () => { setEditing(null); setIsFormOpen(true); };
  const openEdit = (p: ExpressProduct) => { setEditing(p); setIsFormOpen(true); };

  const handleSubmit = () => {
    const price = Number(form.price);
    const stock = Number(form.stock) || 0;
    if (!form.name.trim() || !price || price <= 0) {
      toast.error("Nombre y precio son obligatorios");
      return;
    }
    const input = { name: form.name.trim(), price, stock };
    if (editing) updateMutation.mutate({ id: editing.id, input });
    else createMutation.mutate(input);
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()));

  const fields: FieldDef<ExpressProduct>[] = [
    { key: "name", label: "Producto", priority: "primary", semantic: "title" },
    { key: "price", label: "Precio", priority: "secondary", semantic: "number", format: (v) => `S/ ${Number(v).toFixed(2)}` },
    { key: "stock", label: "Stock", priority: "secondary", semantic: "chip", format: (v) => String(v) },
  ];

  const actions: RecordAction[] = [
    { id: "edit", label: "Editar", icon: <Pencil className="h-3.5 w-3.5" />, onClick: (p) => openEdit(p as ExpressProduct) },
    { id: "delete", label: "Eliminar", icon: <Trash2 className="h-3.5 w-3.5" />, onClick: (p) => setDeleting(p as ExpressProduct), variant: "destructive" },
  ];

  return (
    <>
      <AdaptiveCollection<ExpressProduct>
        title="Inventario"
        items={filtered}
        fields={fields}
        actions={actions}
        isLoading={isLoading}
        search={search}
        searchPlaceholder="Buscar producto…"
        onSearch={setSearch}
        layout="auto"
        getItemId={(p) => p.id}
        empty={{
          title: "Sin productos",
          description: search ? "Ajusta la búsqueda." : "Registra tu primer producto.",
          action: !search ? { label: "Nuevo producto", onClick: openCreate } : undefined,
        }}
        globalActions={[{ id: "create", label: "Nuevo producto", icon: <Plus className="h-4 w-4" />, onClick: openCreate }]}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Precio (S/)</Label>
                <Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Stock</Label>
                <Input type="number" min={0} value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
              </div>
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
        title="¿Eliminar producto?"
        description={<span className="font-medium text-foreground">{deleting?.name}</span>}
        confirmLabel="Eliminar"
        variant="danger"
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
