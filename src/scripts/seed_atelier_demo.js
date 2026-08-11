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
  if (found) { await c.query("UPDATE atelier_user SET nombre=?,password_hash=?,activo=1 WHERE id_user=?", [nombre, hash, found.id_user]); return found.id_user; }
  const [r] = await c.query("INSERT INTO atelier_user (email,password_hash,role,nombre) VALUES (?,?,?,?)", [email, hash, role, nombre]);
  return r.insertId;
}
async function main() {
  const root = await connection(undefined);
  try { await root.query(`CREATE DATABASE IF NOT EXISTS \`${ATELIER_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); } finally { await root.end(); }
  const c = await connection(ATELIER_DATABASE);
  try {
    await c.query(ATELIER_SCHEMA_SQL);
    const hash = await hashPassword(PASS);
    for (const name of categories) await c.query("INSERT IGNORE INTO atelier_category (nombre,slug) VALUES (?,?)", [name.replace("-", " "), name]);
    await c.query("INSERT INTO atelier_commission_rule (scope,percent,activo) SELECT 'global',10,1 WHERE NOT EXISTS (SELECT 1 FROM atelier_commission_rule WHERE scope='global' AND activo=1)");
    await user(c, "atelier.admin@demo.local", "Administración Atelier", "admin", hash);
    const creatorIds = [];
    for (const x of creators) {
      const creatorId = await user(c, x.email, x.nombre, "creador", hash); creatorIds.push(creatorId);
      await c.query(`INSERT INTO atelier_creator_profile (id_user,slug,nombre_artistico,bio,estilos,publicado,disponible,precio_desde)
        VALUES (?,?,?,?,?,1,1,?) ON DUPLICATE KEY UPDATE nombre_artistico=VALUES(nombre_artistico),bio=VALUES(bio),estilos=VALUES(estilos),publicado=1,disponible=1,precio_desde=VALUES(precio_desde)`,
      [creatorId, x.slug, x.artistico, x.bio, x.estilos, x.service[1]]);
      await c.query("INSERT IGNORE INTO atelier_wallet (id_creator) VALUES (?)", [creatorId]);
      const [[cat]] = await c.query("SELECT id_category FROM atelier_category WHERE slug=?", [x.slug === "luna.ink" ? "retrato" : "concept-art"]);
      let [[service]] = await c.query("SELECT id_service FROM atelier_service WHERE id_creator=? AND nombre=?", [creatorId, x.service[0]]);
      if (!service) { const [r] = await c.query("INSERT INTO atelier_service (id_creator,nombre,descripcion,id_category,precio_base,dias_entrega,revisiones_incluidas) VALUES (?,?,?,?,?,?,2)", [creatorId,x.service[0],x.bio,cat.id_category,x.service[1],x.service[2]]); service={id_service:r.insertId}; }
      await c.query("INSERT INTO atelier_service_extra (id_service,nombre,precio) SELECT ?,?,? WHERE NOT EXISTS (SELECT 1 FROM atelier_service_extra WHERE id_service=? AND nombre=?)", [service.id_service,x.extra[0],x.extra[1],service.id_service,x.extra[0]]);
      const [[item]] = await c.query("SELECT id_item FROM atelier_portfolio_item WHERE id_creator=? AND titulo=?", [creatorId, `${x.artistico} — muestra`]);
      if (!item) await c.query("INSERT INTO atelier_portfolio_item (id_creator,titulo,descripcion,image_url,id_category,destacado) VALUES (?,?,?,?,?,1)", [creatorId,`${x.artistico} — muestra`,x.bio,x.image,cat.id_category]);
    }
    const clientId = await user(c, "cliente.demo@demo.local", "Cliente Demo", "cliente", hash);
    await c.query("INSERT IGNORE INTO atelier_client_profile (id_user) VALUES (?)", [clientId]);
    const [[request]] = await c.query("SELECT id_request FROM atelier_request WHERE id_client=? AND titulo='Retrato demo Atelier'", [clientId]);
    if (!request) {
      const [r] = await c.query("INSERT INTO atelier_request (id_client,id_creator,titulo,descripcion,presupuesto,estado) VALUES (?,?,? ,?,?, 'quote_sent')", [clientId,creatorIds[0],"Retrato demo Atelier","Quiero un retrato de mi mascota en estilo acuarela.",220]);
      const amount = settleAmounts(200, { percent: 10 });
      await c.query("INSERT INTO atelier_quote (id_request,precio_base,extras_total,descuento,gross_amount,platform_fee,creator_net,dias_entrega,revisiones,condiciones) VALUES (?,?,?,?,?,?,?,?,?,?)", [r.insertId,180,20,0,amount.gross_amount,amount.platform_fee,amount.creator_net,5,2,"Entrega digital en alta resolución."]);
    }
    console.log("\n=== Credenciales Atelier ===");
    console.log(`Admin: atelier.admin@demo.local / ${PASS}`);
    console.log(`Creador Luna: luna.ink@demo.local / ${PASS}`);
    console.log(`Creador Pixel: pixel.fox@demo.local / ${PASS}`);
    console.log(`Cliente: cliente.demo@demo.local / ${PASS}`);
    console.log("=== seed Atelier OK ===");
  } finally { await c.end(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
