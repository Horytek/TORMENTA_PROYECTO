import { getConnection } from "../database/database.js";

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

// Función auxiliar para decodificar buffers (si es necesario)
const decodeBuffer = (field) => {
    return field && typeof field === "object" && field.toString 
        ? field.toString('utf-8') 
        : field;
};

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

// OBTENER MÓDULOS CON SUBMÓDULOS - OPTIMIZADO
const getModulosConSubmodulos = async (req, res) => {
    const cacheKey = 'modulos_con_submodulos_rutas';
    
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
        
        // Query optimizada: una sola consulta con LEFT JOIN
        const [rows] = await connection.query(`
            SELECT 
                m.id_modulo AS modulo_id,
                m.nombre_modulo AS modulo_nombre,
                m.ruta AS modulo_ruta,
                s.id_submodulo,
                s.id_modulo,
                s.nombre_sub,
                s.ruta AS submodulo_ruta
            FROM modulo m
            LEFT JOIN submodulos s ON m.id_modulo = s.id_modulo
            ORDER BY m.nombre_modulo, s.nombre_sub
        `);
        
        // Agrupar resultados de forma eficiente usando Map
        const modulosMap = new Map();
        
        for (const row of rows) {
            const moduloId = row.modulo_id;
            
            // Crear entrada del módulo si no existe
            if (!modulosMap.has(moduloId)) {
                modulosMap.set(moduloId, {
                    id: moduloId,
                    nombre: decodeBuffer(row.modulo_nombre),
                    ruta: decodeBuffer(row.modulo_ruta),
                    submodulos: []
                });
            }
            
            // Agregar submódulo si existe
            if (row.id_submodulo) {
                modulosMap.get(moduloId).submodulos.push({
                    id_submodulo: row.id_submodulo,
                    id_modulo: row.id_modulo,
                    nombre_sub: decodeBuffer(row.nombre_sub),
                    ruta: decodeBuffer(row.submodulo_ruta)
                });
            }
        }
        
        const modulosConSubmodulos = Array.from(modulosMap.values());
        
        // Guardar en caché
        queryCache.set(cacheKey, {
            data: modulosConSubmodulos,
            timestamp: Date.now()
        });
        
        res.json(modulosConSubmodulos);
    } catch (error) {
        console.error('Error en getModulosConSubmodulos:', error);
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

// Función para limpiar caché (exportada para uso de otros controladores)
export const clearRutasCache = () => {
    queryCache.clear();
};

export const methods = {
    getModulos,
    getSubmodulos,
    getModulosConSubmodulos
};
