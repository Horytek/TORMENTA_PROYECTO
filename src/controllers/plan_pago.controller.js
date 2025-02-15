import { getConnection } from "./../database/database";

const getPlanes = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(`SELECT id_plan, descripcion_plan,estado_plan, funciones FROM plan_pago`);
        res.json({ code: 1, data: result });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    } finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
};

export const methods = {
    getPlanes
};