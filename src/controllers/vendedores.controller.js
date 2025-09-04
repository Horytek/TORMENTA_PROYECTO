import { getConnection } from "../database/database.js";

const getVendedores = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(`
            SELECT ve.dni, usu.usua, CONCAT(ve.nombres,' ',ve.apellidos) as nombre, ve.nombres, ve.apellidos, ve.telefono, ve.estado_vendedor, ve.id_usuario
            FROM vendedor ve 
            INNER JOIN usuario usu ON usu.id_usuario = ve.id_usuario
            WHERE ve.id_tenant = ?
        `, [req.id_tenant]);
        res.json({ code: 1, data: result, message: "Vendedores listados" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    } finally {
        if (connection) connection.release();
    }
};

const getVendedor = async (req, res) => {
    let connection;
    try {
        const { dni } = req.params;
        connection = await getConnection();
        const [result] = await connection.query(`
            SELECT ve.dni, usu.usua, CONCAT(ve.nombres,' ', ve.apellidos) as nombre, ve.nombres, ve.apellidos, ve.telefono, ve.estado_vendedor, ve.id_usuario
            FROM vendedor ve 
            INNER JOIN usuario usu ON usu.id_usuario = ve.id_usuario
            WHERE ve.dni = ? AND ve.id_tenant = ?
        `, [dni, req.id_tenant]);

        if (result.length === 0) {
            return res.status(404).json({ data: result, message: "Vendedor no encontrado" });
        }

        res.json({ code: 1, data: result, message: "Vendedor encontrado" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    } finally {
        if (connection) connection.release();
    }
};

const addVendedor = async (req, res) => {
    let connection;
    try {
        const { dni, id_usuario, nombres, apellidos, telefono, estado_vendedor } = req.body;

        if (!dni || !id_usuario || !nombres) {
            return res.status(400).json({ message: "Bad Request. Please fill all required fields correctly." });
        }

        const vendedor = { dni, id_usuario, nombres: nombres.trim(), apellidos: apellidos?.trim() || '', telefono: telefono?.trim() || '', estado_vendedor, id_tenant: req.id_tenant };
        connection = await getConnection();
        await connection.query("INSERT INTO vendedor SET ?", vendedor);

        res.status(201).json({ code: 1, message: "Vendedor añadido con éxito" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    } finally {
        if (connection) connection.release();
    }
};

const updateVendedor = async (req, res) => { 
    let connection;
    try {
      const { dni } = req.params; // DNI original
      const { nuevo_dni, id_usuario, nombres, apellidos, telefono, estado_vendedor } = req.body;
  
      connection = await getConnection();
  
      // Verificar si el vendedor con el dni actual existe
      const [rows] = await connection.query("SELECT * FROM vendedor WHERE dni = ? AND id_tenant = ?", [dni, req.id_tenant]);
      if (rows.length === 0) {
        return res.status(404).json({ message: "Vendedor no encontrado" });
      }
  
      // Si el DNI cambia, verificar que no esté en uso
      if (nuevo_dni && nuevo_dni !== dni) {
        const [exists] = await connection.query("SELECT * FROM vendedor WHERE dni = ? AND id_tenant = ?", [nuevo_dni, req.id_tenant]);
        if (exists.length > 0) {
          return res.status(400).json({ message: "El nuevo DNI ya está en uso" });
        }
      }
  
      // Actualizar los datos del vendedor
      const [result] = await connection.query(`
        UPDATE vendedor
        SET dni = ?, id_usuario = ?, nombres = ?, apellidos = ?, telefono = ?, estado_vendedor = ?
        WHERE dni = ? AND id_tenant = ?
      `, [nuevo_dni || dni, id_usuario, nombres, apellidos || '', telefono, estado_vendedor, dni, req.id_tenant]);
  
      if (result.affectedRows === 0) {
        return res.status(400).json({ message: "No se realizó ninguna actualización" });
      }
  
      res.json({ code: 1, message: "Vendedor actualizado con éxito" });
    } catch (error) {
      res.status(500).json({ code: 0, message: "Error interno del servidor", error: error.message });
    } finally {
      if (connection) connection.release();
    }
};  

const deactivateVendedor = async (req, res) => {
    let connection;
    try {
        const { dni } = req.params;

        if (!dni || dni.trim() === "" || isNaN(dni)) {
            return res.status(400).json({ message: "DNI inválido o vacío" });
        }

        connection = await getConnection();
        if (!connection) {
            return res.status(500).json({ message: "Error interno del servidor: conexión fallida" });
        }

        // Verificar si el vendedor está en una sucursal
        const [relatedCheck] = await connection.query(
            "SELECT COUNT(*) AS count FROM sucursal WHERE dni = ? AND id_tenant = ?",
            [dni, req.id_tenant]
        );

        if (relatedCheck.length === 0 || relatedCheck[0].count === undefined) {
            return res.status(500).json({ message: "Error al verificar relación con sucursal" });
        }

        if (relatedCheck[0].count > 0) {
            const [updateResult] = await connection.query(
                "UPDATE vendedor SET estado_vendedor = 0 WHERE dni = ? AND id_tenant = ?",
                [dni, req.id_tenant]
            );

            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ message: "Vendedor no encontrado o ya dado de baja" });
            }

            return res.json({ code: 1, message: "Vendedor dado de baja con éxito (solo estado cambiado)" });
        } else {
            const [deleteResult] = await connection.query(
                "DELETE FROM vendedor WHERE dni = ? AND id_tenant = ?",
                [dni, req.id_tenant]
            );

            if (deleteResult.affectedRows === 0) {
                return res.status(404).json({ message: "Vendedor no encontrado o ya eliminado" });
            }

            return res.json({ message: "Vendedor eliminado con éxito" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const deleteVendedor = async (req, res) => {
    let connection;
    try {
        const { dni } = req.params;
        connection = await getConnection();
        const [result] = await connection.query("DELETE FROM vendedor WHERE dni = ? AND id_tenant = ?", [dni, req.id_tenant]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Vendedor no encontrado" });
        }

        res.json({ code: 1, message: "Vendedor eliminado" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    } finally {
        if (connection) connection.release();
    }
};

export const methods = {
    getVendedores,
    getVendedor,
    addVendedor,
    updateVendedor,
    deactivateVendedor,
    deleteVendedor
};