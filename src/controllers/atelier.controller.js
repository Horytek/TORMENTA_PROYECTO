import jwt from "jsonwebtoken";
import { getConnection } from "../database/database_atelier.js";
import { TOKEN_SECRET } from "../config.js";
import { hashPassword, verifyPassword } from "../utils/passwordUtil.js";
import { settleAmounts, resolveCommissionRule } from "../services/atelier/SettlementService.js";
import { assertRequestTransition, assertOrderTransition } from "../services/atelier/OrderStateMachine.js";
import { createAtelierCheckout, fetchMpPayment, parseAtelierExternalRef } from "../services/atelier/PaymentService.js";
import { listFilesMeta } from "../services/atelier/FileAccessService.js";

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, error) => res.status(error.status || 500).json({ success: false, message: error.message || "Error interno" });
const id = (value) => Number(value);
const publicUser = ({ password_hash, ...user }) => user;
const roleCheck = (u, roles) => roles.includes(u.role);
const q = async (c, sql, params = []) => (await c.query(sql, params))[0];

export function signToken(user) {
  return jwt.sign({ sub: user.id_user, email: user.email, role: user.role }, TOKEN_SECRET, {
    expiresIn: "7d", audience: "horytek-atelier", issuer: "horytek-backend",
  });
}
export function authAtelier(req, res, next) {
  const token = req.headers.authorization?.startsWith("Bearer ") && req.headers.authorization.slice(7);
  if (!token) return res.status(401).json({ success: false, message: "Token requerido" });
  try {
    req.atelierUser = jwt.verify(token, TOKEN_SECRET, { audience: "horytek-atelier", issuer: "horytek-backend" });
    return next();
  } catch { return res.status(401).json({ success: false, message: "Token inválido o vencido" }); }
}
export const requireRole = (...roles) => (req, res, next) =>
  roleCheck(req.atelierUser, roles) ? next() : res.status(403).json({ success: false, message: "No tienes permiso para esta acción" });
const ownOrder = (order, user) => user.role === "admin" || Number(order.id_client) === Number(user.sub) || Number(order.id_creator) === Number(user.sub);

async function canSeeRequest(c, request, user) {
  if (user.role === "admin") return true;
  if (user.role === "cliente") return Number(request.id_client) === Number(user.sub);
  if (user.role === "creador") {
    if (request.id_creator && Number(request.id_creator) === Number(user.sub)) return true;
    if (request.id_creator == null && ["submitted", "quote_sent"].includes(request.estado)) return true;
    const [quoted] = await q(c, "SELECT id_quote FROM atelier_quote WHERE id_request=? AND id_creator=? LIMIT 1", [request.id_request, user.sub]);
    return Boolean(quoted);
  }
  return false;
}

export async function register(req, res) {
  let c; try {
    c = await getConnection(); const { email, password, nombre, role, slug, nombre_artistico } = req.body;
    const rows = await q(c, "SELECT id_user FROM atelier_user WHERE email = ?", [email]);
    if (rows.length) return res.status(409).json({ success: false, message: "El correo ya está registrado" });
    if (role === "creador" && !slug) return res.status(400).json({ success: false, message: "El slug es obligatorio para creadores" });
    const result = await q(c, "INSERT INTO atelier_user (email,password_hash,role,nombre) VALUES (?,?,?,?)", [email, await hashPassword(password), role, nombre]);
    if (role === "creador") {
      await q(c, "INSERT INTO atelier_creator_profile (id_user,slug,nombre_artistico) VALUES (?,?,?)", [result.insertId, slug, nombre_artistico || nombre]);
      await q(c, "INSERT IGNORE INTO atelier_wallet (id_creator) VALUES (?)", [result.insertId]);
    } else await q(c, "INSERT INTO atelier_client_profile (id_user) VALUES (?)", [result.insertId]);
    const user = { id_user: result.insertId, email, role, nombre };
    return ok(res, { user, token: signToken(user) }, 201);
  } catch (e) { return fail(res, e); } finally { c?.release(); }
}
export async function login(req, res) {
  let c; try {
    c = await getConnection(); const [user] = await q(c, "SELECT * FROM atelier_user WHERE email = ? AND activo = 1", [req.body.email]);
    if (!user || !(await verifyPassword(req.body.password, user.password_hash))) return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    return ok(res, { user: publicUser(user), token: signToken(user) });
  } catch (e) { return fail(res, e); } finally { c?.release(); }
}
export async function me(req, res) {
  let c; try {
    c = await getConnection(); const [user] = await q(c, "SELECT id_user,email,role,nombre,activo,creado_en FROM atelier_user WHERE id_user=?", [req.atelierUser.sub]);
    if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    if (user.role === "creador") [user.profile] = await q(c, "SELECT * FROM atelier_creator_profile WHERE id_user=?", [user.id_user]);
    if (user.role === "cliente") [user.profile] = await q(c, "SELECT * FROM atelier_client_profile WHERE id_user=?", [user.id_user]);
    return ok(res, user);
  } catch (e) { return fail(res, e); } finally { c?.release(); }
}

