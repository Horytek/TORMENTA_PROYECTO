import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Eye } from "lucide-react";
import api from "@/api/axios";
import { mapBackendVenta } from "@/features/sales/types";
import type { Venta } from "@/features/sales/types";
import { getVentaById } from "@/features/sales/api/ventas";
import { VoucherPreview } from "@/features/sales/components/shared/VoucherPreview";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection";

interface RecentTransactionsTableProps {
  className?: string;
}

export function RecentTransactionsTable({ className }: RecentTransactionsTableProps) {
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: transactions = [], isLoading } = useQuery<Venta[]>({
    queryKey: ["dashboard-recent-sales"],
    queryFn: async () => {
      const res = await api.get("/ventas", { params: { limit: 5, page: 1 } });
      const raw: unknown[] = res.data?.data || res.data || [];
      return raw.map((v) => mapBackendVenta(v as Record<string, unknown>));
    },
  });

  const handleOpenPreview = async (venta: Venta) => {
    if (!venta.id_venta) return;
    const fullVenta = await getVentaById(venta.id_venta);
    setSelectedVenta(fullVenta);
    setIsPreviewOpen(true);
  };

  const fields: FieldDef<Venta>[] = [
    { key: "num_comprobante", priority: "primary", semantic: "title", label: "Comprobante", format: (v) => (v as string) || "S/N" },
    { key: "id_comprobante", priority: "secondary", semantic: "chip", label: "Tipo" },
    { key: "nom_cliente", priority: "secondary", semantic: "subtitle", label: "Cliente", format: (v) => (v as string) || "Consumidor Final" },
    { key: "f_venta", priority: "meta", semantic: "date", label: "Fecha" },
    { key: "total_t", priority: "secondary", semantic: "number", label: "Total", format: (v) => `S/ ${Number(v ?? 0).toFixed(2)}` },
  ];

  const actions: RecordAction[] = [
    {
      id: "view", label: "Ver comprobante",
      icon: <Eye className="h-3.5 w-3.5" />,
      onClick: (item) => handleOpenPreview(item as Venta),
    },
  ];

  return (
    <Card className={`border border-border shadow-sm rounded-xl overflow-hidden flex flex-col ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <CardTitle className="text-sm font-bold uppercase tracking-wide text-foreground">
            Comprobantes Recientes
          </CardTitle>
          <p className="text-[10px] text-muted-foreground font-medium">Últimos movimientos registrados</p>
        </div>
        <a
          href="/reports/sales"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Historial completo
          <ArrowRight className="h-3 w-3" />
        </a>
      </CardHeader>

      <CardContent className="px-4 py-4 flex-1">
        <AdaptiveCollection<Venta>
          items={transactions}
          fields={fields}
          actions={actions}
          layout="list"
          isLoading={isLoading}
          getItemId={(v) => v.id_venta ?? v.id ?? Math.random()}
          empty={{ title: "Sin comprobantes recientes", description: "Aún no hay ventas registradas." }}
        />
      </CardContent>

      {selectedVenta && (
        <VoucherPreview
          open={isPreviewOpen}
          venta={selectedVenta}
          onClose={() => {
            setIsPreviewOpen(false);
            setSelectedVenta(null);
          }}
        />
      )}
    </Card>
  );
}
