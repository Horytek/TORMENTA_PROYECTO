import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import type { Product } from "../types";
import { getProducts, deleteProduct, createProduct } from "../api/products";
import { useUserStore } from "@/store/useUserStore";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import type { FieldDef, RecordAction, RhythmConfig } from "@/components/shared/AdaptiveCollection";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { ShieldAlert, Loader2, Eye, Edit, Trash2, Download, Copy } from "lucide-react";

interface ProductsPanelProps {
  onEdit: (product: Product) => void;
  onViewVariants: (product: Product) => void;
}

export default function ProductsPanel({ onEdit, onViewVariants }: ProductsPanelProps) {
  const queryClient = useQueryClient();

  const [activeTab] = useQueryState("tab", parseAsString.withDefault("productos"));
  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [page, setPage] = useState(1);
  const LIMIT = 12;

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const { data = { data: [], total: 0, totalPages: 1 }, isLoading } = useQuery({
    queryKey: ["products", page, searchTerm],
    queryFn: () => getProducts({ page, limit: LIMIT, q: searchTerm }),
    enabled: activeTab === "productos",
  });
  const products = data.data;
  const totalCount = data.total;
  const totalPages = data.totalPages;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsDeleteOpen(false);
      setDeletingProduct(null);
    },
  });

  const capabilities = useUserStore((s) => s.capabilities);
  const user = useUserStore((s) => s.user);
  void capabilities; // permissions handled in actions

  const duplicateMutation = useMutation({
    mutationFn: (product: Product) => {
      const { id_producto, nom_marca, nom_subcat, costo_promedio, ...rest } = product;
      void id_producto; void nom_marca; void nom_subcat; void costo_promedio;
      return createProduct({
        ...rest,
        descripcion: `${product.descripcion} (copia)`,
        cod_barras: `T${user?.id_tenant ?? 0}-DUP${Date.now()}`,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  // ── Fields ─────────────────────────────────────────────────────
  const fields: FieldDef<Product>[] = [
    {
      key: "descripcion", priority: "primary", semantic: "title",
      label: "Producto",
      className: "font-medium",
    },
    {
      key: "nom_marca", priority: "secondary", semantic: "chip",
      label: "Marca",
      format: (v) => (v as string) || "Genérico",
      className: "text-xs",
    },
    {
      key: "nom_subcat", priority: "secondary", semantic: "subtitle",
      label: "Subcategoría",
    },
    {
      key: "precio", priority: "secondary", semantic: "number",
      label: "Precio",
    },
    {
      key: "margen", priority: "secondary", label: "Margen",
      render: (_v, item) => {
        const costo = item.costo_promedio != null ? Number(item.costo_promedio) : null;
        const precio = Number(item.precio);
        if (costo == null || !Number.isFinite(costo) || costo <= 0) {
          return <span className="text-xs text-muted-foreground">Sin costo</span>;
        }
        const margenPct = ((precio - costo) / precio) * 100;
        const bajo = margenPct < 15;
        return (
          <span className={bajo ? "text-xs font-semibold text-destructive" : "text-xs font-semibold text-emerald-600 dark:text-emerald-400"}>
            {margenPct.toFixed(0)}%
          </span>
        );
      },
    },
    {
      key: "undm", priority: "meta", semantic: "code",
      label: "Und.",
      format: (v) => (v as string) || "NIU",
    },
    {
      key: "estado", priority: "secondary", semantic: "badge",
      label: "Estado",
      format: (v) => Number(v) === 1 ? "Activo" : "Inactivo",
    },
    {
      key: "cod_barras", priority: "meta", semantic: "barcode",
      label: "Cód.",
      format: (v) => (v as string) || "—",
    },
    { key: "id_producto", priority: "hidden" },
    { key: "id_marca", priority: "hidden" },
    { key: "id_subcategoria", priority: "hidden" },
  ];

  // ── Rhythm ────────────────────────────────────────────────────
  const getRhythm = (p: Product): RhythmConfig => ({
    type: "dot",
    color: Number(p.estado) === 0 ? "rose" : "emerald",
  });

  // ── Actions ────────────────────────────────────────────────────
  const actions: RecordAction[] = [
    {
      id: "variants", label: "Ver variantes",
      icon: <Eye className="h-3.5 w-3.5" />,
      onClick: (item) => onViewVariants(item as Product),
      variant: "secondary", persistent: false,
    },
    {
      id: "edit", label: "Editar",
      icon: <Edit className="h-3.5 w-3.5" />,
      onClick: (item) => onEdit(item as Product),
      variant: "secondary", persistent: false,
    },
    {
      id: "duplicate", label: "Duplicar",
      icon: <Copy className="h-3.5 w-3.5" />,
      onClick: (item) => duplicateMutation.mutate(item as Product),
      variant: "secondary", persistent: false,
    },
    {
      id: "delete", label: "Eliminar",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: (item) => { setDeletingProduct(item as Product); setIsDeleteOpen(true); },
      variant: "destructive", persistent: false,
    },
  ];

  // ── CSV Export ────────────────────────────────────────────────
  const exportToCSV = () => {
    if (products.length === 0) return;
    const headers = ["ID", "Descripción", "Marca", "Subcategoría", "Precio", "Código de Barras", "Unidad", "Estado"];
    const rows = products.map((p) => [
      p.id_producto,
      `"${(p.descripcion || "").replace(/"/g, '""')}"`,
      p.nom_marca || "",
      p.nom_subcat || "",
      Number(p.precio || 0).toFixed(2),
      p.cod_barras || "",
      p.undm || "NIU",
      p.estado === 1 ? "Activo" : "Inactivo",
    ]);
    const csv = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `inventario_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <AdaptiveCollection<Product>
        title="Productos"
        items={products}
        fields={fields}
        actions={actions}
        layout="auto"
        isLoading={isLoading}
        search={searchTerm}
        searchPlaceholder="Buscar por descripción, ID o código…"
        onSearch={(val) => {
          setSearchTerm(val);
          setPage(1);
        }}
        empty={{
          title: "No se encontraron productos",
          description: searchTerm
            ? `Ningún producto coincide con "${searchTerm}"`
            : "No hay productos registrados en el inventario actual.",
        }}
        getItemId={(p) => p.id_producto}
        getRhythm={getRhythm}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        serverSide={true}
        totalCount={totalCount}
        globalActions={[{
          id: "export", label: "Exportar CSV",
          icon: <Download className="h-4 w-4" />,
          onClick: () => exportToCSV(),
        }]}
      />

      {/* Delete confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={(o) => !o && setIsDeleteOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5 text-destructive/80" />
              ¿Confirmar eliminación?
            </DialogTitle>
            <DialogDescription className="text-sm mt-2">
              ¿Eliminar permanentemente el producto <strong>"{deletingProduct?.descripcion}"</strong>? No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => deletingProduct && deleteMutation.mutate(deletingProduct.id_producto)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar Producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
