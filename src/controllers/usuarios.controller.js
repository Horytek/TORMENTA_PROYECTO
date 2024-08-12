import { getConnection } from "./../database/database";

const getUsuarios = async (req, res) => {
    try {
        const connection = await getConnection();
        const [result] = await connection.query(`SELECT id_usuario, U.id_rol, nom_rol, usua, contra, estado_usuario FROM usuario U
            INNER JOIN rol R ON U.id_rol = R.id_rol ORDER BY id_usuario desc`);
        res.json({ code: 1, data: result });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

const getUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const [result] = await connection.query(`SELECT id_usuario, U.id_rol, nom_rol, usua, contra, estado_usuario FROM usuario U
            INNER JOIN rol R ON U.id_rol = R.id_rol WHERE U.id_usuario = ?`, id);
        
            if (result.length === 0) {
            return res.status(404).json({data: result, message: "Usuario no encontrado"});
        }
    
        res.json({code: 1 ,data: result, message: "Usuario encontrado"});
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

const addUsuario = async (req, res) => {
    try {
        const { id_rol, usua, contra, estado_usuario } = req.body;

        if (id_rol === undefined || usua === undefined || contra === undefined) {
            res.status(400).json({ message: "Bad Request. Please fill all field." });
        }

        const usuario = { id_rol, usua: usua.trim(), contra: contra.trim(), estado_usuario };
        const connection = await getConnection();
        await connection.query("INSERT INTO usuario SET ? ", usuario);

        res.json({code: 1, message: "Usuario añadido" });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
}

const updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_rol, usua, contra, estado_usuario } = req.body;

        if (id_rol === undefined || usua === undefined || contra === undefined || estado_usuario === undefined) {
            res.status(400).json({ message: "Bad Request. Please fill all field." });
        }

        const usuario = { id_rol, usua: usua.trim(), contra: contra.trim(), estado_usuario };
        const connection = await getConnection();
        const [result] = await connection.query("UPDATE usuario SET ? WHERE id_usuario = ?", [usuario, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({code: 0, message: "Usuario no encontrado"});
        }

        res.json({code: 1 ,message: "Usuario modificado"});
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
}

const deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        
        // Verificar si el usuario está en uso dentro de la base de datos
        const [verify] = await connection.query("SELECT 1 FROM vendedor WHERE id_usuario = ?", id);
        const isUserInUse = verify.length > 0

        if (isUserInUse) {
            const [Updateresult] = await connection.query("UPDATE usuario SET estado_usuario = 0 WHERE id_usuario = ?", id);

            if (Updateresult.affectedRows === 0) {
                return res.status(404).json({code: 0, message: "Usuario no encontrado"});
            }

            res.json({code: 2 ,message: "Usuario dado de baja"});
        } else {
            const [result] = await connection.query("DELETE FROM usuario WHERE id_usuario = ?", id);
                
            if (result.affectedRows === 0) {
                return res.status(404).json({code: 0, message: "Usuario no encontrado"});
            }

            res.json({code: 1 ,message: "Usuario eliminado"});
        }
        
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
}

export const methods = {
    getUsuarios,
    getUsuario,
    addUsuario,
    updateUsuario,
    updateUsuario,
    deleteUsuario
};