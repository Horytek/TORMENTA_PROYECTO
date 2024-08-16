import { getConnection } from "./../database/database";

//MOSTRAR TODAS LAS GUIAS DE REMISION
const getGuias = async (req, res) => {
    const {
        page = 0,
        limit = 10,
        num_guia = '',
        documento = '',
        nombre_sucursal = '',
        fecha_i = '2022-01-01',
        fecha_e = '2027-12-27'
    } = req.query;
    const offset = page * limit;

    try {
        const connection = await getConnection();

        // Obtener el número total de guías
        const [totalResult] = await connection.query("SELECT COUNT(*) as total FROM guia_remision");
        const totalGuias = totalResult[0].total;

        // Obtener las guías de remisión con paginación
        const [guiasResult] = await connection.query(
            `
            SELECT
                gr.id_guiaremision AS id,
                DATE_FORMAT(gr.f_generacion, '%Y-%m-%d') AS fecha,
                c.num_comprobante AS num_guia,
                CASE 
                    WHEN d.dni IS NOT NULL THEN CONCAT(d.nombres, ' ', d.apellidos)
                    ELSE d.razon_social
                END AS cliente,
                COALESCE(d.dni, d.ruc) AS documento,
                CONCAT(v.nombres, ' ', v.apellidos) AS vendedor,
                v.dni as dni,
                SUBSTRING(c.num_comprobante, 2, 3) AS serieNum, 
                SUBSTRING(c.num_comprobante, 6, 8) AS num,
                gr.total as total,
                gr.glosa AS concepto,
                gr.estado_guia AS estado,
                s.nombre_sucursal,
                gr.dir_partida AS dir_partida,
                gr.dir_destino AS dir_destino,
                gr.observacion AS observacion,
                CONCAT(t.nombres, ' ', t.apellidos) AS transportistapriv,
                CONCAT(t.razon_social) AS transportistapub,
                t.dni AS docpriv,
                t.ruc AS docpub,
                gr.cantidad as canti,
                gr.peso as peso
            FROM guia_remision gr
            INNER JOIN destinatario d ON gr.id_destinatario = d.id_destinatario
            INNER JOIN sucursal s ON gr.id_sucursal = s.id_sucursal
            INNER JOIN vendedor v ON s.dni = v.dni
            INNER JOIN comprobante c ON gr.id_comprobante = c.id_comprobante
            INNER JOIN transportista t ON gr.id_transportista = t.id_transportista
            WHERE
                c.num_comprobante LIKE ?
                AND (d.dni LIKE ? OR d.ruc LIKE ?)
                AND DATE_FORMAT(gr.f_generacion, '%Y-%m-%d') >= ? 
                AND DATE_FORMAT(gr.f_generacion, '%Y-%m-%d') <= ?
                AND s.nombre_sucursal LIKE ?
            ORDER BY c.num_comprobante DESC
            LIMIT ? OFFSET ?;
            `,
            [`${num_guia}%`, `${documento}%`, `${documento}%`, fecha_i, fecha_e, `${nombre_sucursal}%`, parseInt(limit), parseInt(offset)]
        );

        const guias = await Promise.all(
            guiasResult.map(async (guia) => {
                const [detallesResult] = await connection.query(
                    `
                    SELECT DISTINCT
                        de.id_producto AS codigo, 
                        m.nom_marca AS marca, 
                        p.descripcion AS descripcion, 
                        de.cantidad AS cantidad, 
                        p.undm AS um, 
                        p.precio AS precio
                    FROM detalle_envio de
                    INNER JOIN producto p ON de.id_producto = p.id_producto
                    INNER JOIN marca m ON p.id_marca = m.id_marca
                    
                    
                    WHERE de.id_guiaremision = ? ;
                    `,
                    [guia.id]
                );

                return {
                    ...guia,
                    detalles: detallesResult,
                };
            })
        );

        res.json({ code: 1, data: guias, totalGuias });

    } catch (error) {
        console.error("Error obteniendo las guías de remisión:", error.message);
        res.status(500).send(error.message);
    }
};

