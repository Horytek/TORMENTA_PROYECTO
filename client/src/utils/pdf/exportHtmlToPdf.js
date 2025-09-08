// Carga perezosa y cacheada de html2pdf
let html2pdfLib = null;

async function getHtml2Pdf() {
  if (html2pdfLib) return html2pdfLib;
  // @vite-ignore evita prebundling conflictivo
  html2pdfLib = (await import(/* @vite-ignore */ 'html2pdf.js')).default;
  return html2pdfLib;
}

/**
 * exportHtmlToPdf(htmlString, filename, optionsExtra?)
 */
export async function exportHtmlToPdf(htmlContent, filename = 'documento.pdf', extra = {}) {
  const html2pdf = await getHtml2Pdf();
  const baseOptions = {
    margin: [10,10],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    ...extra
  };

  const instance = html2pdf().set(baseOptions).from(htmlContent);
  if (extra.onInstance) extra.onInstance(instance); // hook opcional
  await instance.save();
}