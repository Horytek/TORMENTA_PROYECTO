import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import type { Product } from "../types";

// Sub-Panels
import ProductsPanel from "../components/ProductsPanel";
import ProductForm from "../components/ProductForm";
import BrandsPanel from "../components/BrandsPanel";
import CategoriesPanel from "../components/CategoriesPanel";
import SubcategoriesPanel from "../components/SubcategoriesPanel";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Plus, Layers, Tag, Bookmark, Package,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProductsPage() {
  const queryClient = useQueryClient();

  // Tab state synced with URL via nuqs
  const [activeTab, setActiveTab] = useQueryState("tab", parseAsString.withDefault("productos"));

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleCreateOpen = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEditOpen = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val)} className="w-full space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Gestor del catálogo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Administra productos, marcas, categorías y subcategorías
            </p>
          </div>

          <TabsList className="bg-muted p-1 rounded-lg h-11 w-full md:w-auto grid grid-cols-4 gap-1">
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

        {/* Tab: Products */}
        <TabsContent value="productos" className="space-y-4 focus-visible:outline-none">
          <div className="flex justify-end">
            <Button onClick={handleCreateOpen} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo producto
            </Button>
          </div>
          <ProductsPanel onEdit={handleEditOpen} />
        </TabsContent>

        {/* Tab: Brands */}
        <TabsContent value="marcas" className="focus-visible:outline-none">
          <BrandsPanel />
        </TabsContent>

        {/* Tab: Categories */}
        <TabsContent value="categorias" className="focus-visible:outline-none">
          <CategoriesPanel />
        </TabsContent>

        {/* Tab: Subcategories */}
        <TabsContent value="subcategorias" className="focus-visible:outline-none">
          <SubcategoriesPanel />
        </TabsContent>

      </Tabs>

      {/* Modal Form */}
      {isFormOpen && (
        <ProductForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["products"] })}
          initialData={editingProduct}
        />
      )}
    </div>
  );
}
