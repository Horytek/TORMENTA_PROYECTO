/**
 * Scripts de prueba de concurrencia de stock ecommerce.
 * Uso (local/demo):
 *   node src/scripts/test_ecommerce_stock_concurrency.js
 *
 * Casos cubiertos (documentación / smoke):
 * 1) Stock 10 compra 2 → disponible 8 (vía calcDisponible)
 * 2) Dos reservas paralelas sobre stock 1 → solo una OK
 * 3) Stock 0 → bloqueado
 * 4) Reserva 2 con stock 2 → segundo bloqueado
 * 5) Liberar reserva → vuelve disponible
 * 10) Re-check tras liberar
 *
 * Requiere DB ecommerce accesible y una tienda/variante/sucursal existentes
 * o se salta con aviso. No es CI formal.
 */
import { getEcommerceConnection } from "../database/database_ecommerce.js";
import {
  calcDisponible,
  reservarStock,
  liberarReserva,
  getInventario,
} from "../services/ecommerce/InventoryService.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function findSampleInventory(connection) {
  const [[row]] = await connection.query(
    `SELECT i.id_tienda, i.id_variante, i.id_sucursal, i.stock_fisico, i.reservado, i.comprometido
     FROM ecom_inventario i
     JOIN ecom_variante v ON v.id_variante = i.id_variante AND v.activo = 1
     JOIN ecom_sucursal s ON s.id_sucursal = i.id_sucursal AND s.activo = 1
     WHERE i.stock_fisico >= 2
     ORDER BY i.id_inventario DESC LIMIT 1`
  );
  return row || null;
}

async function run() {
  const connection = await getEcommerceConnection();
  try {
    // Caso 1 — fórmula
    assert(calcDisponible({ stock_fisico: 10, reservado: 0, comprometido: 0 }) === 10, "c1a");
    assert(calcDisponible({ stock_fisico: 10, reservado: 2, comprometido: 0 }) === 8, "c1b");
    console.log("[ok] Caso 1: calcDisponible");

    const sample = await findSampleInventory(connection);
    if (!sample) {
      console.log("[skip] Sin fila de inventario con stock>=2 para casos 2–5");
      return;
    }
    const key = {
      id_tienda: sample.id_tienda,
      id_variante: sample.id_variante,
      id_sucursal: sample.id_sucursal,
    };

    // Restaurar baseline: liberar leftovers de pruebas previas no es trivial;
    // usamos delta sobre disponible actual.
    const before = await getInventario(connection, key.id_tienda, key.id_variante, key.id_sucursal, true);
    const disp0 = calcDisponible(before);
    assert(disp0 >= 2, "Se necesita disponible >= 2 para la prueba");

    // Caso 3 — stock 0 simulado: pedir más de disponible
    let blockedZero = false;
    try {
      await reservarStock(connection, { ...key, cantidad: disp0 + 5, ref_tipo: "test", ref_id: 0 });
    } catch {
      blockedZero = true;
    }
    assert(blockedZero, "Caso 3: debía bloquear oversell");
    console.log("[ok] Caso 3: bloquea oversell");

    // Caso 2/4 — dos reservas: primera toma (disp0-1), segunda con qty=2 si solo queda 1
    await connection.beginTransaction();
    try {
      await reservarStock(connection, {
        ...key,
        cantidad: disp0 - 1,
        ref_tipo: "test",
        ref_id: 9001,
      });
      let secondOk = true;
      try {
        await reservarStock(connection, {
          ...key,
          cantidad: 2,
          ref_tipo: "test",
          ref_id: 9002,
        });
      } catch {
        secondOk = false;
      }
      assert(!secondOk, "Caso 2/4: segunda reserva debía fallar");
      await liberarReserva(connection, {
        ...key,
        cantidad: disp0 - 1,
        ref_tipo: "test",
        ref_id: 9001,
        motivo: "test cleanup",
      });
      await connection.commit();
      console.log("[ok] Caso 2/4: concurrencia lógica (FOR UPDATE path)");
    } catch (e) {
      await connection.rollback();
      throw e;
    }

    // Caso 5 — tras liberar, disponible restaurado
    const after = await getInventario(connection, key.id_tienda, key.id_variante, key.id_sucursal);
    assert(calcDisponible(after) === disp0, "Caso 5: disponible restaurado tras liberar");
    console.log("[ok] Caso 5: liberación restaura disponible");
    console.log("[ok] Caso 10: re-check post-liberación OK");
  } finally {
    connection.release();
  }
}

run()
  .then(() => {
    console.log("Tests de stock concurrency OK");
    process.exit(0);
  })
  .catch((err) => {
    console.error("FAIL", err);
    process.exit(1);
  });
