import { getConnection } from "../database/database.js";

// Obtener pagos con filtros
export const getPagos = async (req, res) => {
    const id_tenant = req.id_tenant;
    const { estado, fechaInicio, fechaFin } = req.query;

    let connection;
    try {
        connection = await getConnection();
        let query = `
            SELECT p.*, 
                   CONCAT(v.nombres, ' ', v.apellidos) as nombre_vendedor 
            FROM pago_vendedor p
            INNER JOIN vendedor v ON p.dni_vendedor = v.dni
            WHERE p.id_tenant = ?
        `;
        const params = [id_tenant];

        if (estado && estado !== 'TODOS') {
            query += " AND p.estado_pago = ?";
            params.push(estado);
        }

        if (fechaInicio && fechaFin) {
            query += " AND p.fecha_programada BETWEEN ? AND ?";
            params.push(fechaInicio, fechaFin);
        }

        query += " ORDER BY p.fecha_programada DESC";

        const [result] = await connection.query(query, params);
        res.json({ code: 1, data: result, message: "Pagos listados" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 0, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

// Dashboard KPIs
export const getPagosDashboard = async (req, res) => {
    const id_tenant = req.id_tenant;
    const { mes, anio } = req.query; // mes 1-12, anio YYYY

    if (!mes || !anio) return res.status(400).json({ message: "Mes y año requeridos" });

    let connection;
    try {
        connection = await getConnection();

        // Compromisos del mes (Pendientes + Atrasados que vencen en este mes)
        const [compromisos] = await connection.query(`
            SELECT SUM(costo_total) as total 
            FROM pago_vendedor 
            WHERE id_tenant = ? 
            AND estado_pago IN ('PENDIENTE', 'ATRASADO')
            AND MONTH(fecha_programada) = ? AND YEAR(fecha_programada) = ?
        `, [id_tenant, mes, anio]);

        // Pagos Atrasados (Total histórico)
        const [atrasados] = await connection.query(`
            SELECT SUM(costo_total) as total 
            FROM pago_vendedor 
            WHERE id_tenant = ? 
            AND estado_pago = 'ATRASADO'
        `, [id_tenant]);

        // Total Pagado este mes
        const [pagadoMes] = await connection.query(`
            SELECT SUM(costo_total) as total 
            FROM pago_vendedor 
            WHERE id_tenant = ? 
            AND estado_pago = 'PAGADO'
            AND MONTH(fecha_pagada) = ? AND YEAR(fecha_pagada) = ?
        `, [id_tenant, mes, anio]);

        res.json({
            code: 1,
            data: {
                compromisos_mes: compromisos[0].total || 0,
                pagos_atrasados: atrasados[0].total || 0,
                total_pagado_mes: pagadoMes[0].total || 0
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 0, message: "Error interno" });
    } finally {
        if (connection) connection.release();
    }
};

// Agregar Pago
export const addPago = async (req, res) => {
    const id_tenant = req.id_tenant;
    const {
        dni_vendedor, tipo_pago, monto_neto, monto_aportes, monto_beneficios,
        fecha_programada, es_recurrente, frecuencia, dia_habitual_pago, observacion
    } = req.body;

    let connection;
    try {
        connection = await getConnection();
        const [result] = await connection.query(`
            INSERT INTO pago_vendedor SET ?
        `, [{
            dni_vendedor, id_tenant, tipo_pago,
            monto_neto, monto_aportes, monto_beneficios,
            fecha_programada, es_recurrente, frecuencia, dia_habitual_pago, observacion,
            estado_pago: 'PENDIENTE'
        }]);

        res.json({ code: 1, message: "Pago programado correctamente", id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 0, message: "Error al registrar pago" });
    } finally {
        if (connection) connection.release();
    }
};

// Actualizar Pago (Marcar como pagado y generar recurrencia)
export const updatePago = async (req, res) => {
    const { id } = req.params;
    const { estado_pago, fecha_pagada, observacion } = req.body;
    const id_tenant = req.id_tenant;

    let connection;
    try {
        connection = await getConnection();
        await connection.beginTransaction();

        // Obtener datos actuales del pago
        const [pagoActual] = await connection.query("SELECT * FROM pago_vendedor WHERE id_pago = ? AND id_tenant = ?", [id, id_tenant]);

        if (pagoActual.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Pago no encontrado" });
        }

        const pago = pagoActual[0];

        // Actualizar estado
        await connection.query(`
            UPDATE pago_vendedor SET 
                estado_pago = ?, 
                fecha_pagada = ?, 
                observacion = COALESCE(?, observacion)
            WHERE id_pago = ?
        `, [estado_pago, fecha_pagada, observacion, id]);

        // Lógica de Recurrencia: Si se marca como PAGADO y es recurrente, crear el siguiente
        if (estado_pago === 'PAGADO' && pago.es_recurrente === 1 && pago.estado_pago !== 'PAGADO') {
            let nextDate = new Date(pago.fecha_programada);

            // Calcular siguiente fecha
            switch (pago.frecuencia) {
                case 'MENSUAL': nextDate.setMonth(nextDate.getMonth() + 1); break;
                case 'QUINCENAL': nextDate.setDate(nextDate.getDate() + 15); break;
                case 'SEMANAL': nextDate.setDate(nextDate.getDate() + 7); break;
                case 'ANUAL': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
            }

            // Insertar siguiente pago
            await connection.query(`
                INSERT INTO pago_vendedor SET ?
            `, [{
                dni_vendedor: pago.dni_vendedor,
                id_tenant: pago.id_tenant,
                tipo_pago: pago.tipo_pago,
                monto_neto: pago.monto_neto,
                monto_aportes: pago.monto_aportes,
                monto_beneficios: pago.monto_beneficios,
                fecha_programada: nextDate,
                es_recurrente: 1,
                frecuencia: pago.frecuencia,
                dia_habitual_pago: pago.dia_habitual_pago,
                estado_pago: 'PENDIENTE',
                observacion: 'Pago recurrente generado automáticamente'
            }]);
        }

        await connection.commit();
        res.json({ code: 1, message: "Pago actualizado correctamente" });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ code: 0, message: "Error al actualizar pago" });
    } finally {
        if (connection) connection.release();
    }
};

export const deletePago = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await getConnection();
        await connection.query("DELETE FROM pago_vendedor WHERE id_pago = ?", [id]);
        res.json({ code: 1, message: "Pago eliminado" });
    } catch (error) {
        res.status(500).json({ code: 0, message: "Error al eliminar" });
    } finally {
        if (connection) connection.release();
    }
};
