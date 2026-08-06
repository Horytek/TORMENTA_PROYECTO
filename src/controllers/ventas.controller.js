import { getConnection } from "./../database/database.js";
import { getTesisConnection } from "./../database/database_tesis.js";
import { DATABASE } from "../config.js";
import { logVentas } from "../utils/logActions.js";
import { stockPorProducto, restarStockSku, descontarPorProducto, sumarStockSku } from "../services/inventario/stockRepository.js";
import { esErrorDeStock } from "../services/inventario/errores.js";
import { obtenerCostosVigentes } from "../services/costos/costoRepository.js";
import { costoDeLineaRepartida } from "../services/costos/costoPromedio.js";
import { getComboItemsPorProductos, disponibilidadCombos } from "../services/combos/comboRepository.js";
import { acumularPuntos, canjearPuntos, PuntosInsuficientesError } from "../services/loyalty/puntosRepository.js";
import { resolveSku } from "../utils/skuHelper.js";
import { saldoPendienteCliente } from "./cuentaPorCobrar.controller.js";

// Cache para datos que no cambian frecuentemente
const queryCache = new Map();
const CACHE_TTL = 60000; // 1 minuto

// --- INTERNAL HELPER FUNCTIONS ---

class VentaValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "VentaValidationError";
    this.statusCode = statusCode;
  }
}

const normalizarNumero = (valor, campo, { minimo = 0, entero = false } = {}) => {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < minimo || (entero && !Number.isInteger(numero))) {
    throw new VentaValidationError(`El campo ${campo} no es válido.`);
  }
  return numero;
};

/**
 * Costo unitario de UN combo: suma de (costo de cada componente × cuántas
 * unidades de ese componente entran en un combo). No se puede usar
 * `costoDeLineaRepartida` acá porque esa función promedia por unidad
 * asumiendo que todos los movimientos son del MISMO producto — mezclar
 * productos distintos en cantidades distintas daría un costo sin sentido.
 */
const costoDeCombo = ({ comboDetalle, costoPorSku }) => {
  let total = 0;
  for (const item of comboDetalle) {
    const { costo } = costoDeLineaRepartida({ movimientos: item.movimientos, costoPorSku });
    if (costo === null) return null; // costo incompleto: no se puede afirmar el costo del combo
    total += costo * item.cantidadPorCombo;
  }
  return Math.round((total + Number.EPSILON) * 1e6) / 1e6;
};

const normalizarIdOpcional = (valor) => {
  if (valor === undefined || valor === null || valor === "") return null;
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
};

/**
 * Fase B — atributos fijados de una variante colapsada (ej. { "5": "M" } =
 * talla M, cualquier color). Solo se valida la FORMA (objeto plano de
 * string→string) — si el cajero mandó ids/valores que no existen, el filtro
 * de `descontarPorProducto` simplemente no encuentra candidatas y la venta
 * falla con "sin stock", que es una falla segura.
 */
const normalizarAtributosFijados = (valor) => {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  const entradas = Object.entries(valor).filter(
    ([id, val]) => /^\d+$/.test(id) && typeof val === "string" && val.trim() !== ""
  );
  return entradas.length > 0 ? Object.fromEntries(entradas) : null;
};

const normalizarDetalleVenta = (detalle) => {
  const id_producto = normalizarIdOpcional(detalle.id_producto);
  if (!id_producto) throw new VentaValidationError("El producto de la venta no es válido.");

  const cantidad = normalizarNumero(detalle.cantidad, "cantidad", { minimo: 1, entero: true });
  const precio = normalizarNumero(detalle.precio ?? detalle.precio_unitario, "precio");
  const descuento = normalizarNumero(detalle.descuento ?? 0, "descuento");
  const total = normalizarNumero(
    detalle.total ?? detalle.precio_total ?? (cantidad * precio - descuento),
    "total"
  );

  return {
    id_producto,
    cantidad,
    precio,
    descuento,
    total,
    id_tonalidad: normalizarIdOpcional(detalle.id_tonalidad),
    id_talla: normalizarIdOpcional(detalle.id_talla),
    id_sku: normalizarIdOpcional(detalle.id_sku),
    // Mutuamente excluyente con id_sku: si el cajero eligió un SKU exacto, un
    // atributos_fijados que haya viajado junto (residual del cliente) se ignora.
    atributos_fijados: normalizarIdOpcional(detalle.id_sku) ? null : normalizarAtributosFijados(detalle.atributos_fijados),
  };
};

const normalizarIdempotencyKey = (valor) => {
  if (valor === undefined || valor === null || valor === "") return null;
  const clave = String(valor).trim();
  if (clave.length < 8 || clave.length > 64 || !/^[A-Za-z0-9._:-]+$/.test(clave)) {
    throw new VentaValidationError("La clave idempotente de la venta no es válida.");
  }
  return clave;
};

const buscarVentaPorIdempotencia = async (connection, id_tenant, idempotency_key) => {
  if (!idempotency_key) return null;

  const [ventas] = await connection.query(
    `
      SELECT v.id_venta, c.num_comprobante
      FROM venta v
      INNER JOIN comprobante c
        ON c.id_comprobante = v.id_comprobante AND c.id_tenant = v.id_tenant
      WHERE v.id_tenant = ? AND v.idempotency_key = ?
      LIMIT 1
    `,
    [id_tenant, idempotency_key]
  );

  return ventas[0] || null;
};

const obtenerSemillaCorrelativo = async (
  connection,
  { id_tenant, id_sucursal, id_tipocomprobante, prefijo }
) => {
  const serieBase = Number(id_sucursal) * 100;
  const serieLimite = serieBase + 99;
  const [comprobantes] = await connection.query(
    `
      SELECT c.num_comprobante
      FROM comprobante c
      WHERE c.id_tenant = ?
        AND c.id_tipocomprobante = ?
        AND LEFT(c.num_comprobante, 1) = ?
        AND c.num_comprobante REGEXP '^[A-Za-z][0-9]+-[0-9]{8}$'
        AND CAST(SUBSTRING(SUBSTRING_INDEX(c.num_comprobante, '-', 1), 2) AS UNSIGNED)
          BETWEEN ? AND ?
      ORDER BY
        CAST(SUBSTRING(SUBSTRING_INDEX(c.num_comprobante, '-', 1), 2) AS UNSIGNED) DESC,
        CAST(SUBSTRING_INDEX(c.num_comprobante, '-', -1) AS UNSIGNED) DESC
      LIMIT 1
    `,
    [id_tenant, id_tipocomprobante, prefijo, serieBase, serieLimite]
  );

  if (comprobantes.length === 0) {
    return { serie_num: serieBase, ultimo_numero: 0 };
  }

  const match = /^[A-Za-z](\d+)-(\d{8})$/.exec(comprobantes[0].num_comprobante);
  if (!match) throw new Error("El último comprobante tiene un formato inválido.");

  return { serie_num: Number(match[1]), ultimo_numero: Number(match[2]) };
};

const generarSiguienteComprobante = async (
  connection,
  { id_tenant, id_sucursal, id_tipocomprobante, prefijo }
) => {
  const paramsClave = [id_tenant, id_sucursal, id_tipocomprobante];
  const [correlativoExistente] = await connection.query(
    `
      SELECT 1
      FROM comprobante_correlativo
      WHERE id_tenant = ? AND id_sucursal = ? AND id_tipocomprobante = ?
      LIMIT 1
    `,
    paramsClave
  );

  if (correlativoExistente.length === 0) {
    const semilla = await obtenerSemillaCorrelativo(connection, {
      id_tenant,
      id_sucursal,
      id_tipocomprobante,
      prefijo,
    });

    await connection.query(
      `
        INSERT IGNORE INTO comprobante_correlativo
          (id_tenant, id_sucursal, id_tipocomprobante, serie_num, ultimo_numero)
        VALUES (?, ?, ?, ?, ?)
      `,
      [...paramsClave, semilla.serie_num, semilla.ultimo_numero]
    );
  }

  const [correlativos] = await connection.query(
    `
      SELECT serie_num, ultimo_numero
      FROM comprobante_correlativo
      WHERE id_tenant = ? AND id_sucursal = ? AND id_tipocomprobante = ?
      FOR UPDATE
    `,
    paramsClave
  );
  if (correlativos.length === 0) throw new Error("No se pudo inicializar el correlativo.");

  let serie = Number(correlativos[0].serie_num);
  let numero = Number(correlativos[0].ultimo_numero) + 1;
  if (numero > 99999999) {
    serie += 1;
    numero = 1;
  }

  const serieLimite = Number(id_sucursal) * 100 + 99;
  if (serie > serieLimite) {
    throw new Error("Se agotaron las series disponibles para esta sucursal.");
  }

  await connection.query(
    `
      UPDATE comprobante_correlativo
      SET serie_num = ?, ultimo_numero = ?
      WHERE id_tenant = ? AND id_sucursal = ? AND id_tipocomprobante = ?
    `,
    [serie, numero, ...paramsClave]
  );

  return `${prefijo}${String(serie).padStart(3, "0")}-${String(numero).padStart(8, "0")}`;
};

