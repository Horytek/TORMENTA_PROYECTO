import { getConnection } from "./../database/database.js";

const getAlmacenes = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const query = `
          SELECT 
              a.id_almacen, 
              a.nom_almacen, 
              a.ubicacion,
              a.estado_almacen,
              s.id_sucursal,
              s.nombre_sucursal
          FROM 
              almacen a
          LEFT JOIN 
              sucursal_almacen sa 
          ON 
              a.id_almacen = sa.id_almacen
          LEFT JOIN
              sucursal s
          ON
              s.id_sucursal = sa.id_sucursal
          WHERE a.estado_almacen != 0 AND a.id_tenant = ?
          ORDER BY a.id_almacen;
      `;

        const [result] = await connection.query(query, [req.id_tenant]);
        res.json({ code: 1, data: result });

    } catch (error) {
        res.status(500).json({ message: "Error al obtener los almacenes con su sucursal"});
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getAlmacenes_A = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const query = `
          SELECT 
              a.id_almacen, 
              a.nom_almacen, 
              a.ubicacion,
              a.estado_almacen,
              s.id_sucursal,
              s.nombre_sucursal
          FROM 
              almacen a
          LEFT JOIN 
              sucursal_almacen sa 
          ON 
              a.id_almacen = sa.id_almacen
          LEFT JOIN
              sucursal s
          ON
              s.id_sucursal = sa.id_sucursal
          WHERE a.id_tenant = ?
          ORDER BY a.id_almacen;
      `;

        const [result] = await connection.query(query, [req.id_tenant]);
        res.json({ code: 1, data: result });

    } catch (error) {
        res.status(500).json({ message: "Error al obtener los almacenes con su sucursal"});
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getSucursales = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const query = `
SELECT
    s.id_sucursal,
    s.nombre_sucursal,
    CASE 
        WHEN sa.id_sucursal IS NULL THEN 1 
        ELSE 0  
    END AS disponible
FROM 
    sucursal s
LEFT JOIN 
    sucursal_almacen sa ON s.id_sucursal = sa.id_sucursal
WHERE 
    s.estado_sucursal != 0
    AND s.id_tenant = (
        SELECT id_tenant FROM almacen WHERE id_tenant = ?
        LIMIT 1
    )
    AND s.id_sucursal = (
        SELECT MIN(s2.id_sucursal)
        FROM sucursal s2
        WHERE s2.nombre_sucursal = s.nombre_sucursal
    )
ORDER BY 
    s.id_sucursal;
      `;

        const [result] = await connection.query(query, [req.id_tenant]);
        res.json({ code: 1, data: result });

    } catch (error) {
        res.status(500).json({ message: "Error al obtener los sucursales", error });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getAlmacen = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) {
            return res.status(400).json({ message: "ID de almacén inválido" });
        }

        connection = await getConnection();

        const query = `
          SELECT 
            a.id_almacen, 
            a.nom_almacen, 
            a.ubicacion,
            a.estado_almacen,
            s.id_sucursal,
            s.nombre_sucursal,
            s.estado_sucursal
          FROM 
            almacen a
          JOIN 
            sucursal_almacen sa 
          ON 
            a.id_almacen = sa.id_almacen
          JOIN
            sucursal s
          ON
            s.id_sucursal = sa.id_sucursal
          WHERE a.id_almacen = ? AND a.id_tenant = ?;
        `;

        const [result] = await connection.query(query, [id, req.id_tenant]);

        if (result.length === 0) {
            return res.status(404).json({ data: result, message: "Almacén no encontrado" });
        }

        res.json({ code: 1, data: result, message: "Almacén encontrado" });

    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ message: "Error interno del servidor" });
        }
    } finally {
        if (connection) connection.release();
    }
};

