import { getConnection } from "./../database/database.js";
import { getConfig, setConfig, getSaldoCliente } from "../services/loyalty/puntosRepository.js";

const getPuntosConfig = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const config = await getConfig(connection, req.id_tenant);
        res.json({ code: 1, data: config });
    } catch (error) {
        console.error('Error en getPuntosConfig:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release();
    }
};

const updatePuntosConfig = async (req, res) => {
    let connection;
    try {
        const { activo, soles_por_punto, valor_canje_por_punto } = req.body;
        const soles = Number(soles_por_punto);
        const valorCanje = Number(valor_canje_por_punto);
        if (!Number.isFinite(soles) || soles <= 0 || !Number.isFinite(valorCanje) || valorCanje < 0) {
            return res.status(400).json({ code: 0, message: "Configuración inválida" });
        }

        connection = await getConnection();
        await setConfig(connection, req.id_tenant, { activo: !!activo, soles_por_punto: soles, valor_canje_por_punto: valorCanje });
        res.json({ code: 1, message: "Configuración actualizada" });
    } catch (error) {
        console.error('Error en updatePuntosConfig:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release();
    }
};

// Saldo de un cliente + la config vigente, en una sola llamada — el POS
// necesita ambos datos juntos para mostrar "tienes N puntos = S/X" al elegir cliente.
const getPuntosCliente = async (req, res) => {
    let connection;
    try {
        const { id_cliente } = req.params;
        connection = await getConnection();
        const [config, saldo] = await Promise.all([
            getConfig(connection, req.id_tenant),
            getSaldoCliente(connection, { id_tenant: req.id_tenant, id_cliente: Number(id_cliente) }),
        ]);
        res.json({ code: 1, data: { saldo, config } });
    } catch (error) {
        console.error('Error en getPuntosCliente:', error);
        res.status(500).json({ code: 0, message: "Error interno del servidor" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = { getPuntosConfig, updatePuntosConfig, getPuntosCliente };
