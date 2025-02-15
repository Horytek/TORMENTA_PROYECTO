import { getConnection } from "./../database/database";

const getClientes = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const docType = req.query.docType;

        let filterCondition = "";
        const filterValues = [];
        if(docType === "dni") {
            filterCondition = "WHERE dni IS NOT NULL";
        } else if(docType === "ruc") {
            filterCondition = "WHERE ruc IS NOT NULL";
        }
        
        const [countResult] = await connection.query(
            `SELECT COUNT(*) as total FROM cliente ${filterCondition}`, 
            filterValues
        );
        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit);
        
        const [result] = await connection.query(`
            SELECT 
                id_cliente, 
                CONCAT_WS(' ', dni, NULLIF(ruc, '')) AS dniRuc, 
                nombres, 
                apellidos, 
                COALESCE(razon_social, '') AS razon_social, 
                direccion, 
                estado_cliente AS estado
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
            res.status(500).send(error.message);
        }
    } finally {
        if (connection) {
            connection.release(); 
        }
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
            WHERE (dni = ? OR ruc = ?)
        `;
        const [existing] = await connection.query(duplicateQuery, [documentNumber, documentNumber]);
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
                estado_cliente
            ) VALUES (?, ?, ?, ?, ?, ?, 1)
        `;

        const values = [
            clientType === "personal" ? documentNumber : null,
            clientType === "business" ? documentNumber : null,
            clientName || null,
            clientLastName || null,
            businessName || null,
            address || null,
        ];

        const [result] = await connection.query(query, values);

        res.json({
            code: 1,
            data: { id: result.insertId },
            message: "Cliente creado exitosamente"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            code: 0,
            message: "Error al crear el cliente",
            error: error.message
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
                estado_cliente AS estado
             FROM cliente
             WHERE id_cliente = ?`,
            [id]
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
        console.error(error);
        res.status(500).json({
            code: 0,
            message: "Error al obtener el cliente",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

const updateCliente = async (req, res) => {
    let connection;
    try {
        const {
            id, // id del cliente a actualizar
            clientType,
            documentNumber,
            clientName,
            clientLastName,
            businessName,
            address
        } = req.body;

        if (!id) {
            return res.status(400).json({
                code: 0,
                message: "El ID del cliente es obligatorio"
            });
        }

        connection = await getConnection();
        const query = `
            UPDATE cliente SET
                dni = ?,
                ruc = ?,
                nombres = ?,
                apellidos = ?,
                razon_social = ?,
                direccion = ?
            WHERE id_cliente = ?
        `;
        const values = [
            clientType === "personal" ? documentNumber : null,
            clientType === "business" ? documentNumber : null,
            clientName || null,
            clientLastName || null,
            businessName || null,
            address || null,
            id
        ];

        const [result] = await connection.query(query, values);

        res.json({
            code: 1,
            data: { affectedRows: result.affectedRows },
            message: "Cliente actualizado exitosamente"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            code: 0,
            message: "Error al actualizar el cliente",
            error: error.message
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
        const [result] = await connection.query("DELETE FROM cliente WHERE id_cliente = ?", [id]);
                
        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 0, message: "Cliente no encontrado" });
        }

        res.json({ code: 1, message: "Cliente eliminado" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
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
        const [result] = await connection.query("UPDATE cliente SET estado_cliente = 0 WHERE id_cliente = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }

        res.json({ message: "Cliente dado de baja con éxito" });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).send(error.message);
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

