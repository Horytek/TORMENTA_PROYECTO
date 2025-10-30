// Configuración de planes y precios para el backend
// IMPORTANTE: Este archivo debe mantenerse sincronizado con client/src/config/plans.config.js

const PLANS_CONFIG = {
  'Básico': {
    id: 3, // ID del plan en la base de datos
    monthly: 85,
    yearly: 850,
    currency: 'PEN',
    currencySymbol: 'S/'
  },
  'Pro': {
    id: 2,
    monthly: 135,
    yearly: 1350,
    currency: 'PEN',
    currencySymbol: 'S/'
  },
  'Enterprise': {
    id: 1,
    monthly: 240,
    yearly: 2400,
    currency: 'PEN',
    currencySymbol: 'S/'
  }
};

/**
 * Obtiene el precio de un plan de forma segura
 * @param {string} planName - Nombre del plan
 * @param {string} period - 'mes' o 'año'
 * @returns {object} { id, price, currency, isValid }
 */
function getPlanPrice(planName, period) {
  const plan = PLANS_CONFIG[planName];
  
  if (!plan) {
    return {
      id: null,
      price: null,
      currency: null,
      isValid: false,
      error: 'Plan no encontrado'
    };
  }

  const price = period === 'año' ? plan.yearly : plan.monthly;
  
  return {
    id: plan.id,
    price,
    currency: plan.currency,
    currencySymbol: plan.currencySymbol,
    isValid: true
  };
}

/**
 * Valida si un plan y precio son válidos
 * @param {string} planName 
 * @param {number} price 
 * @param {string} period 
 * @returns {boolean}
 */
function validatePlanPrice(planName, price, period) {
  const planInfo = getPlanPrice(planName, period);
  return planInfo.isValid && planInfo.price === price;
}

/**
 * Obtiene el ID del plan para la base de datos
 * @param {string} planName 
 * @returns {number|null}
 */
function getPlanId(planName) {
  const plan = PLANS_CONFIG[planName];
  return plan ? plan.id : null;
}

/**
 * Valida si un plan existe
 * @param {string} planName 
 * @returns {boolean}
 */
function isValidPlan(planName) {
  return planName in PLANS_CONFIG;
}

/**
 * Valida si un período es válido
 * @param {string} period 
 * @returns {boolean}
 */
function isValidPeriod(period) {
  return period === 'mes' || period === 'año';
}

/**
 * Valida el plan y período completo
 * @param {string} planName 
 * @param {string} period 
 * @returns {object} { isValid: boolean, error?: string }
 */
function validatePlanAndPeriod(planName, period) {
  if (!isValidPlan(planName)) {
    return {
      isValid: false,
      error: `Plan inválido: "${planName}". Planes válidos: ${Object.keys(PLANS_CONFIG).join(', ')}`
    };
  }
  
  if (!isValidPeriod(period)) {
    return {
      isValid: false,
      error: `Período inválido: "${period}". Períodos válidos: "mes", "año"`
    };
  }
  
  return { isValid: true };
}

module.exports = {
  PLANS_CONFIG,
  getPlanPrice,
  validatePlanPrice,
  getPlanId,
  isValidPlan,
  isValidPeriod,
  validatePlanAndPeriod
};
