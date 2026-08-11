/**
 * Seed poblado e idempotente de productos platform (admin + cliente + operador).
 *
 * Uso:
 *   node src/scripts/seed_platform_demo.js
 *   SEED_TENANT_ID=1 npm run seed:platform-demo
 *
 * Credenciales:
 *   Admin operadores: slug demo / admin@demo.local / Demo1234!
 *   ERP paneles /platform/*: platform.demo / Demo1234! (usuario dedicado en db_tormenta)
 *   Cliente/pasajero: ver log final
 */
import mysql from "mysql2/promise";
import {
  HOST,
  USER,
  PASSWORD,
  PORT_DB,
  DATABASE,
  SYNC_DATABASE,
  MAYORISTA_DATABASE,
  TALLER_DATABASE,
  PREVENTA_DATABASE,
  CRM_DATABASE,
  ENVIOS_DATABASE,
  WMS_DATABASE,
  DESPACHO_DATABASE,
  TAXI_DATABASE,
  DELIVERY_DATABASE,
  FLOTAS_DATABASE,
  CAMPO_DATABASE,
  ACADEMIA_DATABASE,
  AGENDA_DATABASE,
  MANTENIMIENTO_DATABASE,
  RECLUTA_DATABASE,
} from "../config.js";
import { hashPassword } from "../utils/passwordUtil.js";
import { WAVE_SCHEMAS } from "./schemas/schemas_waves_b_e.sql.js";
import { SYNC_SCHEMA_SQL } from "./schemas/schema_sync.sql.js";
import { MAYORISTA_SCHEMA_SQL } from "./schemas/schema_mayorista.sql.js";

const TENANT = Number(process.env.SEED_TENANT_ID || 1);
const SLUG = "demo";
const ADMIN_EMAIL = "admin@demo.local";
const PASS = "Demo1234!";
const PIN = "1234";

const WAVE_DBS = [
  TALLER_DATABASE,
  PREVENTA_DATABASE,
  CRM_DATABASE,
  ENVIOS_DATABASE,
  WMS_DATABASE,
  DESPACHO_DATABASE,
  TAXI_DATABASE,
  DELIVERY_DATABASE,
  FLOTAS_DATABASE,
  CAMPO_DATABASE,
  ACADEMIA_DATABASE,
  AGENDA_DATABASE,
  MANTENIMIENTO_DATABASE,
  RECLUTA_DATABASE,
];

function log(msg) {
  console.log(msg);
}

async function rootConn() {
  return mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASSWORD,
    port: Number(PORT_DB) || 3306,
    multipleStatements: true,
  });
}

async function dbConn(database) {
  return mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASSWORD,
    port: Number(PORT_DB) || 3306,
    database,
    multipleStatements: true,
  });
}

async function ensureDatabases() {
  const root = await rootConn();
  try {
    for (const name of [SYNC_DATABASE, MAYORISTA_DATABASE, ...WAVE_DBS]) {
      await root.query(
        `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      log(`OK database ${name}`);
    }
  } finally {
    await root.end();
  }
}

async function applySql(database, sql, label) {
  const c = await dbConn(database);
  try {
    await c.query(sql);
    log(`OK schema ${label || database}`);
  } finally {
    await c.end();
  }
}

async function applySchemas() {
  await applySql(SYNC_DATABASE, SYNC_SCHEMA_SQL);
  await applySql(MAYORISTA_DATABASE, MAYORISTA_SCHEMA_SQL);
  for (const name of WAVE_DBS) {
    const sql = WAVE_SCHEMAS[name];
    if (!sql) {
      console.warn(`Sin schema WAVE para ${name}`);
      continue;
    }
    await applySql(name, sql);
  }
}

async function ensureOperator({
  database,
  entitlementTable,
  adminTable,
  pk,
  nombre,
}) {
  const hash = await hashPassword(PASS);
  const c = await dbConn(database);
  try {
    const [[existing]] = await c.query(
      `SELECT \`${pk}\` AS id FROM \`${entitlementTable}\` WHERE slug = ? LIMIT 1`,
      [SLUG]
    );
    let ownerId;
    if (existing) {
      ownerId = existing.id;
      await c.query(
        `UPDATE \`${entitlementTable}\` SET activo = 1, nombre = ?, plan_flag = 'demo' WHERE \`${pk}\` = ?`,
        [nombre, ownerId]
      );
    } else {
      ownerId = 1;
      // si PK 1 ocupada por otro slug, tomar max+1
      const [[row]] = await c.query(
        `SELECT MAX(\`${pk}\`) AS m FROM \`${entitlementTable}\``
      );
      if (row?.m && Number(row.m) >= 1) {
        const [[byPk]] = await c.query(
          `SELECT slug FROM \`${entitlementTable}\` WHERE \`${pk}\` = 1 LIMIT 1`
        );
        if (byPk && byPk.slug !== SLUG) ownerId = Number(row.m) + 1;
      }
      await c.query(
        `INSERT INTO \`${entitlementTable}\` (\`${pk}\`, activo, plan_flag, slug, nombre)
         VALUES (?, 1, 'demo', ?, ?)`,
        [ownerId, SLUG, nombre]
      );
    }

    const [[admin]] = await c.query(
      `SELECT id_admin FROM \`${adminTable}\` WHERE \`${pk}\` = ? AND email = ? LIMIT 1`,
      [ownerId, ADMIN_EMAIL]
    );
    if (admin) {
      await c.query(`UPDATE \`${adminTable}\` SET password_hash = ? WHERE id_admin = ?`, [
        hash,
        admin.id_admin,
      ]);
    } else {
      await c.query(
        `INSERT INTO \`${adminTable}\` (\`${pk}\`, email, password_hash) VALUES (?, ?, ?)`,
        [ownerId, ADMIN_EMAIL, hash]
      );
    }
    return ownerId;
  } finally {
    await c.end();
  }
}

async function countWhere(c, table, where, params) {
  const [[row]] = await c.query(
    `SELECT COUNT(*) AS n FROM \`${table}\` WHERE ${where}`,
    params
  );
  return Number(row.n || 0);
}

/* ——— Taxi ——— */
async function ensureTaxiColumns(c) {
  const alters = [
    ["taxi_conductor", "placa", "ADD COLUMN placa VARCHAR(20) NULL"],
    ["taxi_conductor", "vehiculo", "ADD COLUMN vehiculo VARCHAR(120) NULL"],
    ["taxi_conductor", "notas", "ADD COLUMN notas VARCHAR(255) NULL"],
    ["taxi_pasajero", "activo", "ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1"],
  ];
  for (const [table, col, clause] of alters) {
    try {
      const [cols] = await c.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, col]
      );
      if (!cols.length) {
        await c.query(`ALTER TABLE \`${table}\` ${clause}`);
      }
    } catch (e) {
      if (e.code !== "ER_DUP_FIELDNAME") {
        console.warn(`taxi DDL ${table}.${col}:`, e.message);
      }
    }
  }
}

