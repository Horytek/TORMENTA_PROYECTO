import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Category } from "../types";
import { 
  getCategories, createCategory, updateCategory, deleteCategory 
} from "../api/products";
import { useUserStore } from "@/store/useUserStore";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, Search, Edit, Trash2, Loader2, Info, ShieldAlert
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
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  
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
    setIsOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.nombre);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setActionLoading(true);
    try {
      let success = false;
      if (editingCategory) {
        success = await updateCategory(editingCategory.id_categoria, { nombre: categoryName });
      } else {
        success = await createCategory({ nombre: categoryName });
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

  const handleOpenDelete = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    setActionLoading(true);
    try {
      const success = await deleteCategory(deletingCategory.id_categoria);
      if (success) {
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        setIsDeleteOpen(false);
      }
    } catch (err) {
      console.error("Error deleting category:", err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar categorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-zinc-950 border-slate-200/60 dark:border-zinc-800/80 rounded-xl focus-visible:ring-purple-500"
          />
        </div>

        <Button 
          onClick={handleOpenCreate}
          disabled={!hasCreatePermission}
          className="flex items-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl px-4 py-2 border-0 shadow-none font-semibold transition-colors disabled:opacity-30"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Categoría</span>
        </Button>
      </div>

      {/* Categories Table list */}
      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center p-8 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 text-slate-400">
          <Info className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
          <p className="text-sm">No se encontraron categorías registradas.</p>
        </div>
      ) : (
        <div className="border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-zinc-900">
            <thead className="bg-slate-50 dark:bg-zinc-900/40">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th scope="col" className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-24">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
              {filteredCategories.map((c) => (
                <tr key={c.id_categoria} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-slate-400">
                    #{c.id_categoria}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {c.nombre}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!hasEditPermission}
                        onClick={() => handleOpenEdit(c)}
                        className="h-8 w-8 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-500/10 disabled:opacity-30"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!hasDeletePermission}
                        onClick={() => handleOpenDelete(c)}
                        className="h-8 w-8 text-slate-400 hover:text-destructive dark:hover:text-red-400 rounded-lg hover:bg-destructive/10 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog Create/Edit Category */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && setIsOpen(false)}>
        <DialogContent className="max-w-md border-slate-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
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
                className="bg-slate-50/50 dark:bg-zinc-900/50 focus-visible:ring-purple-500"
                required
              />
            </div>

            <DialogFooter className="border-t border-slate-100 dark:border-zinc-900 pt-4 flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={actionLoading} className="rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" disabled={actionLoading} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl">
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Delete Confirm */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => !open && setIsDeleteOpen(false)}>
        <DialogContent className="max-w-sm border-slate-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-md font-bold flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5 text-destructive/80" />
              ¿Eliminar categoría?
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs mt-2">
              ¿Estás seguro de que deseas eliminar la categoría <strong>"{deletingCategory?.nombre}"</strong>?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} disabled={actionLoading} className="rounded-xl">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={actionLoading} className="rounded-xl">
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
