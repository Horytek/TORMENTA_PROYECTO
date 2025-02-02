import { getConnection } from "./../database/database";

const getRoles = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(`SELECT id_rol, nom_rol, estado_rol FROM rol`);
        res.json({ code: 1, data: result });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }   finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
};

export const methods = {
    getRoles
};