const annulVentaInternal = async (connection, id_venta, id_usuario, id_tenant, ip, comprobante, estadoSunat) => {
  // 1) Confirmar que la venta existe y pertenece al tenant
  const [detallesResult] = await connection.query(
    `
    SELECT dv.id_producto, dv.id_sku
    FROM detalle_venta dv
    INNER JOIN venta v ON v.id_venta = dv.id_venta
    WHERE dv.id_venta = ? AND v.id_tenant = ?
    `,
    [id_venta, id_tenant]
  );

  if (detallesResult.length === 0) {
    throw new Error("No hay detalles para la venta o no pertenece a este tenant");
  }

  // 2) Obtener sucursal y fecha, bloqueando la venta.
  // El `FOR UPDATE` no es decorativo: anular devuelve stock, así que hacerlo
  // dos veces lo devuelve dos veces e infla el inventario con mercadería que
  // no existe. Con el lock, dos anulaciones simultáneas se serializan y la
  // segunda encuentra `estado_venta = 0` y se detiene.
  const [ventaResult] = await connection.query(
    `
    SELECT id_sucursal, f_venta, estado_venta
    FROM venta
    WHERE id_venta = ? AND id_tenant = ?
    FOR UPDATE
    `,
    [id_venta, id_tenant]
  );
  if (ventaResult.length === 0) {
    throw new Error("Venta no encontrada");
  }
  if (Number(ventaResult[0].estado_venta) === 0) {
    throw new VentaValidationError("La venta ya estaba anulada; su stock ya fue devuelto.", 409);
  }
  const id_sucursal = ventaResult[0].id_sucursal;
  const f_venta = ventaResult[0].f_venta;

  // 3) Almacén de la sucursal
  const [almacenResult] = await connection.query(
    `SELECT id_almacen FROM sucursal_almacen WHERE id_sucursal = ?`,
    [id_sucursal]
  );
  if (almacenResult.length === 0) {
    throw new Error("No se encontró almacén para la sucursal");
  }
  const id_almacen = almacenResult[0].id_almacen;

  // 4) Restaurar stock desde la BITÁCORA, no desde detalle_venta: la venta pudo
  // repartirse entre varios SKU (`descontarPorProducto`) y ahí quedó registrado
  // cuánto salió de cada uno. Mismo patrón que notasalida.anularNota.
  const [salidas] = await connection.query(
    `SELECT id_producto, id_sku, id_tonalidad, id_talla, SUM(sale) AS unidades
     FROM bitacora_nota
     WHERE id_venta = ? AND id_tenant = ? AND sale > 0
     GROUP BY id_producto, id_sku, id_tonalidad, id_talla`,
    [id_venta, id_tenant]
  );

  // Ventas anteriores a esta migración no tienen bitácora con id_sku: se cae
  // al id_sku que quedó en detalle_venta para ese producto.
  const skuPorProducto = new Map(detallesResult.map((d) => [d.id_producto, d.id_sku ?? null]));

  for (const s of salidas) {
    const unidades = Number(s.unidades);
    if (!Number.isFinite(unidades) || unidades <= 0) continue;

    // Ventas de antes de este cambio no dejaron id_sku en ningún lado. Resolverlo
    // (o crear el SKU base si nunca existió) es legítimo aquí porque es una
    // ENTRADA de stock que se devuelve, no una venta fabricando inventario.
    let id_sku_mov = s.id_sku ?? skuPorProducto.get(s.id_producto) ?? null;
    if (!id_sku_mov) {
      id_sku_mov = await resolveSku(connection, s.id_producto, s.id_tonalidad, s.id_talla, id_tenant);
    }

    const movimiento = await sumarStockSku(connection, {
      id_tenant, id_sku: id_sku_mov, id_almacen, cantidad: unidades,
    });

    await connection.query(
      `
      INSERT INTO bitacora_nota (id_producto, id_sku, id_almacen, entra, stock_anterior, stock_actual, fecha, id_venta, id_tenant, id_tonalidad, id_talla)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [s.id_producto, id_sku_mov, id_almacen, unidades, movimiento.stockAnterior, movimiento.stockActual, f_venta, id_venta, id_tenant, s.id_tonalidad, s.id_talla]
    );
  }

  // 5) Anular venta
  await connection.query(
    `
    UPDATE venta
    SET estado_venta = ?, u_modifica = ?, fecha_anulacion = NOW()
    WHERE id_venta = ? AND id_tenant = ?
    `,
    [0, id_usuario, id_venta, id_tenant]
  );

  // Registrar log de anulación de venta
  const motivoAnulacion = `Anulación solicitada por usuario. Estado SUNAT: ${estadoSunat}, Comprobante: ${comprobante}`;
  await logVentas.anular(id_venta, id_usuario, ip, id_tenant, motivoAnulacion);
};

const createVentaInternal = async (connection, saleData, id_tenant) => {
  const {
    id_sucursal, id_almacen, id_comprobante, id_cliente, estado_venta,
    f_venta, igv, detalles, fecha_iso, metodo_pago, fecha,
    descuento_venta, vuelto, recibido, observacion, estado_sunat, idempotency_key,
    id_usuario, dni_vendedor, motivo_descuento, referencia_pago, puntos_canjeados
  } = saleData;

  const fechaVenta = f_venta || fecha;
  const fechaIsoVenta = fecha_iso || new Date().toISOString();
  const estadoVenta = estado_venta ?? 1;
  const estadoSunat = estado_sunat ?? 0;
  const observacionVenta = observacion || null;
  const recibidoVenta = normalizarNumero(recibido ?? 0, "recibido");
  const vueltoVenta = normalizarNumero(vuelto ?? 0, "vuelto");
  const descuentoVenta = normalizarNumero(descuento_venta ?? 0, "descuento_venta");
  // Control anti-fuga de margen: un descuento sin motivo queda invisible en
  // cualquier auditoría posterior. La autorización es implícita — el usuario
  // que registra la venta ya queda asociado por `id_usuario`/`dni_vendedor`.
  const motivoDescuentoVenta = String(motivo_descuento ?? "").trim() || null;
  if (descuentoVenta > 0 && !motivoDescuentoVenta) {
    throw new VentaValidationError("Debes indicar el motivo del descuento aplicado.");
  }

  // N° de operación de pagos digitales (Yape/Plin/tarjeta/depósito): objeto
  // plano { METODO: referencia }, se descartan claves vacías antes de guardar.
  let referenciaPagoVenta = null;
  if (referencia_pago && typeof referencia_pago === "object") {
    const limpio = Object.fromEntries(
      Object.entries(referencia_pago).filter(([, v]) => String(v ?? "").trim() !== "")
    );
    if (Object.keys(limpio).length > 0) referenciaPagoVenta = JSON.stringify(limpio);
  }
  const igvVenta = normalizarNumero(igv ?? 0, "igv");
  const detallesNormalizados = detalles
    .map(normalizarDetalleVenta)
    .sort((a, b) => (
      a.id_producto - b.id_producto ||
      (a.id_tonalidad || 0) - (b.id_tonalidad || 0) ||
      (a.id_talla || 0) - (b.id_talla || 0)
    ));
  const totalVenta = detallesNormalizados.reduce((suma, detalle) => suma + detalle.total, 0);
  const idempotencyKey = normalizarIdempotencyKey(idempotency_key);
  const esVentaACredito = String(metodo_pago).toUpperCase() === "CREDITO";

  // 0. Venta a crédito: requiere cliente y respeta su límite (si tiene uno configurado).
  if (esVentaACredito) {
    if (!id_cliente) {
      throw new VentaValidationError("Una venta a crédito requiere seleccionar un cliente.");
    }
    const [[cliente]] = await connection.query(
      "SELECT limite_credito FROM cliente WHERE id_cliente = ? AND id_tenant = ?",
      [id_cliente, id_tenant]
    );
    if (!cliente) throw new VentaValidationError("Cliente no encontrado.", 404);
    if (cliente.limite_credito != null) {
      const saldoActual = await saldoPendienteCliente(connection, { id_cliente, id_tenant });
      if (saldoActual + totalVenta > Number(cliente.limite_credito)) {
        throw new VentaValidationError(
          `Esta venta supera el límite de crédito del cliente (disponible: S/ ${(Number(cliente.limite_credito) - saldoActual).toFixed(2)}).`,
          409
        );
      }
    }
  }

  // 1. Generar Correlativo
  const [comprobanteResult] = await connection.query(
    `SELECT id_tipocomprobante, nom_tipocomp
     FROM tipo_comprobante
     WHERE nom_tipocomp = ? AND id_tenant = ?
     LIMIT 1`,
    [id_comprobante, id_tenant]
  );
  if (comprobanteResult.length === 0) throw new Error("Tipo de comprobante no encontrado.");
  const { id_tipocomprobante, nom_tipocomp } = comprobanteResult[0];
  const prefijoBase = nom_tipocomp.charAt(0);
  const nuevoNumComprobante = await generarSiguienteComprobante(connection, {
    id_tenant,
    id_sucursal,
    id_tipocomprobante,
    prefijo: prefijoBase,
  });

  // 2. Insertar Comprobante
  const [nuevoComprobanteResult] = await connection.query(
    "INSERT INTO comprobante (id_tipocomprobante, num_comprobante, id_tenant) VALUES (?, ?, ?)",
    [id_tipocomprobante, nuevoNumComprobante, id_tenant]
  );
  const id_comprobante_final = nuevoComprobanteResult.insertId;

  // 2.5. Resolver quién atendió (para comisión). Por defecto es quien cobra en
  // caja (id_usuario), pero el cajero puede atribuirla a otro vendedor de piso
  // — típico en retail cuando quien vende no es quien cobra. Se valida contra
  // `vendedor` del mismo tenant: nunca se confía en el DNI tal cual llega.
  let dniVendedor = null;
  if (dni_vendedor) {
    const [[vendedorElegido]] = await connection.query(
      "SELECT dni FROM vendedor WHERE dni = ? AND id_tenant = ? AND estado_vendedor = 1",
      [dni_vendedor, id_tenant]
    );
    dniVendedor = vendedorElegido?.dni ?? null;
  }
  if (!dniVendedor && id_usuario) {
    const [[vendedorRow]] = await connection.query(
      "SELECT dni FROM vendedor WHERE id_usuario = ? AND id_tenant = ?",
      [id_usuario, id_tenant]
    );
    dniVendedor = vendedorRow?.dni ?? null;
  }

  // 3. Insertar Venta
  // id_anular / id_anular_b removed/ignored.
  const [ventaResult] = await connection.query(
    "INSERT INTO venta (id_comprobante, id_cliente, id_sucursal, estado_venta, f_venta, igv, fecha_iso, metodo_pago, observacion, estado_sunat, id_tenant, idempotency_key, recibido, vuelto, descuento_global, dni_vendedor, motivo_descuento, referencia_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [id_comprobante_final, id_cliente, id_sucursal, estadoVenta, fechaVenta, igvVenta, fechaIsoVenta, metodo_pago, observacionVenta, estadoSunat, id_tenant, idempotencyKey, recibidoVenta, vueltoVenta, descuentoVenta, dniVendedor, motivoDescuentoVenta, referenciaPagoVenta]
  );
  const id_venta = ventaResult.insertId;

  // 3.1. Venta a crédito: registrar la cuenta por cobrar (vencimiento a 30 días).
  if (esVentaACredito) {
    await connection.query(
      `INSERT INTO cuenta_por_cobrar (id_venta, id_cliente, id_tenant, monto_total, saldo, fecha_vencimiento, estado)
       VALUES (?, ?, ?, ?, ?, DATE_ADD(?, INTERVAL 30 DAY), 'pendiente')`,
      [id_venta, id_cliente, id_tenant, totalVenta, totalVenta, fechaVenta]
    );
  }

  // 3.5. Validar los id_sku que mandó el cliente.
  // `restarStockSku` filtra por (id_tenant, id_sku, id_almacen) y nunca por
  // id_producto: sin este chequeo, una línea con el id_producto de A y el
  // id_sku de B cobra el precio de A y descuenta el stock de B, dejando
  // además un par imposible en detalle_venta y en el kardex.
  const skusPedidos = [...new Set(detallesNormalizados.map((d) => d.id_sku).filter(Boolean))];
  if (skusPedidos.length > 0) {
    const [skusValidos] = await connection.query(
      `SELECT id_sku, id_producto FROM producto_sku
       WHERE id_tenant = ? AND id_sku IN (${skusPedidos.map(() => "?").join(",")})`,
      [id_tenant, ...skusPedidos]
    );
    const productoDelSku = new Map(skusValidos.map((s) => [s.id_sku, s.id_producto]));
    for (const detalle of detallesNormalizados) {
      if (!detalle.id_sku) continue;
      const dueño = productoDelSku.get(detalle.id_sku);
      if (dueño === undefined) {
        throw new VentaValidationError(`La variante ${detalle.id_sku} no existe.`, 400);
      }
      if (dueño !== detalle.id_producto) {
        throw new VentaValidationError(
          `La variante ${detalle.id_sku} no pertenece al producto ${detalle.id_producto}.`, 400
        );
      }
    }
  }

  // 3.6. Combos: qué productos de la venta son combos y de qué se componen.
  // Un combo no tiene stock propio — al venderlo se descuenta cada componente.
  const idsProductoVenta = [...new Set(detallesNormalizados.map((d) => d.id_producto))];
  const [combosDeLaVenta] = idsProductoVenta.length > 0
    ? await connection.query(
        `SELECT id_producto FROM producto WHERE id_tenant = ? AND es_combo = 1 AND id_producto IN (${idsProductoVenta.map(() => "?").join(",")})`,
        [id_tenant, ...idsProductoVenta]
      )
    : [[]];
  const idsCombo = new Set(combosDeLaVenta.map((c) => c.id_producto));
  const comboItemsMap = await getComboItemsPorProductos(connection, {
    id_tenant, ids_producto_combo: [...idsCombo],
  });

  // 4. Insertar Detalles y Actualizar Stock
  const detalleVentaValues = [];
  const detalleVentaParams = [];
  const bitacoraValues = [];
  const bitacoraParams = [];
  // Qué SKU tocó cada línea: se necesita después para fotografiar su costo.
  const lineas = [];

  for (const detalle of detallesNormalizados) {
    const { id_producto, cantidad, precio, descuento, total, id_tonalidad, id_talla, id_sku, atributos_fijados } = detalle;
    const id_ton = id_tonalidad || null;
    const id_tal = id_talla || null;
    const esCombo = idsCombo.has(id_producto);

    let movimientos;
    let comboDetalle = null; // solo para combos: movimientos agrupados por componente, para el costo ponderado
    try {
      if (esCombo) {
        const items = comboItemsMap.get(id_producto) || [];
        if (items.length === 0) {
          throw new VentaValidationError(`El combo ${id_producto} no tiene componentes configurados.`, 409);
        }
        comboDetalle = [];
        movimientos = [];
        for (const item of items) {
          const movsComponente = await descontarPorProducto(connection, {
            id_tenant, id_producto: item.id_producto_componente, id_almacen,
            cantidad: cantidad * item.cantidad,
            descripcion: `combo ${id_producto} → componente ${item.id_producto_componente}`,
          });
          // Se marca cada movimiento con el producto real que perdió stock:
          // el kardex del combo debe verse en el componente, no en el combo.
          const movsConProducto = movsComponente.map((m) => ({ ...m, id_producto: item.id_producto_componente }));
          comboDetalle.push({ cantidadPorCombo: item.cantidad, movimientos: movsConProducto });
          movimientos.push(...movsConProducto);
        }
      } else if (id_sku) {
        // Si el POS mandó un id_sku (producto con variante elegida), se descuenta
        // exactamente ese SKU.
        movimientos = [{ ...(await restarStockSku(connection, { id_tenant, id_sku, id_almacen, cantidad })), cantidad }];
      } else if (atributos_fijados) {
        // Fase B: el cajero vendió sobre una "variante colapsada" (ej. talla M,
        // cualquier color) en vez de un SKU exacto. Se reparte solo entre los
        // SKU que matchean los atributos fijados — mismo motor de reparto que
        // el pool completo, acotado.
        movimientos = await descontarPorProducto(connection, {
          id_tenant, id_producto, id_almacen, cantidad, atributosFijados: atributos_fijados,
          descripcion: `producto ${id_producto} (variante colapsada)`,
        });
      } else {
        // Si no, se reparte entre los SKU del producto — mismo camino que ya
        // usan notas/guías.
        movimientos = await descontarPorProducto(connection, {
          id_tenant, id_producto, id_almacen, cantidad,
          descripcion: `producto ${id_producto}`,
        });
      }
    } catch (error) {
      if (esErrorDeStock(error)) throw new VentaValidationError(error.message, 409);
      throw error;
    }

    // detalle_venta se arma DESPUÉS del bucle: el costo de la línea depende de
    // qué SKU tocó, y resolverlo acá dispararía una consulta por línea.
    // `id_sku` refleja lo que eligió el usuario; si no eligió variante queda
    // NULL aunque el reparto haya tocado uno o más SKU (igual que en notas).
    lineas.push({ id_producto, cantidad, precio, descuento, total, id_ton, id_tal, id_sku, movimientos, comboDetalle });

    // bitacora_nota: una fila por SKU realmente tocado, para que la anulación
    // devuelva las unidades exactas a donde salieron. Un movimiento de combo
    // trae su propio `id_producto` (el componente); el resto usa el de la línea.
    for (const mov of movimientos) {
      bitacoraValues.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      bitacoraParams.push(
        mov.id_producto ?? id_producto, mov.id_sku, id_almacen, mov.cantidad, mov.stockAnterior, mov.stockActual,
        fechaVenta, id_venta, id_tenant, id_ton, id_tal
      );
    }
  }

  // Foto del costo al momento de vender. Es una foto y no una referencia a
  // propósito: si mañana sube el proveedor, el margen de la venta de hoy no
  // puede cambiar retroactivamente. Una sola consulta para toda la venta.
  const costoPorSku = await obtenerCostosVigentes(connection, {
    id_tenant,
    idsSku: lineas.flatMap((l) => l.movimientos.map((m) => m.id_sku)),
  });

  // Snapshot de atributos: copia literal de { id_atributo, nombre, valor } al
  // momento de vender. `producto_sku.attributes_json` no se edita nunca después
  // de crear el SKU, pero `atributo.nombre`/`atributo_valor.valor` SÍ se pueden
  // renombrar más adelante — sin esta copia, una venta vieja mostraría el
  // nombre nuevo en vez del que el cliente realmente vio al comprar.
  const idsSkuConVariante = [...new Set(lineas.filter((l) => l.id_sku).map((l) => l.id_sku))];
  const snapshotPorSku = new Map();
  if (idsSkuConVariante.length > 0) {
    const [skuRows] = await connection.query(
      `SELECT id_sku, attributes_json FROM producto_sku WHERE id_sku IN (?) AND id_tenant = ?`,
      [idsSkuConVariante, id_tenant]
    );
    const attrsPorSku = skuRows.map((r) => ({
      id_sku: r.id_sku,
      attrs: typeof r.attributes_json === "string" ? JSON.parse(r.attributes_json || "{}") : (r.attributes_json || {}),
    }));
    const idsAtributo = [...new Set(attrsPorSku.flatMap((r) => Object.keys(r.attrs).map(Number)))];
    const [attrRows] = idsAtributo.length
      ? await connection.query(`SELECT id_atributo, nombre FROM atributo WHERE id_atributo IN (?)`, [idsAtributo])
      : [[]];
    const nombrePorAtributo = new Map(attrRows.map((a) => [a.id_atributo, a.nombre]));

    for (const { id_sku, attrs } of attrsPorSku) {
      const snapshot = Object.entries(attrs).map(([idAtributo, valor]) => ({
        id_atributo: Number(idAtributo),
        nombre: nombrePorAtributo.get(Number(idAtributo)) ?? null,
        valor,
      }));
      snapshotPorSku.set(id_sku, snapshot);
    }
  }

  for (const l of lineas) {
    // Un combo no promedia como una línea normal (mezclaría el costo de
    // productos distintos en distintas cantidades): su costo unitario es la
    // suma de (costo de cada componente × cuántos entran en un combo).
    const costo = l.comboDetalle
      ? costoDeCombo({ comboDetalle: l.comboDetalle, costoPorSku })
      : costoDeLineaRepartida({ movimientos: l.movimientos, costoPorSku }).costo;
    const atributosSnapshot = l.id_sku ? JSON.stringify(snapshotPorSku.get(l.id_sku) ?? []) : null;
    detalleVentaValues.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    detalleVentaParams.push(
      l.id_producto, id_venta, l.cantidad, l.precio, l.descuento, l.total,
      id_tenant, l.id_ton, l.id_tal, l.id_sku, costo, atributosSnapshot
    );
  }

  if (detalleVentaValues.length > 0) {
    await connection.query(
      `INSERT INTO detalle_venta (id_producto, id_venta, cantidad, precio, descuento, total, id_tenant, id_tonalidad, id_talla, id_sku, costo_unitario, atributos_snapshot) VALUES ${detalleVentaValues.join(', ')}`,
      detalleVentaParams
    );
  }

  if (bitacoraValues.length > 0) {
    await connection.query(
      `INSERT INTO bitacora_nota (id_producto, id_sku, id_almacen, sale, stock_anterior, stock_actual, fecha, id_venta, id_tenant, id_tonalidad, id_talla) VALUES ${bitacoraValues.join(', ')}`,
      bitacoraParams
    );
  }

  // 5. (Removed) Insertar Venta Boucher & Update
  // 6. (Removed) Insertar Detalles Boucher

  // 7. Club de Puntos: el descuento del canje ya está aplicado al total (vía
  // `descuento_global`, calculado en el frontend) — acá solo se mueve el
  // saldo y se audita. Ganar puntos nunca puede tumbar la venta; canjear de
  // más que el saldo disponible sí (mismo criterio que el stock).
  try {
    if (Number(puntos_canjeados) > 0) {
      await canjearPuntos(connection, { id_tenant, id_cliente, id_venta, puntos: Math.floor(Number(puntos_canjeados)) });
    }
    if (id_cliente) {
      await acumularPuntos(connection, { id_tenant, id_cliente, id_venta, totalVenta });
    }
  } catch (error) {
    if (error instanceof PuntosInsuficientesError) {
      throw new VentaValidationError(error.message, error.statusCode);
    }
    throw error;
  }

  return { id_venta, num_comprobante: nuevoNumComprobante, total_venta: totalVenta };
};


const getVentas = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();

    // Paginación y tenant
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 100), 500);
    const offset = (page - 1) * limit;
    const id_tenant = req.id_tenant;

    let where = [];
    let params = [];

    if (id_tenant) {
      where.push("v.id_tenant = ?");
      params.push(id_tenant);
    }

    if (req.query.fecha_inicio) {
      where.push("v.f_venta >= ?");
      params.push(req.query.fecha_inicio);
    }
    if (req.query.fecha_fin) {
      where.push("v.f_venta <= ?");
      params.push(req.query.fecha_fin);
    }
    if (req.query.id_comprobante) {
      if (req.query.id_comprobante === "Nota") {
        where.push("tp.nom_tipocomp = 'Nota de venta'");
      } else {
        where.push("tp.nom_tipocomp = ?");
        params.push(req.query.id_comprobante);
      }
    }
    if (req.query.estado !== undefined && req.query.estado !== '') {
      where.push("v.estado_venta = ?");
      params.push(parseInt(req.query.estado, 10));
    }
    if (req.query.dni_vendedor) {
      where.push("v.dni_vendedor = ?");
      params.push(req.query.dni_vendedor);
    }

    // Armar cláusula WHERE
    let whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Consulta principal con detalles agregados
    const ventasQuery = `
      SELECT
        v.id_venta AS id,
        SUBSTRING(com.num_comprobante, 2, 3) AS serieNum,
        SUBSTRING(com.num_comprobante, 6, 8) AS num,
        CASE WHEN tp.nom_tipocomp = 'Nota de venta' THEN 'Nota' ELSE tp.nom_tipocomp END AS tipoComprobante,
        CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_n,
        cl.razon_social AS cliente_r,
        cl.dni AS dni,
        cl.ruc AS ruc,
        DATE_FORMAT(v.f_venta, '%Y-%m-%d') AS fecha,
        v.igv AS igv,
        SUM(dv.total) AS total,
        CONCAT(ve.nombres, ' ', ve.apellidos) AS cajero,
        ve.dni AS cajeroId,
        v.estado_venta AS estado,
        s.nombre_sucursal,
        s.id_sucursal,
        s.ubicacion,
        cl.direccion,
        v.fecha_iso,
        v.metodo_pago,
        v.recibido,
        v.vuelto,
        v.descuento_global as descuento,
        v.motivo_descuento,
        v.referencia_pago,
        v.estado_sunat,
        usu.usua,
        v.observacion,
        v.hora_creacion,
        v.fecha_anulacion,
        (SELECT usu.usua FROM usuario usu WHERE usu.id_usuario = v.u_modifica) AS u_modifica,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'codigo', dv.id_detalle,
            'id_producto', pr.id_producto,
            'nombre', pr.descripcion,
            'cantidad', dv.cantidad,
            'precio', dv.precio,
            'descuento', dv.descuento,
            'subtotal', dv.total,
            'undm', pr.undm,
            'marca', m.nom_marca,
            'tonalidad', ton.nombre,
            'nombre_tonalidad', ton.nombre,
            'talla', tal.nombre,
            'nombre_talla', tal.nombre,
            'sku_label', ps.sku,
            'attributes', ps.attributes_json
          )
        ) AS detalles
      FROM venta v
        INNER JOIN comprobante com ON com.id_comprobante = v.id_comprobante
        INNER JOIN tipo_comprobante tp ON tp.id_tipocomprobante = com.id_tipocomprobante
        LEFT JOIN cliente cl ON cl.id_cliente = v.id_cliente AND cl.id_tenant = v.id_tenant
        INNER JOIN detalle_venta dv ON dv.id_venta = v.id_venta
        INNER JOIN producto pr ON pr.id_producto = dv.id_producto
        INNER JOIN marca m ON m.id_marca = pr.id_marca
        LEFT JOIN tonalidad ton ON ton.id_tonalidad = dv.id_tonalidad
        LEFT JOIN talla tal ON tal.id_talla = dv.id_talla
        LEFT JOIN producto_sku ps ON ps.id_sku = dv.id_sku
        INNER JOIN sucursal s ON s.id_sucursal = v.id_sucursal AND s.id_tenant = v.id_tenant
        INNER JOIN vendedor ve ON ve.dni = s.dni AND ve.id_tenant = v.id_tenant
        INNER JOIN usuario usu ON usu.id_usuario = ve.id_usuario AND usu.id_tenant = v.id_tenant
      ${whereClause}
      GROUP BY v.id_venta
      ORDER BY v.id_venta DESC
      LIMIT ? OFFSET ?
    `;

    const finalParams = [...params, limit, offset];
    const [ventasResult] = await connection.query(ventasQuery, finalParams);

    // Parsear detalles JSON
    const ventas = ventasResult.map(venta => ({
      ...venta,
      detalles: Array.isArray(venta.detalles)
        ? venta.detalles
        : JSON.parse(venta.detalles || "[]")
    }));

    res.json({ code: 1, data: ventas });
  } catch (error) {
    console.error('Error en getVentas:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};

// Búsqueda liviana por comprobante/cliente — para el buscador global (⌘K).
// No usa los joins pesados de getVentas: solo lo mínimo para mostrar un resultado.
const buscarVentas = async (req, res) => {
  let connection;
  try {
    const id_tenant = req.id_tenant;
    const q = String(req.query.q ?? "").trim();
    if (q.length < 2) return res.json({ code: 1, data: [] });

    connection = await getConnection();
    const like = `%${q}%`;

    const [rows] = await connection.query(
      `SELECT
         v.id_venta,
         com.num_comprobante,
         COALESCE(cl.razon_social, CONCAT(cl.nombres, ' ', cl.apellidos)) AS cliente,
         DATE_FORMAT(v.f_venta, '%Y-%m-%d') AS fecha,
         (SELECT COALESCE(SUM(dv.total), 0) FROM detalle_venta dv WHERE dv.id_venta = v.id_venta) AS total
       FROM venta v
       INNER JOIN comprobante com ON com.id_comprobante = v.id_comprobante AND com.id_tenant = v.id_tenant
       LEFT JOIN cliente cl ON cl.id_cliente = v.id_cliente
       WHERE v.id_tenant = ?
         AND v.estado_venta != 0
         AND (com.num_comprobante LIKE ? OR cl.nombres LIKE ? OR cl.apellidos LIKE ? OR cl.razon_social LIKE ?)
       ORDER BY v.f_venta DESC
       LIMIT 5`,
      [id_tenant, like, like, like, like]
    );

    res.json({ code: 1, data: rows });
  } catch (error) {
    console.error('Error en buscarVentas:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) connection.release();
  }
};


const generarComprobante = async (req, res) => {
  let connection;
  try {
    const { id_comprobante, usuario } = req.query;
    const id_tenant = req.id_tenant;

    connection = await getConnection();

    // Obtener id_sucursal basado en el usuario y el tenant
    let sucursalQuery = `
      SELECT su.id_sucursal 
      FROM sucursal su 
      INNER JOIN vendedor ve ON ve.dni = su.dni 
      INNER JOIN usuario u ON u.id_usuario = ve.id_usuario 
      WHERE u.usua =? `;
    let sucursalParams = [usuario];
    if (id_tenant) {
      sucursalQuery += " AND su.id_tenant = ?";
      sucursalParams.push(id_tenant);
    }
    const [sucursalResult] = await connection.query(sucursalQuery, sucursalParams);

    if (sucursalResult.length === 0) {
      throw new Error("Sucursal not found for the given user.");
    }

    const id_sucursal = sucursalResult[0].id_sucursal;

    // Obtener id_tipocomprobante y nom_tipocomp basado en el nombre del comprobante
    const [comprobanteResult] = await connection.query(
      "SELECT id_tipocomprobante, nom_tipocomp FROM tipo_comprobante WHERE nom_tipocomp=?",
      [id_comprobante]
    );

    if (comprobanteResult.length === 0) {
      throw new Error("Comprobante type not found.");
    }

    const { nom_tipocomp } = comprobanteResult[0];
    const prefijoBase = nom_tipocomp.charAt(0);

    // Obtener la última venta para verificar el estado (filtrando por tenant si existe)
    let ultimaVentaQuery = `
      SELECT num_comprobante, estado_venta, estado_sunat 
      FROM venta v 
      INNER JOIN comprobante c ON c.id_comprobante = v.id_comprobante 
      INNER JOIN tipo_comprobante tp ON tp.id_tipocomprobante = c.id_tipocomprobante 
      INNER JOIN sucursal s ON s.id_sucursal = v.id_sucursal
      WHERE tp.nom_tipocomp = ? AND v.id_sucursal = ? `;
    let ultimaVentaParams = [id_comprobante, id_sucursal];
    if (id_tenant) {
      ultimaVentaQuery += " AND s.id_tenant = ?";
      ultimaVentaParams.push(id_tenant);
    }
    ultimaVentaQuery += " ORDER BY v.id_venta DESC LIMIT 1";
    const [ultimaVentaResult] = await connection.query(ultimaVentaQuery, ultimaVentaParams);

    let nuevoNumComprobante;

    if (ultimaVentaResult.length > 0) {
      const ultimaVenta = ultimaVentaResult[0];
      if (ultimaVenta.estado_venta === 0 && ultimaVenta.estado_sunat != 1) {
        // Usar el mismo comprobante si el estado es 0
        nuevoNumComprobante = ultimaVenta.num_comprobante;
      } else {
        // Obtener el último número de comprobante y generar el siguiente (filtrando por tenant si existe)
        let ultimoComprobanteQuery = `
          SELECT num_comprobante 
          FROM comprobante c 
          INNER JOIN tipo_comprobante tp ON c.id_tipocomprobante = tp.id_tipocomprobante 
          INNER JOIN sucursal s ON s.id_sucursal = ?
      WHERE tp.nom_tipocomp = ? AND num_comprobante LIKE ? `;
        let ultimoComprobanteParams = [id_sucursal, id_comprobante, `${prefijoBase}${id_sucursal}%`];
        if (id_tenant) {
          ultimoComprobanteQuery += " AND s.id_tenant = ?";
          ultimoComprobanteParams.push(id_tenant);
        }
        ultimoComprobanteQuery += " ORDER BY num_comprobante DESC LIMIT 1";
        const [ultimoComprobanteResult] = await connection.query(ultimoComprobanteQuery, ultimoComprobanteParams);

        if (ultimoComprobanteResult.length > 0) {
          const ultimoNumComprobante = ultimoComprobanteResult[0].num_comprobante;
          const partes = ultimoNumComprobante.split("-");
          const serie = partes[0].substring(1);
          const numero = parseInt(partes[1], 10) + 1;

          if (numero > 99999999) {
            const nuevaSerie = (parseInt(serie, 10) + 1).toString().padStart(3, "0");
            nuevoNumComprobante = `${prefijoBase}${nuevaSerie}-00000001`;
          } else {
            nuevoNumComprobante = `${prefijoBase}${serie}-${numero.toString().padStart(8, "0")}`;
          }
        } else {
          nuevoNumComprobante = `${prefijoBase}${id_sucursal}00-00000001`;
        }
      }
    } else {
      nuevoNumComprobante = `${prefijoBase}${id_sucursal}00-00000001`;
    }

    res.json({ nuevoNumComprobante });
  } catch (error) {
    console.error('Error en generarComprobante:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getProductosVentas = async (req, res) => {
  let connection;
  try {
    const { id_sucursal, id_almacen } = req.query;
    const id_tenant = req.id_tenant;
    connection = await getConnection();

    // Resolver a qué almacén(es) filtrar el stock. La tabla `inventario`
    // (legacy) quedó vacía tras la migración a `inventario_stock` — el stock
    // real hoy se consulta vía stockRepository (Única puerta a inventario_stock).
    let almacenFiltro = null;
    if (id_almacen && !isNaN(id_almacen)) {
      almacenFiltro = Number(id_almacen);
    } else if (id_sucursal && !isNaN(id_sucursal)) {
      const [rows] = await connection.query(
        `SELECT sa.id_almacen FROM sucursal_almacen sa WHERE sa.id_sucursal = ?`,
        [id_sucursal]
      );
      almacenFiltro = rows.map((r) => r.id_almacen);
    } else if (id_sucursal) {
      // id_sucursal como string (legacy): buscar por usuario → vendedor → sucursal → almacén.
      const [rows] = await connection.query(
        `SELECT sa.id_almacen
         FROM sucursal_almacen sa
           INNER JOIN sucursal su  ON su.id_sucursal = sa.id_sucursal
           INNER JOIN vendedor ven ON ven.dni         = su.dni
           INNER JOIN usuario us   ON us.id_usuario   = ven.id_usuario
         WHERE us.usua = ?`,
        [id_sucursal]
      );
      almacenFiltro = rows.map((r) => r.id_almacen);
    }

    // Catálogo base (sin stock): productos activos del tenant.
    const [productos] = await connection.query(
      `
      SELECT
        PR.id_producto        AS codigo,
        PR.descripcion        AS nombre,
        CAST(PR.precio AS DECIMAL(10, 2)) AS precio,
        PR.undm,
        MA.nom_marca,
        CA.nom_subcat         AS categoria_p,
        PR.cod_barras         AS codigo_barras,
        PR.stock_min,
        PR.tipo_afectacion_igv,
        PR.es_combo,
        EXISTS(
          SELECT 1 FROM producto_sku sk
          WHERE sk.id_producto = PR.id_producto AND sk.id_tenant = PR.id_tenant AND sk.estado = 1
        ) AS tiene_variantes
      FROM producto PR
        INNER JOIN marca MA         ON MA.id_marca         = PR.id_marca
        INNER JOIN sub_categoria CA ON CA.id_subcategoria  = PR.id_subcategoria
      WHERE PR.estado_producto = 1
        AND PR.id_tenant       = ?
      ORDER BY nombre
      `,
      [id_tenant]
    );

    const combosIds = productos.filter((p) => p.es_combo).map((p) => p.codigo);
    const idsProductosNormales = productos.filter((p) => !p.es_combo).map((p) => p.codigo);

    // El stock de un combo no vive en `inventario_stock`: es el mínimo de
    // "combos armables" según el stock disponible de sus componentes.
    const [stockMap, comboStockMap] = await Promise.all([
      stockPorProducto(connection, { id_tenant, id_almacen: almacenFiltro, ids_producto: idsProductosNormales }),
      disponibilidadCombos(connection, { id_tenant, ids_producto_combo: combosIds, id_almacen: almacenFiltro }),
    ]);

    const result = productos
      .map((p) => ({
        ...p,
        stock: p.es_combo ? (comboStockMap.get(p.codigo) ?? 0) : (stockMap.get(p.codigo) ?? 0),
        tiene_variantes: Boolean(p.tiene_variantes),
        es_combo: Boolean(p.es_combo),
      }))
      .filter((p) => p.stock > 0);

    res.json({ code: 1, data: result, message: "Productos listados" });
  } catch (error) {
    console.error('Error en ventas getProductosVentas:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getEstado = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const { id_venta } = req.body;
    const id_tenant = req.id_tenant;

    await connection.beginTransaction();

    // Actualizar estado solo si coincide el id_tenant
    await connection.query(
      "UPDATE venta SET estado_venta=1, estado_sunat=1 WHERE id_venta=? AND id_tenant=?",
      [id_venta, id_tenant]
    );

    await connection.commit();
    res.json({ message: "Ventas actualizada correctamente" });
  } catch (error) {
    console.error('Error en ventas:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getComprobante = async (req, res) => {
  const id_tenant = req.id_tenant;
  const cacheKey = `comprobantes_${id_tenant} `;

  // Verificar caché
  if (queryCache.has(cacheKey)) {
    const cached = queryCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json({ code: 1, data: cached.data, message: "Comprobantes listados (caché)" });
    }
    queryCache.delete(cacheKey);
  }

  let connection;
  try {
    connection = await getConnection();
    let query = `
      SELECT id_tipocomprobante AS id,
      CASE WHEN nom_tipocomp = 'Nota de venta' THEN 'Nota' ELSE nom_tipocomp END as nombre 
      FROM tipo_comprobante 
      WHERE nom_tipocomp NOT LIKE 'Guia de remision' 
        AND nom_tipocomp NOT LIKE 'Nota de credito' 
        AND nom_tipocomp NOT LIKE 'Nota de ingreso' 
        AND nom_tipocomp NOT LIKE 'Nota de Salida'
    `;
    let params = [];
    if (id_tenant) {
      query += " AND id_tenant = ?";
      params.push(id_tenant);
    }
    query += " ORDER BY nom_tipocomp";

    const [result] = await connection.query(query, params);

    // Guardar en caché
    queryCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    res.json({ code: 1, data: result, message: "Comprobantes listados" });
  } catch (error) {
    console.error('Error en getComprobante:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getLastVenta = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const id_tenant = req.id_tenant;
    let query = `SELECT id_venta + 1 as id FROM venta`;
    let params = [];
    if (id_tenant) {
      query += ` WHERE id_tenant = ? `;
      params.push(id_tenant);
    }
    query += ` ORDER BY id_venta DESC LIMIT 1`;
    const [result] = await connection.query(query, params);
    res.json({ code: 1, data: result, message: "Comprobante listados" });
  } catch (error) {
    console.error('Error en ventas:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getSucursal = async (req, res) => {
  const id_tenant = req.id_tenant;
  const cacheKey = `sucursales_ventas_${id_tenant} `;

  // Verificar caché
  if (queryCache.has(cacheKey)) {
    const cached = queryCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json({ code: 1, data: cached.data, message: "Sucursales listadas (caché)" });
    }
    queryCache.delete(cacheKey);
  }

  let connection;
  try {
    connection = await getConnection();
    let query = `
      SELECT su.id_sucursal AS id, su.nombre_sucursal AS nombre, su.ubicacion AS ubicacion, usu.usua As usuario, ro.nom_rol AS rol
      FROM sucursal su
      INNER JOIN vendedor ven ON ven.dni = su.dni
      INNER JOIN usuario usu ON usu.id_usuario = ven.id_usuario
      INNER JOIN rol ro ON ro.id_rol = usu.id_rol
      WHERE su.estado_sucursal != 0
        AND su.id_sucursal = (
      SELECT MIN(s2.id_sucursal)
          FROM sucursal s2
          WHERE s2.nombre_sucursal = su.nombre_sucursal
        )
`;
    let params = [];
    if (id_tenant) {
      query += ` AND su.id_tenant = ? `;
      params.push(id_tenant);
    }
    query += " ORDER BY su.nombre_sucursal";

    const [result] = await connection.query(query, params);

    // Guardar en caché
    queryCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    res.json({ code: 1, data: result, message: "Sucursales listadas" });
  } catch (error) {
    console.error('Error en ventas:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getClienteVentas = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const id_tenant = req.id_tenant;
    let query = `
      SELECT 
        id_cliente AS id,
  COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) AS cliente_t,
    COALESCE(NULLIF(dni, ''), ruc) AS documento_t,
      direccion AS direccion_t
