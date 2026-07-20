import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Brand } from "../types";
import { getBrands, createBrand, updateBrand, deleteBrand, checkBrandUsage } from "../api/products";
import { usePermissions } from "@/hooks/usePermissions";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import type { FieldDef, RecordAction, RhythmConfig } from "@/components/shared/AdaptiveCollection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Loader2, ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export default function BrandsPanel() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog state
  const [isOpen, setIsOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandName, setBrandName] = useState("");
  const [brandEstado, setBrandEstado] = useState("1");

  // Delete dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const [deleteMode, setDeleteMode] = useState<"confirm" | "deactivated" | "deleted">("confirm");
  const [deleteUsageInfo, setDeleteUsageInfo] = useState<{ used: boolean; productCount: number } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { data: brands = [], isLoading } = useQuery<Brand[]>({
    queryKey: ["brands"],
    queryFn: getBrands,
  });

  const { can } = usePermissions();
  const canCreate = can("productos.create");
  const canEdit = can("productos.edit");
  const canDelete = can("productos.delete");

  // ── Fields ─────────────────────────────────────────────────────
  const fields: FieldDef<Brand>[] = [
    {
      key: "nombre", priority: "primary", semantic: "title",
      label: "Marca",
      className: "font-semibold text-foreground text-sm",
    },
    {
      key: "id_marca", priority: "meta", semantic: "code",
      label: "ID",
      format: (v) => `#${v}`,
    },
    {
      key: "estado", priority: "secondary", semantic: "badge",
      label: "Estado",
      format: (v) => Number(v) === 1 ? "Activo" : "Inactivo",
    },
  ];

  // ── Rhythm ────────────────────────────────────────────────────
  const getRhythm = (b: Brand): RhythmConfig => ({
    type: "dot",
    color: Number(b.estado) === 0 ? "rose" : "emerald",
  });

  // ── Handlers ──────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingBrand(null);
    setBrandName("");
    setBrandEstado("1");
    setIsOpen(true);
  };

  const handleOpenEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setBrandName(brand.nombre);
    setBrandEstado(String(brand.estado ?? "1"));
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;
    setActionLoading(true);
    try {
      const payload = { nombre: brandName, estado: Number(brandEstado) };
      const ok = editingBrand
        ? await updateBrand(editingBrand.id_marca, payload)
        : await createBrand(payload);
      if (ok) { queryClient.invalidateQueries({ queryKey: ["brands"] }); setIsOpen(false); }
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const handleOpenDelete = async (brand: Brand) => {
    setDeletingBrand(brand);
    setDeleteMode("confirm");
    setDeleteUsageInfo(null);
    setIsDeleteOpen(true);
    try { setDeleteUsageInfo(await checkBrandUsage(brand.id_marca)); }
    catch { /* ignore */ }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBrand) return;
    setActionLoading(true);
    try {
      const result = await deleteBrand(deletingBrand.id_marca);
      if (result.success) {
        if (result.mode === "deactivated") setDeleteMode("deactivated");
        else { setDeleteMode("deleted"); queryClient.invalidateQueries({ queryKey: ["brands"] }); setIsDeleteOpen(false); }
      }
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteOpen(false);
    if (deleteMode !== "confirm") queryClient.invalidateQueries({ queryKey: ["brands"] });
    setDeleteMode("confirm");
    setDeleteUsageInfo(null);
  };

  // ── Actions ────────────────────────────────────────────────────
  const actions: RecordAction[] = [
    {
      id: "edit", label: "Editar",
      icon: <Edit className="h-3.5 w-3.5" />,
      onClick: (item) => handleOpenEdit(item as Brand),
      disabled: !canEdit,
    },
    {
      id: "delete", label: "Eliminar",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: (item) => handleOpenDelete(item as Brand),
      variant: "destructive",
      disabled: !canDelete,
    },
  ];

  return (
    <div className="space-y-4">
      <AdaptiveCollection<Brand>
        title="Marcas"
        items={brands}
        fields={fields}
        actions={actions}
        layout="auto"
        isLoading={isLoading}
        search={searchTerm}
        searchPlaceholder="Buscar marcas por nombre o ID…"
        onSearch={setSearchTerm}
        empty={{
          title: "No se encontraron marcas",
          description: searchTerm
            ? `Ninguna marca coincide con "${searchTerm}"`
            : "Registra tu primera marca para organizar tu catálogo.",
        }}
        getItemId={(b) => b.id_marca}
        globalActions={canCreate ? [{
          id: "create", label: "Agregar Marca",
          icon: <Plus className="h-4 w-4" />,
          onClick: handleOpenCreate,
        }] : undefined}
      />

      {/* Create / Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={(o) => !o && setIsOpen(false)}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{editingBrand ? "Editar Marca" : "Registrar Marca"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Nombre</Label>
              <Input id="brand-name" placeholder="Ej: Nike, Samsung" value={brandName}
                onChange={(e) => setBrandName(e.target.value)} disabled={actionLoading} required />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={brandEstado} onValueChange={setBrandEstado} disabled={actionLoading}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="1">Activo</SelectItem>
                  <SelectItem value="0">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="border-t border-border pt-4 flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={actionLoading}>Cancelar</Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={(o) => !o && handleCloseDeleteDialog()}>
        <DialogContent className="max-w-sm border-border bg-card">
          {deleteMode === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-md font-bold">
                  <ShieldAlert className="h-5 w-5 text-destructive/80" /> ¿Eliminar marca?
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-2 space-y-2">
                  <p>¿Eliminar la marca <strong>"{deletingBrand?.nombre}"</strong>?</p>
                  {deleteUsageInfo && deleteUsageInfo.used && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200/50 bg-amber-50/30 p-3 text-xs text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>Usada en <strong>{deleteUsageInfo.productCount}</strong> producto(s). Se <strong>desactivará</strong>.</span>
                    </div>
                  )}
                  {!deleteUsageInfo && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Verificando uso…
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4 flex gap-2">
                <Button variant="ghost" onClick={handleCloseDeleteDialog} disabled={actionLoading}>Cancelar</Button>
                <Button
                  variant={deleteUsageInfo?.used ? "default" : "destructive"}
                  onClick={handleConfirmDelete} disabled={actionLoading}
                >
                  {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {deleteUsageInfo?.used ? "Desactivar" : "Eliminar"}
                </Button>
              </DialogFooter>
            </>
          )}

          {deleteMode === "deactivated" && (
            <>
              <DialogHeader className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-200">
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                </div>
                <DialogTitle className="text-md font-bold">Marca desactivada</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  <strong>"{deletingBrand?.nombre}"</strong> se desactivó porque tiene productos asociados.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button onClick={handleCloseDeleteDialog} className="w-full">Entendido</Button>
              </DialogFooter>
            </>
          )}

          {deleteMode === "deleted" && (
            <>
              <DialogHeader className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <DialogTitle className="text-md font-bold">Marca eliminada</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  <strong>"{deletingBrand?.nombre}"</strong> fue eliminada permanentemente.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button onClick={handleCloseDeleteDialog} className="w-full">Entendido</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