async function seedTaxi() {
  const ownerId = await ensureOperator({
    database: TAXI_DATABASE,
    entitlementTable: "taxi_entitlement",
    adminTable: "taxi_admin",
    pk: "id_operador",
    nombre: "Operador Demo Taxi",
  });
  const hash = await hashPassword(PASS);
  const c = await dbConn(TAXI_DATABASE);
  try {
    await ensureTaxiColumns(c);

    // Equipo: segundo admin
    const [[opsAdmin]] = await c.query(
      `SELECT id_admin FROM taxi_admin WHERE id_operador = ? AND email = ? LIMIT 1`,
      [ownerId, "ops@demo.local"]
    );
    if (opsAdmin) {
      await c.query(`UPDATE taxi_admin SET password_hash = ? WHERE id_admin = ?`, [
        hash,
        opsAdmin.id_admin,
      ]);
    } else {
      await c.query(
        `INSERT INTO taxi_admin (id_operador, email, password_hash) VALUES (?, ?, ?)`,
        [ownerId, "ops@demo.local", hash]
      );
    }

    const pasajeros = [
      ["Ana Pasajera", "999111222", 1],
      ["Luis Cliente", "999111223", 1],
      ["Rosa Viajera", "999111224", 1],
      ["Cuenta Inactiva", "999111299", 0],
    ];
    for (const [nombre, telefono, activo] of pasajeros) {
      const [[ex]] = await c.query(
        `SELECT id_pasajero FROM taxi_pasajero WHERE id_operador = ? AND telefono = ? LIMIT 1`,
        [ownerId, telefono]
      );
      if (!ex) {
        await c.query(
          `INSERT INTO taxi_pasajero (id_operador, nombre, telefono, password_hash, activo)
           VALUES (?, ?, ?, ?, ?)`,
          [ownerId, nombre, telefono, hash, activo]
        );
      } else {
        await c.query(
          `UPDATE taxi_pasajero SET password_hash = ?, nombre = ?, activo = ? WHERE id_pasajero = ?`,
          [hash, nombre, activo, ex.id_pasajero]
        );
      }
    }

    const conductores = [
      ["Carlos Conductor", "999333444", "ABC-101", "Toyota Yaris", "Turno mañana", 1],
      ["María Conductora", "999333445", "ABC-202", "Hyundai Accent", "Zona sur", 1],
      ["Pedro Conductor", "999333446", "ABC-303", "Kia Rio", "Noche", 1],
      ["Diego Pausado", "999333499", "ABC-404", "Nissan Versa", "Licencia en trámite", 0],
    ];
    for (const [nombre, telefono, placa, vehiculo, notas, activo] of conductores) {
      const [[ex]] = await c.query(
        `SELECT id_conductor FROM taxi_conductor WHERE id_operador = ? AND telefono = ? LIMIT 1`,
        [ownerId, telefono]
      );
      if (!ex) {
        await c.query(
          `INSERT INTO taxi_conductor
             (id_operador, nombre, telefono, placa, vehiculo, notas, activo, password_hash)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [ownerId, nombre, telefono, placa, vehiculo, notas, activo, hash]
        );
      } else {
        await c.query(
          `UPDATE taxi_conductor
           SET password_hash = ?, nombre = ?, placa = ?, vehiculo = ?, notas = ?, activo = ?
           WHERE id_conductor = ?`,
          [hash, nombre, placa, vehiculo, notas, activo, ex.id_conductor]
        );
      }
    }

    const n = await countWhere(c, "taxi_viaje", "id_operador = ?", [ownerId]);
    if (n < 10) {
      const [pas] = await c.query(
        `SELECT id_pasajero FROM taxi_pasajero WHERE id_operador = ? AND activo = 1 ORDER BY id_pasajero`,
        [ownerId]
      );
      const [conds] = await c.query(
        `SELECT id_conductor FROM taxi_conductor WHERE id_operador = ? AND activo = 1 ORDER BY id_conductor`,
        [ownerId]
      );
      const trips = [
        ["San Isidro", "Miraflores", "solicitado", pas[0]?.id_pasajero, null],
        ["Surco", "La Molina", "asignado", pas[0]?.id_pasajero, conds[0]?.id_conductor],
        ["Callao", "Jesús María", "en_curso", pas[1]?.id_pasajero, conds[1]?.id_conductor],
        ["Miraflores", "Barranco", "finalizado", pas[0]?.id_pasajero, conds[0]?.id_conductor],
        ["San Borja", "Surquillo", "cancelado", pas[1]?.id_pasajero, null],
        ["Pueblo Libre", "Magdalena", "asignado", pas[2]?.id_pasajero, conds[2]?.id_conductor],
        ["Lince", "Breña", "solicitado", pas[1]?.id_pasajero, null],
        ["Chorrillos", "Surco", "finalizado", pas[0]?.id_pasajero, conds[1]?.id_conductor],
        ["San Miguel", "Callao", "en_curso", pas[2]?.id_pasajero, conds[0]?.id_conductor],
        ["Ate", "Santa Anita", "solicitado", pas[0]?.id_pasajero, null],
        ["Barranco", "Miraflores", "finalizado", pas[1]?.id_pasajero, conds[2]?.id_conductor],
        ["La Molina", "Surco", "asignado", pas[2]?.id_pasajero, conds[1]?.id_conductor],
      ];
      for (const [origen, destino, estado, idp, idc] of trips) {
        await c.query(
          `INSERT INTO taxi_viaje (id_operador, id_pasajero, id_conductor, origen, destino, estado)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [ownerId, idp ?? null, idc ?? null, origen, destino, estado]
        );
      }
    }
    log(`OK taxi owner=${ownerId}`);
  } finally {
    await c.end();
  }
}

