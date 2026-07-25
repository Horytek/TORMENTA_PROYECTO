// ─────────────────────────────────────────────────────────────────
// Comprobante interno de devolución en PDF (jspdf + autotable, ya
// instalados para reportes). Documento simple para entregar al cliente
// mientras el backend no emita nota de crédito SUNAT.
// ─────────────────────────────────────────────────────────────────
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Devolucion } from "../types";
import { DESTINO_LABELS, ESTADO_META, MOTIVO_LABELS, RESOLUCION_LABELS, soles } from "../config/catalog";

export function printDevolucion(d: Devolucion) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(`Devolución ${d.codigo}`, 14, 18);
  doc.setFontSize(9);
  doc.text(
    [
      `Venta original: ${d.num_comprobante || `#${d.id_venta}`}`,
      `Cliente: ${d.nom_cliente || "Cliente general"}`,
      `Sucursal: ${d.nombre_sucursal || "—"} · Fecha: ${new Date(d.fecha).toLocaleString("es-PE")}`,
      `Estado: ${ESTADO_META[d.estado]?.label} · Resolución: ${RESOLUCION_LABELS[d.resolucion]}`,
    ],
    14,
    26
  );

  autoTable(doc, {
    startY: 46,
    head: [["Cant.", "Producto", "Motivo", "Destino", "Importe"]],
    body: d.items.map((i) => [
      String(i.cantidad),
      i.descripcion,
      MOTIVO_LABELS[i.motivo],
      DESTINO_LABELS[i.destino],
      soles(i.importe),
    ]),
    foot: [["", "", "", "Total", soles(d.total)]],
    styles: { fontSize: 8 },
  });

  doc.save(`${d.codigo}.pdf`);
}
