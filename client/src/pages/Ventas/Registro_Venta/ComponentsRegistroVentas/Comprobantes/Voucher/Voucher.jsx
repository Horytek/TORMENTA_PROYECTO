function centerText(text) {
    const lineWidth = 32; // Ancho de la línea de la impresora (ajústalo según tu impresora)
    const spaces = Math.max(0, Math.floor((lineWidth - text.length) / 2));
    return ' '.repeat(spaces) + text;
}

function formatDetail(nombre, cantidad, precio, subTotal) {
    const nombreWidth = 11; // Ancho de la columna de nombre
    const cantidadWidth = 5; // Ancho de la columna de cantidad
    const precioWidth = 8;  // Ancho de la columna de precio
    const totalWidth = 8;   // Ancho de la columna de total

    const formattedNombre = nombre.padEnd(nombreWidth, ' ').substring(0, nombreWidth);
    const formattedCantidad = cantidad.toString().padStart(cantidadWidth, ' ').substring(0, cantidadWidth);
    const formattedPrecio = precio.toFixed(2).padStart(precioWidth, ' ').substring(0, precioWidth);
    const formattedTotal = subTotal.toFixed(2).padStart(totalWidth, ' ').substring(0, totalWidth);

    return `${formattedNombre} ${formattedCantidad} ${formattedPrecio} ${formattedTotal}`;
}

function rightAlignText(text) {
    const lineWidth = 32; // Ancho de la línea de la impresora (ajústalo según tu impresora)
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

    // Manejo de decimales
    const decimal = Math.round((numero - entero) * 100);
    if (decimal > 0) {
        letras += " CON " + decimal + "/100";
    }

    return letras;
}

export const generateReceiptContent = (datosVentaComprobante, datosVenta) => {
    let content = '';
    const appendContent = (text) => {
        content += `${text}\n`;
    };
    const totalEnLetras = numeroALetras(datosVentaComprobante.total_t);

    appendContent(centerText("TEXTILES CREANDO MODA S.A.C."));
    appendContent(centerText("Central: Cal San Martin 1573 Urb Urrunaga SC"));
    appendContent(centerText("Tres"));
    appendContent(centerText("Chiclayo - Chiclayo - Lambayeque"));
    appendContent(centerText("RUC: 20610508901"));
    appendContent(centerText("Tel: 918378590"));
    appendContent(centerText("Factura Venta Electrónica: F200-000000028"));
    appendContent("------------------------------------");
    appendContent("Fecha de Emisión: " + datosVentaComprobante.fecha);
    appendContent("Tienda: AV. BALTA Y LEGUIA");
    appendContent("Vendedor: " + datosVenta.usuario);
    appendContent("\n");
    appendContent("CLIENTE: " + datosVentaComprobante.nombre_cliente);
    appendContent("RUC/DNI: " + datosVentaComprobante.documento_cliente);
    appendContent(datosVentaComprobante.direccion_cliente);
    appendContent("------------------------------------");
    appendContent("Descripción    Cant   P.Unit   TOTAL");
    appendContent("------------------------------------");

    datosVentaComprobante.detalles.forEach(detalle => {
        appendContent(formatDetail(detalle.nombre, detalle.cantidad, detalle.precio, detalle.sub_total));
    });

    appendContent("------------------------------------");
    appendContent(rightAlignText("SUBTOTAL: " + datosVentaComprobante.totalImporte_venta));
    appendContent(rightAlignText("DESCUENTO: " + datosVentaComprobante.descuento_venta));
    appendContent(rightAlignText("OP.GRAVADA S/: " + (datosVentaComprobante.total_t - datosVentaComprobante.igv)));
    appendContent(rightAlignText("Exonerado S/: 0.00"));
    appendContent(rightAlignText("IGV. 18.00% S/: " + datosVentaComprobante.igv));
    appendContent(rightAlignText("ICBPER S/: 0.00"));
    appendContent(rightAlignText("Importe Total S/: " + datosVentaComprobante.total_t));
    appendContent("\n");
    appendContent(centerText("SON: " + totalEnLetras));
    appendContent(centerText("Cond. de Venta: " + "Contado"));
    appendContent(centerText("Forma Pago: " + datosVentaComprobante.formadepago));
    appendContent(centerText("Recibido: S/" + datosVentaComprobante.recibido));
    appendContent(centerText("Vuelto: S/" + datosVentaComprobante.vuelto));
    appendContent(centerText("Peso: Kg" + "0.00"));
    appendContent("\n");
    appendContent(centerText("Fec.Regist: " + datosVentaComprobante.fecha));
    appendContent("\n");
    appendContent(centerText("Gracias por su preferencia"));
    appendContent(centerText("¡Vuelva Pronto!"));
    appendContent(centerText("No se aceptan devoluciones"));
    appendContent("------------------------------------");
    appendContent("Generado desde el Sistema de Tormenta S.A.C");
    appendContent("Un Producto de TORMENTA S.A.C");
    appendContent("------------------------------------");

    return content;
};

const Voucher = ({ datosVentaComprobante, datosVenta }) => {
    const content = generateReceiptContent(datosVentaComprobante, datosVenta);
    return <pre>{content}</pre>;
};

export default Voucher;
