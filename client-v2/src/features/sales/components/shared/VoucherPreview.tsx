import { useQuery } from "@tanstack/react-query";
import { Printer, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import type { Venta } from "@/features/sales/types";
import { getNegocio } from "@/features/settings/api/settings";
import { useConfigStore } from "@/store/useConfigStore";

// ─────────────────────────────────────────────────────────────────
// VoucherPreview — Vista previa del comprobante para imprimir
// ─────────────────────────────────────────────────────────────────

interface VoucherPreviewProps {
  open: boolean;
  venta: Venta;
  onClose: () => void;
}

export function VoucherPreview({ open, venta, onClose }: VoucherPreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  const { data: negocio } = useQuery({
    queryKey: ["negocio"],
    queryFn: getNegocio,
    staleTime: Infinity,
  });

  const igv_incluido = useConfigStore((s) => s.igv_incluido);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg border-border bg-card max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
            <span className="text-base font-bold">Comprobante — {venta.num_comprobante}</span>
          </DialogTitle>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" /> Imprimir
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-3.5 w-3.5 mr-1" /> Cerrar
            </Button>
          </div>
        </DialogHeader>

        {/* Papel del comprobante */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-4 print:border-none print:rounded-none print:p-0">
          {negocio ? (
            <VoucherContent venta={venta} negocio={negocio} igv_incluido={igv_incluido} />
          ) : (
            <div className="flex items-center justify-center h-40">
              <Spinner size="md" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────
// VoucherContent — Componente imprimible (sin Dialog)
// ─────────────────────────────────────────────────────────────────
function VoucherContent({
  venta,
  negocio,
  igv_incluido,
}: {
  venta: Venta;
  negocio: Awaited<ReturnType<typeof getNegocio>>;
  igv_incluido: boolean;
}) {
  const total = Number(venta.total_t ?? 0);
  const igv = Number(venta.igv ?? 0);

  // Base dependiendo de cómo se calculó el IGV
  const base = igv_incluido
    ? total / 1.18
    : total - igv;

  const fVenta = venta.f_venta ?? venta.fecha_iso ?? new Date().toISOString();
  const fecha = new Date(fVenta).toLocaleDateString("es-PE", {
    year: "numeric", month: "long", day: "numeric",
  });
  const hora = new Date(fVenta).toLocaleTimeString("es-PE", {
    hour: "2-digit", minute: "2-digit",
  });

  const totalEnLetras = numeroALetras(total);

  // Parsear método de pago (ej: "EFECTIVO:50,YAPE:30")
  const metodosPago = parseMetodoPago(venta.metodo_pago);

  const descuento = Number(venta.descuento_venta ?? venta.descuento ?? 0);
  const recibido = Number(venta.recibido ?? 0);
  const vuelto = Number(venta.vuelto ?? 0);

  const tipoDoc =
    venta.id_comprobante === "Factura"
      ? "RUC"
      : venta.id_comprobante === "Boleta"
      ? "DNI"
      : null;

  const nombreNegocio = negocio?.nombre_negocio ?? "Empresa";
  const ruc = negocio?.ruc ?? "";
  const direccion = negocio?.direccion ?? "";
  const telefono = negocio?.telefono ?? "";
  const distrito = negocio?.distrito ?? "";
  const provincia = negocio?.provincia ?? "";

  return (
    <div
      className="text-zinc-900 dark:text-zinc-100 select-none"
      style={{ fontFamily: "monospace", fontSize: 11, lineHeight: 1.4 }}
    >
      {/* ── Header empresa ── */}
      <div className="text-center mb-3">
        {negocio?.logotipo_url && (
          <img
            src={negocio.logotipo_url}
            alt="Logo"
            className="mx-auto h-12 w-auto mb-1 object-contain"
          />
        )}
        <p className="font-bold text-sm">{nombreNegocio}</p>
        {direccion && <p className="text-[9px]">{direccion}</p>}
        {(distrito || provincia) && (
          <p className="text-[9px]">{[distrito, provincia].filter(Boolean).join(", ")}</p>
        )}
        {ruc && <p className="text-[9px]">RUC: {ruc}</p>}
        {telefono && <p className="text-[9px]">Telf: {telefono}</p>}
      </div>

      <Separator className="my-1 border-zinc-400" />

      {/* ── Comprobante ── */}
      <div className="text-center my-1">
        <p className="font-bold text-sm">
          {venta.id_comprobante?.toUpperCase() ?? "COMPROBANTE"}
        </p>
        <p className="text-[9px]">{venta.num_comprobante}</p>
      </div>

      <Separator className="my-1 border-zinc-400" />

      {/* ── Fecha, sucursal, cajero ── */}
      <p className="text-[9px]">Fecha: {fecha} {hora}</p>
      {venta.nombre_sucursal && (
        <p className="text-[9px]">Tienda: {venta.nombre_sucursal}</p>
      )}
      {venta.nom_usuario && (
        <p className="text-[9px]">Vendedor: {venta.nom_usuario}</p>
      )}

      <Separator className="my-1 border-zinc-400" />

      {/* ── Cliente ── */}
      {venta.nom_cliente ? (
        <>
          <p className="text-[9px]">Cliente: {venta.nom_cliente}</p>
          {venta.documento_cliente && (
            <p className="text-[9px]">
              {tipoDoc ?? "Doc"}: {venta.documento_cliente}
            </p>
          )}
          {venta.direccion_cliente && (
            <p className="text-[9px]">Dirección: {venta.direccion_cliente}</p>
          )}
        </>
      ) : (
        <p className="text-[9px] italic">Cliente: Venta al público</p>
      )}

      <Separator className="my-1 border-zinc-400" />

      {/* ── Encabezados columna ── */}
      <div className="flex text-[8px] text-zinc-500 uppercase mb-0.5">
        <span className="flex-1">Descripción</span>
        <span className="w-8 text-right">Cant.</span>
        <span className="w-10 text-right">P.Unit</span>
        <span className="w-12 text-right">Total</span>
      </div>
      <Separator className="my-0.5 border-zinc-300" />

      {/* ── Detalles ── */}
      {/* Backend retorna: nombre, precio, subtotal, nombre_talla, nombre_tonalidad */}
      {venta.detalles?.map((det: any, i: number) => {
        const nombre = (det.nombre as string) ?? (det.descripcion as string) ?? "—";
        const cantidad = Number(det.cantidad ?? 0);
        const precioUnit = Number(det.precio ?? det.precio_unitario ?? 0);
        const precioTotal = Number(det.subtotal ?? det.precio_total ?? 0);
        const nombreTalla = det.nombre_talla as string | undefined;
        const nombreTonalidad = det.nombre_tonalidad as string | undefined;

        const attrs: string[] = [];
        if (nombreTalla && nombreTalla !== "U") attrs.push(`T:${nombreTalla}`);
        if (nombreTonalidad && nombreTonalidad !== "Sin Tonalidad")
          attrs.push(`C:${nombreTonalidad}`);
        const attrSuffix = attrs.length > 0 ? ` [${attrs.join(" ")}]` : "";

        return (
          <div key={i} className="text-[9px]">
            <div className="flex">
              <span className="flex-1 truncate">
                {nombre}
                {attrSuffix}
              </span>
              <span className="w-8 text-right">{cantidad}</span>
              <span className="w-10 text-right tabular-nums">
                {precioUnit.toFixed(2)}
              </span>
              <span className="w-12 text-right tabular-nums">
                {precioTotal.toFixed(2)}
              </span>
            </div>
          </div>
        );
      })}

      <Separator className="my-1 border-zinc-400" />

      {/* ── Totales ── */}
      <div className="space-y-0.5">
        <div className="flex justify-between text-[9px]">
          <span>Op. Gravada S/</span>
          <span className="tabular-nums">{base.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[9px]">
          <span>Exonerado S/</span>
          <span className="tabular-nums">0.00</span>
        </div>
        <div className="flex justify-between text-[9px]">
          <span>IGV 18% S/</span>
          <span className="tabular-nums">{igv.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[9px]">
          <span>ICBPER S/</span>
          <span className="tabular-nums">0.00</span>
        </div>
        {descuento > 0 && (
          <div className="flex justify-between text-[9px]">
            <span>Descuento S/</span>
            <span className="tabular-nums">{descuento.toFixed(2)}</span>
          </div>
        )}
        <Separator className="border-zinc-400" />
        <div className="flex justify-between font-bold text-sm">
          <span>Importe Total S/</span>
          <span className="tabular-nums">{total.toFixed(2)}</span>
        </div>
      </div>

      <Separator className="my-1 border-zinc-400" />

      {/* ── Total en letras ── */}
      <p className="text-[9px] text-center italic">SON: {totalEnLetras}</p>
      <p className="text-[9px] text-center">Cond. de Venta: Contado</p>

      {/* ── Método(s) de pago ── */}
      {metodosPago.map((m, i) => (
        <p key={i} className="text-[9px] text-center">
          {m.tipo === "EFECTIVO"
            ? `Efectivo: S/ ${m.monto.toFixed(2)}`
            : m.tipo === "MIXTO"
            ? `Mixto: S/ ${m.monto.toFixed(2)}`
            : `${m.tipo}: S/ ${m.monto.toFixed(2)}`}
        </p>
      ))}

      {recibido > 0 && (
        <>
          <p className="text-[9px] text-center">
            Recibido: S/ {recibido.toFixed(2)}
          </p>
          <p className="text-[9px] text-center">
            Vuelto: S/ {vuelto.toFixed(2)}
          </p>
        </>
      )}

      <Separator className="my-1 border-zinc-400" />

      {/* ── Observación ── */}
      {venta.observacion && (
        <p className="text-[9px] italic">Obs: {venta.observacion}</p>
      )}

      {/* ── SUNAT ── */}
      <div className="mt-2 text-center">
        <p className="text-[7px] text-zinc-500 leading-tight">
          Representación impresa del comprobante electrónico
          <br />
          Emitido por SUNAT — {venta.estado_sunat ?? "Aceptado"}
        </p>
      </div>

      {/* ── Footer ── */}
      <div className="mt-2 text-center">
        <p className="text-[7px] text-zinc-400">Gracias por su preferencia</p>
        <p className="text-[7px] text-zinc-400">No se aceptan devoluciones</p>
      </div>

      {/* ── Print styles ── */}
      <style>{`
        @media print {
          .voucher-paper {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function parseMetodoPago(metodoPago?: string): { tipo: string; monto: number }[] {
  if (!metodoPago) return [{ tipo: "EFECTIVO", monto: 0 }];
  const upper = metodoPago.toUpperCase();
  if (upper === "EFECTIVO" || upper === "TARJETA" || upper === "YAPE" || upper === "PLIN" || upper === "TRANSFERENCIA") {
    return [{ tipo: upper, monto: 0 }];
  }
  if (metodoPago.includes(":")) {
    return metodoPago.split(",").map((part) => {
      const idx = part.indexOf(":");
      const tipo = part.slice(0, idx).trim().toUpperCase();
      const monto = parseFloat(part.slice(idx + 1).trim()) || 0;
      return { tipo, monto };
    });
  }
  return [{ tipo: upper, monto: 0 }];
}

// Convierte un número a su representación en palabras en español (soles).
function numeroALetras(numero: number): string {
  const unidades = [
    "", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE",
  ];
  const decenas = [
    "", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA",
    "SESENTA", "SETENTA", "OCHENTA", "NOVENTA",
  ];
  const centenas = [
    "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS",
    "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS",
  ];

  if (numero === 0) return "CERO CON 00/100";

  const entero = Math.floor(numero);
  const decena = Math.floor((entero % 100) / 10);
  const unidad = entero % 10;
  const centena = Math.floor(entero / 100);

  let letras = "";

  if (centena > 0) {
    if (centena === 1 && decena === 0 && unidad === 0) {
      letras += "CIEN ";
    } else {
      letras += centenas[centena] + " ";
    }
  }

  if (decena === 1) {
    // 10–19
    const especiales = [
      "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE",
      "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE",
    ];
    letras += especiales[unidad] + " ";
  } else {
    if (decena > 0) letras += decenas[decena] + " ";
    if (decena > 0 && unidad > 0) letras += "Y ";
    if (unidad > 0) letras += unidades[unidad] + " ";
  }

  const decimal = Math.round((numero - entero) * 100);
  return `${letras.trim()} CON ${decimal.toString().padStart(2, "0")}/100`;
}
