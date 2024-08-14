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

export const methods = {
  getTotalSalesRevenue,
  getTotalProductosVendidos,
  getProductoMasVendido,
  getCantidadVentasPorProducto,
  getCantidadVentasPorSubcategoria,
  getAnalisisGananciasSucursales,
};
