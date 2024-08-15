import { getConnection } from "./../database/database";

const getProductos = async (req, res) => {
    const { descripcion = '', almacen = 2 } = req.query;

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

  const getMarcas = async (req, res) => {
    try {
      const connection = await getConnection();
      const [result] = await connection.query(`
              	SELECT id_marca AS id, nom_marca AS marca FROM marca
	            WHERE estado_marca = 1;
          `);
      res.json({ code: 1, data: result, message: "Marcas listadas" });
    } catch (error) {
      res.status(500);
      res.send(error.message);
    }
  };

  const getSubCategorias= async (req, res) => {
    try {
      const connection = await getConnection();
      const [result] = await connection.query(`
              	   SELECT id_subcategoria AS id, nom_subcat AS sub_categoria FROM sub_categoria
	                WHERE estado_subcat = 1;
          `);
      res.json({ code: 1, data: result, message: "Sub categorias listadas" });
    } catch (error) {
      res.status(500);
      res.send(error.message);
    }
  };

  const getCategorias= async (req, res) => {
    try {
      const connection = await getConnection();
      const [result] = await connection.query(`
              	      SELECT id_categoria as id, nom_categoria as categoria FROM categoria
	                  WHERE estado_categoria = 1;
          `);
      res.json({ code: 1, data: result, message: "Categorias listadas" });
    } catch (error) {
      res.status(500);
      res.send(error.message);
    }
  };

  const getDetalleKardex = async (req, res) => {
    const { fechaInicio, fechaFin, idProducto, idAlmacen} = req.query;

    try {
        const connection = await getConnection();

        const [detalleKardexResult] = await connection.query(
            `
            SELECT 
                n.fecha AS fecha, 
                c.num_comprobante AS documento, 
                n.nom_nota AS nombre, 
                CASE 
                    WHEN n.id_tiponota = 1 THEN dn.cantidad 
                    ELSE '' 
                END AS entra, 
                CASE 
                    WHEN n.id_tiponota = 2 THEN dn.cantidad 
                    ELSE '' 
                END AS sale, 
                i.stock AS stock, 
                p.precio AS precio, 
                n.glosa AS glosa 
            FROM 
                nota n
            INNER JOIN 
                comprobante c ON n.id_comprobante = c.id_comprobante 
            INNER JOIN 
                detalle_nota dn ON n.id_nota = dn.id_nota
            INNER JOIN 
                producto p ON dn.id_producto = p.id_producto
            INNER JOIN 
                inventario i ON p.id_producto = i.id_producto
            WHERE 
                DATE_FORMAT(n.fecha, '%Y-%m-%d') >= ? 
                AND DATE_FORMAT(n.fecha, '%Y-%m-%d') <= ? 
                AND p.id_producto = ? 
                AND (n.id_almacenO = ? OR n.id_almacenD = ?)
            GROUP BY 
                fecha, documento, nombre, entra, sale, stock, precio, glosa
            ORDER BY 
                documento;
            `,
            [fechaInicio, fechaFin, idProducto, idAlmacen, idAlmacen]
        );

        res.json({ code: 1, data: detalleKardexResult });
    } catch (error) {
        res.status(500).send(error.message);
    }
};


const getDetalleKardexAnteriores = async (req, res) => {
    const { fecha = '2024-08-01', idProducto = 3 ,idAlmacen = 2 } = req.query;

    try {
        const connection = await getConnection();

        const [detalleKardexAnterioresResult] = await connection.query(
            `
            SELECT 
                COUNT(*) AS numero, 
                COALESCE( SUM(CASE 
                    WHEN n.id_tiponota = 1 THEN dn.cantidad 
                    ELSE 0 
                END), 0 ) AS entra, 
                COALESCE ( SUM(CASE 
                    WHEN n.id_tiponota = 2 THEN dn.cantidad 
                    ELSE 0 
                END), 0 ) AS sale
            FROM 
                nota n
            INNER JOIN 
                detalle_nota dn ON n.id_nota = dn.id_nota
            INNER JOIN
                producto p on dn.id_producto=p.id_producto
            WHERE 
                DATE_FORMAT(n.fecha, '%Y-%m-%d') < ? 
                AND p.id_producto = ? 
                AND (n.id_almacenO = ? OR n.id_almacenD = ?);
            `,
            [fecha, idProducto,idAlmacen, idAlmacen]
        );

        res.json({ code: 1, data: detalleKardexAnterioresResult });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

const getInfProducto = async (req, res) => {
    const { idProducto ,idAlmacen } = req.query;
    
    try {
        const connection = await getConnection();

        const [infProductoResult] = await connection.query(
            `
            SELECT p.id_producto AS codigo, p.descripcion AS descripcion, m.nom_marca AS marca, i.stock AS stock
            FROM producto p 
            INNER JOIN marca m on p.id_marca = m.id_marca
            INNER JOIN inventario i on p.id_producto = i.id_producto
            WHERE p.id_producto = ?
            AND i.id_almacen = ?
            GROUP BY codigo, descripcion, marca, stock;
            `,
            [idProducto,idAlmacen]
        );

        res.json({ code: 1, data: infProductoResult });
    } catch (error) {
        res.status(500).send(error.message);
    }
};


export const methods = {
    getProductos,
    getAlmacen,
    getMovimientosProducto,
    getMarcas,
    getSubCategorias,
    getCategorias,
    getDetalleKardex,
    getDetalleKardexAnteriores,
    getInfProducto
};