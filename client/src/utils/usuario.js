
export function transformData(usuarios) {
    const usuariosTransformados = usuarios.map((usuario) => ({
        id_usuario: usuario.id_usuario,
        id_rol: usuario.id_rol,
        nom_rol: usuario.nom_rol,
        usua: usuario.usua,
        contra: usuario.contra,
        estado_usuario: parseInt(usuario.estado_usuario) === 0 ? "Inactivo" : "Activo",
        estado_usuario_1: usuario.estado_usuario,
        estado_token: usuario.estado_token,
        empresa: usuario.empresa,
        plan_pago: usuario.plan_pago_1,
        fecha_pago: usuario.fecha_pago
    }));
  
    return usuariosTransformados;
}