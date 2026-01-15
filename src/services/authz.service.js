import { getConnection } from "../database/database.js";

const queryCache = new Map();
const CACHE_TTL = 60000; // 1 minute

// Helper to decode buffers
const decodeBuffer = (field) => {
    return field && typeof field === "object" && field.toString
        ? field.toString('utf-8')
        : field;
};

export const AuthZService = {
    /**
     * Retrieves the Application Catalog (Modules, Submodules, Active Actions).
     * @param {Object} context - { tenantId, isDeveloper }
     */
    async getCatalog({ tenantId, isDeveloper = false }) {
        const cacheKey = `catalog_${isDeveloper ? 'dev' : tenantId}`;

        // Check Cache
        if (queryCache.has(cacheKey)) {
            const cached = queryCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                return cached.data;
            }
            queryCache.delete(cacheKey);
        }

        let connection;
        try {
            connection = await getConnection();

            // Unified Query
            let query = "";
            let queryParams = [];

            if (isDeveloper) {
                query = `
                    SELECT 
                        m.id_modulo AS modulo_id,
                        m.nombre_modulo AS modulo_nombre,
                        m.ruta AS modulo_ruta,
                        m.active_actions AS modulo_active_actions,
                        s.id_submodulo,
                        s.id_modulo,
                        s.nombre_sub,
                        s.ruta AS submodulo_ruta,
                        s.active_actions AS submodulo_active_actions
                    FROM modulo m
                    LEFT JOIN submodulos s ON m.id_modulo = s.id_modulo
                    ORDER BY m.nombre_modulo, s.nombre_sub
                `;
            } else {
                query = `
                    SELECT 
                        m.id_modulo AS modulo_id,
                        m.nombre_modulo AS modulo_nombre,
                        m.ruta AS modulo_ruta,
                        m.active_actions AS modulo_active_actions,
                        s.id_submodulo,
                        s.id_modulo,
                        s.nombre_sub,
                        s.ruta AS submodulo_ruta,
                        s.active_actions AS submodulo_active_actions
                    FROM modulo m
                    LEFT JOIN submodulos s ON m.id_modulo = s.id_modulo
                    -- Add strict tenant filtering here if/when schema supports it fully
                    ORDER BY m.nombre_modulo, s.nombre_sub
                `;
            }

            const [rows] = await connection.query(query, queryParams);

            // Group results
            const modulosMap = new Map();
            for (const row of rows) {
                const moduloId = row.modulo_id;

                if (!modulosMap.has(moduloId)) {
                    modulosMap.set(moduloId, {
                        id: moduloId,
                        nombre: decodeBuffer(row.modulo_nombre),
                        ruta: decodeBuffer(row.modulo_ruta),
                        active_actions: row.modulo_active_actions,
                        submodulos: []
                    });
                }

                if (row.id_submodulo) {
                    modulosMap.get(moduloId).submodulos.push({
                        id_submodulo: row.id_submodulo,
                        id_modulo: row.id_modulo,
                        nombre_sub: decodeBuffer(row.nombre_sub),
                        ruta: decodeBuffer(row.submodulo_ruta),
                        active_actions: row.submodulo_active_actions
                    });
                }
            }

            const result = Array.from(modulosMap.values());

            // Cache Result
            queryCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;

        } catch (error) {
            console.error("AuthZService.getCatalog Error:", error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    },

    clearCache() {
        queryCache.clear();
    }
};