/* ——— Delivery ——— */
async function seedDelivery() {
  const ownerId = await ensureOperator({
    database: DELIVERY_DATABASE,
    entitlementTable: "delivery_entitlement",
    adminTable: "delivery_admin",
    pk: "id_operador",
    nombre: "Operador Demo Delivery",
  });
  const hash = await hashPassword(PASS);
  const c = await dbConn(DELIVERY_DATABASE);
  try {
    for (const [nombre, telefono] of [
      ["Cliente Uno", "999111222"],
      ["Cliente Dos", "999111223"],
    ]) {
      const [[ex]] = await c.query(
        `SELECT id_cliente FROM delivery_cliente WHERE id_operador = ? AND telefono = ?`,
        [ownerId, telefono]
      );
      if (!ex) {
        await c.query(
          `INSERT INTO delivery_cliente (id_operador, nombre, telefono, password_hash) VALUES (?, ?, ?, ?)`,
          [ownerId, nombre, telefono, hash]
        );
      } else {
        await c.query(`UPDATE delivery_cliente SET password_hash = ? WHERE id_cliente = ?`, [
          hash,
          ex.id_cliente,
        ]);
      }
    }
    for (const [nombre, telefono] of [
      ["Repartidor A", "999333444"],
      ["Repartidor B", "999333445"],
      ["Repartidor C", "999333446"],
    ]) {
      const [[ex]] = await c.query(
        `SELECT id_repartidor FROM delivery_repartidor WHERE id_operador = ? AND telefono = ?`,
        [ownerId, telefono]
      );
      if (!ex) {
        await c.query(
          `INSERT INTO delivery_repartidor (id_operador, nombre, telefono, activo, password_hash) VALUES (?, ?, ?, 1, ?)`,
          [ownerId, nombre, telefono, hash]
        );
      } else {
        await c.query(
          `UPDATE delivery_repartidor SET password_hash = ?, activo = 1 WHERE id_repartidor = ?`,
          [hash, ex.id_repartidor]
        );
      }
    }
    const n = await countWhere(c, "delivery_pedido", "id_operador = ?", [ownerId]);
    if (n < 8) {
      const [cli] = await c.query(
        `SELECT id_cliente FROM delivery_cliente WHERE id_operador = ?`,
        [ownerId]
      );
      const [rep] = await c.query(
        `SELECT id_repartidor FROM delivery_repartidor WHERE id_operador = ?`,
        [ownerId]
      );
      const pedidos = [
        ["Jesús María 120", "Surco 450", "Documentos", "solicitado", cli[0]?.id_cliente, null],
        ["Miraflores 10", "San Isidro 88", "Paquete chico", "asignado", cli[0]?.id_cliente, rep[0]?.id_repartidor],
        ["Callao Mercado", "La Molina", "Caja", "en_camino", cli[1]?.id_cliente, rep[1]?.id_repartidor],
        ["Breña 22", "Lince 5", "Sobre", "entregado", cli[0]?.id_cliente, rep[0]?.id_repartidor],
        ["Magdalena", "Pueblo Libre", "Flores", "cancelado", cli[1]?.id_cliente, null],
        ["Barranco", "Chorrillos", "Comida", "asignado", cli[0]?.id_cliente, rep[2]?.id_repartidor],
        ["Surquillo", "San Borja", "Repuestos", "solicitado", cli[1]?.id_cliente, null],
        ["Ate", "Santa Anita", "Muestra", "entregado", cli[0]?.id_cliente, rep[1]?.id_repartidor],
        ["San Miguel", "Callao", "Kit", "en_camino", cli[1]?.id_cliente, rep[0]?.id_repartidor],
        ["Rimac", "Cercado", "Sobre A4", "solicitado", cli[0]?.id_cliente, null],
      ];
      for (const [recojo, entrega, detalle, estado, idc, idr] of pedidos) {
        await c.query(
          `INSERT INTO delivery_pedido
           (id_operador, id_cliente, id_repartidor, recojo, entrega, detalle, estado)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [ownerId, idc ?? null, idr ?? null, recojo, entrega, detalle, estado]
        );
      }
    }
    log(`OK delivery owner=${ownerId}`);
  } finally {
    await c.end();
  }
}

/* ——— Flotas ——— */
async function seedFlotas() {
  const ownerId = await ensureOperator({
    database: FLOTAS_DATABASE,
    entitlementTable: "flotas_entitlement",
    adminTable: "flotas_admin",
    pk: "id_empresa_flota",
    nombre: "Flota Demo",
  });
  const hash = await hashPassword(PASS);
  const c = await dbConn(FLOTAS_DATABASE);
  try {
    for (const [nombre, licencia] of [
      ["Conductor Flota 1", "Q12345678"],
      ["Conductor Flota 2", "Q87654321"],
    ]) {
      const [[ex]] = await c.query(
        `SELECT id_conductor FROM flotas_conductor WHERE id_empresa_flota = ? AND nombre = ?`,
        [ownerId, nombre]
      );
      if (!ex) {
        await c.query(
          `INSERT INTO flotas_conductor (id_empresa_flota, nombre, licencia, password_hash, activo)
           VALUES (?, ?, ?, ?, 1)`,
          [ownerId, nombre, licencia, hash]
        );
      }
    }
    const placas = ["ABC-101", "ABC-102", "ABC-103", "ABC-104", "ABC-105"];
    for (const [i, placa] of placas.entries()) {
      const [[ex]] = await c.query(
        `SELECT id_vehiculo FROM flotas_vehiculo WHERE id_empresa_flota = ? AND placa = ?`,
        [ownerId, placa]
      );
      if (!ex) {
        await c.query(
          `INSERT INTO flotas_vehiculo (id_empresa_flota, placa, marca, modelo, soat_vence, activo)
           VALUES (?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL ? MONTH), 1)`,
          [ownerId, placa, "Toyota", `Hilux ${i + 1}`, 3 + i]
        );
      }
    }
    const nComb = await countWhere(c, "flotas_combustible", "id_empresa_flota = ?", [ownerId]);
    if (nComb < 6) {
      const [vehs] = await c.query(
        `SELECT id_vehiculo FROM flotas_vehiculo WHERE id_empresa_flota = ?`,
        [ownerId]
      );
      for (let i = 0; i < 6; i++) {
        const v = vehs[i % vehs.length];
        if (!v) break;
        await c.query(
          `INSERT INTO flotas_combustible (id_empresa_flota, id_vehiculo, litros, monto, fecha)
           VALUES (?, ?, ?, ?, DATE_SUB(CURDATE(), INTERVAL ? DAY))`,
          [ownerId, v.id_vehiculo, 40 + i * 5, 280 + i * 20, i]
        );
      }
    }
    log(`OK flotas owner=${ownerId}`);
  } finally {
    await c.end();
  }
}

/* ——— Academia ——— */
async function seedAcademia() {
  const ownerId = await ensureOperator({
    database: ACADEMIA_DATABASE,
    entitlementTable: "academia_entitlement",
    adminTable: "academia_admin",
    pk: "id_org",
    nombre: "Academia Demo",
  });
  const hash = await hashPassword(PASS);
  const c = await dbConn(ACADEMIA_DATABASE);
  try {
    const cursos = [
      ["Intro a ventas", "Fundamentos para fuerza de campo"],
      ["Excel operativo", "Tablas y reportes"],
      ["Atención al cliente", "Scripts y objeciones"],
      ["Liderazgo de equipos", "Rutas y coaching"],
    ];
    for (const [titulo, descripcion] of cursos) {
      const [[ex]] = await c.query(
        `SELECT id_curso FROM academia_curso WHERE id_org = ? AND titulo = ?`,
        [ownerId, titulo]
      );
      if (!ex) {
        await c.query(
          `INSERT INTO academia_curso (id_org, titulo, descripcion, activo) VALUES (?, ?, ?, 1)`,
          [ownerId, titulo, descripcion]
        );
      }
    }
    const alumnos = [
      ["alumno1@demo.local", "Alumno Uno"],
      ["alumno2@demo.local", "Alumno Dos"],
      ["alumno3@demo.local", "Alumno Tres"],
    ];
    for (const [email, nombre] of alumnos) {
      const [[ex]] = await c.query(
        `SELECT id_alumno FROM academia_alumno WHERE id_org = ? AND email = ?`,
        [ownerId, email]
      );
      if (!ex) {
        await c.query(
          `INSERT INTO academia_alumno (id_org, email, nombre, password_hash) VALUES (?, ?, ?, ?)`,
          [ownerId, email, nombre, hash]
        );
      } else {
        await c.query(`UPDATE academia_alumno SET password_hash = ? WHERE id_alumno = ?`, [
          hash,
          ex.id_alumno,
        ]);
      }
    }
    const nIns = await countWhere(c, "academia_inscripcion", "id_org = ?", [ownerId]);
    if (nIns < 6) {
      const [cs] = await c.query(`SELECT id_curso FROM academia_curso WHERE id_org = ?`, [ownerId]);
      const [as_] = await c.query(`SELECT id_alumno FROM academia_alumno WHERE id_org = ?`, [
        ownerId,
      ]);
      let p = 10;
      for (const curso of cs) {
        for (const al of as_) {
          const [[ex]] = await c.query(
            `SELECT id_inscripcion FROM academia_inscripcion WHERE id_curso = ? AND id_alumno = ?`,
            [curso.id_curso, al.id_alumno]
          );
          if (!ex) {
            await c.query(
              `INSERT INTO academia_inscripcion (id_org, id_curso, id_alumno, progreso_pct)
               VALUES (?, ?, ?, ?)`,
              [ownerId, curso.id_curso, al.id_alumno, p % 100]
            );
            p += 17;
          }
        }
      }
    }
    log(`OK academia owner=${ownerId}`);
  } finally {
    await c.end();
  }
}

/* ——— Agenda ——— */
async function seedAgenda() {
  const ownerId = await ensureOperator({
    database: AGENDA_DATABASE,
    entitlementTable: "agenda_entitlement",
    adminTable: "agenda_admin",
    pk: "id_profesional",
    nombre: "Profesional Demo",
  });
  const c = await dbConn(AGENDA_DATABASE);
  try {
    const nSlots = await countWhere(c, "agenda_slot", "id_profesional = ?", [ownerId]);
    if (nSlots < 12) {
      for (let d = 0; d < 6; d++) {
        for (const hour of [10, 15]) {
          await c.query(
            `INSERT INTO agenda_slot (id_profesional, inicia_en, minutos, precio, disponible)
             VALUES (
               ?,
               DATE_ADD(DATE_ADD(CURDATE(), INTERVAL ? DAY), INTERVAL ? HOUR),
               30,
               ?,
               1
             )`,
            [ownerId, d + 1, hour, 80 + d * 5]
          );
        }
      }
    }
    const nRes = await countWhere(c, "agenda_reserva", "id_profesional = ?", [ownerId]);
    if (nRes < 5) {
      const [slots] = await c.query(
        `SELECT id_slot FROM agenda_slot WHERE id_profesional = ? ORDER BY id_slot LIMIT 5`,
        [ownerId]
      );
      const estados = ["pendiente", "pagado", "pendiente", "pagado", "anulado"];
      for (let i = 0; i < slots.length; i++) {
        await c.query(
          `INSERT INTO agenda_reserva
           (id_profesional, id_slot, cliente_nombre, cliente_email, estado_pago)
           VALUES (?, ?, ?, ?, ?)`,
          [
            ownerId,
            slots[i].id_slot,
            `Cliente ${i + 1}`,
            `cliente${i + 1}@demo.local`,
            estados[i],
          ]
        );
        await c.query(`UPDATE agenda_slot SET disponible = 0 WHERE id_slot = ?`, [
          slots[i].id_slot,
        ]);
      }
    }
    log(`OK agenda owner=${ownerId}`);
  } finally {
    await c.end();
  }
}

async function ensureTenantEntitlement(database, table, extraCols = {}, slugCols = null) {
  const c = await dbConn(database);
  try {
    const [[ex]] = await c.query(
      `SELECT id_tenant FROM \`${table}\` WHERE id_tenant = ? LIMIT 1`,
      [TENANT]
    );
    if (ex) {
      await c.query(`UPDATE \`${table}\` SET activo = 1, plan_flag = 'demo' WHERE id_tenant = ?`, [
        TENANT,
      ]);
      if (slugCols) {
        await c.query(
          `UPDATE \`${table}\` SET slug = ?, nombre = ? WHERE id_tenant = ?`,
          [slugCols.slug, slugCols.nombre, TENANT]
        );
      }
    } else {
      if (slugCols) {
        await c.query(
          `INSERT INTO \`${table}\` (id_tenant, activo, plan_flag, slug, nombre) VALUES (?, 1, 'demo', ?, ?)`,
          [TENANT, slugCols.slug, slugCols.nombre]
        );
      } else {
        await c.query(
          `INSERT INTO \`${table}\` (id_tenant, activo, plan_flag) VALUES (?, 1, 'demo')`,
          [TENANT]
        );
      }
    }
  } finally {
    await c.end();
  }
}

/* ——— Sync ——— */
async function seedSync() {
  await ensureTenantEntitlement(SYNC_DATABASE, "sync_entitlement");
  const c = await dbConn(SYNC_DATABASE);
  try {
    const canales = [
      ["shopify", "Shopify"],
      ["ml", "Mercado Libre"],
      ["ecommerce", "Ecommerce Horytek"],
    ];
    for (const [codigo, nombre] of canales) {
      const [[ex]] = await c.query(
        `SELECT id_canal FROM sync_canal WHERE id_tenant = ? AND codigo = ?`,
        [TENANT, codigo]
      );
      if (!ex) {
        await c.query(
          `INSERT INTO sync_canal (id_tenant, codigo, nombre, activo) VALUES (?, ?, ?, 1)`,
          [TENANT, codigo, nombre]
        );
      }
    }
    const [chs] = await c.query(`SELECT id_canal, codigo FROM sync_canal WHERE id_tenant = ?`, [
      TENANT,
    ]);
    const nMap = await countWhere(c, "sync_mapeo_sku", "id_tenant = ?", [TENANT]);
    if (nMap < 8) {
      let i = 1;
      for (const ch of chs) {
        for (let k = 0; k < 3; k++) {
          const sku = `DEMO-SKU-${i}`;
          const [[ex]] = await c.query(
            `SELECT id_mapeo FROM sync_mapeo_sku WHERE id_tenant = ? AND id_canal = ? AND sku_origen = ?`,
            [TENANT, ch.id_canal, sku]
          );
          if (!ex) {
            await c.query(
              `INSERT INTO sync_mapeo_sku (id_tenant, id_canal, sku_origen, sku_destino, activo)
               VALUES (?, ?, ?, ?, 1)`,
              [TENANT, ch.id_canal, sku, `${ch.codigo}-${sku}`]
            );
          }
          i++;
        }
      }
    }
    const nJobs = await countWhere(c, "sync_job", "id_tenant = ?", [TENANT]);
    if (nJobs < 5) {
      const estados = ["ok", "error", "pending", "ok", "running"];
      for (let i = 0; i < 5; i++) {
        await c.query(
          `INSERT INTO sync_job (id_tenant, id_canal, tipo, estado, mensaje)
           VALUES (?, ?, 'pull_stock', ?, ?)`,
          [TENANT, chs[i % chs.length]?.id_canal ?? null, estados[i], `Job demo ${i + 1}`]
        );
      }
    }
    log("OK sync");
  } finally {
    await c.end();
  }
}

/* ——— Mayorista ——— */
async function seedMayorista() {
  const hash = await hashPassword(PASS);
  const c = await dbConn(MAYORISTA_DATABASE);
  try {
    // entitlement table may exist
    try {
      await c.query(
        `INSERT IGNORE INTO mayorista_entitlement (id_tenant, activo, plan_flag) VALUES (?, 1, 'demo')`,
        [TENANT]
      );
    } catch {
      /* table optional */
    }

    let [[tienda]] = await c.query(
      `SELECT id_tienda FROM mayorista_tienda WHERE slug = ? LIMIT 1`,
      [SLUG]
    );
    if (!tienda) {
      const [r] = await c.query(
        `INSERT INTO mayorista_tienda (id_tenant, slug, nombre, activo, whatsapp)
         VALUES (?, ?, 'Distribuidora Demo', 1, '51999900000')`,
        [TENANT, SLUG]
      );
      tienda = { id_tienda: r.insertId };
    }
    const idTienda = tienda.id_tienda;

    let [[lista]] = await c.query(
      `SELECT id_lista FROM mayorista_lista_precio WHERE id_tienda = ? AND nombre = 'Lista Demo' LIMIT 1`,
      [idTienda]
    );
    if (!lista) {
      const [r] = await c.query(
        `INSERT INTO mayorista_lista_precio (id_tenant, id_tienda, nombre, moneda, activo)
         VALUES (?, ?, 'Lista Demo', 'PEN', 1)`,
        [TENANT, idTienda]
      );
      lista = { id_lista: r.insertId };
    }
    const idLista = lista.id_lista;

    const nItems = await countWhere(c, "mayorista_lista_item", "id_lista = ?", [idLista]);
    if (nItems < 12) {
      for (let i = 1; i <= 12; i++) {
        const sku = `MAY-DEMO-${String(i).padStart(2, "0")}`;
        const [[ex]] = await c.query(
          `SELECT id_item FROM mayorista_lista_item WHERE id_lista = ? AND sku = ?`,
          [idLista, sku]
        );
        if (!ex) {
          await c.query(
            `INSERT INTO mayorista_lista_item
             (id_lista, id_tenant, sku, nombre, precio, min_cantidad, activo)
             VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [idLista, TENANT, sku, `Producto mayorista ${i}`, 10 + i * 3.5, i % 3 === 0 ? 6 : 1]
          );
        }
      }
    }

    for (const [email, razon] of [
      ["comprador@demo.local", "Comercial Demo SAC"],
      ["comprador2@demo.local", "Negocios Norte EIRL"],
    ]) {
      const [[ex]] = await c.query(
        `SELECT id_comprador FROM mayorista_comprador WHERE id_tienda = ? AND email = ?`,
        [idTienda, email]
      );
      if (!ex) {
        await c.query(
          `INSERT INTO mayorista_comprador
           (id_tenant, id_tienda, email, password_hash, razon_social, ruc, id_lista, activo)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          [TENANT, idTienda, email, hash, razon, "20100000001", idLista]
        );
      } else {
        await c.query(
          `UPDATE mayorista_comprador SET password_hash = ?, id_lista = ? WHERE id_comprador = ?`,
          [hash, idLista, ex.id_comprador]
        );
      }
    }

    const nPed = await countWhere(c, "mayorista_pedido", "id_tienda = ?", [idTienda]);
    if (nPed < 4) {
      const [[comp]] = await c.query(
        `SELECT id_comprador FROM mayorista_comprador WHERE id_tienda = ? LIMIT 1`,
        [idTienda]
      );
      const [items] = await c.query(
        `SELECT sku, nombre, precio FROM mayorista_lista_item WHERE id_lista = ? LIMIT 4`,
        [idLista]
      );
      const estados = ["enviado", "confirmado", "despachado", "borrador"];
      for (let i = 0; i < 4; i++) {
        const total = items.reduce((s, it) => s + Number(it.precio) * (i + 1), 0);
        const [pr] = await c.query(
          `INSERT INTO mayorista_pedido
           (id_tenant, id_tienda, id_comprador, estado, total, notas)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [TENANT, idTienda, comp.id_comprador, estados[i], total, `Pedido demo ${i + 1}`]
        );
        for (const it of items) {
          const qty = i + 1;
          const subtotal = Number(it.precio) * qty;
          await c.query(
            `INSERT INTO mayorista_pedido_item
             (id_pedido, id_tenant, sku, nombre, cantidad, precio_unit, subtotal)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [pr.insertId, TENANT, it.sku, it.nombre, qty, it.precio, subtotal]
          );
        }
      }
    }
    log(`OK mayorista tienda=${idTienda}`);
  } finally {
    await c.end();
  }
}

/* ——— Taller ——— */
async function seedTaller() {
  await ensureTenantEntitlement(TALLER_DATABASE, "taller_entitlement");
  const c = await dbConn(TALLER_DATABASE);
  try {
    for (const [nombre, pin] of [
      ["Operador Planta 1", PIN],
      ["Operador Planta 2", "5678"],
    ]) {
      const [[ex]] = await c.query(
        `SELECT id_operador FROM taller_operador WHERE id_tenant = ? AND nombre = ?`,
        [TENANT, nombre]
      );
      if (!ex) {
        await c.query(
          `INSERT INTO taller_operador (id_tenant, nombre, pin, activo) VALUES (?, ?, ?, 1)`,
          [TENANT, nombre, pin]
        );
      }
    }
    const n = await countWhere(c, "taller_ot", "id_tenant = ?", [TENANT]);
    if (n < 6) {
      const estados = ["borrador", "en_proceso", "terminada", "en_proceso", "cancelada", "borrador"];
      for (let i = 1; i <= 6; i++) {
        const codigo = `OT-DEMO-${i}`;
        const [[ex]] = await c.query(
          `SELECT id_ot FROM taller_ot WHERE id_tenant = ? AND codigo = ?`,
          [TENANT, codigo]
        );
        if (!ex) {
          const [r] = await c.query(
            `INSERT INTO taller_ot (id_tenant, codigo, titulo, estado, merma_pct, notas)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [TENANT, codigo, `Orden taller ${i}`, estados[i - 1], i, `Seed demo ${i}`]
          );
          await c.query(
            `INSERT INTO taller_insumo (id_ot, id_tenant, sku, nombre, cantidad) VALUES (?, ?, ?, ?, ?)`,
            [r.insertId, TENANT, `INS-${i}`, `Insumo ${i}`, i * 2]
          );
        }
      }
    }
    log("OK taller");
  } finally {
    await c.end();
  }
}

/* ——— Preventa ——— */
async function seedPreventa() {
  const c = await dbConn(PREVENTA_DATABASE);
  try {
    const [[ent]] = await c.query(
      `SELECT id_tienda FROM preventa_entitlement WHERE id_tienda = ? OR id_tenant = ? LIMIT 1`,
      [TENANT, TENANT]
    );
    let idTienda = ent?.id_tienda;
    if (!idTienda) {
      await c.query(
        `INSERT INTO preventa_entitlement (id_tienda, id_tenant, activo, plan_flag)
         VALUES (?, ?, 1, 'demo')`,
        [TENANT, TENANT]
      );
      idTienda = TENANT;
    } else {
      await c.query(
        `UPDATE preventa_entitlement SET activo = 1, id_tenant = ?, plan_flag = 'demo' WHERE id_tienda = ?`,
        [TENANT, idTienda]
      );
    }

    let [[camp]] = await c.query(
      `SELECT id_campania FROM preventa_campania WHERE slug = ? LIMIT 1`,
      [SLUG]
    );
    if (!camp) {
      const [r] = await c.query(
        `INSERT INTO preventa_campania (id_tienda, slug, nombre, anticipo_pct, activo)
         VALUES (?, ?, 'Campaña Demo', 30, 1)`,
        [idTienda, SLUG]
      );
      camp = { id_campania: r.insertId };
    }
    const idCamp = camp.id_campania;
    const nItems = await countWhere(c, "preventa_item", "id_campania = ?", [idCamp]);
    if (nItems < 10) {
      for (let i = 1; i <= 10; i++) {
        const sku = `PRE-DEMO-${i}`;
        const [[ex]] = await c.query(
          `SELECT id_item FROM preventa_item WHERE id_campania = ? AND sku = ?`,
          [idCamp, sku]
        );
        if (!ex) {
          await c.query(
            `INSERT INTO preventa_item (id_campania, sku, nombre, precio, cupo, reservados)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [idCamp, sku, `Drop item ${i}`, 49 + i * 10, 100, i]
          );
        }
      }
    }
    const nRes = await countWhere(c, "preventa_reserva", "id_campania = ?", [idCamp]);
    if (nRes < 6) {
      const [items] = await c.query(
        `SELECT id_item, precio FROM preventa_item WHERE id_campania = ? LIMIT 6`,
        [idCamp]
      );
      const estados = ["pendiente", "pagado", "pendiente", "pagado", "anulado", "pendiente"];
      for (let i = 0; i < items.length; i++) {
        await c.query(
          `INSERT INTO preventa_reserva
           (id_campania, id_item, cliente_nombre, cliente_email, cantidad, monto_anticipo, estado_pago)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            idCamp,
            items[i].id_item,
            `Reservante ${i + 1}`,
            `reserva${i + 1}@demo.local`,
            1 + (i % 3),
            Number(items[i].precio) * 0.3,
            estados[i],
          ]
        );
      }
    }
    log(`OK preventa campania=${idCamp}`);
  } finally {
    await c.end();
  }
}

/* ——— CRM ——— */
async function seedCrm() {
  await ensureTenantEntitlement(CRM_DATABASE, "crm_entitlement");
  const c = await dbConn(CRM_DATABASE);
  try {
    let [[pipe]] = await c.query(
      `SELECT id_pipeline FROM crm_pipeline WHERE id_tenant = ? AND nombre = 'Pipeline Demo' LIMIT 1`,
      [TENANT]
    );
    if (!pipe) {
      const [r] = await c.query(
        `INSERT INTO crm_pipeline (id_tenant, nombre) VALUES (?, 'Pipeline Demo')`,
        [TENANT]
      );
      pipe = { id_pipeline: r.insertId };
      const etapas = ["Lead", "Calificado", "Propuesta", "Negociación", "Cierre"];
      for (let i = 0; i < etapas.length; i++) {
        await c.query(
          `INSERT INTO crm_etapa (id_pipeline, id_tenant, nombre, orden) VALUES (?, ?, ?, ?)`,
          [pipe.id_pipeline, TENANT, etapas[i], i]
        );
      }
    }
    const [etapas] = await c.query(
      `SELECT id_etapa FROM crm_etapa WHERE id_pipeline = ? ORDER BY orden`,
      [pipe.id_pipeline]
    );
    const nDeals = await countWhere(c, "crm_deal", "id_tenant = ?", [TENANT]);
    if (nDeals < 8) {
      for (let i = 1; i <= 8; i++) {
        const etapa = etapas[(i - 1) % etapas.length];
        const estado = i === 7 ? "ganado" : i === 8 ? "perdido" : "abierto";
        await c.query(
          `INSERT INTO crm_deal
           (id_tenant, id_pipeline, id_etapa, titulo, monto, estado)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [TENANT, pipe.id_pipeline, etapa.id_etapa, `Deal demo ${i}`, 1000 * i, estado]
        );
      }
    }
    const nAct = await countWhere(c, "crm_actividad", "id_tenant = ?", [TENANT]);
    if (nAct < 6) {
      const [deals] = await c.query(
        `SELECT id_deal FROM crm_deal WHERE id_tenant = ? LIMIT 6`,
        [TENANT]
      );
      for (let i = 0; i < deals.length; i++) {
        await c.query(
          `INSERT INTO crm_actividad (id_tenant, id_deal, tipo, nota) VALUES (?, ?, ?, ?)`,
          [TENANT, deals[i].id_deal, i % 2 ? "llamada" : "nota", `Actividad demo ${i + 1}`]
        );
      }
    }
    log("OK crm");
  } finally {
    await c.end();
  }
}

/* ——— Envíos ——— */
async function seedEnvios() {
  await ensureTenantEntitlement(ENVIOS_DATABASE, "envios_entitlement");
  const c = await dbConn(ENVIOS_DATABASE);
  try {
    const n = await countWhere(c, "envios_guia", "id_tenant = ?", [TENANT]);
    if (n < 5) {
      const estados = ["creada", "en_transito", "entregada", "en_transito", "devuelta"];
      for (let i = 1; i <= 5; i++) {
        const codigo = `DEMO0${i}`;
        const [[ex]] = await c.query(`SELECT id_guia FROM envios_guia WHERE codigo = ?`, [codigo]);
        if (ex) continue;
        const [r] = await c.query(
          `INSERT INTO envios_guia (id_tenant, codigo, courier, destinatario, destino, estado)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [TENANT, codigo, i % 2 ? "Olva" : "manual", `Destinatario ${i}`, `Surco ${i}00`, estados[i - 1]]
        );
        const eventos = [
          ["creada", "Guía generada"],
          ["recolectado", "Recolectado en almacén"],
          ["en_transito", "En tránsito hub"],
        ];
        if (estados[i - 1] === "entregada") eventos.push(["entregada", "Entregado al destinatario"]);
        if (estados[i - 1] === "devuelta") eventos.push(["devuelta", "Devolución a origen"]);
        for (const [estado, detalle] of eventos) {
          await c.query(
            `INSERT INTO envios_evento (id_guia, estado, detalle) VALUES (?, ?, ?)`,
            [r.insertId, estado, detalle]
          );
        }
      }
    }
    log("OK envios");
  } finally {
    await c.end();
  }
}

/* ——— WMS ——— */
async function seedWms() {
  await ensureTenantEntitlement(WMS_DATABASE, "wms_entitlement");
  const c = await dbConn(WMS_DATABASE);
  try {
    for (let i = 1; i <= 6; i++) {
      const codigo = `U-DEMO-${i}`;
      const [[ex]] = await c.query(
        `SELECT id_ubicacion FROM wms_ubicacion WHERE id_tenant = ? AND codigo = ?`,
        [TENANT, codigo]
      );
      if (!ex) {
        await c.query(
          `INSERT INTO wms_ubicacion (id_tenant, codigo, nombre) VALUES (?, ?, ?)`,
          [TENANT, codigo, `Pasillo ${i}`]
        );
      }
    }
    const n = await countWhere(c, "wms_tarea", "id_tenant = ?", [TENANT]);
    if (n < 10) {
      const [ubs] = await c.query(`SELECT id_ubicacion FROM wms_ubicacion WHERE id_tenant = ?`, [
        TENANT,
      ]);
      const tipos = ["picking", "packing", "conteo"];
      const estados = ["pendiente", "en_curso", "hecha"];
      for (let i = 1; i <= 10; i++) {
        await c.query(
          `INSERT INTO wms_tarea (id_tenant, tipo, sku, cantidad, id_ubicacion, estado)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            TENANT,
            tipos[i % 3],
            `WMS-SKU-${i}`,
            i,
            ubs[(i - 1) % ubs.length]?.id_ubicacion ?? null,
            estados[i % 3],
          ]
        );
      }
    }
    log("OK wms");
  } finally {
    await c.end();
  }
}

