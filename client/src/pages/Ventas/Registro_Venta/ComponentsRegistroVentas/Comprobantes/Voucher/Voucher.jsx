import React, { useState, useEffect } from 'react';
import { getEmpresaDataByUser } from "@/services/empresa.services";

function centerText(text, lineWidth) {
    const wrapText = (text, maxWidth) => {
        let lines = [];
        while (text.length > maxWidth) {
            let cutIndex = text.substring(0, maxWidth).lastIndexOf(' ');
            if (cutIndex === -1) cutIndex = maxWidth; // Si no hay espacio, corta en el ancho máximo
            lines.push(text.substring(0, cutIndex).trim());
            text = text.substring(cutIndex).trim();
        }
        lines.push(text); // Agregar el resto del texto
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
    console.warn('wrapText recibió un valor no válido:', text); // Agrega un mensaje de advertencia para depuración
    return ['']; // Si el texto es null, undefined o no es una cadena, retorna una línea vacía
  }
  let lines = [];
  while (text.length > maxWidth) {
    let cutIndex = text.substring(0, maxWidth).lastIndexOf(' ');
    if (cutIndex === -1) cutIndex = maxWidth; // Si no hay espacio, corta en el ancho máximo
    lines.push(text.substring(0, cutIndex).trim());
    text = text.substring(cutIndex).trim();
  }
  lines.push(text); // Agregar el resto del texto
  return lines;
}

function formatDetail(nombre, cantidad, precio, subTotal) {
    const nombreWidth = 10;
    const cantidadWidth = 5;
    const precioWidth = 8;
    const totalWidth = 8;

    // Divide el nombre en líneas si es necesario
    const nombreLines = wrapText(nombre, nombreWidth);

    let formattedDetail = '';
    nombreLines.forEach((line, index) => {
        if (index === 0) {
            // Primera línea: Incluye todos los campos
            const formattedNombre = line.padEnd(nombreWidth, ' ').substring(0, nombreWidth);
            const formattedCantidad = cantidad.toString().padStart(cantidadWidth, ' ').substring(0, cantidadWidth);
            const formattedPrecio = precio.toFixed(2).padStart(precioWidth, ' ').substring(0, precioWidth);
            const formattedTotal = subTotal.toFixed(2).padStart(totalWidth, ' ').substring(0, totalWidth);

            formattedDetail += `${formattedNombre} ${formattedCantidad} ${formattedPrecio} ${formattedTotal}\n`;
        } else {
            // Líneas adicionales: Solo el nombre, alineado con la columna y espacios para las otras columnas
            const formattedNombre = line.padEnd(nombreWidth, ' ').substring(0, nombreWidth);
            const spacesForOtherColumns = ' '.repeat(cantidadWidth + precioWidth + totalWidth + 2); // +2 para los espacios entre columnas
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

export const generateReceiptContent = async (datosVentaComprobante, datosVenta) => {
  let content = '';
  const appendContent = (text) => {
    content += `${text}\n`;
  };

  const descuentoVenta = Number(datosVentaComprobante.descuento_venta || 0);
  const totalT = Number(datosVentaComprobante.total_t || 0);
  const igv = Number(datosVentaComprobante.igv || 0);
  const recibido = Number(datosVentaComprobante.recibido || 0);
  const vuelto = Number(datosVentaComprobante.vuelto || 0);

  const totalEnLetras = numeroALetras(totalT);

  const loadDetallesFromLocalStorage = () => {
    const savedDetalles = localStorage.getItem('comprobante1');
    return savedDetalles ? JSON.parse(savedDetalles) : [];
  };

  const detail = loadDetallesFromLocalStorage();

  const loadDetallesFromLocalStorage1 = () => {
    const savedDetalles = localStorage.getItem('observacion');
    return savedDetalles ? JSON.parse(savedDetalles) : { observacion: '' };
  };

  const empresaData = await getEmpresaDataByUser();
  if (!empresaData) {
    console.error('No se pudieron obtener los datos de la empresa.');
    return '';
  }
  const observaciones = loadDetallesFromLocalStorage1();

  appendContent(centerText(empresaData?.nombreComercial || "Nombre Comercial", 34));
  appendContent(centerText(empresaData?.razonSocial || "Razón Social", 34));
  appendContent(centerText("Dirección: " + (empresaData?.direccion || "Dirección no disponible"), 34));
  appendContent(centerText(`${empresaData?.distrito || ''}, ${empresaData?.provincia || ''}, ${empresaData?.departamento || ''}`, 34));
  appendContent(centerText("RUC: " + (empresaData?.ruc || "20610588981"), 34));
  appendContent(centerText("Tel: " + (empresaData?.telefono || "Teléfono no disponible"), 34));
  appendContent(centerText(datosVentaComprobante.comprobante_pago + ": " + (detail?.nuevoNumComprobante || 'N/A')));
  appendContent("==================================");
  appendContent("Fecha de Emisión: " + (datosVentaComprobante.fecha || 'N/A'));
  appendContent("Dirección: " + (datosVenta.direccion || 'N/A'));
  appendContent(leftAlignText("Sucursal: " + (datosVenta.sucursal || 'N/A')));
  appendContent("==================================");
  appendContent(leftAlignText("CLIENTE: " + (datosVentaComprobante.nombre_cliente || 'N/A')));
  appendContent("RUC/DNI: " + (datosVentaComprobante.documento_cliente || 'N/A'));
  appendContent(leftAlignText(datosVentaComprobante.direccion_cliente || 'N/A'));
  appendContent("==================================");
  appendContent(leftAlignText("Observacion: " + (observaciones.observacion || 'Ninguna')));
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
  appendContent(centerText("Fec.Regist: " + (datosVentaComprobante.fecha || 'N/A')));
  appendContent("\n");
  appendContent(centerText("Gracias por su preferencia"));
  appendContent(centerText("¡Vuelva Pronto!"));
  appendContent(centerText("No se aceptan devoluciones"));
  appendContent("==================================");
  appendContent(centerText("Generado desde el Sistema"));
  appendContent(centerText("de Horytek Negocios"));
  appendContent(centerText("Un Producto de " + (empresaData?.razonSocial || 'N/A')));
  appendContent("==================================");

  return content;
};


const Voucher = ({ datosVentaComprobante, datosVenta }) => {
    const [content, setContent] = useState('');

    useEffect(() => {
        const fetchContent = async () => {
            const generatedContent = await generateReceiptContent(datosVentaComprobante, datosVenta);
            setContent(generatedContent);
        };
        fetchContent();
    }, [datosVentaComprobante, datosVenta]);

    return <pre>{content}</pre>;
};

export default Voucher;
