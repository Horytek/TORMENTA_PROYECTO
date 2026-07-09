import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import type { Product } from "../types";
import { 
  getProducts, deleteProduct 
} from "../api/products";

// Sub-Panels
import ProductTable from "../components/ProductTable";
import ProductForm from "../components/ProductForm";
import ViewVariantsModal from "../components/ViewVariantsModal";
import BrandsPanel from "../components/BrandsPanel";
import CategoriesPanel from "../components/CategoriesPanel";
import SubcategoriesPanel from "../components/SubcategoriesPanel";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, Search, Download, Loader2, ShieldAlert, Layers, Tag, Bookmark, Package
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProductsPage() {
  const queryClient = useQueryClient();
  
  // Tab state synced with URL via nuqs
  const [activeTab, setActiveTab] = useQueryState("tab", parseAsString.withDefault("productos"));
  
  // Search state synced with URL via nuqs (only applies to productos tab)
  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));

  // Modals state for Products
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const [isVariantsOpen, setIsVariantsOpen] = useState(false);
  const [variantsProduct, setVariantsProduct] = useState<Product | null>(null);

  // Fetch Products using TanStack Query
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: getProducts,
    enabled: activeTab === "productos", // only load when tab is active
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsDeleteOpen(false);
      setDeletingProduct(null);
    },
  });

  const handleCreateOpen = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEditOpen = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteOpen = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    deleteMutation.mutate(deletingProduct.id_producto);
  };

  const handleViewVariants = (product: Product) => {
    setVariantsProduct(product);
    setIsVariantsOpen(true);
  };

  // CSV Exporter
  const exportToCSV = () => {
    if (products.length === 0) return;

    const headers = ["ID", "Descripcion", "Marca", "Sub-Linea", "Precio", "Codigo de Barras", "Unidad de Medida", "Estado"];
    const rows = products.map((p) => [
      p.id_producto,
      `"${p.descripcion?.replace(/"/g, '""') || ""}"`,
      p.nom_marca || "",
      p.nom_subcat || "",
      Number(p.precio || 0).toFixed(2),
      p.cod_barras || "",
      p.undm || "NIU",
      p.estado_producto === 1 ? "Activo" : "Inactivo",
    ]);

    const csvContent = 
      "data:text/csv;charset=utf-8,\uFEFF" + // BOM support for Excel encoding
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventario_productos_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Tab Switcher Panel */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val)} className="w-full space-y-6">
        
        {/* Main Header that adapts to active tab */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-zinc-900 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
              Gestor del Catálogo
            </h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Administra productos, marcas, categorías y variantes en tu base de datos centralizada
            </p>
          </div>

          <TabsList className="bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl h-11 w-full md:w-auto grid grid-cols-4 gap-1">
            <TabsTrigger value="productos" className="rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold">
              <Package className="h-3.5 w-3.5" />
              <span>Productos</span>
            </TabsTrigger>
            <TabsTrigger value="marcas" className="rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold">
              <Tag className="h-3.5 w-3.5" />
              <span>Marcas</span>
            </TabsTrigger>
            <TabsTrigger value="categorias" className="rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold">
              <Bookmark className="h-3.5 w-3.5" />
              <span>Categorías</span>
            </TabsTrigger>
            <TabsTrigger value="subcategorias" className="rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold">
              <Layers className="h-3.5 w-3.5" />
              <span>Subcategorías</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Products */}
        <TabsContent value="productos" className="space-y-4 focus-visible:outline-none">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar productos por descripción, ID o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full bg-white dark:bg-zinc-950 border-slate-200/60 dark:border-zinc-800/80 rounded-xl focus-visible:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button 
                onClick={exportToCSV}
                variant="outline" 
                className="flex items-center gap-2 border-slate-200 dark:border-zinc-800 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900"
              >
                <Download className="h-4 w-4 text-slate-500" />
                <span className="hidden md:inline">Exportar CSV</span>
              </Button>

              <Button 
                onClick={handleCreateOpen}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-purple-500/20"
              >
                <Plus className="h-4 w-4" />
                <span>Nuevo Producto</span>
              </Button>
            </div>
          </div>

          <ProductTable
            products={products}
            isLoading={isLoading}
            searchTerm={searchTerm}
            onEdit={handleEditOpen}
            onDelete={handleDeleteOpen}
            onViewVariants={handleViewVariants}
          />
        </TabsContent>

        {/* Tab 2: Brands */}
        <TabsContent value="marcas" className="focus-visible:outline-none">
          <BrandsPanel />
        </TabsContent>

        {/* Tab 3: Categories */}
        <TabsContent value="categorias" className="focus-visible:outline-none">
          <CategoriesPanel />
        </TabsContent>

        {/* Tab 4: Subcategories */}
        <TabsContent value="subcategorias" className="focus-visible:outline-none">
          <SubcategoriesPanel />
        </TabsContent>

      </Tabs>

      {/* Modal Form: Create / Edit Product */}
      {isFormOpen && (
        <ProductForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["products"] })}
          initialData={editingProduct}
        />
      )}

      {/* Modal View Variants */}
      {isVariantsOpen && variantsProduct && (
        <ViewVariantsModal
          isOpen={isVariantsOpen}
          onClose={() => {
            setIsVariantsOpen(false);
            setVariantsProduct(null);
          }}
          productId={variantsProduct.id_producto}
          productName={variantsProduct.descripcion}
        />
      )}

      {/* Dialog: Confirm Delete Product */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => !open && setIsDeleteOpen(false)}>
        <DialogContent className="max-w-md border-slate-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5 text-destructive/80" />
              ¿Confirmar eliminación?
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm mt-2">
              ¿Estás seguro de que deseas eliminar permanentemente el producto{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                "{deletingProduct?.descripcion}"
              </strong>
              ? Esta acción no se puede deshacer y podría afectar el stock relacionado.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button 
              variant="ghost" 
              onClick={() => setIsDeleteOpen(false)}
              disabled={deleteMutation.isPending}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="rounded-xl"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Eliminar Producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
