import { getConnection } from "./../database/database.js";

const getPlanes = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(`SELECT id_plan, descripcion_plan,estado_plan, funciones FROM plan_pago`);
        res.json({ code: 1, data: result });
    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
};

export const methods = {
    getPlanes
};