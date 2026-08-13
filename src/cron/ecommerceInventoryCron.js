/**
 * Cron ecommerce: libera reservas de checkout abandonadas y soft-holds expirados.
 * Cada 5 minutos en la misma instancia Azure.
 */
import cron from "node-cron";
import { getEcommerceConnection } from "../database/database_ecommerce.js";
import { liberarReserva, liberarComprometido } from "../services/ecommerce/InventoryService.js";
import { parseConfig, DEFAULT_CONFIG } from "../services/ecommerce/DisponibilidadService.js";

async function liberarCheckoutsAbandonados() {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [tiendas] = await connection.query(
      `SELECT id_tienda, theme_json FROM tienda WHERE estado = 'active'`
    );
    let liberadas = 0;
    for (const t of tiendas) {
      const cfg = parseConfig(t.theme_json);
      const mins = cfg.reserva_checkout_min || DEFAULT_CONFIG.reserva_checkout_min;
      const [ordenes] = await connection.query(
        `SELECT id_orden, id_sucursal FROM orden
         WHERE id_tienda = ? AND estado = 'pending'
           AND created_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)
         LIMIT 50`,
        [t.id_tienda, mins]
      );
      for (const o of ordenes) {
        await connection.beginTransaction();
        try {
          const [[locked]] = await connection.query(
            `SELECT id_orden, estado FROM orden
             WHERE id_orden = ? AND id_tienda = ? FOR UPDATE`,
            [o.id_orden, t.id_tienda]
          );
          if (!locked || locked.estado !== "pending") {
            await connection.rollback();
            continue;
          }
          const [items] = await connection.query(
            `SELECT id_variante, cantidad FROM orden_item
             WHERE id_orden = ? AND id_tienda = ? AND id_variante IS NOT NULL`,
            [o.id_orden, t.id_tienda]
          );
          if (o.id_sucursal) {
            for (const it of items) {
              await liberarReserva(connection, {
                id_tienda: t.id_tienda,
                id_variante: it.id_variante,
                id_sucursal: o.id_sucursal,
                cantidad: it.cantidad,
                ref_tipo: "checkout",
                ref_id: o.id_orden,
                motivo: "TTL checkout",
              });
            }
          }
          await connection.query(
            `UPDATE orden SET estado = 'cancelled', estado_fulfillment = 'cancelado'
             WHERE id_orden = ? AND id_tienda = ? AND estado = 'pending'`,
            [o.id_orden, t.id_tienda]
          );
          await connection.commit();
          liberadas += 1;
        } catch (err) {
          await connection.rollback();
          console.error(`[ecom-cron] orden ${o.id_orden}:`, err.message);
        }
      }
    }
    if (liberadas) console.log(`[ecom-cron] Liberadas ${liberadas} órdenes pending por TTL`);
  } catch (error) {
    if (error?.code === "ER_NO_SUCH_TABLE" || error?.code === "ER_BAD_DB_ERROR") return;
    console.error("[ecom-cron] liberarCheckoutsAbandonados:", error.message);
  } finally {
    if (connection) connection.release();
  }
}

async function expirarSoftReservas() {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const [rows] = await connection.query(
      `SELECT id_reserva, id_tienda, id_variante, id_sucursal, cantidad
       FROM ecom_reserva_disponibilidad
       WHERE estado = 'activa' AND expires_at IS NOT NULL AND expires_at < NOW()
       LIMIT 100`
    );
    for (const r of rows) {
      await connection.beginTransaction();
      try {
        const [[locked]] = await connection.query(
          `SELECT id_reserva, estado FROM ecom_reserva_disponibilidad
           WHERE id_reserva = ? FOR UPDATE`,
          [r.id_reserva]
        );
        if (!locked || locked.estado !== "activa") {
          await connection.rollback();
          continue;
        }
        if (r.id_variante) {
          await liberarComprometido(connection, {
            id_tienda: r.id_tienda,
            id_variante: r.id_variante,
            id_sucursal: r.id_sucursal,
            cantidad: r.cantidad,
          });
        }
        await connection.query(
          `UPDATE ecom_reserva_disponibilidad SET estado = 'expirada' WHERE id_reserva = ?`,
          [r.id_reserva]
        );
        await connection.commit();
      } catch (err) {
        await connection.rollback();
        console.error(`[ecom-cron] soft reserva ${r.id_reserva}:`, err.message);
      }
    }
  } catch (error) {
    if (error?.code === "ER_NO_SUCH_TABLE") return;
    console.error("[ecom-cron] expirarSoftReservas:", error.message);
  } finally {
    if (connection) connection.release();
  }
}

import { expirarSolicitudesVencidas } from "../services/ecommerce/SolicitudDisponibilidadService.js";

async function expirarAutorizacionesSolicitud() {
  let connection;
  try {
    connection = await getEcommerceConnection();
    const n = await expirarSolicitudesVencidas(connection);
    if (n) console.log(`[ecom-cron] Expiradas ${n} autorizaciones de solicitud`);
  } catch (error) {
    if (error?.code === "ER_NO_SUCH_TABLE") return;
    console.error("[ecom-cron] expirarAutorizacionesSolicitud:", error.message);
  } finally {
    if (connection) connection.release();
  }
}

export function initEcommerceInventoryCron() {
  cron.schedule("*/5 * * * *", async () => {
    await liberarCheckoutsAbandonados();
    await expirarSoftReservas();
    await expirarAutorizacionesSolicitud();
  });
  console.log("[Cron] Ecommerce inventory TTL cron scheduled (every 5 min)");
}
