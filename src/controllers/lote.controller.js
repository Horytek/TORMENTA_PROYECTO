import { getConnection } from "../database/database.js";
import { methods as NotaIngresoController } from "./notaingreso.controller.js";
import { resolveSku } from "../utils/skuHelper.js";
import moment from "moment";

// 1. Crear Lote (Solicitud)
const createLote = async (req, res) => {
    let connection;
    try {
        const { descripcion, productos, id_usuario } = req.body; // productos: [{ id_producto, id_tonalidad, id_talla, cantidad }]
        const id_tenant = req.id_tenant;

        if (!productos || productos.length === 0) {
            return res.status(400).json({ message: "No se proporcionaron productos" });
        }

        connection = await getConnection();
        await connection.beginTransaction();

        // Crear Lote
        const [loteResult] = await connection.query(
            "INSERT INTO lote_inventario (descripcion, estado, id_usuario_crea, id_tenant, id_usuario_verifica, fecha_verificacion) VALUES (?, 0, ?, ?, NULL, NULL)",
            [descripcion || '', id_usuario, id_tenant]
        );
        const id_lote = loteResult.insertId;

        if (!id_lote) throw new Error("Insert ID is missing");

        // Crear Detalles
        const detalleValues = [];
        const detalleParams = [];

        for (const p of productos) {
            // Resolver SKU (Check if provided, else resolve legacy)
            let id_sku = p.id_sku;
            if (!id_sku) {
                id_sku = await resolveSku(connection, p.id_producto, p.id_tonalidad || null, p.id_talla || null, id_tenant);
            }

            detalleValues.push('(?, ?, ?, ?, ?, ?, ?)');
            // Note: We set tonalidad/talla to null if not provided (SKU based)
            detalleParams.push(id_lote, p.id_producto, p.id_tonalidad || null, p.id_talla || null, p.cantidad, id_tenant, id_sku);
        }

        await connection.query(
            `INSERT INTO detalle_lote_inventario (id_lote, id_producto, id_tonalidad, id_talla, cantidad, id_tenant, id_sku) VALUES ${detalleValues.join(', ')}`,
            detalleParams
        );

        await connection.commit();
        res.json({ code: 1, message: "Solicitud de inventario creada", id_lote });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error createLote:", error);
        res.status(500).json({ code: 0, message: "Error al crear solicitud" });
    } finally {
        if (connection) connection.release();
    }
};

// 2. Verificar Lote
const verifyLote = async (req, res) => {
    let connection;
    try {
        const { id_lote, id_usuario } = req.body;
        const id_tenant = req.id_tenant;

        connection = await getConnection();

        // Fallback: If role is missing in token (old tokens), fetch it
        let userRole = req.user.rol;
        if (!userRole) {
            const [u] = await connection.query("SELECT id_rol FROM usuario WHERE id_usuario = ?", [id_usuario]);
            if (u.length > 0) userRole = u[0].id_rol;
        }

        // Verificar Permiso (Rol Verificador)
        const [permiso] = await connection.query(
            "SELECT id FROM config_verificacion_roles WHERE id_rol = ? AND id_tenant = ? AND stage = 'verify'",
            [userRole, id_tenant]
        );

        if (permiso.length === 0) {
            return res.status(403).json({ message: "No tienes permisos para verificar inventario (Etapa 1)" });
        }

        // Verificar estado actual
        const [lote] = await connection.query("SELECT estado FROM lote_inventario WHERE id_lote = ?", [id_lote]);
        if (!lote.length || lote[0].estado !== 0) {
            return res.status(400).json({ message: "El lote no está pendiente de verificación" });
        }

        await connection.query(
            "UPDATE lote_inventario SET estado = 1, id_usuario_verifica = ?, fecha_verificacion = NOW() WHERE id_lote = ? AND id_tenant = ?",
            [id_usuario, id_lote, id_tenant]
        );

        res.json({ code: 1, message: "Lote verificado" });

    } catch (error) {
        console.error("Error verifyLote:", error);
        res.status(500).json({ code: 0, message: "Error al verificar lote" });
    } finally {
        if (connection) connection.release();
    }
};

