import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Subcategory, Category } from "../types";
import { 
  getSubcategories, getCategories, createSubcategory, updateSubcategory, deleteSubcategory 
} from "../api/products";
import { useUserStore } from "@/store/useUserStore";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

export default function SubcategoriesPanel() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals state
  const [isOpen, setIsOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
  const [subName, setSubName] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("");
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingSub, setDeletingSub] = useState<Subcategory | null>(null);
  
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

  const capabilities = useUserStore((state) => state.capabilities);
  const user = useUserStore((state) => state.user);
  
  const hasCreatePermission = user?.roleId === 10 || capabilities.has("productos.create") || capabilities.has("*");
  const hasEditPermission = user?.roleId === 10 || capabilities.has("productos.edit") || capabilities.has("*");
  const hasDeletePermission = user?.roleId === 10 || capabilities.has("productos.delete") || capabilities.has("*");

  const filteredSubs = subcategories.filter((s) =>
    (s.nombre_sub || "").toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
    (s.nom_categoria || "").toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const handleOpenCreate = () => {
    setEditingSub(null);
    setSubName("");
    setSelectedCatId("");
    setIsOpen(true);
  };

  const handleOpenEdit = (sub: Subcategory) => {
    setEditingSub(sub);
    setSubName(sub.nombre_sub);
    setSelectedCatId(String(sub.id_categoria));
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim() || !selectedCatId) return;

    setActionLoading(true);
    try {
      let success = false;
      const payload = {
        nombre_sub: subName,
        id_categoria: Number(selectedCatId),
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

  const handleOpenDelete = (sub: Subcategory) => {
    setDeletingSub(sub);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSub) return;
    setActionLoading(true);
    try {
      const success = await deleteSubcategory(deletingSub.id_subcategoria);
      if (success) {
        queryClient.invalidateQueries({ queryKey: ["subcategories"] });
        setIsDeleteOpen(false);
      }
    } catch (err) {
      console.error("Error deleting subcategory:", err);
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
            placeholder="Buscar subcategorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button 
          onClick={handleOpenCreate}
          disabled={!hasCreatePermission}
          className="flex items-center gap-2 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Subcategoría</span>
        </Button>
      </div>

      {/* Subcategories Table list */}
      {isLoadingSubs || isLoadingCats ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : filteredSubs.length === 0 ? (
        <div className="text-center p-8 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 text-slate-400">
          <Info className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
          <p className="text-sm">No se encontraron subcategorías registradas.</p>
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
                  Nombre Subcategoría
                </th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Categoría Padre
                </th>
                <th scope="col" className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-24">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
              {filteredSubs.map((s) => (
                <tr key={s.id_subcategoria} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-slate-400">
                    #{s.id_subcategoria}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {s.nombre_sub}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm">
                    <Badge variant="secondary" className="">
                      {s.nom_categoria || "Sin categoría"}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!hasEditPermission}
                        onClick={() => handleOpenEdit(s)}
                        className="h-8 w-8 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-500/10 disabled:opacity-30"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!hasDeletePermission}
                        onClick={() => handleOpenDelete(s)}
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

      {/* Dialog Create/Edit Subcategory */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && setIsOpen(false)}>
        <DialogContent className="max-w-md border-slate-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              {editingSub ? "Editar Subcategoría" : "Registrar Subcategoría"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-select">Categoría Padre</Label>
              <select
                id="category-select"
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                disabled={actionLoading}
                className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 "
                required
              >
                <option value="">Selecciona Categoría Padre</option>
                {categories.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub-name">Nombre de la Subcategoría</Label>
              <Input
                id="sub-name"
                placeholder="Ej: Polos, Zapatillas, Laptops"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                disabled={actionLoading}
                className=""
                required
              />
            </div>

            <DialogFooter className="border-t border-slate-100 dark:border-zinc-900 pt-4 flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={actionLoading} className="rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" disabled={actionLoading} className="">
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
              ¿Eliminar subcategoría?
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs mt-2">
              ¿Estás seguro de que deseas eliminar la subcategoría <strong>"{deletingSub?.nombre_sub}"</strong>?
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