/* ——— Despacho ——— */
async function seedDespacho() {
  await ensureTenantEntitlement(DESPACHO_DATABASE, "despacho_entitlement");
  const c = await dbConn(DESPACHO_DATABASE);
  try {
    for (const [nombre, pin] of [
      ["Chofer Demo 1", PIN],
      ["Chofer Demo 2", "5678"],
    ]) {
      const [[ex]] = await c.query(
        `SELECT id_chofer FROM despacho_chofer WHERE id_tenant = ? AND nombre = ?`,
        [TENANT, nombre]
      );
      if (!ex) {
        await c.query(
          `INSERT INTO despacho_chofer (id_tenant, nombre, pin, activo) VALUES (?, ?, ?, 1)`,
          [TENANT, nombre, pin]
        );
      }
    }
    const nR = await countWhere(c, "despacho_ruta", "id_tenant = ?", [TENANT]);
    if (nR < 2) {
      for (let r = 1; r <= 2; r++) {
        const [rr] = await c.query(
          `INSERT INTO despacho_ruta (id_tenant, fecha, vehiculo, chofer, estado)
           VALUES (?, DATE_ADD(CURDATE(), INTERVAL ? DAY), ?, ?, ?)`,
          [TENANT, r - 1, `VH-DEMO-${r}`, `Chofer Demo ${r}`, r === 1 ? "planificada" : "en_ruta"]
        );
        for (let p = 1; p <= 4; p++) {
          await c.query(
            `INSERT INTO despacho_parada
             (id_ruta, id_tenant, secuencia, direccion, cliente, estado)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              rr.insertId,
              TENANT,
              p,
              `Dirección zona ${p}`,
              `Cliente ${p}`,
              p === 1 ? "entregada" : "pendiente",
            ]
          );
        }
      }
    }
    log("OK despacho");
  } finally {
    await c.end();
  }
}

/* ——— Campo ——— */
async function seedCampo() {
  await ensureTenantEntitlement(CAMPO_DATABASE, "campo_entitlement");
  const c = await dbConn(CAMPO_DATABASE);
  try {
    const vendedores = [
      ["Vendedor Norte", "1234"],
      ["Vendedor Sur", "2345"],
      ["Vendedor Este", "3456"],
      ["Vendedor Oeste", "4567"],
    ];
    for (const [nombre, pin] of vendedores) {
      const [[ex]] = await c.query(
        `SELECT id_vendedor FROM campo_vendedor WHERE id_tenant = ? AND nombre = ?`,
        [TENANT, nombre]
      );
      if (!ex) {
        await c.query(
          `INSERT INTO campo_vendedor (id_tenant, nombre, pin, activo) VALUES (?, ?, ?, 1)`,
          [TENANT, nombre, pin]
        );
      }
    }
    const n = await countWhere(c, "campo_checkin", "id_tenant = ?", [TENANT]);
    if (n < 12) {
      const [vs] = await c.query(`SELECT id_vendedor FROM campo_vendedor WHERE id_tenant = ?`, [
        TENANT,
      ]);
      const points = [
        [-12.0969, -77.0365],
        [-12.1191, -77.0305],
        [-12.1359, -76.9978],
        [-12.0508, -77.125],
      ];
      for (let i = 0; i < 12; i++) {
        const [lat, lng] = points[i % points.length];
        await c.query(
          `INSERT INTO campo_checkin (id_tenant, id_vendedor, lat, lng, nota)
           VALUES (?, ?, ?, ?, ?)`,
          [
            TENANT,
            vs[i % vs.length].id_vendedor,
            lat + i * 0.001,
            lng + i * 0.001,
            `Visita demo ${i + 1}`,
          ]
        );
      }
    }
    log("OK campo");
  } finally {
    await c.end();
  }
}

/* ——— Mantenimiento ——— */
async function seedMantto() {
  await ensureTenantEntitlement(MANTENIMIENTO_DATABASE, "mantto_entitlement");
  const c = await dbConn(MANTENIMIENTO_DATABASE);
  try {
    for (const [nombre, pin] of [
      ["Técnico Demo 1", PIN],
      ["Técnico Demo 2", "5678"],
    ]) {
      const [[ex]] = await c.query(
        `SELECT id_tecnico FROM mantto_tecnico WHERE id_tenant = ? AND nombre = ?`,
        [TENANT, nombre]
      );
      if (!ex) {
        await c.query(
          `INSERT INTO mantto_tecnico (id_tenant, nombre, pin, activo) VALUES (?, ?, ?, 1)`,
          [TENANT, nombre, pin]
        );
      }
    }
    for (let i = 1; i <= 4; i++) {
      const codigo = `ACT-DEMO-${i}`;
      const [[ex]] = await c.query(
        `SELECT id_activo FROM mantto_activo WHERE id_tenant = ? AND codigo = ?`,
        [TENANT, codigo]
      );
      if (!ex) {
        await c.query(
          `INSERT INTO mantto_activo (id_tenant, codigo, nombre, ubicacion) VALUES (?, ?, ?, ?)`,
          [TENANT, codigo, `Activo ${i}`, `Planta ${i}`]
        );
      }
    }
    const n = await countWhere(c, "mantto_ot", "id_tenant = ?", [TENANT]);
    if (n < 6) {
      const [acts] = await c.query(`SELECT id_activo FROM mantto_activo WHERE id_tenant = ?`, [
        TENANT,
      ]);
      const tipos = ["preventivo", "correctivo"];
      const estados = ["abierta", "en_curso", "cerrada"];
      for (let i = 1; i <= 6; i++) {
        await c.query(
          `INSERT INTO mantto_ot (id_tenant, id_activo, tipo, titulo, estado)
           VALUES (?, ?, ?, ?, ?)`,
          [
            TENANT,
            acts[(i - 1) % acts.length].id_activo,
            tipos[i % 2],
            `OT mantto demo ${i}`,
            estados[i % 3],
          ]
        );
      }
    }
    log("OK mantenimiento");
  } finally {
    await c.end();
  }
}

/* ——— Recluta ——— */
async function seedRecluta() {
  await ensureTenantEntitlement(RECLUTA_DATABASE, "recluta_entitlement", {}, {
    slug: SLUG,
    nombre: "Portal Recluta Demo",
  });
  const c = await dbConn(RECLUTA_DATABASE);
  try {
    await c.query(
      `UPDATE recluta_entitlement SET slug = ?, nombre = ?, activo = 1 WHERE id_tenant = ?`,
      [SLUG, "Portal Recluta Demo", TENANT]
    );
    const nVac = await countWhere(c, "recluta_vacante", "id_tenant = ?", [TENANT]);
    if (nVac < 5) {
      for (let i = 1; i <= 5; i++) {
        await c.query(
          `INSERT INTO recluta_vacante (id_tenant, titulo, descripcion, publicada)
           VALUES (?, ?, ?, 1)`,
          [TENANT, `Vacante demo ${i}`, `Descripción rol ${i} — seed platform`]
        );
      }
    }
    const nPost = await countWhere(c, "recluta_postulacion", "id_tenant = ?", [TENANT]);
    if (nPost < 8) {
      const [vacs] = await c.query(
        `SELECT id_vacante FROM recluta_vacante WHERE id_tenant = ?`,
        [TENANT]
      );
      const etapas = ["nueva", "revision", "entrevista", "oferta", "contratada", "descartada", "nueva", "revision"];
      for (let i = 0; i < 8; i++) {
        await c.query(
          `INSERT INTO recluta_postulacion
           (id_tenant, id_vacante, nombre, email, telefono, etapa)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            TENANT,
            vacs[i % vacs.length].id_vacante,
            `Postulante ${i + 1}`,
            `postulante${i + 1}@demo.local`,
            `99910020${i}`,
            etapas[i],
          ]
        );
      }
    }
    log("OK recluta");
  } finally {
    await c.end();
  }
}

