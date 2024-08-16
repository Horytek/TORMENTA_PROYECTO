import { getConnection } from "./../database/database";

const getProductos = async (req, res) => {
    const { descripcion = '', almacen = '', idProducto = '', marca = '', cat= '' , subcat = '' } = req.query;

    console.log('Filtros recibidos:', { descripcion, almacen, idProducto, marca, cat, subcat  });
    try {
        const connection = await getConnection();

        const [productosResult] = await connection.query(
            `
        SELECT 
         p.id_producto as codigo, p.descripcion as descripcion, m.nom_marca as marca, COALESCE(i.stock, 0) AS stock, p.undm as um, 
         CAST(p.precio AS DECIMAL(10, 2)) AS precio, p.cod_barras, p.estado_producto as estado
        FROM producto p 
        INNER JOIN marca m ON p.id_marca = m.id_marca 
        INNER JOIN inventario i ON p.id_producto = i.id_producto 
        INNER JOIN sub_categoria CA ON CA.id_subcategoria = p.id_subcategoria
        WHERE p.descripcion LIKE ?
          AND i.id_almacen LIKE ?
		  AND p.id_producto LIKE ?
		  AND m.id_marca LIKE ?
		  AND CA.id_categoria LIKE ?
          AND CA.id_subcategoria LIKE ?
        GROUP BY p.id_producto, p.descripcion, m.nom_marca, i.stock
        ORDER BY p.id_producto, p.descripcion
        `,
            [`%${descripcion}%`, `%${almacen}`, `%${idProducto}`, `%${marca}`, `%${cat}`, `%${subcat}`]
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
    const { cat= '' } = req.query;

    console.log('Filtros recibidos:', { cat });
    try {
      const connection = await getConnection();
      const [result] = await connection.query(`
              	   SELECT id_subcategoria AS id, nom_subcat AS sub_categoria FROM sub_categoria
	                WHERE estado_subcat = 1
                    AND id_categoria = ?;
          `,
          [cat]);
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
                        bn.entra AS entra,
                        bn.sale AS sale,
                        bn.stock_actual AS stock, 
                        p.precio AS precio, 
                        n.glosa AS glosa 
                    FROM 
                        nota n
                    INNER JOIN 
                        comprobante c ON n.id_comprobante = c.id_comprobante
                    INNER JOIN
                        bitacora_nota bn ON n.id_nota = bn.id_nota  
                    INNER JOIN 
                        producto p ON bn.id_producto = p.id_producto 

                    WHERE 
                        DATE_FORMAT(n.fecha, '%Y-%m-%d') >= ?
                        AND DATE_FORMAT(n.fecha, '%Y-%m-%d') <= ?
                        AND bn.id_producto = ?
                        AND bn.id_almacen = ?
                    ORDER BY 
                        documento;

            `,
            [fechaInicio, fechaFin, idProducto, idAlmacen]
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
                COALESCE(SUM(bn.entra), 0) AS entra, 
                COALESCE(SUM(bn.sale), 0) AS sale
            FROM 
                nota n
            INNER JOIN 
                detalle_nota dn ON n.id_nota = dn.id_nota
            INNER JOIN
                producto p ON dn.id_producto = p.id_producto
            INNER JOIN 
                bitacora_nota bn ON n.id_nota = bn.id_nota
            WHERE 
                DATE_FORMAT(n.fecha, '%Y-%m-%d') < ?
                AND p.id_producto = ?
                AND bn.id_almacen = ?;
            `,
            [fecha, idProducto,idAlmacen]
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