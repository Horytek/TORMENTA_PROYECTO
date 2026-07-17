import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  getCuentasTesoreria, createCuentaTesoreria, getMovimientosTesoreria, createMovimientoTesoreria,
  conciliarMovimientoTesoreria, getCierresCaja, cerrarCaja, getCuentasContables,
} from "../api/accounting";
import type { CuentaTesoreriaInput, MovimientoTesoreriaInput, TipoCuentaTesoreria, TipoMovimientoTesoreria } from "../types";

const TIPOS_MOVIMIENTO: { value: TipoMovimientoTesoreria; label: string }[] = [
  { value: "deposito", label: "Depósito" },
  { value: "retiro", label: "Retiro" },
  { value: "transferencia_entrada", label: "Transferencia (entrada)" },
  { value: "transferencia_salida", label: "Transferencia (salida)" },
  { value: "ajuste", label: "Ajuste" },
];

const todayIso = () => new Date().toISOString().slice(0, 10);

function TreasuryAccountsSection() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: cuentas = [], isLoading } = useQuery({ queryKey: ["cuentas-tesoreria"], queryFn: getCuentasTesoreria });
  const { data: cuentasContables = [] } = useQuery({ queryKey: ["cuentas-contables"], queryFn: getCuentasContables });

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<CuentaTesoreriaInput>({
    defaultValues: { tipo: "caja", nombre: "", numero_cuenta: "", id_cuenta_contable: 0 },
  });

  const mutation = useMutation({
    mutationFn: (v: CuentaTesoreriaInput) => createCuentaTesoreria(v),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cuentas-tesoreria"] }); reset(); setIsFormOpen(false); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Cajas y cuentas bancarias, cada una ligada a una cuenta contable del plan de cuentas.</p>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Nueva cuenta</Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cuenta contable</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : cuentas.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sin cajas ni cuentas bancarias registradas.</TableCell></TableRow>
            ) : (
              cuentas.map((c) => (
                <TableRow key={c.id_cuenta_tesoreria}>
                  <TableCell className="font-medium">{c.nombre}{c.numero_cuenta ? ` (${c.numero_cuenta})` : ""}</TableCell>
                  <TableCell><Badge variant="outline">{c.tipo}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{c.cuenta_codigo} — {c.cuenta_nombre}</TableCell>
                  <TableCell className="num text-right font-medium">S/ {Number(c.saldo).toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <FormDialog
        open={isFormOpen} onClose={() => { reset(); setIsFormOpen(false); }}
        title="Nueva cuenta de tesorería" submitLabel="Guardar"
        isSubmitting={mutation.isPending}
        error={mutation.isError ? "No se pudo crear la cuenta." : null}
        onSubmit={handleSubmit((v) => mutation.mutate(v))}
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Tipo">
            <Controller control={control} name="tipo" render={({ field }) => (
              <Select value={field.value} onValueChange={(v) => field.onChange(v as TipoCuentaTesoreria)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="caja">Caja</SelectItem>
                  <SelectItem value="banco">Banco</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </FormField>
          <FormField label="N° de cuenta (opcional)" htmlFor="tes-numero">
            <Input id="tes-numero" {...register("numero_cuenta")} />
          </FormField>
        </div>
        <FormField label="Nombre" htmlFor="tes-nombre" error={errors.nombre?.message}>
          <Input id="tes-nombre" placeholder="Ej: Caja Sucursal Central" {...register("nombre", { required: "El nombre es obligatorio" })} />
        </FormField>
        <FormField label="Cuenta contable">
          <Controller control={control} name="id_cuenta_contable" rules={{ validate: (v) => Number(v) > 0 }} render={({ field }) => (
            <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
              <SelectTrigger><SelectValue placeholder="Selecciona una cuenta..." /></SelectTrigger>
              <SelectContent>
                {cuentasContables.filter((c) => c.permite_movimiento === 1).map((c) => (
                  <SelectItem key={c.id_cuenta} value={String(c.id_cuenta)}>{c.codigo} — {c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </FormField>
      </FormDialog>
    </div>
  );
}

function TreasuryMovementsSection() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: movimientos = [], isLoading } = useQuery({ queryKey: ["movimientos-tesoreria"], queryFn: () => getMovimientosTesoreria({}) });
  const { data: cuentasTesoreria = [] } = useQuery({ queryKey: ["cuentas-tesoreria"], queryFn: getCuentasTesoreria });
  const { data: cuentasContables = [] } = useQuery({ queryKey: ["cuentas-contables"], queryFn: getCuentasContables });

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<MovimientoTesoreriaInput>({
    defaultValues: { id_cuenta_tesoreria: 0, id_cuenta_contra: 0, fecha: todayIso(), tipo: "deposito", monto: 0, descripcion: "" },
  });

  const mutation = useMutation({
    mutationFn: (v: MovimientoTesoreriaInput) => createMovimientoTesoreria(v),
    onSuccess: (ok) => {
      if (!ok) return;
      queryClient.invalidateQueries({ queryKey: ["movimientos-tesoreria"] });
      queryClient.invalidateQueries({ queryKey: ["cuentas-tesoreria"] });
      reset({ id_cuenta_tesoreria: 0, id_cuenta_contra: 0, fecha: todayIso(), tipo: "deposito", monto: 0, descripcion: "" });
      setIsFormOpen(false);
    },
  });

  const conciliarMutation = useMutation({
    mutationFn: (id: number) => conciliarMovimientoTesoreria(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["movimientos-tesoreria"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Cada movimiento genera automáticamente su asiento contable.</p>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Nuevo movimiento</Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Conciliado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : movimientos.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sin movimientos registrados.</TableCell></TableRow>
            ) : (
              movimientos.map((m) => (
                <TableRow key={m.id_movimiento}>
                  <TableCell className="whitespace-nowrap">{m.fecha}</TableCell>
                  <TableCell>{m.cuenta_tesoreria_nombre}</TableCell>
                  <TableCell><Badge variant="outline">{TIPOS_MOVIMIENTO.find((t) => t.value === m.tipo)?.label || m.tipo}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{m.descripcion || "—"}</TableCell>
                  <TableCell className="num text-right">S/ {Number(m.monto).toFixed(2)}</TableCell>
                  <TableCell>
                    {m.conciliado ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Sí</span>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => conciliarMutation.mutate(m.id_movimiento)} disabled={conciliarMutation.isPending}>
                        Marcar conciliado
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <FormDialog
        open={isFormOpen} onClose={() => { reset(); setIsFormOpen(false); }}
        title="Nuevo movimiento de tesorería" submitLabel="Registrar"
        isSubmitting={mutation.isPending}
        error={mutation.isError ? "No se pudo registrar. Verifica el periodo contable y las cuentas seleccionadas." : null}
        onSubmit={handleSubmit((v) => mutation.mutate({ ...v, monto: Number(v.monto) }))}
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Cuenta de tesorería">
            <Controller control={control} name="id_cuenta_tesoreria" rules={{ validate: (v) => Number(v) > 0 }} render={({ field }) => (
              <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
                <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent>
                  {cuentasTesoreria.map((c) => <SelectItem key={c.id_cuenta_tesoreria} value={String(c.id_cuenta_tesoreria)}>{c.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </FormField>
          <FormField label="Tipo de movimiento">
            <Controller control={control} name="tipo" render={({ field }) => (
              <Select value={field.value} onValueChange={(v) => field.onChange(v as TipoMovimientoTesoreria)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_MOVIMIENTO.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </FormField>
        </div>

        <FormField label="Cuenta contrapartida" htmlFor="mov-contra">
          <Controller control={control} name="id_cuenta_contra" rules={{ validate: (v) => Number(v) > 0 }} render={({ field }) => (
            <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
              <SelectTrigger><SelectValue placeholder="Ej: Ventas, Capital, Gastos..." /></SelectTrigger>
              <SelectContent>
                {cuentasContables.filter((c) => c.permite_movimiento === 1).map((c) => (
                  <SelectItem key={c.id_cuenta} value={String(c.id_cuenta)}>{c.codigo} — {c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Fecha" htmlFor="mov-fecha">
            <Input id="mov-fecha" type="date" {...register("fecha", { required: true })} />
          </FormField>
          <FormField label="Monto (S/.)" htmlFor="mov-monto" error={errors.monto?.message}>
            <Input id="mov-monto" type="number" step="0.01" min="0.01" {...register("monto", { required: true, valueAsNumber: true, min: 0.01 })} />
          </FormField>
        </div>
        <FormField label="Descripción (opcional)" htmlFor="mov-desc">
          <Input id="mov-desc" {...register("descripcion")} />
        </FormField>
      </FormDialog>
    </div>
  );
}

function CashClosingsSection() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: cierres = [], isLoading } = useQuery({ queryKey: ["cierres-caja"], queryFn: () => getCierresCaja({}) });
  const { data: cuentasTesoreria = [] } = useQuery({ queryKey: ["cuentas-tesoreria"], queryFn: getCuentasTesoreria });

  const { register, handleSubmit, control, reset } = useForm<{ id_cuenta_tesoreria: number; fecha: string; observacion: string }>({
    defaultValues: { id_cuenta_tesoreria: 0, fecha: todayIso(), observacion: "" },
  });

  const mutation = useMutation({
    mutationFn: (v: { id_cuenta_tesoreria: number; fecha: string; observacion: string }) => cerrarCaja(v),
    onSuccess: (ok) => {
      if (!ok) return;
      queryClient.invalidateQueries({ queryKey: ["cierres-caja"] });
      reset({ id_cuenta_tesoreria: 0, fecha: todayIso(), observacion: "" });
      setIsFormOpen(false);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Cierre diario: calcula saldo inicial, ingresos, egresos y saldo final del día.</p>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2"><Lock className="h-4 w-4" /> Cerrar caja del día</Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead className="text-right">Saldo inicial</TableHead>
              <TableHead className="text-right">Ingresos</TableHead>
              <TableHead className="text-right">Egresos</TableHead>
              <TableHead className="text-right">Saldo final</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : cierres.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sin cierres de caja registrados.</TableCell></TableRow>
            ) : (
              cierres.map((c) => (
                <TableRow key={c.id_cierre}>
                  <TableCell className="whitespace-nowrap">{c.fecha}</TableCell>
                  <TableCell>{c.cuenta_tesoreria_nombre}</TableCell>
                  <TableCell className="num text-right">S/ {Number(c.saldo_inicial).toFixed(2)}</TableCell>
                  <TableCell className="num text-right text-emerald-600">S/ {Number(c.total_ingresos).toFixed(2)}</TableCell>
                  <TableCell className="num text-right text-destructive">S/ {Number(c.total_egresos).toFixed(2)}</TableCell>
                  <TableCell className="num text-right font-medium">S/ {Number(c.saldo_final).toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <FormDialog
        open={isFormOpen} onClose={() => { reset(); setIsFormOpen(false); }}
        title="Cerrar caja del día" submitLabel="Cerrar caja"
        isSubmitting={mutation.isPending}
        error={mutation.isError ? "No se pudo cerrar. Puede que ya exista un cierre para esa cuenta y fecha." : null}
        onSubmit={handleSubmit((v) => mutation.mutate(v))}
      >
        <FormField label="Cuenta de tesorería">
          <Controller control={control} name="id_cuenta_tesoreria" rules={{ validate: (v) => Number(v) > 0 }} render={({ field }) => (
            <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
              <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
              <SelectContent>
                {cuentasTesoreria.map((c) => <SelectItem key={c.id_cuenta_tesoreria} value={String(c.id_cuenta_tesoreria)}>{c.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          )} />
        </FormField>
        <FormField label="Fecha" htmlFor="cierre-fecha">
          <Input id="cierre-fecha" type="date" {...register("fecha", { required: true })} />
        </FormField>
        <FormField label="Observación (opcional)" htmlFor="cierre-obs">
          <Input id="cierre-obs" {...register("observacion")} />
        </FormField>
      </FormDialog>
    </div>
  );
}

export function TreasuryPanel() {
  const [seccion, setSeccion] = useState<"cuentas" | "movimientos" | "cierres">("cuentas");

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg bg-muted p-1">
        {([
          { id: "cuentas", label: "Cuentas" },
          { id: "movimientos", label: "Movimientos" },
          { id: "cierres", label: "Cierres de caja" },
        ] as const).map((s) => (
          <button
            key={s.id}
            onClick={() => setSeccion(s.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              seccion === s.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {seccion === "cuentas" && <TreasuryAccountsSection />}
      {seccion === "movimientos" && <TreasuryMovementsSection />}
      {seccion === "cierres" && <CashClosingsSection />}
    </div>
  );
}
