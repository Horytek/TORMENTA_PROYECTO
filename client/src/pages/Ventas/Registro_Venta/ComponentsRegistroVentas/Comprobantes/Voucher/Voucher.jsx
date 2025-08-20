import React, { useState, useEffect } from 'react';
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { useVentaSeleccionadaStore } from "@/store/useVentaTable";
import { useUserStore } from "@/store/useStore";

function centerText(text, lineWidth) {
    const wrapText = (text, maxWidth) => {
        let lines = [];
        while (text.length > maxWidth) {
            let cutIndex = text.substring(0, maxWidth).lastIndexOf(' ');
            if (cutIndex === -1) cutIndex = maxWidth;
            lines.push(text.substring(0, cutIndex).trim());
            text = text.substring(cutIndex).trim();
        }
        lines.push(text);
        return lines;
    };

    const centerLine = (line, width) => {
        const spaces = Math.max(0, Math.floor((width - line.length) / 2));
        return ' '.repeat(spaces) + line;
    };

    const lines = wrapText(text, lineWidth);
    return lines.map(line => centerLine(line, lineWidth)).join('\n');
}

function leftAlignText(text, lineWidth) {
    const wrapText = (text, maxWidth) => {
        let lines = [];
        while (text.length > maxWidth) {
            let cutIndex = text.substring(0, maxWidth).lastIndexOf(' ');
            if (cutIndex === -1) cutIndex = maxWidth;
            lines.push(text.substring(0, cutIndex).trim());
            text = text.substring(cutIndex).trim();
        }
        lines.push(text);
        return lines;
    };

    const lines = wrapText(text, lineWidth);
    return lines.map(line => line.padEnd(lineWidth, ' ')).join('\n');
}

function wrapText(text, maxWidth) {
  if (!text || typeof text !== 'string') {
    return [''];
  }
  let lines = [];
  while (text.length > maxWidth) {
    let cutIndex = text.substring(0, maxWidth).lastIndexOf(' ');
    if (cutIndex === -1) cutIndex = maxWidth;
    lines.push(text.substring(0, cutIndex).trim());
    text = text.substring(cutIndex).trim();
  }
  lines.push(text);
  return lines;
}

function formatDetail(nombre, cantidad, precio, subTotal) {
    const nombreWidth = 10;
    const cantidadWidth = 5;
    const precioWidth = 8;
    const totalWidth = 8;
    const nombreLines = wrapText(nombre, nombreWidth);

    let formattedDetail = '';
    nombreLines.forEach((line, index) => {
        if (index === 0) {
            const formattedNombre = line.padEnd(nombreWidth, ' ').substring(0, nombreWidth);
            const formattedCantidad = cantidad.toString().padStart(cantidadWidth, ' ').substring(0, cantidadWidth);
            const formattedPrecio = precio.toFixed(2).padStart(precioWidth, ' ').substring(0, precioWidth);
            const formattedTotal = subTotal.toFixed(2).padStart(totalWidth, ' ').substring(0, totalWidth);
            formattedDetail += `${formattedNombre} ${formattedCantidad} ${formattedPrecio} ${formattedTotal}\n`;
        } else {
            const formattedNombre = line.padEnd(nombreWidth, ' ').substring(0, nombreWidth);
            const spacesForOtherColumns = ' '.repeat(cantidadWidth + precioWidth + totalWidth + 2);
            formattedDetail += `${formattedNombre}${spacesForOtherColumns}\n`;
        }
    });

    return formattedDetail;
}

function rightAlignText(text) {
    const lineWidth = 34;
    const spaces = Math.max(0, lineWidth - text.length);
    return ' '.repeat(spaces) + text;
}

