import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { getLibroDiario } from "../api/accounting";

const firstDayOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const todayIso = () => new Date().toISOString().slice(0, 10);

export function JournalBookPanel() {
  const [fechaInicio, setFechaInicio] = useState(firstDayOfMonth());
  const [fechaFin, setFechaFin] = useState(todayIso());

  const { data: lineas = [], isLoading } = useQuery({
    queryKey: ["libro-diario", fechaInicio, fechaFin],
    queryFn: () => getLibroDiario({ fechaInicio, fechaFin }),
  });

  const totalDebe = lineas.reduce((sum, l) => sum + Number(l.debe), 0);
  const totalHaber = lineas.reduce((sum, l) => sum + Number(l.haber), 0);

  const handleExport = () => {
    const rows = lineas.map((l) => ({
      Fecha: l.fecha,
      Asiento: `#${l.numero}`,
      "Código Cuenta": l.cuenta_codigo,
      "Nombre Cuenta": l.cuenta_nombre,
      Descripción: l.descripcion || l.asiento_descripcion,
      "Debe (S/)": Number(l.debe) > 0 ? Number(l.debe) : 0,
      "Haber (S/)": Number(l.haber) > 0 ? Number(l.haber) : 0,
    }));

    // Summary row
    rows.push({
      Fecha: "TOTAL",
      Asiento: "",
      "Código Cuenta": "",
      "Nombre Cuenta": "",
      Descripción: "",
      "Debe (S/)": totalDebe,
      "Haber (S/)": totalHaber,
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Libro Diario");
    XLSX.writeFile(wb, `libro_diario_${fechaInicio}_a_${fechaFin}.xlsx`);
  };

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
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={lineas.length === 0}
          className="gap-2 h-9"
        >
          <Download className="h-4 w-4" /> Exportar Excel
        </Button>
        <div className="ml-auto text-right">
          <p className="text-xs text-muted-foreground">Totales del período</p>
          <p className="num text-sm font-semibold text-foreground">
            Debe S/ {totalDebe.toFixed(2)} · Haber S/ {totalHaber.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>N°</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Debe</TableHead>
              <TableHead className="text-right">Haber</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : lineas.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sin movimientos en el período seleccionado.</TableCell></TableRow>
            ) : (
              lineas.map((l, i) => (
                <TableRow key={`${l.id_asiento}-${i}`}>
                  <TableCell className="whitespace-nowrap">{l.fecha}</TableCell>
                  <TableCell className="num">#{l.numero}</TableCell>
                  <TableCell className="whitespace-nowrap">{l.cuenta_codigo} — {l.cuenta_nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{l.descripcion || l.asiento_descripcion}</TableCell>
                  <TableCell className="num text-right">{Number(l.debe) > 0 ? Number(l.debe).toFixed(2) : ""}</TableCell>
                  <TableCell className="num text-right">{Number(l.haber) > 0 ? Number(l.haber).toFixed(2) : ""}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
