import { getConnection } from "./../database/database";

const getTotalProductosVendidos = async (req, res) => {
  const { id_sucursal } = req.query; 

  try {
    const connection = await getConnection();

    let query = `
      SELECT SUM(dv.cantidad) AS total_productos_vendidos
      FROM detalle_venta dv
      JOIN venta v ON dv.id_venta = v.id_venta
    `;

    const params = [];

    if (id_sucursal) {
      query += ` WHERE v.id_sucursal = ?`;
      params.push(id_sucursal);
    }

    const [result] = await connection.query(query, params);
    const totalProductosVendidos = result[0].total_productos_vendidos || 0;

    res.json({ code: 1, totalProductosVendidos, message: "Total de productos vendidos obtenido correctamente" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};


const getTotalSalesRevenue = async (req, res) => {
  const { id_sucursal } = req.query;

  try {
    const connection = await getConnection();

    let query = `
      SELECT SUM(dv.total) AS totalRevenue 
      FROM detalle_venta dv
      JOIN venta v ON dv.id_venta = v.id_venta
    `;

    const params = [];

    if (id_sucursal) {
      query += ` WHERE v.id_sucursal = ?`;
      params.push(id_sucursal);
    }

    const [result] = await connection.query(query, params);
    res.status(200).json({ totalRevenue: result[0].totalRevenue || 0 });
  } catch (error) {
    console.error('Error en el servidor:', error.message);
    res.status(500).json({ message: "Error al obtener el total de ventas", error: error.message });
  }
};


const getProductoMasVendido = async (req, res) => {
  const { id_sucursal } = req.query;

  try {
    const connection = await getConnection();

    let query = `
      SELECT 
        p.id_producto,
        p.descripcion,
        SUM(dv.cantidad) AS total_vendido
      FROM 
        detalle_venta dv
      JOIN 
        producto p ON dv.id_producto = p.id_producto
      JOIN 
        venta v ON dv.id_venta = v.id_venta
    `;

    const params = [];

    if (id_sucursal) {
      query += ` WHERE v.id_sucursal = ?`;
      params.push(id_sucursal);
    }

    query += `
      GROUP BY 
        p.id_producto, p.descripcion
      ORDER BY 
        total_vendido DESC
      LIMIT 1
    `;

    const [result] = await connection.query(query, params);

    if (result.length === 0) {
      return res.status(404).json({ message: "No se encontraron productos vendidos." });
    }

    const productoMasVendido = result[0];
    res.json({ code: 1, data: productoMasVendido, message: "Producto más vendido obtenido correctamente" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};


const getCantidadVentasPorSubcategoria = async (req, res) => {
  const { id_sucursal } = req.query;

  try {
    const connection = await getConnection();

    let query = `
      SELECT 
        sc.nom_subcat AS subcategoria,
        SUM(dv.cantidad) AS cantidad_vendida
      FROM 
        detalle_venta dv
      JOIN 
        producto p ON dv.id_producto = p.id_producto
      JOIN 
        sub_categoria sc ON p.id_subcategoria = sc.id_subcategoria
      JOIN 
        venta v ON dv.id_venta = v.id_venta
    `;

    const params = [];

    if (id_sucursal) {
      query += ` WHERE v.id_sucursal = ?`;
      params.push(id_sucursal);
    }

    query += `
      GROUP BY 
        sc.nom_subcat
      ORDER BY 
        cantidad_vendida DESC
    `;

    const [result] = await connection.query(query, params);
    res.json({ code: 1, data: result, message: "Cantidad de ventas por subcategoría obtenida correctamente" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};


const getCantidadVentasPorProducto = async (req, res) => {
  const { id_sucursal } = req.query;

  try {
    const connection = await getConnection();

    let query = `
      SELECT 
        p.id_producto,
        p.descripcion,
        SUM(dv.cantidad) AS cantidad_vendida,
        SUM(dv.total) AS dinero_generado
      FROM 
        detalle_venta dv
      JOIN 
        producto p ON dv.id_producto = p.id_producto
      JOIN 
        venta v ON dv.id_venta = v.id_venta
    `;

    const params = [];

    if (id_sucursal) {
      query += ` WHERE v.id_sucursal = ?`;
      params.push(id_sucursal);
    }

    query += `
      GROUP BY 
        p.id_producto, p.descripcion
      ORDER BY 
        cantidad_vendida DESC
    `;

    const [result] = await connection.query(query, params);
    res.json({ code: 1, data: result, message: "Cantidad de ventas por producto obtenida correctamente" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};


const getAnalisisGananciasSucursales = async (req, res) => {
  try {
      const connection = await getConnection();
      const [result] = await connection.query(`
          SELECT 
              s.nombre_sucursal AS sucursal,
              DATE_FORMAT(v.f_venta, '%b %y') AS mes,
              SUM(dv.total) AS ganancias
          FROM 
              sucursal s
          JOIN 
              venta v ON s.id_sucursal = v.id_sucursal
          JOIN 
              detalle_venta dv ON v.id_venta = dv.id_venta
          GROUP BY 
              s.id_sucursal, mes
          ORDER BY 
              mes, s.id_sucursal
      `);

      res.json({ code: 1, data: result, message: "Análisis de ganancias por sucursal obtenido correctamente" });
  } catch (error) {
      if (!res.headersSent) {
          res.status(500).send(error.message);
      }
  }
};

const getVentasPDF = async (req, res) => {
  try {
    const connection = await getConnection();

    const [result] = await connection.query(`
      SELECT 
          v.id_venta AS id, 
          SUBSTRING(com.num_comprobante, 2, 3) AS serieNum, 
          SUBSTRING(com.num_comprobante, 6, 8) AS num,
          CASE 
              WHEN tp.nom_tipocomp = 'Nota de venta' THEN 'Nota' 
              ELSE tp.nom_tipocomp 
          END AS tipoComprobante, 
          CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_n, 
          cl.razon_social AS cliente_r,
          cl.dni AS dni, 
          cl.ruc AS ruc, 
          DATE_FORMAT(v.f_venta, '%Y-%m-%d') AS fecha, 
          v.igv AS igv, 
          SUM(dv.total) AS total, 
          CONCAT(ve.nombres, ' ', ve.apellidos) AS cajero,
          ve.dni AS cajeroId, 
          v.estado_venta AS estado, 
          s.nombre_sucursal, 
          s.ubicacion, 
          cl.direccion, 
          v.fecha_iso, 
          v.metodo_pago, 
          v.estado_sunat, 
          vb.id_venta_boucher, 
          usu.usua, 
          v.observacion
      FROM 
          venta v
      INNER JOIN 
          comprobante com ON com.id_comprobante = v.id_comprobante
      INNER JOIN 
          tipo_comprobante tp ON tp.id_tipocomprobante = com.id_tipocomprobante
      INNER JOIN 
          cliente cl ON cl.id_cliente = v.id_cliente
      INNER JOIN 
          detalle_venta dv ON dv.id_venta = v.id_venta
      INNER JOIN 
          sucursal s ON s.id_sucursal = v.id_sucursal
      INNER JOIN 
          vendedor ve ON ve.dni = s.dni
      INNER JOIN 
          venta_boucher vb ON vb.id_venta_boucher = v.id_venta_boucher
      INNER JOIN 
          usuario usu ON usu.id_usuario = ve.id_usuario
      GROUP BY 
          id, serieNum, num, tipoComprobante, cliente_n, cliente_r, dni, ruc, 
          DATE_FORMAT(v.f_venta, '%Y-%m-%d'), igv, cajero, cajeroId, estado
      ORDER BY 
          v.id_venta DESC;
    `);

    res.json({ code: 1, data: result, message: "Reporte de ventas" });

  } catch (error) {
    console.error('Error al obtener los datos de ventas:', error);
    res.status(500).json({ message: 'Error al obtener los datos de ventas' });
  }
};

export const methods = {
  getTotalSalesRevenue,
  getTotalProductosVendidos,
  getVentasPDF,
  getProductoMasVendido,
  getCantidadVentasPorProducto,
  getCantidadVentasPorSubcategoria,
  getAnalisisGananciasSucursales,
};
