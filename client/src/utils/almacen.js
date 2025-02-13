
export function transformData(almacenes) {
    const almacenesTransformados = almacenes.map((almacen) => ({
        id_almacen: almacen.id_almacen,
        nom_almacen: almacen.nom_almacen,
        id_sucursal: almacen.id_sucursal,
        nombre_sucursal: almacen.nombre_sucursal,
        ubicacion: almacen.ubicacion,
        estado_almacen: parseInt(almacen.estado_almacen) === 0 ? "Inactivo" : "Activo"
    }));
  
    return almacenesTransformados;
}