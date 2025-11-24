import * as XLSX from 'xlsx';

export function exportAlmacenesLocal(almacenes = []) {
    if (!Array.isArray(almacenes) || almacenes.length === 0) return false;
    const headers = ['ID', 'Almacén', 'Sucursal', 'Ubicación', 'Estado'];
    const data = almacenes.map(a => [
        a.id_almacen || '',
        a.nom_almacen || '',
        a.nombre_sucursal || '',
        a.ubicacion || '',
        a.estado_almacen || ''
    ]);
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Almacenes');
    const fname = `almacenes_local_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fname);
    return true;
}

export function filterAlmacenesForExport(almacenes, searchTerm = '', statusFilter = 'all') {
    const term = searchTerm.toLowerCase();
    return almacenes.filter(a => {
        const matchesSearch = (a.nom_almacen || "").toLowerCase().includes(term);
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && a.estado_almacen === 'Activo') ||
            (statusFilter === 'inactive' && a.estado_almacen === 'Inactivo');

        return matchesSearch && matchesStatus;
    });
}
