import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection";
import { getAsientos, revertirAsiento } from "../api/accounting";
import type { AsientoContable } from "../types";
import { JournalEntryForm } from "./JournalEntryForm";

const firstDayOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const todayIso = () => new Date().toISOString().slice(0, 10);

const ESTADO_LABEL: Record<string, string> = {
  contabilizado: "Contabilizado",
  anulado: "Anulado",
  revertido: "Revertido",
};

export function JournalEntriesPanel() {
  const queryClient = useQueryClient();
  const [fechaInicio, setFechaInicio] = useState(firstDayOfMonth());
  const [fechaFin, setFechaFin] = useState(todayIso());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reverting, setReverting] = useState<AsientoContable | null>(null);

  const { data: asientos = [], isLoading } = useQuery({
    queryKey: ["asientos", fechaInicio, fechaFin],
    queryFn: () => getAsientos({ fechaInicio, fechaFin }),
  });

  const revertMutation = useMutation({
    mutationFn: (id: number) => revertirAsiento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asientos"] });
      queryClient.invalidateQueries({ queryKey: ["libro-diario"] });
      queryClient.invalidateQueries({ queryKey: ["libro-mayor"] });
      setReverting(null);
    },
  });

  const fields: FieldDef<AsientoContable>[] = [
    { key: "descripcion", priority: "primary", semantic: "title", label: "Descripción" },
    { key: "numero", priority: "secondary", semantic: "chip", label: "N°", format: (v) => `#${v}` },
    { key: "fecha", priority: "meta", semantic: "date", label: "Fecha" },
    {
      key: "estado", priority: "secondary", semantic: "badge", label: "Estado",
      format: (v) => ESTADO_LABEL[String(v)] || String(v),
    },
    { key: "total", priority: "secondary", semantic: "number", label: "Total", format: (v) => `S/ ${Number(v).toFixed(2)}` },
  ];

  const actions: RecordAction[] = [
    {
      id: "revertir", label: "Revertir",
      icon: <RotateCcw className="h-3.5 w-3.5" />,
      onClick: (item) => setReverting(item as AsientoContable),
      hidden: (item) => (item as AsientoContable).estado !== "contabilizado",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Desde</label>
          <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="h-9" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Hasta</label>
          <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="h-9" />
        </div>
        <Badge variant="outline" className="ml-auto">{asientos.length} asiento(s)</Badge>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo asiento
        </Button>
      </div>

      <AdaptiveCollection<AsientoContable>
        items={asientos}
        fields={fields}
        actions={actions}
        layout="list"
        isLoading={isLoading}
        getItemId={(a) => a.id_asiento}
        empty={{ title: "Sin asientos en el período", description: "Registra el primer asiento contable." }}
      />

      {isFormOpen && <JournalEntryForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />}

      <ConfirmDialog
        open={!!reverting}
        onClose={() => setReverting(null)}
        title="¿Revertir asiento?"
        description={`Se creará un asiento de reversión para "#${reverting?.numero} — ${reverting?.descripcion}" en el periodo abierto actual. El asiento original quedará marcado como revertido.`}
        confirmLabel="Revertir"
        variant="danger"
        isPending={revertMutation.isPending}
        onConfirm={() => reverting && revertMutation.mutate(reverting.id_asiento)}
      />
    </div>
  );
}
