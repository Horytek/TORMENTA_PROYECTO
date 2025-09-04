import { getConnection } from "../database/database.js";

const getSucursalInicio = async (req, res) => {
    let connection;
    const { nombre = '' } = req.query; 

    try {
        connection = await getConnection();
        if (!connection) throw new Error("Error en la conexión con la base de datos.");

        const query = `
            SELECT 
                s.id_sucursal AS id,
                s.nombre_sucursal AS nombre
            FROM sucursal s
            WHERE s.nombre_sucursal LIKE ? AND s.id_tenant = ?
        `;

        const params = [`%${nombre}%`, req.id_tenant];

        const [result] = await connection.query(query, params);

        res.json({ code: 1, data: result, message: "Sucursales listadas" });

    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release(); 
    }
};

const getSucursales = async (req, res) => {
    let connection;
    const { nombre = '', estado = '%' } = req.query;

    try {
        connection = await getConnection();
        if (!connection) throw new Error("Error en la conexión con la base de datos.");

        let query = `
            SELECT 
                s.id_sucursal AS id,
                s.dni,
                s.nombre_sucursal,
                s.ubicacion,
                s.estado_sucursal,
                CONCAT(v.nombres, ' ', v.apellidos) AS nombre_vendedor
            FROM sucursal s
            LEFT JOIN vendedor v ON s.dni = v.dni
            WHERE s.nombre_sucursal LIKE ? AND s.id_tenant = ?
        `;

        const params = [`%${nombre}%`, req.id_tenant];
        if (estado !== '%') {
            query += ` AND s.estado_sucursal LIKE ?`;
            params.push(estado);
        }

        const [result] = await connection.query(query, params);

        res.json({ code: 1, data: result, message: "Sucursales listadas" });

    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release(); 
    }
};

const insertSucursal = async (req, res) => {
    const { dni, nombre_sucursal, ubicacion, estado_sucursal } = req.body;

    if (!dni || !nombre_sucursal || !ubicacion || estado_sucursal === undefined) {
        return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }

    let connection;
    try {
        connection = await getConnection();

        await connection.beginTransaction();

        const [result] = await connection.query(
            `INSERT INTO sucursal (dni, nombre_sucursal, ubicacion, estado_sucursal, id_tenant)
         VALUES (?, ?, ?, ?, ?)`,
            [dni, nombre_sucursal, ubicacion, estado_sucursal, req.id_tenant]
        );

        await connection.commit();

        res.json({ code: 1, message: 'Sucursal insertada correctamente', id: result.insertId });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const updateSucursal = async (req, res) => {
    const { id, dni, nombre_sucursal, ubicacion, estado_sucursal } = req.body;

    if (!id) {
        return res.status(400).json({ message: "El ID de la sucursal es obligatorio." });
    }

    let connection;
    try {
        connection = await getConnection();

        await connection.beginTransaction();

        const query = `
        UPDATE sucursal
        SET 
          dni = ?,
          nombre_sucursal = ?,
          ubicacion = ?,
          estado_sucursal = ?
        WHERE 
          id_sucursal = ? AND id_tenant = ?;
      `;

        await connection.query(query, [
            dni,
            nombre_sucursal,
            ubicacion,
            estado_sucursal,
            id,
            req.id_tenant
        ]);

        await connection.commit();

        res.json({ code: 1, message: 'Sucursal actualizada correctamente' });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getVendedores = async (req, res) => {
    let connection;

    try {
        connection = await getConnection();

        const query = `
            SELECT 
                dni,
                CONCAT(nombres, ' ', apellidos) AS nombre_completo
            FROM 
                vendedor
            WHERE 
                estado_vendedor = 1 AND id_tenant = ?;
        `;

        const [vendedores] = await connection.query(query, [req.id_tenant]);

        res.json({ code: 1, data: vendedores, message: "Vendedores listados correctamente" });

    } catch (error) {
        res.status(500).json({ code: 0, message: "Error al obtener la lista de vendedores" });
    } finally {
        if (connection) connection.release();
    }
};


const deleteSucursal = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "El ID de la sucursal es obligatorio." });
    }

    let connection;
    try {
        connection = await getConnection();

        await connection.beginTransaction();

        const query = `DELETE FROM sucursal WHERE id_sucursal = ? AND id_tenant = ?`;
        const [result] = await connection.query(query, [id, req.id_tenant]);

        await connection.commit();

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Sucursal no encontrada." });
        }

        res.json({ code: 1, message: "Sucursal eliminada correctamente" });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release();
    }
};


export const methods = {
    getSucursalInicio,
    getSucursales,
    getVendedores,
    insertSucursal,
    updateSucursal,
    deleteSucursal,
};