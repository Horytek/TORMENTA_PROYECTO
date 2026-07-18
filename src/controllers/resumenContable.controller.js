import { getConnection } from "../database/database.js";

const rangoMesAnterior = (fechaInicio, fechaFin) => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const dias = Math.round((fin.getTime() - inicio.getTime()) / 86400000) + 1;
    const finAnterior = new Date(inicio);
    finAnterior.setDate(finAnterior.getDate() - 1);
    const inicioAnterior = new Date(finAnterior);
    inicioAnterior.setDate(inicioAnterior.getDate() - dias + 1);
    return { inicioAnterior: inicioAnterior.toISOString().slice(0, 10), finAnterior: finAnterior.toISOString().slice(0, 10) };
};

const totalPorTipos = async (connection, id_tenant, tipos, fechaInicio, fechaFin) => {
    const [rows] = await connection.query(
        `SELECT c.naturaleza, COALESCE(SUM(d.debe), 0) AS debe, COALESCE(SUM(d.haber), 0) AS haber
         FROM cuenta_contable c
         LEFT JOIN asiento_detalle d ON d.id_cuenta = c.id_cuenta
         LEFT JOIN asiento_contable a ON d.id_asiento = a.id_asiento AND a.estado != 'anulado' AND a.fecha BETWEEN ? AND ?
         WHERE c.id_tenant = ? AND c.tipo IN (?) AND c.permite_movimiento = 1
         GROUP BY c.naturaleza`,
        [fechaInicio, fechaFin, id_tenant, tipos]
    );
    return rows.reduce((sum, r) => {
        const signo = r.naturaleza === "deudora" ? 1 : -1;
        return sum + signo * (Number(r.debe) - Number(r.haber));
    }, 0);
};

const getResumen = async (req, res) => {
    const hoy = new Date();
    const fechaInicio = req.query.fechaInicio || new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
    const fechaFin = req.query.fechaFin || hoy.toISOString().slice(0, 10);
    let connection;
    try {
        connection = await getConnection();
        const { inicioAnterior, finAnterior } = rangoMesAnterior(fechaInicio, fechaFin);

        const [ingresos, costos, gastos, ingresosAnt, costosAnt, gastosAnt] = await Promise.all([
            totalPorTipos(connection, req.id_tenant, ["ingreso"], fechaInicio, fechaFin),
            totalPorTipos(connection, req.id_tenant, ["costo"], fechaInicio, fechaFin),
            totalPorTipos(connection, req.id_tenant, ["gasto"], fechaInicio, fechaFin),
            totalPorTipos(connection, req.id_tenant, ["ingreso"], inicioAnterior, finAnterior),
            totalPorTipos(connection, req.id_tenant, ["costo"], inicioAnterior, finAnterior),
            totalPorTipos(connection, req.id_tenant, ["gasto"], inicioAnterior, finAnterior),
        ]);
        const utilidadNeta = ingresos - costos - gastos;
        const utilidadNetaAnterior = ingresosAnt - costosAnt - gastosAnt;
        const variacionUtilidad = utilidadNetaAnterior !== 0
            ? Math.round(((utilidadNeta - utilidadNetaAnterior) / Math.abs(utilidadNetaAnterior)) * 1000) / 10
            : null;

        const [flujoCajaRows] = await connection.query(
            `SELECT
                COALESCE(SUM(CASE WHEN tipo IN ('deposito','transferencia_entrada','ajuste') THEN monto ELSE 0 END), 0) AS ingresosCaja,
                COALESCE(SUM(CASE WHEN tipo IN ('retiro','transferencia_salida') THEN monto ELSE 0 END), 0) AS egresosCaja
             FROM movimiento_tesoreria
             WHERE id_tenant = ? AND fecha BETWEEN ? AND ?`,
            [req.id_tenant, fechaInicio, fechaFin]
        );
        const flujoCaja = Number(flujoCajaRows[0].ingresosCaja) - Number(flujoCajaRows[0].egresosCaja);

        const [saldoDisponibleRows] = await connection.query(
            `SELECT COALESCE(SUM(CASE WHEN tipo IN ('deposito','transferencia_entrada','ajuste') THEN monto ELSE -monto END), 0) AS saldo
             FROM movimiento_tesoreria WHERE id_tenant = ?`,
            [req.id_tenant]
        );
        const saldoDisponible = Number(saldoDisponibleRows[0].saldo);

        const anio = new Date(fechaFin).getFullYear();
        const mes = new Date(fechaFin).getMonth() + 1;
        const [presupuestoRows] = await connection.query(
            "SELECT id_cuenta, id_centro_costo, monto_presupuestado FROM presupuesto WHERE id_tenant = ? AND anio = ? AND (mes = ? OR mes IS NULL)",
            [req.id_tenant, anio, mes]
        );
        const totalPresupuestado = presupuestoRows.reduce((sum, p) => sum + Number(p.monto_presupuestado), 0);

        res.json({
            success: true,
            data: {
                fechaInicio, fechaFin,
                ingresos, egresos: costos + gastos, utilidadNeta, variacionUtilidad,
                flujoCaja, saldoDisponible,
                indicadorPresupuestario: { totalPresupuestado, cuentasConPresupuesto: presupuestoRows.length },
                alertas: [
                    ...(saldoDisponible < 0 ? [{ tipo: "critica", mensaje: "El saldo disponible en tesorería es negativo." }] : []),
                ],
            },
        });
    } catch (error) {
        console.error("Error en getResumen (contabilidad):", error);
        res.status(500).json({ success: false, message: "Error al generar el resumen contable" });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = { getResumen };
