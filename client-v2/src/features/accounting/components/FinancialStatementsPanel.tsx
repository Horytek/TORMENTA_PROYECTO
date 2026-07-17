import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { getBalanceGeneral, getEstadoResultados, getBalanceComprobacion } from "../api/accounting";
import type { CuentaSaldo } from "../types";

const todayIso = () => new Date().toISOString().slice(0, 10);
const firstDayOfYear = () => new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);

function CuentaSaldoRows({ filas }: { filas: CuentaSaldo[] }) {
  if (filas.length === 0) {
    return <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Sin cuentas con movimiento.</TableCell></TableRow>;
  }
  return (
    <>
      {filas.map((f) => (
        <TableRow key={f.id_cuenta}>
          <TableCell className="text-muted-foreground">{f.codigo} — {f.nombre}</TableCell>
          <TableCell className="num text-right">S/ {f.saldo.toFixed(2)}</TableCell>
        </TableRow>
      ))}
    </>
  );
}

function BalanceGeneralSection() {
  const [fecha, setFecha] = useState(todayIso());
  const { data: balance, isLoading } = useQuery({ queryKey: ["balance-general", fecha], queryFn: () => getBalanceGeneral(fecha) });

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Fecha de corte</label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-9" />
        </div>
        {balance && Math.abs(balance.diferencia) > 0.01 && (
          <p className="ml-auto text-sm text-destructive">Descuadre: S/ {balance.diferencia.toFixed(2)}</p>
        )}
      </div>

      {isLoading || !balance ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Activo</h3>
            <Table>
              <TableBody><CuentaSaldoRows filas={balance.activo} /></TableBody>
            </Table>
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-semibold">
              <span>Total Activo</span><span className="num">S/ {balance.totalActivo.toFixed(2)}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Pasivo</h3>
              <Table>
                <TableBody><CuentaSaldoRows filas={balance.pasivo} /></TableBody>
              </Table>
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-semibold">
                <span>Total Pasivo</span><span className="num">S/ {balance.totalPasivo.toFixed(2)}</span>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Patrimonio</h3>
              <Table>
                <TableBody><CuentaSaldoRows filas={balance.patrimonio} /></TableBody>
              </Table>
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-semibold">
                <span>Total Patrimonio</span><span className="num">S/ {balance.totalPatrimonio.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IncomeStatementSection() {
  const [fechaInicio, setFechaInicio] = useState(firstDayOfYear());
  const [fechaFin, setFechaFin] = useState(todayIso());
  const { data: er, isLoading } = useQuery({
    queryKey: ["estado-resultados", fechaInicio, fechaFin],
    queryFn: () => getEstadoResultados(fechaInicio, fechaFin),
  });

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
        {er && (
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">Utilidad neta</p>
            <p className={`num text-lg font-bold ${er.utilidadNeta >= 0 ? "text-emerald-600" : "text-destructive"}`}>S/ {er.utilidadNeta.toFixed(2)}</p>
          </div>
        )}
      </div>

      {isLoading || !er ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Ingresos</h3>
            <Table><TableBody><CuentaSaldoRows filas={er.ingresos} /></TableBody></Table>
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-medium">
              <span>Total Ingresos</span><span className="num">S/ {er.totalIngresos.toFixed(2)}</span>
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Costos</h3>
            <Table><TableBody><CuentaSaldoRows filas={er.costos} /></TableBody></Table>
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-medium">
              <span>Total Costos</span><span className="num">S/ {er.totalCostos.toFixed(2)}</span>
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Gastos</h3>
            <Table><TableBody><CuentaSaldoRows filas={er.gastos} /></TableBody></Table>
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-medium">
              <span>Total Gastos</span><span className="num">S/ {er.totalGastos.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TrialBalanceSection() {
  const [fechaInicio, setFechaInicio] = useState(firstDayOfYear());
  const [fechaFin, setFechaFin] = useState(todayIso());
  const { data: bc, isLoading } = useQuery({
    queryKey: ["balance-comprobacion", fechaInicio, fechaFin],
    queryFn: () => getBalanceComprobacion(fechaInicio, fechaFin),
  });

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
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cuenta</TableHead>
              <TableHead className="text-right">Saldo anterior</TableHead>
              <TableHead className="text-right">Debe</TableHead>
              <TableHead className="text-right">Haber</TableHead>
              <TableHead className="text-right">Saldo final</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || !bc ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : bc.filas.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sin movimientos en el período.</TableCell></TableRow>
            ) : (
              bc.filas.map((f) => (
                <TableRow key={f.id_cuenta}>
                  <TableCell className="text-muted-foreground">{f.codigo} — {f.nombre}</TableCell>
                  <TableCell className="num text-right">S/ {f.saldoAnterior.toFixed(2)}</TableCell>
                  <TableCell className="num text-right">S/ {f.debePeriodo.toFixed(2)}</TableCell>
                  <TableCell className="num text-right">S/ {f.haberPeriodo.toFixed(2)}</TableCell>
                  <TableCell className="num text-right font-medium">S/ {f.saldoFinal.toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function FinancialStatementsPanel() {
  const [reporte, setReporte] = useState<"balance-general" | "estado-resultados" | "balance-comprobacion">("balance-general");

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg bg-muted p-1">
        {([
          { id: "balance-general", label: "Balance General" },
          { id: "estado-resultados", label: "Estado de Resultados" },
          { id: "balance-comprobacion", label: "Balance de Comprobación" },
        ] as const).map((r) => (
          <button
            key={r.id}
            onClick={() => setReporte(r.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              reporte === r.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {reporte === "balance-general" && <BalanceGeneralSection />}
      {reporte === "estado-resultados" && <IncomeStatementSection />}
      {reporte === "balance-comprobacion" && <TrialBalanceSection />}
    </div>
  );
}
