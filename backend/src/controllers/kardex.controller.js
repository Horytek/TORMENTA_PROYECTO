import { getConnection } from "./../database/database";

const getProductos = async (req, res) => {
    const { descripcion = '', almacen = 1 } = req.query;

    console.log('Filtros recibidos:', { descripcion, almacen });
    try {
        const connection = await getConnection();

        const [productosResult] = await connection.query(
            `
        SELECT 
          p.id_producto as codigo, p.descripcion as descripcion, m.nom_marca as marca, COALESCE(i.stock, 0) AS stock, p.undm as um, 
          CAST(p.precio AS DECIMAL(10, 2)) AS precio, p.cod_barras, p.estado_producto as estado
        FROM producto p 
        INNER JOIN marca m ON p.id_marca = m.id_marca 
        INNER JOIN inventario i ON p.id_producto = i.id_producto AND i.id_almacen = ?
        INNER JOIN sub_categoria CA ON CA.id_subcategoria = p.id_subcategoria
        WHERE p.descripcion LIKE ? and i.stock > 0
        GROUP BY p.id_producto, p.descripcion, m.nom_marca, i.stock
        ORDER BY p.id_producto DESC
        `,
            [almacen, `%${descripcion}%`]
        );


        console.log('Productos encontrados:', productosResult);

        res.json({ code: 1, data: productosResult });
    } catch (error) {
        res.status(500).send(error.message);
    }
};
const getMovimientosProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const [result] = await connection.query(`
                SELECT id_producto, id_marca, SC.id_categoria, PR.id_subcategoria, descripcion, precio, cod_barras, undm, estado_producto
                FROM producto PR
                INNER JOIN sub_categoria SC ON PR.id_subcategoria = SC.id_subcategoria
                WHERE PR.id_producto = ?`, id);

        if (result.length === 0) {
            return res.status(404).json({ data: result, message: "Producto no encontrado" });
        }

        res.json({ code: 1, data: result, message: "Producto encontrado" });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};
const getAlmacen = async (req, res) => {
    try {
      const connection = await getConnection();
      const [result] = await connection.query(`
              SELECT a.id_almacen AS id, a.nom_almacen AS almacen, COALESCE(s.nombre_sucursal,'Sin Sucursal') AS sucursal 
              FROM almacen a 
              LEFT JOIN sucursal_almacen sa ON a.id_almacen = sa.id_almacen
              LEFT JOIN sucursal s ON sa.id_sucursal = s.id_sucursal
              WHERE a.estado_almacen = 1
          `);
      res.json({ code: 1, data: result, message: "Almacenes listados" });
    } catch (error) {
      res.status(500);
      res.send(error.message);
    }
  };
export const methods = {
    getProductos,
    getAlmacen,
    getMovimientosProducto

};