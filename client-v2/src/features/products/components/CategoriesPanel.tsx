import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Category } from "../types";
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  checkCategoryUsage,
} from "../api/products";
import { useUserStore } from "@/store/useUserStore";

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

export default function CategoriesPanel() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryEstado, setCategoryEstado] = useState("1");

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteMode, setDeleteMode] = useState<"confirm" | "deactivated" | "deleted">("confirm");
  const [deleteUsageInfo, setDeleteUsageInfo] = useState<{ used: boolean; subcategoryCount: number } | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const capabilities = useUserStore((state) => state.capabilities);
  const user = useUserStore((state) => state.user);

  const hasCreatePermission = user?.roleId === 10 || capabilities.has("productos.create") || capabilities.has("*");
  const hasEditPermission = user?.roleId === 10 || capabilities.has("productos.edit") || capabilities.has("*");
  const hasDeletePermission = user?.roleId === 10 || capabilities.has("productos.delete") || capabilities.has("*");

  const filteredCategories = categories.filter((c) =>
    (c.nombre || "").toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryEstado("1");
    setIsOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.nombre);
    setCategoryEstado(String(category.estado ?? "1"));
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setActionLoading(true);
    try {
      let success = false;
      const payload = {
        nombre: categoryName,
        estado: Number(categoryEstado)
      };

      if (editingCategory) {
        success = await updateCategory(editingCategory.id_categoria, payload);
      } else {
        success = await createCategory(payload);
      }

      if (success) {
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        setIsOpen(false);
      }
    } catch (err) {
      console.error("Error saving category:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDelete = async (category: Category) => {
    setDeletingCategory(category);
    setDeleteMode("confirm");
    setDeleteUsageInfo(null);
    setIsDeleteOpen(true);

    try {
      const info = await checkCategoryUsage(category.id_categoria);
      setDeleteUsageInfo(info);
    } catch {
      setDeleteUsageInfo(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    setActionLoading(true);
    try {
      const result = await deleteCategory(deletingCategory.id_categoria);
      if (result.success) {
        if (result.mode === "deactivated") {
          setDeleteMode("deactivated");
        } else {
          setDeleteMode("deleted");
          queryClient.invalidateQueries({ queryKey: ["categories"] });
          setIsDeleteOpen(false);
        }
      }
    } catch (err) {
      console.error("Error deleting category:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteOpen(false);
    if (deleteMode !== "confirm") {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
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
            placeholder="Buscar categorías..."
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
          <span>Agregar Categoría</span>
        </Button>
      </div>

      {/* Categories Cards Grid */}
      <EntityCardsGrid
        items={filteredCategories}
        getItemId={(c) => c.id_categoria}
        columns={[{ labelKey: "nombre" }]}
        nodeTint={(c) => (c.estado === 0 ? "rose" : undefined)}
        isLoading={isLoading}
        searchTerm={searchTerm}
        emptyMessage={{
          title: "No se encontraron categorías",
          description: searchTerm
            ? `Ninguna categoría coincide con "${searchTerm}"`
            : "Registra tu primera categoría.",
        }}
        getActions={(c) => [
          {
            label: "Editar",
            icon: <Edit className="h-4 w-4" />,
            onClick: () => handleOpenEdit(c),
            disabled: !hasEditPermission,
          },
          {
            label: "Eliminar",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: () => handleOpenDelete(c),
            variant: "destructive",
            disabled: !hasDeletePermission,
          },
        ]}
      />

      {/* Dialog Create/Edit Category */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && setIsOpen(false)}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              {editingCategory ? "Editar Categoría" : "Registrar Categoría"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nombre de la Categoría</Label>
              <Input
                id="category-name"
                placeholder="Ej: Calzado, Ropa, Tecnología"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                disabled={actionLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-status">Estado</Label>
              <Select value={categoryEstado} onValueChange={setCategoryEstado} disabled={actionLoading}>
                <SelectTrigger id="category-status" className="w-full">
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
                  ¿Eliminar categoría?
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-2 space-y-2">
                  <p>
                    ¿Estás seguro de que deseas eliminar la categoría{" "}
                    <strong>"{deletingCategory?.nombre}"</strong>?
                  </p>
                  {deleteUsageInfo && deleteUsageInfo.used && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200/50 bg-amber-50/30 p-3 text-xs text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        Esta categoría tiene{" "}
                        <strong>{deleteUsageInfo.subcategoryCount} subcategoría(s)</strong> asociadas.
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
                <DialogTitle className="text-md font-bold">Categoría desactivada</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  La categoría <strong>"{deletingCategory?.nombre}"</strong> tenía subcategorías
                  asociadas, por lo que se <strong>desactivó</strong> en lugar de eliminarse.
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
                <DialogTitle className="text-md font-bold">Categoría eliminada</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  La categoría <strong>"{deletingCategory?.nombre}"</strong> fue eliminada permanentemente.
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
