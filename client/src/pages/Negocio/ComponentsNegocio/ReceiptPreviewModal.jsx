import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, ScrollShadow } from '@heroui/react';
import { exportVoucherToPdf } from '@/utils/pdf/voucherToPdf';

const LINE_WIDTH = 34;

function wrapText(text, maxWidth) {
  if (!text || typeof text !== 'string') return [''];
  const normalized = text.trim();
  if (normalized.length <= maxWidth) return [normalized];

  const lines = [];
  let remaining = normalized;
  while (remaining.length > maxWidth) {
    let cutIndex = remaining.substring(0, maxWidth).lastIndexOf(' ');
    if (cutIndex === -1) cutIndex = maxWidth;
    lines.push(remaining.substring(0, cutIndex).trim());
    remaining = remaining.substring(cutIndex).trim();
  }
  if (remaining) lines.push(remaining);
  return lines;
}

function centerText(text, width = LINE_WIDTH) {
  return wrapText(text || '', width)
    .map((line) => {
      const spaces = Math.max(0, Math.floor((width - line.length) / 2));
      return ' '.repeat(spaces) + line;
    })
    .join('\n');
}

function leftAlignText(text, width = LINE_WIDTH) {
  return wrapText(text || '', width)
    .map((line) => line.padEnd(width, ' '))
    .join('\n');
}

function formatDetail(description, quantity, unitPrice, subTotal) {
  const nameWidth = 16;
  const qtyWidth = 5;
  const priceWidth = 6;
  const totalWidth = 7;
  const rows = wrapText(description || '', nameWidth);
  let output = '';

  rows.forEach((line, index) => {
    if (index === 0) {
      const qty = String(quantity ?? 0).padStart(qtyWidth, ' ').substring(0, qtyWidth);
      const price = Number(unitPrice ?? 0).toFixed(2).padStart(priceWidth, ' ').substring(0, priceWidth);
      const total = Number(subTotal ?? 0).toFixed(2).padStart(totalWidth, ' ').substring(0, totalWidth);
      output += `${line.padEnd(nameWidth, ' ').substring(0, nameWidth)} ${qty} ${price} ${total}\n`;
    } else {
      output += `${line.padEnd(nameWidth, ' ').substring(0, nameWidth)} ${' '.repeat(qtyWidth + priceWidth + totalWidth + 3)}\n`;
    }
  });

  return output.trimEnd();
}

function rightAlignText(text, width = LINE_WIDTH) {
  const raw = text || '';
  const limit = Math.max(0, width - raw.length);
  return ' '.repeat(limit) + raw;
}

