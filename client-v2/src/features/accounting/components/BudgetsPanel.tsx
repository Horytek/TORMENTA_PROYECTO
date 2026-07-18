import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { getPresupuestos, savePresupuesto, deletePresupuesto, getCuentasContables, getCentrosCosto } from "../api/accounting";
import type { Presupuesto, PresupuestoInput } from "../types";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function BudgetsPanel() {
  const queryClient = useQueryClient();
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Presupuesto | null>(null);

  const { data: presupuestos = [], isLoading } = useQuery({ queryKey: ["presupuestos", anio], queryFn: () => getPresupuestos({ anio }) });
  const { data: cuentas = [] } = useQuery({ queryKey: ["cuentas-contables"], queryFn: getCuentasContables });
  const { data: centros = [] } = useQuery({ queryKey: ["centros-costo"], queryFn: getCentrosCosto });

  const { register, handleSubmit, control, reset } = useForm<PresupuestoInput>({
    defaultValues: { id_cuenta: 0, id_centro_costo: null, anio, mes: null, monto_presupuestado: 0 },
  });

  const saveMutation = useMutation({
    mutationFn: (v: PresupuestoInput) => savePresupuesto(v),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presupuestos"] });
      reset({ id_cuenta: 0, id_centro_costo: null, anio, mes: null, monto_presupuestado: 0 });
      setIsFormOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePresupuesto(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["presupuestos"] }); setDeleting(null); },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Año</label>
          <Input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="h-9 w-28" />
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="ml-auto gap-2"><Plus className="h-4 w-4" /> Nuevo presupuesto</Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cuenta</TableHead>
              <TableHead>Centro de costo</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead className="text-right">Presupuestado</TableHead>
              <TableHead className="text-right">Ejecutado</TableHead>
              <TableHead className="text-right">Disponible</TableHead>
              <TableHead className="w-32">Avance</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : presupuestos.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Sin presupuestos definidos para {anio}.</TableCell></TableRow>
            ) : (
              presupuestos.map((p) => {
                const excedido = p.porcentaje > 100;
                return (
                  <TableRow key={p.id_presupuesto}>
                    <TableCell className="text-muted-foreground">{p.cuenta_codigo} — {p.cuenta_nombre}</TableCell>
                    <TableCell className="text-muted-foreground">{p.centro_costo_nombre || "—"}</TableCell>
                    <TableCell>{p.mes ? MESES[p.mes - 1] : "Anual"}</TableCell>
                    <TableCell className="num text-right">S/ {Number(p.monto_presupuestado).toFixed(2)}</TableCell>
                    <TableCell className="num text-right">S/ {p.ejecutado.toFixed(2)}</TableCell>
                    <TableCell className={`num text-right ${p.disponible < 0 ? "text-destructive" : ""}`}>S/ {p.disponible.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${excedido ? "bg-destructive" : "bg-primary"}`}
                            style={{ width: `${Math.min(Math.max(p.porcentaje, 0), 100)}%` }}
                          />
                        </div>
                        {excedido && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />}
                        <span className="num text-xs text-muted-foreground w-10 shrink-0 text-right">{p.porcentaje}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleting(p)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <FormDialog
        open={isFormOpen} onClose={() => { reset(); setIsFormOpen(false); }}
        title="Nuevo presupuesto" submitLabel="Guardar"
        isSubmitting={saveMutation.isPending}
        error={saveMutation.isError ? "No se pudo guardar el presupuesto." : null}
        onSubmit={handleSubmit((v) => saveMutation.mutate({ ...v, anio: Number(v.anio), monto_presupuestado: Number(v.monto_presupuestado) }))}
      >
        <FormField label="Cuenta">
          <Controller control={control} name="id_cuenta" rules={{ validate: (v) => Number(v) > 0 }} render={({ field }) => (
            <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
              <SelectTrigger><SelectValue placeholder="Selecciona una cuenta..." /></SelectTrigger>
              <SelectContent>
                {cuentas.filter((c) => c.es_presupuestable === 1).map((c) => (
                  <SelectItem key={c.id_cuenta} value={String(c.id_cuenta)}>{c.codigo} — {c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </FormField>

        <FormField label="Centro de costo (opcional)">
          <Controller control={control} name="id_centro_costo" render={({ field }) => (
            <Select value={field.value ? String(field.value) : "none"} onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Toda la empresa</SelectItem>
                {centros.map((c) => <SelectItem key={c.id_centro_costo} value={String(c.id_centro_costo)}>{c.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Año" htmlFor="pres-anio">
            <Input id="pres-anio" type="number" {...register("anio", { required: true, valueAsNumber: true })} />
          </FormField>
          <FormField label="Mes (vacío = anual)">
            <Controller control={control} name="mes" render={({ field }) => (
              <Select value={field.value ? String(field.value) : "none"} onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Anual</SelectItem>
                  {MESES.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </FormField>
        </div>

        <FormField label="Monto presupuestado (S/.)" htmlFor="pres-monto">
          <Input id="pres-monto" type="number" step="0.01" min="0.01" {...register("monto_presupuestado", { required: true, valueAsNumber: true, min: 0.01 })} />
        </FormField>
      </FormDialog>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="¿Eliminar presupuesto?"
        description={`Se eliminará el presupuesto de "${deleting?.cuenta_nombre}".`}
        confirmLabel="Eliminar"
        variant="danger"
        isPending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id_presupuesto)}
      />
    </div>
  );
}
