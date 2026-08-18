import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import { HOST, USER, PASSWORD, PORT_DB, ATELIER_DATABASE } from "../config.js";
import { hashPassword } from "../utils/passwordUtil.js";
import { ATELIER_SCHEMA_SQL } from "./schemas/schema_atelier.sql.js";
import { settleAmounts } from "../services/atelier/SettlementService.js";

const PASS = "Demo1234!";
const creators = [
  { email: "luna.ink@demo.local", nombre: "Luna Ink", slug: "luna.ink", artistico: "Luna Ink", bio: "Ilustración editorial, retratos y arte fantástico.", estilos: "acuarela, editorial, fantasía", service: ["Retrato digital personalizado", 180, 5], extra: ["Fondo detallado", 45], image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80" },
  { email: "pixel.fox@demo.local", nombre: "Pixel Fox", slug: "pixel.fox", artistico: "Pixel Fox", bio: "Concept art y personajes para mundos memorables.", estilos: "concept-art, videojuegos, personajes", service: ["Personaje concept art", 260, 7], extra: ["Vista adicional", 70], image: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=900&q=80" },
];
const categories = ["ilustracion", "retrato", "avatar", "fan-art", "concept-art"];

async function connection(database) {
  return mysql.createConnection({ host: HOST, user: USER, password: PASSWORD, port: Number(PORT_DB) || 3306, database, multipleStatements: true });
}

async function user(c, email, nombre, role, hash) {
  const [[found]] = await c.query("SELECT id_user FROM atelier_user WHERE email=?", [email]);
  if (found) {
    await c.query("UPDATE atelier_user SET nombre=?,password_hash=?,activo=1 WHERE id_user=?", [nombre, hash, found.id_user]);
    return found.id_user;
  }
  const [r] = await c.query("INSERT INTO atelier_user (email,password_hash,role,nombre) VALUES (?,?,?,?)", [email, hash, role, nombre]);
  return r.insertId;
}

async function columnExists(c, table, column) {
  const [rows] = await c.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows.length > 0;
}

async function tableExists(c, name) {
  const [rows] = await c.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [name]
  );
  return rows.length > 0;
}

/** Bases ya creadas antes del marketplace: el CREATE IF NOT EXISTS no añade columnas. */
async function requireMarketplaceSchema(c) {
  const okQuote = await columnExists(c, "atelier_quote", "id_creator");
  const okBrief = await columnExists(c, "atelier_request", "brief_json");
  const okFile = await tableExists(c, "atelier_file");
  if (okQuote && okBrief && okFile) return;
  console.error(
    "El seed necesita el ALTER de marketplace en MySQL local primero:\n" +
      "  node src/scripts/alter_atelier_marketplace.js\n" +
      "(el ALTER aborta si DB_HOST no es localhost). No se ejecuta contra remoto."
  );
  process.exit(1);
}

async function ensureRequest(c, { id_client, id_creator, id_service, titulo, descripcion, brief, presupuesto, estado }) {
  const [[found]] = await c.query("SELECT id_request FROM atelier_request WHERE id_client=? AND titulo=?", [id_client, titulo]);
  if (found) {
    await c.query(
      "UPDATE atelier_request SET id_creator=?,id_service=?,descripcion=?,brief_json=?,presupuesto=?,estado=? WHERE id_request=?",
      [id_creator, id_service ?? null, descripcion, brief ? JSON.stringify(brief) : null, presupuesto ?? null, estado, found.id_request]
    );
    return found.id_request;
  }
  const [r] = await c.query(
    `INSERT INTO atelier_request (id_client,id_creator,id_service,titulo,descripcion,brief_json,presupuesto,estado)
     VALUES (?,?,?,?,?,?,?,?)`,
    [id_client, id_creator, id_service ?? null, titulo, descripcion, brief ? JSON.stringify(brief) : null, presupuesto ?? null, estado]
  );
  return r.insertId;
}

async function ensureQuote(c, { id_request, id_creator, precio_base, extras_total = 0, descuento = 0, dias_entrega, revisiones = 2, condiciones, estado = "sent" }) {
  const amount = settleAmounts(Number(precio_base) + Number(extras_total) - Number(descuento), { percent: 10 });
  const [[found]] = await c.query("SELECT id_quote FROM atelier_quote WHERE id_request=? AND id_creator=?", [id_request, id_creator]);
  const fields = [precio_base, extras_total, descuento, amount.gross_amount, amount.platform_fee, amount.creator_net, dias_entrega, revisiones, condiciones, estado];
  if (found) {
    await c.query(
      `UPDATE atelier_quote SET precio_base=?,extras_total=?,descuento=?,gross_amount=?,platform_fee=?,creator_net=?,
       dias_entrega=?,revisiones=?,condiciones=?,estado=? WHERE id_quote=?`,
      [...fields, found.id_quote]
    );
    return { id_quote: found.id_quote, ...amount };
  }
  const [r] = await c.query(
    `INSERT INTO atelier_quote
     (id_request,id_creator,precio_base,extras_total,descuento,gross_amount,platform_fee,creator_net,dias_entrega,revisiones,condiciones,estado)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id_request, id_creator, ...fields]
  );
  return { id_quote: r.insertId, ...amount };
}

async function ensureOrder(c, { id_request, id_quote, id_client, id_creator, estado, amounts, revisiones_incluidas = 2, completed }) {
  const [[found]] = await c.query("SELECT id_order FROM atelier_order WHERE id_request=?", [id_request]);
  const completedEn = completed ? new Date() : null;
  if (found) {
    await c.query(
      `UPDATE atelier_order SET id_quote=?,id_client=?,id_creator=?,estado=?,gross_amount=?,platform_fee=?,creator_net=?,
       revisiones_incluidas=?,completed_en=IFNULL(completed_en,?) WHERE id_order=?`,
      [id_quote, id_client, id_creator, estado, amounts.gross_amount, amounts.platform_fee, amounts.creator_net, revisiones_incluidas, completedEn, found.id_order]
    );
    return found.id_order;
  }
  const [r] = await c.query(
    `INSERT INTO atelier_order
     (id_request,id_quote,id_client,id_creator,estado,gross_amount,platform_fee,creator_net,revisiones_incluidas,completed_en)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [id_request, id_quote, id_client, id_creator, estado, amounts.gross_amount, amounts.platform_fee, amounts.creator_net, revisiones_incluidas, completedEn]
  );
  return r.insertId;
}

async function ensurePayment(c, { id_order, amounts, seedKey }) {
  const [[found]] = await c.query("SELECT id_payment FROM atelier_payment WHERE id_order=?", [id_order]);
  if (found) return found.id_payment;
  const [r] = await c.query(
    `INSERT INTO atelier_payment
     (id_order,provider,provider_payment_id,amount,platform_fee,creator_amount,status,paid_at)
     VALUES (?, 'mercadopago', ?, ?, ?, ?, 'approved', NOW())`,
    [id_order, seedKey, amounts.gross_amount, amounts.platform_fee, amounts.creator_net]
  );
  return r.insertId;
}

async function ensureLedger(c, { id_order, id_creator, tipo, amount }) {
  const [[found]] = await c.query("SELECT id_entry FROM atelier_ledger_entry WHERE id_order=? AND tipo=?", [id_order, tipo]);
  if (found) return;
  await c.query(
    "INSERT INTO atelier_ledger_entry (id_order,id_creator,tipo,amount) VALUES (?,?,?,?)",
    [id_order, id_creator, tipo, amount]
  );
}

async function ensureEvent(c, { id_order, tipo, mensaje, id_actor = null }) {
  const [[found]] = await c.query("SELECT id_event FROM atelier_order_event WHERE id_order=? AND tipo=? AND mensaje=?", [id_order, tipo, mensaje]);
  if (found) return;
  await c.query(
    "INSERT INTO atelier_order_event (id_order,tipo,mensaje,id_actor) VALUES (?,?,?,?)",
    [id_order, tipo, mensaje, id_actor]
  );
}

async function ensureMessage(c, { id_order, id_sender, body }) {
  const [[found]] = await c.query("SELECT id_message FROM atelier_message WHERE id_order=? AND id_sender=? AND body=?", [id_order, id_sender, body]);
  if (found) return;
  await c.query("INSERT INTO atelier_message (id_order,id_sender,body) VALUES (?,?,?)", [id_order, id_sender, body]);
}

/**
 * Metadata de atelier_file. storage_key es path interno, nunca una URL pública de ImageKit.
 * El binario no se sube en el seed (no hay original de encargo público).
 */
async function ensureFileMeta(c, { id_order, id_request = null, id_uploader, category, file_name, mime, byte_size }) {
  const [[found]] = await c.query(
    "SELECT id_file FROM atelier_file WHERE id_order=? AND category=? AND file_name=?",
    [id_order, category, file_name]
  );
  if (found) return found.id_file;
  const id_file = randomUUID();
  const ext = file_name.includes(".") ? file_name.slice(file_name.lastIndexOf(".")) : ".png";
  const storage_key = `/atelier/commissions/seed-${id_order}/${category}/${id_file}${ext}`;
  await c.query(
    `INSERT INTO atelier_file
     (id_file,id_request,id_order,id_uploader,category,file_name,mime,byte_size,storage_key,provider_file_id)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [id_file, id_request, id_order, id_uploader, category, file_name, mime, byte_size, storage_key, `seed-${id_order}-${category}`]
  );
  return id_file;
}

async function ensureReview(c, { id_order, id_client, id_creator, calidad, comunicacion, cumplimiento, tiempo, comentario }) {
  const [[found]] = await c.query("SELECT id_review FROM atelier_review WHERE id_order=?", [id_order]);
  const estrellas = (calidad + comunicacion + cumplimiento + tiempo) / 4;
  if (found) {
    await c.query(
      "UPDATE atelier_review SET calidad=?,comunicacion=?,cumplimiento=?,tiempo=?,estrellas=?,comentario=? WHERE id_review=?",
      [calidad, comunicacion, cumplimiento, tiempo, estrellas, comentario, found.id_review]
    );
    return found.id_review;
  }
  const [r] = await c.query(
    `INSERT INTO atelier_review (id_order,id_client,id_creator,calidad,comunicacion,cumplimiento,tiempo,estrellas,comentario)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [id_order, id_client, id_creator, calidad, comunicacion, cumplimiento, tiempo, estrellas, comentario]
  );
  return r.insertId;
}

async function paidLedgers(c, { id_order, id_creator, amounts }) {
  await ensureLedger(c, { id_order, id_creator, tipo: "PAYMENT_RECEIVED", amount: amounts.gross_amount });
  await ensureLedger(c, { id_order, id_creator, tipo: "PLATFORM_FEE", amount: amounts.platform_fee });
  await ensureLedger(c, { id_order, id_creator, tipo: "CREATOR_EARNING_HELD", amount: amounts.creator_net });
}

async function refreshWallets(c) {
  await c.query(`
    UPDATE atelier_wallet w
    LEFT JOIN (
      SELECT id_creator,
        SUM(CASE WHEN estado IN ('paid','in_progress','preview','revision','final_delivery') THEN creator_net ELSE 0 END) AS pending,
        SUM(CASE WHEN estado = 'completed' THEN creator_net ELSE 0 END) AS available,
        SUM(CASE WHEN estado = 'completed' THEN creator_net ELSE 0 END) AS total_earned
      FROM atelier_order
      GROUP BY id_creator
    ) x ON x.id_creator = w.id_creator
    SET w.pending = COALESCE(x.pending, 0),
        w.available = COALESCE(x.available, 0),
        w.total_earned = COALESCE(x.total_earned, 0)
  `);
}

async function refreshCreatorStats(c) {
  await c.query(`
    UPDATE atelier_creator_profile cp
    SET rating_avg = COALESCE((SELECT AVG(estrellas) FROM atelier_review WHERE id_creator = cp.id_user), 0),
        reviews_count = (SELECT COUNT(*) FROM atelier_review WHERE id_creator = cp.id_user),
        pedidos_completados = (SELECT COUNT(*) FROM atelier_order WHERE id_creator = cp.id_user AND estado = 'completed')
  `);
}

async function main() {
  const root = await connection(undefined);
  try {
    await root.query(`CREATE DATABASE IF NOT EXISTS \`${ATELIER_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally {
    await root.end();
  }
  const c = await connection(ATELIER_DATABASE);
  try {
    await c.query(ATELIER_SCHEMA_SQL);
    await requireMarketplaceSchema(c);
    const hash = await hashPassword(PASS);
    for (const name of categories) await c.query("INSERT IGNORE INTO atelier_category (nombre,slug) VALUES (?,?)", [name.replace("-", " "), name]);
    await c.query("INSERT INTO atelier_commission_rule (scope,percent,activo) SELECT 'global',10,1 WHERE NOT EXISTS (SELECT 1 FROM atelier_commission_rule WHERE scope='global' AND activo=1)");
    await user(c, "atelier.admin@demo.local", "Administración Atelier", "admin", hash);
    const creatorIds = [];
    const serviceByCreator = {};
    for (const x of creators) {
      const creatorId = await user(c, x.email, x.nombre, "creador", hash);
      creatorIds.push(creatorId);
      await c.query(
        `INSERT INTO atelier_creator_profile (id_user,slug,nombre_artistico,bio,estilos,publicado,disponible,precio_desde)
         VALUES (?,?,?,?,?,1,1,?) ON DUPLICATE KEY UPDATE nombre_artistico=VALUES(nombre_artistico),bio=VALUES(bio),estilos=VALUES(estilos),publicado=1,disponible=1,precio_desde=VALUES(precio_desde)`,
        [creatorId, x.slug, x.artistico, x.bio, x.estilos, x.service[1]]
      );
      await c.query("INSERT IGNORE INTO atelier_wallet (id_creator) VALUES (?)", [creatorId]);
      const [[cat]] = await c.query("SELECT id_category FROM atelier_category WHERE slug=?", [x.slug === "luna.ink" ? "retrato" : "concept-art"]);
      let [[service]] = await c.query("SELECT id_service FROM atelier_service WHERE id_creator=? AND nombre=?", [creatorId, x.service[0]]);
      if (!service) {
        const [r] = await c.query(
          "INSERT INTO atelier_service (id_creator,nombre,descripcion,id_category,precio_base,dias_entrega,revisiones_incluidas) VALUES (?,?,?,?,?,?,2)",
          [creatorId, x.service[0], x.bio, cat.id_category, x.service[1], x.service[2]]
        );
        service = { id_service: r.insertId };
      }
      serviceByCreator[creatorId] = service.id_service;
      await c.query(
        "INSERT INTO atelier_service_extra (id_service,nombre,precio) SELECT ?,?,? WHERE NOT EXISTS (SELECT 1 FROM atelier_service_extra WHERE id_service=? AND nombre=?)",
        [service.id_service, x.extra[0], x.extra[1], service.id_service, x.extra[0]]
      );
      const [[item]] = await c.query("SELECT id_item FROM atelier_portfolio_item WHERE id_creator=? AND titulo=?", [creatorId, `${x.artistico} — muestra`]);
      if (!item) {
        await c.query(
          "INSERT INTO atelier_portfolio_item (id_creator,titulo,descripcion,image_url,id_category,destacado) VALUES (?,?,?,?,?,1)",
          [creatorId, `${x.artistico} — muestra`, x.bio, x.image, cat.id_category]
        );
      }
    }
    const lunaId = creatorIds[0];
    const pixelId = creatorIds[1];
    const clientId = await user(c, "cliente.demo@demo.local", "Cliente Demo", "cliente", hash);
    await c.query("INSERT IGNORE INTO atelier_client_profile (id_user) VALUES (?)", [clientId]);

    // 1) Brief abierto al tablero + 2 propuestas (id_creator en cada quote)
    const openId = await ensureRequest(c, {
      id_client: clientId,
      id_creator: null,
      titulo: "Brief abierto — mascota editorial",
      descripcion: "Quiero un retrato de mi mascota en estilo acuarela, luz suave de estudio, para uso personal.",
      brief: {
        estilo: "editorial acuarela",
        caracteristicas: "mascota, fondo suave, luz de estudio",
        presupuesto_min: 150,
        presupuesto_max: 280,
        formato: "digital A3 300dpi",
        uso: "personal",
        prioridad: "estandar",
      },
      presupuesto: 220,
      estado: "quote_sent",
    });
    await ensureQuote(c, {
      id_request: openId,
      id_creator: lunaId,
      precio_base: 180,
      extras_total: 20,
      dias_entrega: 5,
      revisiones: 2,
      condiciones: "Entrega digital en alta resolución. Incluye un fondo suave.",
    });
    await ensureQuote(c, {
      id_request: openId,
      id_creator: pixelId,
      precio_base: 240,
      extras_total: 0,
      dias_entrega: 7,
      revisiones: 2,
      condiciones: "Lineart limpio y color plano. Una vista frontal.",
    });

    // 2) Encargo en preview/boceto, con metadata de archivo (sin URL pública)
    const previewReq = await ensureRequest(c, {
      id_client: clientId,
      id_creator: lunaId,
      id_service: serviceByCreator[lunaId],
      titulo: "Encargo en boceto — retrato acuarela",
      descripcion: "Retrato dirigido a Luna Ink. Ya pagado; el boceto está en revisión.",
      brief: { estilo: "acuarela", formato: "digital", uso: "personal", prioridad: "estandar" },
      presupuesto: 200,
      estado: "preview",
    });
    const previewQuote = await ensureQuote(c, {
      id_request: previewReq,
      id_creator: lunaId,
      precio_base: 180,
      extras_total: 20,
      dias_entrega: 5,
      revisiones: 2,
      condiciones: "Boceto primero; luego color.",
      estado: "accepted",
    });
    const previewOrder = await ensureOrder(c, {
      id_request: previewReq,
      id_quote: previewQuote.id_quote,
      id_client: clientId,
      id_creator: lunaId,
      estado: "preview",
      amounts: previewQuote,
    });
    await ensurePayment(c, { id_order: previewOrder, amounts: previewQuote, seedKey: `seed-mp-preview-${previewOrder}` });
    await paidLedgers(c, { id_order: previewOrder, id_creator: lunaId, amounts: previewQuote });
    await ensureEvent(c, { id_order: previewOrder, tipo: "ORDER_CREATED", mensaje: "Pedido creado y pendiente de pago", id_actor: clientId });
    await ensureEvent(c, { id_order: previewOrder, tipo: "PAYMENT_APPROVED", mensaje: "Pago aprobado (seed demo)" });
    await ensureEvent(c, { id_order: previewOrder, tipo: "STATE_CHANGED", mensaje: "Estado actualizado a preview", id_actor: lunaId });
    await ensureFileMeta(c, {
      id_order: previewOrder,
      id_request: previewReq,
      id_uploader: lunaId,
      category: "sketch",
      file_name: "boceto-retrato.png",
      mime: "image/png",
      byte_size: 184320,
    });
    await ensureMessage(c, { id_order: previewOrder, id_sender: lunaId, body: "Subí el boceto. Dime si el encuadre te encaja." });
    await ensureMessage(c, { id_order: previewOrder, id_sender: clientId, body: "Me gusta la pose. Sigo con el color." });

    // 3) Encargo completado con reseña
    const doneReq = await ensureRequest(c, {
      id_client: clientId,
      id_creator: pixelId,
      id_service: serviceByCreator[pixelId],
      titulo: "Encargo entregado — avatar Pixel Fox",
      descripcion: "Avatar de personaje para redes. Entregado y reseñado.",
      brief: { estilo: "concept-art", formato: "cuadrado 2048", uso: "redes", prioridad: "estandar" },
      presupuesto: 260,
      estado: "completed",
    });
    const doneQuote = await ensureQuote(c, {
      id_request: doneReq,
      id_creator: pixelId,
      precio_base: 260,
      extras_total: 0,
      dias_entrega: 7,
      revisiones: 2,
      condiciones: "Archivo PNG en alta. Una vista.",
      estado: "accepted",
    });
    const doneOrder = await ensureOrder(c, {
      id_request: doneReq,
      id_quote: doneQuote.id_quote,
      id_client: clientId,
      id_creator: pixelId,
      estado: "completed",
      amounts: doneQuote,
      completed: true,
    });
    await ensurePayment(c, { id_order: doneOrder, amounts: doneQuote, seedKey: `seed-mp-done-${doneOrder}` });
    await paidLedgers(c, { id_order: doneOrder, id_creator: pixelId, amounts: doneQuote });
    await ensureLedger(c, { id_order: doneOrder, id_creator: pixelId, tipo: "CREATOR_BALANCE_RELEASED", amount: doneQuote.creator_net });
    await ensureEvent(c, { id_order: doneOrder, tipo: "ORDER_CREATED", mensaje: "Pedido creado y pendiente de pago", id_actor: clientId });
    await ensureEvent(c, { id_order: doneOrder, tipo: "PAYMENT_APPROVED", mensaje: "Pago aprobado (seed demo)" });
    await ensureEvent(c, { id_order: doneOrder, tipo: "STATE_CHANGED", mensaje: "Estado actualizado a completed", id_actor: clientId });
    await ensureFileMeta(c, {
      id_order: doneOrder,
      id_request: doneReq,
      id_uploader: pixelId,
      category: "delivery",
      file_name: "avatar-final.png",
      mime: "image/png",
      byte_size: 412800,
    });
    await ensureReview(c, {
      id_order: doneOrder,
      id_client: clientId,
      id_creator: pixelId,
      calidad: 5,
      comunicacion: 5,
      cumplimiento: 4,
      tiempo: 5,
      comentario: "El avatar quedó nítido y a tiempo. Volvería a encargar.",
    });

    await refreshWallets(c);
    await refreshCreatorStats(c);

    console.log("\n=== Credenciales Atelier ===");
    console.log(`Admin: atelier.admin@demo.local / ${PASS}`);
    console.log(`Creador Luna: luna.ink@demo.local / ${PASS}`);
    console.log(`Creador Pixel: pixel.fox@demo.local / ${PASS}`);
    console.log(`Cliente: cliente.demo@demo.local / ${PASS}`);
    console.log("=== Escenarios ===");
    console.log("1. Brief abierto — mascota editorial (2 propuestas: Luna + Pixel)");
    console.log("2. Encargo en boceto — retrato acuarela (Luna, preview + metadata sketch)");
    console.log("3. Encargo entregado — avatar Pixel Fox (completado + reseña)");
    console.log("=== seed Atelier OK ===");
  } finally {
    await c.end();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
