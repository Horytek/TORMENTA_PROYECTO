import { getConnection } from "./../database/database";

const getUsuarios = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(`SELECT id_usuario, U.id_rol, nom_rol, usua, contra, estado_usuario, estado_token, id_empresa, pp.descripcion_plan AS plan_pago_1, U.fecha_pago AS fecha_pago FROM usuario U
            INNER JOIN rol R ON U.id_rol = R.id_rol LEFT JOIN plan_pago pp ON pp.id_plan=U.plan_pago WHERE R.id_rol!=10 ORDER BY id_usuario desc`);
        res.json({ code: 1, data: result });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    } finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
};

const getUsuario = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [result] = await connection.query(`SELECT id_usuario, U.id_rol, nom_rol, usua, contra, estado_usuario, estado_token, id_empresa, pp.descripcion_plan as plan_pago_1, U.fecha_pago AS fecha_pago FROM usuario U
            INNER JOIN rol R ON U.id_rol = R.id_rol LEFT JOIN plan_pago pp ON pp.id_plan=U.plan_pago WHERE U.id_usuario = ?`, id);
        
            if (result.length === 0) {
            return res.status(404).json({data: result, message: "Usuario no encontrado"});
        }
    
        res.json({code: 1 ,data: result, message: "Usuario encontrado"});
    } catch (error) {
        res.status(500);
        res.send(error.message);
    } finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
};

const getUsuario_1 = async (req, res) => {
    let connection;
    try {
      const { id } = req.params;
      //console.log("ID recibido:", id); // Depuración
      connection = await getConnection();
      const [result] = await connection.query(
        `SELECT id_usuario, id_rol, usua, contra, estado_usuario, estado_token, id_empresa
         FROM usuario
         WHERE usua = ?`,
        [id]
      );
      //console.log("Resultado de la consulta:", result); // Depuración
  
      if (result.length === 0) {
        return res.status(404).json({ code: 0, message: "Usuario no encontrado" });
      }
  
      res.json({ code: 1, data: result, message: "Usuario encontrado" });
    } catch (error) {
      console.error("Error en getUsuario_1:", error.message);
      res.status(500).send({ error: error.message });
    } finally {
      if (connection) connection.release();
    }
  };

const addUsuario = async (req, res) => {
    let connection;
    try {
        const { id_rol, usua, contra, estado_usuario, id_empresa } = req.body;

        if (id_rol === undefined || usua === undefined || contra === undefined || id_empresa === undefined) {
            res.status(400).json({ message: "Bad Request. Please fill all field." });
        }

        const usuario = { id_rol, usua: usua.trim(), contra: contra.trim(), estado_usuario, id_empresa };
        connection = await getConnection();
        await connection.query("INSERT INTO usuario SET ? ", usuario);

        res.json({code: 1, message: "Usuario añadido" });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    } finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
}

const updateUsuario = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { id_rol, usua, contra, estado_usuario } = req.body;

        if (id_rol === undefined || usua === undefined || contra === undefined || estado_usuario === undefined) {
            res.status(400).json({ message: "Bad Request. Please fill all field." });
        }

        const usuario = { id_rol, usua: usua.trim(), contra: contra.trim(), estado_usuario };
        connection = await getConnection();
        const [result] = await connection.query("UPDATE usuario SET ? WHERE id_usuario = ?", [usuario, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({code: 0, message: "Usuario no encontrado"});
        }

        res.json({code: 1 ,message: "Usuario modificado"});
    } catch (error) {
        res.status(500);
        res.send(error.message);
    } finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
}

const updateUsuarioPlan = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { id_empresa, plan_pago, estado_usuario, fecha_pago} = req.body;

        if (id_empresa === undefined || plan_pago === undefined || estado_usuario === undefined || fecha_pago === undefined) {
            res.status(400).json({ message: "Bad Request. Please fill all field." });
        }

        const usuario = { id_empresa, plan_pago, estado_usuario, fecha_pago };
        connection = await getConnection();
        const [result] = await connection.query("UPDATE usuario SET ? WHERE id_usuario = ?", [usuario, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({code: 0, message: "Usuario no encontrado"});
        }

        res.json({code: 1 ,message: "Usuario modificado"});
    } catch (error) {
        res.status(500);
        res.send(error.message);
    } finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
}

const deleteUsuario = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        
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
    } finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
}

export const methods = {
    getUsuarios,
    getUsuario,
    addUsuario,
    updateUsuario,
    getUsuario_1,
    deleteUsuario,
    updateUsuarioPlan
};