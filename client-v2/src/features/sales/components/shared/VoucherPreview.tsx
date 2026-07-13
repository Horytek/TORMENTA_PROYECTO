import { Printer, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Venta } from "@/features/sales/types";

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
        <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-6 print:border-none print:rounded-none print:p-0">
          <VoucherContent venta={venta} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────
// VoucherContent — Componente imprimible (sin Dialog)
// ─────────────────────────────────────────────────────────────────
function VoucherContent({ venta }: { venta: Venta }) {
  const fVenta = venta.f_venta ?? venta.fecha_iso ?? new Date().toISOString();
  const fecha = new Date(fVenta).toLocaleDateString("es-PE", {
    year: "numeric", month: "long", day: "numeric",
  });
  const hora = new Date(fVenta).toLocaleTimeString("es-PE", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="text-zinc-900 dark:text-zinc-100 select-none" style={{ fontFamily: "monospace", fontSize: 12 }}>
      {/* Header */}
      <div className="text-center mb-4">
        <p className="font-bold text-base">EMPRESA DEMO S.A.C.</p>
        <p className="text-[10px]">RUC: 20123456789</p>
        <p className="text-[10px]">Av. Ejemplo 123, Lima, Perú</p>
        <p className="text-[10px]">Telf: (01) 234-5678</p>
      </div>

      <Separator className="my-2 border-zinc-400" />

      {/* Tipo + número */}
      <div className="text-center my-2">
        <p className="font-bold text-sm">{(venta.id_comprobante ?? "COMPROBANTE").toUpperCase()}</p>
        <p className="text-[10px]">{venta.num_comprobante}</p>
      </div>

      <Separator className="my-2 border-zinc-400" />

      {/* Fecha/hora */}
      <p className="text-[10px]">Fecha: {fecha} {hora}</p>

      {/* Cliente */}
      {venta.nom_cliente && (
        <>
          <p className="text-[10px]">
            Cliente: {venta.nom_cliente}
          </p>
          {venta.documento_cliente && (
            <p className="text-[10px]">
              {venta.documento_cliente.length === 11 ? "RUC" : "DNI"}: {venta.documento_cliente}
            </p>
          )}
          {venta.direccion_cliente && (
            <p className="text-[10px]">Dirección: {venta.direccion_cliente}</p>
          )}
        </>
      )}
      {!venta.nom_cliente && (
        <p className="text-[10px] italic">Cliente: Venta al público</p>
      )}

      <Separator className="my-2 border-zinc-400" />

      {/* Detalles */}
      <div className="space-y-1">
        {venta.detalles?.map((det, i) => (
          <div key={i} className="text-[10px]">
            <div className="flex justify-between">
              <span className="flex-1">
                {det.cantidad} x {det.descripcion}
              </span>
              <span className="ml-2 tabular-nums">
                S/ {Number(det.precio_total).toFixed(2)}
              </span>
            </div>
            <p className="text-zinc-500 pl-3 text-[9px]">
              S/ {Number(det.precio_unitario).toFixed(2)} c/u
            </p>
          </div>
        ))}
      </div>

      <Separator className="my-2 border-zinc-400" />

      {/* Totales */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px]">
          <span>Subtotal</span>
          <span className="tabular-nums">S/ {(Number(venta.total_t ?? 0) - Number(venta.igv ?? 0)).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>IGV (18%)</span>
          <span className="tabular-nums">S/ {Number(venta.igv ?? 0).toFixed(2)}</span>
        </div>
        <Separator className="border-zinc-400" />
        <div className="flex justify-between font-bold text-sm">
          <span>TOTAL</span>
          <span className="tabular-nums">S/ {Number(venta.total_t ?? 0).toFixed(2)}</span>
        </div>
      </div>

      <Separator className="my-2 border-zinc-400" />

      {/* Método de pago */}
      <p className="text-[10px]">
        Forma de pago: {venta.metodo_pago ?? "Efectivo"}
        {venta.vuelto && venta.vuelto > 0 && (
          <> | Vuelto: S/ {Number(venta.vuelto).toFixed(2)}</>
        )}
      </p>

      {venta.observacion && (
        <p className="text-[10px] mt-1 italic">Obs: {venta.observacion}</p>
      )}

      {/* SUNAT */}
      <div className="mt-4 text-center">
        <p className="text-[8px] text-zinc-500">
          Representación impresa del comprobante electrónico<br />
          Emitido por SUNAT — {venta.estado_sunat ?? "Aceptado"}
        </p>
      </div>
    </div>
  );
}