FROM
cliente
WHERE
  (
    (nombres IS NOT NULL AND nombres <> '' AND apellidos IS NOT NULL AND apellidos <> '')
OR
  (razon_social IS NOT NULL AND razon_social <> '')
        )
`;
    let params = [];
    if (id_tenant) {
      query += ` AND id_tenant = ? `;
      params.push(id_tenant);
    }
    query += `
      ORDER BY
  (CASE 
            WHEN COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) = 'Clientes Varios' THEN 0 
            ELSE 1 
         END),
  cliente_t
    `;
    const [result] = await connection.query(query, params);

    // Guardar en caché
    queryCache.set(`clientes_ventas_${id_tenant} `, {
      data: result,
      timestamp: Date.now()
    });

    res.json({ code: 1, data: result, message: "Clientes listados" });
  } catch (error) {
    console.error('Error en getClienteVentas:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const addVenta = async (req, res) => {
  let connection;
  let transactionStarted = false;
  let idTenantRequest = null;
  let idempotencyKey = null;
  try {
    const body = req.body;
    const id_tenant = normalizarIdOpcional(req.id_tenant);
    idTenantRequest = id_tenant;
    idempotencyKey = normalizarIdempotencyKey(body.idempotency_key);
    const id_usuario_autenticado = normalizarIdOpcional(req.user?.id_usuario);
    const { id_comprobante, id_cliente, detalles } = body;

    if (!id_tenant || !id_usuario_autenticado) {
      return res.status(401).json({ code: 0, message: "Sesión de usuario inválida." });
    }
    if (!id_comprobante || !Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({ code: 0, message: "Faltan datos requeridos." });
    }

    connection = await getConnection();

    const ventaExistente = await buscarVentaPorIdempotencia(
      connection,
      id_tenant,
      idempotencyKey
    );
    if (ventaExistente) {
      return res.json({
        code: 1,
        success: true,
        message: "Venta ya registrada",
        id_venta: ventaExistente.id_venta,
        num_comprobante: ventaExistente.num_comprobante,
        idempotent_replay: true,
      });
    }

    await connection.beginTransaction();
    transactionStarted = true;

    // Resolver la sucursal desde el usuario autenticado. Nunca se confía en el
    // nombre de usuario o tenant enviados por el cliente.
    const [sucursalResult] = await connection.query(
      `SELECT su.id_sucursal, u.id_usuario, su.id_tenant AS db_tenant_id
       FROM usuario u
       INNER JOIN vendedor ve
         ON ve.id_usuario = u.id_usuario AND ve.id_tenant = u.id_tenant
       INNER JOIN sucursal su
         ON su.dni = ve.dni AND su.id_tenant = u.id_tenant
       WHERE u.id_usuario = ? AND u.id_tenant = ? AND u.estado_usuario = 1
       ORDER BY su.id_sucursal
       LIMIT 1`,
      [id_usuario_autenticado, id_tenant]
    );
    if (sucursalResult.length === 0) {
      throw new VentaValidationError("El usuario no tiene una sucursal activa asignada.", 403);
    }
    const { id_sucursal, id_usuario, db_tenant_id } = sucursalResult[0];

    // Validar que el almacén seleccionado pertenezca a la sucursal y al tenant.
    const almacenSolicitado = normalizarIdOpcional(body.id_almacen);
    let almacenQuery = `
      SELECT id_almacen
      FROM sucursal_almacen
      WHERE id_sucursal = ? AND id_tenant = ?`;
    const almacenParams = [id_sucursal, id_tenant];
    if (almacenSolicitado) {
      almacenQuery += " AND id_almacen = ?";
      almacenParams.push(almacenSolicitado);
    }
    almacenQuery += " ORDER BY id_almacen LIMIT 1";

    const [almacenResult] = await connection.query(almacenQuery, almacenParams);
    if (almacenResult.length === 0) {
      throw new VentaValidationError("El almacén seleccionado no pertenece a la sucursal.");
    }
    const id_almacen = almacenResult[0].id_almacen;

    // Cliente
    let id_cliente_final = null;
    if (id_cliente === null || id_cliente === undefined || Number(id_cliente) === 0) {
      id_cliente_final = null;
    } else if (typeof id_cliente === 'string' && id_cliente.startsWith('EXT-')) {
      const externalId = normalizarIdOpcional(id_cliente.replace('EXT-', ''));
      if (!externalId) throw new VentaValidationError("El cliente externo no es válido.");

      const [externalClient] = await connection.query(
        `SELECT dni, nombres, apellidos, direccion
         FROM tesis_db.cliente
         WHERE id_cliente = ? AND id_tenant = ?`,
        [externalId, id_tenant]
      );

      if (!externalClient || externalClient.length === 0) {
        throw new VentaValidationError("Cliente externo no encontrado.", 404);
      }

      const extData = externalClient[0];
      const docNumber = String(extData.dni || "").trim();
      if (!docNumber) throw new VentaValidationError("El cliente externo no tiene documento.");

      const [existingLocal] = await connection.query(
        `SELECT id_cliente
         FROM cliente
         WHERE (dni = ? OR ruc = ?) AND id_tenant = ?
         LIMIT 1`,
        [docNumber, docNumber, db_tenant_id]
      );

      if (existingLocal.length > 0) {
        id_cliente_final = existingLocal[0].id_cliente;
      } else {
        const isRuc = docNumber.length === 11;
        const [insertResult] = await connection.query(
          `INSERT INTO cliente (dni, ruc, nombres, apellidos, razon_social, direccion, estado_cliente, id_tenant, f_creacion)
           VALUES (?, ?, ?, ?, ?, ?, 1, ?, NOW())`,
          [
            !isRuc ? docNumber : null,
            isRuc ? docNumber : null,
            !isRuc ? extData.nombres : null, // Nombres
            !isRuc ? extData.apellidos : null, // Apellidos
            isRuc ? extData.nombres : null, // Razon Social 
            extData.direccion,
            db_tenant_id
          ]
        );
        id_cliente_final = insertResult.insertId;
      }

    } else {
      const clienteId = normalizarIdOpcional(id_cliente);
      let clienteResult;
      if (clienteId) {
        [clienteResult] = await connection.query(
          `SELECT id_cliente FROM cliente WHERE id_cliente = ? AND id_tenant = ? LIMIT 1`,
          [clienteId, id_tenant]
        );
      } else {
        const clienteNombre = String(id_cliente).trim();
        [clienteResult] = await connection.query(
          `SELECT id_cliente
           FROM cliente
           WHERE (CONCAT(nombres, ' ', apellidos) = ? OR razon_social = ?)
             AND id_tenant = ?
           LIMIT 1`,
          [clienteNombre, clienteNombre, id_tenant]
        );
      }
      if (clienteResult.length === 0) throw new VentaValidationError("Cliente no encontrado.", 404);
      id_cliente_final = clienteResult[0].id_cliente;
    }

    const ip = req.ip || req.connection.remoteAddress;

    // Preparar saleData
    const saleData = {
      ...body,
      id_sucursal,
      id_almacen,
      id_cliente: id_cliente_final,
      idempotency_key: idempotencyKey,
      id_usuario // Para el log
    };

    const { id_venta, num_comprobante, total_venta } = await createVentaInternal(connection, saleData, id_tenant);

    await connection.commit();
    transactionStarted = false;
    queryCache.clear();
    await logVentas.crear(id_venta, id_usuario, ip, id_tenant, total_venta);
    res.json({ code: 1, success: true, message: "Venta añadida", id_venta, num_comprobante });

  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
        transactionStarted = false;
      } catch { }
    }

    const duplicateMessage = `${error.message || ""} ${error.sqlMessage || ""}`;
    const esReintentoConcurrente =
      error.code === "ER_DUP_ENTRY" &&
      duplicateMessage.includes("uq_venta_tenant_idempotency") &&
      connection &&
      idTenantRequest &&
      idempotencyKey;

    if (esReintentoConcurrente) {
      try {
        const ventaExistente = await buscarVentaPorIdempotencia(
          connection,
          idTenantRequest,
          idempotencyKey
        );
        if (ventaExistente) {
          return res.json({
            code: 1,
            success: true,
            message: "Venta ya registrada",
            id_venta: ventaExistente.id_venta,
            num_comprobante: ventaExistente.num_comprobante,
            idempotent_replay: true,
          });
        }
      } catch (lookupError) {
        console.error("No se pudo recuperar la venta idempotente:", lookupError);
      }
    }

    const statusCode = error.statusCode || (error.code === "ER_DUP_ENTRY" ? 409 : 500);
    if (statusCode >= 500) {
      console.error('Error en addVenta:', error);
    } else {
      console.warn(`Venta rechazada: ${error.message}`);
    }

    const message = statusCode < 500
      ? error.message
      : "No se pudo registrar la venta. Inténtalo nuevamente.";
    res.status(statusCode).json({ code: 0, success: false, message });
  } finally {
    if (connection) connection.release();
  }
};

const addCliente = async (req, res) => {
  let connection;

  try {
    connection = await getConnection();
    const { dniOrRuc, tipo_cliente, nombreCompleto, direccion } = req.body;
    const id_tenant = req.id_tenant;

    if (
      !dniOrRuc ||
      !tipo_cliente ||
      !nombreCompleto ||
      (tipo_cliente === "Jurídico" && !direccion)
    ) {
      return res
        .status(400)
        .json({ message: "Bad Request. Please fill all fields correctly." });
    }

    let nombres = "";
    let apellidos = "";
    let razon_social = "";

    if (tipo_cliente === "Natural") {
      // Separar nombre completo en nombres y apellidos
      const partesNombre = nombreCompleto.split(" ");
      if (partesNombre.length > 1) {
        nombres = partesNombre.slice(0, -2).join(" ");
        apellidos = partesNombre.slice(-2).join(" ");
      } else {
        nombres = nombreCompleto;
      }

      // Insertar cliente natural con id_tenant
      await connection.query(
        "INSERT INTO cliente (dni, ruc, nombres, apellidos, razon_social, direccion, estado_cliente, id_tenant) VALUES (?, '', ?, ?, '', '', 0, ?)",
        [dniOrRuc, nombres, apellidos, id_tenant]
      );
    } else {
      razon_social = nombreCompleto;
      // Insertar cliente jurídico con id_tenant
      await connection.query(
        "INSERT INTO cliente (dni, ruc, nombres, apellidos, razon_social, direccion, estado_cliente, id_tenant) VALUES ('', ?, '', '', ?, ?, 0, ?)",
        [dniOrRuc, razon_social, direccion, id_tenant]
      );
    }

    res.json({ message: "Cliente añadido correctamente" });
  } catch (error) {
    console.error('Error en ventas:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};


const updateVenta = async (req, res) => {
  let connection;

  try {
    connection = await getConnection();
    let { id_venta, comprobante, estado_sunat, usua } = req.body;
    const id_tenant = req.id_tenant;

    if (!id_venta) {
      return res.status(400).json({ message: "id_venta requerido" });
    }

    // Normalizar
    comprobante = String(comprobante || "").trim();
    const estadoSunat = Number(estado_sunat) || 0;

    await connection.beginTransaction();

    // Obtener id_usuario si se pasó el nombre de usuario (usua)
    let id_usuario = null;
    if (usua) {
      const [userResult] = await connection.query("SELECT id_usuario FROM usuario WHERE usua = ?", [usua]);
      if (userResult.length > 0) {
        id_usuario = userResult[0].id_usuario;
      }
    }

    // Usar annulVentaInternal para la lógica de anulación
    // Si el frontend manda estado_venta = 0, es anulación.
    const { estado_venta, skip_stock } = req.body;

    // Si es anulación (0) y NO se indica que se omita el stock
    if ((estado_venta === 0 || estado_venta === '0') && !skip_stock) {
      const ip = req.ip || req.connection.remoteAddress;
      // Necesitamos id_usuario para el log y u_modifica. Si no vino usua, intentar sacarlo de la sesión o error?
      // Por ahora usaremos id_usuario si existe, sino null (aunque annulVentaInternal lo usa).
      if (!id_usuario) {
        // Fallback: intentar obtenerlo del token si está disponible en req.user
        if (req.user && req.user.id) id_usuario = req.user.id;
      }
      await annulVentaInternal(connection, id_venta, id_usuario, id_tenant, ip, comprobante, estadoSunat);
    } else {
      // Actualización estándar (no anulación o anulación sin stock check)
      // Fix: estado_venta || 1 falla si es 0. Usar operador ternario.
      const nuevoEstado = (estado_venta !== undefined && estado_venta !== null) ? estado_venta : 1;

      await connection.query(
        `UPDATE venta SET estado_venta = ?, estado_sunat = ?, u_modifica = ? WHERE id_venta = ? AND id_tenant = ? `,
        [nuevoEstado, estadoSunat, id_usuario, id_venta, id_tenant]
      );
    }

    await connection.commit();

    // Limpiar caché después de anular venta
    queryCache.clear();

    res.json({ code: 1, message: "Venta estado actualizado y stock restaurado." });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch { }
    }
    // "Ya estaba anulada" es una condición de negocio, no una falla: si se
    // devuelve 500 el frontend la muestra como error del servidor y el usuario
    // reintenta, que es justo lo que no debe hacer.
    if (error instanceof VentaValidationError) {
      return res.status(error.statusCode).json({ code: 0, success: false, message: error.message });
    }
    console.error('Error en updateVenta:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getVentaById = async (req, res) => {
  let connection;

  const { id_venta, id_venta_boucher } = req.query;
  const idTarget = id_venta || id_venta_boucher; // Support both for transition
  const id_tenant = req.id_tenant;

  if (!idTarget) {
    return res.status(400).json({ message: "ID de venta no proporcionado" });
  }

  try {
    connection = await getConnection();
    // Consulta para obtener los datos de la venta (filtrando por id_tenant)
    // Mapeamos a la estructura que espera el frontend (similar a venta_boucher antigua)
    const [venta] = await connection.query(
      `SELECT 
          v.id_venta as id_venta_boucher, -- Mantener alias para compatibilidad frontend
          v.id_venta,
          v.fecha_iso as fecha,
          CONCAT(cl.nombres, ' ', cl.apellidos) as nombre_cliente,
          COALESCE(NULLIF(cl.dni, ''), cl.ruc) as documento_cliente,
          cl.direccion as direccion_cliente,
          v.igv,
          -- v.total_t as total_t, -- REMOVED: Column does not exist
          CASE WHEN tp.nom_tipocomp = 'Nota de venta' THEN 'Recibo' ELSE tp.nom_tipocomp END as comprobante_pago,
          -- v.total_t as totalImporte_venta, -- REMOVED
          v.descuento_global as descuento_venta,
          v.vuelto,
          v.recibido,
          v.metodo_pago as formadepago,
          com.num_comprobante,
          v.estado_venta AS estado_venta
       FROM venta v 
       INNER JOIN comprobante com ON com.id_comprobante = v.id_comprobante
       INNER JOIN tipo_comprobante tp ON tp.id_tipocomprobante = com.id_tipocomprobante
       LEFT JOIN cliente cl ON cl.id_cliente = v.id_cliente
       WHERE v.id_venta = ? AND v.id_tenant = ? `,
      [idTarget, id_tenant]
    );

    if (venta.length === 0) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    // Consulta para obtener los detalles de la venta
    const [detalles] = await connection.query(
      `SELECT 
        dv.id_detalle,
        dv.id_producto,
        p.descripcion as nombre,
        dv.cantidad,
        dv.precio,
        dv.descuento,
        dv.total as sub_total,
        dv.atributos_snapshot
       FROM detalle_venta dv
       INNER JOIN producto p ON p.id_producto = dv.id_producto
       WHERE dv.id_venta = ?`,
      [idTarget]
    );

    // Convertir los valores de los detalles a números
    const detallesProcesados = detalles.map(detalle => ({
      ...detalle,
      id_producto: parseInt(detalle.id_producto, 10),
      precio: parseFloat(detalle.precio),
      descuento: parseFloat(detalle.descuento),
      sub_total: parseFloat(detalle.sub_total),
      atributos_snapshot: typeof detalle.atributos_snapshot === "string"
        ? JSON.parse(detalle.atributos_snapshot)
        : detalle.atributos_snapshot,
    }));

    // Calcular total basado en detalles
    const calculatedTotal = detallesProcesados.reduce((acc, item) => acc + item.sub_total, 0);

    // Convertir los valores de la venta a números
    const convertVentaToNumbers = (venta) => {
      return {
        ...venta,
        fecha: new Date(venta.fecha).toISOString().slice(0, 10),
        igv: parseFloat(venta.igv || 0),
        total_t: calculatedTotal, // Inserted calculated total
        totalImporte_venta: calculatedTotal, // Inserted calculated total
        descuento_venta: parseFloat(venta.descuento_venta || 0),
        vuelto: parseFloat(venta.vuelto || 0),
        recibido: parseFloat(venta.recibido || 0),
      };
    };

    // Construir el objeto de respuesta
    const datosVentaComprobante = {
      ...convertVentaToNumbers(venta[0]), // Los datos principales de la venta
      detalles: detallesProcesados, // Los detalles de la venta
    };

    res.json({ code: 1, data: datosVentaComprobante, message: "Datos comprobante listados" });
  } catch (error) {
    console.error('Error en getVentaById:', error);
    res.status(500).json({ code: 0, message: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};



const exchangeProducto = async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    // `id_sku_nuevo` es opcional por compatibilidad: el cliente viejo solo
    // manda `id_producto_nuevo`. Cuando viene, `createVentaInternal` valida que
    // el SKU pertenezca a ese producto y descuenta esa variante exacta.
    const { id_venta, id_detalle, id_producto_nuevo, id_sku_nuevo, cantidad, id_sucursal, usuario } = req.body;
    const id_tenant = req.id_tenant;
    const ip = req.ip || req.connection.remoteAddress;

    if (!id_venta || !id_detalle || !id_producto_nuevo || !cantidad || !usuario) {
      return res.status(400).json({ code: 0, message: "Faltan datos requeridos" });
    }

    await connection.beginTransaction();

    // 1. Obtener datos de la venta original incluyendo num_comprobante
    const [ventaOriginal] = await connection.query(
      "SELECT v.*, tc.nom_tipocomp, c.num_comprobante FROM venta v INNER JOIN comprobante c ON v.id_comprobante = c.id_comprobante INNER JOIN tipo_comprobante tc ON c.id_tipocomprobante = tc.id_tipocomprobante WHERE v.id_venta = ? AND v.id_tenant = ?",
      [id_venta, id_tenant]
    );
    if (ventaOriginal.length === 0) throw new Error("Venta original no encontrada");
    const oldSale = ventaOriginal[0];

    // 2. Obtener usuario (quien realiza el cambio)
    const [userResult] = await connection.query("SELECT id_usuario FROM usuario WHERE usua = ?", [usuario]);
    if (userResult.length === 0) throw new Error("Usuario no encontrado");
    const id_usuario = userResult[0].id_usuario;

    // 3. Anular la venta original (usando helper)
    await annulVentaInternal(connection, id_venta, id_usuario, id_tenant, ip, oldSale.nom_tipocomp, oldSale.estado_sunat);

    // 4. Preparar datos para la nueva venta
    // Necesitamos los detalles originales, reemplazar el producto cambiado, y recalcular totales.
    const [detallesOriginales] = await connection.query(
      "SELECT * FROM detalle_venta WHERE id_venta = ?",
      [id_venta]
    );

    // Obtener info del nuevo producto
    const [nuevoProd] = await connection.query(
      "SELECT * FROM producto WHERE id_producto = ? AND id_tenant = ?",
      [id_producto_nuevo, id_tenant]
    );
    if (nuevoProd.length === 0) throw new Error("Nuevo producto no encontrado");
    const newProductData = nuevoProd[0];
    const precioNuevo = Number(newProductData.precio);

    let nuevosDetalles = [];
    let totalNuevo = 0;
    let igvNuevo = 0;
    let diferenciaTexto = "";

    // Convertir id_detalle a número para comparación segura
    const targetIdDetalle = Number(id_detalle);

    for (const det of detallesOriginales) {
      // Usar comparación flexible O estricta con casting. id_detalle es PK de detalle_venta.
      if (det.id_detalle === targetIdDetalle) {
        // Este es el item a cambiar. `id_sku_nuevo` es lo que hace expresable
        // el caso real de una tienda de ropa: cambiar una M por una L del
        // MISMO producto. Con solo `id_producto_nuevo` no había forma de
        // decirlo, porque el producto no cambia — cambia la variante.
        const subtotalNuevo = precioNuevo * cantidad;
        nuevosDetalles.push({
          id_producto: id_producto_nuevo,
          cantidad: cantidad,
          precio: precioNuevo,
          descuento: 0,
          total: subtotalNuevo,
          id_sku: id_sku_nuevo ?? null,
        });
        totalNuevo += subtotalNuevo;

        // Info para observación
        diferenciaTexto = id_sku_nuevo
          ? `Cambio: Prod ${det.id_producto}/SKU ${det.id_sku ?? "—"} -> Prod ${id_producto_nuevo}/SKU ${id_sku_nuevo}.`
          : `Cambio: Prod ID ${det.id_producto} -> ID ${id_producto_nuevo}.`;
      } else {
        // Mantener item original CON su variante. Antes se perdían `id_sku`,
        // `id_tonalidad` y `id_talla` de las líneas que nadie tocó: cambiar un
        // polo de un ticket de tres ítems dejaba a los otros dos sin variante,
        // y al recrear la venta `descontarPorProducto` sacaba el stock de un
        // SKU cualquiera del producto — de otra talla, por ejemplo.
        nuevosDetalles.push({
          id_producto: det.id_producto,
          cantidad: det.cantidad,
          precio: det.precio,
          descuento: det.descuento,
          total: det.total,
          id_sku: det.id_sku ?? null,
          id_tonalidad: det.id_tonalidad ?? null,
          id_talla: det.id_talla ?? null,
        });
        totalNuevo += Number(det.total);
      }
    }

    // Recalcular IGV
    igvNuevo = totalNuevo - (totalNuevo / 1.18);

    // Almacén de la sucursal. Sin fila vinculada no se puede recrear la venta,
    // y conviene decirlo en vez de reventar leyendo `[0][0]` de un vacío.
    const [almacenSucursal] = await connection.query(
      "SELECT id_almacen FROM sucursal_almacen WHERE id_sucursal = ? AND id_tenant = ? LIMIT 1",
      [oldSale.id_sucursal, id_tenant]
    );
    if (almacenSucursal.length === 0) {
      throw new Error("La sucursal de la venta original no tiene un almacén vinculado");
    }

    // Datos del cliente para el boucher. Una venta puede NO tener cliente —es
    // el caso normal en tienda, se vende al público— y antes las tres consultas
    // hacían `[0][0].campo` sobre un resultado vacío: el intercambio reventaba
    // con "Cannot read properties of undefined" en toda venta sin cliente.
    let datosCliente = { n: null, d: null, direccion: null };
    if (oldSale.id_cliente) {
      const [filaCliente] = await connection.query(
        `SELECT COALESCE(NULLIF(CONCAT(nombres, ' ', apellidos), ' '), razon_social) AS n,
                COALESCE(NULLIF(dni, ''), ruc) AS d,
                direccion
         FROM cliente WHERE id_cliente = ? AND id_tenant = ? LIMIT 1`,
        [oldSale.id_cliente, id_tenant]
      );
      if (filaCliente.length > 0) datosCliente = filaCliente[0];
    }

    // Datos de la nueva venta
    const newSaleData = {
      id_sucursal: oldSale.id_sucursal,
      id_almacen: almacenSucursal[0].id_almacen,
      id_comprobante: oldSale.nom_tipocomp,
      id_cliente: oldSale.id_cliente,
      estado_venta: 1, // Aceptada
      f_venta: new Date().toISOString().split('T')[0],
      igv: igvNuevo,
      detalles: nuevosDetalles,
      fecha_iso: new Date().toISOString(),
      metodo_pago: oldSale.metodo_pago,
      fecha: new Date().toISOString().split('T')[0],
      // Datos cliente para boucher
      nombre_cliente: datosCliente.n,
      documento_cliente: datosCliente.d,
      direccion_cliente: datosCliente.direccion,
      igv_b: igvNuevo,
      total_t: totalNuevo,
      comprobante_pago: "Recibo",
      totalImporte_venta: totalNuevo,
      descuento_venta: 0,
      vuelto: 0,
      recibido: totalNuevo,
      formadepago: oldSale.metodo_pago,
      detalles_b: [],
      observacion: `Intercambio realizado.Venta anterior: ${oldSale.num_comprobante}. ${diferenciaTexto} `,
      estado_sunat: 0,
      id_usuario: id_usuario
    };

    const {
      id_venta: newVentaId,
      num_comprobante: newNumComprobante,
      total_venta: totalNuevaVenta
    } = await createVentaInternal(connection, newSaleData, id_tenant);

    // Preparar datos para SUNAT (Si es Boleta o Factura)
    let sunatData = null;
    if (newSaleData.id_comprobante === 'Boleta' || newSaleData.id_comprobante === 'Factura') {
      const numComp = newNumComprobante.split('-');

      sunatData = {
        detalles: nuevosDetalles.map(d => {
          // Necesitamos nombre y undm. Los tenemos en data? No en nuevosDetalles.
          // Hay que sacarlos de `detallesOriginales` o `newProductData`.
          let prodInfo;
          if (d.id_producto === id_producto_nuevo) {
            prodInfo = newProductData; // Del query anterior
          } else {
            // Buscar en detallesOriginales (pero ojo, detallesOriginales es detalle_venta row, no tiene descripción/undm si no hicimos join antes)
            // ERROR POTENCIAL: detallesOriginales query original era 'SELECT * FROM detalle_venta'. No tiene nombre/undm.
            // Solución: Necesitamos hacer un query extra o mejorar el previo.
            // Vamos a hacer map rápido abajo con queries o mejoramos el query original de detalles.
            return d; // Placeholder, see fix below
          }
          // ...
          // Re-pensando: Mejor hacer un query final de la nueva venta con todos los joins para armar el objeto limpio.
          return d;
        }),
        // ...
      };

      // MEJOR APROXIMACIÓN:
      // Reutilizar getVentaById lógica o similar para devolver la estructura completa que espera el frontend.
      // El frontend espera: detalles (con nombre, undm, precio...), tipoComprobante, num, serieNum, ruc, cliente, fecha_iso...

      // Vamos a construirlo manualmente con los datos que ya tenemos + queries auxiliares.
      // 1. Obtener detalles completos de la NUEVA venta (con joins a producto)
      const [detallesFull] = await connection.query(`
            SELECT dv.*, p.descripcion as nombre, p.undm 
            FROM detalle_venta dv 
            INNER JOIN producto p ON dv.id_producto = p.id_producto 
            WHERE dv.id_venta = ? `,
        [newVentaId]
      );

      sunatData = {
        detalles: detallesFull.map(d => ({
          codigo: d.id_producto,
          cantidad: d.cantidad,
          precio: Number(d.precio),
          descuento: Number(d.descuento),
          subtotal: d.total, // OJO: el frontend a veces usa total o subtotal
          nombre: d.nombre,
          undm: d.undm
        })),
        tipoComprobante: newSaleData.id_comprobante,
        num: numComp[1],
        serieNum: numComp[0], // B001
        ruc: newSaleData.documento_cliente,
        cliente: newSaleData.nombre_cliente,
        fecha_iso: newSaleData.fecha_iso
      };

      // Add company data for SUNAT credential resolution
      const [empresaResult] = await connection.query(
        `SELECT e.ruc, e.razonSocial, e.nombreComercial, e.direccion, e.provincia, e.departamento, e.distrito, e.ubigueo 
         FROM empresa e 
         INNER JOIN usuario u ON u.id_empresa = e.id_empresa
         WHERE u.usua = ? AND e.id_tenant = ? LIMIT 1`,
        [usuario, id_tenant]
      );
      if (empresaResult.length > 0) {
        const emp = empresaResult[0];
        sunatData.company = {
          ruc: emp.ruc,
          razonSocial: emp.razonSocial,
          nombreComercial: emp.nombreComercial,
          address: {
            direccion: emp.direccion,
            provincia: emp.provincia,
            departamento: emp.departamento,
            distrito: emp.distrito,
            ubigueo: emp.ubigueo
          }
        };
      }
    }

    await connection.commit();
    await logVentas.crear(newVentaId, id_usuario, ip, id_tenant, totalNuevaVenta);
    res.json({ code: 1, message: "Intercambio realizado con éxito", data: { id_venta_nueva: newVentaId, sunatData } });

  } catch (error) {
    console.error("Error en exchangeProducto:", error);
    if (connection) await connection.rollback();
    res.status(500).json({ code: 0, message: error.message });
  } finally {
    if (connection) connection.release();
  }
};



// ========== VENTAS ONLINE (tesis_db) ==========
const getVentasOnline = async (req, res) => {
  let connection;
  try {
    connection = await getTesisConnection();
    const id_tenant = req.id_tenant;

    // Paginación
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 100), 500);
    const offset = (page - 1) * limit;

    // Query principal sin cross-database JOIN para evitar problemas
    const comprasQuery = `
      SELECT
        c.id_compra AS id,
        c.fecha_compra AS fechaEmision,
        c.fecha_verificacion AS fechaVerificacion,
        c.total,
        c.medio_pago AS metodo_pago,
        CASE c.estado_compra 
          WHEN 1 THEN 'Aceptada' 
          WHEN 0 THEN 'Anulada'
          ELSE 'En proceso' 
        END AS estado,
        c.observaciones AS observacion,
        c.id_transaccion AS transaccion,
        c.estado_verificacion,
        c.id_almacen,
        cl.id_cliente,
        CONCAT(COALESCE(cl.nombres, ''), ' ', COALESCE(cl.apellidos, '')) AS cliente,
        cl.dni,
        cl.email,
        cl.telefono,
        cl.direccion
      FROM compra c
      LEFT JOIN cliente cl ON cl.id_cliente = c.id_cliente
      WHERE c.id_tenant = ?
      ORDER BY c.id_compra DESC
      LIMIT ? OFFSET ?
    `;

    const [comprasResult] = await connection.query(comprasQuery, [id_tenant, limit, offset]);

    // Obtener detalles para cada compra (si hay compras)
    let detallesMap = {};

    if (comprasResult.length > 0) {
      const comprasIds = comprasResult.map(c => c.id);

      try {
        // Usar placeholders individuales para el IN clause
        const placeholders = comprasIds.map(() => '?').join(',');
        const [detallesResult] = await connection.query(`
          SELECT 
            dc.id_compra,
            dc.id_detalle_compra AS codigo,
            dc.id_producto,
            COALESCE(p.descripcion, 'Producto') AS nombre,
            dc.cantidad,
            dc.precio_unitario AS precio,
            (dc.cantidad * dc.precio_unitario) AS subtotal,
            COALESCE(p.undm, 'UND') AS undm,
            dc.metadata
          FROM detalle_compra dc
          LEFT JOIN ${DATABASE}.producto p ON p.id_producto = dc.id_producto
          WHERE dc.id_compra IN (${placeholders})
        `, comprasIds);

        // Agrupar detalles por id_compra
        detallesResult.forEach(d => {
          // Parse metadata to extract variants
          let meta = null;
          if (d.metadata) {
            try {
              meta = typeof d.metadata === 'string' ? JSON.parse(d.metadata) : d.metadata;
            } catch (e) { console.error('Error parsing metadata', e); }
          }

          if (meta) {
            // Construct attributes object for frontend
            const attrs = {};
            if (meta.size) attrs['Talla'] = meta.size;
            if (meta.color && meta.color.name) attrs['Color'] = meta.color.name;

            d.attributes_json = attrs;
            d.nombre_talla = meta.size;
            d.nombre_tonalidad = meta.color?.name;
          }

          if (!detallesMap[d.id_compra]) {
            detallesMap[d.id_compra] = [];
          }
          detallesMap[d.id_compra].push(d);
        });
      } catch (detalleError) {
        console.warn('Error al obtener detalles de compra:', detalleError.message);
        // Continuar sin detalles
      }
    }

    // Combinar compras con sus detalles
    const compras = comprasResult.map(compra => ({
      ...compra,
      cliente: compra.cliente?.trim() || 'Cliente Online',
      origen: 'online',
      tipoComprobante: 'Online',
      serieNum: 'ONL',
      num: String(compra.id).padStart(8, '0'),
      cajero: 'Sistema Online',
      almacen: compra.id_almacen ? `Almacén ${compra.id_almacen}` : '-',
      igv: parseFloat((parseFloat(compra.total || 0) * 0.18 / 1.18).toFixed(2)),
      detalles: detallesMap[compra.id] || []
    }));

    // Calcular totales para KPIs
    const [totalesResult] = await connection.query(`
      SELECT 
        COUNT(*) as cantidad,
        COALESCE(SUM(total), 0) as totalVentas
      FROM compra 
      WHERE id_tenant = ? AND estado_compra = 1
    `, [id_tenant]);

    const totales = totalesResult[0] || { cantidad: 0, totalVentas: 0 };

    res.json({
      code: 1,
      data: compras,
      totalOnline: parseFloat(totales.totalVentas || 0).toFixed(2),
      cantidadOnline: parseInt(totales.cantidad || 0)
    });
  } catch (error) {
    console.error('Error en getVentasOnline:', error.message, error.code);
    res.status(500).json({
      code: 0,
      message: "Error al obtener ventas online",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
};

export const methods = {
  getVentas,
  buscarVentas,
  getProductosVentas,
  addVenta,
  getClienteVentas,
  addCliente,
  getComprobante,
  getSucursal,
  updateVenta,
  generarComprobante,
  getEstado,
  getVentaById,
  getLastVenta,
  exchangeProducto,
  getVentasOnline,
};
