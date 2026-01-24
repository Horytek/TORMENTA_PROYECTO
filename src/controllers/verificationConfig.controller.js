import { getConnection } from "../database/database.js";

export const methods = {
    getVerificationRoles: async (req, res) => {
        let connection;
        try {
            const id_tenant = req.id_tenant;
            connection = await getConnection();

            const [rows] = await connection.query(
                "SELECT id_rol, stage FROM config_verificacion_roles WHERE id_tenant = ?",
                [id_tenant]
            );

            const data = {
                verify: rows.filter(r => r.stage === 'verify').map(r => r.id_rol),
                approve: rows.filter(r => r.stage === 'approve').map(r => r.id_rol)
            };

            res.json({ code: 1, data });
        } catch (error) {
            console.error(error);
            res.status(500).json({ code: 0, message: "Error fetching roles" });
        } finally {
            if (connection) connection.release();
        }
    },

    updateVerificationRoles: async (req, res) => {
        let connection;
        try {
            const id_tenant = req.id_tenant;
            const { verify, approve } = req.body; // Arrays of IDs

            connection = await getConnection();
            await connection.beginTransaction();

            // Clear existing
            await connection.query(
                "DELETE FROM config_verificacion_roles WHERE id_tenant = ?",
                [id_tenant]
            );

            const values = [];

            if (Array.isArray(verify)) {
                verify.forEach(id => values.push(`(${parseInt(id)}, ${id_tenant}, 'verify')`));
            }
            if (Array.isArray(approve)) {
                approve.forEach(id => values.push(`(${parseInt(id)}, ${id_tenant}, 'approve')`));
            }

            if (values.length > 0) {
                await connection.query(
                    `INSERT INTO config_verificacion_roles (id_rol, id_tenant, stage) VALUES ${values.join(", ")}`
                );
            }

            await connection.commit();
            res.json({ code: 1, message: "Roles updated" });

        } catch (error) {
            if (connection) await connection.rollback();
            console.error(error);
            res.status(500).json({ code: 0, message: "Error updating roles" });
        } finally {
            if (connection) connection.release();
        }
    }
};
