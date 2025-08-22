import { getConnection } from "./../database/database";
import { LOG_ACTIONS, MODULOS } from "../utils/logActions.js";

const getClientes = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const docType = req.query.docType || "";
    const docNumber = req.query.docNumber || "";
    const searchTerm = req.query.searchTerm || "";

    let filterCondition = "WHERE id_tenant = ?";
    const filterValues = [req.id_tenant];

    if (docType === "dni") {
      if (docNumber) {
        filterCondition += " AND dni LIKE ?";
        filterValues.push(`%${docNumber}%`);
      } else {
        filterCondition += " AND dni IS NOT NULL AND dni <> ''";
      }
    }
    else if (docType === "ruc") {
      if (docNumber) {
        filterCondition += " AND ruc LIKE ?";
        filterValues.push(`%${docNumber}%`);
      } else {
        filterCondition += " AND ruc IS NOT NULL AND ruc <> ''";
      }
    }
    else if (searchTerm) {
      filterCondition += ` AND (
        nombres LIKE ? OR 
        apellidos LIKE ? OR 
        razon_social LIKE ?
      )`;
      filterValues.push(
        `%${searchTerm}%`, 
        `%${searchTerm}%`, 
        `%${searchTerm}%`
      );
    }

    const [countResult] = await connection.query(
      `SELECT COUNT(*) as total FROM cliente ${filterCondition}`,
      filterValues
    );
    const totalRecords = countResult[0].total;
    const totalPages = Math.ceil(totalRecords / limit);

    // Obtenemos los registros según el filtro
    const [result] = await connection.query(`
      SELECT 
        id_cliente, 
        CONCAT_WS(' ', dni, NULLIF(ruc, '')) AS dniRuc, 
        nombres, 
        apellidos, 
        COALESCE(razon_social, '') AS razon_social, 
        direccion, 
        estado_cliente AS estado,
        f_creacion
      FROM cliente 
      ${filterCondition}
      LIMIT ? OFFSET ?
    `, [...filterValues, limit, offset]);

    res.json({
      code: 1,
      data: result,
      metadata: { page, limit, totalPages, totalRecords },
      message: "Clientes listados"
    });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ code: 0, message: "Error interno del servidor" });
    }
  } finally {
    if (connection) connection.release();
  }
};

const addCliente = async (req, res) => {
    let connection;
    try {
        const {
            clientType,
            documentNumber,
            clientName,
            clientLastName,
            businessName,
            address
        } = req.body;

        connection = await getConnection();

        const duplicateQuery = `
            SELECT id_cliente FROM cliente
            WHERE (dni = ? OR ruc = ?) AND id_tenant = ?
        `;
        const [existing] = await connection.query(duplicateQuery, [documentNumber, documentNumber, req.id_tenant]);
        if (existing.length > 0) {
            return res.status(400).json({
                code: 0,
                message: "Ya existe un cliente con el mismo documento"
            });
        }

        const query = `
            INSERT INTO cliente (
                dni,
                ruc,
                nombres,
                apellidos,
                razon_social,
                direccion,
                estado_cliente,
                id_tenant
            ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
        `;

        const values = [
            clientType === "personal" ? documentNumber : null,
            clientType === "business" ? documentNumber : null,
            clientName || null,
            clientLastName || null,
            businessName || null,
            address || null,
            req.id_tenant
        ];

        const [result] = await connection.query(query, values);

        console.log('🔍 Cliente creado exitosamente, preparando log...');
        console.log('🔍 req.log disponible:', typeof req.log);
        console.log('🔍 req.id_usuario:', req.id_usuario);
        console.log('🔍 req.id_tenant:', req.id_tenant);

        // Registrar log de creación de cliente usando el nuevo sistema
        if (req.log && req.id_usuario) {
            console.log('📝 Llamando a req.log para CLIENTE_CREAR...');
            try {
                await req.log(LOG_ACTIONS.CLIENTE_CREAR, MODULOS.CLIENTES, {
                    recurso: `cliente_id:${result.insertId}`,
                    descripcion: `Cliente creado: ${clientName || businessName || 'Sin nombre'} (Doc: ${documentNumber})`
                });
                console.log('✅ Log de cliente creado exitosamente');
            } catch (error) {
                console.error('❌ Error al registrar log de cliente:', error);
            }
        } else {
            console.log('❌ No se puede registrar log:', {
                req_log_available: !!req.log,
                id_usuario: req.id_usuario,
                id_tenant: req.id_tenant
            });
        }

        res.json({
            code: 1,
            data: { id: result.insertId },
            message: "Cliente creado exitosamente"
        });

    } catch (error) {
        res.status(500).json({
            code: 0,
            message: "Error al crear el cliente"
        });
    } finally {
        if (connection) connection.release();
    }
};

