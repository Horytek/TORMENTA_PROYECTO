import mysql from "mysql2/promise";
import {
  DATABASE,
  HOST,
  PASSWORD,
  PORT_DB,
  USER,
} from "../src/config.js";

/**
 * Siembra un volumen sintético de ventas para poder MEDIR el impacto de los
 * índices en local (las tablas `venta`, `detalle_venta` e `inventario` están
 * vacías en el clon de desarrollo, así que sin datos el optimizador elige
 * planes triviales y cualquier medición sería falsa).
 *
 * Uso:
 *   npm run db:seed:perf              → siembra
 *   npm run db:seed:perf -- --limpiar → borra SOLO lo sembrado
 *
 * Todo lo insertado queda marcado para poder revertirlo sin tocar datos reales:
 *   - `venta.observacion`      empieza con MARCA_VENTA
 *   - `comprobante.num_comprobante` empieza con MARCA_COMPROBANTE
 *   - los detalles/kardex se borran por su `id_venta` sembrado
 *
 * NOTA sobre multi-tenant: los datos de referencia (sucursal, cliente, producto,
 * almacén) del clon local pertenecen todos al tenant 1, y varias consultas
 * hacen JOIN exigiendo que el tenant coincida. Por eso se siembra solo el
 * tenant 1: mezclar tenants rompería esos JOINs y falsearía la medición. La
 * selectividad real la aportan el rango de fechas y la sucursal.
 */

const HOSTS_LOCALES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "host.docker.internal",
]);

const ID_TENANT = 1;
const TOTAL_VENTAS = 100000;
const MESES_HISTORIA = 24;
const LOTE = 2000;

const MARCA_VENTA = "PERF-SEED";
const MARCA_COMPROBANTE = "PERF";

const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const aleatorio = (lista) => lista[Math.floor(Math.random() * lista.length)];
const enteroEntre = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

const conectar = async () => {
  if (!HOST || !DATABASE || !USER) {
    throw new Error("Falta configurar la conexión MySQL local en el archivo .env.");
  }

  if (!esHostLocal(HOST)) {
    throw new Error(
      "Siembra cancelada: este script solo puede ejecutarse contra MySQL local."
    );
  }

  return mysql.createConnection({
    host: HOST,
    database: DATABASE,
    user: USER,
    password: PASSWORD,
    port: PORT_DB,
    connectTimeout: 5000,
  });
};

/** IDs reales del tenant para respetar las claves foráneas. */
const obtenerReferencias = async (connection) => {
  const [sucursales] = await connection.query(
    "SELECT id_sucursal FROM sucursal WHERE id_tenant = ?",
    [ID_TENANT]
  );
  const [clientes] = await connection.query(
    "SELECT id_cliente FROM cliente WHERE id_tenant = ?",
    [ID_TENANT]
  );
  const [productos] = await connection.query(
    "SELECT id_producto, precio FROM producto WHERE id_tenant = ?",
    [ID_TENANT]
  );
  const [almacenes] = await connection.query(
    "SELECT id_almacen FROM almacen WHERE id_tenant = ?",
    [ID_TENANT]
  );
  const [tipos] = await connection.query(
    "SELECT id_tipocomprobante FROM tipo_comprobante WHERE id_tenant = ? AND nom_tipocomp IN ('Boleta','Factura')",
    [ID_TENANT]
  );

  const referencias = {
    sucursales: sucursales.map((s) => s.id_sucursal),
    clientes: clientes.map((c) => c.id_cliente),
    productos: productos.map((p) => ({
      id: p.id_producto,
      precio: Number(p.precio) || 10,
    })),
    almacenes: almacenes.map((a) => a.id_almacen),
    tipos: tipos.map((t) => t.id_tipocomprobante),
  };

  for (const [nombre, lista] of Object.entries(referencias)) {
    if (lista.length === 0) {
      throw new Error(
        `No hay ${nombre} para el tenant ${ID_TENANT}: no se puede sembrar respetando las claves foráneas.`
      );
    }
  }

  return referencias;
};

/** Fecha aleatoria repartida en los últimos MESES_HISTORIA meses. */
const fechaAleatoria = () => {
  const hoy = new Date();
  const inicio = new Date(hoy);
  inicio.setMonth(inicio.getMonth() - MESES_HISTORIA);
  const marca = inicio.getTime() + Math.random() * (hoy.getTime() - inicio.getTime());
  return new Date(marca).toISOString().slice(0, 10);
};

