import * as XLSX from 'xlsx';

export function exportProveedoresLocal(proveedores = []) {
    if (!Array.isArray(proveedores) || proveedores.length === 0) return false;
    const headers = ['Documento', 'Razón Social / Nombre', 'Ubicación', 'Dirección', 'Email', 'Teléfono'];
    const data = proveedores.map(p => [
        p.documento || '',
        p.destinatario || '',
        p.ubicacion || '',
        p.direccion || '',
        p.email || '',
        p.telefono || ''
    ]);
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Proveedores');
    const fname = `proveedores_local_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fname);
    return true;
}

export function filterProveedoresForExport(proveedores, searchTerm = '') {
    const term = searchTerm.toLowerCase();
    return proveedores.filter(p => {
        if (!p.destinatario || !p.destinatario.toLowerCase().includes(term)) return false;
        return true;
    });
}
