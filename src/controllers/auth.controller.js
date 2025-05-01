import { getConnection } from "./../database/database";
import { createAccessToken } from "../libs/jwt";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";

const login = async (req, res) => {
    let connection;
    try {
        const { usuario, password } = req.body;
        
        const user = { usuario: usuario.trim(), password: password.trim() };
        connection = await getConnection();
        const [userFound] = await connection.query("SELECT 1 FROM usuario WHERE usua = ? AND estado_usuario=1", user.usuario);

        if (userFound.length === 0) {
            return res.status(400).json({ success: false, message: 'El usuario ingresado no existe o esta deshabilitado' });
        }

        let userValid;

        if (usuario && usuario === 'desarrollador') {
            const [rows] = await connection.query(
                "SELECT * FROM usuario WHERE usua = ? AND contra = ?", 
                [user.usuario, user.password]
            );
            userValid = rows;
        } else {
            const [rows] = await connection.query(
                `SELECT usu.id_usuario, usu.id_rol, usu.usua, usu.contra, usu.estado_usuario, su.nombre_sucursal
                FROM usuario usu
                INNER JOIN vendedor ven ON ven.id_usuario = usu.id_usuario
                INNER JOIN sucursal su ON su.dni = ven.dni
                WHERE usu.usua = ? AND usu.contra = ? AND usu.estado_usuario = 1`, 
                [user.usuario, user.password]
            );
            userValid = rows;
        }
        

        if (userValid.length > 0) {
            const token = await createAccessToken({ nameUser: user.usuario });
            const userbd = userValid[0];
            
            // Obtener la página por defecto para el rol del usuario
            let defaultRedirect = '/inicio'; // URL por defecto si no hay configuración
            
            // Consultar la página por defecto configurada para el rol
            const [rolData] = await connection.query(
                "SELECT id_modulo, id_submodulo FROM rol WHERE id_rol = ?",
                [userbd.id_rol]
            );
            
            if (rolData.length > 0 && rolData[0].id_modulo) {
                // Obtener la ruta del módulo
                const [moduleData] = await connection.query(
                    "SELECT ruta FROM modulo WHERE id_modulo = ?",
                    [rolData[0].id_modulo]
                );
                
                if (moduleData.length > 0 && moduleData[0].ruta) {
                    defaultRedirect = moduleData[0].ruta;
                    
                    // Si también hay un submódulo, obtener su ruta
                    if (rolData[0].id_submodulo) {
                        const [submoduleData] = await connection.query(
                            "SELECT ruta_submodulo FROM submodulo WHERE id_submodulo = ?",
                            [rolData[0].id_submodulo]
                        );
                        
                        if (submoduleData.length > 0 && submoduleData[0].ruta_submodulo) {
                            defaultRedirect = submoduleData[0].ruta_submodulo;
                        }
                    }
                }
            }
            
            res.json({
                success: true,
                data: {
                    id: userbd.id_usuario,
                    rol: userbd.id_rol,
                    usuario: userbd.usua,
                    sucursal: userbd.nombre_sucursal,
                    defaultPage: defaultRedirect // Añadir la URL de redirección por defecto
                },
                token,
                message: 'Usuario encontrado'
            });
            
            // Realizar el UPDATE para, por ejemplo, registrar el último inicio de sesión
            await connection.query("UPDATE usuario SET estado_token = ? WHERE id_usuario = ?", [1, userbd.id_usuario]);
        } else {
            res.status(400).json({ success: false, message: 'La contraseña ingresada no es correcta' });
        }

    } catch (error) {
        res.status(500);
        res.send(error.message);
    } finally {
        if (connection) {
            connection.release();
        }
    }
};


const verifyToken = async (req, res) => {
    let connection;
    connection = await getConnection();
    const token = req.headers['authorization'];

    if (!token) return res.send(false);

    jwt.verify(token, TOKEN_SECRET, async (error, user) => {
        if (error) return res.sendStatus(401);

        const [userFound] = await connection.query("SELECT * FROM usuario WHERE usua = ? AND estado_usuario = 1", user.nameUser);
        if (userFound.length === 0) return res.sendStatus(401);

        const userbd = userFound[0];

        return res.json({
            id: userbd.id_usuario,
            rol: userbd.id_rol,
            usuario: userbd.usua
        });
    });
};

//Revisa
const logout = async (req, res) => {
    let connection;
    connection = await getConnection();

    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(401);  // Mejor devolver un status 401 si no hay token

    jwt.verify(token, TOKEN_SECRET, async (error, user) => {
        if (error) return res.sendStatus(401);

        const [userFound] = await connection.query("SELECT * FROM usuario WHERE usua = ?", user.nameUser);
        if (userFound.length === 0) return res.sendStatus(401);

        const userbd = userFound[0];
        // Actualizar el estado del token y limpiarlo
        await connection.query("UPDATE usuario SET estado_token = ? WHERE id_usuario = ?", [0, userbd.id_usuario]);

        // Aquí ya se puede eliminar la cookie
        res.cookie("token", "", {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            domain: '.bck-omega.vercel.app', // Mismo dominio utilizado en el login
            expires: new Date(0),
        });

        return res.sendStatus(200);  // Eliminar la cookie y devolver un estado 200
    });
};

const updateUsuarioName = async (req, res) => {
    let connection;
    try {
      const { usua } = req.body; // Obtener 'usua' desde req.body
      
      if (!usua) {
        return res.status(400).json({ message: "El usuario no fue enviado en la solicitud" });
      }
  
      connection = await getConnection();
      const [userResult] = await connection.query(`SELECT id_usuario FROM usuario WHERE usua = ?`, [usua]);
  
      if (userResult.length === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
  
      const userbd = userResult[0];
      await connection.query("UPDATE usuario SET estado_token = ? WHERE id_usuario = ?", [0, userbd.id_usuario]);
  
      res.json({ code: 1, message: "Usuario actualizado" });
    } catch (error) {
      console.error("Error en updateUsuarioName:", error);
      res.status(500).send("Error interno del servidor");
    } finally {
      if (connection) {
        connection.release();  // Liberar la conexión
      }
    }
};



export const methods = {
    login,
    verifyToken,
    logout,
    updateUsuarioName
};