const horaAleatoria = () =>
  `${String(enteroEntre(8, 21)).padStart(2, "0")}:${String(enteroEntre(0, 59)).padStart(2, "0")}:00`;

/** Inventario coherente: una fila por producto y almacén (lo consultan productos/kárdex). */
const sembrarInventario = async (connection, referencias) => {
  const [[{ existentes }]] = await connection.query(
    "SELECT COUNT(*) AS existentes FROM inventario WHERE id_tenant = ?",
    [ID_TENANT]
  );

  if (existentes > 0) {
    console.log(`[omitido] inventario ya tiene ${existentes} filas para el tenant ${ID_TENANT}.`);
    return;
  }

  // `atributos` lleva una marca explícita para poder borrar SOLO lo sembrado
  // (usar "atributos IS NULL" borraría stock real cargado a mano).
  const marca = JSON.stringify({ perf_seed: true });
  const filas = [];
  for (const producto of referencias.productos) {
    for (const idAlmacen of referencias.almacenes) {
      filas.push([producto.id, idAlmacen, enteroEntre(50, 5000), ID_TENANT, marca]);
    }
  }

  await connection.query(
    "INSERT INTO inventario (id_producto, id_almacen, stock, id_tenant, atributos) VALUES ?",
    [filas]
  );
  console.log(`[creado] inventario: ${filas.length} filas.`);
};

const sembrarVentas = async (connection, referencias) => {
  let totalDetalles = 0;
  let totalKardex = 0;

  for (let desde = 0; desde < TOTAL_VENTAS; desde += LOTE) {
    const cantidadLote = Math.min(LOTE, TOTAL_VENTAS - desde);

    // 1) Comprobantes del lote (venta.id_comprobante es NOT NULL con FK).
    const comprobantes = Array.from({ length: cantidadLote }, (_, i) => [
      aleatorio(referencias.tipos),
      `${MARCA_COMPROBANTE}${String(desde + i + 1).padStart(9, "0")}`,
      ID_TENANT,
    ]);

    const [resComprobantes] = await connection.query(
      "INSERT INTO comprobante (id_tipocomprobante, num_comprobante, id_tenant) VALUES ?",
      [comprobantes]
    );

    // mysql2 devuelve el primer id insertado; el resto es correlativo.
    const primerComprobante = resComprobantes.insertId;

    // 2) Ventas del lote.
    const ventas = Array.from({ length: cantidadLote }, (_, i) => {
      const fecha = fechaAleatoria();
      const total = enteroEntre(20, 2000);
      return [
        aleatorio(referencias.sucursales),
        primerComprobante + i,
        aleatorio(referencias.clientes),
        Math.random() < 0.04 ? 0 : 1, // ~4% anuladas, como en la vida real
        fecha,
        Number((total * 0.18).toFixed(6)),
        total,
        `${fecha}T${horaAleatoria()}`,
        aleatorio(["EFECTIVO", "TARJETA", "YAPE", "PLIN", "TRANSFERENCIA"]),
        Math.random() < 0.8 ? 1 : 0,
        `${MARCA_VENTA} lote ${desde / LOTE + 1}`,
        horaAleatoria(),
        ID_TENANT,
      ];
    });

    const [resVentas] = await connection.query(
      `INSERT INTO venta
        (id_sucursal, id_comprobante, id_cliente, estado_venta, f_venta, igv, recibido,
         fecha_iso, metodo_pago, estado_sunat, observacion, hora_creacion, id_tenant)
       VALUES ?`,
      [ventas]
    );

    const primeraVenta = resVentas.insertId;

    // 3) Detalles + kardex (entre 1 y 5 líneas por venta).
    const detalles = [];
    const kardex = [];
    for (let i = 0; i < cantidadLote; i += 1) {
      const idVenta = primeraVenta + i;
      const fecha = ventas[i][4];
      const lineas = enteroEntre(1, 5);

      for (let l = 0; l < lineas; l += 1) {
        const producto = aleatorio(referencias.productos);
        const cantidad = enteroEntre(1, 6);
        const total = Number((producto.precio * cantidad).toFixed(2));

        detalles.push([producto.id, idVenta, cantidad, producto.precio, total, ID_TENANT]);

        const stockAnterior = enteroEntre(cantidad, 5000);
        kardex.push([
          producto.id,
          aleatorio(referencias.almacenes),
          cantidad,
          stockAnterior,
          stockAnterior - cantidad,
          fecha,
          idVenta,
          ID_TENANT,
          horaAleatoria(),
        ]);
      }
    }

    await connection.query(
      "INSERT INTO detalle_venta (id_producto, id_venta, cantidad, precio, total, id_tenant) VALUES ?",
      [detalles]
    );
    await connection.query(
      `INSERT INTO bitacora_nota
        (id_producto, id_almacen, sale, stock_anterior, stock_actual, fecha, id_venta, id_tenant, hora_creacion)
       VALUES ?`,
      [kardex]
    );

    totalDetalles += detalles.length;
    totalKardex += kardex.length;

    const avance = desde + cantidadLote;
    if (avance % 20000 === 0 || avance === TOTAL_VENTAS) {
      console.log(`  … ${avance}/${TOTAL_VENTAS} ventas sembradas.`);
    }
  }

  console.log(`[creado] venta: ${TOTAL_VENTAS} filas.`);
  console.log(`[creado] detalle_venta: ${totalDetalles} filas.`);
  console.log(`[creado] bitacora_nota: ${totalKardex} filas.`);
};

