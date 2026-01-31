import axios from "@/api/axios";

/**
 * Servicio consolidado para Kardex
 * Todas las llamadas API relacionadas con kardex e inventario
 */

// ============================================
// KARDEX - DATOS Y CONSULTAS
// ============================================

/**
 * Obtener productos para kardex con filtros
 */
export const getProductosKardex = async (filters) => {
  try {
    const response = await axios.get('/kardex', { params: filters });

    if (response.data.code === 1) {
      return { success: true, data: response.data.data };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error('Error al obtener productos kardex:', error.message);
    return { success: false, data: [] };
  }
};

/**
 * Obtener detalle completo de kardex (transacciones actuales, previas y producto)
 */
export const getDetalleKardexCompleto = async (filters) => {
  try {
    // Ejecutar las 3 peticiones en paralelo para mayor rendimiento
    const [responseKardex, responsePrev, responseProducto] = await Promise.all([
      axios.get('/kardex/detalleK', { params: filters }),
      axios.get('/kardex/detalleKA', {
        params: {
          fecha: filters.fechaInicio,
          idProducto: filters.idProducto,
          idAlmacen: filters.idAlmacen,
        },
      }),
      axios.get('/kardex/producto', { params: filters })
    ]);

    // Verificar respuestas exitosas
    if (responseKardex.data.code === 1 && responsePrev.data.code === 1 && responseProducto.data.code === 1) {
      return {
        success: true,
        kardex: responseKardex.data.data,
        previousTransactions: responsePrev.data.data,
        productos: responseProducto.data.data
      };
    } else {
      const errorMsg = responseKardex.data.message || responsePrev.data.message || responseProducto.data.message;
      console.error('Error al obtener detalle kardex:', errorMsg);
      return {
        success: false,
        kardex: [],
        previousTransactions: null,
        productos: []
      };
    }
  } catch (error) {
    console.error('Error al obtener detalle kardex:', error.message);
    return {
      success: false,
      kardex: [],
      previousTransactions: null,
      productos: []
    };
  }
};

/**
 * Obtener información de un producto específico
 */
export const getProductoInfo = async (filters) => {
  try {
    const response = await axios.get('/kardex/producto', { params: filters });

    if (response.data.code === 1) {
      return { success: true, data: response.data.data };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error('Error al obtener info de producto:', error.message);
    return { success: false, data: [] };
  }
};

/**
 * Obtener productos con stock menor al mínimo
 */
export const getProductosStockMinimo = async (filters) => {
  try {
    const response = await axios.get('/kardex/menorstock', { params: filters });

    if (response.data.code === 1) {
      return { success: true, data: response.data.data };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error('Error al obtener productos con stock mínimo:', error.message);
    return { success: false, data: [] };
  }
};


/**
 * Obtener detalle de stock por SKU (para modal)
 */
export const getProductStockDetails = async (idProducto, idAlmacen) => {
  try {
    const response = await axios.get('/kardex/stock-details', {
      params: { idProducto, idAlmacen }
    });

    if (response.data.code === 1) {
      return { success: true, data: response.data.data };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error('Error al obtener detalle de stock:', error.message);
    return { success: false, data: [] };
  }
};

// ============================================
// REPORTES EXCEL
// ============================================

/**
 * Descargar reporte Excel de kardex por mes
 */
export const downloadExcelReporteMes = async (mes, year, almacen) => {
  try {
    const response = await axios.get('/kardex/generate-excel', {
      params: { mes, year, almacen },
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `reporte-kardex-${mes}-${year}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, message: 'Reporte descargado' };
  } catch (error) {
    console.error("Error al descargar reporte Excel:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Descargar reporte Excel de kardex por rango de fechas
 */
export const downloadExcelReporteFechas = async (startDate, endDate, almacen) => {
  try {
    const response = await axios.get('/kardex/generate-excel-date', {
      params: { startDate, endDate, almacen },
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `reporte-kardex-${startDate}-${endDate}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, message: 'Reporte descargado' };
  } catch (error) {
    console.error("Error al descargar reporte Excel:", error);
    return { success: false, message: error.message };
  }
};

// ============================================
// DATOS AUXILIARES
// ============================================

/**
 * Obtener almacenes para kardex
 */
export const getAlmacenesKardex = async () => {
  try {
    const response = await axios.get('/kardex/almacen');

    if (response.data.code === 1) {
      return { success: true, data: response.data.data };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error('Error al obtener almacenes:', error.message);
    return { success: false, data: [] };
  }
};

/**
 * Obtener marcas para filtros de kardex
 */
export const getMarcasKardex = async () => {
  try {
    const response = await axios.get('/kardex/marca');

    if (response.data.code === 1) {
      return { success: true, data: response.data.data };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error('Error al obtener marcas:', error.message);
    return { success: false, data: [] };
  }
};

/**
 * Obtener categorías para filtros de kardex
 */
export const getCategoriasKardex = async () => {
  try {
    const response = await axios.get('/kardex/categoria');

    if (response.data.code === 1) {
      return { success: true, data: response.data.data };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error('Error al obtener categorías:', error.message);
    return { success: false, data: [] };
  }
};

/**
 * Obtener subcategorías para filtros de kardex
 */
export const getSubcategoriasKardex = async (idCategoria) => {
  try {
    const response = await axios.get('/kardex/subcategoria', {
      params: { cat: idCategoria }
    });

    if (response.data.code === 1) {
      return { success: true, data: response.data.data };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error('Error al obtener subcategorías:', error.message);
    return { success: false, data: [] };
  }
};

// Exportación por defecto
const kardexService = {
  getProductosKardex,
  getDetalleKardexCompleto,
  getProductoInfo,
  getProductosStockMinimo,
  downloadExcelReporteMes,
  downloadExcelReporteFechas,
  getAlmacenesKardex,
  getMarcasKardex,
  getCategoriasKardex,
  getSubcategoriasKardex,
  getProductStockDetails
};

export default kardexService;

