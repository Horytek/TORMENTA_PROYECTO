import { getConnection } from "./../database/database";

const addModulo = async (req, res) => {
    try {
        const { nombre, ruta } = req.body;
        const nombre_modulo = nombre;
        
        if (!nombre_modulo || !ruta) {
            return res.status(400).json({
                code: 0,
                message: "Faltan datos: nombre del modulo y la ruta son requeridos"
            });
        }
        
        const connection = await getConnection();
        const query = "INSERT INTO modulo (nombre_modulo, ruta) VALUES (?, ?)";
        const params = [nombre_modulo, ruta];
        
        const [result] = await connection.query(query, params);
        
        // Se añade code y message para manejo en el cliente
        res.json({ 
            success: true,
            code: 1,
            message: "Módulo agregado correctamente",
            data: {
                id_modulo: result.insertId,
                nombre_modulo,
                ruta
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            code: 0,
            message: "Error interno en el servidor"
        });
    }
};

const getModulos = async (req, res) => {
    try {
        const connection = await getConnection();
        
        const [modulos] = await connection.query("SELECT * FROM modulo ORDER BY id_modulo");
        
        const [submodulos] = await connection.query(`
            SELECT 
                s.id_submodulo,
                s.id_modulo,
                s.nombre_sub,
                s.ruta as ruta_submodulo,
                m.nombre_modulo,
                m.ruta as ruta_modulo
            FROM submodulos s
            JOIN modulo m ON s.id_modulo = m.id_modulo
            ORDER BY m.id_modulo, s.id_submodulo
        `);
        
        res.json({
            success: true,
            data: {
                modulos: modulos,
                submodulos: submodulos
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error interno en el servidor" });
    }
};

const addSubmodulo = async (req, res) => {
    try {
        const { id_modulo, nombre_sub, ruta } = req.body;
        
        if (!id_modulo || !nombre_sub || !ruta) {
            return res.status(400).json({
                code: 0,
                message: "Faltan datos: id_modulo, nombre_sub y ruta son requeridos"
            });
        }
        
        const connection = await getConnection();
        
        const [modulos] = await connection.query("SELECT * FROM modulo WHERE id_modulo = ?", [id_modulo]);
        if (modulos.length === 0) {
            return res.status(404).json({
                success: false,
                code: 0,
                message: "El módulo seleccionado no existe"
            });
        }
        
        const query = "INSERT INTO submodulos (id_modulo, nombre_sub, ruta) VALUES (?, ?, ?)";
        const params = [id_modulo, nombre_sub, ruta];
        
        const [result] = await connection.query(query, params);
        
        res.json({
            success: true,
            code: 1,
            message: "Submódulo agregado correctamente",
            data: {
                id_submodulo: result.insertId,
                id_modulo,
                nombre_sub,
                ruta,
                nombre_modulo: modulos[0].nombre_modulo
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            code: 0,
            message: "Error interno del servidor"
        });
    }
};

const updateModulo = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { nombre_modulo, ruta } = req.body;
        
        if (!nombre_modulo || !ruta) {
            return res.status(400).json({
                code: 0,
                message: "Faltan datos: nombre del módulo y la ruta son requeridos"
            });
        }
        
        connection = await getConnection();

        // Check if the module exists
        const [rows] = await connection.query(
            "SELECT * FROM modulo WHERE id_modulo = ?", 
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                code: 0, 
                message: "Módulo no encontrado" 
            });
        }
        
        // Update the module
        const [result] = await connection.query(
            "UPDATE modulo SET nombre_modulo = ?, ruta = ? WHERE id_modulo = ?", 
            [nombre_modulo, ruta, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                code: 0, 
                message: "No se pudo actualizar el módulo" 
            });
        }

        // Return success response with updated data
        res.json({ 
            code: 1, 
            message: "Módulo actualizado correctamente",
            data: {
                id_modulo: id,
                nombre_modulo, 
                ruta
            }
        });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({
                code: 0,
                message: "Error interno en el servidor"
            });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const deleteModulo = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();

        const [rows] = await connection.query("SELECT * FROM modulo WHERE id_modulo = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ code: 0, message: "Modulo no encontrado" });
        }
        const recordToDelete = rows[0];

        const [result] = await connection.query("DELETE FROM modulo WHERE id_modulo = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Modulo no encontrado" });
        }

        res.json({ code: 1, message: "Modulo eliminado", data: recordToDelete });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const methods = {
    addModulo,
    getModulos,
    addSubmodulo,
    updateModulo,
    deleteModulo
};

