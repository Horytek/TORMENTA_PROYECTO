import { useMemo, useState } from "react";
import { Printer, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Barcode from "@/components/ui/Barcode";
import type { ProductVariant } from "../types";

// ─────────────────────────────────────────────────────────────────
// PrintLabelsDialog — Etiquetas térmicas EAN-13 por SKU
// ─────────────────────────────────────────────────────────────────

interface PrintLabelsDialogProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  skus: ProductVariant[];
}

const TAMANOS = {
  "50x30": { label: "50 × 30 mm", width: "50mm", height: "30mm", barHeight: 32, fontSize: 8 },
  "30x20": { label: "30 × 20 mm", width: "30mm", height: "20mm", barHeight: 22, fontSize: 6 },
} as const;

type TamanoKey = keyof typeof TAMANOS;

export default function PrintLabelsDialog({ open, onClose, productName, skus }: PrintLabelsDialogProps) {
  const [tamano, setTamano] = useState<TamanoKey>("50x30");
  const conEan13 = useMemo(() => skus.filter((s) => s.ean13), [skus]);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(() => new Set(conEan13.map((s) => s.id_sku)));

  const toggle = (id_sku: number) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id_sku)) next.delete(id_sku);
      else next.add(id_sku);
      return next;
    });
  };

  const etiquetas = conEan13.filter((s) => seleccionados.has(s.id_sku));
  const cfg = TAMANOS[tamano];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col print:hidden">
        <DialogHeader>
          <DialogTitle>Imprimir etiquetas — {productName}</DialogTitle>
        </DialogHeader>

        {skus.length > conEan13.length && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {skus.length - conEan13.length} variante(s) todavía no tienen EAN-13 asignado.
          </p>
        )}

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Tamaño de etiqueta:</span>
          <Select value={tamano} onValueChange={(v) => setTamano(v as TamanoKey)}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TAMANOS).map(([key, t]) => (
                <SelectItem key={key} value={key}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto rounded-lg border border-border divide-y divide-border/40">
          {conEan13.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Ninguna variante tiene EAN-13 todavía.
            </p>
          ) : (
            conEan13.map((s) => {
              const attrLabel = Object.values(s.attrs || {}).filter(Boolean).join(" / ") || s.sku || `SKU #${s.id_sku}`;
              return (
                <label key={s.id_sku} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-muted/40">
                  <Checkbox checked={seleccionados.has(s.id_sku)} onCheckedChange={() => toggle(s.id_sku)} />
                  <span className="font-medium text-foreground">{attrLabel}</span>
                  <span className="ml-auto font-mono text-[11px] text-muted-foreground">{s.ean13}</span>
                </label>
              );
            })
          )}
        </div>

        <DialogFooter className="border-t border-border pt-4">
          <Button variant="ghost" onClick={onClose}>
            <X className="h-3.5 w-3.5 mr-1" /> Cerrar
          </Button>
          <Button onClick={() => window.print()} disabled={etiquetas.length === 0} className="gap-1.5">
            <Printer className="h-3.5 w-3.5" /> Imprimir ({etiquetas.length})
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Hoja de etiquetas: oculta en pantalla, es lo único visible al imprimir. */}
      <div className="label-sheet hidden print:block">
        {etiquetas.map((s) => {
          const attrLabel = Object.values(s.attrs || {}).filter(Boolean).join(" / ");
          return (
            <div key={s.id_sku} className="label-item" style={{ width: cfg.width, height: cfg.height }}>
              <p className="label-title" style={{ fontSize: cfg.fontSize }}>{productName}</p>
              {attrLabel && <p className="label-attrs" style={{ fontSize: cfg.fontSize - 1 }}>{attrLabel}</p>}
              <Barcode
                value={s.ean13!}
                options={{ format: "EAN13", height: cfg.barHeight, fontSize: cfg.fontSize, margin: 0, width: 1 }}
              />
              {s.precio != null && (
                <p className="label-precio" style={{ fontSize: cfg.fontSize }}>S/ {Number(s.precio).toFixed(2)}</p>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .label-sheet, .label-sheet * { visibility: visible; }
          .label-sheet {
            position: absolute;
            top: 0;
            left: 0;
            display: flex !important;
            flex-wrap: wrap;
            gap: 2mm;
          }
          .label-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            border: 1px dashed #ccc;
            page-break-inside: avoid;
            text-align: center;
          }
          .label-title, .label-attrs, .label-precio {
            margin: 0;
            line-height: 1.1;
            font-family: sans-serif;
          }
        }
      `}</style>
    </Dialog>
  );
}
