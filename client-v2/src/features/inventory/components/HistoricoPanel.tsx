import { useMemo, useState } from "react";
import {
  Package, Archive, DollarSign, TrendingUp, TrendingDown, Activity, FileDown, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { getNegocio } from "@/features/settings/api/settings";
import type { KardexTransaccion, KardexPrevio, KardexProductoInfo } from "../types";

interface HistoricoPanelProps {
  transacciones: KardexTransaccion[];
  previo: KardexPrevio | null;
  productoInfo: KardexProductoInfo | null;
  fechaInicio: string;
  fechaFin: string;
  canGeneratePdf: boolean;
}

/**
 * `estado_doc` viene de `COALESCE(estado_nota, estado_venta, 1)` y las dos tablas usan
 * polaridad OPUESTA: en `nota` 0=activa/1=anulada, en `venta` 1=activa/0=anulada
 * (ver notaingreso.controller.js:736,802 vs ventas.controller.js:1025). Sin distinguir
 * el origen, una nota activa se mostraría como "ANULADO" — por eso miramos `nombre`.
 */
function estadoInfo(t: { estado_doc: number | string; nombre: string }) {
  const esVenta = t.nombre === "Venta";
  const estado = Number(t.estado_doc);
  const isAnulado = esVenta ? estado === 0 : estado === 1;
  if (isAnulado) return { label: "ANULADO", variant: "destructive" as const };
  return { label: "REGISTRADO", variant: "success" as const };
}

/** Ordena por fecha (dd/mm/yyyy) + hora, más reciente primero. */
function sortDesc(transacciones: KardexTransaccion[]): KardexTransaccion[] {
  return [...transacciones].sort((a, b) => {
    const [da, ma, ya] = a.fecha.split("/");
    const [db, mb, yb] = b.fecha.split("/");
    const ta = new Date(`${ya}-${ma}-${da}T${a.hora_creacion || "00:00:00"}`).getTime();
    const tb = new Date(`${yb}-${mb}-${db}T${b.hora_creacion || "00:00:00"}`).getTime();
    return tb - ta;
  });
}

function KpiCard({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="rounded-lg bg-muted p-1.5 text-muted-foreground"><Icon className="h-4 w-4" /></div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function HistoricoPanel({ transacciones, previo, productoInfo, fechaInicio, fechaFin, canGeneratePdf }: HistoricoPanelProps) {
  const [selected, setSelected] = useState<KardexTransaccion | null>(null);
  const [generating, setGenerating] = useState(false);

  const sorted = useMemo(() => sortDesc(transacciones), [transacciones]);

  const stockInventario = Number(productoInfo?.stock) || 0;
  const entradasActual = transacciones.reduce((acc, t) => acc + (Number(t.entra) || 0), 0);
  const salidasActual = transacciones.reduce((acc, t) => acc + (Number(t.sale) || 0), 0);
  const stockPrev = Math.max(0, stockInventario + salidasActual - entradasActual);
  const entradasPrev = Math.max(0, Number(previo?.entra) || 0);

  const transaccionesFinancieras = transacciones.filter(
    (t) => !(t.documento?.startsWith("I") || t.documento?.startsWith("S")) && t.nombre !== "INGRESO" && t.nombre !== "SALIDA" && Number(t.sale) > 0
  );
  const precioUnitActual = (() => {
    const lastVenta = [...transaccionesFinancieras].reverse().find((t) => t.precio);
    if (lastVenta) return Number(lastVenta.precio);
    return Number(transaccionesFinancieras[0]?.precio) || 0;
  })();
  const valorTotalActual = Math.max(0, stockInventario * precioUnitActual);
  const rotacion = entradasActual > 0 ? (salidasActual / entradasActual) * 100 : 0;
  const velocidadVenta = salidasActual > 0 && transacciones.length > 0 ? salidasActual / transacciones.length : 0;
  const diasParaAgotar = velocidadVenta > 0 ? Math.round(stockInventario / velocidadVenta) : null;

  let estadoStock = { label: "Stock Medio", className: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-800/40 dark:bg-fuchsia-900/20 dark:text-fuchsia-400" };
  if (stockInventario <= 5) estadoStock = { label: "Stock Bajo", className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/40 dark:bg-rose-900/20 dark:text-rose-400" };
  else if (stockInventario >= 30) estadoStock = { label: "Stock Alto", className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-400" };

  const totalIngresos = transaccionesFinancieras.reduce((acc, t) => acc + (Number(t.sale) || 0) * (Number(t.precio) || 0), 0);
  // Sin entradas previas no hay base de comparación real — mostrar "Nuevo" en vez de un
  // porcentaje sin sentido (ej. el original mostraba "entradasActual*100%").
  const crecimiento = entradasPrev > 0
    ? `${(((entradasActual - entradasPrev) / entradasPrev) * 100).toFixed(1)}%`
    : entradasActual > 0 ? "Nuevo" : "0%";

  const countEntradas = transacciones.filter((t) => Number(t.entra) > 0).length;
  const countSalidas = transacciones.filter((t) => Number(t.sale) > 0).length;

  // Stock corriendo hacia atrás desde el stock actual (transacciones ordenadas desc = más reciente primero)
  let running = stockInventario;
  const conStock = sorted.map((t) => {
    const displayed = running;
    running = running - (Number(t.entra) || 0) + (Number(t.sale) || 0);
    return { ...t, calculatedStock: displayed };
  });

  const handlePdf = async () => {
    setGenerating(true);
    try {
      const [{ default: jsPDF }, autoTableModule, negocio] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
        getNegocio(),
      ]);
      const autoTable = autoTableModule.default;
      const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFont("helvetica", "bold").setFontSize(13);
      doc.text(negocio?.nombre_negocio ?? "Empresa", 15, 18);
      doc.setFont("helvetica", "normal").setFontSize(9);
      if (negocio?.ruc) doc.text(`RUC: ${negocio.ruc}`, 15, 24);

      doc.setFont("helvetica", "bold").setFontSize(12);
      doc.text("HISTÓRICO DE KARDEX", pageWidth - 15, 18, { align: "right" });
      doc.setFont("helvetica", "normal").setFontSize(9);
      doc.text(`${fechaInicio} — ${fechaFin}`, pageWidth - 15, 24, { align: "right" });

      let y = 36;
      if (productoInfo) {
        doc.setFont("helvetica", "bold").setFontSize(10);
        doc.text(`Producto: ${productoInfo.descripcion}`, 15, y);
        y += 5;
        doc.setFont("helvetica", "normal").setFontSize(9);
        doc.text(`Marca: ${productoInfo.marca}   Código: ${productoInfo.codigo}   Stock: ${productoInfo.stock}`, 15, y);
        y += 8;
      }

      const rows = conStock.map((t) => [
        t.fecha, t.documento || "-", t.nombre,
        String(t.entra || 0), String(t.sale || 0), String(t.calculatedStock), (t.glosa || "").replace(/\r?\n/g, " "),
      ]);
      autoTable(doc, {
        head: [["Fecha", "Documento", "Nombre", "Entra", "Sale", "Stock", "Glosa"]],
        body: rows,
        startY: y,
        styles: { fontSize: 8, cellPadding: 2.2 },
        headStyles: { fillColor: [191, 219, 254], textColor: [15, 23, 42], fontStyle: "bold" },
        columnStyles: { 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
      });

      doc.save(`historico-kardex-${productoInfo?.codigo ?? ""}.pdf`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard title="Histórico" icon={Package}>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div><p className="mb-0.5 text-xs text-muted-foreground">Entradas (conteo)</p><p className="text-lg font-bold text-blue-600 dark:text-blue-400">{countEntradas}</p></div>
            <div><p className="mb-0.5 text-xs text-muted-foreground">Salidas (conteo)</p><p className="text-lg font-bold text-rose-500 dark:text-rose-400">{countSalidas}</p></div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs"><span className="font-medium text-foreground">Rotación</span><span className="font-bold text-foreground">{rotacion.toFixed(1)}%</span></div>
            <Progress value={Math.min(100, rotacion)} className="h-1.5" />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5">
            <span className="text-xs text-muted-foreground">Stock inicial</span>
            <span className="text-sm font-bold text-foreground">{stockPrev} unid.</span>
          </div>
        </KpiCard>

        <KpiCard title="Stock actual" icon={Archive}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-3xl font-extrabold text-foreground">{stockInventario}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Unidades disponibles</p>
            </div>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${estadoStock.className}`}>{estadoStock.label}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-center dark:border-emerald-900/20 dark:bg-emerald-900/10">
              <div className="flex items-center justify-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400"><TrendingUp className="h-3.5 w-3.5" /> +{entradasActual}</div>
              <p className="mt-0.5 text-[10px] font-medium uppercase text-emerald-600/70">Entradas</p>
            </div>
            <div className="rounded-lg border border-rose-100 bg-rose-50 p-2 text-center dark:border-rose-900/20 dark:bg-rose-900/10">
              <div className="flex items-center justify-center gap-1 text-sm font-bold text-rose-600 dark:text-rose-400"><TrendingDown className="h-3.5 w-3.5" /> -{salidasActual}</div>
              <p className="mt-0.5 text-[10px] font-medium uppercase text-rose-600/70">Salidas</p>
            </div>
          </div>
        </KpiCard>

        <KpiCard title="Financiero" icon={DollarSign}>
          <div className="mb-2.5 flex items-start justify-between">
            <div><p className="mb-0.5 text-xs text-muted-foreground">Ingresos totales</p><p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">S/ {totalIngresos.toFixed(2)}</p></div>
            <Badge variant="success" className="font-bold">{crecimiento}</Badge>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between border-b border-dashed border-border/60 py-1"><span className="text-muted-foreground">Valor total (stock)</span><span className="font-semibold text-foreground">S/ {valorTotalActual.toFixed(2)}</span></div>
            <div className="flex justify-between py-1"><span className="text-muted-foreground">Velocidad</span><span className="font-semibold text-foreground">{velocidadVenta.toFixed(1)} u/día</span></div>
          </div>
          <div className="mt-2.5 text-right">
            <span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">{diasParaAgotar ? `En ${diasParaAgotar} días` : "Sin estimar"}</span>
          </div>
        </KpiCard>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground"><Activity className="h-4 w-4 text-blue-500" /> Transacciones</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{transacciones.length} registros</span>
            {canGeneratePdf && (
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={handlePdf} disabled={generating}>
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />} PDF
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                {["Fecha", "Hora", "Usuario", "Documento", "Origen", "Destino", "Entra", "Sale", "Stock", "Estado"].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {conStock.map((t, i) => {
                const estado = estadoInfo(t);
                return (
                  <TableRow key={i} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelected(t)}>
                    <TableCell className="whitespace-nowrap font-medium text-foreground">{t.fecha}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {t.hora_creacion ? new Date(`1970-01-01T${t.hora_creacion}`).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </TableCell>
                    <TableCell className="max-w-[100px] truncate text-muted-foreground" title={t.usuario}>{t.usuario || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">{t.documento || "—"}</TableCell>
                    <TableCell className="max-w-[100px] truncate text-muted-foreground" title={t.almacen_origen}>{t.almacen_origen || "—"}</TableCell>
                    <TableCell className="max-w-[100px] truncate text-muted-foreground" title={t.almacen_destino}>{t.almacen_destino || "—"}</TableCell>
                    <TableCell>{Number(t.entra) > 0 ?<span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-bold text-emerald-600 dark:text-emerald-400">{t.entra}</span> : <span className="text-muted-foreground/40">0</span>}</TableCell>
                    <TableCell>{Number(t.sale) > 0 ? <span className="rounded bg-rose-500/10 px-1.5 py-0.5 font-bold text-rose-600 dark:text-rose-400">{t.sale}</span> : <span className="text-muted-foreground/40">0</span>}</TableCell>
                    <TableCell className="font-semibold text-foreground">{t.calculatedStock}</TableCell>
                    <TableCell><Badge variant={estado.variant} className="font-normal">{estado.label}</Badge></TableCell>
                  </TableRow>
                );
              })}
              {conStock.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                    No hay transacciones registradas en este rango.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="flex h-full w-full flex-col p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border/40 p-5">
            <SheetTitle>Detalle de movimiento</SheetTitle>
            <SheetDescription className="font-mono text-xs">{selected?.documento}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-5">
            <div className="flex flex-col divide-y divide-border/50 rounded-lg border border-border/50">
              {selected?.productos.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{p.descripcion}</p>
                    <p className="text-xs text-muted-foreground">{p.marca} · #{p.codigo}</p>
                  </div>
                  <span className="shrink-0 text-base font-bold text-foreground">{p.cantidad}</span>
                </div>
              ))}
              {(!selected?.productos || selected.productos.length === 0) && (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">Sin detalle de productos.</p>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
