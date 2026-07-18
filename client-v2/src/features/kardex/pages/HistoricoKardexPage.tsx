import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileDown,
  Printer,
  Calendar,
  Package,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  getKardexInventarioAlmacenes as getKardexAlmacenes,
  getKardexInventarioDetalleCompleto as getKardexDetalleCompleto,
  type KardexInventarioDetalleMovimiento as KardexDetalleMovimiento,
  type KardexInventarioStockAnterior as KardexStockAnterior,
} from "@/features/kardex-inventario/api/kardexInventario";

import { useUserStore } from "@/store/useUserStore";
import { getEmpresaAccount, type EmpresaAccount } from "@/features/account/api/account";

import { HistoricoKpiCards, type HistoricoKpiData } from "../components/HistoricoKpiCards";
import { HistoricoTable } from "../components/HistoricoTable";

/* ──────────────────────────────────────────────────────────
 * Helpers de fecha
 * ────────────────────────────────────────────────────────── */

function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function mondayOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // lunes como inicio de semana
  const result = new Date(d);
  result.setDate(d.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function sundayOfWeek(d: Date): Date {
  const start = mondayOfWeek(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

/* ──────────────────────────────────────────────────────────
 * Componente principal
 * ────────────────────────────────────────────────────────── */

export default function HistoricoKardexPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const idEmpresa = useUserStore((s) => s.user?.id_empresa);

  const today = useMemo(() => new Date(), []);

  const [fechaInicio, setFechaInicio] = useState<string>(
    () => searchParams.get("fi") ?? toInputDate(mondayOfWeek(today))
  );
  const [fechaFin, setFechaFin] = useState<string>(
    () => searchParams.get("ff") ?? toInputDate(sundayOfWeek(today))
  );
  const [idAlmacen, setIdAlmacen] = useState<string>(
    () => searchParams.get("alm") ?? "%"
  );
  const [generatingPdf, setGeneratingPdf] = useState(false);

  /** Sync URL params. */
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("fi", fechaInicio);
    next.set("ff", fechaFin);
    if (idAlmacen && idAlmacen !== "%") next.set("alm", idAlmacen);
    else next.delete("alm");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicio, fechaFin, idAlmacen]);

  /* Almacenes (filtro). */
  const { data: almacenes = [] } = useQuery({
    queryKey: ["kardex-almacenes"],
    queryFn: getKardexAlmacenes,
  });

  /* Detalle completo (3 endpoints en paralelo). */
  const detalleQuery = useQuery({
    queryKey: ["kardex-historico", id, fechaInicio, fechaFin, idAlmacen],
    queryFn: () =>
      getKardexDetalleCompleto({
        fechaInicio,
        fechaFin,
        idProducto: Number(id),
        idAlmacen: idAlmacen as number | "%",
      }),
    enabled: !!id,
  });

  const transactions = detalleQuery.data?.kardex ?? [];
  const previousTransactions = detalleQuery.data?.previousTransactions ?? [];
  const productoData = detalleQuery.data?.productos?.[0];

  /* Empresa (para PDF). */
  const { data: empresaData } = useQuery({
    queryKey: ["empresa-pdf", idEmpresa],
    queryFn: async (): Promise<EmpresaAccount | null> => {
      if (!idEmpresa) return null;
      return await getEmpresaAccount(idEmpresa);
    },
    enabled: !!idEmpresa,
  });

  /* Logo en base64 para PDF. */
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const fetchLogo = async () => {
      const url = empresaData?.logotipo;
      if (!url) {
        setLogoBase64(null);
        return;
      }
      if (url.startsWith("data:image")) {
        setLogoBase64(url);
        return;
      }
      try {
        const r = await fetch(url);
        const blob = await r.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!cancelled) setLogoBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch {
        if (!cancelled) setLogoBase64(null);
      }
    };
    fetchLogo();
    return () => {
      cancelled = true;
    };
  }, [empresaData]);

  /* ──────────────────────────────────────────────────────────
   * Cálculos KPI
   * ────────────────────────────────────────────────────────── */

  const kpiData = useMemo<HistoricoKpiData>(() => {
    const sortedDesc = [...transactions].sort((a, b) => {
      const [da, ma, ya] = (a.fecha ?? "").split("/");
      const [db, mb, yb] = (b.fecha ?? "").split("/");
      return (
        new Date(`${yb}-${mb}-${db}T${b.hora_creacion ?? "00:00:00"}`).getTime() -
        new Date(`${ya}-${ma}-${da}T${a.hora_creacion ?? "00:00:00"}`).getTime()
      );
    });

    const stockInventario = productoData ? Number(productoData.stock ?? 0) : 0;
    const entradasActual = sortedDesc.reduce((acc, t) => acc + (Number(t.entra) || 0), 0);
    const salidasActual = sortedDesc.reduce((acc, t) => acc + (Number(t.sale) || 0), 0);
    const stockPrev = Math.max(0, stockInventario + salidasActual - entradasActual);

    const prev: KardexStockAnterior = previousTransactions?.[0] ?? {};
    const entradasPrev = Math.max(0, Number(prev.entra) || 0);
    const salidasPrev = Math.max(0, Number(prev.sale) || 0);

    const ventasReales = sortedDesc.filter(
      (t) =>
        !(typeof t.documento === "string" && (t.documento.startsWith("I") || t.documento.startsWith("S"))) &&
        t.nombre !== "INGRESO" &&
        t.nombre !== "SALIDA" &&
        Number(t.sale) > 0
    );

    const lastVenta = [...ventasReales].reverse().find((t) => t.precio);
    const precioUnitActual =
      lastVenta
        ? Number(lastVenta.precio)
        : ventasReales[0]
          ? Number(ventasReales[0].precio)
          : 0;
    const precioUnitPrev = Number(prev.precio) || precioUnitActual;

    const rotacion = entradasActual > 0 ? (salidasActual / entradasActual) * 100 : 0;
    const velocidadVenta =
      salidasActual > 0 && sortedDesc.length > 0
        ? Number((salidasActual / sortedDesc.length).toFixed(1))
        : 0;
    const diasParaAgotar =
      velocidadVenta > 0 ? Math.round(stockInventario / velocidadVenta) : "—";

    const totalIngresos = ventasReales.reduce(
      (acc, t) => acc + (Number(t.sale) || 0) * (Number(t.precio) || 0),
      0
    );

    let porcentajeCrecimiento = "0%";
    if (entradasPrev > 0) {
      porcentajeCrecimiento = `${(((entradasActual - entradasPrev) / entradasPrev) * 100).toFixed(1)}%`;
    } else if (entradasActual > 0) {
      porcentajeCrecimiento = `${(entradasActual * 100).toFixed(1)}%`;
    }

    const countEntradas = sortedDesc.filter((t) => Number(t.entra) > 0).length;
    const countSalidas = sortedDesc.filter((t) => Number(t.sale) > 0).length;

    return {
      stockInventario,
      countEntradas,
      countSalidas,
      entradasActual,
      salidasActual,
      stockPrev,
      entradasPrev,
      salidasPrev,
      rotacion,
      velocidadVenta,
      diasParaAgotar,
      precioUnitActual,
      precioUnitPrev,
      totalIngresos,
      porcentajeCrecimiento,
    };
  }, [transactions, previousTransactions, productoData]);

  /* ──────────────────────────────────────────────────────────
   * Exportar PDF
   * ────────────────────────────────────────────────────────── */

  const handleGeneratePDF = async () => {
    if (!productoData) return;
    setGeneratingPdf(true);
    try {
      const jspdfModule = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const jsPDF = jspdfModule.jsPDF ?? jspdfModule.default ?? jspdfModule;
      const autoTable =
        (autoTableModule as { default?: typeof autoTableModule }).default ?? autoTableModule;

      const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      let cursorY = 14;

      try {
        if (logoBase64) doc.addImage(logoBase64, "PNG", 12, cursorY - 2, 28, 28);
      } catch {
        /* ignore */
      }

      const xText = logoBase64 ? 46 : 16;
      const boxW = 72;
      const boxX = pageWidth - boxW - 16;
      const infoMaxWidth = Math.max(40, boxX - xText - 4);

      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      const titleLines = doc.splitTextToSize(
        empresaData?.nombreComercial || "Horytek",
        infoMaxWidth
      );
      titleLines.forEach((line: string) => {
        doc.text(line, xText, cursorY);
        cursorY += 5;
      });
      cursorY += 1;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const direccionLines = doc.splitTextToSize(
        `Central: ${empresaData?.direccion ?? ""}`,
        infoMaxWidth
      );
      direccionLines.forEach((line: string) => {
        doc.text(line, xText, cursorY);
        cursorY += 4;
      });
      const ubicLines = doc.splitTextToSize(
        `${empresaData?.distrito ?? ""} - ${empresaData?.provincia ?? ""} - ${empresaData?.departamento ?? ""}`,
        infoMaxWidth
      );
      ubicLines.forEach((line: string) => {
        doc.text(line, xText, cursorY);
        cursorY += 4;
      });
      doc.text(`TELF: ${empresaData?.telefono ?? ""}`, xText, cursorY);
      cursorY += 4;
      doc.text(`EMAIL: ${empresaData?.email ?? ""}`, xText, cursorY);
      cursorY += 8;

      doc.setDrawColor(80);
      doc.setLineWidth(0.25);
      doc.rect(boxX, 12, boxW, 36);
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.text(
        `RUC ${empresaData?.ruc ?? ""}`,
        boxX + boxW / 2,
        18,
        { align: "center" }
      );
      doc.setFillColor(191, 219, 254);
      doc.rect(boxX, 24, boxW, 11, "F");
      doc.setFontSize(10.5);
      doc.text("HISTÓRICO", boxX + boxW / 2, 30, { align: "center" });

      cursorY += 4;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Producto: ${productoData.descripcion}`, 15, cursorY);
      cursorY += 5;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Marca: ${productoData.marca ?? "—"}   COD: ${productoData.codigo}   Stock: ${productoData.stock}`,
        15,
        cursorY
      );
      cursorY += 8;

      const rows = transactions.map((item) => {
        const nombre = item.nombre || "";

        return [
          item.fecha ?? "",
          item.documento ?? "",
          nombre,
          item.entra != null ? String(item.entra) : "0",
          item.sale != null ? String(item.sale) : "0",
          item.stock != null ? String(item.stock) : "",
          item.precio != null ? String(item.precio) : "",
          (item.glosa ?? "").replace(/\r?\n/g, " "),
        ];
      });

      autoTable(doc, {
        head: [["Fecha", "Documento", "Nombre", "Entra", "Sale", "Stock", "Precio", "Glosa"]],
        body: rows,
        startY: cursorY,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [191, 219, 254], textColor: [15, 23, 42], fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: 24 },
          1: { cellWidth: 36 },
          2: { cellWidth: 46 },
          3: { cellWidth: 18, halign: "right" },
          4: { cellWidth: 18, halign: "right" },
          5: { cellWidth: 18, halign: "right" },
          6: { cellWidth: 20, halign: "right" },
          7: { cellWidth: 46 },
        },
        tableWidth: "auto",
      });

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(
          `Página ${i} de ${totalPages}`,
          pageWidth - 20,
          doc.internal.pageSize.getHeight() - 10,
          { align: "right" }
        );
      }

      doc.save(`kardex_movimientos_${productoData.codigo}.pdf`);
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("Error al generar PDF (ver consola)");
    } finally {
      setGeneratingPdf(false);
    }
  };

  /* ──────────────────────────────────────────────────────────
   * Render
   * ────────────────────────────────────────────────────────── */

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6 animate-fade-in">
      {/* Header superior */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Volver"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Historial del Producto
            </h1>
            <p className="text-sm text-muted-foreground">
              Analiza el movimiento y trazabilidad del inventario
            </p>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <Button
            onClick={handleGeneratePDF}
            disabled={!productoData || generatingPdf}
            variant="destructive"
            className="bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300"
          >
            {generatingPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Printer className="mr-2 h-4 w-4" />
            )}
            Exportar PDF
          </Button>

          <Select value={idAlmacen} onValueChange={setIdAlmacen}>
            <SelectTrigger className="w-full sm:w-60">
              <SelectValue placeholder="Almacén" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="%">Todos los almacenes</SelectItem>
              {almacenes.map((a) => (
                <SelectItem key={a.id_almacen} value={String(a.id_almacen)}>
                  {a.nom_almacen}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tarjeta producto + fechas */}
      <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-xl font-bold text-blue-600 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300"
            )}
          >
            {productoData ? productoData.descripcion.charAt(0) : <Package className="h-6 w-6" />}
          </div>
          <div>
            {detalleQuery.isLoading && !productoData ? (
              <Skeleton className="mb-2 h-6 w-64" />
            ) : (
              <h2 className="text-lg font-bold">
                {productoData?.descripcion ?? "Producto no encontrado"}
              </h2>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Código:
                </span>
                <span className="num rounded bg-muted px-1.5 py-0.5 font-mono">
                  {productoData?.codigo ?? "—"}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Stock:
                </span>
                <span className="num font-bold text-blue-600">
                  {productoData
                    ? `${Number(productoData.stock ?? 0).toLocaleString("es-PE")} UND`
                    : "—"}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Marca:
                </span>
                <span className="font-medium">{productoData?.marca ?? "—"}</span>
              </span>
              {previousTransactions[0] && (
                <Badge variant="muted" className="text-[10px]">
                  {previousTransactions[0].numero} movs. previos
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Filtro fechas */}
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row sm:items-center">
          <span className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Rango de fechas
          </span>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="h-9 w-full sm:w-44"
            />
            <span className="text-xs text-muted-foreground">→</span>
            <Input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="h-9 w-full sm:w-44"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <HistoricoKpiCards data={kpiData} />

      {/* Tabla */}
      {detalleQuery.isLoading ? (
        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : detalleQuery.isError ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          No se pudo cargar el histórico. Verifica el id del producto y el rango de fechas.
        </div>
      ) : (
        <HistoricoTable transactions={transactions as KardexDetalleMovimiento[]} />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 * Local Input (re-export para evitar imports extra)
 * ────────────────────────────────────────────────────────── */