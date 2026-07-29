import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ExpressSaleDetail } from "../types";

const soles = (n: number) => `S/ ${n.toFixed(2)}`;

export function downloadExpressSalePdf(sale: ExpressSaleDetail, businessName?: string) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(businessName || "Pocket POS", 14, 18);
  doc.setFontSize(9);
  doc.text(
    [
      `Venta #${sale.id}`,
      `Fecha: ${new Date(sale.created_at).toLocaleString("es-PE")}`,
      `Método de pago: ${sale.payment_method}`,
    ],
    14,
    26
  );

  autoTable(doc, {
    startY: 44,
    head: [["Cant.", "Producto", "Precio", "Subtotal"]],
    body: sale.items.map((i) => [String(i.quantity), i.name, soles(i.price), soles(i.price * i.quantity)]),
    foot: [["", "", "Total", soles(sale.total)]],
    styles: { fontSize: 8 },
  });

  doc.save(`venta-${sale.id}.pdf`);
}

export function printExpressSaleTicket(sale: ExpressSaleDetail, businessName?: string) {
  const lines = [
    businessName || "Pocket POS",
    "-".repeat(32),
    `Venta #${sale.id}`,
    new Date(sale.created_at).toLocaleString("es-PE"),
    "-".repeat(32),
    ...sale.items.map((i) => `${i.quantity} x ${i.name}  ${soles(i.price * i.quantity)}`),
    "-".repeat(32),
    `Método de pago: ${sale.payment_method}`,
    `TOTAL: ${soles(sale.total)}`,
  ];

  const win = window.open("", "_blank", "width=320,height=600");
  if (!win) return;
  win.document.write(
    `<pre style="font-family:monospace;font-size:12px;white-space:pre-wrap;">${lines.join("\n")}</pre>`
  );
  win.document.close();
  win.focus();
  win.print();
}
