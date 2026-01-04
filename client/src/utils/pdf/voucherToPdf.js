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
    returnBlobUrl = false,
    logo = null, // Base64 string or URL (if supported by jsPDF environment)
  } = options;

  const lines = (content || '').split('\n');

  // Estimate height - Logo adds space
  const logoHeight = logo ? 25 : 0;
  const estimatedHeight = Math.max(
    marginTop + marginBottom + lines.length * lineHeight + logoHeight,
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

  // Render Logo if exists
  let cursorY = marginTop;
  if (logo) {
    try {
      const imgProps = doc.getImageProperties(logo);
      const imgRatio = imgProps.width / imgProps.height;
      // Max width 60% of receipt, max height 25mm
      const targetWidth = Math.min(usableWidth * 0.6, 40);
      const targetHeight = targetWidth / imgRatio;

      const x = (pageWidth - targetWidth) / 2; // Center
      doc.addImage(logo, 'PNG', x, cursorY, targetWidth, targetHeight);
      cursorY += targetHeight + 2; // Padding
    } catch (e) {
      console.error("Error adding logo to PDF", e);
    }
  }

  // Fuente monoespaciada para conservar columnas
  doc.setFont('courier', 'normal');
  doc.setFontSize(fontSize);

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

  if (returnBlobUrl) {
    return doc.output('bloburl');
  }

  if (openInNewTab && typeof window !== 'undefined' && window?.open) {
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(filename);
  }
}