export async function listCreators(req, res) {
  let c; try { c = await getConnection();
    const params = []; let where = "cp.publicado=1";
    if (req.query.q) { where += " AND (cp.nombre_artistico LIKE ? OR cp.estilos LIKE ?)"; params.push(`%${req.query.q}%`, `%${req.query.q}%`); }
    if (req.query.category) { where += " AND EXISTS (SELECT 1 FROM atelier_service s JOIN atelier_category ca ON ca.id_category=s.id_category WHERE s.id_creator=cp.id_user AND ca.slug=? AND s.activo=1)"; params.push(req.query.category); }
    return ok(res, await q(c, `SELECT cp.*,u.nombre FROM atelier_creator_profile cp JOIN atelier_user u ON u.id_user=cp.id_user WHERE ${where} ORDER BY cp.rating_avg DESC,cp.pedidos_completados DESC`, params));
  } catch (e) { return fail(res, e); } finally { c?.release(); }
}
export async function getCreatorBySlug(req, res) {
  let c; try { c = await getConnection(); const [row] = await q(c, "SELECT cp.*,u.nombre FROM atelier_creator_profile cp JOIN atelier_user u ON u.id_user=cp.id_user WHERE cp.slug=? AND cp.publicado=1", [req.params.slug]); return row ? ok(res, row) : res.status(404).json({ success:false,message:"Creador no encontrado" }); } catch(e){return fail(res,e);} finally{c?.release();}
}
export async function listCreatorServices(req,res) { let c; try { c=await getConnection(); const services=await q(c,"SELECT s.*,c.nombre AS categoria FROM atelier_service s LEFT JOIN atelier_category c ON c.id_category=s.id_category JOIN atelier_creator_profile p ON p.id_user=s.id_creator WHERE p.slug=? AND s.activo=1",[req.params.slug]); for(const service of services) service.extras=await q(c,"SELECT * FROM atelier_service_extra WHERE id_service=?",[service.id_service]); return ok(res,services); } catch(e){return fail(res,e);} finally{c?.release();} }
export async function listCreatorPortfolio(req,res) { let c; try { c=await getConnection(); return ok(res,await q(c,"SELECT i.*,c.nombre AS categoria FROM atelier_portfolio_item i LEFT JOIN atelier_category c ON c.id_category=i.id_category JOIN atelier_creator_profile p ON p.id_user=i.id_creator WHERE p.slug=? ORDER BY i.destacado DESC,i.creado_en DESC",[req.params.slug])); } catch(e){return fail(res,e);} finally{c?.release();} }
export async function listCategories(req,res) { let c; try { c=await getConnection(); return ok(res,await q(c,"SELECT * FROM atelier_category ORDER BY nombre")); } catch(e){return fail(res,e);} finally{c?.release();} }

export async function updateClientProfile(req, res) {
  let c;
  try {
    c = await getConnection();
    const userId = req.atelierUser.sub;
    const b = req.body;
    if (b.nombre) await q(c, "UPDATE atelier_user SET nombre=? WHERE id_user=?", [b.nombre, userId]);
    const [existing] = await q(c, "SELECT id_user FROM atelier_client_profile WHERE id_user=?", [userId]);
    if (!existing) {
      await q(c, "INSERT INTO atelier_client_profile (id_user, avatar_url, bio, intereses) VALUES (?,?,?,?)",
        [userId, b.avatar_url ?? null, b.bio ?? null, b.intereses ?? null]);
    } else {
      await q(c, "UPDATE atelier_client_profile SET avatar_url=COALESCE(?,avatar_url), bio=COALESCE(?,bio), intereses=COALESCE(?,intereses) WHERE id_user=?",
        [b.avatar_url ?? null, b.bio ?? null, b.intereses ?? null, userId]);
    }
    const [user] = await q(c, "SELECT id_user,email,role,nombre,activo,creado_en FROM atelier_user WHERE id_user=?", [userId]);
    if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    [user.profile] = await q(c, "SELECT * FROM atelier_client_profile WHERE id_user=?", [userId]);
    return ok(res, user);
  } catch (e) { return fail(res, e); } finally { c?.release(); }
}

