/**
 * Middleware de Rate Limiting para prevenir ataques de fuerza bruta
 * Limita el número de intentos de login por IP
 */

// Store de intentos de login por IP
const loginAttempts = new Map();

// Configuración (ajustable según NODE_ENV)
const isDevelopment = process.env.NODE_ENV !== 'production';

const MAX_ATTEMPTS = isDevelopment ? 10 : 5; // Más intentos en desarrollo
const BLOCK_TIME = isDevelopment ? 5 * 60 * 1000 : 15 * 60 * 1000; // 5 min dev, 15 min prod
const ATTEMPT_WINDOW = 5 * 60 * 1000; // Ventana de 5 minutos para contar intentos

// Limpieza periódica de intentos expirados
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of loginAttempts.entries()) {
        if (now - data.firstAttempt > ATTEMPT_WINDOW && !data.blockedUntil) {
            loginAttempts.delete(ip);
        }
        if (data.blockedUntil && now > data.blockedUntil) {
            loginAttempts.delete(ip);
        }
    }
}, 60 * 1000); // Limpiar cada minuto

/**
 * Middleware de rate limiting para login
 */
export const loginRateLimiter = (req, res, next) => {
    const ip = req.ip || 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress || 
               req.headers['x-forwarded-for']?.split(',')[0] ||
               'unknown';
    
    const now = Date.now();
    const attemptData = loginAttempts.get(ip);
    
    // Verificar si la IP está bloqueada
    if (attemptData?.blockedUntil && now < attemptData.blockedUntil) {
        const remainingTime = Math.ceil((attemptData.blockedUntil - now) / 1000 / 60);
        return res.status(429).json({
            success: false,
            message: `Demasiados intentos fallidos. Intente nuevamente en ${remainingTime} minuto(s)`,
            blocked: true,
            remainingTime
        });
    }
    
    // Si no hay datos o la ventana expiró, resetear
    if (!attemptData || now - attemptData.firstAttempt > ATTEMPT_WINDOW) {
        loginAttempts.set(ip, {
            attempts: 1,
            firstAttempt: now,
            blockedUntil: null
        });
        return next();
    }
    
    // Verificar si excedió el máximo de intentos
    if (attemptData.attempts >= MAX_ATTEMPTS) {
        // Bloquear la IP
        attemptData.blockedUntil = now + BLOCK_TIME;
        loginAttempts.set(ip, attemptData);
        
        console.warn(`[SECURITY] IP bloqueada por múltiples intentos fallidos: ${ip}`);
        
        return res.status(429).json({
            success: false,
            message: `Demasiados intentos fallidos. Cuenta bloqueada por ${Math.ceil(BLOCK_TIME / 1000 / 60)} minutos`,
            blocked: true
        });
    }
    
    next();
};

/**
 * Registrar un intento fallido de login
 */
export const recordFailedAttempt = (req) => {
    const ip = req.ip || 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress || 
               req.headers['x-forwarded-for']?.split(',')[0] ||
               'unknown';
    
    const now = Date.now();
    const attemptData = loginAttempts.get(ip);
    
    if (!attemptData || now - attemptData.firstAttempt > ATTEMPT_WINDOW) {
        loginAttempts.set(ip, {
            attempts: 1,
            firstAttempt: now,
            blockedUntil: null
        });
    } else {
        attemptData.attempts++;
        loginAttempts.set(ip, attemptData);
        
        console.warn(`[SECURITY] Intento fallido de login desde IP: ${ip}, intentos: ${attemptData.attempts}/${MAX_ATTEMPTS}`);
    }
};

/**
 * Limpiar intentos después de un login exitoso
 */
export const clearAttempts = (req) => {
    const ip = req.ip || 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress || 
               req.headers['x-forwarded-for']?.split(',')[0] ||
               'unknown';
    
    loginAttempts.delete(ip);
};

/**
 * Obtener estadísticas de intentos (para monitoreo)
 */
export const getAttemptStats = () => {
    return {
        totalIPs: loginAttempts.size,
        blockedIPs: Array.from(loginAttempts.values()).filter(d => d.blockedUntil && Date.now() < d.blockedUntil).length
    };
};

/**
 * Limpiar TODOS los intentos (solo para desarrollo/emergencia)
 * ⚠️ NO usar en producción sin autenticación
 */
export const clearAllAttempts = () => {
    const size = loginAttempts.size;
    loginAttempts.clear();
    console.log(`[RATE_LIMITER] Limpiados ${size} registros de intentos`);
    return size;
};

