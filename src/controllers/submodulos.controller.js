import { getConnection } from "./../database/database";



const updateSubModulo = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { nombre_sub, ruta } = req.body;
        
        if (!nombre_sub || !ruta) {
            return res.status(400).json({
                code: 0,
                message: "Faltan datos: nombre del submódulo y la ruta son requeridos"
            });
        }
        
        connection = await getConnection();

        // First get the existing submodule to verify it exists and to get id_modulo
        const [rows] = await connection.query(
            "SELECT * FROM submodulos WHERE id_submodulo = ?", 
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                code: 0, 
                message: "Submódulo no encontrado" // Fixed error message
            });
        }
        
        // Retrieve the parent module ID before updating
        const id_modulo = rows[0].id_modulo;
        
        const [result] = await connection.query(
            "UPDATE submodulos SET nombre_sub = ?, ruta = ? WHERE id_submodulo = ?", 
            [nombre_sub, ruta, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                code: 0, 
                message: "No se pudo actualizar el submódulo" 
            });
        }

        // Optional: Get the parent module name for the response
        const [moduleRows] = await connection.query(
            "SELECT nombre_modulo FROM modulo WHERE id_modulo = ?",
            [id_modulo]
        );
        
        const nombre_modulo = moduleRows.length > 0 ? moduleRows[0].nombre_modulo : null;

        res.json({ 
            code: 1, 
            message: "Submódulo actualizado correctamente",
            data: {
                id_submodulo: id,
                id_modulo,
                nombre_sub, 
                ruta,
                nombre_modulo
            }
        });
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

const deleteSubModulo = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();

        const [rows] = await connection.query("SELECT * FROM submodulos WHERE id_submodulo = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ code: 0, message: "Submodulo no encontrado" });
        }
        const recordToDelete = rows[0];

        const [result] = await connection.query("DELETE FROM submodulos WHERE id_submodulo = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Submodulo no encontrado" });
        }

        res.json({ code: 1, message: "Submodulo eliminado", data: recordToDelete });
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
    updateSubModulo,
    deleteSubModulo,
};

