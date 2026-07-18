import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Package,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import type { KardexDetalleMovimiento } from "../types";

/** Parsea una hora "HH:MM:SS" en string local sin tirar por DST. */
function formatHora(hora?: string | null): string {
  if (!hora) return "—";
  const d = new Date(`1970-01-01T${hora}`);
  if (isNaN(d.getTime())) return hora;
  return d.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function estadoChip(estado?: number | string | null): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  const v = estado;
  if (v === 1 || v === "1" || v === "REGISTRADO" || v === "APROBADO") {
    return { label: "REGISTRADO", variant: "default" };
  }
  if (v === 0 || v === "0" || v === "ANULADO") {
    return { label: "ANULADO", variant: "destructive" };
  }
  return { label: String(v ?? "REGISTRADO"), variant: "secondary" };
}

interface HistoricoTableProps {
  transactions: KardexDetalleMovimiento[];
}

export function HistoricoTable({
  transactions,
}: HistoricoTableProps) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [openMovement, setOpenMovement] = useState<KardexDetalleMovimiento | null>(null);

  /** Ordena por fecha+hora descendente (más reciente primero). */
  const sorted = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const [da, ma, ya] = (a.fecha ?? "").split("/");
      const [db, mb, yb] = (b.fecha ?? "").split("/");
      const dateStrA = `${ya}-${ma}-${da}T${a.hora_creacion ?? "00:00:00"}`;
      const dateStrB = `${yb}-${mb}-${db}T${b.hora_creacion ?? "00:00:00"}`;
      return new Date(dateStrB).getTime() - new Date(dateStrA).getTime();
    });
  }, [transactions]);

  // Reset a la primera página cuando cambian los transactions.
  useEffect(() => {
    setPage(1);
  }, [transactions]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return sorted.slice(start, start + perPage);
  }, [sorted, safePage, perPage]);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
            <Activity className="h-4 w-4 text-blue-500" />
            Transacciones
          </h3>
          <span className="num text-xs text-muted-foreground">
            {sorted.length} registros
          </span>
        </div>

        {/* Tabla desktop */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead className="text-center">Entra</TableHead>
                <TableHead className="text-center">Sale</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-10 w-10 text-muted-foreground/40" />
                      <p className="text-sm">No hay transacciones registradas en este rango.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {paginated.map((t, i) => {
                const e = estadoChip(t.estado_doc);
                return (
                  <TableRow
                    key={`${t.id}-${i}`}
                    onClick={() => setOpenMovement(t)}
                    className="cursor-pointer"
                  >
                    <TableCell className="num whitespace-nowrap text-xs font-medium">
                      {t.fecha ?? "—"}
                    </TableCell>
                    <TableCell className="num whitespace-nowrap text-xs text-muted-foreground">
                      {formatHora(t.hora_creacion)}
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate text-xs text-muted-foreground" title={t.usuario ?? ""}>
                      {t.usuario ?? "—"}
                    </TableCell>
                    <TableCell className="num whitespace-nowrap font-mono text-xs">
                      {t.documento ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate text-xs text-muted-foreground" title={t.almacen_origen ?? ""}>
                      {t.almacen_origen ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate text-xs text-muted-foreground" title={t.almacen_destino ?? ""}>
                      {t.almacen_destino ?? "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {Number(t.entra) > 0 ? (
                        <span className="num rounded bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {Number(t.entra).toLocaleString("es-PE")}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {Number(t.sale) > 0 ? (
                        <span className="num rounded bg-rose-50 px-1.5 py-0.5 font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                          {Number(t.sale).toLocaleString("es-PE")}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">0</span>
                      )}
                    </TableCell>
                    <TableCell className="num whitespace-nowrap text-right font-semibold">
                      {Number(t.stock ?? 0).toLocaleString("es-PE")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={e.variant} className="text-[10px] font-bold">
                        {e.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Cards móvil */}
        <div className="block divide-y divide-border md:hidden">
          {paginated.length === 0 && (
            <div className="py-10 text-center text-muted-foreground">
              <Package className="mx-auto mb-3 h-8 w-8 opacity-40" />
              <p className="text-sm font-medium">No hay transacciones registradas.</p>
            </div>
          )}
          {paginated.map((t, i) => {
            const e = estadoChip(t.estado_doc);
            return (
              <div
                key={`m-${t.id}-${i}`}
                onClick={() => setOpenMovement(t)}
                className="cursor-pointer space-y-3 p-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="num text-sm font-bold">{t.documento ?? "—"}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {t.fecha} · {formatHora(t.hora_creacion)}
                    </p>
                  </div>
                  <Badge variant={e.variant} className="text-[9px] font-bold">
                    {e.label}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex gap-6">
                    <div className="flex flex-col">
                      <span className="mb-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                        Entra
                      </span>
                      <span
                        className={cn(
                          "num text-sm font-bold",
                          Number(t.entra) > 0 ? "text-emerald-600" : "text-muted-foreground/60"
                        )}
                      >
                        {Number(t.entra).toLocaleString("es-PE")}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="mb-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                        Sale
                      </span>
                      <span
                        className={cn(
                          "num text-sm font-bold",
                          Number(t.sale) > 0 ? "text-rose-600" : "text-muted-foreground/60"
                        )}
                      >
                        {Number(t.sale).toLocaleString("es-PE")}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="mb-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                      Stock Final
                    </span>
                    <span className="num text-base font-bold text-blue-600">
                      {Number(t.stock ?? 0).toLocaleString("es-PE")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Paginación */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border p-3 sm:flex-row">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(1)}
              disabled={safePage === 1}
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="num px-2 text-xs text-muted-foreground">
              Página <strong>{safePage}</strong> de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Select
            value={String(perPage)}
            onValueChange={(v) => {
              setPerPage(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 filas</SelectItem>
              <SelectItem value="10">10 filas</SelectItem>
              <SelectItem value="20">20 filas</SelectItem>
              <SelectItem value="1000000">Todo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Drawer / Sheet de detalle */}
      <Sheet open={!!openMovement} onOpenChange={(v) => !v && setOpenMovement(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Detalle de Movimiento</SheetTitle>
            <SheetDescription>
              {openMovement && (
                <>
                  Documento:{" "}
                  <span className="num rounded bg-muted px-2 py-0.5 font-mono text-foreground">
                    {openMovement.documento}
                  </span>
                </>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {openMovement?.productos && openMovement.productos.length > 0 ? (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {openMovement.productos.map((p, idx) => (
                  <li key={idx} className="space-y-2 p-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {p.descripcion}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.marca || "—"}
                        </p>
                      </div>
                      <span className="num text-lg font-bold">{p.cantidad}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="num rounded bg-muted px-1.5 py-0.5 font-mono text-muted-foreground">
                        {p.codigo}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No hay productos asociados a este movimiento.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}