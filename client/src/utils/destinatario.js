export function transformData(usuarios) {
    const usuariosTransformados = usuarios.map((destinatario) => ({
        id: destinatario.id,
        documento: destinatario.documento,
        destinatario: destinatario.destinatario,
        ubicacion: destinatario.ubicacion || "-",
        direccion: destinatario.direccion || "-",
        email: destinatario.email || "-",
        telefono: destinatario.telefono || "-",
        estado_destinatario: destinatario.estado_destinatario ?? destinatario.estado ?? destinatario.estado_proveedor ?? 1
    }));

    return usuariosTransformados;
}