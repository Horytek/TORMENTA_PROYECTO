import { getConnection } from "../database/database.js";

const getAttributes = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const id_tenant = req.id_tenant;

        // Fetch standard attributes + custom ones for tenant
        // Assuming 'atributo' has id_tenant or is shared? 
        // Based on Plan, 'atributo' might be shared or tenant-specific. 
        // Let's assume tenant-specific for flexibility, or null for system defaults.

        const [result] = await connection.query(`
            SELECT id_atributo, nombre, tipo_input, slug, id_tenant, es_filtro, es_visible, es_requerido 
            FROM atributo 
            WHERE id_tenant = ? OR id_tenant IS NULL
            ORDER BY id_atributo
        `, [id_tenant]);

        res.json({ code: 1, data: result });
    } catch (error) {
        console.error("Error getAttributes:", error);
        res.status(500).json({ code: 0, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

const createAttribute = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const { nombre, tipo_input, es_filtro, es_visible, es_requerido } = req.body;
        const id_tenant = req.id_tenant;

        const slug = nombre.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        const [existing] = await connection.query("SELECT id_atributo FROM atributo WHERE clean_name(nombre) = clean_name(?) AND id_tenant = ?", [nombre, id_tenant]);
        if (existing.length > 0) {
            return res.json({ code: 0, message: "Ya existe un atributo con ese nombre" });
        }

        const [ins] = await connection.query(`
            INSERT INTO atributo (nombre, tipo_input, slug, id_tenant, es_filtro, es_visible, es_requerido) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [nombre, tipo_input || 'SELECT', slug, id_tenant, es_filtro ? 1 : 0, es_visible ? 1 : 0, es_requerido ? 1 : 0]);

        res.json({ code: 1, message: "Atributo creado", id: ins.insertId });
    } catch (error) {
        console.error("Error createAttribute:", error);
        res.status(500).json({ code: 0, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

const updateAttribute = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const { id } = req.params;
        const { nombre, tipo_input, es_filtro, es_visible, es_requerido } = req.body;
        const id_tenant = req.id_tenant;

        // Verify ownership (or if system attribute, maybe block edit?)
        const [check] = await connection.query("SELECT id_tenant FROM atributo WHERE id_atributo = ?", [id]);
        if (check.length === 0) return res.status(404).json({ message: "Atributo no encontrado" });

        // If system attribute (id_tenant is null), maybe prevent edit? 
        // For now, allow tenant edit if they 'own' it. 
        if (check[0].id_tenant !== id_tenant && check[0].id_tenant !== null) {
            return res.status(403).json({ message: "No autorizado" });
        }

        const slug = nombre ? nombre.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') : null;

        await connection.query(`
            UPDATE atributo SET nombre = ?, slug = ?, tipo_input = ?, es_filtro = ?, es_visible = ?, es_requerido = ? WHERE id_atributo = ? AND id_tenant = ?
        `, [nombre, slug, tipo_input, es_filtro ? 1 : 0, es_visible ? 1 : 0, es_requerido ? 1 : 0, id, id_tenant]);

        res.json({ code: 1, message: "Atributo actualizado" });
    } catch (error) {
        console.error("Error updateAttribute:", error);
        res.status(500).json({ code: 0, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

const getAttributeValues = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const { id } = req.params; // id_atributo
        const id_tenant = req.id_tenant;

        const [result] = await connection.query(`
            SELECT id_valor, valor, metadata 
            FROM atributo_valor 
            WHERE id_atributo = ? AND (id_tenant = ? OR id_tenant IS NULL)
            ORDER BY valor
        `, [id, id_tenant]);

        // Parse metadata if JSON
        const mapped = result.map(r => ({
            ...r,
            metadata: (typeof r.metadata === 'string' && r.metadata) ? JSON.parse(r.metadata) : r.metadata
        }));

        res.json({ code: 1, data: mapped });
    } catch (error) {
        console.error("Error getAttributeValues:", error);
        res.status(500).json({ code: 0, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

const createAttributeValue = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const { id } = req.params; // id_atributo
        const { valor, metadata } = req.body;
        const id_tenant = req.id_tenant;

        // Validar duplicados por nombre
        const [existing] = await connection.query(`
            SELECT id_valor FROM atributo_valor 
            WHERE id_atributo = ? AND clean_name(valor) = clean_name(?) AND id_tenant = ?
        `, [id, valor, id_tenant]);

        if (existing.length > 0) {
            return res.json({ code: 0, message: "Ya existe este valor" });
        }

        const metadataStr = metadata ? JSON.stringify(metadata) : null;

        const [ins] = await connection.query(`
            INSERT INTO atributo_valor (id_atributo, valor, metadata, id_tenant) VALUES (?, ?, ?, ?)
        `, [id, valor, metadataStr, id_tenant]);

        res.json({ code: 1, message: "Valor agregado", id: ins.insertId, data: { id: ins.insertId, valor, metadata } });
    } catch (error) {
        console.error("Error createAttributeValue:", error);
        res.status(500).json({ code: 0, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

const deleteAttributeValue = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const { id, id_valor } = req.params;
        const id_tenant = req.id_tenant;

        // Check ownership
        const [check] = await connection.query("SELECT id_tenant FROM atributo_valor WHERE id_valor = ?", [id_valor]);
        if (check.length > 0 && check[0].id_tenant !== id_tenant) {
            return res.status(403).json({ message: "No autorizado (Valor de sistema?)" });
        }

        await connection.query("DELETE FROM atributo_valor WHERE id_valor = ? AND id_tenant = ?", [id_valor, id_tenant]);
        res.json({ code: 1, message: "Valor eliminado" });
    } catch (error) {
        console.error("Error deleteAttributeValue:", error);
        res.status(500).json({ code: 0, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

const updateAttributeValue = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const { id_valor } = req.params;
        const { valor, metadata } = req.body;
        const id_tenant = req.id_tenant;

        // Check ownership
        const [check] = await connection.query("SELECT id_tenant, id_atributo FROM atributo_valor WHERE id_valor = ?", [id_valor]);
        if (check.length === 0) return res.status(404).json({ message: "Valor no encontrado" });
        if (check[0].id_tenant !== id_tenant && check[0].id_tenant !== null) {
            return res.status(403).json({ message: "No autorizado" });
        }

        const id_atributo = check[0].id_atributo;

        // Validar duplicados (excluyendo el actual)
        const [existing] = await connection.query(`
            SELECT id_valor FROM atributo_valor 
            WHERE id_atributo = ? AND clean_name(valor) = clean_name(?) AND id_tenant = ? AND id_valor != ?
        `, [id_atributo, valor, id_tenant, id_valor]);

        if (existing.length > 0) {
            return res.json({ code: 0, message: "Ya existe este valor" });
        }

        const metadataStr = metadata ? JSON.stringify(metadata) : null;

        await connection.query("UPDATE atributo_valor SET valor = ?, metadata = ? WHERE id_valor = ? AND id_tenant = ?", [valor, metadataStr, id_valor, id_tenant]);
        res.json({ code: 1, message: "Valor actualizado" });

    } catch (error) {
        console.error("Error updateAttributeValue:", error);
        res.status(500).json({ code: 0, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

const getCategoryAttributes = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const { id_categoria } = req.params;
        const id_tenant = req.id_tenant;

        const [result] = await connection.query(`
            SELECT A.id_atributo, A.nombre, A.tipo_input 
            FROM categoria_atributo CA
            JOIN atributo A ON A.id_atributo = CA.id_atributo
            WHERE CA.id_categoria = ? AND CA.id_tenant = ?
        `, [id_categoria, id_tenant]);

        res.json({ code: 1, data: result });
    } catch (error) {
        console.error("Error getCategoryAttributes:", error);
        res.status(500).json({ code: 0, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

const linkCategoryAttributes = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const { id_categoria, attribute_ids } = req.body; // array of IDs
        const id_tenant = req.id_tenant;

        await connection.beginTransaction();

        // Wipe existing links for this tenant/category
        await connection.query("DELETE FROM categoria_atributo WHERE id_categoria = ? AND id_tenant = ?", [id_categoria, id_tenant]);

        // Insert new
        if (attribute_ids && attribute_ids.length > 0) {
            const values = attribute_ids.map(aid => [id_categoria, aid, id_tenant]);
            await connection.query("INSERT INTO categoria_atributo (id_categoria, id_atributo, id_tenant) VALUES ?", [values]);
        }

        await connection.commit();
        res.json({ code: 1, message: "Plantilla actualizada" });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error linkCategoryAttributes:", error);
        res.status(500).json({ code: 0, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = {
    getAttributes,
    createAttribute,
    updateAttribute,
    getAttributeValues,
    createAttributeValue,
    deleteAttributeValue,
    getCategoryAttributes,
    linkCategoryAttributes,
    updateAttributeValue
};

