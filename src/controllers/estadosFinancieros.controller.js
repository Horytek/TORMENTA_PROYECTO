import { getConnection } from "../database/database.js";

// Saldo acumulado de cada cuenta desde el inicio hasta `fechaCorte` (inclusive), con signo según naturaleza.
const saldosPorCuenta = async (connection, id_tenant, tipos, fechaCorte) => {
    const [rows] = await connection.query(
        `SELECT c.id_cuenta, c.codigo, c.nombre, c.tipo, c.naturaleza, c.nivel, c.id_cuenta_padre,
                COALESCE(SUM(d.debe), 0) AS totalDebe, COALESCE(SUM(d.haber), 0) AS totalHaber
         FROM cuenta_contable c
         LEFT JOIN asiento_detalle d ON d.id_cuenta = c.id_cuenta
         LEFT JOIN asiento_contable a ON d.id_asiento = a.id_asiento AND a.estado != 'anulado' AND a.fecha <= ?
         WHERE c.id_tenant = ? AND c.tipo IN (?) AND c.permite_movimiento = 1
         GROUP BY c.id_cuenta
         ORDER BY c.codigo`,
        [fechaCorte, id_tenant, tipos]
    );
    return rows.map((r) => {
        const signo = r.naturaleza === "deudora" ? 1 : -1;
        const saldo = signo * (Number(r.totalDebe) - Number(r.totalHaber));
        return { ...r, saldo };
    });
};

const getBalanceGeneral = async (req, res) => {
    const fechaCorte = req.query.fecha || new Date().toISOString().slice(0, 10);
    let connection;
    try {
        connection = await getConnection();
        const [activo, pasivo, patrimonio] = await Promise.all([
            saldosPorCuenta(connection, req.id_tenant, ["activo"], fechaCorte),
            saldosPorCuenta(connection, req.id_tenant, ["pasivo"], fechaCorte),
            saldosPorCuenta(connection, req.id_tenant, ["patrimonio"], fechaCorte),
        ]);
        const totalActivo = activo.reduce((s, c) => s + c.saldo, 0);
        const totalPasivo = pasivo.reduce((s, c) => s + c.saldo, 0);
        const totalPatrimonio = patrimonio.reduce((s, c) => s + c.saldo, 0);

        res.json({
            success: true,
            data: {
                fechaCorte, activo, pasivo, patrimonio,
                totalActivo, totalPasivo, totalPatrimonio,
                diferencia: Math.round((totalActivo - (totalPasivo + totalPatrimonio)) * 100) / 100,
            },
        });
    } catch (error) {
        console.error("Error en getBalanceGeneral:", error);
        res.status(500).json({ success: false, message: "Error al generar el balance general" });
    } finally {
        if (connection) connection.release();
    }
};

const getEstadoResultados = async (req, res) => {
    const { fechaInicio, fechaFin } = req.query;
    if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ success: false, message: "fechaInicio y fechaFin son obligatorios" });
    }
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query(
            `SELECT c.id_cuenta, c.codigo, c.nombre, c.tipo, c.naturaleza,
                    COALESCE(SUM(d.debe), 0) AS totalDebe, COALESCE(SUM(d.haber), 0) AS totalHaber
             FROM cuenta_contable c
             LEFT JOIN asiento_detalle d ON d.id_cuenta = c.id_cuenta
             LEFT JOIN asiento_contable a ON d.id_asiento = a.id_asiento AND a.estado != 'anulado' AND a.fecha BETWEEN ? AND ?
             WHERE c.id_tenant = ? AND c.tipo IN ('ingreso','costo','gasto') AND c.permite_movimiento = 1
             GROUP BY c.id_cuenta
             ORDER BY c.codigo`,
            [fechaInicio, fechaFin, req.id_tenant]
        );
        const conSaldo = rows.map((r) => {
            const signo = r.naturaleza === "deudora" ? 1 : -1;
            return { ...r, saldo: signo * (Number(r.totalDebe) - Number(r.totalHaber)) };
        });

        const ingresos = conSaldo.filter((c) => c.tipo === "ingreso");
        const costos = conSaldo.filter((c) => c.tipo === "costo");
        const gastos = conSaldo.filter((c) => c.tipo === "gasto");
        const totalIngresos = ingresos.reduce((s, c) => s + c.saldo, 0);
        const totalCostos = costos.reduce((s, c) => s + c.saldo, 0);
        const totalGastos = gastos.reduce((s, c) => s + c.saldo, 0);

        res.json({
            success: true,
            data: {
                fechaInicio, fechaFin, ingresos, costos, gastos,
                totalIngresos, totalCostos, totalGastos,
                utilidadNeta: totalIngresos - totalCostos - totalGastos,
            },
        });
    } catch (error) {
        console.error("Error en getEstadoResultados:", error);
        res.status(500).json({ success: false, message: "Error al generar el estado de resultados" });
    } finally {
        if (connection) connection.release();
    }
};