function numeroALetras(numero) {
  const unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', 'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const decenasTens = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const centenas = ['', 'CIEN', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  if (!Number.isFinite(numero)) return 'CERO';
  const entero = Math.floor(Math.abs(numero));
  const decimal = Math.round((Math.abs(numero) - entero) * 100);

  if (entero === 0) {
    return `CERO CON ${decimal.toString().padStart(2, '0')}/100`;
  }

  let letras = '';
  const centena = Math.floor(entero / 100);
  const decena = Math.floor((entero % 100) / 10);
  const unidad = entero % 10;

  if (centena > 0) {
    if (centena === 1 && (decena > 0 || unidad > 0)) letras += 'CIENTO ';
    else letras += `${centenas[centena]} `;
  }

  if (decena === 1) {
    letras += decenas[unidad + 1];
  } else {
    if (decena > 1) {
      letras += decenasTens[decena];
      if (unidad > 0) letras += ` Y ${unidades[unidad]}`;
    } else if (unidad > 0) {
      letras += unidades[unidad];
    }
  }

  letras = letras.trim();
  return `${letras} CON ${decimal.toString().padStart(2, '0')}/100`;
}

function buildPreviewContent(nombre, direccion, fecha, hora) {
  const sampleDetails = [
    { description: 'MULTI-CARGO COLOR TORMENTA', quantity: 1, unitPrice: 50.0 },
    { description: 'JEANS CLASICO HORYTEK', quantity: 2, unitPrice: 35.5 },
    { description: 'MOM RASGADOS', quantity: 1, unitPrice: 39.9 },
  ];

  const details = sampleDetails.map((item) => ({
    ...item,
    lineTotal: item.quantity * item.unitPrice,
  }));

  const total = details.reduce((sum, item) => sum + item.lineTotal, 0);
  const operationGravada = total / 1.18;
  const igv = total - operationGravada;
  const totalEnLetras = numeroALetras(Number(total.toFixed(2))) + ' SOLES';

  const lines = [];
  const push = (line = '') => lines.push(line);

  push(centerText(nombre || 'NOMBRE DE NEGOCIO'));
  if (direccion) push(centerText(direccion));
  push(centerText('=============================='));
  push(centerText('** BOLETA: B001-000123 **'));
  push(centerText('=============================='));
  push('==================================');
  push(`Fecha de Emision: ${fecha}`);
  push('');
  if (direccion) {
    push(leftAlignText(`Direccion: ${direccion}`));
    push('');
  }
  push('==================================');
  push('Descrip           Cant  P.Unit  TOTAL');
  push('==================================');
  details.forEach((item) => {
    const detailLines = formatDetail(item.description, item.quantity, item.unitPrice, item.lineTotal).split('\n');
    detailLines.forEach((line) => push(line));
  });
  push('==================================');
  push(rightAlignText(`OP.GRAVADA S/: ${operationGravada.toFixed(2)}`));
  push(rightAlignText(`IGV. 18.00% S/: ${igv.toFixed(2)}`));
  push(rightAlignText(`Importe Total S/: ${total.toFixed(2)}`));
  push('');
  push(centerText(`SON: ${totalEnLetras}`));
  push(centerText('Cond. de Venta: Contado'));
  push(centerText('Forma Pago: EFECTIVO'));
  push(centerText(`Recibido: S/${total.toFixed(2)}`));
  push(centerText('Vuelto: S/0.00'));
  push(centerText('Peso: Kg 0.00'));
  push('');
  push(centerText(`Fec.Regist: ${fecha}`));
  push(centerText(`Hora creacion: ${hora}`));
  push(centerText(`Hora impresion: ${hora}`));
  push('');
  push(centerText('Gracias por su preferencia'));
  push(centerText('Vuelva Pronto!'));
  push(centerText('No se aceptan devoluciones'));
  push('==================================');
  push(centerText('Generado desde el Sistema'));
  push(centerText('de Horytek Negocios'));

  return lines.join('\n');
}

export default function ReceiptPreviewModal({
  isOpen,
  onClose,
  logoUrl,
  nombre = '',
  direccion = '',
}) {
  const fecha = useMemo(() => new Date().toLocaleDateString('es-PE'), []);
  const hora = useMemo(() => new Date().toLocaleTimeString('es-PE', { hour12: false }), []);
  const [content, setContent] = useState('');

  useEffect(() => {
    setContent(buildPreviewContent(nombre, direccion, fecha, hora));
  }, [nombre, direccion, fecha, hora]);

  const descargarPdf = () => {
    if (!content) return;
    exportVoucherToPdf(content, { filename: 'comprobante_preview.pdf', receiptWidth: 80 });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" placement="center">
      <ModalContent className="bg-white rounded-2xl shadow-xl border border-blue-100">
        <ModalHeader className="border-b pb-3 flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
          ) : (
            <div className="h-8 w-8 rounded bg-blue-100/70 flex items-center justify-center text-blue-600 text-xs font-bold">
              LOGO
            </div>
          )}
          <span className="text-blue-900 font-semibold">Previsualizacion de comprobante</span>
        </ModalHeader>
        <ModalBody className="py-5 flex justify-center">
          <ScrollShadow hideScrollBar className="max-h-[70vh] w-full flex justify-center px-2">
            <div className="mx-auto w-full max-w-[360px] bg-white rounded-xl border border-blue-100 shadow-sm">
              <pre
                className="w-full px-4 py-6 text-[13px] leading-5 text-zinc-900 whitespace-pre"
                style={{ fontFamily: '"Consolas", "Menlo", "Courier New", "Fira Mono", "Monaco", monospace' }}
              >
                {content}
              </pre>
            </div>
          </ScrollShadow>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cerrar
          </Button>
          <Button color="primary" variant="shadow" onPress={descargarPdf} isDisabled={!content}>
            Descargar PDF
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

ReceiptPreviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  logoUrl: PropTypes.string,
  nombre: PropTypes.string,
  direccion: PropTypes.string,
};
