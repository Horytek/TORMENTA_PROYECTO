import React, { useEffect, useState } from 'react';
import { Button } from '@heroui/react';
import { useVentaSeleccionadaStore } from '@/store/useVentaTable';
import { useUserStore } from '@/store/useStore';
import { getEmpresaDataByUser } from '@/services/empresa.services';
import { exportVoucherToPdf } from '@/utils/pdf/voucherToPdf';

// Helpers tomados de Voucher.jsx para mantener el mismo cuerpo
function centerText(text, lineWidth = 34) {
  const wrapText = (t, maxWidth) => {
    let lines = [];
    while ((t || '').length > maxWidth) {
      let cutIndex = t.substring(0, maxWidth).lastIndexOf(' ');
      if (cutIndex === -1) cutIndex = maxWidth;
      lines.push(t.substring(0, cutIndex).trim());
      t = t.substring(cutIndex).trim();
    }
    lines.push(t || '');
    return lines;
  };
  const centerLine = (line, width) => {
    const spaces = Math.max(0, Math.floor((width - (line || '').length) / 2));
    return ' '.repeat(spaces) + (line || '');
  };
  const lines = wrapText(text, lineWidth);
  return lines.map(line => centerLine(line, lineWidth)).join('\n');
}

function leftAlignText(text, lineWidth = 34) {
  const wrapText = (t, maxWidth) => {
    let lines = [];
    while ((t || '').length > maxWidth) {
      let cutIndex = t.substring(0, maxWidth).lastIndexOf(' ');
      if (cutIndex === -1) cutIndex = maxWidth;
      lines.push(t.substring(0, cutIndex).trim());
      t = t.substring(cutIndex).trim();
    }
    lines.push(t || '');
    return lines;
  };
  const lines = wrapText(text, lineWidth);
  return lines.map(line => (line || '').padEnd(lineWidth, ' ')).join('\n');
}

function wrapText(text, maxWidth) {
  if (!text || typeof text !== 'string') return [''];
  let lines = [];
  let t = text;
  while (t.length > maxWidth) {
    let cutIndex = t.substring(0, maxWidth).lastIndexOf(' ');
    if (cutIndex === -1) cutIndex = maxWidth;
    lines.push(t.substring(0, cutIndex).trim());
    t = t.substring(cutIndex).trim();
  }
  lines.push(t);
  return lines;
}

function formatDetail(nombre, cantidad, precio, subTotal) {
  const nombreWidth = 10;
  const cantidadWidth = 5;
  const precioWidth = 8;
  const totalWidth = 8;
  const nombreLines = wrapText(nombre || '', nombreWidth);

  let formattedDetail = '';
  nombreLines.forEach((line, index) => {
    if (index === 0) {
      const formattedNombre = (line || '').padEnd(nombreWidth, ' ').substring(0, nombreWidth);
      const formattedCantidad = String(cantidad ?? 0).padStart(cantidadWidth, ' ').substring(0, cantidadWidth);
      const formattedPrecio = Number(precio ?? 0).toFixed(2).padStart(precioWidth, ' ').substring(0, precioWidth);
      const formattedTotal = Number(subTotal ?? 0).toFixed(2).padStart(totalWidth, ' ').substring(0, totalWidth);
      formattedDetail += `${formattedNombre} ${formattedCantidad} ${formattedPrecio} ${formattedTotal}\n`;
    } else {
      const formattedNombre = (line || '').padEnd(nombreWidth, ' ').substring(0, nombreWidth);
      const spacesForOtherColumns = ' '.repeat(cantidadWidth + precioWidth + totalWidth + 2);
      formattedDetail += `${formattedNombre}${spacesForOtherColumns}\n`;
    }
  });

  return formattedDetail;
}

function rightAlignText(text) {
  const lineWidth = 34;
  const t = String(text ?? '');
  const spaces = Math.max(0, lineWidth - t.length);
  return ' '.repeat(spaces) + t;
}

