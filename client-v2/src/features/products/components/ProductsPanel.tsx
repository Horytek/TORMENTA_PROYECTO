import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import * as XLSX from "xlsx";
import type { Product } from "../types";
import { getProducts, deleteProduct, createProduct, updateProduct } from "../api/products";
import { useUserStore } from "@/store/useUserStore";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import type { FieldDef, RecordAction, RhythmConfig } from "@/components/shared/AdaptiveCollection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { ShieldAlert, Loader2, Eye, Edit, Trash2, Download, Copy, Coins, CheckCircle2, Ban, Wand2 } from "lucide-react";
import { cargarCostosIniciales, parseErrorCosto } from "@/features/costos/api/costos";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import BatchOperationWizard from "./BatchOperationWizard";

interface ProductsPanelProps {
  onEdit: (product: Product) => void;
  onViewVariants: (product: Product) => void;
}

export default function ProductsPanel({ onEdit, onViewVariants }: ProductsPanelProps) {
  const queryClient = useQueryClient();

  const [activeTab] = useQueryState("tab", parseAsString.withDefault("productos"));
  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [bajoStock, setBajoStock] = useQueryState("bajo_stock", parseAsString.withDefault(""));
  const [page, setPage] = useState(1);
  const LIMIT = 12;

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [editingCost, setEditingCost] = useState<Product | null>(null);
  const [costoInput, setCostoInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [batchWizardOpen, setBatchWizardOpen] = useState(false);

  const { data = { data: [], total: 0, totalPages: 1 }, isLoading } = useQuery({
    queryKey: ["products", page, searchTerm, bajoStock],
    queryFn: () => getProducts({ page, limit: LIMIT, q: searchTerm, bajoStock: bajoStock === "1" }),
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

  // Reusa el mismo endpoint de "carga inicial de costos" (costos.controller.js):
  // aplica el costo a todos los SKUs del producto por igual (talla/color de
  // una misma prenda cuestan lo mismo) y deja `costo_estimado=1` para
  // trazabilidad. `forzar: true` porque acá la intención es corregir un costo
  // que ya existe, no la carga inicial que por defecto no pisa lo cargado.
  const editCostMutation = useMutation({
    mutationFn: ({ id_producto, costo }: { id_producto: number; costo: number }) =>
      cargarCostosIniciales([{ id_producto, costo }], true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditingCost(null);
    },
  });

  // No hay endpoint batch en el backend (updateProducto exige el producto
  // completo, no un PATCH parcial) — se reusa el mismo endpoint de edición
  // individual en paralelo, tomando los datos ya cargados en esta página.
  const bulkSetEstadoMutation = useMutation({
    mutationFn: async ({ ids, estado }: { ids: (string | number)[]; estado: number }) => {
      const targets = products.filter((p) => ids.includes(p.id_producto));
      await Promise.all(targets.map((p) => {
        const { id_producto, nom_marca, nom_subcat, costo_promedio, ...rest } = p;
        void id_producto; void nom_marca; void nom_subcat; void costo_promedio;
        return updateProduct(p.id_producto, { ...rest, estado_producto: estado });
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSelectedIds([]);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: (string | number)[]) => {
      await Promise.all(ids.map((id) => deleteProduct(Number(id))));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSelectedIds([]);
      setConfirmBulkDelete(false);
    },
  });

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
      key: "stock_total", priority: "secondary", label: "Stock",
      render: (_v, item) => {
        const stock = Number(item.stock_total ?? 0);
        const umbral = item.stock_min != null ? Number(item.stock_min) : 0;
        const bajo = stock <= umbral;
        return (
          <span className={bajo ? "text-xs font-semibold text-destructive" : "text-xs font-semibold text-foreground"}>
            {stock} {bajo && "⚠"}
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
      id: "edit-cost", label: "Editar costo",
      icon: <Coins className="h-3.5 w-3.5" />,
      onClick: (item) => {
        const p = item as Product;
        setEditingCost(p);
        setCostoInput(p.costo_promedio != null ? String(p.costo_promedio) : "");
      },
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

  // Mismas columnas que espera ImportProductsDialog.tsx (descripcion, marca,
  // subcategoria, undm, precio, cod_barras): así el archivo que sale de acá
  // se puede editar y volver a subir tal cual, a diferencia del CSV de arriba
  // (pensado para revisar en una hoja de cálculo, no para reimportar).
  const exportToExcel = () => {
    if (products.length === 0) return;
    const rows = products.map((p) => ({
      descripcion: p.descripcion,
      marca: p.nom_marca || "",
      subcategoria: p.nom_subcat || "",
      undm: p.undm || "NIU",
      precio: Number(p.precio || 0),
      cod_barras: p.cod_barras || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");
    XLSX.writeFile(wb, `productos_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <>
      {/* Editar costo promedio */}
      <Dialog open={!!editingCost} onOpenChange={(o) => !o && setEditingCost(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Corregir costo</DialogTitle>
            <DialogDescription>
              Se aplica por igual a todas las variantes (tallas/colores) de <strong>{editingCost?.descripcion}</strong>. No cambia el margen de ventas ya registradas — esas quedan con el costo que tenían al momento de vender.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Costo unitario (S/)</label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={costoInput}
              onChange={(e) => setCostoInput(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>
          {editCostMutation.isError && (
            <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {parseErrorCosto(editCostMutation.error)}
            </p>
          )}
          <DialogFooter className="mt-2 flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setEditingCost(null)} disabled={editCostMutation.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => editingCost && Number(costoInput) >= 0 && costoInput !== "" &&
                editCostMutation.mutate({ id_producto: editingCost.id_producto, costo: Number(costoInput) })}
              disabled={editCostMutation.isPending || costoInput === "" || Number(costoInput) < 0}
            >
              {editCostMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar costo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        filters={[
          {
            id: "bajo_stock",
            label: "Stock",
            value: bajoStock,
            onChange: (v) => { setBajoStock(v); setPage(1); },
            options: [
              { value: "", label: "Todos" },
              { value: "1", label: "⚠ Bajo stock mínimo" },
            ],
          },
        ]}
        empty={{
          title: bajoStock === "1" ? "Ningún producto está bajo su stock mínimo" : "No se encontraron productos",
          description: searchTerm
            ? `Ningún producto coincide con "${searchTerm}"`
            : bajoStock === "1"
            ? "Todos los productos con stock mínimo configurado están por encima de ese umbral."
            : "No hay productos registrados en el inventario actual.",
        }}
        getItemId={(p) => p.id_producto}
        getRhythm={getRhythm}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        serverSide={true}
        totalCount={totalCount}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        globalActions={[
          {
            id: "bulk-activate", label: "Activar",
            icon: <CheckCircle2 className="h-4 w-4" />,
            disabled: selectedIds.length === 0 || bulkSetEstadoMutation.isPending,
            onClick: (ids) => bulkSetEstadoMutation.mutate({ ids, estado: 1 }),
          },
          {
            id: "bulk-deactivate", label: "Desactivar",
            icon: <Ban className="h-4 w-4" />,
            disabled: selectedIds.length === 0 || bulkSetEstadoMutation.isPending,
            onClick: (ids) => bulkSetEstadoMutation.mutate({ ids, estado: 0 }),
          },
          {
            id: "bulk-delete", label: "Eliminar",
            icon: <Trash2 className="h-4 w-4" />,
            disabled: selectedIds.length === 0,
            onClick: () => setConfirmBulkDelete(true),
          },
          {
            id: "batch-wizard", label: "Operación en lote…",
            icon: <Wand2 className="h-4 w-4" />,
            disabled: selectedIds.length === 0,
            onClick: () => setBatchWizardOpen(true),
          },
          {
            id: "export", label: "Exportar CSV",
            icon: <Download className="h-4 w-4" />,
            onClick: () => exportToCSV(),
          },
          {
            id: "export-excel", label: "Exportar Excel (reimportable)",
            icon: <Download className="h-4 w-4" />,
            onClick: () => exportToExcel(),
          },
        ]}
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

      <ConfirmDialog
        open={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={() => bulkDeleteMutation.mutate(selectedIds)}
        title={`¿Eliminar ${selectedIds.length} producto(s)?`}
        description="Esta acción es permanente y no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        isPending={bulkDeleteMutation.isPending}
      />

      <BatchOperationWizard
        open={batchWizardOpen}
        onClose={() => setBatchWizardOpen(false)}
        products={products.filter((p) => selectedIds.includes(p.id_producto))}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["products"] });
          setSelectedIds([]);
        }}
      />
    </>
  );
}
