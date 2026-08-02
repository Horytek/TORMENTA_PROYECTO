import * as XLSX from "xlsx";

/**
 * Exportación 1-clic para reportes: CSV, Excel y PDF a partir de la misma
 * forma de datos (headers + filas ya formateadas como texto). jsPDF se
 * importa dinámicamente — no tiene sentido cargarlo en el bundle principal
 * si el usuario nunca exporta a PDF, mismo criterio que ya usa `HistoricoKardexPage.tsx`.
 */

const hoy = () => new Date().toISOString().split("T")[0];

export function exportReportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  if (rows.length === 0) return;
  const escapar = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = "data:text/csv;charset=utf-8,﻿" +
    [headers.join(","), ...rows.map((r) => r.map(escapar).join(","))].join("\n");
  const link = document.createElement("a");
  link.href = encodeURI(csv);
  link.download = `${filename}_${hoy()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportReportToExcel(filename: string, sheetName: string, headers: string[], rows: (string | number)[][]): void {
  if (rows.length === 0) return;
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = headers.map((h, i) => ({ wch: Math.max(h.length + 2, ...rows.map((r) => String(r[i] ?? "").length + 2)) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `${filename}_${hoy()}.xlsx`);
}

export async function exportReportToPDF(filename: string, title: string, headers: string[], rows: (string | number)[][]): Promise<void> {
  if (rows.length === 0) return;
  const jspdfModule = await import("jspdf");
  const autoTableModule = await import("jspdf-autotable");
  const jsPDF = (jspdfModule as any).jsPDF ?? (jspdfModule as any).default ?? jspdfModule;
  const autoTable = (autoTableModule as any).default ?? autoTableModule;

  const doc = new jsPDF({ orientation: "l", unit: "mm", format: "a4" });
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generado el ${new Date().toLocaleDateString("es-PE")}`, 14, 20);

  (autoTable as any)(doc, {
    head: [headers],
    body: rows,
    startY: 26,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: "bold" },
  });

  doc.save(`${filename}_${hoy()}.pdf`);
}
