
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

    // Dividir el texto en líneas si excede el ancho máximo
    const lines = wrapText(text, lineWidth);
    return lines.map(line => centerLine(line, lineWidth)).join('\n');
}

function leftAlignText(text, lineWidth) {
    // Función auxiliar para dividir el texto en líneas de ancho fijo
    function wrapText(text, maxWidth) {
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

    // Divide el texto en líneas
    const lines = wrapText(text, lineWidth);

    // Alinea el texto a la izquierda y rellena con espacios a la derecha
    return lines.map(line => line.padEnd(lineWidth, ' ')).join('\n');
}

function wrapText(text, maxWidth) {
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

export const generateReceiptContent = (datosVentaComprobante, datosVenta) => {
    let content = '';
    const appendContent = (text) => {
        content += `${text}\n`;
    };

    // Convertir a números para asegurar que toFixed funcione
    //const totalImporteVenta = Number(datosVentaComprobante.totalImporte_venta);
    const descuentoVenta = Number(datosVentaComprobante.descuento_venta);
    const totalT = Number(datosVentaComprobante.total_t);
    const igv = Number(datosVentaComprobante.igv);
    const recibido = Number(datosVentaComprobante.recibido);
    const vuelto = Number(datosVentaComprobante.vuelto);

    const totalEnLetras = numeroALetras(totalT);

    const loadDetallesFromLocalStorage = () => {
        const savedDetalles = localStorage.getItem('comprobante1');
        return savedDetalles ? JSON.parse(savedDetalles) : [];
    };

    const detail = loadDetallesFromLocalStorage();


       const loadDetallesFromLocalStorage1 = () => {
        const savedDetalles = localStorage.getItem('observacion');
        return savedDetalles ? JSON.parse(savedDetalles) : [];
    };

    const observaciones = loadDetallesFromLocalStorage1();

    appendContent(centerText("TEXTILES CREANDO MODA S.A.C."));
    appendContent(centerText("Cal San Martin 1573 Urb"));
    appendContent(centerText("Urrunaga SC Tres"));
    appendContent(centerText("Chiclayo - Chiclayo - Lambayeque"));
    appendContent(centerText("RUC: 20610508901"));
    appendContent(centerText("Tel: 918378590"));
    appendContent(centerText(datosVentaComprobante.comprobante_pago + ": " + detail.nuevoNumComprobante));
    appendContent("==================================");
    appendContent("Fecha de Emisión: " + datosVentaComprobante.fecha);
    appendContent("Dirección: " + datosVenta.direccion);
    appendContent(leftAlignText("Sucursal: " + datosVenta.sucursal));
    appendContent("==================================");
    appendContent(leftAlignText("CLIENTE: " + datosVentaComprobante.nombre_cliente));
    appendContent("RUC/DNI: " + datosVentaComprobante.documento_cliente);
    appendContent(leftAlignText(datosVentaComprobante.direccion_cliente));
    appendContent("==================================");
    appendContent(leftAlignText("Observacion: " + observaciones.observacion));
    appendContent("==================================");
    appendContent("Descrip      Cant   P.Unit   TOTAL");
    appendContent("==================================");

    datosVentaComprobante.detalles.forEach(detalle => {
        appendContent(formatDetail(detalle.nombre, detalle.cantidad, detalle.precio, detalle.sub_total));
    });

    appendContent("==================================");
    appendContent(rightAlignText("Total Original S/: " + totalT.toFixed(2)));
    appendContent(rightAlignText("DESCUENTO S/: " + descuentoVenta.toFixed(2)));
    appendContent(rightAlignText("OP.GRAVADA S/: " + (totalT - igv).toFixed(2)));
    appendContent(rightAlignText("Exonerado S/: 0.00"));
    appendContent(rightAlignText("IGV. 18.00% S/: " + (igv).toFixed(2)));
    appendContent(rightAlignText("ICBPER S/: 0.00"));
    appendContent(rightAlignText("Importe Total S/: " + totalT.toFixed(2)));
    appendContent("\n");
    appendContent(centerText("SON: " + totalEnLetras));
    appendContent(centerText("Cond. de Venta: Contado"));
    appendContent(centerText("Forma Pago: " + datosVentaComprobante.formadepago));
    appendContent(centerText("Recibido: S/" + recibido.toFixed(2)));
    appendContent(centerText("Vuelto: S/" + vuelto.toFixed(2)));
    appendContent(centerText("Peso: Kg 0.00"));
    appendContent("\n");
    appendContent(centerText("Fec.Regist: " + datosVentaComprobante.fecha));
    appendContent("\n");
    appendContent(centerText("Gracias por su preferencia"));
    appendContent(centerText("¡Vuelva Pronto!"));
    appendContent(centerText("No se aceptan devoluciones"));
    appendContent("==================================");
    appendContent(centerText("Generado desde el Sistema"));
    appendContent(centerText("de Tormenta S.A.C"));
    appendContent(centerText("Un Producto de TORMENTA S.A.C"));
    appendContent("==================================");

    return content;
};


const Voucher = ({ datosVentaComprobante, datosVenta }) => {
    const content = generateReceiptContent(datosVentaComprobante, datosVenta);
    return <pre>{content}</pre>;
};

export default Voucher;
