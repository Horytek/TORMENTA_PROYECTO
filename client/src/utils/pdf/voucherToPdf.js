import jsPDF from 'jspdf';

/**
 * Exporta un cuerpo de voucher (texto monoespaciado) a PDF.
 * - Usa fuente 'courier' para respetar alineación del recibo.
 * - Maneja saltos de página si supera el alto del documento.
 *
 * @param {string} content Texto completo con saltos de línea (\n)
 * @param {object} [options]
 * @param {string} [options.filename] Nombre del archivo PDF
 * @param {number} [options.marginLeft] Margen izquierdo en mm
 * @param {number} [options.marginTop] Margen superior en mm
 * @param {number} [options.fontSize] Tamaño de fuente en pt
 * @param {number} [options.lineHeight] Alto de línea en mm
 */
export function exportVoucherToPdf(content, options = {}) {
  const {
    filename = 'comprobante.pdf',
    marginLeft = 5,
    marginRight = 5,
    marginTop = 8,
    marginBottom = 8,
    fontSize = 10,
    lineHeight = 4.2,
    receiptWidth = 80,
    openInNewTab = false,
  } = options;

  const lines = (content || '').split('\n');
  const estimatedHeight = Math.max(
    marginTop + marginBottom + lines.length * lineHeight,
    120
  );

  const doc = new jsPDF({
    unit: 'mm',
    format: [receiptWidth, estimatedHeight],
    orientation: 'portrait',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - marginLeft - marginRight;

  // Fuente monoespaciada para conservar columnas
  doc.setFont('courier', 'normal');
  doc.setFontSize(fontSize);

  let cursorY = marginTop;
  const cursorX = marginLeft;

  lines.forEach((line) => {
    const text = line || '';
    const wrappedLines = doc.splitTextToSize(text, usableWidth);
    wrappedLines.forEach((wrapped) => {
      if (cursorY + lineHeight > pageHeight - marginBottom) {
        doc.addPage();
        cursorY = marginTop;
      }
      doc.text(wrapped, cursorX, cursorY);
      cursorY += lineHeight;
    });
  });

  if (openInNewTab && typeof window !== 'undefined' && window?.open) {
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(filename);
  }
}
