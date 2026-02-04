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

            // Group products by name
            const groupedProducts = {};
            dayData.products.forEach(prod => {
                const name = prod.nombre;
                if (!groupedProducts[name]) {
                    groupedProducts[name] = {
                        nombre: name,
                        totalQty: 0,
                        totalRevenue: 0,
                        variants: []
                    };
                }

                const qty = prod.cantidad;
                // Robust subtotal parsing
                const rawSub = typeof prod.subtotal === 'string'
                    ? parseFloat(prod.subtotal.replace(/[^\d.-]/g, ''))
                    : Number(prod.subtotal);
                const subVal = isNaN(rawSub) ? 0 : rawSub;

                groupedProducts[name].totalQty += qty;
                groupedProducts[name].totalRevenue += subVal;
                groupedProducts[name].variants.push({
                    ...prod,
                    subtotalValue: subVal
                });
            });

            // Add rows for each group
            Object.values(groupedProducts).forEach(group => {
                // Parent Row (Summary)
                tableRows.push([
                    { content: group.nombre, styles: { fontStyle: 'bold' } },
                    { content: group.totalQty, styles: { fontStyle: 'bold' } },
                    { content: `S/ ${group.totalRevenue.toFixed(2)}`, styles: { fontStyle: 'bold' } }
                ]);

                // Variant Rows (Indented)
                group.variants.forEach(variant => {
                    const variantLabel = `${variant.sku_label ? `${variant.sku_label}` : ''}${variant.attributes && typeof variant.attributes === 'object' ? ` - ${Object.values(variant.attributes).join(', ')}` : ''}`;
                    // Fallback for no specific variant info, avoiding empty rows or just " - "
                    const finalLabel = variantLabel.trim() ? `   ${variantLabel}` : `   (Variante)`;

                    tableRows.push([
                        { content: finalLabel, styles: { fontStyle: 'italic', textColor: [100, 100, 100] } },
                        { content: variant.cantidad, styles: { textColor: [100, 100, 100] } },
                        { content: `S/ ${variant.subtotalValue.toFixed(2)}`, styles: { textColor: [100, 100, 100] } }
                    ]);
                });
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
