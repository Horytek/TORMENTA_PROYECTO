// Carga perezosa y cacheada de html2pdf
let html2pdfLib = null;
let jsPdfReady = false;

async function ensureJsPdfGlobal() {
  // Asegura que html2pdf encuentre jsPDF en window.jspdf.jsPDF
  if (typeof window === "undefined") return;
  if (jsPdfReady && window?.jspdf?.jsPDF) return;
  const mod = await import(/* @vite-ignore */ 'jspdf');
  const JsPDFCtor = mod.jsPDF || mod.default?.jsPDF || mod.default || mod;
  window.jspdf = window.jspdf || {};
  window.jspdf.jsPDF = JsPDFCtor;
  jsPdfReady = true;
}

async function getHtml2Pdf() {
  if (html2pdfLib) return html2pdfLib;

  await ensureJsPdfGlobal();

  let mod;
  let fn;

  // 1) Intento ESM común
  try {
    mod = await import(/* @vite-ignore */ 'html2pdf.js');
    fn =
      (typeof mod === 'function' ? mod : undefined) ||
      mod?.default?.default ||
      (typeof mod?.default === 'function' ? mod.default : undefined) ||
      (typeof mod?.html2pdf === 'function' ? mod.html2pdf : undefined);
  } catch {
    // ignorar y continuar con fallbacks
  }

  // 2) Fallback al bundle UMD min (expone window.html2pdf)
  if (typeof fn !== 'function') {
    try {
      await import(/* @vite-ignore */ 'html2pdf.js/dist/html2pdf.bundle.min.js');
      fn = typeof window !== 'undefined' ? window.html2pdf : undefined;
    } catch {}
  }

  // 3) Fallback al bundle UMD no min
  if (typeof fn !== 'function') {
    try {
      await import(/* @vite-ignore */ 'html2pdf.js/dist/html2pdf.bundle.js');
      fn = typeof window !== 'undefined' ? window.html2pdf : undefined;
    } catch {}
  }

  // 4) Último intento: global
  if (typeof fn !== 'function') {
    fn = typeof window !== 'undefined' ? window.html2pdf : undefined;
  }

  if (typeof fn !== 'function') {
    // Ayuda para diagnóstico en consola
    console.error('html2pdf module snapshot:', mod);
    throw new Error('No se pudo cargar html2pdf (revisa la dependencia y vite.config).');
  }

  html2pdfLib = fn;
  return html2pdfLib;
}

/**
 * exportHtmlToPdf(htmlString, filename, optionsExtra?)
 */
export async function exportHtmlToPdf(htmlContent, filename = 'documento.pdf', extra = {}) {
  const html2pdf = await getHtml2Pdf();
  const baseOptions = {
    margin: [10, 10],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    ...extra
  };

  try {
    // html2pdf admite ambas órdenes set/from; mantenemos set → from
    const instance = html2pdf().set(baseOptions).from(htmlContent);
    if (extra.onInstance) extra.onInstance(instance);
    await instance.save();
  } catch (e) {
    console.error('exportHtmlToPdf error:', e);
    throw e;
  }
}