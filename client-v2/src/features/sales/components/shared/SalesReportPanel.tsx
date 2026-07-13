import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileSpreadsheet, Download, Eye, RotateCcw, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
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
import { useUserStore } from "@/store/useUserStore";
import { getVentas, annulVenta } from "@/features/sales/api/ventas";
import type { Venta, VentasFilters } from "@/features/sales/types";
import { VoucherPreview } from "./VoucherPreview";

// ─────────────────────────────────────────────────────────────────
// SalesReportPanel — Reporte de ventas con filtros y tabla
// ─────────────────────────────────────────────────────────────────

export function SalesReportPanel() {
  const user = useUserStore((s) => s.user);

  const [filters, setFilters] = useState<VentasFilters>({
    fecha_inicio: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
    fecha_fin: new Date().toISOString().split("T")[0],
  });
  const [previewVenta, setPreviewVenta] = useState<Venta | null>(null);

  const { data: ventas = [], isLoading, refetch } = useQuery<Venta[]>({
    queryKey: ["ventas", filters],
    queryFn: () => getVentas(filters),
  });

function parseMetodoPago(metodoPago?: string, totalVenta: number = 0) {
  if (!metodoPago) return { efectivo: 0, digital: 0 };
  const upper = metodoPago.toUpperCase();
  if (upper === "EFECTIVO") {
    return { efectivo: totalVenta, digital: 0 };
  }
  if (["TARJETA", "TRANSFERENCIA", "YAPE", "PLIN"].includes(upper)) {
    return { efectivo: 0, digital: totalVenta };
  }
  if (metodoPago.includes(":")) {
    const parts = metodoPago.split(",").map(p => p.trim());
    let efectivo = 0;
    let digital = 0;
    for (const part of parts) {
      const idx = part.indexOf(":");
      if (idx !== -1) {
        const tipo = part.slice(0, idx).trim().toUpperCase();
        const monto = parseFloat(part.slice(idx + 1).trim()) || 0;
        if (tipo === "EFECTIVO") {
          efectivo += monto;
        } else if (["PLIN", "YAPE", "TARJETA", "TRANSFERENCIA", "VISA", "MASTERCARD"].includes(tipo)) {
          digital += monto;
        }
      }
    }
    return { efectivo, digital };
  }
  if (upper === "MIXTO") {
    return { efectivo: totalVenta / 2, digital: totalVenta / 2 };
  }
  return { efectivo: 0, digital: totalVenta };
}

  const stats = useMemo(() => {
    let total = 0;
    const count = ventas.length;
    let igv = 0;
    let efectivo = 0;
    let digital = 0;

    ventas.forEach((v) => {
      const isCompletada = v.estado_venta === 1 || v.estado === 1;
      if (isCompletada) {
        const saleTotal = Number(v.total_t ?? v.total ?? 0);
        total += saleTotal;
        igv += Number(v.igv ?? 0);
        
        const split = parseMetodoPago(v.metodo_pago, saleTotal);
        efectivo += split.efectivo;
        digital += split.digital;
      }
    });

    return {
      total,
      count,
      igv,
      promedio: count > 0 ? total / count : 0,
      efectivo,
      digital
    };
  }, [ventas]);

  const handleExportCSV = () => {
    if (ventas.length === 0) return;
    const BOM = "\uFEFF";
    const headers = [
      "Fecha", "N° Comprobante", "Cliente", "Documento", "IGV", "Total", "Método Pago", "Estado",
    ];
    const rows: string[][] = ventas.map((v) => [
      String(v.f_venta ?? ""),
      String(v.num_comprobante ?? ""),
      String(v.nom_cliente ?? ""),
      String(v.documento_cliente ?? ""),
      Number(v.igv ?? 0).toFixed(2),
      Number(v.total_t ?? 0).toFixed(2),
      String(v.metodo_pago ?? ""),
      v.estado_venta === 1 ? "Completada" : "Anulada",
    ]);
    const csv = ([BOM] as (string | string[])[]).concat(
      headers as string[],
      rows as string[][]
    ).map((r) => (Array.isArray(r) ? r.join(",") : r)).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ventas_${filters.fecha_inicio}_${filters.fecha_fin}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const canDelete = user?.roleId === 10 || user?.roleId === 3;

  return (
    <div className="h-full flex flex-col gap-3">
      {/* ── Filtros ── */}
      <Card className="rounded-xl border border-border bg-card">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Desde</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={filters.fecha_inicio ?? ""}
                  onChange={(e) => setFilters((f) => ({ ...f, fecha_inicio: e.target.value }))}
                  className="pl-8 h-8 text-xs w-auto"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hasta</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={filters.fecha_fin ?? ""}
                  onChange={(e) => setFilters((f) => ({ ...f, fecha_fin: e.target.value }))}
                  className="pl-8 h-8 text-xs w-auto"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select
                value={filters.id_comprobante ?? "all"}
                onValueChange={(v) => setFilters((f) => ({ ...f, id_comprobante: v === "all" ? undefined : v }))}
              >
                <SelectTrigger className="h-8 text-xs w-auto min-w-[110px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Boleta">Boleta</SelectItem>
                  <SelectItem value="Factura">Factura</SelectItem>
                  <SelectItem value="Nota">Nota</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Estado</Label>
              <Select
                value={String(filters.estado ?? "all")}
                onValueChange={(v) => setFilters((f) => ({ ...f, estado: v === "all" ? undefined : Number(v) }))}
              >
                <SelectTrigger className="h-8 text-xs w-auto min-w-[110px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="1">Completadas</SelectItem>
                  <SelectItem value="0">Anuladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1" />
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => refetch()}>
              🔄 Actualizar
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleExportCSV} disabled={ventas.length === 0}>
              <Download className="h-3 w-3" /> Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Ventas" value={stats.count.toLocaleString()} />
        <StatCard label="Total" value={`S/ ${stats.total.toFixed(2)}`} accent />
        <StatCard label="Dinero Físico" value={`S/ ${stats.efectivo.toFixed(2)}`} />
        <StatCard label="Dinero Digital" value={`S/ ${stats.digital.toFixed(2)}`} />
        <StatCard label="IGV Total" value={`S/ ${stats.igv.toFixed(2)}`} />
        <StatCard label="Promedio" value={`S/ ${stats.promedio.toFixed(2)}`} />
      </div>

      {/* ── Tabla ── */}
      <Card className="flex-1 rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-auto h-full">
          <Table>
            <TableHeader>
              <TableRow className="text-[10px] uppercase text-muted-foreground/70">
                <TableHead>Fecha</TableHead>
                <TableHead>Comprobante</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">IGV</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Spinner size="md" />
                  </TableCell>
                </TableRow>
              ) : ventas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileSpreadsheet className="h-8 w-8 text-muted-foreground/30" strokeWidth={1.5} />
                      <p className="text-sm">No hay ventas en este período</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                ventas.map((venta) => (
                  <TableRow key={venta.id_venta} className="group">
                    <TableCell className="text-xs whitespace-nowrap">{venta.f_venta}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs font-medium">{venta.num_comprobante}</span>
                      <span className="ml-1 text-[10px] text-muted-foreground">{venta.id_comprobante}</span>
                    </TableCell>
                    <TableCell className="text-xs max-w-[180px] truncate">
                      {venta.nom_cliente ?? <span className="text-muted-foreground italic">Venta rápida</span>}
                      {venta.documento_cliente && (
                        <span className="ml-1 text-[10px] text-muted-foreground">{venta.documento_cliente}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-right tabular-nums">
                      S/ {Number(venta.igv ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs text-right font-semibold tabular-nums text-primary">
                      S/ {Number(venta.total_t ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {venta.metodo_pago ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={venta.estado_venta === 1 ? "default" : "destructive"}
                        className="text-[10px]"
                      >
                        {venta.estado_venta === 1 ? "Completada" : "Anulada"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="Ver comprobante"
                          onClick={() => setPreviewVenta(venta)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {canDelete && venta.estado_venta === 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            title="Anular venta"
                            onClick={() => {
                              if (confirm(`¿Anular venta ${venta.num_comprobante}?`)) {
                                if (venta.id_venta) annulVenta(venta.id_venta).then(() => refetch());
                              }
                            }}
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ── Voucher preview modal ── */}
      {previewVenta && (
        <VoucherPreview open={!!previewVenta} venta={previewVenta} onClose={() => setPreviewVenta(null)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className="rounded-xl border border-border bg-card">
      <CardContent className="p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">{label}</p>
        <p className={["text-lg font-bold mt-0.5 tabular-nums", accent ? "text-primary" : "text-foreground"].join(" ")}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