//SUCURSALES
const getSucursal = async (req, res) => {
    try {
        const connection = await getConnection();
        const [result] = await connection.query(`SELECT id_sucursal AS id, nombre_sucursal AS nombre, ubicacion AS direccion FROM sucursal;`);
        res.json({ code: 1, data: result, message: "Sucursal listados" });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

//UBIGEO
const getUbigeoGuia = async (req, res) => {
    try {
        const connection = await getConnection();
        const [result] = await connection.query(`SELECT id_ubigeo as idubi, codigo_ubigeo as codubi, departamento AS departamento, provincia AS provincia, distrito AS distrito FROM ubigeo`);
        res.json({ code: 1, data: result, message: "Ubigeo listados" });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};


//CODIGO PARA NUEVA GUIA
const generarCodigoGuia = async (req, res) => {
    try {
        const connection = await getConnection();
        const [result] = await connection.query(`
           SELECT CONCAT('T400-', LPAD(SUBSTRING(MAX(num_comprobante), 6) + 1, 8, '0')) AS nuevo_numero_de_guia
            FROM comprobante
            WHERE id_tipocomprobante = 5;
        `);
        res.json({ code: 1, data: result, message: "Nuevo numero de guía de remisión" });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};


//DESTINATARIOS
const getDestinatariosGuia = async (req, res) => {
    try {
        const connection = await getConnection();
        const [result] = await connection.query(`
                            SELECT 
    id_destinatario AS id,
    COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) AS destinatario,
    COALESCE(NULLIF(dni, ''), ruc) AS documento, ubicacion AS ubicacion
FROM 
    destinatario
WHERE 
    (nombres IS NOT NULL AND nombres <> '' AND apellidos IS NOT NULL AND apellidos <> '')
    OR
    (razon_social IS NOT NULL AND razon_social <> '')
ORDER BY 
    (CASE 
        WHEN COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) = 'Clientes Varios' THEN 0 
        ELSE 1 
     END),
    destinatario;
            `);
        res.json({ code: 1, data: result, message: "Productos listados" });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

//OBTENER TRANSPORTE PÚBLICO
const getTransportePublicoGuia = async (req, res) => {
    try {
        const connection = await getConnection();
        const sql = `SELECT t.id_transportista AS id, v.placa AS placa, t.ruc AS ruc, t.razon_social AS razonsocial, t.telefono AS telefonopub, v.tipo AS vehiculopub
                    FROM transportista t
                    LEFT JOIN vehiculo v 
                    ON t.placa = v.placa 
                    WHERE t.ruc IS NOT NULL;`;
        const [result] = await connection.query(sql, []);
        res.json({ code: 1, data: result, message: "Transportes Públicos listados" });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

//OBTENER TRANSPORTE PRIVADO
const getTransportePrivadoGuia = async (req, res) => {
    try {
        const connection = await getConnection();
        const sql = `SELECT t.id_transportista AS id, v.placa AS placa, t.dni AS dni, CONCAT(t.nombres, ' ', t.apellidos) AS transportista, t.telefono AS telefonopriv, v.tipo AS vehiculopriv
                    FROM transportista t
                    LEFT JOIN vehiculo v 
                    ON t.placa = v.placa
                    WHERE t.dni IS NOT NULL;`;
        const [result] = await connection.query(sql, []);
        res.json({ code: 1, data: result, message: "Transportes Privados listados" });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};


//CODIGO PARA NUEVO TRANSPORISTA
const generarCodigoTrans = async (req, res) => {
    try {
        const connection = await getConnection();
        const [result] = await connection.query(`
           SELECT CONCAT('T', LPAD(SUBSTRING(MAX(id_transportista), 6) + 1, 7, '0')) AS nuevo_codigo_trans
            FROM transportista;
        `);
        res.json({ code: 1, data: result, message: "Nuevo código de transportista" });
    } catch (error) {
        res.status(500).send(error.message);
    }
};


//INSERTAR NUEVO TRANSPORTE PÚBLICO
const addTransportistaPublico = async (req, res) => {
    const { id, placa, ruc, razon_social, ubicacion, telefono } = req.body;

    console.log("Datos recibidos:", req.body);
    console.log("Datos recibidos:", {
        id, placa, ruc, razon_social, ubicacion, telefono,
    });
    if (!id || !ruc || !razon_social || !ubicacion) {
        return res.status(400).json({ code: 0, message: "Todos los campos son requeridos" });
    }
    try {
        const connection = await getConnection();
        const result = await connection.query(
            `INSERT INTO transportista (id_transportista, placa, ruc, razon_social, direccion, telefono) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id, placa || null, ruc, razon_social, ubicacion, telefono] // Maneja la placa como nula si no se proporciona
        );
        res.json({ code: 1, data: result, message: "Transportista añadido exitosamente" });
    } catch (error) {
        console.error("Error en el backend:", error.message);
        res.status(500).send({ code: 0, message: error.message });
    }
};

//INSERTAR NUEVO TRANSPORTE PRIVADO
const addTransportistaPrivado = async (req, res) => {
    const { id, placa, dni, nombres, apellidos, ubicacion, telefono } = req.body;
    console.log("Datos recibidos:", req.body);
    console.log("Datos recibidos:", {
        id, placa, dni, nombres, apellidos, ubicacion, telefono,
    });

    if (!id || !dni || !nombres || !apellidos || !ubicacion) {
        return res.status(400).json({ code: 0, message: "Todos los campos son requeridos" });
    }
    try {
        const connection = await getConnection();
        const result = await connection.query(
            `INSERT INTO transportista (id_transportista, placa, dni, nombres, apellidos, direccion, telefono) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, placa || null, dni, nombres, apellidos, ubicacion, telefono] // Maneja la placa como nula si no se proporciona
        );
        res.json({ code: 1, data: result, message: "Transportista añadido exitosamente" });
    } catch (error) {
        console.error("Error en el backend:", error.message);
        res.status(500).send({ code: 0, message: error.message });
    }
};


//LÓGICA VEHÍCULO

//OBTENER VEHÍCULOS
const getVehiculos = async (req, res) => {
    try {
        const connection = await getConnection();
        const [result] = await connection.query(`
           SELECT placa as placa, tipo as tipo FROM vehiculo;
        `);
        res.json({ code: 1, data: result, message: "Vehículos listados" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
        }
    }
};

//INSERTAR NUEVO VEHÍCULO
const addVehiculo = async (req, res) => {
    const { placa, tipo } = req.body;

    if (!placa || !tipo) {
        return res.status(400).json({ code: 0, message: "Todos los campos son requeridos" });
    }
    try {
        const connection = await getConnection();
        const result = await connection.query(
            `INSERT INTO vehiculo (placa, tipo) VALUES (?, ?)`,
            [placa, tipo]
        );
        res.json({ code: 1, data: result, message: "Vehículo añadido exitosamente" });
    } catch (error) {
        res.status(500).send({ code: 0, message: error.message });
    }
};

//OBTENER PRODUCTOS
const getProductos = async (req, res) => {
    const { descripcion = '', codbarras = '' } = req.query;

    console.log('Filtros recibidos:', { descripcion, codbarras });

    try {
        const connection = await getConnection();

        const [productosResult] = await connection.query(
            `
            SELECT 
                p.id_producto AS codigo, 
                p.descripcion AS descripcion, 
                m.nom_marca AS marca,
                p.cod_barras AS codbarras
            FROM 
                producto p 
            INNER JOIN 
                marca m ON p.id_marca = m.id_marca
            WHERE 
                p.descripcion LIKE ? AND
                p.cod_barras LIKE ?
            `,
            [`%${descripcion}%`, `%${codbarras}%`]
        );

        console.log('Productos encontrados:', productosResult);

        res.json({ code: 1, data: productosResult });
    } catch (error) {
        res.status(500).send(error.message);
    }
};


// INSERTAR DESTINATARIO NATURAL
const addDestinatarioNatural = async (req, res) => {
    const { dni, nombres, apellidos, ubicacion } = req.body;

    if (!dni || !nombres || !apellidos || !ubicacion) {
        return res.status(400).json({ code: 0, message: "Todos los campos son requeridos" });
    }

    try {
        const connection = await getConnection();
        const result = await connection.query(
            `INSERT INTO destinatario (dni, nombres, apellidos, ubicacion) 
             VALUES (?, ?, ?, ?)`,
            [dni, nombres, apellidos, ubicacion]
        );
        res.json({ code: 1, data: result, message: "Destinatario natural añadido exitosamente" });
    } catch (error) {
        res.status(500).send({ code: 0, message: error.message });
    }
};


// INSERTAR DESTINATARIO JURÍDICO
const addDestinatarioJuridico = async (req, res) => {
    const { ruc, razon_social, ubicacion } = req.body;

    if (!ruc || !razon_social || !ubicacion) {
        return res.status(400).json({ code: 0, message: "Todos los campos son requeridos" });
    }

    try {
        const connection = await getConnection();
        const result = await connection.query(
            `INSERT INTO destinatario (ruc, razon_social, ubicacion) 
             VALUES (?, ?, ?)`,
            [ruc, razon_social, ubicacion]
        );
        res.json({ code: 1, data: result, message: "Destinatario jurídico añadido exitosamente" });
    } catch (error) {
        res.status(500).send({ code: 0, message: error.message });
    }
};

//ANULAR GUIA
const anularGuia = async (req, res) => {
    const { guiaId } = req.body; // El número de la guía o ID de la guía
  
    if (!guiaId) {
      return res.status(400).json({ message: "El ID de la guía es necesario." });
    }
  
    let connection;
    try {
      connection = await getConnection();
  
      await connection.beginTransaction();
  
      // Verificar si la guía ya está anulada o no existe
      const [guiaResult] = await connection.query(
        "SELECT id_guiaremision FROM guia_remision WHERE id_guiaremision = ? AND estado_guia = 1",
        [guiaId]
      );
  
      if (guiaResult.length === 0) {
        return res.status(404).json({ message: "Guía de remisión no encontrada o ya anulada." });
      }
  
      // Anular la guía de remisión (estado_guia = 0)
      await connection.query(
        "UPDATE guia_remision SET estado_guia = 0 WHERE id_guiaremision = ?",
        [guiaId]
      );
  
      await connection.commit();
  
      res.json({ code: 1, message: 'Guía de remisión anulada correctamente' });
    } catch (error) {
      console.error("Error en el backend:", error.message);
      if (connection) {
        await connection.rollback();
      }
      res.status(500).send({ code: 0, message: error.message });
    }
  };
 
  const insertGuiaRemisionAndDetalle = async (req, res) => {
    const {
        id_sucursal, id_ubigeo_o, id_ubigeo_d, id_destinatario, id_transportista, glosa, dir_partida, dir_destino, canti, peso, observacion, f_generacion, h_generacion, total, producto, num_comprobante, cantidad,
    } = req.body;

    console.log("Datos recibidos:", req.body);
    console.log("Datos recibidos:", {
        id_sucursal, id_ubigeo_o, id_ubigeo_d, id_destinatario, id_transportista, glosa, dir_partida, dir_destino, canti, peso, observacion, f_generacion, h_generacion, producto, num_comprobante, cantidad, 
    });

    if (
        !id_sucursal || !id_ubigeo_o || !id_destinatario || !id_transportista || !glosa || !f_generacion ||!h_generacion || !id_ubigeo_d || !producto || !num_comprobante || !cantidad
    ) {
        console.log("Error en los datos:", {
            id_sucursal, id_ubigeo_o, id_destinatario, id_transportista, glosa, f_generacion, h_generacion, id_ubigeo_d, producto, num_comprobante, cantidad, canti, peso
        });
        return res
            .status(400)
            .json({ message: "Bad Request. Please fill all fields correctly." });
    }

    let connection;
    try {
        connection = await getConnection();
        await connection.beginTransaction();

        // Insertar el comprobante
        const [comprobanteResult] = await connection.query(
            "INSERT INTO comprobante (id_tipocomprobante, num_comprobante) VALUES (?, ?)",
            [5, num_comprobante]
        );

        const id_comprobante = comprobanteResult.insertId;

        // Insertar la guía de remisión con la hora actual
        const [guiaRemisionResult] = await connection.query(
            `INSERT INTO guia_remision 
            (id_sucursal, 
            id_ubigeo_o, 
            id_ubigeo_d, 
            id_destinatario, 
            id_transportista, 
            id_comprobante, 
            glosa, 
            dir_partida, 
            dir_destino,
            cantidad,
            peso, 
            observacion, 
            f_generacion, 
            h_generacion, 
            estado_guia, 
            total) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
            [id_sucursal,
                id_ubigeo_o,
                id_ubigeo_d,
                id_destinatario,
                id_transportista,
                id_comprobante,
                glosa,
                dir_partida || null,
                dir_destino || null,
                canti || null, 
                peso || null,
                observacion || null,
                f_generacion,
                h_generacion,
                total || null]
        );

        const id_guiaremision = guiaRemisionResult.insertId;

        // Insertar los detalles del envío
        for (let i = 0; i < producto.length; i++) {
            const id_producto = producto[i];
            const cantidadProducto = cantidad[i];

            console.log(`Intentando insertar detalle con id_producto: ${id_producto}, cantidad: ${cantidadProducto}`);

            const [detalleEnvioResult] = await connection.query(
                "INSERT INTO detalle_envio (id_guiaremision, id_producto, cantidad, undm) VALUES (?, ?, ?, 'KGM')",
                [id_guiaremision, id_producto, cantidadProducto]
            );
            console.log("Resultado de la inserción:", detalleEnvioResult);

            if (detalleEnvioResult.affectedRows === 0) {
                throw new Error(`Error al insertar el detalle del envío con producto: ${id_producto}, guia: ${id_guiaremision}, cantidad: ${cantidadProducto}`);
            }
        }

        await connection.commit();
        res.json({ code: 1, message: 'Guía de remisión y detalles insertados correctamente' });
    } catch (error) {
        console.error("Error en el backend:", error.message);
        if (connection) {
            await connection.rollback();
        }
        res.status(500).send({ code: 0, message: error.message });
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