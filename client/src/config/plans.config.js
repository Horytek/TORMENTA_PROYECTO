// Configuración de planes y precios
// Este archivo centraliza los precios de forma segura
// Los precios NO deben venir de la URL para evitar manipulación

export const PLANS_CONFIG = {
  'Basic': {
    title: 'Basic',
    monthly: 79,
    yearly: 790,
    currency: 'S/',
    features: [
      'Punto de venta (POS) Rápido',
      'Gestión de variantes',
      'Control de Inventario (Kárdex)',
      '5 Usuario / 5 Almacén'
    ]
  },
  'Pro': {
    title: 'Pro',
    monthly: 149,
    yearly: 1490,
    currency: 'S/',
    features: [
      'Todo en Basic',
      'Facturación Electrónica (SUNAT)',
      'Multi-Almacén (Hasta 15 sedes)',
      'Hasta 10 Usuarios y Roles'
    ]
  },
  'Enterprise': {
    title: 'Enterprise',
    monthly: 299,
    yearly: 2990,
    currency: 'S/',
    features: [
      'Sedes y Usuarios Ilimitados',
      'Soporte Preferencial',
      'Modulos ilimitados',
      'Reportes de Rendimiento',
      'Todo lo incluido en Pro'
    ]
  },
  // Pocket Plans
  'Diario': {
    daily: 1,
    currency: 'S/',
    features: [
      'Acceso total por 24 horas',
      'Ventas ilimitadas',
      'Sin contratos'
    ]
  },
  'Semanal': {
    weekly: 7,
    currency: 'S/',
    features: [
      'Acceso por 7 días',
      'Gestión de inventario',
      'Soporte básico'
    ]
  },
  'Express': {
    monthly: 30,
    yearly: 300, // Optional
    currency: 'S/',
    features: [
      'Todo incluido por 30 días',
      'Sin contratos forzosos',
      'Actualizaciones gratuitas'
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

  const price = period === 'año' ? plan.yearly
    : period === 'dia' ? plan.daily
      : period === 'semana' ? plan.weekly
        : plan.monthly;

  return {
    price,
    formattedPrice: `${plan.currency} ${price.toLocaleString('es-PE')}`,
    currency: plan.currency,
    features: plan.features || []
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
  return ['mes', 'año', 'dia', 'semana'].includes(period);
}

/**
 * Obtiene el plan y período por defecto
 * @returns {object} { plan: string, period: string }
 */
export function getDefaultPlanInfo() {
  return {
    plan: 'Basic',
    period: 'mes'
  };
}
