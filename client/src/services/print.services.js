import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { generateReceiptContent } from '@/pages/Ventas/Registro_Venta/ComponentsRegistroVentas/Comprobantes/Voucher/Voucher';
import { getEmpresaDataByUser } from '@/services/empresa.services';

/**
 * Handles thermal printing of the sales receipt.
 * @param {Object} datosVentaComprobante - Data formatted for the receipt content generator.
 * @param {Object} datosVenta - Additional sales data.
 * @param {string} observacionTexto - Observation text.
 * @param {string} nombreUsuario - Current user's name.
 * @param {string} nuevoNumComprobante - The generated voucher number.
 * @param {string} printMode - 'window' or 'pdf'.
 */
export const handlePrintThermal = async (datosVentaComprobante, datosVenta, observacionTexto, nombreUsuario, nuevoNumComprobante, printMode = 'window') => {
    try {
        const empresaData = await getEmpresaDataByUser(nombreUsuario);

        const observacion = { observacion: observacionTexto || '' };
        // Wrapper for voucher number to match legacy expected format
        const comprobante1 = { nuevoNumComprobante };

        // Generate content (monospaced text)
        const content = await generateReceiptContent(
            datosVentaComprobante,
            datosVenta,
            comprobante1,
            observacion,
            nombreUsuario,
            empresaData
        );

        const imgUrl = empresaData?.logotipo || '';
        const qrText = 'https://www.facebook.com/profile.php?id=100055385846115'; // Legacy hardcoded link?

        if (printMode === 'pdf') {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [75, 284] });

            const qrUrl = await QRCode.toDataURL(qrText, { width: 100, height: 100 });

            if (imgUrl) {
                try { doc.addImage(imgUrl, 'JPEG', 10, 10, 50, 50); } catch { }
            }

            doc.setFont('Courier');
            doc.setFontSize(8);
            doc.text(content, 3, 55);

            try { doc.addImage(qrUrl, 'PNG', 16, 230, 43, 43); } catch { }
            doc.save('recibo.pdf');

        } else {
            // Window Print
            const printWindow = window.open('', '', 'height=600,width=800');
            if (!printWindow) return;

            const qrUrl = await QRCode.toDataURL(qrText, { width: 100, height: 100 });

            printWindow.document.write(`
        <html>
          <head>
            <title>Recibo</title>
            <style>
              @page { size: 72mm 297mm; margin: 10px; }
              body { margin: 0; padding: 0; font-family: Courier, monospace; font-size: 10pt; width: 100%; }
              pre { margin: 0; font-size: 10pt; white-space: pre-wrap; }
              .center { text-align: center; }
              .qr { display: block; margin: 10px auto; }
              .image-container { display: flex; justify-content: center; }
            </style>
          </head>
          <body>
            <div class="image-container">
              ${imgUrl ? `<img src="${imgUrl}" alt="Logo" style="width: 140px; height: 140px;" />` : ''}
            </div>
            <pre>${content}</pre>
            <div class="image-container">
              <img src="${qrUrl}" alt="QR Code" class="qr" style="width: 80px; height: 80px;" />
            </div>
          </body>
        </html>
      `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    } catch (e) {
        console.error('Error printing thermal ticket:', e);
        throw e;
    }
};
