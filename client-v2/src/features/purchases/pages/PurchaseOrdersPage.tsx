import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { Plus, Building2, Warehouse } from "lucide-react";

import { usePermissions } from "@/hooks/usePermissions";
import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/shared/Can";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection";

import PurchaseOrderFormDialog from "../components/PurchaseOrderFormDialog";
import { PurchaseOrderDetailDrawer } from "../components/PurchaseOrderDetailDrawer";
import {
  getPurchaseOrders,
  approvePurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
} from "../api/purchases";
import type { PurchaseOrder, EstadoOrdenCompra } from "../types";

function formatFecha(fecha: string) {
  try {
    return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return fecha;
  }
}

const ESTADO_LABEL: Record<EstadoOrdenCompra, string> = {
  draft: "Borrador",
  approved: "Aprobada",
  received: "Recibida",
  cancelled: "Cancelada",
};

export default function PurchaseOrdersPage() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const canCreate = can("compras/ordenes.create");
  const canApprove = can("compras/ordenes.edit");
  const canReceive = can("compras/ordenes.generate");
  const canCancel = can("compras/ordenes.delete");

  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<PurchaseOrder | null>(null);

  const { data: ordenes = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ["purchase-orders"],
    queryFn: () => getPurchaseOrders(),
  });

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return ordenes;
    return ordenes.filter((o) => [o.proveedor, o.almacen, o.glosa].some((v) => v?.toLowerCase().includes(q)));
  }, [ordenes, searchTerm]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    queryClient.invalidateQueries({ queryKey: ["purchase-order", selectedId] });
  };

  const approveMutation = useMutation({
    mutationFn: approvePurchaseOrder,
    onSuccess: invalidate,
  });
  const receiveMutation = useMutation({
    mutationFn: receivePurchaseOrder,
    onSuccess: invalidate,
  });
  const cancelMutation = useMutation({
    mutationFn: cancelPurchaseOrder,
    onSuccess: () => {
      invalidate();
      setCancelling(null);
    },
  });

  const isMutating = approveMutation.isPending || receiveMutation.isPending;

  const fields = useMemo<FieldDef<PurchaseOrder>[]>(() => [
    {
      key: "proveedor",
      label: "Proveedor",
      priority: "primary",
      semantic: "title",
      render: (v) => <span className="font-semibold">{String(v || "—")}</span>,
    },
    {
      key: "fecha",
      label: "Fecha",
      priority: "secondary",
      semantic: "subtitle",
      format: (v) => formatFecha(v as string),
    },
    {
      key: "almacen",
      label: "Almacén",
      priority: "secondary",
      semantic: "icon-text",
      render: (v) => (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Warehouse className="h-3.5 w-3.5" /> {String(v || "—")}
        </span>
      ),
    },
    {
      key: "monto_total",
      label: "Monto",
      priority: "secondary",
      semantic: "number",
      format: (v) => (v != null ? `S/ ${Number(v).toFixed(2)}` : "S/ 0.00"),
    },
    {
      key: "estado",
      label: "Estado",
      priority: "secondary",
      semantic: "badge",
      format: (v) => ESTADO_LABEL[v as EstadoOrdenCompra] ?? String(v),
    },
    { key: "id", priority: "hidden" },
  ], []);

  const actions = useMemo<RecordAction[]>(() => [
    {
      id: "cancelar",
      label: "Cancelar orden",
      icon: <Building2 className="h-3.5 w-3.5" />,
      onClick: (item) => setCancelling(item as PurchaseOrder),
      variant: "destructive",
      disabled: (item) => !canCancel || !["draft", "approved"].includes((item as PurchaseOrder).estado),
    },
  ], [canCancel]);

  const getRhythm = (orden: PurchaseOrder) => ({
    type: "dot" as const,
    state: orden.estado === "cancelled" ? ("inactive" as const) : orden.estado === "received" ? ("active" as const) : ("warning" as const),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Órdenes de Compra</h1>
          <p className="text-sm text-muted-foreground">Compromisos con proveedores antes de recibir mercadería.</p>
        </div>
        <Can capability="compras/ordenes.create">
          <Button size="sm" className="h-9 gap-1.5" onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4" /> Nueva orden
          </Button>
        </Can>
      </div>

      <SearchInput
        value={searchTerm}
        onChangeValue={setSearchTerm}
        placeholder="Buscar por proveedor, almacén o concepto…"
        wrapperClassName="w-full max-w-sm"
      />

      <AdaptiveCollection<PurchaseOrder>
        items={filtered}
        fields={fields}
        actions={actions}
        isLoading={isLoading}
        layout="auto"
        getItemId={(o) => o.id}
        getRhythm={getRhythm}
        onRecordClick={(o) => setSelectedId(o.id)}
        empty={{
          title: "No hay órdenes de compra",
          description: searchTerm ? "Ajusta el término de búsqueda." : "Registra tu primera orden de compra.",
          action: !searchTerm && canCreate ? { label: "Nueva orden", onClick: () => setIsFormOpen(true) } : undefined,
        }}
      />

      <PurchaseOrderFormDialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />

      <PurchaseOrderDetailDrawer
        orderId={selectedId}
        onClose={() => setSelectedId(null)}
        canApprove={canApprove}
        canReceive={canReceive}
        canCancel={canCancel}
        onApprove={(id) => approveMutation.mutate(id)}
        onReceive={(id) => receiveMutation.mutate(id)}
        onCancel={(id) => setCancelling(ordenes.find((o) => o.id === id) ?? null)}
        isMutating={isMutating}
      />

      <ConfirmDialog
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        onConfirm={() => cancelling && cancelMutation.mutate(cancelling.id)}
        title="¿Cancelar esta orden de compra?"
        description={
          <>
            Esta acción no se puede deshacer.
            <br />
            <span className="mt-1 inline-block font-medium text-foreground">{cancelling?.proveedor ?? ""}</span>
          </>
        }
        confirmLabel="Cancelar orden"
        variant="danger"
        isPending={cancelMutation.isPending}
      />
    </div>
  );
}