const getCliente = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const { id } = req.params; 
        if (!id) {
            return res.status(400).json({
                code: 0,
                message: "El ID del cliente es obligatorio"
            });
        }

        const [result] = await connection.query(
            `SELECT 
                id_cliente, 
                dni, 
                ruc, 
                nombres, 
                apellidos, 
                razon_social, 
                direccion, 
                f_creacion,
                estado_cliente AS estado
             FROM cliente
             WHERE id_cliente = ? AND id_tenant = ?`,
            [id, req.id_tenant]
        );

        if (result.length === 0) {
            return res.status(404).json({
                code: 0,
                message: "Cliente no encontrado"
            });
        }

        res.json({
            code: 1,
            data: result[0],
            message: "Cliente obtenido exitosamente"
        });

    } catch (error) {
        res.status(500).json({
            code: 0,
            message: "Error al obtener el cliente"
        });
        
    } finally {
        if (connection) connection.release();
    }
};

const updateCliente = async (req, res) => {
    let connection;
    try {
        const {
            id_cliente,
            dni,
            ruc,
            nombres,
            apellidos,
            razon_social,
            direccion,
            estado
        } = req.body;

        if (!id_cliente) {
            return res.status(400).json({
                code: 0,
                message: "El ID del cliente es obligatorio"
            });
        }

        connection = await getConnection();

        // Verificar si el cliente existe y obtener datos actuales
        const [existingClient] = await connection.query(
            `SELECT id_cliente, dni, ruc, nombres, apellidos, razon_social, direccion, estado_cliente 
             FROM cliente WHERE id_cliente = ? AND id_tenant = ?`,
            [id_cliente, req.id_tenant]
        );

        if (existingClient.length === 0) {
            return res.status(404).json({
                code: 0,
                message: "Cliente no encontrado"
            });
        }

        const clienteAnterior = existingClient[0];

        const query = `
            UPDATE cliente SET
                dni = ?,
                ruc = ?,
                nombres = ?,
                apellidos = ?,
                razon_social = ?,
                direccion = ?,
                estado_cliente = ?
            WHERE id_cliente = ? AND id_tenant = ?
        `;
        
        const values = [
            dni || null,
            ruc || null,
            nombres || null,
            apellidos || null,
            razon_social || null,
            direccion || null,
            estado,
            id_cliente,
            req.id_tenant
        ];

        const [result] = await connection.query(query, values);

        // Registrar log de edición de cliente si hay cambios
        if (req.log && req.id_usuario && result.affectedRows > 0) {
            // Identificar los campos que cambiaron
            const cambios = [];
            
            if (clienteAnterior.dni !== (dni || null)) cambios.push(`DNI: ${clienteAnterior.dni} → ${dni || 'null'}`);
            if (clienteAnterior.ruc !== (ruc || null)) cambios.push(`RUC: ${clienteAnterior.ruc} → ${ruc || 'null'}`);
            if (clienteAnterior.nombres !== (nombres || null)) cambios.push(`Nombres: ${clienteAnterior.nombres} → ${nombres || 'null'}`);
            if (clienteAnterior.apellidos !== (apellidos || null)) cambios.push(`Apellidos: ${clienteAnterior.apellidos} → ${apellidos || 'null'}`);
            if (clienteAnterior.razon_social !== (razon_social || null)) cambios.push(`Razón Social: ${clienteAnterior.razon_social} → ${razon_social || 'null'}`);
            if (clienteAnterior.direccion !== (direccion || null)) cambios.push(`Dirección: ${clienteAnterior.direccion} → ${direccion || 'null'}`);
            if (clienteAnterior.estado_cliente !== estado) cambios.push(`Estado: ${clienteAnterior.estado_cliente} → ${estado}`);
            
            if (cambios.length > 0) {
                await req.log(LOG_ACTIONS.CLIENTE_EDITAR, MODULOS.CLIENTES, {
                    recurso: `cliente_id:${id_cliente}`,
                    descripcion: `Cliente editado. Cambios: ${cambios.join(', ')}`
                });
            }
        }

        // Obtener el cliente actualizado
        const [updatedClient] = await connection.query(
            `SELECT 
                id_cliente, 
                dni, 
                ruc, 
                nombres, 
                apellidos, 
                razon_social, 
                direccion, 
                estado_cliente AS estado
             FROM cliente
             WHERE id_cliente = ? AND id_tenant = ?`,
            [id_cliente, req.id_tenant]
        );

        res.json({
            code: 1,
            data: updatedClient[0],
            message: "Cliente actualizado exitosamente"
        });

    } catch (error) {
        res.status(500).json({
            code: 0,
            message: "Error al actualizar el cliente"
        });
    } finally {
        if (connection) connection.release();
    }
};

const deleteCliente = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [result] = await connection.query("DELETE FROM cliente WHERE id_cliente = ? AND id_tenant = ?", [id, req.id_tenant]);
                
        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Cliente no encontrado" });
        }

        res.json({ code: 1, message: "Cliente eliminado" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    }     finally {
        if (connection) {
            connection.release();  
        }
    }
};

const deactivateCliente = async (req, res) => {
    let connection;
    const { id } = req.params;
    connection = await getConnection();
    try {
        const [result] = await connection.query("UPDATE cliente SET estado_cliente = 0 WHERE id_cliente = ? AND id_tenant = ?", [id, req.id_tenant]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }

        res.json({ message: "Cliente dado de baja con éxito" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    }    finally {
        if (connection) {
            connection.release();  
        }
    }
};

export const methods = {
    getClientes,
    getCliente,
    addCliente,
    updateCliente,
    deleteCliente,
    deactivateCliente
};