import { getConnection } from "./../database/database";

const getUsuarios = async (req, res) => {
    try {
        const connection = await getConnection();
        const result = await connection.query("SELECT usua, contra FROM usuario");
        res.json(result);
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

const verifyUsuario = async (req, res) => {
    try {
        const { usuario, password } = req.body;
        
        const params = [ usuario, password ];
        const connection = await getConnection();
        const result = await connection.query("SELECT * FROM usuario WHERE usua = ? AND contra = ?", params);
        
        if (result.length > 0) {
            res.json({ success: true, message: 'Login successful' });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }

    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

export const methods = {
    getUsuarios,
    verifyUsuario
};