export async function updateCreatorProfile(req, res) {
  let c;
  try {
    c = await getConnection();
    const userId = req.atelierUser.sub;
    const b = req.body;
    if (b.nombre) await q(c, "UPDATE atelier_user SET nombre=? WHERE id_user=?", [b.nombre, userId]);
    const sets = [];
    const params = [];
    const add = (col, val) => { sets.push(`${col}=?`); params.push(val); };
    if (b.slug != null) add("slug", b.slug);
    if (b.nombre_artistico != null) add("nombre_artistico", b.nombre_artistico);
    if (b.avatar_url !== undefined) add("avatar_url", b.avatar_url);
    if (b.bio !== undefined) add("bio", b.bio);
    if (b.estilos !== undefined) add("estilos", b.estilos);
    if (b.publicado != null) add("publicado", b.publicado);
    if (b.disponible != null) add("disponible", b.disponible);
    if (b.precio_desde !== undefined) add("precio_desde", b.precio_desde);
    if (sets.length) {
      params.push(userId);
      await q(c, `UPDATE atelier_creator_profile SET ${sets.join(",")} WHERE id_user=?`, params);
    }
    const [row] = await q(c, "SELECT cp.*, u.nombre FROM atelier_creator_profile cp JOIN atelier_user u ON u.id_user=cp.id_user WHERE cp.id_user=?", [userId]);
    return ok(res, row);
  } catch (e) { return fail(res, e); } finally { c?.release(); }
}
export async function listOwnServices(req,res) { let c; try { c=await getConnection(); const rows=await q(c,"SELECT * FROM atelier_service WHERE id_creator=? ORDER BY creado_en DESC",[req.atelierUser.sub]); for(const x of rows)x.extras=await q(c,"SELECT * FROM atelier_service_extra WHERE id_service=?",[x.id_service]); return ok(res,rows); }catch(e){return fail(res,e)}finally{c?.release()} }
export async function listOwnPortfolio(req,res) { let c; try { c=await getConnection(); return ok(res,await q(c,"SELECT * FROM atelier_portfolio_item WHERE id_creator=? ORDER BY destacado DESC, creado_en DESC",[req.atelierUser.sub])); }catch(e){return fail(res,e)}finally{c?.release()} }
export async function listOwnOrders(req,res) { let c; try { c=await getConnection(); return ok(res,await q(c,"SELECT o.*,r.titulo,u.nombre AS cliente FROM atelier_order o JOIN atelier_request r ON r.id_request=o.id_request JOIN atelier_user u ON u.id_user=o.id_client WHERE o.id_creator=? ORDER BY o.creado_en DESC",[req.atelierUser.sub])); }catch(e){return fail(res,e)}finally{c?.release()} }
export async function getCommissionRule(req,res) { let c; try { c=await getConnection(); const [row]=await q(c,"SELECT * FROM atelier_commission_rule WHERE scope='global' AND activo=1 ORDER BY id_rule DESC LIMIT 1"); return ok(res,row||{scope:"global",percent:10,min_fee:null,max_fee:null}); }catch(e){return fail(res,e)}finally{c?.release()} }
async function saveService(req,res, isUpdate=false) { let c; try { c=await getConnection(); await c.beginTransaction(); const b=req.body; let serviceId=id(req.params.id_service); if(isUpdate){const rows=await q(c,"SELECT id_service FROM atelier_service WHERE id_service=? AND id_creator=?",[serviceId,req.atelierUser.sub]);if(!rows.length)throw Object.assign(new Error("Servicio no encontrado"),{status:404});await q(c,"UPDATE atelier_service SET nombre=?,descripcion=?,cover_url=?,id_category=?,tags=?,precio_base=?,dias_entrega=?,revisiones_incluidas=?,activo=? WHERE id_service=?",[b.nombre,b.descripcion??null,b.cover_url??null,b.id_category??null,b.tags??null,b.precio_base,b.dias_entrega??3,b.revisiones_incluidas??2,b.activo??true,serviceId]); await q(c,"DELETE FROM atelier_service_extra WHERE id_service=?",[serviceId]);}else{const r=await q(c,"INSERT INTO atelier_service (id_creator,nombre,descripcion,cover_url,id_category,tags,precio_base,dias_entrega,revisiones_incluidas,activo) VALUES (?,?,?,?,?,?,?,?,?,?)",[req.atelierUser.sub,b.nombre,b.descripcion??null,b.cover_url??null,b.id_category??null,b.tags??null,b.precio_base,b.dias_entrega??3,b.revisiones_incluidas??2,b.activo??true]);serviceId=r.insertId;} for(const x of b.extras||[])await q(c,"INSERT INTO atelier_service_extra (id_service,nombre,precio) VALUES (?,?,?)",[serviceId,x.nombre,x.precio]);await c.commit();return ok(res,{id_service:serviceId},isUpdate?200:201);}catch(e){await c?.rollback();return fail(res,e)}finally{c?.release()} }
export const createService=(req,res)=>saveService(req,res); export const updateService=(req,res)=>saveService(req,res,true);
export async function deleteService(req,res){let c;try{c=await getConnection();const r=await q(c,"DELETE FROM atelier_service WHERE id_service=? AND id_creator=?",[id(req.params.id_service),req.atelierUser.sub]);if(!r.affectedRows)return res.status(404).json({success:false,message:"Servicio no encontrado"});return ok(res,{deleted:true});}catch(e){return fail(res,e)}finally{c?.release()}}
async function portfolio(req,res,update=false){let c;try{c=await getConnection();const b=req.body;let item=id(req.params.id_item);if(update){const r=await q(c,"UPDATE atelier_portfolio_item SET titulo=?,descripcion=?,image_url=?,id_category=?,tags=?,destacado=? WHERE id_item=? AND id_creator=?",[b.titulo,b.descripcion??null,b.image_url,b.id_category??null,b.tags??null,b.destacado??false,item,req.atelierUser.sub]);if(!r.affectedRows)return res.status(404).json({success:false,message:"Elemento no encontrado"});}else{const r=await q(c,"INSERT INTO atelier_portfolio_item (id_creator,titulo,descripcion,image_url,id_category,tags,destacado) VALUES (?,?,?,?,?,?,?)",[req.atelierUser.sub,b.titulo,b.descripcion??null,b.image_url,b.id_category??null,b.tags??null,b.destacado??false]);item=r.insertId;}return ok(res,{id_item:item},update?200:201);}catch(e){return fail(res,e)}finally{c?.release()}}
export const createPortfolioItem=(req,res)=>portfolio(req,res);export const updatePortfolioItem=(req,res)=>portfolio(req,res,true);
export async function deletePortfolioItem(req,res){let c;try{c=await getConnection();const r=await q(c,"DELETE FROM atelier_portfolio_item WHERE id_item=? AND id_creator=?",[id(req.params.id_item),req.atelierUser.sub]);return r.affectedRows?ok(res,{deleted:true}):res.status(404).json({success:false,message:"Elemento no encontrado"});}catch(e){return fail(res,e)}finally{c?.release()}}
export async function listIncomingRequests(req, res) {
  let c;
  try {
    c = await getConnection();
    const creatorId = req.atelierUser.sub;
    const rows = await q(
      c,
      `SELECT r.*, u.nombre AS cliente,
        (SELECT COUNT(*) FROM atelier_quote q WHERE q.id_request = r.id_request AND q.estado = 'sent') AS quotes_sent,
        (SELECT q2.id_quote FROM atelier_quote q2 WHERE q2.id_request = r.id_request AND q2.id_creator = ? AND q2.estado = 'sent' LIMIT 1) AS my_quote_id
       FROM atelier_request r
       JOIN atelier_user u ON u.id_user = r.id_client
       WHERE r.id_creator = ?
          OR (r.id_creator IS NULL AND r.estado IN ('submitted','quote_sent'))
       ORDER BY r.creado_en DESC`,
      [creatorId, creatorId]
    );
    return ok(res, rows);
  } catch (e) { return fail(res, e); } finally { c?.release(); }
}

