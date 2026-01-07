import { getConnection } from "../database/database.js";

const getActions = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query("SELECT * FROM permission_action_catalog ORDER BY name");
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error getting actions:", error);
        res.status(500).json({ success: false, message: "Error al obtener acciones" });
    } finally {
        if (connection) connection.release();
    }
};

const createAction = async (req, res) => {
    let connection;
    const { action_key, name, description } = req.body;

    if (!action_key || !name) {
        return res.status(400).json({ success: false, message: "Key y Nombre son requeridos" });
    }

    try {
        connection = await getConnection();

        // Check uniqueness
        const [existing] = await connection.query("SELECT id_action FROM permission_action_catalog WHERE action_key = ?", [action_key]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: "La clave de acción ya existe" });
        }

        await connection.query(
            "INSERT INTO permission_action_catalog (action_key, name, description, is_active) VALUES (?, ?, ?, 1)",
            [action_key, name, description || ""]
        );
        res.json({ success: true, message: "Acción creada correctamente" });
    } catch (error) {
        console.error("Error creating action:", error);
        res.status(500).json({ success: false, message: "Error al crear acción" });
    } finally {
        if (connection) connection.release();
    }
};

const updateAction = async (req, res) => {
    let connection;
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    try {
        connection = await getConnection();
        await connection.query(
            "UPDATE permission_action_catalog SET name = ?, description = ?, is_active = ? WHERE id_action = ?",
            [name, description, is_active, id]
        );
        res.json({ success: true, message: "Acción actualizada" });
    } catch (error) {
        console.error("Error updating action:", error);
        res.status(500).json({ success: false, message: "Error al actualizar acción" });
    } finally {
        if (connection) connection.release();
    }
};

const deleteAction = async (req, res) => {
    let connection;
    const { id } = req.params;

    try {
        connection = await getConnection();
        await connection.query("DELETE FROM permission_action_catalog WHERE id_action = ?", [id]);
        res.json({ success: true, message: "Acción eliminada" });
    } catch (error) {
        console.error("Error deleting action:", error);
        res.status(500).json({ success: false, message: "Error al eliminar acción" });
    } finally {
        if (connection) connection.release();
    }
};

const updateModuleConfig = async (req, res) => {
    let connection;
    const { id, type } = req.params; // type: 'modulo' or 'submodulo'
    const { active_actions } = req.body; // Array of action_keys

    try {
        connection = await getConnection();
        const table = type === 'modulo' ? 'modulo' : 'submodulos';
        const pk = type === 'modulo' ? 'id_modulo' : 'id_submodulo';

        await connection.query(
            `UPDATE ${table} SET active_actions = ? WHERE ${pk} = ?`,
            [JSON.stringify(active_actions), id]
        );

        res.json({ success: true, message: "Configuración actualizada" });
    } catch (error) {
        console.error("Error updating module config:", error);
        res.status(500).json({ success: false, message: "Error al actualizar configuración" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = {
    getActions,
    createAction,
    updateAction,
    deleteAction,
    updateModuleConfig
};
