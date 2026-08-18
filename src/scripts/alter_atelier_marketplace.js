/**
 * ALTER Atelier marketplace (tablero abierto + archivos privados).
 *
 * Por defecto aborta si DB_HOST no es localhost / 127.0.0.1 / ::1.
 * Para un MySQL de desarrollo remoto (p. ej. Railway), hay que pasar
 * ATELIER_ALLOW_REMOTE_DDL=1 de forma explícita. No usar contra producción.
 *
 * Uso:
 *   node src/scripts/alter_atelier_marketplace.js
 *   ATELIER_ALLOW_REMOTE_DDL=1 node src/scripts/alter_atelier_marketplace.js
 *
 * Idempotente: columnas, índices y FKs se verifican antes de crearlos.
 */
import mysql from "mysql2/promise";
import { HOST, USER, PASSWORD, PORT_DB, ATELIER_DATABASE } from "../config.js";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function allowRemoteDdl() {
  const raw = String(process.env.ATELIER_ALLOW_REMOTE_DDL || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

function assertAllowedHost() {
  if (HOST && LOCAL_HOSTS.has(String(HOST).trim().toLowerCase())) return;
  if (allowRemoteDdl()) {
    console.warn(
      "WARN: ALTER remoto habilitado con ATELIER_ALLOW_REMOTE_DDL=1 (host no-localhost). No usar en producción Azure."
    );
    return;
  }
  console.error(
    "ABORT: alter_atelier_marketplace.js es solo para local/dev.\n" +
      "DB_HOST no es localhost. No se ejecutará contra un servidor remoto/producción.\n" +
      "Apunta .env a MySQL local, o pasa ATELIER_ALLOW_REMOTE_DDL=1 si es un MySQL de desarrollo (p. ej. Railway)."
  );
  process.exit(1);
}

async function columnExists(c, table, column) {
  const [rows] = await c.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows.length > 0;
}

async function indexExists(c, table, indexName) {
  const [rows] = await c.query(
    `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [table, indexName]
  );
  return rows.length > 0;
}

async function fkExists(c, table, constraintName) {
  const [rows] = await c.query(
    `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
    [table, constraintName]
  );
  return rows.length > 0;
}

async function listFksOnColumn(c, table, column) {
  const [rows] = await c.query(
    `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [table, column]
  );
  return [...new Set(rows.map((r) => r.CONSTRAINT_NAME))];
}

async function isNullable(c, table, column) {
  const [rows] = await c.query(
    `SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0]?.IS_NULLABLE === "YES";
}

async function main() {
  assertAllowedHost();

  const root = await mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASSWORD,
    port: Number(PORT_DB) || 3306,
  });
  try {
    await root.query(
      `CREATE DATABASE IF NOT EXISTS \`${ATELIER_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } catch (err) {
    console.warn(
      `WARN: no se pudo CREATE DATABASE ${ATELIER_DATABASE} (${err.message}). Se continúa contra la base existente.`
    );
  } finally {
    await root.end();
  }

  const c = await mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASSWORD,
    port: Number(PORT_DB) || 3306,
    database: ATELIER_DATABASE,
    multipleStatements: true,
  });

  try {
    // 1) request.id_creator nullable (NULL = brief abierto al tablero)
    if (await columnExists(c, "atelier_request", "id_creator")) {
      if (!(await isNullable(c, "atelier_request", "id_creator"))) {
        const fks = await listFksOnColumn(c, "atelier_request", "id_creator");
        for (const name of fks) {
          await c.query(`ALTER TABLE atelier_request DROP FOREIGN KEY \`${name}\``);
          console.log(`OK drop FK ${name} en atelier_request.id_creator`);
        }
        await c.query("ALTER TABLE atelier_request MODIFY id_creator INT NULL");
        console.log("OK atelier_request.id_creator ahora es NULL");
        if (!(await fkExists(c, "atelier_request", "fk_atelier_req_creator"))) {
          await c.query(
            `ALTER TABLE atelier_request
             ADD CONSTRAINT fk_atelier_req_creator
             FOREIGN KEY (id_creator) REFERENCES atelier_creator_profile(id_user)`
          );
          console.log("OK restore FK fk_atelier_req_creator");
        }
      } else {
        console.log("skip atelier_request.id_creator (ya nullable)");
      }
    }

    if (!(await columnExists(c, "atelier_request", "brief_json"))) {
      await c.query("ALTER TABLE atelier_request ADD COLUMN brief_json JSON NULL AFTER refs_json");
      console.log("OK atelier_request.brief_json");
    } else {
      console.log("skip atelier_request.brief_json");
    }

    if (!(await indexExists(c, "atelier_request", "idx_atelier_req_board"))) {
      await c.query("ALTER TABLE atelier_request ADD KEY idx_atelier_req_board (id_creator, estado)");
      console.log("OK idx_atelier_req_board");
    }

    // 2) quote.id_creator — una propuesta por artista
    if (!(await columnExists(c, "atelier_quote", "id_creator"))) {
      await c.query("ALTER TABLE atelier_quote ADD COLUMN id_creator INT NULL AFTER id_request");
      console.log("OK atelier_quote.id_creator (nullable temporal)");
    }

    const [pending] = await c.query(
      `UPDATE atelier_quote q
       JOIN atelier_request r ON r.id_request = q.id_request
       SET q.id_creator = r.id_creator
       WHERE q.id_creator IS NULL AND r.id_creator IS NOT NULL`
    );
    if (pending.affectedRows) console.log(`OK backfill quote.id_creator (${pending.affectedRows} filas)`);

    const [orphans] = await c.query("SELECT COUNT(*) AS n FROM atelier_quote WHERE id_creator IS NULL");
    if (Number(orphans[0]?.n) > 0) {
      throw new Error(
        `Hay ${orphans[0].n} cotizaciones sin id_creator y sin request dirigido. Revisa a mano antes de NOT NULL.`
      );
    }

    const quoteNullable = await isNullable(c, "atelier_quote", "id_creator");
    if (quoteNullable) {
      await c.query("ALTER TABLE atelier_quote MODIFY id_creator INT NOT NULL");
      console.log("OK atelier_quote.id_creator NOT NULL");
    }

    if (!(await fkExists(c, "atelier_quote", "fk_atelier_quote_creator"))) {
      await c.query(
        `ALTER TABLE atelier_quote
         ADD CONSTRAINT fk_atelier_quote_creator
         FOREIGN KEY (id_creator) REFERENCES atelier_creator_profile(id_user)`
      );
      console.log("OK FK fk_atelier_quote_creator");
    }

    if (!(await indexExists(c, "atelier_quote", "idx_atelier_quote_creator"))) {
      await c.query("ALTER TABLE atelier_quote ADD KEY idx_atelier_quote_creator (id_creator)");
      console.log("OK idx_atelier_quote_creator");
    }

    if (!(await indexExists(c, "atelier_quote", "uq_atelier_quote_request_creator"))) {
      await c.query(
        "ALTER TABLE atelier_quote ADD UNIQUE KEY uq_atelier_quote_request_creator (id_request, id_creator)"
      );
      console.log("OK UNIQUE (id_request, id_creator)");
    }

    // 3) atelier_file — solo metadata; UUID en la URL, nunca binario
    await c.query(`
      CREATE TABLE IF NOT EXISTS atelier_file (
        id_file CHAR(36) NOT NULL PRIMARY KEY,
        id_request INT NULL,
        id_order INT NULL,
        id_uploader INT NOT NULL,
        category ENUM('reference','sketch','progress','delivery') NOT NULL,
        file_name VARCHAR(200) NOT NULL,
        mime VARCHAR(80) NOT NULL,
        byte_size INT UNSIGNED NOT NULL,
        storage_key VARCHAR(500) NOT NULL,
        provider_file_id VARCHAR(120) NOT NULL,
        creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NULL,
        deleted_at DATETIME NULL,
        KEY idx_atelier_file_request (id_request),
        KEY idx_atelier_file_order (id_order),
        KEY idx_atelier_file_uploader (id_uploader),
        CONSTRAINT fk_atelier_file_request FOREIGN KEY (id_request) REFERENCES atelier_request(id_request),
        CONSTRAINT fk_atelier_file_order FOREIGN KEY (id_order) REFERENCES atelier_order(id_order),
        CONSTRAINT fk_atelier_file_uploader FOREIGN KEY (id_uploader) REFERENCES atelier_user(id_user)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("OK atelier_file");

    console.log("=== ALTER Atelier marketplace listo (local) ===");
  } finally {
    await c.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
