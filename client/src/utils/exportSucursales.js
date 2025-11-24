import * as XLSX from 'xlsx';

export function exportSucursalesLocal(sucursales = []) {
    if (!Array.isArray(sucursales) || sucursales.length === 0) return false;
    const headers = ['Vendedor', 'Nombre', 'Dirección', 'Estado'];
    const data = sucursales.map(s => [
        s.nombre_vendedor || '',
        s.nombre_sucursal || '',
        s.ubicacion || '',
        s.estado_sucursal === 1 ? 'Activo' : 'Inactivo'
    ]);
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Sucursales');
    const fname = `sucursales_local_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fname);
    return true;
}

export function filterSucursalesForExport(sucursales, searchTerm = '', statusFilter = 'all') {
    const term = searchTerm.toLowerCase();
    return sucursales.filter(s => {
        const matchesSearch = (s.nombre_sucursal || "").toLowerCase().includes(term);
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && s.estado_sucursal === 1) ||
            (statusFilter === 'inactive' && s.estado_sucursal === 0);

        return matchesSearch && matchesStatus;
    });
}
