import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Subcategory, Category } from "../types";
import {
  getSubcategories, getCategories, createSubcategory, updateSubcategory,
  deleteSubcategory, checkSubcategoryUsage,
} from "../api/products";
import { usePermissions } from "@/hooks/usePermissions";

// UI Components
import { Button } from "@/components/ui/button";
import EntityCardsGrid from "@/components/shared/EntityCardsGrid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus, Search, Edit, Trash2, Loader2, ShieldAlert,
  AlertTriangle, CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

export default function SubcategoriesPanel() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [isOpen, setIsOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
  const [subName, setSubName] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("");
  const [subEstado, setSubEstado] = useState("1");

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingSub, setDeletingSub] = useState<Subcategory | null>(null);
  const [deleteMode, setDeleteMode] = useState<"confirm" | "deactivated" | "deleted">("confirm");
  const [deleteUsageInfo, setDeleteUsageInfo] = useState<{ used: boolean; productCount: number } | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Subcategories
  const { data: subcategories = [], isLoading: isLoadingSubs } = useQuery<Subcategory[]>({
    queryKey: ["subcategories"],
    queryFn: getSubcategories,
  });

  // Fetch Categories for selection dropdown
  const { data: categories = [], isLoading: isLoadingCats } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { can } = usePermissions();

  const hasCreatePermission = can("productos.create");
  const hasEditPermission = can("productos.edit");
  const hasDeletePermission = can("productos.delete");

  const filteredSubs = subcategories.filter((s) =>
    (s.nombre_sub || "").toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
    (s.nom_categoria || "").toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const handleOpenCreate = () => {
    setEditingSub(null);
    setSubName("");
    setSelectedCatId("");
    setSubEstado("1");
    setIsOpen(true);
  };

  const handleOpenEdit = (sub: Subcategory) => {
    setEditingSub(sub);
    setSubName(sub.nombre_sub);
    setSelectedCatId(String(sub.id_categoria));
    setSubEstado(String(sub.estado ?? "1"));
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim() || !selectedCatId) return;

    setActionLoading(true);
    try {
      let success = false;
      const parentCat = categories.find(c => c.id_categoria === Number(selectedCatId));
      const payload = {
        nombre_sub: subName,
        id_categoria: Number(selectedCatId),
        estado: Number(subEstado),
        nom_categoria: parentCat?.nombre || "",
        estado_categoria: parentCat?.estado ?? 1
      };

      if (editingSub) {
        success = await updateSubcategory(editingSub.id_subcategoria, payload);
      } else {
        success = await createSubcategory(payload);
      }

      if (success) {
        queryClient.invalidateQueries({ queryKey: ["subcategories"] });
        setIsOpen(false);
      }
    } catch (err) {
      console.error("Error saving subcategory:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDelete = async (sub: Subcategory) => {
    setDeletingSub(sub);
    setDeleteMode("confirm");
    setDeleteUsageInfo(null);
    setIsDeleteOpen(true);

    try {
      const info = await checkSubcategoryUsage(sub.id_subcategoria);
      setDeleteUsageInfo(info);
    } catch {
      setDeleteUsageInfo(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSub) return;
    setActionLoading(true);
    try {
      const result = await deleteSubcategory(deletingSub.id_subcategoria);
      if (result.success) {
        if (result.mode === "deactivated") {
          setDeleteMode("deactivated");
        } else {
          setDeleteMode("deleted");
          queryClient.invalidateQueries({ queryKey: ["subcategories"] });
          setIsDeleteOpen(false);
        }
      }
    } catch (err) {
      console.error("Error deleting subcategory:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteOpen(false);
    if (deleteMode !== "confirm") {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
    }
    setDeleteMode("confirm");
    setDeleteUsageInfo(null);
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar subcategorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button
          onClick={handleOpenCreate}
          disabled={!hasCreatePermission}
          className="gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Subcategoría</span>
        </Button>
      </div>

      {/* Subcategories Cards Grid */}
      <EntityCardsGrid
        items={filteredSubs}
        getItemId={(s) => s.id_subcategoria}
        columns={[{ labelKey: "nombre_sub" }]}
        subtitleKey="nom_categoria"
        nodeTint={(s) => (s.estado === 0 ? "rose" : undefined)}
        isLoading={isLoadingSubs || isLoadingCats}
        searchTerm={searchTerm}
        emptyMessage={{
          title: "No se encontraron subcategorías",
          description: searchTerm
            ? `Ninguna subcategoría coincide con "${searchTerm}"`
            : "Registra tu primera subcategoría.",
        }}
        getActions={(s) => [
          {
            label: "Editar",
            icon: <Edit className="h-4 w-4" />,
            onClick: () => handleOpenEdit(s),
            disabled: !hasEditPermission,
          },
          {
            label: "Eliminar",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: () => handleOpenDelete(s),
            variant: "destructive",
            disabled: !hasDeletePermission,
          },
        ]}
      />

      {/* Dialog Create/Edit Subcategory */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && setIsOpen(false)}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              {editingSub ? "Editar Subcategoría" : "Registrar Subcategoría"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-select">Categoría Padre</Label>
              <Select
                value={selectedCatId}
                onValueChange={setSelectedCatId}
                disabled={actionLoading}
              >
                <SelectTrigger id="category-select" className="w-full">
                  <SelectValue placeholder="Selecciona Categoría Padre" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {categories.map((c) => (
                    <SelectItem key={c.id_categoria} value={String(c.id_categoria)}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub-name">Nombre de la Subcategoría</Label>
              <Input
                id="sub-name"
                placeholder="Ej: Polos, Zapatillas, Laptops"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                disabled={actionLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub-status">Estado</Label>
              <Select value={subEstado} onValueChange={setSubEstado} disabled={actionLoading}>
                <SelectTrigger id="sub-status" className="w-full">
                  <SelectValue placeholder="Activo" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="1">Activo</SelectItem>
                  <SelectItem value="0">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="border-t border-border pt-4 flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={actionLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Delete — 3 estados */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => !open && handleCloseDeleteDialog()}>
        <DialogContent className="max-w-sm border-border bg-card">

          {deleteMode === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-md font-bold">
                  <ShieldAlert className="h-5 w-5 text-destructive/80" />
                  ¿Eliminar subcategoría?
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-2 space-y-2">
                  <p>
                    ¿Estás seguro de que deseas eliminar la subcategoría{" "}
                    <strong>"{deletingSub?.nombre_sub}"</strong>?
                  </p>
                  {deleteUsageInfo && deleteUsageInfo.used && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200/50 bg-amber-50/30 p-3 text-xs text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        Esta subcategoría está asociada a{" "}
                        <strong>{deleteUsageInfo.productCount} producto(s)</strong>.
                        Al eliminarla se <strong>desactivará</strong> en lugar de borrarse.
                      </span>
                    </div>
                  )}
                  {!deleteUsageInfo && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Verificando uso...
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="mt-4 flex gap-2">
                <Button variant="ghost" onClick={handleCloseDeleteDialog} disabled={actionLoading}>
                  Cancelar
                </Button>
                <Button
                  variant={deleteUsageInfo?.used ? "default" : "destructive"}
                  onClick={handleConfirmDelete}
                  disabled={actionLoading}
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
                <DialogTitle className="text-md font-bold">Subcategoría desactivada</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  La subcategoría <strong>"{deletingSub?.nombre_sub}"</strong> estaba asociada a
                  productos, por lo que se <strong>desactivó</strong> en lugar de eliminarse.
                  Ya no aparecerá en el sistema, pero sus datos históricos se mantienen.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button onClick={handleCloseDeleteDialog} className="w-full">
                  Entendido
                </Button>
              </DialogFooter>
            </>
          )}

          {deleteMode === "deleted" && (
            <>
              <DialogHeader className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <DialogTitle className="text-md font-bold">Subcategoría eliminada</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  La subcategoría <strong>"{deletingSub?.nombre_sub}"</strong> fue eliminada permanentemente.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button onClick={handleCloseDeleteDialog} className="w-full">
                  Entendido
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
