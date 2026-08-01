import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { Plus, HandCoins } from "lucide-react";

import { usePermissions } from "@/hooks/usePermissions";
import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/shared/Can";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection";

import AdvanceFormDialog from "../components/AdvanceFormDialog";
import ApplyAdvanceDialog from "../components/ApplyAdvanceDialog";
import { getSupplierAdvances } from "../api/purchases";
import type { SupplierAdvance, EstadoAnticipo } from "../types";

function formatFecha(fecha: string) {
  try {
    return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return fecha;
  }
}

const ESTADO_LABEL: Record<EstadoAnticipo, string> = {
  disponible: "Disponible",
  aplicado: "Aplicado",
  anulado: "Anulado",
};

export default function AdvancesPage() {
  const { can } = usePermissions();
  const canCreate = can("compras/anticipos.create");
  const canApply = can("compras/anticipos.generate");

  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [aplicando, setAplicando] = useState<SupplierAdvance | null>(null);

  const { data: anticipos = [], isLoading } = useQuery<SupplierAdvance[]>({
    queryKey: ["supplier-advances"],
    queryFn: () => getSupplierAdvances(),
  });

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return anticipos;
    return anticipos.filter((a) => [a.proveedor, a.referencia].some((v) => v?.toLowerCase().includes(q)));
  }, [anticipos, searchTerm]);

  const fields = useMemo<FieldDef<SupplierAdvance>[]>(() => [
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
      key: "saldo_disponible",
      label: "Saldo",
      priority: "secondary",
      semantic: "number",
      render: (v, item) => (
        <span className="text-sm">
          <span className="font-semibold text-foreground">S/ {Number(v).toFixed(2)}</span>
          <span className="text-xs text-muted-foreground"> / S/ {Number(item.monto).toFixed(2)}</span>
        </span>
      ),
    },
    {
      key: "medio_pago",
      label: "Medio de pago",
      priority: "secondary",
      semantic: "text",
    },
    {
      key: "estado",
      label: "Estado",
      priority: "secondary",
      semantic: "badge",
      format: (v) => ESTADO_LABEL[v as EstadoAnticipo] ?? String(v),
    },
    { key: "id", priority: "hidden" },
  ], []);

  const actions = useMemo<RecordAction[]>(() => [
    {
      id: "aplicar",
      label: "Aplicar a cuenta por pagar",
      icon: <HandCoins className="h-3.5 w-3.5" />,
      onClick: (item) => setAplicando(item as SupplierAdvance),
      disabled: (item) => !canApply || (item as SupplierAdvance).estado !== "disponible",
    },
  ], [canApply]);

  const getRhythm = (anticipo: SupplierAdvance) => ({
    type: "dot" as const,
    state:
      anticipo.estado === "aplicado" ? ("active" as const) :
      anticipo.estado === "anulado" ? ("inactive" as const) :
      ("warning" as const),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Anticipos a Proveedor</h1>
          <p className="text-sm text-muted-foreground">Dinero entregado antes de recibir la factura; se aplica luego contra la cuenta por pagar.</p>
        </div>
        <Can capability="compras/anticipos.create">
          <Button size="sm" className="h-9 gap-1.5" onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4" /> Nuevo anticipo
          </Button>
        </Can>
      </div>

      <SearchInput
        value={searchTerm}
        onChangeValue={setSearchTerm}
        placeholder="Buscar por proveedor o referencia…"
        wrapperClassName="w-full max-w-sm"
      />

      <AdaptiveCollection<SupplierAdvance>
        items={filtered}
        fields={fields}
        actions={actions}
        isLoading={isLoading}
        layout="auto"
        getItemId={(a) => a.id}
        getRhythm={getRhythm}
        empty={{
          title: "No hay anticipos registrados",
          description: searchTerm ? "Ajusta el término de búsqueda." : "Registra tu primer anticipo a un proveedor.",
          action: !searchTerm && canCreate ? { label: "Nuevo anticipo", onClick: () => setIsFormOpen(true) } : undefined,
        }}
      />

      <AdvanceFormDialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
      <ApplyAdvanceDialog anticipo={aplicando} onClose={() => setAplicando(null)} />
    </div>
  );
}
