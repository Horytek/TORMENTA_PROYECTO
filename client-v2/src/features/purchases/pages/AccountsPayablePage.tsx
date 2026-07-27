import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { Wallet } from "lucide-react";

import { usePermissions } from "@/hooks/usePermissions";
import { SearchInput } from "@/components/shared/SearchInput";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection";

import RegisterPaymentDialog from "../components/RegisterPaymentDialog";
import { getAccountsPayable } from "../api/purchases";
import type { AccountPayable, EstadoCuentaPorPagar } from "../types";

function formatFecha(fecha: string) {
  try {
    return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return fecha;
  }
}

const ESTADO_LABEL: Record<EstadoCuentaPorPagar, string> = {
  pendiente: "Pendiente",
  pagada_parcial: "Pago parcial",
  pagada: "Pagada",
  vencida: "Vencida",
};

export default function AccountsPayablePage() {
  const { can } = usePermissions();
  const canRegisterPayment = can("compras/cuentas-por-pagar.generate");

  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [pagando, setPagando] = useState<AccountPayable | null>(null);

  const { data: cuentas = [], isLoading } = useQuery<AccountPayable[]>({
    queryKey: ["accounts-payable"],
    queryFn: () => getAccountsPayable(),
  });

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return cuentas;
    return cuentas.filter((c) => [c.num_factura, c.proveedor].some((v) => v?.toLowerCase().includes(q)));
  }, [cuentas, searchTerm]);

  const fields = useMemo<FieldDef<AccountPayable>[]>(() => [
    {
      key: "proveedor",
      label: "Proveedor",
      priority: "primary",
      semantic: "title",
      render: (v) => <span className="font-semibold">{String(v || "—")}</span>,
    },
    {
      key: "num_factura",
      label: "Factura",
      priority: "secondary",
      semantic: "code",
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
      key: "saldo",
      label: "Saldo",
      priority: "secondary",
      semantic: "number",
      render: (v, item) => (
        <span className="text-sm">
          <span className="font-semibold text-foreground">S/ {Number(v).toFixed(2)}</span>
          <span className="text-xs text-muted-foreground"> / S/ {Number(item.monto_total).toFixed(2)}</span>
        </span>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      priority: "secondary",
      semantic: "badge",
      format: (v) => ESTADO_LABEL[v as EstadoCuentaPorPagar] ?? String(v),
    },
    { key: "id", priority: "hidden" },
  ], []);

  const actions = useMemo<RecordAction[]>(() => [
    {
      id: "pagar",
      label: "Registrar pago",
      icon: <Wallet className="h-3.5 w-3.5" />,
      onClick: (item) => setPagando(item as AccountPayable),
      disabled: (item) => !canRegisterPayment || (item as AccountPayable).estado === "pagada",
    },
  ], [canRegisterPayment]);

  const getRhythm = (cuenta: AccountPayable) => ({
    type: "dot" as const,
    state:
      cuenta.estado === "pagada" ? ("active" as const) :
      cuenta.estado === "vencida" ? ("error" as const) :
      ("warning" as const),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Cuentas por Pagar</h1>
        <p className="text-sm text-muted-foreground">Saldos pendientes con proveedores.</p>
      </div>

      <SearchInput
        value={searchTerm}
        onChangeValue={setSearchTerm}
        placeholder="Buscar por factura o proveedor…"
        wrapperClassName="w-full max-w-sm"
      />

      <AdaptiveCollection<AccountPayable>
        items={filtered}
        fields={fields}
        actions={actions}
        isLoading={isLoading}
        layout="auto"
        getItemId={(c) => c.id}
        getRhythm={getRhythm}
        empty={{
          title: "No hay cuentas por pagar",
          description: "Las cuentas por pagar se generan automáticamente al registrar una factura de compra.",
        }}
      />

      <RegisterPaymentDialog cuenta={pagando} onClose={() => setPagando(null)} />
    </div>
  );
}
