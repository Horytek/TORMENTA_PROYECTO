import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { Plus } from "lucide-react";

import { usePermissions } from "@/hooks/usePermissions";
import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/shared/Can";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import type { FieldDef } from "@/components/shared/AdaptiveCollection";

import PurchaseInvoiceFormDialog from "../components/PurchaseInvoiceFormDialog";
import { getPurchaseInvoices } from "../api/purchases";
import type { PurchaseInvoice, EstadoFactura } from "../types";

function formatFecha(fecha: string) {
  try {
    return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return fecha;
  }
}

const ESTADO_LABEL: Record<EstadoFactura, string> = {
  pendiente: "Pendiente",
  pagada: "Pagada",
  anulada: "Anulada",
};

export default function PurchaseInvoicesPage() {
  const { can } = usePermissions();
  const canCreate = can("compras/facturas.create");

  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: facturas = [], isLoading } = useQuery<PurchaseInvoice[]>({
    queryKey: ["purchase-invoices"],
    queryFn: () => getPurchaseInvoices(),
  });

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return facturas;
    return facturas.filter((f) => [f.num_factura, f.proveedor].some((v) => v?.toLowerCase().includes(q)));
  }, [facturas, searchTerm]);

  const fields = useMemo<FieldDef<PurchaseInvoice>[]>(() => [
    {
      key: "num_factura",
      label: "Factura",
      priority: "primary",
      semantic: "title",
      render: (v) => <span className="font-mono font-semibold">{String(v)}</span>,
    },
    {
      key: "proveedor",
      label: "Proveedor",
      priority: "secondary",
      semantic: "subtitle",
      format: (v) => (v as string) || "—",
    },
    {
      key: "fecha_vencimiento",
      label: "Vencimiento",
      priority: "secondary",
      semantic: "text",
      format: (v) => formatFecha(v as string),
    },
    {
      key: "monto_total",
      label: "Monto",
      priority: "secondary",
      semantic: "number",
      format: (v) => `S/ ${Number(v).toFixed(2)}`,
    },
    {
      key: "estado",
      label: "Estado",
      priority: "secondary",
      semantic: "badge",
      format: (v) => ESTADO_LABEL[v as EstadoFactura] ?? String(v),
    },
    { key: "id", priority: "hidden" },
  ], []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Facturas de Compra</h1>
          <p className="text-sm text-muted-foreground">Facturas registradas de proveedores.</p>
        </div>
        <Can capability="compras/facturas.create">
          <Button size="sm" className="h-9 gap-1.5" onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4" /> Registrar factura
          </Button>
        </Can>
      </div>

      <SearchInput
        value={searchTerm}
        onChangeValue={setSearchTerm}
        placeholder="Buscar por número de factura o proveedor…"
        wrapperClassName="w-full max-w-sm"
      />

      <AdaptiveCollection<PurchaseInvoice>
        items={filtered}
        fields={fields}
        isLoading={isLoading}
        layout="auto"
        getItemId={(f) => f.id}
        empty={{
          title: "No hay facturas registradas",
          description: searchTerm ? "Ajusta el término de búsqueda." : "Registra tu primera factura de compra.",
          action: !searchTerm && canCreate ? { label: "Registrar factura", onClick: () => setIsFormOpen(true) } : undefined,
        }}
      />

      <PurchaseInvoiceFormDialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
}
