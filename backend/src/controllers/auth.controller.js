import { getConnection } from "./../database/database";
import { createAccessToken } from "../libs/jwt";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";

const login = async (req, res) => {
    
    try {
        const { usuario, password } = req.body;
        
        const user = { usuario: usuario.trim(), password: password.trim() };
        const connection = await getConnection();
        const [userFound] = await connection.query("SELECT 1 FROM usuario WHERE usua = ?", user.usuario);

        if (userFound.length === 0) {
            return res.status(400).json({ success: false, message: 'El usuario ingresado no existe' });
        }

        const [userValid] = await connection.query("SELECT * FROM usuario WHERE usua = ? AND contra = ?", [user.usuario, user.password]);
        
        if (userValid.length > 0) {
            const token = await createAccessToken({ nameUser: user.usuario });
            res.cookie("token", token)
            const userbd = userValid[0]
            res.json({ success: true, data: {
                id: userbd.id_usuario,
                rol: userbd.id_rol,
                usuario: userbd.usua
            }, message: 'Usuario encontrado' });
        } else {
            res.status(400).json({ success: false, message: 'La contraseña ingresada no es correcta' });
        }

    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
}

const verifyToken = async (req, res) => {
    const connection = await getConnection();
    const { token } = req.cookies;
    if (!token) return res.send(false);

    jwt.verify(token, TOKEN_SECRET, async (error, user) => {
        if (error) return res.sendStatus(401);

        const [userFound] = await connection.query("SELECT * FROM usuario WHERE usua = ?", user.nameUser)
        if (userFound.length === 0) return res.sendStatus(401);

        const userbd = userFound[0]

        return res.json({
            id: userbd.id_usuario,
            rol: userbd.id_rol,
            usuario: userbd.usua
        });
    });
};

const logout = async (req, res) => {
    res.cookie("token", "", {
      httpOnly: true,
      secure: true,
      expires: new Date(0),
    });
    return res.sendStatus(200);
};

export const methods = {
    login,
    verifyToken,
    logout
};