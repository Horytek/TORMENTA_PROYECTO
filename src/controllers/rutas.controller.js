import { getConnection } from "../database/database.js";
import { AuthZService } from "../services/authz.service.js";

// Cache para consultas frecuentes
const queryCache = new Map();
const CACHE_TTL = 60000; // 1 minuto

// Limpieza periódica del caché
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of queryCache.entries()) {
        if (now - value.timestamp > CACHE_TTL * 2) {
            queryCache.delete(key);
        }
    }
}, CACHE_TTL * 2);

// OBTENER MÓDULOS - OPTIMIZADO CON CACHÉ
const getModulos = async (req, res) => {
    const cacheKey = 'modulos_rutas';

    // Verificar caché
    if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json(cached.data);
        }
        queryCache.delete(cacheKey);
    }

    let connection;
    try {
        connection = await getConnection();

        const [result] = await connection.query(
            "SELECT id_modulo AS id, nombre_modulo AS nombre, ruta FROM modulo ORDER BY nombre_modulo"
        );

        // Guardar en caché
        queryCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });

        res.json(result);
    } catch (error) {
        console.error('Error en getModulos:', error);
        res.status(500).json({
            code: 0,
            message: "Error interno del servidor"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// OBTENER SUBMÓDULOS - OPTIMIZADO CON CACHÉ
const getSubmodulos = async (req, res) => {
    const cacheKey = 'submodulos_rutas';

    // Verificar caché
    if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json(cached.data);
        }
        queryCache.delete(cacheKey);
    }

    let connection;
    try {
        connection = await getConnection();

        const [result] = await connection.query(
            "SELECT id_submodulo, id_modulo, nombre_sub, ruta FROM submodulos ORDER BY nombre_sub"
        );

        // Guardar en caché
        queryCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });

        res.json(result);
    } catch (error) {
        console.error('Error en getSubmodulos:', error);
        res.status(500).json({
            code: 0,
            message: "Error interno del servidor"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// OBTENER MÓDULOS CON SUBMÓDULOS - VIA AUTHZ SERVICE
const getModulosConSubmodulos = async (req, res) => {
    try {
        const nameUser = req.user?.nameUser || req.user?.username || 'desconocido';
        const isDeveloper = nameUser === 'desarrollador' || (req.user?.rol === 10);
        const id_tenant = req.id_tenant;

        // Delegate to AuthZ Service
        const catalog = await AuthZService.getCatalog({ tenantId: id_tenant, isDeveloper });

        res.json({
            success: true,
            data: catalog
        });
    } catch (error) {
        console.error('Error en getModulosConSubmodulos:', error);
        res.status(500).json({
            code: 0,
            message: "Error interno del servidor"
        });
    }
};

// Función para limpiar caché (exportada para uso de otros controladores)
export const clearRutasCache = () => {
    queryCache.clear();
    AuthZService.clearCache();
};

export const methods = {
    getModulos,
    getSubmodulos,
    getModulosConSubmodulos
};