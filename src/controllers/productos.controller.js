import { getConnection } from "./../database/database";

const getProductos = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(`
            SELECT PR.id_producto, PR.descripcion, 
            CA.nom_subcat, MA.nom_marca, PR.undm, 
            CAST(PR.precio AS DECIMAL(10, 2)) AS precio, PR.cod_barras, 
            PR.estado_producto as estado, PR.id_marca, PR.id_subcategoria, 
            cat.id_categoria
            FROM producto PR
            INNER JOIN marca MA ON MA.id_marca = PR.id_marca
            INNER JOIN sub_categoria CA ON CA.id_subcategoria = PR.id_subcategoria
            INNER JOIN categoria cat ON cat.id_categoria = CA.id_categoria
            WHERE PR.id_tenant = ?
            ORDER BY PR.id_producto DESC
        `, [req.id_tenant]);

        if (result.length === 0) {
            return res.status(404).json({ code: 0, message: "No se encontraron productos" });
        }

        res.json({ code: 1, data: result, message: "Productos listados" });
    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getUltimoIdProducto = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(`
                SELECT MAX(id_producto+1) AS ultimo_id FROM producto WHERE id_tenant = ?;
            `, [req.id_tenant]);
        res.json({code:1, data: result});
    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getProducto = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [result] = await connection.query(`
                SELECT id_producto, id_marca, SC.id_categoria, PR.id_subcategoria, descripcion, precio, cod_barras, undm, estado_producto
                FROM producto PR
                INNER JOIN sub_categoria SC ON PR.id_subcategoria = SC.id_subcategoria
                WHERE PR.id_producto = ? AND PR.id_tenant = ?`, [id, req.id_tenant]);
        
        if (result.length === 0) {
            return res.status(404).json({data: result, message: "Producto no encontrado"});
        }

        res.json({code: 1 ,data: result, message: "Producto encontrado"});
    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const addProducto = async (req, res) => {
    let connection;
    try {
        const { id_marca, id_subcategoria, descripcion, undm, precio, cod_barras, estado_producto } = req.body;

        if (id_marca === undefined || id_subcategoria === undefined || descripcion === undefined || undm === undefined || id_subcategoria === undefined || estado_producto === undefined || precio === undefined) {
            res.status(400).json({ message: "Bad Request. Please fill all field." });
        }

        const producto = { id_marca, id_subcategoria, descripcion, undm, precio, cod_barras, estado_producto, id_tenant: req.id_tenant };
        connection = await getConnection();
        const [result] = await connection.query("INSERT INTO producto SET ? ", producto);

        res.json({code: 1, id_producto: result.insertId, message: "Producto añadido" });
    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const updateProducto = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { id_marca, id_subcategoria, descripcion, undm, precio, cod_barras, estado_producto } = req.body;

        if (id_marca === undefined || id_subcategoria === undefined || descripcion === undefined || undm === undefined || id_subcategoria === undefined || estado_producto === undefined || precio === undefined) {
            res.status(400).json({ message: "Bad Request. Please fill all field." });
        }

        const producto = { id_marca, id_subcategoria, descripcion, undm, precio, cod_barras, estado_producto };
        connection = await getConnection();
        const [result] = await connection.query("UPDATE producto SET ? WHERE id_producto = ? AND id_tenant = ?", [producto, id, req.id_tenant]);

        if (result.affectedRows === 0) {
            return res.status(404).json({code: 0, message: "Producto no encontrado"});
        }

        res.json({code: 1 ,message: "Producto modificado"});
    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    }  finally {
        if (connection) {
            connection.release();
        }
    }
};

const deleteProducto = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        
        // Verificar si el producto existe dentro de una Nota de Ingreso
        const [verify1] = await connection.query("SELECT 1 FROM detalle_venta WHERE id_producto = ?", id);
        const [verify2] = await connection.query("SELECT 1 FROM detalle_envio WHERE id_producto = ?", id);
        const [verify3] = await connection.query("SELECT 1 FROM detalle_nota WHERE id_producto = ?", id);
        const isProductInUse = verify1.length > 0 || verify2.length > 0 || verify3.length > 0;

        if (isProductInUse) {
            const [Updateresult] = await connection.query("UPDATE producto SET estado_producto = 0 WHERE id_producto = ? AND id_tenant = ?", [id, req.id_tenant]);

            if (Updateresult.affectedRows === 0) {
                return res.status(404).json({code: 0, message: "Producto no encontrado"});
            }

            res.json({code: 2 ,message: "Producto dado de baja"});
        } else {
            const [result] = await connection.query("DELETE FROM producto WHERE id_producto = ? AND id_tenant = ?", [id, req.id_tenant]);
                
            if (result.affectedRows === 0) {
                return res.status(404).json({code: 0, message: "Producto no encontrado"});
            }

            res.json({code: 1 ,message: "Producto eliminado"});
        }
        
    } catch (error) {
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    }   finally {
        if (connection) {
            connection.release();
        }
    }
};

export const methods = {
    getProductos,
    getUltimoIdProducto,
    getProducto,
    addProducto,
    updateProducto,
    deleteProducto
};