/**
 * Generador de PDF para comprobantes electrónicos SUNAT
 * Genera representación impresa con formato oficial y código QR
 */

import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

function toMoney(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return '0.00';
    return num.toFixed(2);
}

function isoDate(dateTimeIso) {
    const s = String(dateTimeIso || '');
    return s.includes('T') ? s.split('T')[0] : s;
}

function padLeft(value, width, ch = '0') {
    const s = String(value ?? '');
    if (s.length >= width) return s;
    return ch.repeat(width - s.length) + s;
}

/**
 * Generar texto del QR según especificaciones SUNAT
 * Formato: RUC|TIPO_DOC|SERIE|CORRELATIVO|IGV|TOTAL|FECHA|TIPO_DOC_CLI|NUM_DOC_CLI|HASH
 */
function buildQrText(payload, hash = '') {
    const ruc = payload?.company?.ruc || '';
    const tipoDoc = payload?.tipoDoc || '';
    const serie = payload?.serie || '';
    const correlativo = padLeft(payload?.correlativo, 8);
    const igv = toMoney(payload?.mtoIGV);
    const total = toMoney(payload?.mtoImpVenta);
    const fecha = isoDate(payload?.fechaEmision);
    const tipoDocCli = payload?.client?.tipoDoc || '';
    const numDocCli = payload?.client?.numDoc || '';

    return `${ruc}|${tipoDoc}|${serie}|${correlativo}|${igv}|${total}|${fecha}|${tipoDocCli}|${numDocCli}|${hash}`;
}

/**
 * Obtener nombre del tipo de documento
 */
function getTipoDocNombre(tipoDoc) {
    const tipos = {
        '01': 'FACTURA ELECTRÓNICA',
        '03': 'BOLETA DE VENTA ELECTRÓNICA',
        '07': 'NOTA DE CRÉDITO ELECTRÓNICA',
        '08': 'NOTA DE DÉBITO ELECTRÓNICA',
    };
    return tipos[tipoDoc] || 'COMPROBANTE ELECTRÓNICO';
}

/**
 * Generar PDF del comprobante electrónico
 * @param {Object} payload - Datos del comprobante (mismo formato que se envía a SUNAT)
 * @param {string} hash - Hash del documento firmado (opcional, se muestra en PDF)
 * @returns {Promise<Buffer>} - Buffer del PDF generado
 */