function numeroALetras(numero) {
    const unidades = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
    const decenas = ["", "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE", "VEINTE", "VEINTIUNO", "VEINTIDOS", "VEINTITRES", "VEINTICUATRO", "VEINTICINCO", "VEINTISEIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE"];
    const decenasDecenas = ["", "", "VEINTI", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
    const centenas = ["", "CIEN", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

    if (numero === 0) return "CERO";
    let letras = '';

    const entero = Math.floor(numero);
    const centena = Math.floor(entero / 100);
    const decena = Math.floor((entero % 100) / 10);
    const unidad = entero % 10;

    if (centena > 0) {
        if (centena === 1 && (decena > 0 || unidad > 0)) {
            letras += "CIENTO ";
        } else {
            letras += centenas[centena] + " ";
        }
    }

    if (decena > 1) {
        letras += decenasDecenas[decena] + " ";
        if (unidad > 0) {
            letras += unidades[unidad];
        }
    } else if (decena === 1) {
        letras += decenas[10 + unidad];
    } else {
        letras += unidades[unidad];
    }

    const decimal = Math.round((numero - entero) * 100);
    if (decimal > 0) {
        letras += " CON " + decimal + "/100";
    }

    return letras;
}

export const generateReceiptContent = async (
  datosVentaComprobante,
  datosVenta,
  comprobante1,
  observacion,
  nombre,
  empresaData
) => {
  let content = '';
  const appendContent = (text) => {
    content += `${text}\n`;
  };

const getHora = (date, raw = false) => {
  if (!date) return '';
  // Siempre usar hour12: true y locale es-ES para ambos casos
  if (raw && typeof date === 'string') {
    return new Date(`1970-01-01T${date}`).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  }
  // Para Date o string tipo Date
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
};

const now = new Date();
const hora_creacion = datosVenta?.hora_creacion
  ? getHora(datosVenta.hora_creacion, true)
  : getHora(now);
const hora_impresion = getHora(now, true);

  const descuentoVenta = Number(datosVentaComprobante.descuento_venta || 0);
  const totalT = Number(datosVentaComprobante.total_t || 0);
  const igv = Number(datosVentaComprobante.igv || 0);
  const recibido = Number(datosVentaComprobante.recibido || 0);
  const vuelto = Number(datosVentaComprobante.vuelto || 0);

  const totalEnLetras = numeroALetras(totalT);

  if (!empresaData) {
    console.error('No se pudieron obtener los datos de la empresa.');
    return '';
  }

  // --- Encabezado empresa ---
  //if (empresaData?.nombreComercial)
  //  appendContent(centerText(empresaData.nombreComercial, 34));
if (empresaData?.razonSocial)
    appendContent(""); // Salto de línea extra
    appendContent(""); // Salto de línea extra
    appendContent(""); // Salto de línea extra
    appendContent(""); // Salto de línea extra
    appendContent(centerText(empresaData.razonSocial, 34));
  if (empresaData?.direccion)
    appendContent(centerText("Dirección: " + empresaData.direccion, 34));
  if (empresaData?.distrito || empresaData?.provincia || empresaData?.departamento)
    appendContent(centerText(
      [empresaData.distrito, empresaData.provincia, empresaData.departamento].filter(Boolean).join(', '),
      34
    ));
  if (empresaData?.ruc)
    appendContent(centerText("RUC: " + empresaData.ruc, 34));
  if (empresaData?.telefono)
    appendContent(centerText("Tel: " + empresaData.telefono, 34));
  appendContent(centerText(
    "==============================", 34
  ));
  appendContent(centerText(
    (
      "** " +
      ((datosVentaComprobante.comprobante_pago || datosVenta.comprobante_pago)?.toUpperCase() + ": " + (comprobante1?.nuevoNumComprobante || 'N/A')) +
      " **"
    ),
    34
  ));
  appendContent(centerText(
    "==============================", 34
  ));
  appendContent("==================================");
  if (datosVentaComprobante.fecha)
    appendContent("Fecha de Emisión: " + datosVentaComprobante.fecha);
    appendContent(""); // Salto de línea extra
  // Sucursal y dirección solo si existen
  if (datosVenta?.direccion) {
    appendContent(leftAlignText("Dirección: " + datosVenta.direccion, 34));
    appendContent(""); // Salto de línea extra
  }
  if (datosVenta?.sucursal)
    appendContent(leftAlignText("Sucursal: " + datosVenta.sucursal));
  if (datosVenta?.ubicacion) {
    appendContent(leftAlignText("Dirección: " + datosVenta.ubicacion, 34));
    appendContent(""); // Salto de línea extra
  }
  if (datosVenta?.nombre_sucursal)
    appendContent(leftAlignText("Sucursal: " + datosVenta.nombre_sucursal));
  appendContent("==================================");
  // --- Cliente ---
  if (datosVentaComprobante.nombre_cliente)
    appendContent(leftAlignText("CLIENTE: " + datosVentaComprobante.nombre_cliente));
  if (datosVentaComprobante.documento_cliente)
    appendContent("RUC/DNI: " + datosVentaComprobante.documento_cliente);
  if (datosVentaComprobante.direccion_cliente) {
    appendContent(leftAlignText(datosVentaComprobante.direccion_cliente, 34));
    appendContent(""); // Salto de línea extra
  }
  appendContent("==================================");
  // Observación solo si existe
  if (observacion?.observacion)
    appendContent(leftAlignText("Observacion: " + observacion.observacion));
  appendContent("==================================");
  appendContent("Descrip      Cant   P.Unit   TOTAL");
  appendContent("==================================");

  datosVentaComprobante.detalles.forEach(detalle => {
    appendContent(formatDetail(detalle.nombre || 'N/A', detalle.cantidad || 0, detalle.precio || 0, detalle.sub_total || 0));
  });

  appendContent("==================================");
  appendContent(rightAlignText("Total Original S/: " + totalT.toFixed(2)));
  appendContent(rightAlignText("DESCUENTO S/: " + descuentoVenta.toFixed(2)));
  appendContent(rightAlignText("OP.GRAVADA S/: " + (totalT - igv).toFixed(2)));
  appendContent(rightAlignText("Exonerado S/: 0.00"));
  appendContent(rightAlignText("IGV. 18.00% S/: " + igv.toFixed(2)));
  appendContent(rightAlignText("ICBPER S/: 0.00"));
  appendContent(rightAlignText("Importe Total S/: " + totalT.toFixed(2)));
  appendContent("\n");
  appendContent(centerText("SON: " + totalEnLetras));
  appendContent(centerText("Cond. de Venta: Contado"));
  appendContent(centerText("Forma Pago: " + (datosVentaComprobante.formadepago || 'N/A')));
  appendContent(centerText("Recibido: S/" + recibido.toFixed(2)));
  appendContent(centerText("Vuelto: S/" + vuelto.toFixed(2)));
  appendContent(centerText("Peso: Kg 0.00"));
  appendContent("\n");
  // Hora creación e impresión
  appendContent(centerText("Fec.Regist: " + (datosVentaComprobante.fecha || 'N/A')));
  appendContent(centerText("Hora creación: " + hora_creacion));
  appendContent(centerText("Hora impresión: " + hora_impresion));
  appendContent("\n");
  appendContent(centerText("Gracias por su preferencia"));
  appendContent(centerText("¡Vuelva Pronto!"));
  appendContent(centerText("No se aceptan devoluciones"));
  appendContent("==================================");
  appendContent(centerText("Generado desde el Sistema"));
  appendContent(centerText("de Horytek Negocios"));
  appendContent(leftAlignText("Un Producto de " + (empresaData?.nombreComercial || 'N/A'), 34));
  appendContent("==================================");

  return content;
};

// Componente Voucher optimizado
const Voucher = ({ datosVentaComprobante, datosVenta }) => {
  const comprobante1 = useVentaSeleccionadaStore(state => state.comprobante1);
  const observacion = useVentaSeleccionadaStore(state => state.observacion);
  const nombre = useUserStore((state) => state.nombre);
  const [content, setContent] = useState('');

  useEffect(() => {
    const fetchContent = async () => {
      const empresaData = await getEmpresaDataByUser(nombre);
      const generatedContent = await generateReceiptContent(
        datosVentaComprobante,
        datosVenta,
        comprobante1,
        observacion,
        nombre,
        empresaData
      );
      setContent(generatedContent);
    };
    fetchContent();
  }, [datosVentaComprobante, datosVenta, comprobante1, observacion, nombre]);

  // Mejorar tipo de letra usando una fuente monoespaciada y tamaño más legible
  return (
<pre style={{
  fontFamily: '"Consolas", "Menlo", "Courier New", "Fira Mono", "Monaco", monospace',
  fontSize: "15px",
  lineHeight: "1.5",
  letterSpacing: "0.02em",
  margin: 0,
  padding: "12px 8px",
  background: "#fff",
  color: "#18181b",
  borderRadius: "8px",
  boxShadow: "0 2px 8px 0 #e5e7eb"
}}>
  {content}
</pre>
  );
};

export default Voucher;