/**
 * Usuario ERP dedicado para demos de /platform/* (no toca cuentas reales como tormenta/admin).
 * Override: SEED_ERP_USER=mi.usuario
 */
async function seedErpDemoUser() {
  if (!DATABASE) {
    log("SKIP ERP demo user: DB_DATABASE vacío");
    return;
  }
  const usua = (process.env.SEED_ERP_USER || "platform.demo").trim().slice(0, 30);
  const hash = await hashPassword(PASS);
  const c = await dbConn(DATABASE);
  try {
    const [[anchor]] = await c.query(
      `SELECT id_empresa, id_rol, plan_pago
       FROM usuario
       WHERE id_tenant = ? AND estado_usuario = 1
       ORDER BY CASE WHEN id_rol = 1 THEN 0 ELSE 1 END, id_usuario ASC
       LIMIT 1`,
      [TENANT]
    );
    if (!anchor?.id_empresa) {
      log(`SKIP ERP demo user: no hay usuarios activos en tenant ${TENANT}`);
      return;
    }
    const [[existing]] = await c.query(
      `SELECT id_usuario FROM usuario WHERE usua = ? LIMIT 1`,
      [usua]
    );
    if (existing) {
      await c.query(
        `UPDATE usuario
         SET contra = ?, estado_usuario = 1, id_tenant = ?, id_empresa = ?, id_rol = 1
         WHERE id_usuario = ?`,
        [hash, TENANT, anchor.id_empresa, existing.id_usuario]
      );
      log(`OK ERP demo user actualizado usua=${usua} tenant=${TENANT}`);
    } else {
      await c.query(
        `INSERT INTO usuario
         (usua, contra, id_rol, estado_usuario, id_tenant, id_empresa, plan_pago)
         VALUES (?, ?, 1, 1, ?, ?, ?)`,
        [usua, hash, TENANT, anchor.id_empresa, anchor.plan_pago ?? 1]
      );
      log(`OK ERP demo user creado usua=${usua} tenant=${TENANT}`);
    }
  } finally {
    await c.end();
  }
}

