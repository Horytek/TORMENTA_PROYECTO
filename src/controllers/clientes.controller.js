import { getConnection } from "./../database/database.js";
import { LOG_ACTIONS, MODULOS } from "../utils/logActions.js";

// Cache para consultas frecuentes
const queryCache = new Map();
const CACHE_TTL = 60000; // 1 minuto

// Limpieza periódica del caché
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of queryCache.entries()) {
        if (now - value.timestamp > CACHE_TTL * 2) {
            queryCache.delete(key);
        }
    }
}, CACHE_TTL * 2);

// OBTENER CLIENTES CON PAGINACIÓN - OPTIMIZADO
const getClientes = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Máximo 100
        const offset = (page - 1) * limit;

        const docType = req.query.docType || "";
        const docNumber = req.query.docNumber || "";
        const searchTerm = req.query.searchTerm || "";
        const id_tenant = req.id_tenant;

        // Construir condiciones de filtro de forma eficiente
        const whereClauses = ["id_tenant = ?"];
        const filterValues = [id_tenant];

        if (docType === "dni") {
            if (docNumber) {
                whereClauses.push("dni LIKE ?");
                filterValues.push(`${docNumber}%`); // Más eficiente que %term%
            } else {
                whereClauses.push("dni IS NOT NULL AND dni <> ''");
            }
        } else if (docType === "ruc") {
            if (docNumber) {
                whereClauses.push("ruc LIKE ?");
                filterValues.push(`${docNumber}%`);
            } else {
                whereClauses.push("ruc IS NOT NULL AND ruc <> ''");
            }
        } else if (searchTerm) {
            whereClauses.push(`(
                nombres LIKE ? OR 
                apellidos LIKE ? OR 
                razon_social LIKE ?
            )`);
            filterValues.push(
                `%${searchTerm}%`,
                `%${searchTerm}%`,
                `%${searchTerm}%`
            );
        }

        const filterCondition = `WHERE ${whereClauses.join(" AND ")}`;

        // Query de conteo optimizada
        const [countResult] = await connection.query(
            `SELECT COUNT(*) as total FROM cliente ${filterCondition}`,
            filterValues
        );
        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit);

        // Si no hay registros, retornar temprano
        if (totalRecords === 0) {
            return res.json({
                code: 1,
                data: [],
                metadata: { page, limit, totalPages, totalRecords },
                message: "No se encontraron clientes"
            });
        }

        // Query principal optimizada
        const [result] = await connection.query(
            `SELECT 
                id_cliente, 
                COALESCE(dni, ruc) AS dniRuc,
                COALESCE(dni, '') AS dni,
                COALESCE(ruc, '') AS ruc,
                nombres, 
                apellidos, 
                COALESCE(razon_social, '') AS razon_social, 
                direccion, 
                estado_cliente AS estado,
                DATE_FORMAT(f_creacion, '%Y-%m-%d') AS f_creacion
            FROM cliente 
            ${filterCondition}
            ORDER BY f_creacion DESC, id_cliente DESC
            LIMIT ? OFFSET ?`,
            [...filterValues, limit, offset]
        );

        res.json({
            code: 1,
            data: result,
            metadata: { page, limit, totalPages, totalRecords },
            message: "Clientes listados"
        });
    } catch (error) {
        console.error('Error en getClientes:', error);
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// AGREGAR CLIENTE - OPTIMIZADO
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

        const id_tenant = req.id_tenant;

        // Validaciones mejoradas
        if (!clientType || !documentNumber) {
            return res.status(400).json({
                code: 0,
                message: "Tipo de cliente y número de documento son obligatorios"
            });
        }

        if (clientType === "personal" && (!clientName || !clientLastName)) {
            return res.status(400).json({
                code: 0,
                message: "Nombres y apellidos son obligatorios para clientes personales"
            });
        }

        if (clientType === "business" && !businessName) {
            return res.status(400).json({
                code: 0,
                message: "Razón social es obligatoria para clientes empresariales"
            });
        }

        // Validar formato de documento
        if (clientType === "personal" && documentNumber.length !== 8) {
            return res.status(400).json({
                code: 0,
                message: "El DNI debe tener 8 dígitos"
            });
        }

        if (clientType === "business" && documentNumber.length !== 11) {
            return res.status(400).json({
                code: 0,
                message: "El RUC debe tener 11 dígitos"
            });
        }

        connection = await getConnection();

        // Verificar duplicados de forma más eficiente
        const [existing] = await connection.query(
            `SELECT id_cliente, 
                    CASE WHEN dni = ? THEN 'DNI' ELSE 'RUC' END as tipo_duplicado
             FROM cliente
             WHERE (dni = ? OR ruc = ?) AND id_tenant = ?
             LIMIT 1`,
            [documentNumber, documentNumber, documentNumber, id_tenant]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                code: 0,
                message: `Ya existe un cliente con el mismo ${existing[0].tipo_duplicado}`
            });
        }

        await connection.beginTransaction();

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
            clientName ? clientName.trim() : null,
            clientLastName ? clientLastName.trim() : null,
            businessName ? businessName.trim() : null,
            address || null,
            id_tenant
        ];

        const [result] = await connection.query(query, values);

        await connection.commit();

        // Limpiar caché relacionado
        queryCache.clear();

        // Registrar log de creación de cliente
        if (req.log && req.id_usuario) {
            try {
                const nombreCliente = clientName 
                    ? `${clientName} ${clientLastName}` 
                    : businessName || 'Sin nombre';
                    
                await req.log(LOG_ACTIONS.CLIENTE_CREAR, MODULOS.CLIENTES, {
                    recurso: `cliente_id:${result.insertId}`,
                    descripcion: `Cliente creado: ${nombreCliente} (Doc: ${documentNumber})`
                });
            } catch (error) {
                console.error('Error al registrar log de cliente:', error);
            }
        }

        res.json({
            code: 1,
            data: { id: result.insertId },
            message: "Cliente creado exitosamente"
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en addCliente:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({
                code: 0,
                message: "El cliente ya existe"
            });
        } else {
            res.status(500).json({
                code: 0,
                message: "Error al crear el cliente"
            });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// OBTENER UN CLIENTE - OPTIMIZADO CON CACHÉ
const getCliente = async (req, res) => {
    const { id } = req.params;
    const id_tenant = req.id_tenant;
    
    if (!id) {
        return res.status(400).json({
            code: 0,
            message: "El ID del cliente es obligatorio"
        });
    }

    const cacheKey = `cliente_${id}_${id_tenant}`;
    
    // Verificar caché
    if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({
                code: 1,
                data: cached.data,
                message: "Cliente obtenido (caché)"
            });
        }
        queryCache.delete(cacheKey);
    }

    let connection;
    try {
        connection = await getConnection();

        const [result] = await connection.query(
            `SELECT 
                id_cliente, 
                dni, 
                ruc, 
                nombres, 
                apellidos, 
                razon_social, 
                direccion, 
                DATE_FORMAT(f_creacion, '%Y-%m-%d') AS f_creacion,
                estado_cliente AS estado
             FROM cliente
             WHERE id_cliente = ? AND id_tenant = ?
             LIMIT 1`,
            [id, id_tenant]
        );

        if (result.length === 0) {
            return res.status(404).json({
                code: 0,
                message: "Cliente no encontrado"
            });
        }

        // Guardar en caché
        queryCache.set(cacheKey, {
            data: result[0],
            timestamp: Date.now()
        });

        res.json({
            code: 1,
            data: result[0],
            message: "Cliente obtenido exitosamente"
        });

    } catch (error) {
        console.error('Error en getCliente:', error);
        res.status(500).json({
            code: 0,
            message: "Error al obtener el cliente"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ACTUALIZAR CLIENTE - OPTIMIZADO
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

        const id_tenant = req.id_tenant;

        if (!id_cliente) {
            return res.status(400).json({
                code: 0,
                message: "El ID del cliente es obligatorio"
            });
        }

        connection = await getConnection();

        // Verificar si el cliente existe y obtener datos actuales en una sola query
        const [existingClient] = await connection.query(
            `SELECT id_cliente, dni, ruc, nombres, apellidos, razon_social, 
                    direccion, estado_cliente 
             FROM cliente 
             WHERE id_cliente = ? AND id_tenant = ?
             LIMIT 1`,
            [id_cliente, id_tenant]
        );

        if (existingClient.length === 0) {
            return res.status(404).json({
                code: 0,
                message: "Cliente no encontrado"
            });
        }

        const clienteAnterior = existingClient[0];

        // Verificar duplicados si se está cambiando el documento
        const nuevoDocumento = dni || ruc;
        const documentoAnterior = clienteAnterior.dni || clienteAnterior.ruc;

        if (nuevoDocumento && nuevoDocumento !== documentoAnterior) {
            const [duplicate] = await connection.query(
                `SELECT id_cliente FROM cliente
                 WHERE (dni = ? OR ruc = ?) 
                   AND id_cliente != ? 
                   AND id_tenant = ?
                 LIMIT 1`,
                [nuevoDocumento, nuevoDocumento, id_cliente, id_tenant]
            );

            if (duplicate.length > 0) {
                return res.status(400).json({
                    code: 0,
                    message: "Ya existe otro cliente con ese documento"
                });
            }
        }

        await connection.beginTransaction();

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
            nombres ? nombres.trim() : null,
            apellidos ? apellidos.trim() : null,
            razon_social ? razon_social.trim() : null,
            direccion || null,
            estado !== undefined ? estado : clienteAnterior.estado_cliente,
            id_cliente,
            id_tenant
        ];

        const [result] = await connection.query(query, values);

        await connection.commit();

        // Limpiar caché relacionado
        queryCache.clear();

        // Registrar log de edición de cliente si hay cambios
        if (req.log && req.id_usuario && result.affectedRows > 0) {
            const cambios = [];

            if (clienteAnterior.dni !== (dni || null)) {
                cambios.push(`DNI: ${clienteAnterior.dni || 'vacío'} → ${dni || 'vacío'}`);
            }
            if (clienteAnterior.ruc !== (ruc || null)) {
                cambios.push(`RUC: ${clienteAnterior.ruc || 'vacío'} → ${ruc || 'vacío'}`);
            }
            if (clienteAnterior.nombres !== (nombres || null)) {
                cambios.push(`Nombres: ${clienteAnterior.nombres || 'vacío'} → ${nombres || 'vacío'}`);
            }
            if (clienteAnterior.apellidos !== (apellidos || null)) {
                cambios.push(`Apellidos: ${clienteAnterior.apellidos || 'vacío'} → ${apellidos || 'vacío'}`);
            }
            if (clienteAnterior.razon_social !== (razon_social || null)) {
                cambios.push(`Razón Social: ${clienteAnterior.razon_social || 'vacío'} → ${razon_social || 'vacío'}`);
            }
            if (clienteAnterior.direccion !== (direccion || null)) {
                cambios.push(`Dirección: ${clienteAnterior.direccion || 'vacío'} → ${direccion || 'vacío'}`);
            }
            if (estado !== undefined && clienteAnterior.estado_cliente !== estado) {
                cambios.push(`Estado: ${clienteAnterior.estado_cliente} → ${estado}`);
            }

            if (cambios.length > 0) {
                try {
                    await req.log(LOG_ACTIONS.CLIENTE_EDITAR, MODULOS.CLIENTES, {
                        recurso: `cliente_id:${id_cliente}`,
                        descripcion: `Cliente editado. Cambios: ${cambios.join(', ')}`
                    });
                } catch (error) {
                    console.error('Error al registrar log:', error);
                }
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
            [id_cliente, id_tenant]
        );

        res.json({
            code: 1,
            data: updatedClient[0],
            message: "Cliente actualizado exitosamente"
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en updateCliente:', error);
        res.status(500).json({
            code: 0,
            message: "Error al actualizar el cliente"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ELIMINAR CLIENTE - OPTIMIZADO
const deleteCliente = async (req, res) => {
    const { id } = req.params;
    const id_tenant = req.id_tenant;

    if (!id) {
        return res.status(400).json({
            code: 0,
            message: "El ID del cliente es obligatorio"
        });
    }

    let connection;
    try {
        connection = await getConnection();

        // Verificar si el cliente tiene ventas asociadas
        const [ventasAsociadas] = await connection.query(
            `SELECT COUNT(*) as total FROM venta WHERE id_cliente = ?`,
            [id]
        );

        if (ventasAsociadas[0].total > 0) {
            return res.status(400).json({
                code: 0,
                message: `No se puede eliminar el cliente porque tiene ${ventasAsociadas[0].total} venta(s) asociada(s). Considere desactivarlo en lugar de eliminarlo.`
            });
        }

        await connection.beginTransaction();

        const [result] = await connection.query(
            "DELETE FROM cliente WHERE id_cliente = ? AND id_tenant = ?",
            [id, id_tenant]
        );

        await connection.commit();

        if (result.affectedRows === 0) {
            return res.status(404).json({
                code: 0,
                message: "Cliente no encontrado"
            });
        }

        // Limpiar caché relacionado
        queryCache.clear();

        // Registrar log de eliminación
        if (req.log && req.id_usuario) {
            try {
                await req.log(LOG_ACTIONS.CLIENTE_ELIMINAR, MODULOS.CLIENTES, {
                    recurso: `cliente_id:${id}`,
                    descripcion: `Cliente eliminado`
                });
            } catch (error) {
                console.error('Error al registrar log:', error);
            }
        }

        res.json({
            code: 1,
            message: "Cliente eliminado correctamente"
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en deleteCliente:', error);
        
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            res.status(400).json({
                code: 0,
                message: "No se puede eliminar el cliente porque tiene datos relacionados. Considere desactivarlo en lugar de eliminarlo."
            });
        } else {
            res.status(500).json({
                code: 0,
                message: "Error interno del servidor"
            });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// DESACTIVAR CLIENTE - OPTIMIZADO
const deactivateCliente = async (req, res) => {
    const { id } = req.params;
    const id_tenant = req.id_tenant;

    if (!id) {
        return res.status(400).json({
            code: 0,
            message: "El ID del cliente es obligatorio"
        });
    }

    let connection;
    try {
        connection = await getConnection();

        // Verificar si el cliente existe antes de desactivar
        const [clienteExiste] = await connection.query(
            "SELECT id_cliente, estado_cliente FROM cliente WHERE id_cliente = ? AND id_tenant = ?",
            [id, id_tenant]
        );

        if (clienteExiste.length === 0) {
            return res.status(404).json({
                code: 0,
                message: "Cliente no encontrado"
            });
        }

        if (clienteExiste[0].estado_cliente === 0) {
            return res.status(400).json({
                code: 0,
                message: "El cliente ya está desactivado"
            });
        }

        await connection.beginTransaction();

        await connection.query(
            "UPDATE cliente SET estado_cliente = 0 WHERE id_cliente = ? AND id_tenant = ?",
            [id, id_tenant]
        );

        await connection.commit();

        // Limpiar caché relacionado
        queryCache.clear();

        // Registrar log de desactivación
        if (req.log && req.id_usuario) {
            try {
                await req.log(LOG_ACTIONS.CLIENTE_EDITAR, MODULOS.CLIENTES, {
                    recurso: `cliente_id:${id}`,
                    descripcion: `Cliente desactivado`
                });
            } catch (error) {
                console.error('Error al registrar log:', error);
            }
        }

        res.json({
            code: 1,
            message: "Cliente desactivado con éxito"
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en deactivateCliente:', error);
        res.status(500).json({
            code: 0,
            message: "Error interno del servidor"
        });
    } finally {
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
