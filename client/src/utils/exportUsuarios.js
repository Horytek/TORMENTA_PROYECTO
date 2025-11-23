import * as XLSX from 'xlsx';

export function exportUsuariosLocal(usuarios = []) {
  if (!Array.isArray(usuarios) || usuarios.length === 0) return false;
  const headers = ['Usuario','Rol','Estado','Conectado'];
  const data = usuarios.map(u => [
    u.usua || '',
    u.nom_rol || '',
    (u.estado_usuario === 1 || u.estado_usuario === '1' || u.estado_usuario === 'Activo') ? 'Activo' : 'Inactivo',
    u.estado_token === 1 ? 'Sí' : 'No'
  ]);
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Usuarios');
  const fname = `usuarios_local_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, fname);
  return true;
}

export function filterUsuariosForExport(usuarios, searchTerm = '', filters = {}) {
  const term = searchTerm.toLowerCase();
  return usuarios.filter(u => {
    if (!u.usua || !u.usua.toLowerCase().includes(term)) return false;
    if (filters.role && u.id_rol != filters.role) return false;
    if (filters.status !== undefined && filters.status !== '') {
      const isActive = u.estado_usuario === 1 || u.estado_usuario === '1' || u.estado_usuario === 'Activo';
      const filterActive = filters.status === '1';
      if (isActive !== filterActive) return false;
    }
    if (filters.connection !== undefined && filters.connection !== '') {
      const filterConnected = filters.connection === '1';
      if (u.estado_token != (filterConnected ? 1 : 0)) return false;
    }
    return true;
  });
}
