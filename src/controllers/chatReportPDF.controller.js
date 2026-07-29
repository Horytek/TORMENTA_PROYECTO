import { GoogleGenerativeAI } from "@google/generative-ai";
import { getConnection } from "../database/database.js";
import PDFDocument from "pdfkit";
import { 
  normalizePeriod, 
  formatCurrency, 
  formatNumber,
  getMonthName,
  validateDateRange
} from "../utils/chatHelpers.js";

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";

/**
 * Generar reporte PDF usando IA
 * POST /api/chat/generate-report
 * Body: { type: "mensual|anual", period: "2024-01", modules: ["ventas", "productos"] }
 */
export const generateAIReport = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { type = "mensual", period, modules = ["ventas"] } = req.body;
    const id_tenant = req.id_tenant;
    
    // Validaciones
    if (!period) {
      return res.status(400).json({ error: "Periodo requerido (ej: 2024-01 o 2024)" });
    }
    
    // Validar formato de periodo
    if (type === "mensual" && !/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({ 
        error: "Formato de periodo mensual inválido. Use YYYY-MM (ej: 2024-01)" 
      });
    }
    
    if (type === "anual" && !/^\d{4}$/.test(period)) {
      return res.status(400).json({ 
        error: "Formato de periodo anual inválido. Use YYYY (ej: 2024)" 
      });
    }
    
    // Validar módulos
    const validModules = ["ventas", "productos", "inventario", "clientes"];
    const invalidModules = modules.filter(m => !validModules.includes(m));
    if (invalidModules.length > 0) {
      return res.status(400).json({ 
        error: `Módulos inválidos: ${invalidModules.join(", ")}. Válidos: ${validModules.join(", ")}` 
      });
    }

    // 1. Obtener datos del periodo
    const data = await fetchReportData(type, period, modules, id_tenant);
    
    // Validar que hay al menos un módulo con datos
    const hasData = Object.values(data).some(moduleData => 
      Array.isArray(moduleData) ? moduleData.length > 0 : moduleData
    );
    
    if (!hasData) {
      return res.status(404).json({ 
        error: "No hay datos disponibles para el periodo seleccionado",
        suggestion: "Verifica que existan registros en el periodo especificado" 
      });
    }

    // 2. Generar análisis con IA
    const analysis = await generateAIAnalysis(data, type, period, modules);

    // 3. Crear PDF
    const pdfBuffer = await createReportPDF({
      type,
      period,
      modules,
      data,
      analysis,
      tenant: id_tenant
    });

    // 4. Enviar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_${type}_${period}.pdf"`);
    res.send(pdfBuffer);

    const elapsed = Date.now() - startTime;
    console.log(`✅ REPORT_PDF_SUCCESS: ${elapsed}ms - ${type} ${period}`);

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ REPORT_PDF_ERR (${elapsed}ms):`, error.message);
    console.error(error.stack);
    
    let statusCode = 500;
    let errorMessage = "Error generando reporte";
    let suggestion = "Intenta nuevamente o contacta al administrador";
    
    if (error.message?.includes('ANALYSIS_TIMEOUT')) {
      statusCode = 408;
      errorMessage = "El análisis tomó demasiado tiempo";
      suggestion = "Intenta con un periodo más corto o menos módulos";
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      statusCode = 500;
      errorMessage = "Error en la base de datos";
      suggestion = "Verifica la estructura de la base de datos";
    } else if (error.message?.includes('getConnection')) {
      statusCode = 503;
      errorMessage = "Servicio de base de datos no disponible";
      suggestion = "Intenta nuevamente en unos momentos";
    }
    
    return res.status(statusCode).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      suggestion
    });
  }
};

/**
 * Obtener datos del periodo según tipo de reporte
 */
async function fetchReportData(type, period, modules, id_tenant) {
  let connection;
  try {
    connection = await getConnection();
    const data = {};

    // Determinar rango de fechas
    const { startDate, endDate } = getDateRange(type, period);

    // Ventas
    if (modules.includes("ventas")) {
      const [ventas] = await connection.query(
        `
        SELECT 
          DATE(v.f_venta) as fecha,
          COUNT(DISTINCT v.id_venta) as total_ventas,
          COALESCE(SUM(dv.total), 0) as monto_total,
          COALESCE(AVG(dv.total), 0) as ticket_promedio
        FROM venta v
        LEFT JOIN detalle_venta dv ON v.id_venta = dv.id_venta
        WHERE v.id_tenant = ? 
          AND v.fecha_iso BETWEEN ? AND ?
          AND v.estado_venta = 1
        GROUP BY DATE(v.f_venta)
        ORDER BY fecha
        `,
        [id_tenant, startDate, endDate]
      );
      data.ventas = ventas || [];

      // Top productos vendidos
      const [topProductos] = await connection.query(
        `
        SELECT 
          p.descripcion as nombre,
          SUM(dv.cantidad) as cantidad_vendida,
          SUM(dv.total) as total_vendido
        FROM detalle_venta dv
        INNER JOIN venta v ON dv.id_venta = v.id_venta
        INNER JOIN producto p ON dv.id_producto = p.id_producto
        WHERE v.id_tenant = ?
          AND v.fecha_iso >= ?
          AND v.fecha_iso <= ?
          AND v.estado_venta = 1
        GROUP BY p.id_producto, p.descripcion
        ORDER BY cantidad_vendida DESC
        LIMIT 10
        `,
        [id_tenant, startDate, endDate]
      );
      data.topProductos = topProductos;
    }

    // Productos (Inventario)
    if (modules.includes("productos") || modules.includes("inventario")) {
      const [inventario] = await connection.query(
        `
        SELECT 
          p.descripcion as nombre,
          COALESCE(SUM(i.stock), 0) as stock,
          p.precio as precio_venta,
          COALESCE(SUM(i.stock), 0) * p.precio as valor_inventario,
          c.nombre_categoria as categoria
        FROM producto p
        LEFT JOIN producto_sku psk ON psk.id_producto = p.id_producto AND psk.id_tenant = p.id_tenant
        LEFT JOIN inventario_stock i ON i.id_sku = psk.id_sku AND i.id_tenant = psk.id_tenant
        LEFT JOIN sub_categoria sc ON p.id_subcategoria = sc.id_subcategoria
        LEFT JOIN categoria c ON sc.id_categoria = c.id_categoria
        WHERE p.id_tenant = ?
        GROUP BY p.id_producto, p.descripcion, p.precio, c.nombre_categoria
        ORDER BY valor_inventario DESC
        LIMIT 20
        `,
        [id_tenant]
      );
      data.inventario = inventario;

      // Stock crítico
      const [stockCritico] = await connection.query(
        `
        SELECT 
          p.descripcion as nombre,
          COALESCE(SUM(i.stock), 0) as stock,
          5 as stock_minimo
        FROM producto p
        LEFT JOIN producto_sku psk ON psk.id_producto = p.id_producto AND psk.id_tenant = p.id_tenant
        LEFT JOIN inventario_stock i ON i.id_sku = psk.id_sku AND i.id_tenant = psk.id_tenant
        WHERE p.id_tenant = ?
        GROUP BY p.id_producto, p.descripcion
        HAVING stock <= 5 AND stock > 0
        ORDER BY stock ASC
        `,
        [id_tenant]
      );
      data.stockCritico = stockCritico;
    }

    // Clientes
    if (modules.includes("clientes")) {
      const [topClientes] = await connection.query(
        `
        SELECT 
          c.nombre,
          c.apellido,
          COUNT(DISTINCT v.id_venta) as total_compras,
          COALESCE(SUM(dv.total), 0) as total_gastado
        FROM cliente c
        INNER JOIN venta v ON c.id_cliente = v.id_cliente
        LEFT JOIN detalle_venta dv ON v.id_venta = dv.id_venta
        WHERE v.id_tenant = ?
          AND v.fecha_iso >= ?
          AND v.fecha_iso <= ?
          AND v.estado_venta = 1
        GROUP BY c.id_cliente, c.nombre, c.apellido
        ORDER BY total_gastado DESC
        LIMIT 10
        `,
        [id_tenant, startDate, endDate]
      );
      data.topClientes = topClientes;
    }

    return data;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Generar análisis usando Gemini
 */
async function generateAIAnalysis(data, type, period, modules) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: MODEL,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1200,
        topP: 0.95,
      }
    });

    // Resumir datos si son muy extensos
    const dataSummary = {
      ventas: data.ventas ? {
        total: data.ventas.length,
        montoTotal: data.ventas.reduce((sum, v) => sum + (parseFloat(v.monto_total) || 0), 0),
        ticketPromedio: data.ventas.length > 0 
          ? (data.ventas.reduce((sum, v) => sum + (parseFloat(v.monto_total) || 0), 0) / data.ventas.length).toFixed(2)
          : 0
      } : null,
      topProductos: data.topProductos ? data.topProductos.slice(0, 5) : null,
      stockCritico: data.stockCritico ? data.stockCritico.length : 0,
      topClientes: data.topClientes ? data.topClientes.slice(0, 5) : null
    };

    const prompt = `Eres un analista de negocios experto en retail y ERP. Analiza estos datos y genera un informe ejecutivo.

