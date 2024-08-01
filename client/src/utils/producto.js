
export function transformData(productos) {
    const productosTransformados = productos.map((producto) => ({
        id_producto: producto.id_producto,
        descripcion: producto.descripcion.toUpperCase(),
        nom_marca: producto.nom_marca.toUpperCase(),
        nom_subcat: producto.nom_subcat.toUpperCase(),
        undm: producto.undm.toUpperCase(),
        precio: parseFloat(producto.precio).toFixed(2),    
        cod_barras: producto.cod_barras || "-",
        estado_producto: parseInt(producto.estado) === 0 ? "Inactivo" : "Activo",
    }));
  
    return productosTransformados;
}