import { getConnection } from "./../database/database.js";

const getPlanes = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        // Get plans
        const [planes] = await connection.query(`SELECT id_plan, descripcion_plan, estado_plan FROM plan_pago`);

        // Get features for all plans
        const [features] = await connection.query(`
            SELECT pf.id_plan, pf.id_funcion, pf.valor, f.funcion, f.codigo, f.tipo_valor 
            FROM plan_funciones pf
            JOIN funciones f ON pf.id_funcion = f.id_funciones
        `);

        // Map features to plans
        const data = planes.map(plan => {
            const planFeatures = features.filter(f => f.id_plan === plan.id_plan);
            return {
                ...plan,
                funciones_detalles: planFeatures
            };
        });

        res.json({ code: 1, data: data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const methods = {
    getPlanes
};