const getBalanceComprobacion = async (req, res) => {
    const { fechaInicio, fechaFin } = req.query;
    if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ success: false, message: "fechaInicio y fechaFin son obligatorios" });
    }
    let connection;
    try {
        connection = await getConnection();

        const [saldoAnteriorRows] = await connection.query(
            `SELECT c.id_cuenta, c.naturaleza, COALESCE(SUM(d.debe), 0) AS debe, COALESCE(SUM(d.haber), 0) AS haber
             FROM cuenta_contable c
             LEFT JOIN asiento_detalle d ON d.id_cuenta = c.id_cuenta
             LEFT JOIN asiento_contable a ON d.id_asiento = a.id_asiento AND a.estado != 'anulado' AND a.fecha < ?
             WHERE c.id_tenant = ? AND c.permite_movimiento = 1
             GROUP BY c.id_cuenta`,
            [fechaInicio, req.id_tenant]
        );
        const saldoAnteriorMap = new Map(saldoAnteriorRows.map((r) => {
            const signo = r.naturaleza === "deudora" ? 1 : -1;
            return [r.id_cuenta, signo * (Number(r.debe) - Number(r.haber))];
        }));

        const [movimientos] = await connection.query(
            `SELECT c.id_cuenta, c.codigo, c.nombre, c.naturaleza,
                    COALESCE(SUM(d.debe), 0) AS debePeriodo, COALESCE(SUM(d.haber), 0) AS haberPeriodo
             FROM cuenta_contable c
             LEFT JOIN asiento_detalle d ON d.id_cuenta = c.id_cuenta
             LEFT JOIN asiento_contable a ON d.id_asiento = a.id_asiento AND a.estado != 'anulado' AND a.fecha BETWEEN ? AND ?
             WHERE c.id_tenant = ? AND c.permite_movimiento = 1
             GROUP BY c.id_cuenta
             ORDER BY c.codigo`,
            [fechaInicio, fechaFin, req.id_tenant]
        );

        const filas = movimientos
            .map((m) => {
                const signo = m.naturaleza === "deudora" ? 1 : -1;
                const saldoAnterior = saldoAnteriorMap.get(m.id_cuenta) || 0;
                const movimientoPeriodo = signo * (Number(m.debePeriodo) - Number(m.haberPeriodo));
                const saldoFinal = saldoAnterior + movimientoPeriodo;
                return {
                    id_cuenta: m.id_cuenta, codigo: m.codigo, nombre: m.nombre,
                    saldoAnterior, debePeriodo: Number(m.debePeriodo), haberPeriodo: Number(m.haberPeriodo), saldoFinal,
                };
            })
            .filter((f) => f.saldoAnterior !== 0 || f.debePeriodo !== 0 || f.haberPeriodo !== 0);

        const totales = filas.reduce(
            (acc, f) => ({
                debePeriodo: acc.debePeriodo + f.debePeriodo,
                haberPeriodo: acc.haberPeriodo + f.haberPeriodo,
            }),
            { debePeriodo: 0, haberPeriodo: 0 }
        );

        res.json({ success: true, data: { fechaInicio, fechaFin, filas, totales } });
    } catch (error) {
        console.error("Error en getBalanceComprobacion:", error);
        res.status(500).json({ success: false, message: "Error al generar el balance de comprobación" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = { getBalanceGeneral, getEstadoResultados, getBalanceComprobacion };
