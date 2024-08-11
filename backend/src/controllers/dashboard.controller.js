import { getConnection } from "./../database/database";
import { subDays, subWeeks, subMonths, subYears, format } from "date-fns";

const getProductoMasVendido = async (req, res) => {
    try {
      const connection = await getConnection();
      
      const { tiempo } = req.query;
      
      let fechaInicio;
      const hoy = new Date();

      switch (tiempo) {
        case '24h':
          fechaInicio = subDays(hoy, 1);
          break;
        case 'semana':
          fechaInicio = subWeeks(hoy, 1);
          break;
        case 'mes':
          fechaInicio = subMonths(hoy, 1);
          break;
        case 'anio':
          fechaInicio = subYears(hoy, 1);
          break;
        default:
          return res.status(400).json({ message: "Filtro de tiempo no válido" });
      }

      const fechaInicioISO = format(fechaInicio, 'yyyy-MM-dd');

      const [result] = await connection.query(`
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
        WHERE 
          v.f_venta >= ?
        GROUP BY 
          p.id_producto, p.descripcion
        ORDER BY 
          total_vendido DESC
        LIMIT 1;
      `, [fechaInicioISO]);
  
      if (result.length === 0) {
        return res.status(404).json({ message: "No se encontraron productos vendidos." });
      }
  
      const productoMasVendido = result[0];
  
      res.json({ code: 1, data: productoMasVendido, message: "Producto más vendido obtenido correctamente" });
    } catch (error) {
      res.status(500).send(error.message);
    }
};

const getTotalProductosVendidos = async (req, res) => {
    try {
      const connection = await getConnection();

      const { tiempo } = req.query;
      
      let fechaInicio;
      const hoy = new Date();

      switch (tiempo) {
        case '24h':
          fechaInicio = subDays(hoy, 1);
          break;
        case 'semana':
          fechaInicio = subWeeks(hoy, 1);
          break;
        case 'mes':
          fechaInicio = subMonths(hoy, 1);
          break;
        case 'anio':
          fechaInicio = subYears(hoy, 1);
          break;
        default:
          return res.status(400).json({ message: "Filtro de tiempo no válido" });
      }

      // Formatear la fecha de inicio a formato ISO
      const fechaInicioISO = format(fechaInicio, 'yyyy-MM-dd');

      const [result] = await connection.query(`
        SELECT SUM(dv.cantidad) AS total_productos_vendidos
        FROM detalle_venta dv
        JOIN venta v ON dv.id_venta = v.id_venta
        WHERE v.f_venta >= ?
      `, [fechaInicioISO]);
      
      const totalProductosVendidos = result[0].total_productos_vendidos || 0;
  
      res.json({ code: 1, totalProductosVendidos, message: "Total de productos vendidos obtenido correctamente" });
    } catch (error) {
      res.status(500).send(error.message);
    }
};

export const methods = {
    getProductoMasVendido,
    getTotalProductosVendidos
};
