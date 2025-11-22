import * as XLSX from 'xlsx';

export const generateExcel = (type, data) => {
    if (!data || data.length === 0) {
        // Si no hay datos, genera solo la cabecera como plantilla vacía
        return generateExcelTemplate(type);
    }

    // Define columns based on type
    let columns = [];
    switch (type) {
        case 'productos':
            columns = [
                { header: 'ID', key: 'id_producto' },
                { header: 'Descripción', key: 'descripcion' },
                { header: 'Marca', key: 'nom_marca' },
                { header: 'Categoría', key: 'nom_categoria' },
                { header: 'Subcategoría', key: 'nom_subcat' },
                { header: 'Unidad Medida', key: 'undm' },
                { header: 'Precio', key: 'precio' },
                { header: 'Código Barras', key: 'cod_barras' },
                { header: 'Estado', key: 'estado_producto' },
            ];
            break;
        case 'marcas':
            columns = [
                { header: 'ID', key: 'id_marca' },
                { header: 'Nombre Marca', key: 'nom_marca' },
                { header: 'Estado', key: 'estado_marca' },
            ];
            break;
        case 'categorias':
            columns = [
                { header: 'ID', key: 'id_categoria' },
                { header: 'Nombre Categoría', key: 'nom_categoria' },
                { header: 'Estado', key: 'estado_categoria' },
            ];
            break;
        case 'subcategorias':
            columns = [
                { header: 'ID', key: 'id_subcategoria' },
                { header: 'Nombre Subcategoría', key: 'nom_subcategoria' },
                { header: 'Categoría', key: 'nom_categoria' },
                { header: 'Estado', key: 'estado_subcategoria' },
            ];
            break;
        default:
            columns = Object.keys(data[0]).map(key => ({ header: key, key }));
    }

    // Construir los datos para SheetJS
    const sheetData = [
        columns.map(col => col.header),
        ...data.map(row => columns.map(col => row[col.key] ?? ''))
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type.charAt(0).toUpperCase() + type.slice(1));

    // Descargar el archivo
    XLSX.writeFile(wb, `Reporte_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Genera plantilla vacía solo con cabecera
export const generateExcelTemplate = (type) => {
    let columns = [];
    switch (type) {
        case 'productos':
            columns = [
                'Descripción', 'Marca', 'Categoría', 'Subcategoría', 'Unidad Medida', 'Precio', 'Código Barras', 'Estado'
            ];
            break;
        case 'marcas':
            columns = [
                'Nombre Marca', 'Estado'
            ];
            break;
        case 'categorias':
            columns = [
                'Nombre Categoría', 'Estado'
            ];
            break;
        case 'subcategorias':
            columns = [
                'Nombre Subcategoría', 'Categoría', 'Estado'
            ];
            break;
        default:
            columns = ['Campo1', 'Campo2'];
    }

    const sheetData = [columns];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type.charAt(0).toUpperCase() + type.slice(1));
    XLSX.writeFile(wb, `Plantilla_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
};