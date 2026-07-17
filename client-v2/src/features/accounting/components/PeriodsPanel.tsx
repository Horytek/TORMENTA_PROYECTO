import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Lock, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { getPeriodosContables, crearSiguientePeriodo, cerrarPeriodo, reabrirPeriodo } from "../api/accounting";
import type { PeriodoContable } from "../types";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const ESTADO_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  abierto: "default",
  cerrado: "secondary",
  bloqueado: "outline",
};

export function PeriodsPanel() {
  const queryClient = useQueryClient();
  const [cerrando, setCerrando] = useState<PeriodoContable | null>(null);
  const [reabriendo, setReabriendo] = useState<PeriodoContable | null>(null);
  const [motivo, setMotivo] = useState("");

  const { data: periodos = [], isLoading } = useQuery({ queryKey: ["periodos-contables"], queryFn: getPeriodosContables });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["periodos-contables"] });

  const crearMutation = useMutation({ mutationFn: crearSiguientePeriodo, onSuccess: invalidate });
  const cerrarMutation = useMutation({
    mutationFn: (id: number) => cerrarPeriodo(id),
    onSuccess: () => { invalidate(); setCerrando(null); },
  });
  const reabrirMutation = useMutation({
    mutationFn: () => reabrirPeriodo(reabriendo!.id_periodo, motivo),
    onSuccess: () => { invalidate(); setReabriendo(null); setMotivo(""); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Un periodo cerrado bloquea la creación de nuevos asientos con fecha dentro de él.</p>
        <Button onClick={() => crearMutation.mutate()} disabled={crearMutation.isPending} className="gap-2">
          <Plus className="h-4 w-4" /> Abrir siguiente periodo
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Periodo</TableHead>
              <TableHead>Rango</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Motivo de reapertura</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : periodos.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sin periodos contables aún.</TableCell></TableRow>
            ) : (
              periodos.map((p) => (
                <TableRow key={p.id_periodo}>
                  <TableCell className="font-medium">{MESES[p.mes - 1]} {p.anio}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{p.fecha_inicio} — {p.fecha_fin}</TableCell>
                  <TableCell><Badge variant={ESTADO_VARIANT[p.estado]}>{p.estado}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{p.motivo_reapertura || "—"}</TableCell>
                  <TableCell className="text-right">
                    {p.estado === "abierto" && (
                      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setCerrando(p)}>
                        <Lock className="h-3.5 w-3.5" /> Cerrar
                      </Button>
                    )}
                    {p.estado === "cerrado" && (
                      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setReabriendo(p)}>
                        <LockOpen className="h-3.5 w-3.5" /> Reabrir
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!cerrando}
        onClose={() => setCerrando(null)}
        title="¿Cerrar periodo?"
        description={`No se podrán crear nuevos asientos con fecha dentro de ${cerrando ? `${MESES[cerrando.mes - 1]} ${cerrando.anio}` : ""}.`}
        confirmLabel="Cerrar periodo"
        variant="danger"
        isPending={cerrarMutation.isPending}
        onConfirm={() => cerrando && cerrarMutation.mutate(cerrando.id_periodo)}
      />

      <FormDialog
        open={!!reabriendo}
        onClose={() => { setReabriendo(null); setMotivo(""); }}
        title="Reabrir periodo cerrado"
        description={`Reabrir ${reabriendo ? `${MESES[reabriendo.mes - 1]} ${reabriendo.anio}` : ""} queda registrado en auditoría.`}
        submitLabel="Reabrir"
        isSubmitting={reabrirMutation.isPending}
        onSubmit={(e) => { e.preventDefault(); if (motivo.trim()) reabrirMutation.mutate(); }}
      >
        <FormField label="Motivo de la reapertura" htmlFor="periodo-motivo">
          <Input
            id="periodo-motivo"
            placeholder="Ej: Corrección de asiento de depreciación"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </FormField>
      </FormDialog>
    </div>
  );
}
