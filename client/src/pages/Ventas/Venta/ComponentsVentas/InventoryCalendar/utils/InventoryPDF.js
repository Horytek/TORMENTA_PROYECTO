import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const generateInventoryPDF = (month, year, daysData) => {
    const doc = new jsPDF();

    // Title
    const monthName = format(new Date(year, month, 1), 'MMMM', { locale: es }).toUpperCase();
    doc.setFontSize(22);
    doc.text(`REPORTE DE INVENTARIO - ${monthName} ${year}`, 14, 20);

    doc.setFontSize(12);
    doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

    // Prepare data for table
    const tableRows = [];

    // Sort days
    const sortedDays = Object.keys(daysData).sort((a, b) => parseInt(a) - parseInt(b));

    sortedDays.forEach(day => {
        const dayData = daysData[day];
        if (dayData && dayData.products.length > 0) {
            // Add a header row for the day
            tableRows.push([{ content: `DÍA ${day}`, colSpan: 3, styles: { fillColor: [220, 220, 220], fontStyle: 'bold' } }]);

            // Add product rows
            dayData.products.forEach(prod => {
                tableRows.push([
                    prod.nombre,
                    prod.cantidad,
                    prod.subtotal
                ]);
            });

            // Add daily total row
            tableRows.push([
                { content: 'TOTAL DÍA', styles: { fontStyle: 'bold', halign: 'right' } },
                { content: dayData.totalQuantity, styles: { fontStyle: 'bold' } },
                { content: `S/ ${dayData.totalRevenue.toFixed(2)}`, styles: { fontStyle: 'bold' } }
            ]);
        }
    });

    doc.autoTable({
        startY: 40,
        head: [['Producto', 'Cantidad', 'Subtotal']],
        body: tableRows,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 40, halign: 'right' }
        }
    });

    doc.save(`Inventario_${monthName}_${year}.pdf`);
};
