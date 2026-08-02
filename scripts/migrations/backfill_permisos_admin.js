import mysql from "mysql2/promise";
import { DATABASE, HOST, PASSWORD, PORT_DB, USER } from "../../src/config.js";
import { aprovisionarPermisosAdmin } from "../../src/services/authz/permisosProvisioning.js";

/**
 * Backfill retroactivo: para cada módulo y submódulo YA EXISTENTE, asegura
 * que el Administrador de cada tenant tenga su fila en `permisos` (el
 * backlog de "~60 filas a mano" que describía PLAN_TRABAJO_SOCIO.md).
 *
 * De acá en adelante `addModulo`/`addSubmodulo` ya aprovisionan solos
 * (`permisosProvisioning.js`) — este script es solo para ponerse al día con
 * lo que se creó antes de eso. Idempotente: correrlo de nuevo no duplica
 * nada (mismo check-then-insert que usa el aprovisionamiento en vivo).
 *
 * Uso: npm run db:migrate:backfill-permisos
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
const esHostLocal = (host) => HOSTS_LOCALES.has(String(host).trim().toLowerCase());

const ejecutar = async () => {
  if (!HOST || !DATABASE || !USER) {
    throw new Error("Falta configurar la conexión MySQL local en el archivo .env.");
  }
  if (!esHostLocal(HOST) && !process.env.ALLOW_REMOTE_MIGRATE) {
    throw new Error("Migración cancelada: esta versión solo está autorizada para MySQL local (o establece ALLOW_REMOTE_MIGRATE=1).");
  }

  const cx = await mysql.createConnection({
    host: HOST, database: DATABASE, user: USER, password: PASSWORD, port: PORT_DB, connectTimeout: 5000,
  });

  try {
    const [modulos] = await cx.query("SELECT id_modulo, nombre_modulo FROM modulo");
    const [submodulos] = await cx.query("SELECT id_submodulo, id_modulo, nombre_sub FROM submodulos");

    let totalCreados = 0;
    for (const m of modulos) {
      const creados = await aprovisionarPermisosAdmin(cx, { id_modulo: m.id_modulo });
      if (creados > 0) console.log(`[${m.nombre_modulo}] ${creados} fila(s) de permiso creadas.`);
      totalCreados += creados;
    }
    for (const s of submodulos) {
      const creados = await aprovisionarPermisosAdmin(cx, { id_modulo: s.id_modulo, id_submodulo: s.id_submodulo });
      if (creados > 0) console.log(`[submódulo ${s.nombre_sub}] ${creados} fila(s) de permiso creadas.`);
      totalCreados += creados;
    }

    console.log(totalCreados > 0 ? `[backfill] ${totalCreados} fila(s) de permiso creadas en total.` : "[backfill] Nada que hacer, todo al día.");
  } finally {
    await cx.end();
  }
};

ejecutar().catch((error) => {
  console.error(`[db:migrate:backfill-permisos] ${error.message}`);
  process.exitCode = 1;
});
