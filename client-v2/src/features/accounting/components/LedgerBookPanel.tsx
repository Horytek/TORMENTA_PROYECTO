import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { getCuentasContables, getLibroMayor } from "../api/accounting";

const firstDayOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const todayIso = () => new Date().toISOString().slice(0, 10);

export function LedgerBookPanel() {
  const [idCuenta, setIdCuenta] = useState<number | null>(null);
  const [fechaInicio, setFechaInicio] = useState(firstDayOfMonth());
  const [fechaFin, setFechaFin] = useState(todayIso());

  const { data: cuentas = [] } = useQuery({ queryKey: ["cuentas-contables"], queryFn: getCuentasContables });
  const cuentasMovibles = cuentas.filter((c) => c.permite_movimiento === 1);

  const { data: libro, isLoading } = useQuery({
    queryKey: ["libro-mayor", idCuenta, fechaInicio, fechaFin],
    queryFn: () => getLibroMayor({ idCuenta: idCuenta!, fechaInicio, fechaFin }),
    enabled: !!idCuenta,
  });

  const handleExport = () => {
    if (!libro) return;

    // Rows to export
    const rows = [
      // Row for Saldo Inicial
      {
        Fecha: "",
        Asiento: "",
        Descripción: "SALDO INICIAL",
        "Debe (S/)": "",
        "Haber (S/)": "",
        "Saldo (S/)": libro.saldoInicial,
      }
    ];

    libro.movimientos.forEach((m) => {
      rows.push({
        Fecha: m.fecha,
        Asiento: `#${m.numero}`,
        Descripción: m.descripcion || m.asiento_descripcion,
        "Debe (S/)": Number(m.debe) > 0 ? Number(m.debe) : 0,
        "Haber (S/)": Number(m.haber) > 0 ? Number(m.haber) : 0,
        "Saldo (S/)": m.saldo,
      });
    });

    // Row for Saldo Final
    rows.push({
      Fecha: "TOTAL",
      Asiento: "",
      Descripción: "SALDO FINAL",
      "Debe (S/)": libro.movimientos.reduce((sum, m) => sum + Number(m.debe), 0),
      "Haber (S/)": libro.movimientos.reduce((sum, m) => sum + Number(m.haber), 0),
      "Saldo (S/)": libro.saldoFinal,
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Libro Mayor");
    XLSX.writeFile(wb, `libro_mayor_${libro.cuenta.codigo}_${fechaInicio}_a_${fechaFin}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1 min-w-[240px]">
          <label className="text-xs font-medium text-muted-foreground">Cuenta</label>
          <Select value={idCuenta ? String(idCuenta) : ""} onValueChange={(v) => setIdCuenta(Number(v))}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Selecciona una cuenta..." /></SelectTrigger>
            <SelectContent>
              {cuentasMovibles.map((c) => (
                <SelectItem key={c.id_cuenta} value={String(c.id_cuenta)}>{c.codigo} — {c.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Desde</label>
          <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="h-9" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Hasta</label>
          <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="h-9" />
        </div>
        {libro && (
          <>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={libro.movimientos.length === 0}
              className="gap-2 h-9"
            >
              <Download className="h-4 w-4" /> Exportar Excel
            </Button>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Saldo final ({libro.cuenta.naturaleza})</p>
              <p className="num text-lg font-bold text-foreground">S/ {libro.saldoFinal.toFixed(2)}</p>
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>N°</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Debe</TableHead>
              <TableHead className="text-right">Haber</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!idCuenta ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Selecciona una cuenta para ver su libro mayor.</TableCell></TableRow>
            ) : isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : !libro || libro.movimientos.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sin movimientos en el período seleccionado.</TableCell></TableRow>
            ) : (
              libro.movimientos.map((m, i) => (
                <TableRow key={`${m.id_asiento}-${i}`}>
                  <TableCell className="whitespace-nowrap">{m.fecha}</TableCell>
                  <TableCell className="num">#{m.numero}</TableCell>
                  <TableCell className="text-muted-foreground">{m.descripcion || m.asiento_descripcion}</TableCell>
                  <TableCell className="num text-right">{Number(m.debe) > 0 ? Number(m.debe).toFixed(2) : ""}</TableCell>
                  <TableCell className="num text-right">{Number(m.haber) > 0 ? Number(m.haber).toFixed(2) : ""}</TableCell>
                  <TableCell className="num text-right font-medium">{m.saldo.toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