export async function getRequest(req, res) {
  let c;
  try {
    c = await getConnection();
    const [r] = await q(
      c,
      `SELECT r.*, u.nombre AS cliente, cp.nombre_artistico, cp.slug AS creator_slug
       FROM atelier_request r
       JOIN atelier_user u ON u.id_user = r.id_client
       LEFT JOIN atelier_creator_profile cp ON cp.id_user = r.id_creator
       WHERE r.id_request = ?`,
      [id(req.params.id_request)]
    );
    if (!r || !(await canSeeRequest(c, r, req.atelierUser))) {
      return res.status(404).json({ success: false, message: "Solicitud no encontrada" });
    }
    r.abierta = r.id_creator == null;
    r.files = await listFilesMeta(c, { id_request: r.id_request });
    const quoteRows = await loadQuotesForRequest(c, r, req.atelierUser);
    r.quotes = quoteRows;
    return ok(res, r);
  } catch (e) { return fail(res, e); } finally { c?.release(); }
}

async function loadQuotesForRequest(c, request, user) {
  const sql = user.role === "creador"
    ? `SELECT q.*, cp.nombre_artistico, cp.slug AS creator_slug
       FROM atelier_quote q JOIN atelier_creator_profile cp ON cp.id_user = q.id_creator
       WHERE q.id_request = ? AND q.id_creator = ? ORDER BY q.creado_en DESC`
    : `SELECT q.*, cp.nombre_artistico, cp.slug AS creator_slug
       FROM atelier_quote q JOIN atelier_creator_profile cp ON cp.id_user = q.id_creator
       WHERE q.id_request = ? ORDER BY q.creado_en DESC`;
  const params = user.role === "creador" ? [request.id_request, user.sub] : [request.id_request];
  const quotes = await q(c, sql, params);
  for (const quote of quotes) quote.items = await q(c, "SELECT * FROM atelier_quote_item WHERE id_quote=?", [quote.id_quote]);
  return quotes;
}

export async function listRequestQuotes(req, res) {
  let c;
  try {
    c = await getConnection();
    const [r] = await q(c, "SELECT * FROM atelier_request WHERE id_request=?", [id(req.params.id_request)]);
    if (!r || !(await canSeeRequest(c, r, req.atelierUser))) {
      return res.status(404).json({ success: false, message: "Solicitud no encontrada" });
    }
    return ok(res, await loadQuotesForRequest(c, r, req.atelierUser));
  } catch (e) { return fail(res, e); } finally { c?.release(); }
}

