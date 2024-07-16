import { getConnection } from "./../database/database";

const getVentas = async (req, res) => {
    try {
        const connection = await getConnection();
        const [result] = await connection.query(`
                SELECT * from ventas
            `);
        res.json({data: result, message: "Ventas listadas"});
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};



export const methods = {
    getVentas
};