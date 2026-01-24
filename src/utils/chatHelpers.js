/**
 * Utilidades para el chatbot
 * Funciones helper reutilizables
 */

/**
 * Sugerencias contextuales según la consulta
 */
export function getContextualSuggestions(query) {
  const q = query.toLowerCase();
  const suggestions = [];

  if (q.includes('venta') || q.includes('factura') || q.includes('boleta')) {
    suggestions.push(
      '💡 Puedes preguntar: "¿Cuántas ventas hubo hoy?"',
      '💡 También: "Muéstrame el top 10 de productos vendidos"'
    );
  }

  if (q.includes('reporte') || q.includes('informe')) {
    suggestions.push(
      '📊 Prueba: "Genera un reporte PDF del mes pasado"',
      '📊 O: "¿Qué reportes de ventas existen?"'
    );
  }

  if (q.includes('producto') || q.includes('inventario') || q.includes('stock')) {
    suggestions.push(
      '📦 Pregunta: "¿Qué productos tienen stock bajo?"',
      '📦 O: "Muestra el kardex de un producto"'
    );
  }

  if (q.includes('cliente')) {
    suggestions.push(
      '👥 Prueba: "¿Quiénes son mis mejores clientes?"',
      '👥 O: "¿Cómo registro un nuevo cliente?"'
    );
  }

  if (q.includes('usuario') || q.includes('permiso') || q.includes('rol')) {
    suggestions.push(
      '🔐 Pregunta: "¿Qué permisos tiene el rol Vendedor?"',
      '🔐 O: "¿Cómo creo un nuevo usuario?"'
    );
  }

  return suggestions;
}

/**
 * Detectar intención de la consulta
 */
export function detectIntent(query) {
  const q = query.toLowerCase();

  const intents = {
    // Consultas
    QUERY_DATA: /cuánto|cuánta|cuál|qué|muestra|dame|lista|ver/i,
    // Ayuda
    HELP: /cómo|ayuda|help|tutorial|guía|instrucciones/i,
    // Reportes
    REPORT: /reporte|informe|pdf|generar|exportar|análisis/i,
    // Navegación
    NAVIGATION: /dónde|ubicación|ruta|ir a|encontrar|buscar/i,
    // Problemas
    ISSUE: /error|problema|no puedo|no funciona|falla/i,
  };

  for (const [intent, pattern] of Object.entries(intents)) {
    if (pattern.test(q)) {
      return intent;
    }
  }

  return 'GENERAL';
}

/**
 * Formatear respuesta según la intención
 */
export function formatResponse(content, intent) {
  switch (intent) {
    case 'HELP':
      return `📚 **Ayuda**\n\n${content}\n\n💡 ¿Necesitas algo más específico?`;
    
    case 'REPORT':
      return `📊 **Reportes**\n\n${content}\n\n💡 Tip: Puedes generar PDFs con \`/api/chat/generate-report\``;
    
    case 'NAVIGATION':
      return `🧭 **Navegación**\n\n${content}`;
    
    case 'ISSUE':
      return `⚠️ **Solución de Problemas**\n\n${content}\n\n🔧 Si persiste, contacta al administrador.`;
    
    default:
      return content;
  }
}

/**
 * Validar y normalizar periodo
 */
export function normalizePeriod(period, type) {
  if (!period) return null;

  // Mensual: YYYY-MM
  if (type === 'mensual') {
    const match = period.match(/^(\d{4})-(\d{1,2})$/);
    if (!match) return null;
    
    const [, year, month] = match;
    const paddedMonth = month.padStart(2, '0');
    
    // Validar mes
    if (parseInt(paddedMonth) < 1 || parseInt(paddedMonth) > 12) return null;
    
    return `${year}-${paddedMonth}`;
  }

  // Anual: YYYY
  if (type === 'anual') {
    const match = period.match(/^(\d{4})$/);
    if (!match) return null;
    return period;
  }

  return null;
}

/**
 * Generar resumen de conversación
 */
export function generateConversationSummary(messages) {
  const userMessages = messages.filter(m => m.role === 'user');
  const topics = new Set();

  userMessages.forEach(msg => {
    const q = msg.content.toLowerCase();
    if (q.includes('venta')) topics.add('Ventas');
    if (q.includes('producto') || q.includes('inventario')) topics.add('Productos');
    if (q.includes('cliente')) topics.add('Clientes');
    if (q.includes('reporte')) topics.add('Reportes');
    if (q.includes('usuario') || q.includes('permiso')) topics.add('Usuarios');
  });

  return {
    totalMessages: userMessages.length,
    topics: Array.from(topics),
    timestamp: new Date().toISOString()
  };
}

/**
 * Calcular métricas de uso del chatbot
 */
export class ChatMetrics {
  constructor() {
    this.metrics = {
      totalQueries: 0,
      cacheHits: 0,
      errors: 0,
      avgResponseTime: 0,
      responseTimes: []
    };
  }

  recordQuery(responseTime, cached = false, error = false) {
    this.metrics.totalQueries++;
    if (cached) this.metrics.cacheHits++;
    if (error) this.metrics.errors++;
    
    this.metrics.responseTimes.push(responseTime);
    
    // Mantener solo últimas 100 mediciones
    if (this.metrics.responseTimes.length > 100) {
      this.metrics.responseTimes.shift();
    }
    
    // Calcular promedio
    this.metrics.avgResponseTime = 
      this.metrics.responseTimes.reduce((a, b) => a + b, 0) / 
      this.metrics.responseTimes.length;
  }

  getStats() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.totalQueries > 0 
        ? ((this.metrics.cacheHits / this.metrics.totalQueries) * 100).toFixed(1) + '%'
        : '0%',
      errorRate: this.metrics.totalQueries > 0
        ? ((this.metrics.errors / this.metrics.totalQueries) * 100).toFixed(1) + '%'
        : '0%',
      avgResponseTimeMs: Math.round(this.metrics.avgResponseTime)
    };
  }

  reset() {
    this.metrics = {
      totalQueries: 0,
      cacheHits: 0,
      errors: 0,
      avgResponseTime: 0,
      responseTimes: []
    };
  }
}

// Instancia global de métricas
export const chatMetrics = new ChatMetrics();

/**
 * Formatear números para el PDF
 */
export function formatCurrency(amount, locale = 'es-PE', currency = 'PEN') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
}

export function formatNumber(num, locale = 'es-PE') {
  return new Intl.NumberFormat(locale).format(num || 0);
}

/**
 * Obtener nombre del mes en español
 */
export function getMonthName(monthNumber) {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[monthNumber - 1] || 'Desconocido';
}

/**
 * Validar rango de fechas
 */
export function validateDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Fechas inválidas' };
  }

  if (start > end) {
    return { valid: false, error: 'La fecha de inicio debe ser anterior a la fecha de fin' };
  }

  if (start > now) {
    return { valid: false, error: 'La fecha de inicio no puede ser futura' };
  }

  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (daysDiff > 365) {
    return { valid: false, error: 'El rango no puede ser mayor a 1 año', warning: true };
  }

  return { valid: true, daysDiff };
}
