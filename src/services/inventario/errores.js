/**
 * Errores del subsistema de inventario.
 *
 * Existe para que todos los flujos que mueven stock —venta, salida, guía—
 * respondan igual cuando no alcanza. Hoy cada controlador arma su propio
 * mensaje: `ventas.controller.js:365` lanza un 409 con texto propio y
 * `notasalida` falla de otra forma.
 */

export class StockInsuficienteError extends Error {
  /**
   * @param {{id_producto?:number, id_sku?:number, id_almacen?:number,
   *          disponible:number, solicitado:number, descripcion?:string}} detalle
   */
  constructor({ id_producto = null, id_sku = null, id_almacen = null, disponible, solicitado, descripcion = null }) {
    const nombre = descripcion || (id_sku ? `SKU ${id_sku}` : `producto ${id_producto}`);
    super(`Stock insuficiente de ${nombre}: se pidieron ${solicitado} y hay ${disponible}.`);
    this.name = "StockInsuficienteError";
    this.codigo = "STOCK_INSUFICIENTE";
    this.id_producto = id_producto;
    this.id_sku = id_sku;
    this.id_almacen = id_almacen;
    this.disponible = disponible;
    this.solicitado = solicitado;
  }
}

/** El producto no tiene ninguna variante en ese almacén: no es lo mismo que "se agotó". */
export class SinInventarioError extends Error {
  constructor({ id_producto, id_almacen, descripcion = null }) {
    super(
      `No hay inventario registrado de ${descripcion || `el producto ${id_producto}`} en el almacén ${id_almacen}.`
    );
    this.name = "SinInventarioError";
    this.codigo = "SIN_INVENTARIO";
    this.id_producto = id_producto;
    this.id_almacen = id_almacen;
  }
}

/** true si el error viene de este subsistema y el controlador puede traducirlo a 409. */
export const esErrorDeStock = (error) =>
  error instanceof StockInsuficienteError || error instanceof SinInventarioError;

export default { StockInsuficienteError, SinInventarioError, esErrorDeStock };
