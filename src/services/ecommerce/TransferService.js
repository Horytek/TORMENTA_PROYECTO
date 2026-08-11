/**
 * Transferencias entre sucursales ecommerce.
 */

import { calcDisponible, getInventario, registrarMovimiento } from "./InventoryService.js";

const TRANSICIONES = {
  solicitada: ["en_transito", "cancelada"],
  en_transito: ["recibida", "cancelada"],
  recibida: [],
  cancelada: [],
};

export function puedeTransicionar(estadoActual, estadoNuevo) {
  return (TRANSICIONES[estadoActual] || []).includes(estadoNuevo);
}

export async function crearTransferencia(
  connection,
  { id_tienda, id_sucursal_origen, id_sucursal_destino, lineas, notas, id_usuario }
) {
  if (id_sucursal_origen === id_sucursal_destino) {
    throw Object.assign(new Error("Origen y destino deben ser distintos."), { status: 400 });
  }
  const [ins] = await connection.query(
    `INSERT INTO ecom_transferencia
      (id_tienda, id_sucursal_origen, id_sucursal_destino, estado, notas, id_usuario)
     VALUES (?, ?, ?, 'solicitada', ?, ?)`,
    [id_tienda, id_sucursal_origen, id_sucursal_destino, notas || null, id_usuario || null]
  );
  const id_transferencia = ins.insertId;
  for (const l of lineas) {
    await connection.query(
      `INSERT INTO ecom_transferencia_linea (id_transferencia, id_variante, cantidad)
       VALUES (?, ?, ?)`,
      [id_transferencia, l.id_variante, l.cantidad]
    );
  }
  return id_transferencia;
}

