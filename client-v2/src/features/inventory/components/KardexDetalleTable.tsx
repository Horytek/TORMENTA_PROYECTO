import React from "react";
import { ArrowDownLeft, ArrowUpRight, Minus, FileText } from "lucide-react";
import type { KardexMovimiento } from "../types";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

interface Props {
  movimientos: KardexMovimiento[];
}

const TIPO_CLASS: Record<string, string> = {
  INGRESO: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  SALIDA: "bg-red-500/10 text-red-600 dark:text-red-400",
  AJUSTE: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
};

const TIPO_ICON: Record<string, React.ReactNode> = {
  INGRESO: <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />,
  SALIDA: <ArrowUpRight className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />,
  AJUSTE: <Minus className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />,
};

export function KardexDetalleTable({ movimientos }: Props) {
  if (movimientos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/50 bg-card/50 py-20 text-center">
        <FileText className="h-8 w-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No hay movimientos en el rango de fechas seleccionado.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="pl-4">Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Stock anterior</TableHead>
              <TableHead className="text-right">Stock actual</TableHead>
              <TableHead>Almacén</TableHead>
              <TableHead className="text-right">P. Unit.</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="pr-4">Usuario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movimientos.map((m) => (
              <TableRow key={m.id_kardex} className="hover:bg-muted/30">
                <TableCell className="text-muted-foreground pl-4">{m.fecha_mov}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${TIPO_CLASS[m.tipo_movimiento] ?? "bg-muted text-muted-foreground"}`}>
                    {TIPO_ICON[m.tipo_movimiento]}
                    {m.tipo_movimiento}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {m.num_serie && m.num_doc ? `${m.num_serie}-${m.num_doc}` : m.tipo_doc}
                </TableCell>
                <TableCell className={`text-right font-semibold ${
                  m.tipo_movimiento === "SALIDA" 
                    ? "text-red-600 dark:text-red-400" 
                    : m.tipo_movimiento === "INGRESO" 
                      ? "text-emerald-600 dark:text-emerald-400" 
                      : "text-yellow-600 dark:text-yellow-400"
                }`}>
                  {m.tipo_movimiento === "SALIDA" ? "-" : m.tipo_movimiento === "INGRESO" ? "+" : ""}{Number(m.cantidad).toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{Number(m.stock_anterior).toLocaleString()}</TableCell>
                <TableCell className="text-right font-medium text-foreground">{Number(m.stock_actual).toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground">{m.nom_almacen ?? "—"}</TableCell>
                <TableCell className="text-right text-foreground">S/ {Number(m.precio_unitario).toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium text-foreground">S/ {Number(m.total).toFixed(2)}</TableCell>
                <TableCell className="text-muted-foreground pr-4">{m.nom_usuario}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
