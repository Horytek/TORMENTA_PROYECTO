import { getConnection } from "./../database/database.js";

// Cache para consultas frecuentes
const queryCache = new Map();

// Función para limpiar caché (llamada desde otros controladores)
export const clearSubmodulosCache = () => {
    queryCache.clear();
};

// ACTUALIZAR SUBMÓDULO - OPTIMIZADO
const updateSubModulo = async (req, res) => {
    const { id } = req.params;
    const { nombre_sub, ruta } = req.body;
    
    // Validaciones mejoradas
    if (!id) {
        return res.status(400).json({
            code: 0,
            message: "El ID del submódulo es requerido"
        });
    }
    
    if (!nombre_sub || nombre_sub.trim() === '') {
        return res.status(400).json({
            code: 0,
            message: "El nombre del submódulo es requerido"
        });
    }
    
    if (!ruta || ruta.trim() === '') {
        return res.status(400).json({
            code: 0,
            message: "La ruta del submódulo es requerida"
        });
    }
    
    let connection;
    try {
        connection = await getConnection();

        // Query optimizada: obtener submódulo y módulo padre en una sola consulta
        const [rows] = await connection.query(
            `SELECT 
                s.id_submodulo,
                s.id_modulo,
                s.nombre_sub,
                s.ruta,
                m.nombre_modulo
             FROM submodulos s
             INNER JOIN modulo m ON s.id_modulo = m.id_modulo
             WHERE s.id_submodulo = ?
             LIMIT 1`, 
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                code: 0, 
                message: "Submódulo no encontrado"
            });
        }
        
        const submoduloActual = rows[0];
        const id_modulo = submoduloActual.id_modulo;
        
        // Verificar duplicados (excluyendo el submódulo actual)
        const [duplicado] = await connection.query(
            `SELECT id_submodulo 
             FROM submodulos 
             WHERE (nombre_sub = ? OR ruta = ?) 
               AND id_modulo = ? 
               AND id_submodulo != ?
             LIMIT 1`,
            [nombre_sub.trim(), ruta.trim(), id_modulo, id]
        );
        
        if (duplicado.length > 0) {
            return res.status(400).json({
                code: 0,
                message: "Ya existe otro submódulo con ese nombre o ruta en este módulo"
            });
        }
        
        await connection.beginTransaction();
        
        const [result] = await connection.query(
            "UPDATE submodulos SET nombre_sub = ?, ruta = ? WHERE id_submodulo = ?", 
            [nombre_sub.trim(), ruta.trim(), id]
        );
        
        await connection.commit();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                code: 0, 
                message: "No se pudo actualizar el submódulo" 
            });
        }

        // Limpiar caché de módulos (afecta la estructura)
        queryCache.clear();

        res.json({ 
            code: 1, 
            message: "Submódulo actualizado correctamente",
            data: {
                id_submodulo: parseInt(id),
                id_modulo,
                nombre_sub: nombre_sub.trim(), 
                ruta: ruta.trim(),
                nombre_modulo: submoduloActual.nombre_modulo
            }
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en updateSubModulo:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({
                code: 0,
                message: "Ya existe otro submódulo con ese nombre o ruta"
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

// ELIMINAR SUBMÓDULO - OPTIMIZADO CON VERIFICACIONES
const deleteSubModulo = async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ 
            code: 0, 
            message: "El ID del submódulo es requerido" 
        });
    }
    
    let connection;
    try {
        connection = await getConnection();

        // Verificar que el submódulo existe y obtener su información
        const [submoduloExiste] = await connection.query(
            `SELECT s.id_submodulo, s.nombre_sub, m.nombre_modulo
             FROM submodulos s
             INNER JOIN modulo m ON s.id_modulo = m.id_modulo
             WHERE s.id_submodulo = ?
             LIMIT 1`, 
            [id]
        );
        
        if (submoduloExiste.length === 0) {
            return res.status(404).json({ 
                code: 0, 
                message: "Submódulo no encontrado" 
            });
        }
        
        const recordToDelete = submoduloExiste[0];

        // Verificar si tiene permisos asociados
        const [permisos] = await connection.query(
            'SELECT COUNT(*) as total FROM permisos WHERE id_submodulo = ?',
            [id]
        );
        
        if (permisos[0].total > 0) {
            return res.status(400).json({ 
                code: 0, 
                message: `No se puede eliminar el submódulo porque tiene ${permisos[0].total} permiso(s) asociado(s)` 
            });
        }

        await connection.beginTransaction();

        const [result] = await connection.query(
            "DELETE FROM submodulos WHERE id_submodulo = ?", 
            [id]
        );
        
        await connection.commit();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                code: 0, 
                message: "No se pudo eliminar el submódulo" 
            });
        }

        // Limpiar caché
        queryCache.clear();

        res.json({ 
            code: 1, 
            message: "Submódulo eliminado correctamente", 
            data: recordToDelete 
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en deleteSubModulo:', error);
        
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({ 
                code: 0, 
                message: "No se puede eliminar el submódulo porque tiene datos relacionados" 
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
    updateSubModulo,
    deleteSubModulo,
};