TIPO: ${type === 'mensual' ? 'Mensual' : 'Anual'}
PERIODO: ${period}
MÓDULOS: ${modules.join(', ')}

DATOS RESUMIDOS:
${JSON.stringify(dataSummary, null, 2)}

GENERA:

1. RESUMEN EJECUTIVO (2-3 párrafos)
Un análisis general del desempeño del periodo.

2. HALLAZGOS CLAVE (3-5 puntos)
Insights específicos y accionables.

3. TENDENCIAS OBSERVADAS
Patrones relevantes en los datos.

4. RECOMENDACIONES (3-4 puntos)
Acciones concretas para mejorar.

5. MÉTRICAS DESTACADAS
Números importantes a resaltar.

Formato: Texto profesional, sin markdown, con saltos de línea entre secciones.`;

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('ANALYSIS_TIMEOUT')), 20000)
    );
    
    const analysisPromise = model.generateContent(prompt).then(r => r.response.text());
    
    const result = await Promise.race([analysisPromise, timeoutPromise]);
    return result;
    
  } catch (error) {
    console.error("Error generando análisis IA:", error.message);
    
    if (error.message === 'ANALYSIS_TIMEOUT') {
      return "Análisis en progreso... Los datos muestran actividad durante el periodo seleccionado.";
    }
    
    return "Análisis no disponible. Por favor, revise los datos manualmente.";
  }
}

/**
 * Crear documento PDF
 */
async function createReportPDF({ type, period, modules, data, analysis, tenant }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: `Reporte ${type} - ${period}`,
          Author: 'HoryCore ERP',
          Subject: `Reporte generado por IA`
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Encabezado
      doc.fontSize(24).font('Helvetica-Bold')
         .text('HoryCore ERP', { align: 'center' });
      
      doc.fontSize(18).font('Helvetica')
         .text(`Reporte ${type === 'mensual' ? 'Mensual' : 'Anual'}`, { align: 'center' });
      
      doc.fontSize(12).fillColor('#666')
         .text(`Periodo: ${period}`, { align: 'center' })
         .text(`Generado: ${new Date().toLocaleString('es-PE')}`, { align: 'center' })
         .moveDown(2);

      doc.fillColor('#000');

      // Análisis IA
      doc.fontSize(16).font('Helvetica-Bold')
         .text('📊 Análisis Inteligente', { underline: true })
         .moveDown(0.5);

      doc.fontSize(10).font('Helvetica')
         .text(analysis, { align: 'justify' })
         .moveDown(2);

      // Datos de Ventas
      if (data.ventas && data.ventas.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold')
           .text('💰 Resumen de Ventas')
           .moveDown(0.5);

        const totalVentas = data.ventas.reduce((sum, v) => sum + parseFloat(v.monto_total || 0), 0);
        const totalGanancia = data.ventas.reduce((sum, v) => sum + parseFloat(v.ganancia_total || 0), 0);
        const cantidadVentas = data.ventas.reduce((sum, v) => sum + parseInt(v.total_ventas || 0), 0);
        const margen = totalVentas > 0 ? ((totalGanancia / totalVentas) * 100) : 0;
        const ticketPromedio = cantidadVentas > 0 ? (totalVentas / cantidadVentas) : 0;

        doc.fontSize(10).font('Helvetica')
           .text(`Total Ventas: S/. ${totalVentas.toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`)
           .text(`Ganancia Total: S/. ${totalGanancia.toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`)
           .text(`Margen: ${margen.toFixed(1)}%`)
           .text(`Cantidad de Ventas: ${cantidadVentas.toLocaleString('es-PE')}`)
           .text(`Ticket Promedio: S/. ${ticketPromedio.toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`)
           .moveDown(1);
      }

      // Top Productos
      if (data.topProductos && data.topProductos.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold')
           .text('🏆 Top 10 Productos Más Vendidos')
           .moveDown(0.5);

        doc.fontSize(9).font('Helvetica');
        data.topProductos.slice(0, 10).forEach((p, i) => {
          doc.text(`${i + 1}. ${p.nombre} - Vendidos: ${p.cantidad_vendida} unidades - Total: S/. ${parseFloat(p.total_vendido).toFixed(2)}`);
        });
        doc.moveDown(1);
      }

      // Stock Crítico
      if (data.stockCritico && data.stockCritico.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold')
           .fillColor('#CC0000')
           .text('⚠️ Productos con Stock Crítico')
           .fillColor('#000')
           .moveDown(0.5);

        doc.fontSize(9).font('Helvetica');
        data.stockCritico.forEach(p => {
          doc.text(`• ${p.nombre}: ${p.stock} unidades (mínimo: ${p.stock_minimo})`);
        });
        doc.moveDown(1);
      }

      // Top Clientes
      if (data.topClientes && data.topClientes.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold')
           .text('👥 Top 10 Mejores Clientes')
           .moveDown(0.5);

        doc.fontSize(9).font('Helvetica');
        data.topClientes.slice(0, 10).forEach((c, i) => {
          doc.text(`${i + 1}. ${c.nombre} ${c.apellido} - Compras: ${c.total_compras} - Total: S/. ${parseFloat(c.total_gastado).toFixed(2)}`);
        });
        doc.moveDown(1);
      }

      // Pie de página
      doc.fontSize(8).fillColor('#999')
         .text('_'.repeat(80), { align: 'center' })
         .text('Reporte generado automáticamente por HoryCore ERP con tecnología de IA', { align: 'center' })
         .text(`Tenant: ${tenant}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Calcular rango de fechas según tipo y periodo
 */
function getDateRange(type, period) {
  const now = new Date();
  
  if (type === 'mensual') {
    // Format: YYYY-MM
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  } else {
    // Anual - Format: YYYY
    const year = parseInt(period);
    return {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`
    };
  }
}
