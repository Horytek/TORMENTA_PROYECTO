import { getConnection } from "./../database/database";

const getFunciones = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(`SELECT id_funciones, funcion, estado_funcion FROM funciones`);
        res.json({ code: 1, data: result });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }   finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
};

const getFuncion= async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [result] = await connection.query(`SELECT id_funciones, funcion, estado_funcion FROM funciones WHERE id_funciones = ?`, id);
        
            if (result.length === 0) {
            return res.status(404).json({data: result, message: "Función no encontrada"});
        }
    
        res.json({code: 1 ,data: result, message: "Función encontrada"});
    } catch (error) {
        res.status(500);
        res.send(error.message);
    } finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
};


const addFuncion = async (req, res) => {
    let connection;
    try {
        const { funcion, estado_funcion } = req.body;

        if (nom_rol === undefined) {
            res.status(400).json({ message: "Bad Request. Please fill all field." });
        }

        const usuario = { funcion: funcion.trim(), estado_funcion };
        connection = await getConnection();
        await connection.query("INSERT INTO funciones SET ? ", usuario);

        res.json({code: 1, message: "Función añadida" });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    } finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
}

const updateFuncion = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { funcion, estado_funcion } = req.body;

        if ( nom_rol === undefined || estado_rol === undefined) {
            res.status(400).json({ message: "Bad Request. Please fill all field." });
        }

        const usuario = { funcion: funcion.trim(), estado_funcion };
        connection = await getConnection();
        const [result] = await connection.query("UPDATE funciones SET ? WHERE id_funciones = ?", [usuario, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({code: 0, message: "Función no encontrada"});
        }

        res.json({code: 1 ,message: "Función modificada"});
    } catch (error) {
        res.status(500);
        res.send(error.message);
    } finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
}


/*const deleteFuncion = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        
        // Verificar si el usuario está en uso dentro de la base de datos
        const [verify] = await connection.query("SELECT 1 FROM usuario WHERE id_rol = ?", id);
        const isUserInUse = verify.length > 0

        if (isUserInUse) {
            const [Updateresult] = await connection.query("UPDATE rol SET estado_rol = 0 WHERE id_rol = ?", id);

            if (Updateresult.affectedRows === 0) {
                return res.status(404).json({code: 0, message: "Rol no encontrado"});
            }

            res.json({code: 2 ,message: "Rol dado de baja"});
        } else {
            const [result] = await connection.query("DELETE FROM rol WHERE id_rol = ?", id);
                
            if (result.affectedRows === 0) {
                return res.status(404).json({code: 0, message: "Rol no encontrado"});
            }

            res.json({code: 1 ,message: "Rol eliminado"});
        }
        
    } catch (error) {
        res.status(500);
        res.send(error.message);
    } finally {
        if (connection) {
            connection.release();  // Liberamos la conexión si se utilizó un pool de conexiones
        }
    }
}*/

export const methods = {
    getFunciones,
    getFuncion,
    addFuncion,
    updateFuncion,
    //deleteRol,
};