export async function createQuote(req, res) {
  let c;
  try {
    c = await getConnection();
    await c.beginTransaction();
    const requestId = id(req.params.id_request);
    const creatorId = req.atelierUser.sub;
    const [r] = await q(
      c,
      `SELECT r.*, s.id_category FROM atelier_request r
       LEFT JOIN atelier_service s ON s.id_service = r.id_service
       WHERE r.id_request = ? FOR UPDATE`,
      [requestId]
    );
    if (!r) throw Object.assign(new Error("Solicitud no encontrada"), { status: 404 });

    const [profile] = await q(c, "SELECT id_user, disponible FROM atelier_creator_profile WHERE id_user=?", [creatorId]);
    if (!profile) throw Object.assign(new Error("Perfil de artista no encontrado"), { status: 404 });

    const abierta = r.id_creator == null;
    if (abierta) {
      if (!profile.disponible) throw Object.assign(new Error("Debes estar disponible para cotizar en el tablero"), { status: 403 });
      if (!["submitted", "quote_sent"].includes(r.estado)) {
        throw Object.assign(new Error("Esta solicitud ya no admite propuestas"), { status: 400 });
      }
      const existingOrder = await q(c, "SELECT id_order FROM atelier_order WHERE id_request=?", [requestId]);
      if (existingOrder.length) throw Object.assign(new Error("Esta solicitud ya tiene un encargo"), { status: 409 });
    } else {
      if (Number(r.id_creator) !== Number(creatorId)) throw Object.assign(new Error("Solicitud no encontrada"), { status: 404 });
      if (r.estado === "submitted") assertRequestTransition(r.estado, "quote_sent", "creador");
      else if (r.estado !== "quote_sent") throw Object.assign(new Error("Esta solicitud ya no admite propuestas"), { status: 400 });
    }

    const [existing] = await q(c, "SELECT id_quote, estado FROM atelier_quote WHERE id_request=? AND id_creator=? FOR UPDATE", [requestId, creatorId]);
    if (existing && (existing.estado === "sent" || existing.estado === "accepted")) {
      throw Object.assign(new Error("Ya enviaste una propuesta para este brief"), { status: 409 });
    }

    const b = req.body;
    const gross = Number(b.precio_base) + Number(b.extras_total || 0) - Number(b.descuento || 0);
    const amount = settleAmounts(gross, await resolveCommissionRule(c, { id_creator: creatorId }));
    let quoteId;
    if (existing && (existing.estado === "rejected" || existing.estado === "expired")) {
      await q(
        c,
        `UPDATE atelier_quote SET precio_base=?,extras_total=?,descuento=?,gross_amount=?,platform_fee=?,creator_net=?,dias_entrega=?,revisiones=?,condiciones=?,expira_en=?,estado='sent' WHERE id_quote=?`,
        [b.precio_base, b.extras_total || 0, b.descuento || 0, amount.gross_amount, amount.platform_fee, amount.creator_net, b.dias_entrega, b.revisiones ?? 2, b.condiciones ?? null, b.expira_en ?? null, existing.id_quote]
      );
      quoteId = existing.id_quote;
      await q(c, "DELETE FROM atelier_quote_item WHERE id_quote=?", [quoteId]);
    } else {
      const result = await q(
        c,
        `INSERT INTO atelier_quote (id_request,id_creator,precio_base,extras_total,descuento,gross_amount,platform_fee,creator_net,dias_entrega,revisiones,condiciones,expira_en)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [r.id_request, creatorId, b.precio_base, b.extras_total || 0, b.descuento || 0, amount.gross_amount, amount.platform_fee, amount.creator_net, b.dias_entrega, b.revisiones ?? 2, b.condiciones ?? null, b.expira_en ?? null]
      );
      quoteId = result.insertId;
    }
    for (const item of b.items || []) {
      await q(c, "INSERT INTO atelier_quote_item (id_quote,label,amount) VALUES (?,?,?)", [quoteId, item.label, item.amount]);
    }
    if (r.estado === "submitted") {
      await q(c, "UPDATE atelier_request SET estado='quote_sent' WHERE id_request=?", [r.id_request]);
    }
    await c.commit();
    return ok(res, { id_quote: quoteId, ...amount }, 201);
  } catch (e) { await c?.rollback(); return fail(res, e); } finally { c?.release(); }
}

export async function createRequest(req, res) {
  let c;
  try {
    c = await getConnection();
    const b = req.body;
    const idCreator = b.id_creator || null;
    if (idCreator) {
      const [creator] = await q(c, "SELECT id_user FROM atelier_creator_profile WHERE id_user=? AND disponible=1", [idCreator]);
      if (!creator) throw Object.assign(new Error("Creador no disponible"), { status: 404 });
    }
    const r = await q(
      c,
      `INSERT INTO atelier_request (id_client,id_creator,id_service,titulo,descripcion,refs_json,brief_json,presupuesto,fecha_limite,estado)
       VALUES (?,?,?,?,?,?,?,?,?,'submitted')`,
      [
        req.atelierUser.sub, idCreator, b.id_service ?? null, b.titulo, b.descripcion,
        b.refs_json ? JSON.stringify(b.refs_json) : null,
        b.brief_json ? JSON.stringify(b.brief_json) : null,
        b.presupuesto ?? null, b.fecha_limite ?? null,
      ]
    );
    return ok(res, { id_request: r.insertId, abierta: !idCreator }, 201);
  } catch (e) { return fail(res, e); } finally { c?.release(); }
}

export async function acceptQuote(req, res) {
  let c;
  try {
    c = await getConnection();
    await c.beginTransaction();
    const [quote] = await q(
      c,
      `SELECT q.*, r.estado AS request_state, r.id_client, r.fecha_limite
       FROM atelier_quote q JOIN atelier_request r ON r.id_request = q.id_request
       WHERE q.id_quote = ? FOR UPDATE`,
      [id(req.params.id_quote)]
    );
    if (!quote || Number(quote.id_client) !== Number(req.atelierUser.sub)) {
      throw Object.assign(new Error("Cotización no encontrada"), { status: 404 });
    }
    assertRequestTransition(quote.request_state, "accepted", "cliente");
    if (quote.estado !== "sent") throw Object.assign(new Error("La cotización ya no está disponible"), { status: 400 });
    const existing = await q(c, "SELECT id_order FROM atelier_order WHERE id_request=?", [quote.id_request]);
    if (existing.length) throw Object.assign(new Error("La solicitud ya tiene pedido"), { status: 409 });
    const creatorId = quote.id_creator;
    const order = await q(
      c,
      `INSERT INTO atelier_order (id_request,id_quote,id_client,id_creator,estado,gross_amount,platform_fee,creator_net,revisiones_incluidas,fecha_limite)
       VALUES (?,?,?,?,'payment_pending',?,?,?,?,?)`,
      [quote.id_request, quote.id_quote, quote.id_client, creatorId, quote.gross_amount, quote.platform_fee, quote.creator_net, quote.revisiones, quote.fecha_limite]
    );
    await q(c, "UPDATE atelier_quote SET estado='accepted' WHERE id_quote=?", [quote.id_quote]);
    await q(c, "UPDATE atelier_quote SET estado='rejected' WHERE id_request=? AND id_quote<>? AND estado='sent'", [quote.id_request, quote.id_quote]);
    await q(c, "UPDATE atelier_request SET estado='payment_pending', id_creator=? WHERE id_request=?", [creatorId, quote.id_request]);
    await q(c, "INSERT IGNORE INTO atelier_wallet (id_creator) VALUES (?)", [creatorId]);
    await q(c, "INSERT INTO atelier_order_event (id_order,tipo,mensaje,id_actor) VALUES (?, 'ORDER_CREATED','Pedido creado y pendiente de pago',?)", [order.insertId, req.atelierUser.sub]);
    await c.commit();
    return ok(res, { id_order: order.insertId }, 201);
  } catch (e) { await c?.rollback(); return fail(res, e); } finally { c?.release(); }
}

export async function rejectQuote(req, res) {
  let c;
  try {
    c = await getConnection();
    await c.beginTransaction();
    const [x] = await q(
      c,
      `SELECT q.id_quote, q.id_request, q.estado AS quote_estado, r.estado, r.id_client, r.id_creator
       FROM atelier_quote q JOIN atelier_request r ON r.id_request = q.id_request
       WHERE q.id_quote = ? FOR UPDATE`,
      [id(req.params.id_quote)]
    );
    if (!x || Number(x.id_client) !== Number(req.atelierUser.sub)) {
      throw Object.assign(new Error("Cotización no encontrada"), { status: 404 });
    }
    if (x.quote_estado !== "sent") throw Object.assign(new Error("La cotización ya no está disponible"), { status: 400 });
    if (!["submitted", "quote_sent"].includes(x.estado)) {
      throw Object.assign(new Error("Esta solicitud ya no admite rechazar propuestas"), { status: 400 });
    }
    await q(c, "UPDATE atelier_quote SET estado='rejected' WHERE id_quote=?", [x.id_quote]);
    const remaining = await q(c, "SELECT id_quote FROM atelier_quote WHERE id_request=? AND estado='sent'", [x.id_request]);
    const abierta = x.id_creator == null;
    const cancelRequest = !abierta && req.body?.cancel_request === true;
    const nextEstado = cancelRequest ? "cancelled" : (remaining.length ? "quote_sent" : "submitted");
    await q(c, "UPDATE atelier_request SET estado=? WHERE id_request=?", [nextEstado, x.id_request]);
    await c.commit();
    return ok(res, { rejected: true, request_estado: nextEstado });
  } catch (e) { await c?.rollback(); return fail(res, e); } finally { c?.release(); }
}

export async function listMyRequests(req, res) {
  let c;
  try {
    c = await getConnection();
    const rows = await q(
      c,
      `SELECT r.*, cp.nombre_artistico, cp.slug AS creator_slug
       FROM atelier_request r
       LEFT JOIN atelier_creator_profile cp ON cp.id_user = r.id_creator
       WHERE r.id_client = ?
       ORDER BY r.creado_en DESC`,
      [req.atelierUser.sub]
    );
    const ids = rows.map((row) => row.id_request);
    let quotes = [];
    if (ids.length) {
      quotes = await q(
        c,
        `SELECT q.*, cp.nombre_artistico, cp.slug AS creator_slug
         FROM atelier_quote q JOIN atelier_creator_profile cp ON cp.id_user = q.id_creator
         WHERE q.id_request IN (${ids.map(() => "?").join(",")})
         ORDER BY q.creado_en DESC`,
        ids
      );
    }
    const byReq = new Map();
    for (const quote of quotes) {
      if (!byReq.has(quote.id_request)) byReq.set(quote.id_request, []);
      byReq.get(quote.id_request).push(quote);
    }
    for (const row of rows) {
      row.abierta = row.id_creator == null;
      row.quotes = byReq.get(row.id_request) || [];
    }
    return ok(res, rows);
  } catch (e) { return fail(res, e); } finally { c?.release(); }
}
export async function listMyOrders(req,res){let c;try{c=await getConnection();return ok(res,await q(c,"SELECT o.*,r.titulo,cp.nombre_artistico,u.nombre AS cliente FROM atelier_order o JOIN atelier_request r ON r.id_request=o.id_request JOIN atelier_creator_profile cp ON cp.id_user=o.id_creator JOIN atelier_user u ON u.id_user=o.id_client WHERE o.id_client=? ORDER BY o.creado_en DESC",[req.atelierUser.sub]));}catch(e){return fail(res,e)}finally{c?.release()}}
export async function startOrder(req,res) {
  req.body.estado = "in_progress";
  return transitionOrder(req, res);
}
export async function getOrder(req,res){let c;try{c=await getConnection();const [o]=await q(c,"SELECT o.*,r.titulo,r.descripcion,r.brief_json,cu.nombre AS cliente,cp.nombre_artistico FROM atelier_order o JOIN atelier_request r ON r.id_request=o.id_request JOIN atelier_user cu ON cu.id_user=o.id_client JOIN atelier_creator_profile cp ON cp.id_user=o.id_creator WHERE o.id_order=?",[id(req.params.id_order)]);if(!o||!ownOrder(o,req.atelierUser))return res.status(404).json({success:false,message:"Pedido no encontrado"});o.events=await q(c,"SELECT * FROM atelier_order_event WHERE id_order=? ORDER BY creado_en",[o.id_order]);o.messages=await q(c,"SELECT m.*,u.nombre FROM atelier_message m JOIN atelier_user u ON u.id_user=m.id_sender WHERE m.id_order=? ORDER BY m.creado_en",[o.id_order]);o.revisions=await q(c,"SELECT * FROM atelier_revision WHERE id_order=? ORDER BY numero",[o.id_order]);const [quote]=await q(c,"SELECT * FROM atelier_quote WHERE id_quote=?",[o.id_quote]);if(quote)quote.items=await q(c,"SELECT * FROM atelier_quote_item WHERE id_quote=?",[quote.id_quote]);o.quote=quote||null;o.files=await listFilesMeta(c,{id_order:o.id_order,id_request:o.id_request});return ok(res,o);}catch(e){return fail(res,e)}finally{c?.release()}}
export async function transitionOrder(req,res){let c;try{c=await getConnection();await c.beginTransaction();const [o]=await q(c,"SELECT * FROM atelier_order WHERE id_order=? FOR UPDATE",[id(req.params.id_order)]);if(!o||!ownOrder(o,req.atelierUser))throw Object.assign(new Error("Pedido no encontrado"),{status:404});assertOrderTransition(o.estado,req.body.estado,req.atelierUser.role);if(req.atelierUser.role==="creador"&&Number(o.id_creator)!==Number(req.atelierUser.sub))throw Object.assign(new Error("No autorizado"),{status:403});if(req.atelierUser.role==="cliente"&&Number(o.id_client)!==Number(req.atelierUser.sub))throw Object.assign(new Error("No autorizado"),{status:403});await q(c,"UPDATE atelier_order SET estado=?,completed_en=IF(?='completed',NOW(),completed_en) WHERE id_order=?",[req.body.estado,req.body.estado,o.id_order]);await q(c,"UPDATE atelier_request SET estado=? WHERE id_request=?",[req.body.estado,o.id_request]);if(req.body.estado==="completed"){await q(c,"UPDATE atelier_wallet SET pending=pending-?,available=available+?,total_earned=total_earned+? WHERE id_creator=?",[o.creator_net,o.creator_net,o.creator_net,o.id_creator]);await q(c,"INSERT INTO atelier_ledger_entry (id_order,id_creator,tipo,amount) VALUES (?,?,'CREATOR_BALANCE_RELEASED',?)",[o.id_order,o.id_creator,o.creator_net]);await q(c,"UPDATE atelier_creator_profile SET pedidos_completados=pedidos_completados+1 WHERE id_user=?",[o.id_creator]);}await q(c,"INSERT INTO atelier_order_event (id_order,tipo,mensaje,id_actor) VALUES (?,?,?,?)",[o.id_order,"STATE_CHANGED",`Estado actualizado a ${req.body.estado}`,req.atelierUser.sub]);await c.commit();return ok(res,{estado:req.body.estado});}catch(e){await c?.rollback();return fail(res,e)}finally{c?.release()}}
export async function listMessages(req,res){let c;try{c=await getConnection();const [o]=await q(c,"SELECT * FROM atelier_order WHERE id_order=?",[id(req.params.id_order)]);if(!o||!ownOrder(o,req.atelierUser))throw Object.assign(new Error("Pedido no encontrado"),{status:404});return ok(res,await q(c,"SELECT m.*,u.nombre FROM atelier_message m JOIN atelier_user u ON u.id_user=m.id_sender WHERE m.id_order=? ORDER BY m.creado_en",[o.id_order]));}catch(e){return fail(res,e)}finally{c?.release()}}
export async function postMessage(req,res){let c;try{c=await getConnection();const [o]=await q(c,"SELECT * FROM atelier_order WHERE id_order=?",[id(req.params.id_order)]);if(!o||!ownOrder(o,req.atelierUser))throw Object.assign(new Error("Pedido no encontrado"),{status:404});const r=await q(c,"INSERT INTO atelier_message (id_order,id_sender,body) VALUES (?,?,?)",[o.id_order,req.atelierUser.sub,req.body.body]);return ok(res,{id_message:r.insertId},201);}catch(e){return fail(res,e)}finally{c?.release()}}
export async function addAttachment(req,res){let c;try{c=await getConnection();const [o]=await q(c,"SELECT * FROM atelier_order WHERE id_order=?",[id(req.params.id_order)]);if(!o||!ownOrder(o,req.atelierUser))throw Object.assign(new Error("Pedido no encontrado"),{status:404});const r=await q(c,"INSERT INTO atelier_attachment (id_order,id_uploader,kind,url,filename) VALUES (?,?,?,?,?)",[o.id_order,req.atelierUser.sub,req.body.kind||"other",req.body.url,req.body.filename??null]);return ok(res,{id_attachment:r.insertId},201);}catch(e){return fail(res,e)}finally{c?.release()}}
export async function requestRevision(req,res){let c;try{c=await getConnection();const [o]=await q(c,"SELECT * FROM atelier_order WHERE id_order=?",[id(req.params.id_order)]);if(!o||Number(o.id_client)!==Number(req.atelierUser.sub))throw Object.assign(new Error("Pedido no encontrado"),{status:404});if(Number(o.revisiones_usadas)>=Number(o.revisiones_incluidas))throw Object.assign(new Error("No quedan revisiones incluidas en este encargo"),{status:400});assertOrderTransition(o.estado,"revision","cliente");const r=await q(c,"INSERT INTO atelier_revision (id_order,numero,comentario,id_client) VALUES (?,?,?,?)",[o.id_order,o.revisiones_usadas+1,req.body.comentario,req.atelierUser.sub]);await q(c,"UPDATE atelier_order SET estado='revision',revisiones_usadas=revisiones_usadas+1 WHERE id_order=?",[o.id_order]);await q(c,"UPDATE atelier_request SET estado='revision' WHERE id_request=?",[o.id_request]);return ok(res,{id_revision:r.insertId},201);}catch(e){return fail(res,e)}finally{c?.release()}}
export async function addReview(req,res){let c;try{c=await getConnection();const [o]=await q(c,"SELECT * FROM atelier_order WHERE id_order=?",[id(req.params.id_order)]);if(!o||Number(o.id_client)!==Number(req.atelierUser.sub)||o.estado!=="completed")throw Object.assign(new Error("Solo puedes reseñar pedidos completados"),{status:400});const b=req.body,stars=(b.calidad+b.comunicacion+b.cumplimiento+b.tiempo)/4;const r=await q(c,"INSERT INTO atelier_review (id_order,id_client,id_creator,calidad,comunicacion,cumplimiento,tiempo,estrellas,comentario) VALUES (?,?,?,?,?,?,?,?,?)",[o.id_order,o.id_client,o.id_creator,b.calidad,b.comunicacion,b.cumplimiento,b.tiempo,stars,b.comentario??null]);await q(c,"UPDATE atelier_creator_profile SET rating_avg=(SELECT COALESCE(AVG(estrellas),0) FROM atelier_review WHERE id_creator=?),reviews_count=reviews_count+1 WHERE id_user=?",[o.id_creator,o.id_creator]);return ok(res,{id_review:r.insertId,estrellas:stars},201);}catch(e){return fail(res,e)}finally{c?.release()}}
export async function createCheckout(req,res){let c;try{c=await getConnection();const [o]=await q(c,"SELECT o.*,r.titulo,u.email FROM atelier_order o JOIN atelier_request r ON r.id_request=o.id_request JOIN atelier_user u ON u.id_user=o.id_client WHERE o.id_order=?",[id(req.params.id_order)]);if(!o||Number(o.id_client)!==Number(req.atelierUser.sub)||o.estado!=="payment_pending")throw Object.assign(new Error("Pedido no disponible para pago"),{status:400});const checkout=await createAtelierCheckout({id_order:o.id_order,title:o.titulo,amount:o.gross_amount,payer_email:o.email});await q(c,"INSERT INTO atelier_payment (id_order,amount,platform_fee,creator_amount,preference_id) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE preference_id=VALUES(preference_id)",[o.id_order,o.gross_amount,o.platform_fee,o.creator_net,checkout.preference_id]);return ok(res,checkout);}catch(e){return fail(res,e)}finally{c?.release()}}
export async function paymentWebhook(req,res){let c;try{const paymentId=req.body?.data?.id||req.query.id||req.body?.id;if(!paymentId)return ok(res,{received:true});const mp=await fetchMpPayment(paymentId);if(mp.status!=="approved")return ok(res,{received:true,status:mp.status});const orderId=parseAtelierExternalRef(mp.external_reference);if(!orderId)throw Object.assign(new Error("Referencia Atelier inválida"),{status:400});c=await getConnection();await c.beginTransaction();const [p]=await q(c,"SELECT p.*,o.id_creator,o.id_request,o.estado FROM atelier_payment p JOIN atelier_order o ON o.id_order=p.id_order WHERE p.id_order=? FOR UPDATE",[orderId]);if(!p)throw Object.assign(new Error("Pago no encontrado"),{status:404});if(p.status==="approved"){await c.commit();return ok(res,{received:true,duplicate:true});}if(Number(mp.transaction_amount)!==Number(p.amount))throw Object.assign(new Error("Monto de pago no coincide"),{status:400});await q(c,"UPDATE atelier_payment SET status='approved',provider_payment_id=?,paid_at=NOW() WHERE id_payment=?",[String(paymentId),p.id_payment]);await q(c,"UPDATE atelier_order SET estado='paid' WHERE id_order=?",[orderId]);await q(c,"UPDATE atelier_request SET estado='paid' WHERE id_request=?",[p.id_request]);await q(c,"UPDATE atelier_wallet SET pending=pending+? WHERE id_creator=?",[p.creator_amount,p.id_creator]);for(const [tipo,amount] of [["PAYMENT_RECEIVED",p.amount],["PLATFORM_FEE",p.platform_fee],["CREATOR_EARNING_HELD",p.creator_amount]])await q(c,"INSERT INTO atelier_ledger_entry (id_order,id_creator,tipo,amount) VALUES (?,?,?,?)",[orderId,p.id_creator,tipo,amount]);await q(c,"INSERT INTO atelier_order_event (id_order,tipo,mensaje) VALUES (?,'PAYMENT_APPROVED','Pago aprobado por Mercado Pago')",[orderId]);await c.commit();return ok(res,{received:true});}catch(e){await c?.rollback();return fail(res,e)}finally{c?.release()}}
export async function getCreatorWallet(req,res){
  let c;
  try {
    c = await getConnection();
    const [w] = await q(c, "SELECT * FROM atelier_wallet WHERE id_creator=?", [req.atelierUser.sub]);
    const orders = await q(
      c,
      `SELECT o.id_order,o.estado,o.gross_amount,o.platform_fee,o.creator_net,o.currency,o.creado_en,o.completed_en,r.titulo
       FROM atelier_order o JOIN atelier_request r ON r.id_request=o.id_request
       WHERE o.id_creator=? ORDER BY o.creado_en DESC`,
      [req.atelierUser.sub]
    );
    return ok(res, { ...(w || { pending: 0, available: 0, withdrawn: 0, total_earned: 0 }), orders });
  } catch (e) { return fail(res, e); } finally { c?.release(); }
}
export async function listUsers(req,res){let c;try{c=await getConnection();return ok(res,await q(c,"SELECT id_user,email,role,nombre,activo,creado_en FROM atelier_user ORDER BY creado_en DESC"));}catch(e){return fail(res,e)}finally{c?.release()}}
export async function listOrders(req,res){let c;try{c=await getConnection();return ok(res,await q(c,"SELECT o.*,r.titulo,cu.email AS cliente_email,cr.email AS creador_email FROM atelier_order o JOIN atelier_request r ON r.id_request=o.id_request JOIN atelier_user cu ON cu.id_user=o.id_client JOIN atelier_user cr ON cr.id_user=o.id_creator ORDER BY o.creado_en DESC"));}catch(e){return fail(res,e)}finally{c?.release()}}
export async function dashboardKpis(req,res){let c;try{c=await getConnection();const [x]=await q(c,"SELECT COALESCE(SUM(CASE WHEN estado IN ('paid','in_progress','preview','revision','final_delivery','completed') THEN gross_amount END),0) gmv,COALESCE(SUM(CASE WHEN estado IN ('paid','in_progress','preview','revision','final_delivery','completed') THEN platform_fee END),0) fees,COUNT(*) orders_count FROM atelier_order");return ok(res,x);}catch(e){return fail(res,e)}finally{c?.release()}}
export async function setCommissionRule(req,res){let c;try{c=await getConnection();const b=req.body;if(b.scope==="creator"&&!b.id_creator)throw Object.assign(new Error("id_creator es obligatorio"),{status:400});if(b.scope==="category"&&!b.id_category)throw Object.assign(new Error("id_category es obligatorio"),{status:400});const r=await q(c,"INSERT INTO atelier_commission_rule (scope,id_creator,id_category,percent,min_fee,max_fee,activo) VALUES (?,?,?,?,?,?,?)",[b.scope,b.id_creator??null,b.id_category??null,b.percent,b.min_fee??null,b.max_fee??null,b.activo??true]);return ok(res,{id_rule:r.insertId},201);}catch(e){return fail(res,e)}finally{c?.release()}}