export async function cambiarEstadoTransferencia(connection, id_tienda, id_transferencia, estadoNuevo, id_usuario) {
  const [[t]] = await connection.query(
    `SELECT * FROM ecom_transferencia WHERE id_transferencia = ? AND id_tienda = ? FOR UPDATE`,
    [id_transferencia, id_tienda]
  );
  if (!t) {
    throw Object.assign(new Error("Transferencia no encontrada."), { status: 404 });
  }
  if (!puedeTransicionar(t.estado, estadoNuevo)) {
    throw Object.assign(new Error(`No se puede pasar de ${t.estado} a ${estadoNuevo}.`), { status: 400 });
  }

  // ─── Movimiento de inventario (transaccional) ─────────────────────────────
  // ecom_inventario guarda:
  // - stock_fisico: disponible físicamente
  // - en_transito: pendiente de arribo (en sucursal destino)
  // disponible = stock_fisico - reservado - comprometido
  const lineas = await (async () => {
    const [rows] = await connection.query(
      `SELECT id_variante, cantidad FROM ecom_transferencia_linea WHERE id_transferencia = ?`,
      [id_transferencia]
    );
    return rows;
  })();

  const id_sucursal_origen = t.id_sucursal_origen;
  const id_sucursal_destino = t.id_sucursal_destino;

  // Nota: solo ajustamos inventario cuando el estado cambia a:
  // - en_transito (se descuenta origen + se carga destino)
  // - recibida (se descarga destino de en_transito + se suma stock_fisico)
  // - cancelada (solo si veníamos de en_transito)
  if (t.estado === "solicitada" && estadoNuevo === "en_transito") {
    for (const l of lineas) {
      const invOrigen = await getInventario(connection, id_tienda, l.id_variante, id_sucursal_origen, true);
      const invDestino = await getInventario(connection, id_tienda, l.id_variante, id_sucursal_destino, true);

      if (!invOrigen || !invDestino) {
        throw Object.assign(new Error("Inventario no encontrado para la transferencia."), { status: 400 });
      }

      const disponibleOrigen = calcDisponible(invOrigen);
      if (disponibleOrigen < l.cantidad) {
        throw Object.assign(new Error("Stock insuficiente en origen para transferir."), { status: 400 });
      }

      const fisAntes = Number(invOrigen.stock_fisico);
      const fisDespues = Math.max(0, fisAntes - l.cantidad);
      await connection.query(
        `UPDATE ecom_inventario SET stock_fisico = ? WHERE id_inventario = ? AND id_tienda = ?`,
        [fisDespues, invOrigen.id_inventario, id_tienda]
      );

      const transitAntes = Number(invDestino.en_transito);
      const transitDespues = Math.max(0, transitAntes + l.cantidad);
      await connection.query(
        `UPDATE ecom_inventario SET en_transito = ? WHERE id_inventario = ? AND id_tienda = ?`,
        [transitDespues, invDestino.id_inventario, id_tienda]
      );

      await registrarMovimiento(connection, {
        id_tienda,
        id_variante: l.id_variante,
        id_sucursal: id_sucursal_origen,
        tipo: "transferencia",
        cantidad: l.cantidad,
        stock_antes: fisAntes,
        stock_despues: fisDespues,
        id_usuario,
        motivo: `Transferencia ${id_transferencia} -> en_transito`,
        ref_tipo: "transferencia",
        ref_id: id_transferencia,
      });

      await registrarMovimiento(connection, {
        id_tienda,
        id_variante: l.id_variante,
        id_sucursal: id_sucursal_destino,
        tipo: "transferencia",
        cantidad: l.cantidad,
        stock_antes: transitAntes,
        stock_despues: transitDespues,
        id_usuario,
        motivo: `Transferencia ${id_transferencia} -> en_transito`,
        ref_tipo: "transferencia",
        ref_id: id_transferencia,
      });
    }
  }

  if (t.estado === "en_transito" && estadoNuevo === "recibida") {
    for (const l of lineas) {
      const invOrigen = await getInventario(connection, id_tienda, l.id_variante, id_sucursal_origen, true);
      const invDestino = await getInventario(connection, id_tienda, l.id_variante, id_sucursal_destino, true);

      if (!invOrigen || !invDestino) {
        throw Object.assign(new Error("Inventario no encontrado para la transferencia."), { status: 400 });
      }

      // En recibida: del destino pasamos en_transito -> stock_fisico.
      const transitAntes = Number(invDestino.en_transito);
      const transitDespues = Math.max(0, transitAntes - l.cantidad);
      await connection.query(
        `UPDATE ecom_inventario SET en_transito = ? WHERE id_inventario = ? AND id_tienda = ?`,
        [transitDespues, invDestino.id_inventario, id_tienda]
      );

      const fisAntes = Number(invDestino.stock_fisico);
      const fisDespues = Math.max(0, fisAntes + l.cantidad);
      await connection.query(
        `UPDATE ecom_inventario SET stock_fisico = ? WHERE id_inventario = ? AND id_tienda = ?`,
        [fisDespues, invDestino.id_inventario, id_tienda]
      );

      await connection.query(
        `UPDATE ecom_transferencia_linea
         SET cantidad_recibida = ?
         WHERE id_transferencia = ? AND id_variante = ?`,
        [l.cantidad, id_transferencia, l.id_variante]
      );

      await registrarMovimiento(connection, {
        id_tienda,
        id_variante: l.id_variante,
        id_sucursal: id_sucursal_destino,
        tipo: "transferencia",
        cantidad: l.cantidad,
        stock_antes: transitAntes,
        stock_despues: transitDespues,
        id_usuario,
        motivo: `Transferencia ${id_transferencia} -> recibida (en_transito -)`,
        ref_tipo: "transferencia",
        ref_id: id_transferencia,
      });

      await registrarMovimiento(connection, {
        id_tienda,
        id_variante: l.id_variante,
        id_sucursal: id_sucursal_destino,
        tipo: "transferencia",
        cantidad: l.cantidad,
        stock_antes: fisAntes,
        stock_despues: fisDespues,
        id_usuario,
        motivo: `Transferencia ${id_transferencia} -> recibida (fisico +)`,
        ref_tipo: "transferencia",
        ref_id: id_transferencia,
      });
    }
  }

  if (t.estado === "en_transito" && estadoNuevo === "cancelada") {
    for (const l of lineas) {
      const invOrigen = await getInventario(connection, id_tienda, l.id_variante, id_sucursal_origen, true);
      const invDestino = await getInventario(connection, id_tienda, l.id_variante, id_sucursal_destino, true);

      if (!invOrigen || !invDestino) {
        throw Object.assign(new Error("Inventario no encontrado para la transferencia."), { status: 400 });
      }

      // Cancelada desde en_transito: revertimos destino/en_transito y devolvemos stock_fisico al origen.
      const transitAntes = Number(invDestino.en_transito);
      const transitDespues = Math.max(0, transitAntes - l.cantidad);
      await connection.query(
        `UPDATE ecom_inventario SET en_transito = ? WHERE id_inventario = ? AND id_tienda = ?`,
        [transitDespues, invDestino.id_inventario, id_tienda]
      );

      const fisAntes = Number(invOrigen.stock_fisico);
      const fisDespues = Math.max(0, fisAntes + l.cantidad);
      await connection.query(
        `UPDATE ecom_inventario SET stock_fisico = ? WHERE id_inventario = ? AND id_tienda = ?`,
        [fisDespues, invOrigen.id_inventario, id_tienda]
      );

      await registrarMovimiento(connection, {
        id_tienda,
        id_variante: l.id_variante,
        id_sucursal: id_sucursal_destino,
        tipo: "transferencia",
        cantidad: l.cantidad,
        stock_antes: transitAntes,
        stock_despues: transitDespues,
        id_usuario,
        motivo: `Transferencia ${id_transferencia} -> cancelada (en_transito -)`,
        ref_tipo: "transferencia",
        ref_id: id_transferencia,
      });

      await registrarMovimiento(connection, {
        id_tienda,
        id_variante: l.id_variante,
        id_sucursal: id_sucursal_origen,
        tipo: "transferencia",
        cantidad: l.cantidad,
        stock_antes: fisAntes,
        stock_despues: fisDespues,
        id_usuario,
        motivo: `Transferencia ${id_transferencia} -> cancelada (fisico +)`,
        ref_tipo: "transferencia",
        ref_id: id_transferencia,
      });
    }
  }

  // Finalmente: confirmamos el estado en la cabecera.
  await connection.query(
    `UPDATE ecom_transferencia SET estado = ? WHERE id_transferencia = ? AND id_tienda = ?`,
    [estadoNuevo, id_transferencia, id_tienda]
  );

  return { ...t, estado: estadoNuevo, id_usuario };
}