function numeroALetras(numero) {
  const unidades = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const decenas = ["", "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE", "VEINTE", "VEINTIUNO", "VEINTIDOS", "VEINTITRES", "VEINTICUATRO", "VEINTICINCO", "VEINTISEIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE"];
  const decenasDecenas = ["", "", "VEINTI", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const centenas = ["", "CIEN", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];
  if (!numero) return "CERO";
  let letras = '';
  const entero = Math.floor(numero);
  const centena = Math.floor(entero / 100);
  const decena = Math.floor((entero % 100) / 10);
  const unidad = entero % 10;
  if (centena > 0) {
    if (centena === 1 && (decena > 0 || unidad > 0)) letras += "CIENTO ";
    else letras += (centenas[centena] || '') + " ";
  }
  if (decena > 1) {
    letras += (decenasDecenas[decena] || '') + " ";
    if (unidad > 0) letras += (unidades[unidad] || '');
  } else if (decena === 1) {
    letras += decenas[10 + unidad];
  } else {
    letras += unidades[unidad];
  }
  const decimal = Math.round((numero - entero) * 100);
  if (decimal > 0) letras += " CON " + decimal + "/100";
  return letras.trim();
}

async function generateReceiptContent(datosVentaComprobante, datosVenta, comprobante1, observacion, nombre, empresaData) {
  const hora_impresion = new Date().toLocaleTimeString('es-PE', { hour12: false });
  const hora_creacion = datosVentaComprobante?.hora_creacion || '';
  const totalT = Number(datosVentaComprobante?.total || 0);
  const igv = Number(datosVentaComprobante?.igv || 0);
  const descuentoVenta = Number(datosVentaComprobante?.descuento || 0);
  const recibido = Number(datosVentaComprobante?.recibido || 0);
  const vuelto = Number(datosVentaComprobante?.vuelto || 0);
  const totalEnLetras = numeroALetras(totalT) + ' SOLES';

  let content = '';
  const appendContent = (line) => {
    if (Array.isArray(line)) content += line.join('\n') + '\n';
    else content += (line || '') + '\n';
  };

  appendContent(centerText(empresaData?.nombreComercial || ''));
  if (empresaData?.ruc) appendContent(centerText('RUC: ' + empresaData.ruc));
  appendContent(centerText(empresaData?.razonSocial || ''));
  appendContent(centerText(empresaData?.address?.direccion || ''));
  appendContent(centerText('=============================='));
  appendContent(centerText('** ' + ((datosVentaComprobante?.comprobante_pago || datosVenta?.comprobante_pago || '').toUpperCase() + ': ' + (comprobante1?.nuevoNumComprobante || 'N/A')) + ' **'));
  appendContent(centerText('=============================='));
  appendContent('==================================');
  if (datosVentaComprobante?.fecha) appendContent('Fecha de Emisión: ' + datosVentaComprobante.fecha);
  appendContent('');
  if (datosVenta?.direccion) {
    appendContent(leftAlignText('Dirección: ' + datosVenta.direccion));
    appendContent('');
  }
  if (datosVenta?.sucursal) appendContent(leftAlignText('Sucursal: ' + datosVenta.sucursal));
  if (datosVenta?.ubicacion) {
    appendContent(leftAlignText('Dirección: ' + datosVenta.ubicacion));
    appendContent('');
  }
  if (datosVenta?.nombre_sucursal) appendContent(leftAlignText('Sucursal: ' + datosVenta.nombre_sucursal));
  appendContent('==================================');
  if (datosVentaComprobante?.nombre_cliente) appendContent(leftAlignText('CLIENTE: ' + datosVentaComprobante.nombre_cliente));
  if (datosVentaComprobante?.documento_cliente) appendContent('RUC/DNI: ' + datosVentaComprobante.documento_cliente);
  if (datosVentaComprobante?.direccion_cliente) {
    appendContent(leftAlignText(datosVentaComprobante.direccion_cliente));
    appendContent('');
  }
  appendContent('==================================');
  if (observacion?.observacion) appendContent(leftAlignText('Observacion: ' + observacion.observacion));
  appendContent('==================================');
  appendContent('Descrip      Cant   P.Unit   TOTAL');
  appendContent('==================================');
  (datosVentaComprobante?.detalles || []).forEach(detalle => {
    appendContent(formatDetail(detalle.nombre, detalle.cantidad, detalle.precio, detalle.sub_total));
  });
  appendContent('==================================');
  appendContent(rightAlignText('Total Original S/: ' + totalT.toFixed(2)));
  appendContent(rightAlignText('DESCUENTO S/: ' + descuentoVenta.toFixed(2)));
  appendContent(rightAlignText('OP.GRAVADA S/: ' + (totalT - igv).toFixed(2)));
  appendContent(rightAlignText('Exonerado S/: 0.00'));
  appendContent(rightAlignText('IGV. 18.00% S/: ' + igv.toFixed(2)));
  appendContent(rightAlignText('ICBPER S/: 0.00'));
  appendContent(rightAlignText('Importe Total S/: ' + totalT.toFixed(2)));
  appendContent('');
  appendContent(centerText('SON: ' + totalEnLetras));
  appendContent(centerText('Cond. de Venta: Contado'));
  appendContent(centerText('Forma Pago: ' + (datosVentaComprobante?.formadepago || 'N/A')));
  appendContent(centerText('Recibido: S/' + recibido.toFixed(2)));
  appendContent(centerText('Vuelto: S/' + vuelto.toFixed(2)));
  appendContent(centerText('Peso: Kg 0.00'));
  appendContent('');
  appendContent(centerText('Fec.Regist: ' + (datosVentaComprobante?.fecha || 'N/A')));
  appendContent(centerText('Hora creación: ' + hora_creacion));
  appendContent(centerText('Hora impresión: ' + hora_impresion));
  appendContent('');
  appendContent(centerText('Gracias por su preferencia'));
  appendContent(centerText('¡Vuelva Pronto!'));
  appendContent(centerText('No se aceptan devoluciones'));
  appendContent('==================================');
  appendContent(centerText('Generado desde el Sistema'));
  appendContent(centerText('de Horytek Negocios'));
  appendContent(leftAlignText('Un Producto de ' + (empresaData?.nombreComercial || '')));
  appendContent('==================================');
  return content;
}

// Componente que muestra el voucher y permite exportar/visualizar en PDF
const VoucherPdf = ({ datosVentaComprobante, datosVenta }) => {
  const comprobante1 = useVentaSeleccionadaStore(state => state.comprobante1);
  const observacion = useVentaSeleccionadaStore(state => state.observacion);
  const nombre = useUserStore(state => state.nombre);
  const [content, setContent] = useState('');
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    const build = async () => {
      const empresaData = await getEmpresaDataByUser(nombre);
      const text = await generateReceiptContent(
        datosVentaComprobante,
        datosVenta,
        comprobante1,
        observacion,
        nombre,
        empresaData
      );
      setContent(text);
      if (empresaData?.logotipo) {
        setLogoUrl(empresaData.logotipo);
      }
    };
    build();
  }, [datosVentaComprobante, datosVenta, comprobante1, observacion, nombre]);

  const getBase64ImageFromUrl = async (imageUrl) => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error("Error converting image to base64", e);
      return null;
    }
  };

  const downloadPdf = async () => {
    if (!content) return;
    let logoBase64 = null;
    if (logoUrl) {
      logoBase64 = await getBase64ImageFromUrl(logoUrl);
    }
    exportVoucherToPdf(content, { filename: 'comprobante.pdf', logo: logoBase64 });
  };

  const viewPdf = async () => {
    if (!content) return;
    let logoBase64 = null;
    if (logoUrl) {
      logoBase64 = await getBase64ImageFromUrl(logoUrl);
    }
    exportVoucherToPdf(content, { filename: 'comprobante.pdf', openInNewTab: true, logo: logoBase64 });
  };

  return (
    <div>
      <pre style={{
        fontFamily: '"Consolas", "Menlo", "Courier New", "Fira Mono", "Monaco", monospace',
        fontSize: '15px',
        lineHeight: '1.5',
        letterSpacing: '0.02em',
        margin: 0,
        padding: '12px 8px',
        background: '#fff',
        color: '#18181b',
        borderRadius: '8px',
        boxShadow: '0 2px 8px 0 #e5e7eb'
      }}>
        {content}
      </pre>
      <div className="flex gap-2 mt-3">
        <Button color="primary" variant="shadow" onPress={downloadPdf} isDisabled={!content}>Descargar PDF</Button>
        <Button color="secondary" variant="flat" onPress={viewPdf} isDisabled={!content}>Ver PDF</Button>
      </div>
    </div>
  );
}

export default VoucherPdf;

