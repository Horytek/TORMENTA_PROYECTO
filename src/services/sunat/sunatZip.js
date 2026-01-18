import JSZip from 'jszip';

export async function zipXml({ fileName, xml }) {
  if (!fileName) throw new Error('fileName es requerido');
  if (!xml) throw new Error('xml es requerido');

  const zip = new JSZip();
  zip.file(`${fileName}.xml`, xml);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

export async function unzipSingleFile({ zipBuffer }) {
  const zip = await JSZip.loadAsync(zipBuffer);
  const entries = Object.keys(zip.files).filter((name) => !zip.files[name].dir);
  if (entries.length === 0) throw new Error('ZIP vacío');
  if (entries.length > 1) {
    // Para CDR suele venir 1 XML, pero no asumimos; devolvemos el primero.
  }
  const first = entries[0];
  const content = await zip.files[first].async('nodebuffer');
  return { fileName: first, content };
}
