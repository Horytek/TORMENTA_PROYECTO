import { getConnection } from "./../database/database.js";

// Cache para queries repetitivas (opcional, para datos que no cambian frecuentemente)
const queryCache = new Map();
const CACHE_TTL = 60000; // 1 minuto

// Limpiar caché periódicamente para evitar acumulación de memoria
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of queryCache.entries()) {
        if (now - value.timestamp > CACHE_TTL * 2) {
            queryCache.delete(key);
        }
    }
}, CACHE_TTL * 2); // Limpiar cada 2 minutos

//MOSTRAR TODAS LAS GUIAS DE REMISION - OPTIMIZADO
const getGuias = async (req, res) => {
    console.log('Parámetros recibidos en getGuias:', req.query);
    
    let connection;
    const {
        page = 0,
        limit = 10,
        num_guia = '',
        documento = '',
        nombre_sucursal = '',
        fecha_i = '2022-01-01',
        fecha_e = '2027-12-27'
    } = req.query;
    const id_tenant = req.id_tenant;
    const offset = page * limit;

    try {
        connection = await getConnection();

        // Query optimizada para contar - usa índice en id_tenant y estado_guia si existe
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM guia_remision gr
            WHERE gr.id_tenant = ?
                ${num_guia ? 'AND EXISTS (SELECT 1 FROM comprobante c WHERE c.id_comprobante = gr.id_comprobante AND c.num_comprobante LIKE ?)' : ''}
                ${documento ? 'AND EXISTS (SELECT 1 FROM destinatario d WHERE d.id_destinatario = gr.id_destinatario AND (d.dni LIKE ? OR d.ruc LIKE ?))' : ''}
                ${nombre_sucursal ? 'AND EXISTS (SELECT 1 FROM sucursal s WHERE s.id_sucursal = gr.id_sucursal AND s.nombre_sucursal LIKE ?)' : ''}
                AND gr.f_generacion BETWEEN ? AND ?
        `;
        
        const countParams = [id_tenant];
        if (num_guia) countParams.push(`%${num_guia}%`);
        if (documento) {
            countParams.push(`${documento}%`, `${documento}%`);
        }
        if (nombre_sucursal) countParams.push(`${nombre_sucursal}%`);
        countParams.push(fecha_i, fecha_e);

        const [totalResult] = await connection.query(countQuery, countParams);
        const totalGuias = totalResult[0].total;

        // Si no hay guías, retornar temprano
        if (totalGuias === 0) {
            return res.json({ code: 1, data: [], totalGuias: 0 });
        }

        // Query principal optimizada con JOIN único para detalles
        const [guiasConDetalles] = await connection.query(
            `
            WITH GuiasPaginadas AS (
                SELECT
                    gr.id_guiaremision AS id,
                    DATE_FORMAT(gr.f_generacion, '%Y-%m-%d') AS fecha,
                    gr.h_generacion,
                    gr.f_anulacion,
                    gr.u_modifica,
                    c.num_comprobante AS num_guia,
                    CASE 
                        WHEN d.dni IS NOT NULL THEN CONCAT(d.nombres, ' ', d.apellidos)
                        ELSE d.razon_social
                    END AS cliente,
                    COALESCE(d.dni, d.ruc) AS documento,
                    COALESCE(CONCAT(v.nombres, ' ', v.apellidos), 'Sin vendedor') AS vendedor,
                    COALESCE(v.dni, '') as dni,
                    SUBSTRING(c.num_comprobante, 2, 3) AS serieNum, 
                    SUBSTRING(c.num_comprobante, 6, 8) AS num,
                    gr.total as total,
                    gr.glosa AS concepto,
                    gr.estado_guia AS estado,
                    s.nombre_sucursal,
                    gr.dir_partida AS dir_partida,
                    gr.dir_destino AS dir_destino,
                    gr.id_ubigeo_o as id_ubigeo_o,
                    gr.id_ubigeo_d as id_ubigeo_d,
                    gr.observacion AS observacion,
                    COALESCE(CONCAT(t.nombres, ' ', t.apellidos), '') AS transportistapriv,
                    COALESCE(t.razon_social, '') AS transportistapub,
                    t.dni AS docpriv,
                    t.ruc AS docpub,
                    gr.cantidad as canti,
                    gr.peso as peso
                FROM guia_remision gr
                INNER JOIN destinatario d ON gr.id_destinatario = d.id_destinatario
                INNER JOIN sucursal s ON gr.id_sucursal = s.id_sucursal
                LEFT JOIN vendedor v ON s.dni = v.dni
                INNER JOIN comprobante c ON gr.id_comprobante = c.id_comprobante
                LEFT JOIN transportista t ON gr.id_transportista = t.id_transportista
                WHERE
                    gr.id_tenant = ?
                    AND (? = '' OR c.num_comprobante LIKE ?)
                    AND (? = '' OR d.dni LIKE ? OR d.ruc LIKE ?)
                    AND gr.f_generacion BETWEEN ? AND ?
                    AND (? = '' OR s.nombre_sucursal LIKE ?)
                ORDER BY c.num_comprobante DESC
                LIMIT ? OFFSET ?
            )
            SELECT 
                gp.*,
                de.id_producto AS detalle_codigo,
                m.nom_marca AS detalle_marca,
                p.descripcion AS detalle_descripcion,
                de.cantidad AS detalle_cantidad,
                p.undm AS detalle_um,
                p.precio AS detalle_precio
            FROM GuiasPaginadas gp
            LEFT JOIN detalle_envio de ON gp.id = de.id_guiaremision AND de.id_tenant = ?
            LEFT JOIN producto p ON de.id_producto = p.id_producto
            LEFT JOIN marca m ON p.id_marca = m.id_marca
            ORDER BY gp.num_guia ASC
            `,
            [
                id_tenant, 
                num_guia, `%${num_guia}%`,
                documento, `${documento}%`, `${documento}%`, 
                fecha_i, fecha_e,
                nombre_sucursal, `${nombre_sucursal}%`,
                parseInt(limit), parseInt(offset),
                id_tenant
            ]
        );

        // Agrupar los resultados por guía
        const guiasMap = new Map();
        
        for (const row of guiasConDetalles) {
            const guiaId = row.id;
            
            if (!guiasMap.has(guiaId)) {
                const { 
                    detalle_codigo: _detalle_codigo, 
                    detalle_marca: _detalle_marca, 
                    detalle_descripcion: _detalle_descripcion, 
                    detalle_cantidad: _detalle_cantidad, 
                    detalle_um: _detalle_um, 
                    detalle_precio: _detalle_precio, 
                    ...guiaData 
                } = row;
                
                guiasMap.set(guiaId, {
                    ...guiaData,
                    detalles: []
                });
            }
            
            // Agregar detalle si existe
            if (row.detalle_codigo) {
                guiasMap.get(guiaId).detalles.push({
                    codigo: row.detalle_codigo,
                    marca: row.detalle_marca,
                    descripcion: row.detalle_descripcion,
                    cantidad: row.detalle_cantidad,
                    um: row.detalle_um,
                    precio: row.detalle_precio
                });
            }
        }

        const guias = Array.from(guiasMap.values());
        res.json({ code: 1, data: guias, totalGuias });

    } catch (error) {
        console.error('Error en getGuias:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

//SUCURSALES - OPTIMIZADO CON CACHÉ
const getSucursal = async (req, res) => {
    const cacheKey = `sucursales_${req.id_tenant}`;
    
    // Verificar caché
    if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({ code: 1, data: cached.data, message: "Sucursales listadas (caché)" });
        }
        queryCache.delete(cacheKey);
    }
    
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(
            `SELECT id_sucursal AS id, nombre_sucursal AS nombre, ubicacion AS direccion 
             FROM sucursal 
             WHERE id_tenant = ? 
             ORDER BY nombre_sucursal`,
            [req.id_tenant]
        );
        
        // Guardar en caché
        queryCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        
        res.json({ code: 1, data: result, message: "Sucursales listadas" });
    } catch (error) {
        console.error('Error en getSucursal:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

//UBIGEO - OPTIMIZADO CON CACHÉ
const getUbigeoGuia = async (req, res) => {
    const cacheKey = `ubigeo_${req.id_tenant}`;
    
    // Verificar caché
    if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL * 5) { // Mayor TTL para ubigeo que cambia menos
            return res.json({ code: 1, data: cached.data, message: "Ubigeo listados (caché)" });
        }
        queryCache.delete(cacheKey);
    }
    
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(
            `SELECT id_ubigeo as id, codigo_ubigeo as codigo, 
                    departamento, provincia, distrito 
             FROM ubigeo 
             WHERE id_tenant = ?
             ORDER BY departamento, provincia, distrito`,
            [req.id_tenant]
        );
        
        // Guardar en caché
        queryCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        
        res.json({ code: 1, data: result, message: "Ubigeo listados" });
    } catch (error) {
        console.error('Error en getUbigeoGuia:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

//CODIGO PARA NUEVA GUIA - OPTIMIZADO
const generarCodigoGuia = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(
            `SELECT CONCAT('T400-', LPAD(COALESCE(SUBSTRING(MAX(num_comprobante), 6) + 1, 1), 8, '0')) AS nuevo_numero_de_guia
             FROM comprobante
             WHERE id_tipocomprobante = 5 AND id_tenant = ?
             AND num_comprobante LIKE 'T400-%'`,
            [req.id_tenant]
        );
        res.json({ code: 1, data: result, message: "Nuevo numero de guía de remisión" });
    } catch (error) {
        console.error('Error en generarCodigoGuia:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

//DESTINATARIOS - OPTIMIZADO CON CACHÉ
const getDestinatariosGuia = async (req, res) => {
    const cacheKey = `destinatarios_${req.id_tenant}`;
    
    // Verificar caché
    if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({ code: 1, data: cached.data, message: "Destinatarios listados (caché)" });
        }
        queryCache.delete(cacheKey);
    }
    
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(
            `SELECT 
                id_destinatario AS id,
                COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) AS destinatario,
                COALESCE(dni, ruc) AS documento, 
                ubicacion
            FROM destinatario
            WHERE id_tenant = ?
                AND ((nombres IS NOT NULL AND nombres <> '' AND apellidos IS NOT NULL AND apellidos <> '')
                    OR (razon_social IS NOT NULL AND razon_social <> ''))
            ORDER BY 
                CASE WHEN COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) = 'Clientes Varios' 
                     THEN 0 ELSE 1 END,
                destinatario`,
            [req.id_tenant]
        );
        
        // Guardar en caché
        queryCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        
        res.json({ code: 1, data: result, message: "Destinatarios listados" });
    } catch (error) {
        console.error('Error en getDestinatariosGuia:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

//OBTENER TRANSPORTE PÚBLICO - OPTIMIZADO
const getTransportePublicoGuia = async (req, res) => {
    const cacheKey = `transporte_publico_${req.id_tenant}`;
    
    // Verificar caché
    if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({ code: 1, data: cached.data, message: "Transportes Públicos listados (caché)" });
        }
        queryCache.delete(cacheKey);
    }
    
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(
            `SELECT t.id_transportista AS id, 
                    v.placa AS placa, 
                    t.ruc AS ruc, 
                    t.razon_social AS razonsocial, 
                    t.telefono AS telefonopub, 
                    v.tipo AS vehiculopub
             FROM transportista t
             LEFT JOIN vehiculo v ON t.placa = v.placa AND v.id_tenant = t.id_tenant
             WHERE t.ruc IS NOT NULL AND t.id_tenant = ?
             ORDER BY t.razon_social`,
            [req.id_tenant]
        );
        
        // Guardar en caché
        queryCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        
        res.json({ code: 1, data: result, message: "Transportes Públicos listados" });
    } catch (error) {
        console.error('Error en getTransportePublicoGuia:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

//OBTENER TRANSPORTE PRIVADO - OPTIMIZADO
const getTransportePrivadoGuia = async (req, res) => {
    const cacheKey = `transporte_privado_${req.id_tenant}`;
    
    // Verificar caché
    if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({ code: 1, data: cached.data, message: "Transportes Privados listados (caché)" });
        }
        queryCache.delete(cacheKey);
    }
    
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(
            `SELECT t.id_transportista AS id, 
                    v.placa AS placa, 
                    t.dni AS dni, 
                    CONCAT(t.nombres, ' ', t.apellidos) AS transportista, 
                    t.telefono AS telefonopriv, 
                    v.tipo AS vehiculopriv
             FROM transportista t
             LEFT JOIN vehiculo v ON t.placa = v.placa AND v.id_tenant = t.id_tenant
             WHERE t.dni IS NOT NULL AND t.id_tenant = ?
             ORDER BY t.nombres, t.apellidos`,
            [req.id_tenant]
        );
        
        // Guardar en caché
        queryCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        
        res.json({ code: 1, data: result, message: "Transportes Privados listados" });
    } catch (error) {
        console.error('Error en getTransportePrivadoGuia:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

//CODIGO PARA NUEVO TRANSPORISTA - OPTIMIZADO
const generarCodigoTrans = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(
            `SELECT CONCAT('T', LPAD(COALESCE(SUBSTRING(MAX(id_transportista), 2) + 1, 1), 7, '0')) AS nuevo_codigo_trans
             FROM transportista
             WHERE id_tenant = ? AND id_transportista LIKE 'T%'`,
            [req.id_tenant]
        );
        res.json({ code: 1, data: result, message: "Nuevo código de transportista" });
    } catch (error) {
        console.error('Error en generarCodigoTrans:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

//INSERTAR NUEVO TRANSPORTE PÚBLICO - OPTIMIZADO
const addTransportistaPublico = async (req, res) => {
    const { id, placa, ruc, razon_social, ubicacion, telefono } = req.body;
    const id_tenant = req.id_tenant;

    // Validación mejorada
    if (!id || !ruc || !razon_social || !ubicacion) {
        return res.status(400).json({ 
            code: 0, 
            message: "Campos requeridos: id, ruc, razon_social, ubicacion" 
        });
    }
    
    let connection;
    try {
        connection = await getConnection();
        await connection.query(
            `INSERT INTO transportista 
             (id_transportista, placa, ruc, razon_social, direccion, telefono, id_tenant) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, placa || null, ruc, razon_social, ubicacion, telefono || null, id_tenant]
        );
        
        // Limpiar caché relacionado
        queryCache.delete(`transporte_publico_${id_tenant}`);
        
        res.json({ 
            code: 1, 
            message: "Transportista público añadido exitosamente",
            id_transportista: id 
        });
    } catch (error) {
        console.error('Error en addTransportistaPublico:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ 
                code: 0, 
                message: "El transportista ya existe" 
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

//INSERTAR NUEVO TRANSPORTE PRIVADO - OPTIMIZADO
const addTransportistaPrivado = async (req, res) => {
    const { id, placa, dni, nombres, apellidos, ubicacion, telefono } = req.body;
    const id_tenant = req.id_tenant;

    // Validación mejorada
    if (!id || !dni || !nombres || !apellidos || !ubicacion) {
        return res.status(400).json({ 
            code: 0, 
            message: "Campos requeridos: id, dni, nombres, apellidos, ubicacion" 
        });
    }
    
    let connection;
    try {
        connection = await getConnection();
        await connection.query(
            `INSERT INTO transportista 
             (id_transportista, placa, dni, nombres, apellidos, direccion, telefono, id_tenant) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, placa || null, dni, nombres, apellidos, ubicacion, telefono || null, id_tenant]
        );
        
        // Limpiar caché relacionado
        queryCache.delete(`transporte_privado_${id_tenant}`);
        
        res.json({ 
            code: 1, 
            message: "Transportista privado añadido exitosamente",
            id_transportista: id 
        });
    } catch (error) {
        console.error('Error en addTransportistaPrivado:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ 
                code: 0, 
                message: "El transportista ya existe" 
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

//LÓGICA VEHÍCULO

//OBTENER VEHÍCULOS - OPTIMIZADO
const getVehiculos = async (req, res) => {
    const cacheKey = `vehiculos_${req.id_tenant}`;
    
    // Verificar caché
    if (queryCache.has(cacheKey)) {
        const cached = queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json({ code: 1, data: cached.data, message: "Vehículos listados (caché)" });
        }
        queryCache.delete(cacheKey);
    }
    
    let connection;
    try {
        connection = await getConnection();
        const [vehiculos] = await connection.query(
            `SELECT placa, tipo 
             FROM vehiculo 
             WHERE id_tenant = ?
             ORDER BY placa`,
            [req.id_tenant]
        );
        
        // Guardar en caché
        queryCache.set(cacheKey, {
            data: vehiculos,
            timestamp: Date.now()
        });
        
        res.json({ code: 1, data: vehiculos, message: "Vehículos listados" });
    } catch (error) {
        console.error('Error en getVehiculos:', error);
        if (!res.headersSent) {
            res.status(500).json({ code: 0, message: "Error interno del servidor" });
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

//INSERTAR NUEVO VEHÍCULO - OPTIMIZADO
const addVehiculo = async (req, res) => {
    const { placa, tipo } = req.body;
    const id_tenant = req.id_tenant;

    if (!placa || !tipo) {
        return res.status(400).json({ 
            code: 0, 
            message: "Campos requeridos: placa, tipo" 
        });
    }
    
    let connection;
    try {
        connection = await getConnection();
        await connection.query(
            `INSERT INTO vehiculo (placa, tipo, id_tenant) VALUES (?, ?, ?)`,
            [placa.toUpperCase(), tipo, id_tenant]
        );
        
        // Limpiar caché relacionado
        queryCache.delete(`vehiculos_${id_tenant}`);
        queryCache.delete(`transporte_publico_${id_tenant}`);
        queryCache.delete(`transporte_privado_${id_tenant}`);
        
        res.json({ 
            code: 1, 
            message: "Vehículo añadido exitosamente",
            placa: placa.toUpperCase() 
        });
    } catch (error) {
        console.error('Error en addVehiculo:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ 
                code: 0, 
                message: "La placa ya está registrada" 
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

//OBTENER PRODUCTOS - OPTIMIZADO
const getProductos = async (req, res) => {
    let connection;
    const { descripcion = '', codbarras = '' } = req.query;
    const id_tenant = req.id_tenant;

    try {
        connection = await getConnection();

        // Query optimizada con condiciones más eficientes
        let query = `
            SELECT 
                p.id_producto AS codigo, 
                p.descripcion AS descripcion, 
                m.nom_marca AS marca,
                p.cod_barras AS codbarras
            FROM 
                producto p 
            INNER JOIN 
                marca m ON p.id_marca = m.id_marca
            WHERE p.id_tenant = ?`;
        
        const params = [id_tenant];
        
        // Solo agregar condiciones si hay valores de búsqueda
        if (descripcion) {
            query += ` AND p.descripcion LIKE ?`;
            params.push(`%${descripcion}%`);
        }
        
        if (codbarras) {
            // Si es búsqueda exacta de código de barras, es más eficiente
            if (!codbarras.includes('%')) {
                query += ` AND p.cod_barras = ?`;
                params.push(codbarras);
            } else {
                query += ` AND p.cod_barras LIKE ?`;
                params.push(`%${codbarras}%`);
            }
        }
        
        query += ` ORDER BY p.descripcion LIMIT 100`; // Limitar resultados para evitar sobrecarga

        const [productosResult] = await connection.query(query, params);
        res.json({ code: 1, data: productosResult });
    } catch (error) {
        console.error('Error en getProductos:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// INSERTAR DESTINATARIO NATURAL - OPTIMIZADO
const addDestinatarioNatural = async (req, res) => {
    const { dni, nombres, apellidos, ubicacion } = req.body;
    const id_tenant = req.id_tenant;

    if (!dni || !nombres || !apellidos || !ubicacion) {
        return res.status(400).json({ 
            code: 0, 
            message: "Campos requeridos: dni, nombres, apellidos, ubicacion" 
        });
    }

    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(
            `INSERT INTO destinatario (dni, nombres, apellidos, ubicacion, id_tenant) 
             VALUES (?, ?, ?, ?, ?)`,
            [dni, nombres.trim(), apellidos.trim(), ubicacion, id_tenant]
        );
        
        // Limpiar caché
        queryCache.delete(`destinatarios_${id_tenant}`);
        
        res.json({ 
            code: 1, 
            message: "Destinatario natural añadido exitosamente",
            id_destinatario: result.insertId 
        });
    } catch (error) {
        console.error('Error en addDestinatarioNatural:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ 
                code: 0, 
                message: "El destinatario ya existe" 
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

// INSERTAR DESTINATARIO JURÍDICO - OPTIMIZADO
const addDestinatarioJuridico = async (req, res) => {
    const { ruc, razon_social, ubicacion } = req.body;
    const id_tenant = req.id_tenant;

    if (!ruc || !razon_social || !ubicacion) {
        return res.status(400).json({ 
            code: 0, 
            message: "Campos requeridos: ruc, razon_social, ubicacion" 
        });
    }

    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(
            `INSERT INTO destinatario (ruc, razon_social, ubicacion, id_tenant) 
             VALUES (?, ?, ?, ?)`,
            [ruc, razon_social.trim(), ubicacion, id_tenant]
        );
        
        // Limpiar caché
        queryCache.delete(`destinatarios_${id_tenant}`);
        
        res.json({ 
            code: 1, 
            message: "Destinatario jurídico añadido exitosamente",
            id_destinatario: result.insertId 
        });
    } catch (error) {
        console.error('Error en addDestinatarioJuridico:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ 
                code: 0, 
                message: "El destinatario ya existe" 
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

//ANULAR GUIA - OPTIMIZADO
const anularGuia = async (req, res) => {
    const { guiaId, usuario } = req.body;
    const id_tenant = req.id_tenant;

    if (!guiaId) {
        return res.status(400).json({ 
            code: 0,
            message: "El ID de la guía es necesario." 
        });
    }

    let connection;
    try {
        connection = await getConnection();

        // Verificar y anular en una sola query con UPDATE condicional
        const [updateResult] = await connection.query(
            `UPDATE guia_remision 
             SET estado_guia = 0, 
                 u_modifica = ?,
                 f_anulacion = CURRENT_DATE()
             WHERE id_guiaremision = ? 
               AND estado_guia = 1 
               AND id_tenant = ?`,
            [usuario, guiaId, id_tenant]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ 
                code: 0,
                message: "Guía de remisión no encontrada o ya anulada." 
            });
        }

        // Limpiar caché
        queryCache.clear();

        res.json({ 
            code: 1, 
            message: 'Guía de remisión anulada correctamente' 
        });
    } catch (error) {
        console.error('Error en anularGuia:', error);
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

// INSERTAR GUÍA DE REMISIÓN Y DETALLES - OPTIMIZADO CON BATCH INSERT
const insertGuiaRemisionAndDetalle = async (req, res) => {
    console.log('Datos recibidos en insertGuiaRemisionAndDetalle:', req.body);
    
    const {
        id_sucursal, id_ubigeo_o, id_ubigeo_d, id_destinatario, id_transportista, 
        glosa, dir_partida, dir_destino, canti, peso, observacion, 
        f_generacion, h_generacion, total, producto, num_comprobante, cantidad
    } = req.body;
    const id_tenant = req.id_tenant;

    // Validación mejorada con detalle de campos faltantes
    const camposRequeridos = {
        id_sucursal, 
        id_ubigeo_o, 
        id_ubigeo_d, 
        id_destinatario, 
        id_transportista, 
        glosa, 
        f_generacion, 
        h_generacion, 
        producto, 
        num_comprobante, 
        cantidad
    };
    
    const camposFaltantes = [];
    for (const [campo, valor] of Object.entries(camposRequeridos)) {
        if (!valor || (Array.isArray(valor) && valor.length === 0)) {
            camposFaltantes.push(campo);
        }
    }
    
    if (camposFaltantes.length > 0) {
        console.error('Campos requeridos faltantes:', camposFaltantes);
        return res.status(400).json({ 
            code: 0,
            message: `Faltan campos requeridos: ${camposFaltantes.join(', ')}`
        });
    }

    // Validar que producto y cantidad tengan la misma longitud
    if (!Array.isArray(producto) || !Array.isArray(cantidad) || producto.length !== cantidad.length) {
        return res.status(400).json({ 
            code: 0,
            message: "Los productos y cantidades deben ser arrays del mismo tamaño" 
        });
    }

    let connection;
    try {
        connection = await getConnection();
        await connection.beginTransaction();

        // Insertar el comprobante
        const [comprobanteResult] = await connection.query(
            "INSERT INTO comprobante (id_tipocomprobante, num_comprobante, id_tenant) VALUES (?, ?, ?)",
            [5, num_comprobante, id_tenant]
        );

        const id_comprobante = comprobanteResult.insertId;

        // Insertar la guía de remisión
        const [guiaRemisionResult] = await connection.query(
            `INSERT INTO guia_remision 
            (id_sucursal, id_ubigeo_o, id_ubigeo_d, id_destinatario, 
             id_transportista, id_comprobante, glosa, dir_partida, 
             dir_destino, cantidad, peso, observacion, 
             f_generacion, h_generacion, estado_guia, total, id_tenant) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
            [
                id_sucursal, id_ubigeo_o, id_ubigeo_d, id_destinatario,
                id_transportista, id_comprobante, glosa, dir_partida || null,
                dir_destino || null, canti || null, peso || null, observacion || null,
                f_generacion, h_generacion, total || null, id_tenant
            ]
        );

        const id_guiaremision = guiaRemisionResult.insertId;

        // Preparar datos para inserción batch de detalles
        if (producto.length > 0) {
            const detalleValues = [];
            const detalleParams = [];
            
            for (let i = 0; i < producto.length; i++) {
                detalleValues.push('(?, ?, ?, ?, ?)');
                detalleParams.push(
                    id_guiaremision, 
                    producto[i], 
                    cantidad[i], 
                    'KGM', 
                    id_tenant
                );
            }

            // Inserción batch de todos los detalles en una sola query
            const batchQuery = `
                INSERT INTO detalle_envio 
                (id_guiaremision, id_producto, cantidad, undm, id_tenant) 
                VALUES ${detalleValues.join(', ')}`;
            
            const [detalleResult] = await connection.query(batchQuery, detalleParams);
            
            if (detalleResult.affectedRows !== producto.length) {
                throw new Error('Error al insertar todos los detalles del envío');
            }
        }

        await connection.commit();
        
        // Limpiar caché relacionado
        queryCache.clear();
        
        res.json({ 
            code: 1, 
            message: 'Guía de remisión y detalles insertados correctamente',
            id_guiaremision 
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error en insertGuiaRemisionAndDetalle:', error);
        res.status(500).json({ 
            code: 0, 
            message: "Error al insertar guía de remisión" 
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

export const methods = {
    getGuias,
    getSucursal,
    getUbigeoGuia,
    generarCodigoGuia,
    getDestinatariosGuia,
    getTransportePublicoGuia,
    getTransportePrivadoGuia,
    generarCodigoTrans,
    addTransportistaPublico,
    addTransportistaPrivado,
    getVehiculos,
    addVehiculo,
    getProductos,
    addDestinatarioNatural,
    addDestinatarioJuridico,
    anularGuia,
    insertGuiaRemisionAndDetalle,
};