// 3. Aprobar Lote (Final)
const approveLote = async (req, res) => {
    let connection;
    try {
        const { id_lote, id_usuario, almacenD, glosa } = req.body; // Necesitamos datos para la Nota final
        const id_tenant = req.id_tenant;

        connection = await getConnection();
        await connection.beginTransaction();

        // Fallback: If role is missing in token (old tokens), fetch it
        let userRole = req.user.rol;
        if (!userRole) {
            const [u] = await connection.query("SELECT id_rol FROM usuario WHERE id_usuario = ?", [id_usuario]);
            if (u.length > 0) userRole = u[0].id_rol;
        }

        // Verificar Permiso (Rol Aprobador)
        const [permiso] = await connection.query(
            "SELECT id FROM config_verificacion_roles WHERE id_rol = ? AND id_tenant = ? AND stage = 'approve'",
            [userRole, id_tenant]
        );

        if (permiso.length === 0) {
            await connection.rollback();
            return res.status(403).json({ message: "No tienes permisos para aprobar inventario (Etapa 2)" });
        }

        // Verificar estado (debe ser 1: Pendiente Aprobación)
        const [lote] = await connection.query("SELECT * FROM lote_inventario WHERE id_lote = ?", [id_lote]);
        if (!lote.length || lote[0].estado !== 1) {
            await connection.rollback();
            return res.status(400).json({ message: "El lote no está pendiente de aprobación" });
        }

        // Obtener detalles del lote
        const [detalles] = await connection.query(
            "SELECT * FROM detalle_lote_inventario WHERE id_lote = ?",
            [id_lote]
        );

        // 1. Actualizar Lote a Aprobado (2)
        await connection.query(
            "UPDATE lote_inventario SET estado = 2, id_usuario_aprueba = ?, fecha_aprobacion = NOW() WHERE id_lote = ? AND id_tenant = ?",
            [id_usuario, id_lote, id_tenant]
        );

        await connection.commit(); // Commit del cambio de estado del lote primero.
        connection.release(); // Liberar esta conexión

        // 2. Llamar a crear Nota
        const productosIds = detalles.map(d => d.id_producto);
        const cantidades = detalles.map(d => d.cantidad);
        const tonalidades = detalles.map(d => d.id_tonalidad);
        const tallas = detalles.map(d => d.id_talla);

        // HACK: Obtener numero comprobante
        const conn2 = await getConnection();
        const [ultimoComp] = await conn2.query("SELECT num_comprobante FROM comprobante WHERE id_tipocomprobante = 6 AND id_tenant = ? ORDER BY num_comprobante DESC LIMIT 1", [id_tenant]);

        let nuevoNum = "I400-00000001";
        if (ultimoComp.length > 0) {
            const partes = ultimoComp[0].num_comprobante.split("-");
            const serie = partes[0];
            const num = parseInt(partes[1]) + 1;
            nuevoNum = `${serie}-${num.toString().padStart(8, '0')}`;
        }
        conn2.release();

        if (!almacenD) {
            await connection.rollback(); // Too late for batch, but safe guard logic
            return res.status(400).json({ message: "Se requiere un almacén de destino (almacenD)" });
        }

        const fakeReq = {
            body: {
                almacenD: almacenD,
                destinatario: 1,
                glosa: glosa || `Nota generada desde Lote #${id_lote}`,
                nota: 'Ingreso por Aprobación de Lote',
                fecha: moment().format('YYYY-MM-DD HH:mm:ss'),
                producto: productosIds,
                numComprobante: nuevoNum,
                cantidad: cantidades,
                observacion: `Generado auto desde Lote ${id_lote}`,
                usuario: req.user.username || 'Sistema',
                tonalidad: tonalidades,
                talla: tallas
            },
            id_tenant: id_tenant,
            connection: { remoteAddress: '::1' },
            user: req.user
        };

        const fakeRes = {
            status: (code) => ({ json: (data) => console.log(`Status ${code}:`, data) }),
            json: (data) => console.log("Nota Response:", data)
        };

        try {
            await NotaIngresoController.insertNotaAndDetalle(fakeReq, fakeRes);
            res.json({ code: 1, message: "Lote aprobado y nota generada" });
        } catch (e) {
            console.error("Error generando nota para lote:", e);
            // Revertir lote
            const conn3 = await getConnection();
            await conn3.query("UPDATE lote_inventario SET estado = 1, id_usuario_aprueba = NULL WHERE id_lote = ?", [id_lote]);
            conn3.release();
            res.status(500).json({ message: "Error generando nota. Lote revertido a pendiente." });
        }

    } catch (error) {
        if (connection) {
            try { await connection.rollback(); } catch (e) { }
            connection.release();
        }
        console.error("Error approveLote:", error);
        res.status(500).json({ code: 0, message: "Error al aprobar lote" });
    }
};

const getLotes = async (req, res) => {
    let connection;
    try {
        const { estado } = req.query;
        const id_tenant = req.id_tenant;
        connection = await getConnection();

        let query = `
            SELECT l.*, 
            uc.usua as creador, uv.usua as verificador, ua.usua as aprobador
            FROM lote_inventario l
            LEFT JOIN usuario uc ON l.id_usuario_crea = uc.id_usuario
            LEFT JOIN usuario uv ON l.id_usuario_verifica = uv.id_usuario
            LEFT JOIN usuario ua ON l.id_usuario_aprueba = ua.id_usuario
            WHERE l.id_tenant = ?
        `;
        const params = [id_tenant];

        if (estado !== undefined) {
            query += " AND l.estado = ?";
            params.push(estado);
        }

        query += " ORDER BY l.fecha_creacion DESC";

        const [rows] = await connection.query(query, params);
        res.json({ code: 1, data: rows });

    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 0, message: "Error al obtener lotes" });
    } finally {
        if (connection) connection.release();
    }
};

const getLoteDetalle = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();

        const [rows] = await connection.query(`
            SELECT d.*, p.descripcion as producto, m.nom_marca as marca, 
                   t.nombre as tonalidad, ta.nombre as talla,
                   sku.sku as sku_code
            FROM detalle_lote_inventario d
            INNER JOIN producto p ON d.id_producto = p.id_producto
            INNER JOIN marca m ON p.id_marca = m.id_marca
            LEFT JOIN tonalidad t ON d.id_tonalidad = t.id_tonalidad
            LEFT JOIN talla ta ON d.id_talla = ta.id_talla
            LEFT JOIN producto_sku sku ON d.id_sku = sku.id_sku
            WHERE d.id_lote = ?
        `, [id]);

        res.json({ code: 1, data: rows });

    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 0, message: "Error al obtener detalle lote" });
    } finally {
        if (connection) connection.release();
    }
};


export const methods = {
    createLote,
    verifyLote,
    approveLote,
    getLotes,
    getLoteDetalle
};