const sembrar = async (connection) => {
  const referencias = await obtenerReferencias(connection);
  console.log(
    `Referencias del tenant ${ID_TENANT}: ${referencias.sucursales.length} sucursales, ` +
      `${referencias.clientes.length} clientes, ${referencias.productos.length} productos, ` +
      `${referencias.almacenes.length} almacenes.`
  );

  await sembrarInventario(connection, referencias);
  await sembrarVentas(connection, referencias);

  console.log("\nSiembra completada. Recuerda ejecutar ANALYZE TABLE para refrescar estadísticas:");
  console.log("  ANALYZE TABLE venta, detalle_venta, bitacora_nota, inventario;");
};

/** Borra únicamente lo sembrado, respetando el orden de las claves foráneas. */
const limpiar = async (connection) => {
  const [ventas] = await connection.query(
    "SELECT id_venta, id_comprobante FROM venta WHERE observacion LIKE ?",
    [`${MARCA_VENTA}%`]
  );

  if (ventas.length === 0) {
    console.log("[omitido] no hay ventas sembradas que borrar.");
  } else {
    const idsVenta = ventas.map((v) => v.id_venta);
    const idsComprobante = ventas.map((v) => v.id_comprobante);

    for (let i = 0; i < idsVenta.length; i += LOTE) {
      const lote = idsVenta.slice(i, i + LOTE);
      await connection.query("DELETE FROM detalle_venta WHERE id_venta IN (?)", [lote]);
      await connection.query("DELETE FROM bitacora_nota WHERE id_venta IN (?)", [lote]);
      await connection.query("DELETE FROM venta WHERE id_venta IN (?)", [lote]);
    }
    console.log(`[borrado] venta + detalle_venta + bitacora_nota de ${idsVenta.length} ventas sembradas.`);

    for (let i = 0; i < idsComprobante.length; i += LOTE) {
      const lote = idsComprobante.slice(i, i + LOTE);
      await connection.query("DELETE FROM comprobante WHERE id_comprobante IN (?)", [lote]);
    }
    console.log(`[borrado] comprobante: ${idsComprobante.length} filas sembradas.`);
  }

  const [resInventario] = await connection.query(
    "DELETE FROM inventario WHERE id_tenant = ? AND JSON_EXTRACT(atributos, '$.perf_seed') = TRUE",
    [ID_TENANT]
  );
  console.log(`[borrado] inventario: ${resInventario.affectedRows} filas.`);
};

const ejecutar = async () => {
  const debeLimpiar = process.argv.includes("--limpiar");
  const connection = await conectar();

  try {
    if (debeLimpiar) {
      await limpiar(connection);
    } else {
      await sembrar(connection);
    }
  } finally {
    await connection.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:seed:perf] ${error.message}`);
  process.exitCode = 1;
});
