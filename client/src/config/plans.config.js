// Configuración de planes y precios
// Este archivo centraliza los precios de forma segura
// Los precios NO deben venir de la URL para evitar manipulación

export const PLANS_CONFIG = {
  'Básico': {
    monthly: 85,
    yearly: 850,
    currency: 'S/',
    features: [
      'Acceso al módulo de Ventas',
      'Reportes básicos (Análisis de ventas, Libro de ventas)',
      'Gestión de clientes'
    ]
  },
  'Pro': {
    monthly: 135,
    yearly: 1350,
    currency: 'S/',
    features: [
      'Acceso a todos los módulos',
      'Usuarios ilimitados',
      'Múltiples sucursales',
      'Uso de Chatbot'
    ]
  },
  'Enterprise': {
    monthly: 240,
    yearly: 2400,
    currency: 'S/',
    features: [
      'Usuarios ilimitados',
      'Múltiples sucursales',
      'Uso de Chatbot y Atajo de funciones',
      'Uso del log, mensajería y videollamadas internas',
      'Sucursales ilimitadas'
    ]
  }
};

/**
 * Obtiene el precio de un plan de forma segura
 * @param {string} planName - Nombre del plan
 * @param {string} period - 'mes' o 'año'
 * @returns {object} { price: number, formattedPrice: string, currency: string }
 */
export function getPlanPrice(planName, period) {
  const plan = PLANS_CONFIG[planName];
  
  if (!plan) {
    // Plan por defecto si no se encuentra
    return {
      price: 0,
      formattedPrice: 'S/ 0',
      currency: 'S/'
    };
  }

  const price = period === 'año' ? plan.yearly : plan.monthly;
  
  return {
    price,
    formattedPrice: `${plan.currency} ${price.toLocaleString('es-PE')}`,
    currency: plan.currency
  };
}

/**
 * Valida si un plan existe
 * @param {string} planName 
 * @returns {boolean}
 */
export function isValidPlan(planName) {
  return planName in PLANS_CONFIG;
}

/**
 * Obtiene todos los planes disponibles
 * @returns {string[]}
 */
export function getAvailablePlans() {
  return Object.keys(PLANS_CONFIG);
}

/**
 * Valida si un período es válido
 * @param {string} period 
 * @returns {boolean}
 */
export function isValidPeriod(period) {
  return period === 'mes' || period === 'año';
}

/**
 * Obtiene el plan y período por defecto
 * @returns {object} { plan: string, period: string }
 */
export function getDefaultPlanInfo() {
  return {
    plan: 'Básico',
    period: 'mes'
  };
}