const addAlmacen = async (req, res) => {
    const { nom_almacen, ubicacion = null, id_sucursal = null, estado_almacen } = req.body;
    let connection;
    try {
        connection = await getConnection();
        await connection.beginTransaction();

        // Insertar en almacen
        const [almacenResult] = await connection.query(
            `INSERT INTO almacen (nom_almacen, ubicacion, estado_almacen, id_tenant) VALUES (?, ?, ?, ?);`,
            [nom_almacen, ubicacion || '', estado_almacen, req.id_tenant]
        );

        const id_almacen = almacenResult.insertId;

        if (id_sucursal && !isNaN(id_sucursal)) {
            await connection.query(
                `INSERT INTO sucursal_almacen (id_sucursal, id_almacen) VALUES (?, ?);`,
                [id_sucursal, id_almacen]
            );
        }

        await connection.commit();
        res.json({ code: 1, message: "Almacén y sucursal insertados correctamente", id_almacen });

    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release();
    }
};

const updateAlmacen = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { nom_almacen, ubicacion, estado_almacen, id_sucursal } = req.body;

        const almacen = {
            nom_almacen: nom_almacen.trim(),
            ubicacion: ubicacion ? ubicacion.trim() : "",
            estado_almacen: estado_almacen ?? 1
        };

        connection = await getConnection();
        await connection.beginTransaction();

        // Actualizar almacén
        const [resultAlmacen] = await connection.query(
            "UPDATE almacen SET ? WHERE id_almacen = ? AND id_tenant = ?;",
            [almacen, id, req.id_tenant]
        );

        // Actualizar la relación en sucursal_almacen
        const [resultSucursalAlmacen] = await connection.query(
            "UPDATE sucursal_almacen SET id_sucursal = ? WHERE id_almacen = ?;",
            [id_sucursal, id]
        );

        if (resultAlmacen.affectedRows === 0 && resultSucursalAlmacen.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ code: 0, message: "Almacén o sucursal no encontrado" });
        }

        await connection.commit();
        res.json({ code: 1, message: "Almacén y sucursal actualizados con éxito" });

    } catch (error) {
        if (connection) await connection.rollback();
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    } finally {
        if (connection) connection.release();
    }
};

const deleteAlmacen = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ code: 0, message: "ID de almacén inválido" });
        }

        connection = await getConnection();

        // Verificar si el almacén está en uso en nota o inventario
        const [notaUso] = await connection.query(
            "SELECT 1 FROM nota WHERE id_almacenO = ? OR id_almacenD = ? LIMIT 1",
            [id, id]
        );
        const [inventarioUso] = await connection.query(
            "SELECT 1 FROM inventario WHERE id_almacen = ? LIMIT 1",
            [id]
        );

        const estaEnUso = notaUso.length > 0 || inventarioUso.length > 0;

        if (estaEnUso) {
            // Dar de baja (actualizar estado)
            const [updateResult] = await connection.query(
                "UPDATE almacen SET estado_almacen = 0 WHERE id_almacen = ? AND id_tenant = ?;",
                [id, req.id_tenant]
            );

            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ code: 0, message: "No se pudo dar de baja el almacén" });
            }

            return res.json({ code: 2, message: "Almacén dado de baja correctamente" });
        } else {
            // Eliminar relación en sucursal_almacen antes de eliminar el almacén
            await connection.beginTransaction();

            await connection.query(
                "DELETE FROM sucursal_almacen WHERE id_almacen = ?;",
                [id]
            );

            const [deleteResult] = await connection.query(
                "DELETE FROM almacen WHERE id_almacen = ? AND id_tenant = ?;",
                [id, req.id_tenant]
            );

            if (deleteResult.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({ code: 0, message: "No se pudo eliminar el almacén" });
            }

            await connection.commit();
            return res.json({ code: 1, message: "Almacén eliminado correctamente" });
        }

    } catch (error) {
        if (connection) await connection.rollback();
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    } finally {
        if (connection) connection.release();
    }
};

export const methods = {
    getAlmacenes,
    getSucursales,
    getAlmacen,
    addAlmacen,
    updateAlmacen,
    deleteAlmacen,
    getAlmacenes_A,
};