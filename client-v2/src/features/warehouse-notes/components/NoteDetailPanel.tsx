import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNegocio } from "@/features/settings/api/settings";
import type { WarehouseNote, NoteKind } from "../types";

interface NoteDetailPanelProps {
  note: WarehouseNote;
  tipo: NoteKind;
  canGeneratePdf: boolean;
}

export function NoteDetailPanel({ note, tipo, canGeneratePdf }: NoteDetailPanelProps) {
  const [generating, setGenerating] = useState(false);
  const detalles = note.detalles ?? [];

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
      const isIngreso = tipo === "ingreso";

      doc.setFont("helvetica", "bold").setFontSize(13);
      doc.text(negocio?.nombre_negocio ?? "Empresa", 15, 18);
      doc.setFont("helvetica", "normal").setFontSize(9);
      if (negocio?.ruc) doc.text(`RUC: ${negocio.ruc}`, 15, 24);
      if (negocio?.direccion) doc.text(negocio.direccion, 15, 29);

      doc.setFont("helvetica", "bold").setFontSize(12);
      doc.text(isIngreso ? "NOTA DE INGRESO" : "NOTA DE SALIDA", pageWidth - 15, 18, { align: "right" });
      doc.setFont("helvetica", "normal").setFontSize(10);
      doc.text(note.documento || "SIN DOC", pageWidth - 15, 24, { align: "right" });

      let y = 40;
      doc.setDrawColor(220).line(15, y - 5, pageWidth - 15, y - 5);
      doc.setFont("helvetica", "bold").setFontSize(9);
      doc.text(isIngreso ? "PROVEEDOR:" : "DESTINATARIO:", 15, y);
      doc.setFont("helvetica", "normal");
      doc.text(note.proveedor || "-", 55, y);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text("CONCEPTO:", 15, y);
      doc.setFont("helvetica", "normal");
      doc.text(note.concepto || "-", 55, y);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text("FECHA:", 15, y);
      doc.setFont("helvetica", "normal");
      doc.text(note.fecha || "-", 55, y);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text("USUARIO:", 15, y);
      doc.setFont("helvetica", "normal");
      doc.text(note.usuario || "-", 55, y);
      y += 8;

      const rows = detalles.map((d) => [String(d.codigo), d.marca, d.descripcion, String(d.cantidad), d.unidad]);

      autoTable(doc, {
        head: [["Código", "Marca", "Descripción", "Cant.", "Und."]],
        body: rows,
        startY: y,
        styles: { fontSize: 8, cellPadding: 2.2 },
        headStyles: { fillColor: [191, 219, 254], textColor: [15, 23, 42], fontStyle: "bold" },
        columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 28 }, 2: { cellWidth: "auto" }, 3: { cellWidth: 16, halign: "right" }, 4: { cellWidth: 16 } },
      });

      if (note.observacion) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalY = (doc as any).lastAutoTable?.finalY ?? y + 20;
        doc.setFont("helvetica", "bold").setFontSize(9);
        doc.text("OBSERVACIÓN:", 15, finalY + 8);
        doc.setFont("helvetica", "normal");
        doc.text(doc.splitTextToSize(note.observacion, pageWidth - 30), 15, finalY + 13);
      }

      doc.save(`${note.documento || "nota-almacen"}.pdf`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3 pt-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {detalles.length} {detalles.length === 1 ? "item" : "items"}
        </span>
        {canGeneratePdf && (
          <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={handlePdf} disabled={generating}>
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
            Descargar PDF
          </Button>
        )}
      </div>

      {note.observacion && (
        <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">{note.observacion}</p>
      )}

      <div className="flex flex-col divide-y divide-border/50 rounded-lg border border-border/50">
        {detalles.map((d, i) => (
          <div key={`${d.codigo}-${i}`} className="flex items-center justify-between gap-3 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{d.descripcion}</p>
              <span className="text-xs text-muted-foreground">{d.marca}</span>
            </div>
            <div className="shrink-0 text-right text-sm">
              <span className="font-semibold text-foreground">{d.cantidad}</span>
              <span className="ml-1 text-xs text-muted-foreground">{d.unidad}</span>
            </div>
          </div>
        ))}
        {detalles.length === 0 && (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">Sin items registrados.</p>
        )}
      </div>
    </div>
  );
}
