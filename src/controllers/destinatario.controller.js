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

// INSERTAR DESTINATARIO - OPTIMIZADO
const insertDestinatario = async (req, res) => {
    const {
        ruc, dni, nombres, apellidos, razon_social, ubicacion, direccion, telefono, email
    } = req.body;
    const id_tenant = req.id_tenant;

    if (!ubicacion) {
        return res.status(400).json({ 
            code: 0,
            message: "La ubicación es requerida" 
        });
    }

    let connection;
    try {
        connection = await getConnection();

        await connection.beginTransaction();

        const [result] = await connection.query(
            "INSERT INTO destinatario (ruc, dni, nombres, apellidos, razon_social, ubicacion, direccion, email, telefono, id_tenant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                ruc || null, 
                dni || null, 
                nombres ? nombres.trim() : null, 
                apellidos ? apellidos.trim() : null, 
                razon_social ? razon_social.trim() : null, 
                ubicacion, 
                direccion || null, 
                email || null, 
                telefono || null, 
                id_tenant
            ]
        );

        await connection.commit();

        // Limpiar caché
        queryCache.clear();

        res.json({ 
            code: 1, 
            message: 'Destinatario insertado correctamente', 
            id: result.insertId 
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en insertDestinatario:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ 
                code: 0, 
                message: "El destinatario ya existe" 
            });
        } else {
            res.status(500).json({ 
                code: 0, 
                message: "Error interno del servidor" 
            });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// INSERTAR DESTINATARIO NATURAL - OPTIMIZADO
const addDestinatarioNatural = async (req, res) => {
    let connection;
    const {
        dni,
        nombres,
        apellidos,
        ubicacion,
        direccion = "",
        email = "",
        telefono = ""
    } = req.body;
    const id_tenant = req.id_tenant;

    if (!dni || !nombres || !apellidos || !ubicacion) {
        return res.status(400).json({ 
            code: 0, 
            message: "Campos requeridos: dni, nombres, apellidos, ubicacion" 
        });
    }

    try {
        connection = await getConnection();

        await connection.beginTransaction();

        const [result] = await connection.query(
            `INSERT INTO destinatario (dni, nombres, apellidos, ubicacion, direccion, email, telefono, id_tenant) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                dni, 
                nombres.trim(), 
                apellidos.trim(), 
                ubicacion, 
                direccion || null, 
                email || null, 
                telefono || null, 
                id_tenant
            ]
        );

        await connection.commit();

        // Limpiar caché
        queryCache.clear();

        res.json({ 
            code: 1, 
            message: "Destinatario natural añadido exitosamente",
            id: result.insertId 
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en addDestinatarioNatural:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ 
                code: 0, 
                message: "Ya existe un destinatario con ese DNI" 
            });
        } else {
            res.status(500).json({ 
                code: 0, 
                message: "Error interno del servidor" 
            });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// INSERTAR DESTINATARIO JURÍDICO - OPTIMIZADO
const addDestinatarioJuridico = async (req, res) => {
    let connection;
    const {
        ruc,
        razon_social,
        ubicacion,
        direccion = "",
        email = "",
        telefono = ""
    } = req.body;
    const id_tenant = req.id_tenant;

    if (!ruc || !razon_social || !ubicacion) {
        return res.status(400).json({ 
            code: 0, 
            message: "Campos requeridos: ruc, razon_social, ubicacion" 
        });
    }

    try {
        connection = await getConnection();

        await connection.beginTransaction();

        const [result] = await connection.query(
            `INSERT INTO destinatario (ruc, razon_social, ubicacion, direccion, email, telefono, id_tenant) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                ruc, 
                razon_social.trim(), 
                ubicacion, 
                direccion || null, 
                email || null, 
                telefono || null, 
                id_tenant
            ]
        );

        await connection.commit();

        // Limpiar caché
        queryCache.clear();

        res.json({ 
            code: 1, 
            message: "Destinatario jurídico añadido exitosamente",
            id: result.insertId 
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en addDestinatarioJuridico:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ 
                code: 0, 
                message: "Ya existe un destinatario con ese RUC" 
            });
        } else {
            res.status(500).json({ 
                code: 0, 
                message: "Error interno del servidor" 
            });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ACTUALIZAR DESTINATARIO NATURAL - OPTIMIZADO
const updateDestinatarioNatural = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const {
            dni = "",
            nombres = "",
            apellidos = "",
            telefono = "",
            direccion = "",
            ubicacion = "",
            email = ""
        } = req.body;
        const id_tenant = req.id_tenant;

        if (!dni || !nombres || !apellidos || !ubicacion) {
            return res.status(400).json({ 
                code: 0, 
                message: "Campos requeridos: dni, nombres, apellidos, ubicacion" 
            });
        }

        connection = await getConnection();

        // Verificar que el destinatario existe
        const [existe] = await connection.query(
            'SELECT id_destinatario FROM destinatario WHERE id_destinatario = ? AND id_tenant = ? LIMIT 1',
            [id, id_tenant]
        );

        if (existe.length === 0) {
            return res.status(404).json({ 
                code: 0,
                message: "Destinatario no encontrado" 
            });
        }

        await connection.beginTransaction();

        const [result] = await connection.query(
            `UPDATE destinatario
             SET dni = ?, nombres = ?, apellidos = ?, telefono = ?, direccion = ?, ubicacion = ?, email = ?
             WHERE id_destinatario = ? AND id_tenant = ?`,
            [
                dni, 
                nombres.trim(), 
                apellidos.trim(), 
                telefono || null, 
                direccion || null, 
                ubicacion, 
                email || null, 
                id, 
                id_tenant
            ]
        );

        await connection.commit();

        if (result.affectedRows === 0) {
            return res.status(400).json({ 
                code: 0,
                message: "No se realizó ninguna actualización" 
            });
        }

        // Limpiar caché
        queryCache.clear();

        res.json({ 
            code: 1,
            message: "Destinatario natural actualizado con éxito" 
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en updateDestinatarioNatural:', error);
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

// ACTUALIZAR DESTINATARIO JURÍDICO - OPTIMIZADO
const updateDestinatarioJuridico = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const {
            ruc = "",
            razon_social = "",
            telefono = "",
            direccion = "",
            ubicacion = "",
            email = ""
        } = req.body;
        const id_tenant = req.id_tenant;

        if (!ruc || !razon_social || !ubicacion) {
            return res.status(400).json({ 
                code: 0, 
                message: "Campos requeridos: ruc, razon_social, ubicacion" 
            });
        }

        connection = await getConnection();

        // Verificar que el destinatario existe
        const [existe] = await connection.query(
            'SELECT id_destinatario FROM destinatario WHERE id_destinatario = ? AND id_tenant = ? LIMIT 1',
            [id, id_tenant]
        );

        if (existe.length === 0) {
            return res.status(404).json({ 
                code: 0,
                message: "Destinatario no encontrado" 
            });
        }

        await connection.beginTransaction();

        const [result] = await connection.query(
            `UPDATE destinatario
             SET ruc = ?, razon_social = ?, ubicacion = ?, direccion = ?, email = ?, telefono = ?
             WHERE id_destinatario = ? AND id_tenant = ?`,
            [
                ruc, 
                razon_social.trim(), 
                ubicacion, 
                direccion || null, 
                email || null, 
                telefono || null, 
                id, 
                id_tenant
            ]
        );

        await connection.commit();

        if (result.affectedRows === 0) {
            return res.status(400).json({ 
                code: 0,
                message: "No se realizó ninguna actualización" 
            });
        }

        // Limpiar caché
        queryCache.clear();

        res.json({ 
            code: 1,
            message: "Destinatario jurídico actualizado con éxito" 
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en updateDestinatarioJuridico:', error);
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

// OBTENER DESTINATARIOS - OPTIMIZADO CON CACHÉ
const getDestinatarios = async (req, res) => {
    const id_tenant = req.id_tenant;
    const cacheKey = `destinatarios_${id_tenant}`;
    
    // Verificar caché
    if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({ 
                code: 1, 
                data: cached.data, 
                message: "Destinatarios listados (caché)" 
            });
        }
        queryCache.delete(cacheKey);
    }
    
    let connection;
    try {
        connection = await getConnection();
        
        const [result] = await connection.query(`
            SELECT 
                id_destinatario AS id,
                COALESCE(NULLIF(dni, ''), ruc) AS documento, 
                COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) AS destinatario,
                ubicacion,
                direccion,
                email,
                telefono 
            FROM destinatario
            WHERE id_tenant = ?
                AND (
                    (nombres IS NOT NULL AND nombres <> '' AND apellidos IS NOT NULL AND apellidos <> '')
                    OR
                    (razon_social IS NOT NULL AND razon_social <> '')
                )
            ORDER BY 
                (CASE 
                    WHEN COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) = 'Clientes Varios' THEN 0 
                    ELSE 1 
                END),
                destinatario
        `, [id_tenant]);
        
        // Guardar en caché
        queryCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        
        res.json({ 
            code: 1, 
            data: result, 
            message: "Destinatarios listados" 
        });
    } catch (error) {
        console.error('Error en getDestinatarios:', error);
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

// OBTENER UN DESTINATARIO - OPTIMIZADO
const getDestinatario = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const id_tenant = req.id_tenant;

        if (!id) {
            return res.status(400).json({ 
                code: 0,
                message: "Debe proporcionar un ID o documento" 
            });
        }

        connection = await getConnection();
        
        const [result] = await connection.query(
            `SELECT 
                id_destinatario AS id,
                COALESCE(NULLIF(dni, ''), ruc) AS documento, 
                COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) AS destinatario,
                ubicacion,
                direccion,
                email,
                telefono 
            FROM destinatario
            WHERE COALESCE(NULLIF(dni, ''), ruc) = ? AND id_tenant = ?
            ORDER BY 
                (CASE 
                    WHEN COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) = 'Clientes Varios' THEN 0 
                    ELSE 1 
                END),
                destinatario
            LIMIT 1`,
            [id, id_tenant]
        );

        if (result.length === 0) {
            return res.status(404).json({ 
                code: 0,
                data: [], 
                message: "Destinatario no encontrado" 
            });
        }

        res.json({ 
            code: 1, 
            data: result[0], 
            message: "Destinatario encontrado" 
        });
    } catch (error) {
        console.error('Error en getDestinatario:', error);
        if (!res.headersSent) {
            res.status(500).json({ 
                code: 0, 
                message: "Error interno del servidor" 
            });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ELIMINAR DESTINATARIO - OPTIMIZADO CON VERIFICACIONES
const deleteDestinatario = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const id_tenant = req.id_tenant;

        if (!id) {
            return res.status(400).json({ 
                code: 0,
                message: "El ID del destinatario es obligatorio" 
            });
        }

        connection = await getConnection();

        // Verificar que el destinatario existe
        const [existe] = await connection.query(
            'SELECT id_destinatario FROM destinatario WHERE id_destinatario = ? AND id_tenant = ? LIMIT 1',
            [id, id_tenant]
        );

        if (existe.length === 0) {
            return res.status(404).json({ 
                code: 0, 
                message: "Destinatario no encontrado" 
            });
        }

        // Verificar si tiene guías de remisión asociadas
        const [guias] = await connection.query(
            'SELECT COUNT(*) as total FROM guia_remision WHERE id_destinatario = ?',
            [id]
        );

        if (guias[0].total > 0) {
            return res.status(400).json({ 
                code: 0, 
                message: `No se puede eliminar el destinatario porque tiene ${guias[0].total} guía(s) de remisión asociada(s)` 
            });
        }

        await connection.beginTransaction();

        const [result] = await connection.query(
            "DELETE FROM destinatario WHERE id_destinatario = ? AND id_tenant = ?", 
            [id, id_tenant]
        );

        await connection.commit();

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                code: 0, 
                message: "No se pudo eliminar el destinatario" 
            });
        }

        // Limpiar caché
        queryCache.clear();

        res.json({ 
            code: 1, 
            message: "Destinatario eliminado correctamente" 
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en deleteDestinatario:', error);
        
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({ 
                code: 0, 
                message: "No se puede eliminar el destinatario porque tiene datos relacionados" 
            });
        } else if (!res.headersSent) {
            res.status(500).json({ 
                code: 0, 
                message: "Error interno del servidor" 
            });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const methods = {
    insertDestinatario,
    addDestinatarioNatural,
    addDestinatarioJuridico,
    deleteDestinatario,
    getDestinatarios,
    getDestinatario,
    updateDestinatarioNatural,
    updateDestinatarioJuridico
};
