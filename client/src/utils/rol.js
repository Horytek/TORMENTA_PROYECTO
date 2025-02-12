
export function transformData(usuarios) {
    const usuariosTransformados = usuarios.map((usuario) => ({
        id_rol: usuario.id_rol,
        nom_rol: usuario.nom_rol,
        estado_rol: parseInt(usuario.estado_rol) === 0 ? "Inactivo" : "Activo",
    }));
  
    return usuariosTransformados;
}