export async function generateInvoicePdf(payload, hash = '') {
    return new Promise(async (resolve, reject) => {
        try {
            const chunks = [];

            // Crear documento PDF A4
            const doc = new PDFDocument({
                size: 'A4',
                margin: 40,
                info: {
                    Title: `${payload?.serie}-${padLeft(payload?.correlativo, 8)}`,
                    Author: payload?.company?.razonSocial || 'Empresa',
                    Subject: 'Representación Impresa de Comprobante Electrónico',
                }
            });

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

            // ===== ENCABEZADO =====
            const headerY = doc.y;

            // Datos de la empresa (lado izquierdo)
            // Limitar ancho del texto para evitar superposición con el recuadro del RUC
            const boxX = doc.page.width - doc.page.margins.right - 180;
            const maxTextWidth = boxX - doc.page.margins.left - 15;

            doc.fontSize(14).font('Helvetica-Bold')
                .text(payload?.company?.razonSocial || 'EMPRESA S.A.C.', { width: maxTextWidth, continued: false });

            doc.fontSize(9).font('Helvetica')
                .text(`RUC: ${payload?.company?.ruc || ''}`, { width: maxTextWidth })
                .text(payload?.company?.address?.direccion || '', { width: maxTextWidth })
                .text(`${payload?.company?.address?.distrito || ''} - ${payload?.company?.address?.provincia || ''} - ${payload?.company?.address?.departamento || ''}`, { width: maxTextWidth });

            // Recuadro del comprobante (lado derecho)
            // boxX ya definido arriba para limitar ancho del texto
            const boxY = headerY;
            const boxWidth = 180;
            const boxHeight = 75;

            doc.rect(boxX, boxY, boxWidth, boxHeight)
                .strokeColor('#000')
                .lineWidth(2)
                .stroke();

            // Contenido del recuadro
            const tipoDocNombre = getTipoDocNombre(payload?.tipoDoc);
            const serieCorrelativo = `${payload?.serie}-${padLeft(payload?.correlativo, 8)}`;

            doc.fontSize(10).font('Helvetica-Bold')
                .text(`RUC: ${payload?.company?.ruc}`, boxX + 10, boxY + 10, { width: boxWidth - 20, align: 'center' });

            doc.fontSize(11).font('Helvetica-Bold')
                .text(tipoDocNombre, boxX + 10, boxY + 28, { width: boxWidth - 20, align: 'center' });

            doc.fontSize(12).font('Helvetica-Bold')
                .text(serieCorrelativo, boxX + 10, boxY + 52, { width: boxWidth - 20, align: 'center' });

            doc.y = Math.max(doc.y, boxY + boxHeight + 20);

            // ===== DATOS DEL CLIENTE =====
            // Resetear posición X al margen izquierdo
            doc.x = doc.page.margins.left;

            doc.moveTo(doc.page.margins.left, doc.y)
                .lineTo(doc.page.width - doc.page.margins.right, doc.y)
                .stroke();

            doc.y += 10;

            doc.fontSize(9).font('Helvetica-Bold')
                .text('DATOS DEL CLIENTE', doc.page.margins.left, doc.y);

            doc.y += 5;

            doc.fontSize(9).font('Helvetica')
                .text(`Razón Social/Nombre: ${payload?.client?.rznSocial || '-'}`, doc.page.margins.left)
                .text(`Tipo Doc: ${payload?.client?.tipoDoc === '6' ? 'RUC' : 'DNI'}  |  Número: ${payload?.client?.numDoc || '-'}`)
                .text(`Dirección: ${payload?.client?.address?.direccion || '-'}`);

            doc.y += 5;

            doc.fontSize(9).font('Helvetica')
                .text(`Fecha Emisión: ${isoDate(payload?.fechaEmision)}  |  Moneda: ${payload?.tipoMoneda || 'PEN'}`);

            doc.y += 10;

            // ===== DETALLE DE PRODUCTOS =====
            doc.moveTo(doc.page.margins.left, doc.y)
                .lineTo(doc.page.width - doc.page.margins.right, doc.y)
                .stroke();

            doc.y += 10;

            // Encabezados de tabla - columnas bien distribuidas
            // A4 width = 595pt, margins = 40 each side, usable = 515pt
            const colWidths = { item: 30, codigo: 55, descripcion: 200, cantidad: 50, precio: 70, total: 70 };
            const colX = {
                item: doc.page.margins.left,
                codigo: doc.page.margins.left + colWidths.item + 5,
                descripcion: doc.page.margins.left + colWidths.item + colWidths.codigo + 10,
                cantidad: doc.page.margins.left + colWidths.item + colWidths.codigo + colWidths.descripcion + 15,
                precio: doc.page.margins.left + colWidths.item + colWidths.codigo + colWidths.descripcion + colWidths.cantidad + 20,
                total: doc.page.margins.left + colWidths.item + colWidths.codigo + colWidths.descripcion + colWidths.cantidad + colWidths.precio + 25,
            };

            const tableHeaderY = doc.y;
            doc.fontSize(8).font('Helvetica-Bold');
            doc.text('ITEM', colX.item, tableHeaderY, { width: colWidths.item });
            doc.text('CÓDIGO', colX.codigo, tableHeaderY, { width: colWidths.codigo });
            doc.text('DESCRIPCIÓN', colX.descripcion, tableHeaderY, { width: colWidths.descripcion });
            doc.text('CANT.', colX.cantidad, tableHeaderY, { width: colWidths.cantidad, align: 'center' });
            doc.text('P.UNIT.', colX.precio, tableHeaderY, { width: colWidths.precio, align: 'right' });
            doc.text('TOTAL', colX.total, tableHeaderY, { width: colWidths.total, align: 'right' });

            doc.y += 15;

            doc.moveTo(doc.page.margins.left, doc.y - 3)
                .lineTo(doc.page.width - doc.page.margins.right, doc.y - 3)
                .lineWidth(0.5)
                .stroke();

            // Filas de productos
            const details = Array.isArray(payload?.details) ? payload.details : [];

            details.forEach((item, idx) => {
                const y = doc.y;

                doc.fontSize(8).font('Helvetica');
                doc.text(String(idx + 1), colX.item, y, { width: colWidths.item });
                doc.text(item?.codProducto || '', colX.codigo, y, { width: colWidths.codigo });
                doc.text(item?.descripcion || '', colX.descripcion, y, { width: colWidths.descripcion });
                doc.text(String(item?.cantidad || 0), colX.cantidad, y, { width: colWidths.cantidad, align: 'center' });
                doc.text(toMoney(item?.mtoValorUnitario), colX.precio, y, { width: colWidths.precio, align: 'right' });
                doc.text(toMoney(item?.mtoValorVenta), colX.total, y, { width: colWidths.total, align: 'right' });

                doc.y = y + 15;
            });

            doc.y += 10;

            doc.moveTo(doc.page.margins.left, doc.y)
                .lineTo(doc.page.width - doc.page.margins.right, doc.y)
                .stroke();

            doc.y += 10;

            // ===== TOTALES =====
            const totalsX = doc.page.width - doc.page.margins.right - 180;

            doc.fontSize(9).font('Helvetica')
                .text('OP. GRAVADAS:', totalsX, doc.y)
                .text(`S/ ${toMoney(payload?.mtoOperGravadas)}`, totalsX + 100, doc.y);

            doc.y += 12;

            doc.text('IGV (18%):', totalsX, doc.y)
                .text(`S/ ${toMoney(payload?.mtoIGV)}`, totalsX + 100, doc.y);

            doc.y += 12;

            doc.font('Helvetica-Bold')
                .text('IMPORTE TOTAL:', totalsX, doc.y)
                .text(`S/ ${toMoney(payload?.mtoImpVenta)}`, totalsX + 100, doc.y);

            doc.y += 20;

            // ===== LEYENDA =====
            const legends = Array.isArray(payload?.legends) ? payload.legends : [];
            const legend1000 = legends.find(l => String(l?.code) === '1000')?.value || '';

            if (legend1000) {
                doc.fontSize(8).font('Helvetica-Oblique')
                    .text(`SON: ${legend1000}`, doc.page.margins.left, doc.y, { width: pageWidth });
                doc.y += 15;
            }

            // ===== CÓDIGO QR =====
            const qrText = buildQrText(payload, hash);
            const qrDataUrl = await QRCode.toDataURL(qrText, { width: 100, margin: 1 });
            const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

            const qrY = doc.y + 10;
            doc.image(qrBuffer, doc.page.margins.left, qrY, { width: 80, height: 80 });

            // Hash al lado del QR
            if (hash) {
                doc.fontSize(7).font('Helvetica')
                    .text(`Hash: ${hash}`, doc.page.margins.left + 90, qrY + 30, { width: 200 });
            }

            // ===== PIE DE PÁGINA =====
            const footerY = qrY + 90;

            doc.moveTo(doc.page.margins.left, footerY)
                .lineTo(doc.page.width - doc.page.margins.right, footerY)
                .lineWidth(0.5)
                .stroke();

            doc.fontSize(7).font('Helvetica')
                .text(
                    'Representación Impresa de la ' + tipoDocNombre,
                    doc.page.margins.left,
                    footerY + 5,
                    { width: pageWidth, align: 'center' }
                )
                .text(
                    'Autorizado mediante Resolución de Intendencia SUNAT',
                    doc.page.margins.left,
                    footerY + 15,
                    { width: pageWidth, align: 'center' }
                );

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generar PDF para Guía de Remisión
 * @param {Object} payload - Datos de la guía
 * @param {string} hash - Hash del documento firmado
 * @returns {Promise<Buffer>}
 */
export async function generateDespatchPdf(payload, hash = '') {
    return new Promise(async (resolve, reject) => {
        try {
            const chunks = [];

            const doc = new PDFDocument({
                size: 'A4',
                margin: 40,
                info: {
                    Title: `${payload?.serie}-${payload?.correlativo}`,
                    Author: payload?.company?.razonSocial || 'Empresa',
                    Subject: 'Representación Impresa de Guía de Remisión Electrónica',
                }
            });

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

            // ===== ENCABEZADO =====
            doc.fontSize(14).font('Helvetica-Bold')
                .text(payload?.company?.razonSocial || 'EMPRESA S.A.C.');

            doc.fontSize(9).font('Helvetica')
                .text(`RUC: ${payload?.company?.ruc || ''}`)
                .text(payload?.company?.address?.direccion || '');

            doc.y += 10;

            // Título
            doc.fontSize(12).font('Helvetica-Bold')
                .text('GUÍA DE REMISIÓN ELECTRÓNICA', { align: 'center' });

            doc.fontSize(11).font('Helvetica-Bold')
                .text(`${payload?.serie}-${payload?.correlativo}`, { align: 'center' });

            doc.y += 15;

            // Datos del traslado
            doc.fontSize(9).font('Helvetica-Bold').text('DATOS DEL TRASLADO');
            doc.y += 5;

            doc.fontSize(9).font('Helvetica')
                .text(`Fecha Emisión: ${isoDate(payload?.fechaEmision)}`)
                .text(`Motivo: ${payload?.observacion || '-'}`)
                .text(`Peso Total: ${payload?.envio?.pesoTotal || '-'} ${payload?.envio?.undPesoTotal || 'KGM'}`);

            doc.y += 10;

            // Origen y Destino
            doc.fontSize(9).font('Helvetica-Bold').text('PUNTO DE PARTIDA');
            doc.fontSize(9).font('Helvetica')
                .text(`Ubigeo: ${payload?.envio?.partida?.ubigueo || '-'}`)
                .text(`Dirección: ${payload?.envio?.partida?.direccion || '-'}`);

            doc.y += 5;

            doc.fontSize(9).font('Helvetica-Bold').text('PUNTO DE LLEGADA');
            doc.fontSize(9).font('Helvetica')
                .text(`Ubigeo: ${payload?.envio?.llegada?.ubigueo || '-'}`)
                .text(`Dirección: ${payload?.envio?.llegada?.direccion || '-'}`);

            doc.y += 10;

            // Destinatario
            doc.fontSize(9).font('Helvetica-Bold').text('DESTINATARIO');
            doc.fontSize(9).font('Helvetica')
                .text(`RUC/DNI: ${payload?.destinatario?.numDoc || '-'}`)
                .text(`Razón Social: ${payload?.destinatario?.rznSocial || '-'}`);

            doc.y += 10;

            // Transportista
            doc.fontSize(9).font('Helvetica-Bold').text('TRANSPORTISTA');
            doc.fontSize(9).font('Helvetica')
                .text(`RUC: ${payload?.envio?.transportista?.numDoc || '-'}`)
                .text(`Razón Social: ${payload?.envio?.transportista?.rznSocial || '-'}`)
                .text(`Placa: ${payload?.envio?.transportista?.placa || '-'}`);

            doc.y += 15;

            // Detalle
            doc.fontSize(9).font('Helvetica-Bold').text('DETALLE DE BIENES');
            doc.y += 5;

            const details = Array.isArray(payload?.details) ? payload.details : [];
            details.forEach((item, idx) => {
                doc.fontSize(8).font('Helvetica')
                    .text(`${idx + 1}. ${item?.descripcion || '-'} - Cant: ${item?.cantidad || 0} ${item?.unidad || ''}`);
            });

            doc.y += 20;

            // QR
            const qrText = `${payload?.company?.ruc}|09|${payload?.serie}|${payload?.correlativo}|${hash}`;
            const qrDataUrl = await QRCode.toDataURL(qrText, { width: 80, margin: 1 });
            const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

            doc.image(qrBuffer, doc.page.margins.left, doc.y, { width: 70, height: 70 });

            // Pie
            doc.y += 80;
            doc.fontSize(7).font('Helvetica')
                .text('Representación Impresa de la Guía de Remisión Electrónica', { align: 'center' })
                .text('Autorizado mediante Resolución de Intendencia SUNAT', { align: 'center' });

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}