async function main() {
  log(`=== seed_platform_demo SEED_TENANT_ID=${TENANT} ===`);
  await ensureDatabases();
  await applySchemas();

  await seedErpDemoUser();
  await seedTaxi();
  await seedDelivery();
  await seedFlotas();
  await seedAcademia();
  await seedAgenda();

  await seedSync();
  await seedMayorista();
  await seedTaller();
  await seedPreventa();
  await seedCrm();
  await seedEnvios();
  await seedWms();
  await seedDespacho();
  await seedCampo();
  await seedMantto();
  await seedRecluta();

  log("\n=== Credenciales ===");
  log(`ERP platform demo: ${(process.env.SEED_ERP_USER || "platform.demo")} / ${PASS} (tenant ${TENANT})`);
  log(`Admin operadores: slug=${SLUG} email=${ADMIN_EMAIL} pass=${PASS}`);
  log(`Taxi equipo (2.º admin): ops@demo.local / ${PASS}`);
  log(`Taxi/Delivery pasajero-cliente: tel 999111222 / ${PASS}`);
  log(`Taxi/Delivery conductor-repartidor: tel 999333444 / ${PASS}`);
  log(`Academia alumno: alumno1@demo.local / ${PASS}`);
  log(`Mayorista comprador: comprador@demo.local / ${PASS}`);
  log(`Campo vendedor PIN: 1234 (Vendedor Norte)`);
  log(`Mantto/Despacho/Taller PIN: ${PIN}`);
  log("\n=== URLs ===");
  log("/login?mode=taxi → /taxi-admin (viajes, conductores, pasajeros, equipo, operador)");
  log("/taxi/demo · /taxi/demo/conductor");
  log("/delivery/demo · /delivery/demo/repartidor");
  log("/flotas-admin · /academia/demo · /agenda/demo");
  log(`/mayorista-admin · /b2b/demo · /preventa/demo · /recluta/demo · /tracking/DEMO01`);
  log(`/platform/* con sesión ERP ${process.env.SEED_ERP_USER || "platform.demo"} tenant ${TENANT}`);
  log(`/catalogo/${TENANT} (Catálogo WA / ERP)`);
  log("=== seed OK ===");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
