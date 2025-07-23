import { getConnection } from "./../database/database";

const getRoles = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(
            `SELECT id_rol, nom_rol, estado_rol FROM rol WHERE id_rol!=10 AND id_tenant = ?`,
            [req.id_tenant]
        );
        res.json({ code: 1, data: result });
    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getPaginaDefecto = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [result] = await connection.query(
            `SELECT id_modulo, id_submodulo FROM rol WHERE id_rol = ? AND id_tenant = ?`,
            [id, req.id_tenant]
        );

        if (result.length === 0) {
            return res.status(404).json({ code: 0, message: "Rol no encontrado" });
        }

        res.json({ code: 1, data: result[0] });
    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const guardarPaginaPorDefecto = async (req, res) => {
    let connection;
    try {
        const { id_modulo, id_submodulo } = req.body;
        const id_rol = req.params.id;

        if (!id_rol || !id_modulo) {
            return res.status(400).json({ code: 0, message: "Se requiere 'id_rol' y 'id_modulo'" });
        }

        connection = await getConnection();

        const [result] = await connection.query(
            `UPDATE rol SET id_modulo = ?, id_submodulo = ? WHERE id_rol = ? AND id_tenant = ?`,
            [id_modulo, id_submodulo || null, id_rol, req.id_tenant]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "No se encontró el rol o no se actualizó" });
        }

        res.json({ code: 1, message: "Página por defecto guardada correctamente" });

    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getRol = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [result] = await connection.query(
            `SELECT id_rol, nom_rol, estado_rol FROM rol WHERE id_rol = ? AND id_tenant = ?`,
            [id, req.id_tenant]
        );

        if (result.length === 0) {
            return res.status(404).json({ data: result, message: "Rol no encontrado" });
        }

        res.json({ code: 1, data: result, message: "Rol encontrado" });
    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const addRol = async (req, res) => {
    let connection;
    try {
        const { nom_rol, estado_rol } = req.body;

        if (nom_rol === undefined) {
            res.status(400).json({ message: "Bad Request. Please fill all field." });
        }

        const usuario = { nom_rol: nom_rol.trim(), estado_rol, id_tenant: req.id_tenant };
        connection = await getConnection();
        await connection.query("INSERT INTO rol SET ? ", usuario);

        res.json({ code: 1, message: "Rol añadido" });
    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const updateRol = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { nom_rol, estado_rol } = req.body;

        if (nom_rol === undefined || estado_rol === undefined) {
            res.status(400).json({ message: "Bad Request. Please fill all field." });
        }

        const usuario = { nom_rol: nom_rol.trim(), estado_rol };
        connection = await getConnection();
        const [result] = await connection.query(
            "UPDATE rol SET ? WHERE id_rol = ? AND id_tenant = ?",
            [usuario, id, req.id_tenant]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Rol no encontrado" });
        }

        res.json({ code: 1, message: "Rol modificado" });
    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const deleteRol = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();

        // Verificar si el usuario está en uso dentro de la base de datos
        const [verify] = await connection.query(
            "SELECT 1 FROM usuario WHERE id_rol = ? AND id_tenant = ?",
            [id, req.id_tenant]
        );
        const isUserInUse = verify.length > 0;

        if (isUserInUse) {
            const [Updateresult] = await connection.query(
                "UPDATE rol SET estado_rol = 0 WHERE id_rol = ? AND id_tenant = ?",
                [id, req.id_tenant]
            );

            if (Updateresult.affectedRows === 0) {
                return res.status(404).json({ code: 0, message: "Rol no encontrado" });
            }

            res.json({ code: 2, message: "Rol dado de baja" });
        } else {
            const [result] = await connection.query(
                "DELETE FROM rol WHERE id_rol = ? AND id_tenant = ?",
                [id, req.id_tenant]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ code: 0, message: "Rol no encontrado" });
            }

            res.json({ code: 1, message: "Rol eliminado" });
        }

    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const methods = {
    getRoles,
    getRol,
    addRol,
    updateRol,
    deleteRol,
    guardarPaginaPorDefecto,
    getPaginaDefecto
};