import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AdaptiveCollection } from "@/components/shared/AdaptiveCollection";
import type { FieldDef, RecordAction } from "@/components/shared/AdaptiveCollection";
import { getExpenses, deleteExpense } from "../api/accounting";
import type { Expense } from "../types";
import { ExpenseForm } from "./ExpenseForm";

const firstDayOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const todayIso = () => new Date().toISOString().slice(0, 10);

export function ExpensesPanel() {
  const queryClient = useQueryClient();
  const [fechaInicio, setFechaInicio] = useState(firstDayOfMonth());
  const [fechaFin, setFechaFin] = useState(todayIso());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses", fechaInicio, fechaFin],
    queryFn: () => getExpenses({ fechaInicio, fechaFin }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses-pl"] });
      setDeleting(null);
    },
  });

  const fields: FieldDef<Expense>[] = [
    { key: "descripcion", priority: "primary", semantic: "title", label: "Descripción" },
    { key: "categoria", priority: "secondary", semantic: "chip", label: "Categoría" },
    { key: "fecha", priority: "meta", semantic: "date", label: "Fecha" },
    {
      key: "monto", priority: "secondary", semantic: "number", label: "Monto",
      format: (v) => `S/ ${Number(v).toFixed(2)}`,
    },
  ];

  const actions: RecordAction[] = [
    {
      id: "delete", label: "Eliminar",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: (item) => setDeleting(item as Expense),
      variant: "destructive",
    },
  ];

  const total = expenses.reduce((sum, e) => sum + Number(e.monto), 0);

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
        <div className="ml-auto text-right">
          <p className="text-xs text-muted-foreground">Total del período</p>
          <p className="num text-lg font-bold text-foreground">S/ {total.toFixed(2)}</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo gasto
        </Button>
      </div>

      <AdaptiveCollection<Expense>
        items={expenses}
        fields={fields}
        actions={actions}
        layout="list"
        isLoading={isLoading}
        getItemId={(e) => e.id_gasto}
        empty={{ title: "Sin gastos registrados", description: "Registra el primer gasto del período seleccionado." }}
      />

      {isFormOpen && <ExpenseForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="¿Eliminar gasto?"
        description={`Se eliminará "${deleting?.descripcion}". Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        isPending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id_gasto)}
      />
    </div>
  );
}
