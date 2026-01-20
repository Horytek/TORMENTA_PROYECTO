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
                DATE_FORMAT(f_creacion, '%Y-%m-%d') AS f_creacion,
                'local' as origen
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
            address,
            destination // 'sistema' (default) or 'web'
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

        if (destination === 'web') {
            // Verificar duplicados en tesis_db (Catálogo Web)
            // Asumimos que 'dni' almacena cualquier documento (DNI o RUC)
            const [existing] = await connection.query(
                `SELECT id_cliente
                 FROM tesis_db.cliente
                 WHERE dni = ? AND id_tenant = ?
                 LIMIT 1`,
                [documentNumber, id_tenant]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    code: 0,
                    message: "Ya existe un cliente con el mismo documento en el Catálogo Web"
                });
            }

            // Insertar en tesis_db.cliente
            // Mapeamos RUC a 'dni' column
            // Mapeamos Razon Social a 'nombres' y apellidos como '-'
            const query = `
                INSERT INTO tesis_db.cliente (
                    dni,
                    nombres,
                    apellidos,
                    direccion,
                    estado_cliente,
                    id_tenant,
                    f_creacion
                ) VALUES (?, ?, ?, ?, 1, ?, NOW())
            `;

            const values = [
                documentNumber, // Holds DNI or RUC
                clientType === "business" ? businessName : (clientName || "").trim(),
                clientType === "business" ? "-" : (clientLastName || "").trim(),
                address || null,
                id_tenant
            ];

            const [result] = await connection.query(query, values);

            // No transaction usually needed for single insert on external db unless complex
            // We reuse the same connection which is fine if user has permissions

            // Registrar log de creación de cliente externo
            if (req.log && req.id_usuario) {
                try {
                    const nombreCliente = clientName
                        ? `${clientName} ${clientLastName}`
                        : businessName || 'Sin nombre';

                    await req.log(LOG_ACTIONS.CLIENTE_CREAR, MODULOS.CLIENTES, {
                        recurso: `cliente_externo_id:${result.insertId}`,
                        descripcion: `Cliente WEB creado: ${nombreCliente} (Doc: ${documentNumber})`
                    });
                } catch (error) {
                    console.error('Error al registrar log de cliente externo:', error);
                }
            }

            return res.json({
                code: 1,
                data: { id: result.insertId, origen: 'externo' },
                message: "Cliente creado exitosamente en el Catálogo Web"
            });

        } else {
            // Lógica existente para cliente LOCAL (Sistema)

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
                data: { id: result.insertId, origen: 'local' },
                message: "Cliente creado exitosamente"
            });
        }

    } catch (error) {
        if (connection && connection.rollback && req.body.destination !== 'web') {
            // Rollback only strictly necessary if transaction started (local)
            // But 'web' path didn't start explicit transaction above.
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

        let [result] = await connection.query(
            `SELECT 
                id_cliente, 
                dni, 
                ruc, 
                nombres, 
                apellidos, 
                razon_social, 
                direccion, 
                DATE_FORMAT(f_creacion, '%Y-%m-%d') AS f_creacion,
                estado_cliente AS estado,
                'local' as origen
             FROM cliente
             WHERE id_cliente = ? AND id_tenant = ?
             LIMIT 1`,
            [id, id_tenant]
        );

        if (result.length === 0) {
            const [resultExterno] = await connection.query(
                `SELECT 
                    id_cliente, 
                    dni, 
                    ruc, 
                    nombres, 
                    apellidos, 
                    razon_social, 
                    direccion, 
                    DATE_FORMAT(f_creacion, '%Y-%m-%d') AS f_creacion,
                    estado_cliente AS estado,
                    'externo' as origen
                 FROM tesis_db.cliente
                 WHERE id_cliente = ? AND id_tenant = ?
                 LIMIT 1`,
                [id, id_tenant]
            );

            if (resultExterno.length > 0) {
                result = resultExterno;
            } else {
                return res.status(404).json({
                    code: 0,
                    message: "Cliente no encontrado"
                });
            }
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

const getComprasCliente = async (req, res) => {
    let connection;
    const { id_cliente, limit = 10 } = req.query;
    const id_tenant = req.id_tenant;
    if (!id_cliente) return res.status(400).json({ code: 0, message: "Falta id_cliente" });

    try {
        connection = await getConnection();
        const [rows] = await connection.query(
            `
      SELECT 
        v.id_venta AS id,
        DATE_FORMAT(v.f_venta,'%Y-%m-%d') AS fecha,
        SUM(dv.total) AS total,
        COUNT(dv.id_producto) AS items
      FROM venta v
      INNER JOIN detalle_venta dv ON dv.id_venta = v.id_venta
      WHERE v.id_cliente = ? AND v.estado_venta != 0 AND v.id_tenant = ?
      GROUP BY v.id_venta, v.f_venta
      ORDER BY v.f_venta DESC
      LIMIT ?
      `,
            [id_cliente, id_tenant, Number(limit)]
        );
        res.json({ code: 1, data: rows, message: "Compras del cliente listadas" });
    } catch (e) {
        res.status(500).json({ code: 0, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

const getHistorialCliente = async (req, res) => {
    let connection;
    const { id_cliente, limit = 15 } = req.query;
    const id_tenant = req.id_tenant;
    if (!id_cliente) return res.status(400).json({ code: 0, message: "Falta id_cliente" });

    try {
        connection = await getConnection();
        // El recurso se guarda como "cliente_id:123"
        const recursoBusqueda = `cliente_id:${id_cliente}`;

        const [rows] = await connection.query(
            `
      SELECT 
        id_log,
        accion,
        fecha,
        descripcion,
        recurso,
        u.usua as usuario
      FROM log_sistema l
      LEFT JOIN usuario u ON l.id_usuario = u.id_usuario
      WHERE l.id_tenant = ? AND l.recurso = ?
      ORDER BY l.fecha DESC
      LIMIT ?
      `,
            [id_tenant, recursoBusqueda, Number(limit)]
        );
        res.json({ code: 1, data: rows, message: "Historial del cliente listado" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ code: 0, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

const getClientStats = async (req, res) => {
    let connection;
    const id_tenant = req.id_tenant;
    try {
        connection = await getConnection();

        const [rows] = await connection.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado_cliente = 1 THEN 1 ELSE 0 END) as activos,
                SUM(CASE WHEN estado_cliente = 0 THEN 1 ELSE 0 END) as inactivos,
                SUM(CASE WHEN MONTH(f_creacion) = MONTH(CURRENT_DATE()) AND YEAR(f_creacion) = YEAR(CURRENT_DATE()) THEN 1 ELSE 0 END) as nuevos_mes
            FROM cliente
            WHERE id_tenant = ?
        `, [id_tenant]);

        res.json({
            code: 1,
            data: rows[0],
            message: "Estadísticas obtenidas"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 0, message: "Error al obtener estadísticas" });
    } finally {
        if (connection) connection.release();
    }
};

// OBTENER CLIENTES EXTERNOS (TESIS_DB)
const getClientesExternos = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(
            `SELECT 
                id_cliente, 
                dni,
                nombres, 
                apellidos,
                direccion, 
                email,
                telefono,
                estado_cliente as estado, 
                DATE_FORMAT(f_creacion, '%Y-%m-%d') as f_creacion 
             FROM tesis_db.cliente 
             WHERE id_tenant = ? 
             ORDER BY f_creacion DESC`,
            [req.id_tenant]
        );

        const mapped = result.map(c => ({
            ...c,
            // Si apellidos es '-', es empresa
            razon_social: c.apellidos === '-' ? c.nombres : null,
            // Si no es empresa, concatenar nombres y apellidos para display si se desea, o dejar como está
            dniRuc: c.dni, // dni column now holds both
            origen: 'externo',
        }));

        res.json({
            code: 1,
            data: mapped,
            message: "Clientes externos listados"
        });
    } catch (error) {
        console.error('Error en getClientesExternos:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// OBTENER COMPRAS CLIENTE EXTERNO
const getComprasClienteExterno = async (req, res) => {
    let connection;
    const { id_cliente, limit = 10 } = req.query;
    const id_tenant = req.id_tenant;

    if (!id_cliente) return res.status(400).json({ code: 0, message: "Falta id_cliente" });

    try {
        connection = await getConnection();
        const [rows] = await connection.query(
            `
            SELECT 
                c.id_compra AS id,
                DATE_FORMAT(c.fecha_compra, '%Y-%m-%d') AS fecha,
                c.total,
                COUNT(dc.id_detalle_compra) AS items
            FROM tesis_db.compra c
            LEFT JOIN tesis_db.detalle_compra dc ON c.id_compra = dc.id_compra
            WHERE c.id_cliente = ? AND c.id_tenant = ?
            GROUP BY c.id_compra
            ORDER BY c.fecha_compra DESC
            LIMIT ?
            `,
            [id_cliente, id_tenant, Number(limit)]
        );
        res.json({ code: 1, data: rows, message: "Compras externas listadas" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ code: 0, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

// OBTENER DETALLE COMPRA EXTERNA
const getCompraExternoById = async (req, res) => {
    let connection;
    const { id } = req.params;

    try {
        connection = await getConnection();
        const [compra] = await connection.query(
            `SELECT 
                c.id_compra as id,
                DATE_FORMAT(c.fecha_compra, '%Y-%m-%d') as fecha,
                c.total,
                c.estado_compra as estado,
                'Externo' as usuario,
                cli.dni,
                CONCAT(cli.nombres, ' ', cli.apellidos) as cliente
             FROM tesis_db.compra c
             LEFT JOIN tesis_db.cliente cli ON c.id_cliente = cli.id_cliente
             WHERE c.id_compra = ?`,
            [id]
        );

        if (compra.length === 0) return res.status(404).json({ code: 0, message: "Compra no encontrada" });

        // Intento unir con producto local, asumiendo IDs compatibles o si no, solo IDs
        // Si tesis_db tiene producto, usar tesis_db.producto
        // Haré un Left Join condicional o simplemente mostraré ID producto si no hay match
        // Usaré tesis_db.producto asumiendo que existe
        const [detalles] = await connection.query(
            `SELECT 
                dc.id_producto as id,
                COALESCE(p.descripcion, CONCAT('Producto Externo ', dc.id_producto)) as nombre,
                dc.cantidad,
                dc.precio_unitario as precio,
                dc.subtotal as total
             FROM tesis_db.detalle_compra dc
             LEFT JOIN producto p ON dc.id_producto = p.id_producto
             WHERE dc.id_compra = ?`,
            [id]
        );

        const data = {
            ...compra[0],
            detalles
        };

        res.json({ code: 1, data, message: "Detalle compra externa" });

    } catch (e) {
        console.error(e);
        res.status(500).json({ code: 0, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

// OBTENER COMPRAS EXTERNAS POR DNI/RUC
const getComprasClienteExternoByDoc = async (req, res) => {
    let connection;
    const { doc, limit = 10 } = req.query;
    const id_tenant = req.id_tenant;

    if (!doc) return res.status(400).json({ code: 0, message: "Falta documento (doc)" });

    try {
        connection = await getConnection();
        // Primero buscamos el id_cliente en tesis_db.cliente usando el doc (en campo dni)
        const [clientes] = await connection.query(
            `SELECT id_cliente FROM tesis_db.cliente WHERE dni = ? AND id_tenant = ? LIMIT 1`,
            [doc, id_tenant]
        );

        if (clientes.length === 0) {
            // Si no existe en tesis_db, retornamos array vacío
            return res.json({ code: 1, data: [], message: "No se encontró cliente externo con ese documento" });
        }

        const id_cliente = clientes[0].id_cliente;

        const [rows] = await connection.query(
            `
            SELECT 
                c.id_compra AS id,
                DATE_FORMAT(c.fecha_compra, '%Y-%m-%d') AS fecha,
                c.total,
                COUNT(dc.id_detalle_compra) AS items
            FROM tesis_db.compra c
            LEFT JOIN tesis_db.detalle_compra dc ON c.id_compra = dc.id_compra
            WHERE c.id_cliente = ? AND c.id_tenant = ?
            GROUP BY c.id_compra
            ORDER BY c.fecha_compra DESC
            LIMIT ?
            `,
            [id_cliente, id_tenant, Number(limit)]
        );

        res.json({ code: 1, data: rows, message: "Compras externas listadas por documento" });

    } catch (e) {
        console.error(e);
        res.status(500).json({ code: 0, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};


export const methods = {
    getClientes,
    getCliente,
    addCliente,
    updateCliente,
    deleteCliente,
    deactivateCliente,
    getComprasCliente,
    getHistorialCliente,
    getClientStats,
    getClientesExternos,
    getComprasClienteExterno,
    getCompraExternoById,
    getComprasClienteExternoByDoc,
    // ...otros
};
