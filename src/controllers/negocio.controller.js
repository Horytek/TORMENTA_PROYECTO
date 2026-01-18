import { getConnection } from "../database/database.js";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// We are in src/controllers, uploads should be in root/uploads or src/uploads. 
// Let's put it in root/uploads (server/uploads) to easier serving.
const UPLOADS_DIR = path.resolve(__dirname, "../../uploads");

// Ensure directory exists
(async () => {
    try {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
    } catch (e) {
        console.error('Error creating uploads dir', e);
    }
})();

export const getNegocio = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        // 1. Get id_empresa from current user
        const [users] = await connection.query("SELECT id_empresa FROM usuario WHERE id_usuario = ?", [req.user.id_usuario]);
        if (!users.length || !users[0].id_empresa) {
            return res.json({ code: 1, data: null });
        }
        const id_empresa = users[0].id_empresa;

        // 2. Get empresa data
        const [empresas] = await connection.query("SELECT * FROM empresa WHERE id_empresa = ?", [id_empresa]);
        if (!empresas.length) return res.json({ code: 1, data: null });

        const empresa = empresas[0];

        res.json({
            code: 1,
            data: {
                nombre_negocio: empresa.nombreComercial || empresa.razonSocial,
                id_empresa: empresa.id_empresa, // Required for ImageKit upload
                direccion: empresa.direccion,
                logotipo_url: empresa.logotipo, // Renamed for clarity in frontend but maps to logotipo
                ruc: empresa.ruc,
                // New fields
                distrito: empresa.distrito,
                provincia: empresa.provincia,
                departamento: empresa.departamento,
                codigoPostal: empresa.codigoPostal,
                email: empresa.email,
                telefono: empresa.telefono,
                moneda: empresa.moneda,
                pais: empresa.pais
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 0, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

export const updateNegocio = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        // 1. Get id_empresa
        const [users] = await connection.query("SELECT id_empresa FROM usuario WHERE id_usuario = ?", [req.user.id_usuario]);
        if (!users.length || !users[0].id_empresa) {
            return res.status(400).json({ message: "Usuario no tiene empresa asignada" });
        }
        const id_empresa = users[0].id_empresa;

        const {
            nombre_negocio,
            direccion,
            ruc,
            eliminar_logo,
            logotipo, // URL from ImageKit
            // New fields
            distrito, provincia, departamento, codigoPostal, email, telefono, moneda, pais
        } = req.body;

        let final_logo_url = undefined;

        // Handle File Upload (Legacy or Backup)
        if (req.file) {
            // Validate image type
            if (!req.file.mimetype.startsWith('image/')) {
                return res.status(400).json({ message: "El archivo debe ser una imagen" });
            }

            const ext = path.extname(req.file.originalname);
            const filename = `logo_${id_empresa}_${Date.now()}${ext}`;
            const filepath = path.join(UPLOADS_DIR, filename);

            await fs.writeFile(filepath, req.file.buffer);

            const protocol = req.protocol;
            const host = req.get('host');
            final_logo_url = `${protocol}://${host}/uploads/${filename}`;
        } else if (logotipo !== undefined) {
            // If URL is provided (e.g. from ImageKit), use it
            final_logo_url = logotipo;
        } else if (eliminar_logo === '1') {
            final_logo_url = null;
        }

        // Build Update Query
        const updates = [];
        const params = [];

        if (nombre_negocio !== undefined) { updates.push("nombreComercial = ?"); params.push(nombre_negocio.trim()); }
        if (direccion !== undefined) { updates.push("direccion = ?"); params.push(direccion.trim()); }
        if (ruc !== undefined) { updates.push("ruc = ?"); params.push(ruc.trim()); }

        // New fields updates
        if (distrito !== undefined) { updates.push("distrito = ?"); params.push(distrito.trim()); }
        if (provincia !== undefined) { updates.push("provincia = ?"); params.push(provincia.trim()); }
        if (departamento !== undefined) { updates.push("departamento = ?"); params.push(departamento.trim()); }
        if (codigoPostal !== undefined) { updates.push("codigoPostal = ?"); params.push(codigoPostal.trim()); }
        if (email !== undefined) { updates.push("email = ?"); params.push(email.trim()); }
        if (telefono !== undefined) { updates.push("telefono = ?"); params.push(telefono.trim()); }
        if (moneda !== undefined) { updates.push("moneda = ?"); params.push(moneda.trim()); }
        if (pais !== undefined) { updates.push("pais = ?"); params.push(pais.trim()); }

        if (final_logo_url !== undefined) {
            updates.push("logotipo = ?");
            params.push(final_logo_url);
        }

        if (updates.length > 0) {
            params.push(id_empresa);
            await connection.query(`UPDATE empresa SET ${updates.join(', ')} WHERE id_empresa = ?`, params);
        }

        // Return updated data
        const [updated] = await connection.query("SELECT * FROM empresa WHERE id_empresa = ?", [id_empresa]);
        const empresa = updated[0];

        res.json({
            code: 1,
            data: {
                nombre_negocio: empresa.nombreComercial,
                direccion: empresa.direccion,
                logo_url: empresa.logotipo,
                ruc: empresa.ruc,
                // Return new fields
                distrito: empresa.distrito,
                provincia: empresa.provincia,
                departamento: empresa.departamento,
                codigoPostal: empresa.codigoPostal,
                email: empresa.email,
                telefono: empresa.telefono,
                moneda: empresa.moneda,
                pais: empresa.pais
            },
            message: "Configuración guardada correctamente"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 0, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};
