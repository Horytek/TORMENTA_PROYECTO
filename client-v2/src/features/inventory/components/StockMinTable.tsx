import { AlertTriangle } from "lucide-react";
import type { ProductoStockMinimo } from "../types";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

interface Props {
  productos: ProductoStockMinimo[];
}

export function StockMinTable({ productos }: Props) {
  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/50 bg-card/50 py-20 text-center">
        <AlertTriangle className="h-8 w-8 text-emerald-400/40 mb-3" />
        <p className="text-sm text-muted-foreground">Ningún producto con stock bajo mínimo.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-orange-500/20 bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-orange-500/5 hover:bg-orange-500/5 border-orange-500/10">
            <TableHead className="w-[100px] pl-4 text-orange-600 dark:text-orange-400 font-semibold">Código</TableHead>
            <TableHead className="text-orange-600 dark:text-orange-400 font-semibold">Producto</TableHead>
            <TableHead className="text-orange-600 dark:text-orange-400 font-semibold">Marca</TableHead>
            <TableHead className="text-right pr-4 text-orange-600 dark:text-orange-400 font-semibold">Stock actual</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {productos.map((p) => (
            <TableRow key={p.codigo} className="border-orange-500/10 hover:bg-orange-500/5">
              <TableCell className="font-mono text-xs text-muted-foreground pl-4">{p.codigo}</TableCell>
              <TableCell className="font-medium text-foreground">{p.descripcion}</TableCell>
              <TableCell className="text-muted-foreground">{p.marca}</TableCell>
              <TableCell className="text-right pr-4">
                <span className="text-red-600 dark:text-red-400 font-semibold">{Number(p.stock).toLocaleString()}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
