export function transformData(usuarios) {
    const usuariosTransformados = usuarios.map((vendedor) => ({
        dni: vendedor.dni,
        usua: vendedor.usua,
        nombre: vendedor.nombre.trim(), // Eliminamos espacios extra
        nombres: vendedor.nombres,
        apellidos: vendedor.apellidos || "(Sin apellidos)", // Si está vacío, asignamos un valor por defecto
        telefono: vendedor.telefono,
        estado_vendedor: parseInt(vendedor.estado_vendedor) === 0 ? "Inactivo" : "Activo",
        id_usuario: vendedor.id_usuario
    }));
  
    return usuariosTransformados;
}