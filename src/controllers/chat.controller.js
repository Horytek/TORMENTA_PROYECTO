import OpenAI from "openai";
import { getConnection } from "../database/database.js";
import axios from "axios";

// Inicializar el cliente de OpenAI solo si hay API key disponible
let client = null;
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

if (API_KEY && API_KEY !== "" && API_KEY !== "tu_api_key_de_openai_aqui") {
  try {
    client = new OpenAI({ apiKey: API_KEY });
  } catch (error) {
    console.error("Error al inicializar cliente OpenAI:", error.message);
  }
} else {
  console.warn("⚠️ API de OpenAI no configurada. El servicio de chat no estará disponible.");
  console.warn("   Por favor, configura OPENAI_API_KEY en tu archivo .env");
}

function toPlainText(s = "") {
  return String(s || "")
    .replace(/\*\*(.*?)\*\*/g, "$1")       // **bold**
    .replace(/__(.*?)__/g, "$1")           // __bold__
    .replace(/\*(.*?)\*/g, "$1")           // *italic*
    .replace(/_(.*?)_/g, "$1")             // _italic_
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1") // `code`
    .replace(/\r/g, "")
    .trim();
}

// Util: base URL interna (respeta https en proxy)
function getApiBaseUrl(req) {
  try {
    const envBase = (process.env.API_BASE_URL || "").replace(/\/+$/, "");
    if (envBase) return envBase.endsWith("/api") ? envBase : `${envBase}/api`;

    const xfProto = (req.headers["x-forwarded-proto"] || "").split(",")[0].trim().toLowerCase();
    const xfHost  = (req.headers["x-forwarded-host"]  || "").split(",")[0].trim();
    const proto = xfProto || (req.secure ? "https" : (req.protocol || "http"));
    const host  = xfHost  || req.get("host") || "";
    if (host) return `${proto}://${host}/api`;
    return "http://localhost:4000/api";
  } catch {
    return "http://localhost:4000/api";
  }
}

// Util: axios interno con credenciales (auth/tenant)
function makeInternalHttp(req) {
  let baseURL = getApiBaseUrl(req);
  const xfProto = (req.headers["x-forwarded-proto"] || "").split(",")[0].trim().toLowerCase();
  const reqProto = xfProto || (req.secure ? "https" : (req.protocol || "http"));
  if (baseURL.startsWith("http://") && reqProto === "https") baseURL = baseURL.replace("http://", "https://");

  const instance = axios.create({ baseURL, timeout: 12000, withCredentials: true });
  if (req.headers?.cookie) instance.defaults.headers.Cookie = req.headers.cookie;
  ["x-tenant-id","x-user-name","x-role-id","x-sucursal","x-empresa"].forEach(h => {
    if (req.headers[h]) instance.defaults.headers[h] = req.headers[h];
  });
  return instance;
}

// Util: contexto usuario/tenant
function getUserCtx(req) {
  return {
    username: req.headers["x-user-name"] || req.user?.nameUser || req.user?.usuario || "",
    roleId: req.headers["x-role-id"] || "",
    tenantId: req.headers["x-tenant-id"] || req.id_tenant || "",
    sucursal: req.headers["x-sucursal"] || "",
    empresa: req.headers["x-empresa"] || ""
  };
}



// Util: filtrar por tenant si existe id_tenant en filas
function filterByTenant(rows, tenantId) {
  if (!tenantId) return rows;
  const t = String(tenantId);
  const withTid = rows.filter(r => r && r.id_tenant !== undefined);
  return withTid.length ? withTid.filter(r => String(r.id_tenant) === t) : rows;
}

// Normalizar respuesta API -> array
function normalizeApiRows(apiResponse) {
  const raw = apiResponse?.data ?? apiResponse ?? {};
  return Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : raw?.data ? [raw.data] : [];
}

// TOOLS: definición (lo que el modelo puede invocar)
function buildTools() {
  return [
    {
      type: "function",
      function: {
        name: "get_empresa",
        description: "Obtiene los datos de la empresa vinculada al tenant del usuario.",
        parameters: { type: "object", properties: {}, additionalProperties: false }
      }
    },
    {
      type: "function",
      function: {
        name: "get_clientes",
        description: "Lista clientes del tenant. Devuelve items y total real (metadata.totalRecords).",
        parameters: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 500, default: 100 },
            docType: { type: "string" },
            docNumber: { type: "string" },
            searchTerm: { type: "string", description: "Nombre, apellidos, razón social, DNI o RUC del cliente a buscar" }
          },
          additionalProperties: false
        }
      }
    },
    {
      type: "function",
      function: {
        name: "get_productos",
        description: "Lista productos del tenant. Permite paginación.",
        parameters: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 200, default: 50 }
          },
          additionalProperties: false
        }
      }
    },
    {
      type: "function",
      function: {
        name: "get_usuarios",
        description: "Lista usuarios del tenant.",
        parameters: { type: "object", properties: {}, additionalProperties: false }
      }
    },
    {
      type: "function",
      function: {
        name: "get_reporte_ganancias",
        description: "Obtiene el total recaudado en soles. Parámetros opcionales: year, month, week, id_sucursal.",
        parameters: {
          type: "object",
          properties: {
            year: { type: "string" },
            month: { type: "string" },
            week: { type: "string", enum: ["current"] },
            id_sucursal: { type: "integer" }
          },
          additionalProperties: false
        }
      }
    }
  ];
}


// HANDLERS: ejecución real de cada tool (GET internos)
async function runToolCall(name, args, req) {
  const http = makeInternalHttp(req);
  const { tenantId } = getUserCtx(req);

  switch (name) {
    case "get_empresa": {
      const r = await http.get("/empresa");
      const rows = filterByTenant(normalizeApiRows(r), tenantId);
      return rows.slice(0, 1);
    }
    case "get_clientes": {
      // Forzar como mínimo un límite alto, pero el conteo se toma de metadata
      const params = {
        page: Number(args?.page ?? 1) || 1,
        limit: Math.min(Math.max(Number(args?.limit ?? 200), 100), 500),
        ...(args?.docType ? { docType: String(args.docType) } : {}),
        ...(args?.docNumber ? { docNumber: String(args.docNumber) } : {}),
        ...(args?.searchTerm ? { searchTerm: String(args.searchTerm) } : {})
      };
      const r = await http.get("/clientes", { params });
      const body = r?.data ?? {};
      const items = filterByTenant(Array.isArray(body?.data) ? body.data : [], tenantId);
      const total = Number(body?.metadata?.totalRecords ?? items.length);
      return { total, items };
    }
    case "get_productos": {
      const params = { page: Number(args?.page ?? 1) || 1, limit: Math.min(Math.max(Number(args?.limit ?? 100), 50), 200) };
      const r = await http.get("/productos", { params });
      const items = filterByTenant(normalizeApiRows(r), tenantId);
      // Si tu endpoint de productos tiene metadata.totalRecords, úsalo; si no, items.length
      const body = r?.data ?? {};
      const total = Number(body?.metadata?.totalRecords ?? items.length);
      return { total, items };
    }
    case "get_usuarios": {
      const r = await http.get("/usuario");
      const rows = filterByTenant(normalizeApiRows(r), tenantId);
      return rows;
    }
    case "get_reporte_ganancias": {
      const params = {};
      if (args?.year) params.year = String(args.year);
      if (args?.month) params.month = String(args.month);
      if (args?.week) params.week = String(args.week);
      if (args?.id_sucursal) params.id_sucursal = Number(args.id_sucursal);
      const r = await http.get("/reporte/ganancias", { params });
      const rows = filterByTenant(normalizeApiRows(r), tenantId);
      return rows;
    }
    default:
      return { error: `Tool no soportada: ${name}` };
  }
}

async function getRAGSnippetFromDB(queryText, id_tenant) {
  if (!queryText) return "";
  let connection;
  try {
    connection = await getConnection();
    const like = `%${queryText}%`;

    const whereM = id_tenant ? " WHERE m.id_tenant = ? " : "";
    const paramsM = id_tenant ? [id_tenant, like, like] : [like, like];
    const [mods] = await connection.query(
      `
      SELECT m.nombre_modulo AS nombre, m.ruta AS ruta
      FROM modulo m
      ${whereM} AND (m.nombre_modulo LIKE ? OR m.ruta LIKE ?)
      ORDER BY m.id_modulo LIMIT 6
      `.replace("WHERE  AND", "WHERE"),
      paramsM
    );

    const whereS = id_tenant ? " WHERE s.id_tenant = ? " : "";
    const paramsS = id_tenant ? [id_tenant, like, like] : [like, like];
    const [subs] = await connection.query(
      `
      SELECT s.nombre_sub AS nombre, s.ruta AS ruta
      FROM submodulos s
      ${whereS} AND (s.nombre_sub LIKE ? OR s.ruta LIKE ?)
      ORDER BY s.id_submodulo LIMIT 6
      `.replace("WHERE  AND", "WHERE"),
      paramsS
    );

    const items = [...mods, ...subs].slice(0, 8);
    if (!items.length) return "";
    const lines = items.map((i) => `• ${i.nombre} (ruta: ${i.ruta || "/"})`).join("\n");
    return `Rutas posiblemente relevantes:\n${lines}`;
  } catch (e) {
    return "";
  } finally {
    if (connection) connection.release();
  }
}

// Detectar tablas mencionadas en la consulta del usuario
function detectTables(text = "") {
  const q = (text || "").toLowerCase();
  const known = [
    "usuario","rol","permisos","modulo","submodulos",
    "cliente","venta","detalle_venta","comprobante",
    "producto","marca","sub_categoria","inventario",
    "almacen","sucursal","nota","detalle_nota",
    "guia_remision","destinatario","transportista","vehiculo",
    "kardex","detalle_kardex","vendedor","sucursal_almacen"
  ];
  return known.filter(t => q.includes(t) || q.includes(t.replace("_"," "))).slice(0, 6);
}

async function getSchemaSnippetFromDB(tableList = []) {
  if (!tableList.length) return "";
  let connection;
  try {
    connection = await getConnection();
    const [[{ db }]] = await connection.query(`SELECT DATABASE() AS db`);
    if (!db) return "";

    const placeholders = tableList.map(() => "?").join(",");

    const [cols] = await connection.query(
      `
      SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName, COLUMN_TYPE AS columnType, COLUMN_KEY AS columnKey
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${placeholders})
      ORDER BY TABLE_NAME, ORDINAL_POSITION
      `,
      [db, ...tableList]
    );

    const [fks] = await connection.query(
      `
      SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName, REFERENCED_TABLE_NAME AS refTable, REFERENCED_COLUMN_NAME AS refColumn
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${placeholders}) AND REFERENCED_TABLE_NAME IS NOT NULL
      `,
      [db, ...tableList]
    );

    const fkMap = {};
    for (const fk of fks) {
      fkMap[`${fk.tableName}.${fk.columnName}`] = `${fk.refTable}.${fk.refColumn}`;
    }

    const byTable = {};
    for (const c of cols) (byTable[c.tableName] ||= []).push(c);

    const blocks = [];
    for (const t of tableList) {
      const colsT = (byTable[t] || []).map(c => {
        const k = c.columnKey === "PRI" ? "PK" : c.columnKey === "UNI" ? "UQ" : fkMap[`${t}.${c.columnName}`] ? `FK→${fkMap[`${t}.${c.columnName}`]}` : "";
        return `${c.columnName} ${c.columnType}${k ? ` [${k}]` : ""}`;
      });
      if (colsT.length) blocks.push(`Tabla ${t}:\n  - ${colsT.join("\n  - ")}`);
    }

    let text = blocks.join("\n\n");
    if (text.length > 2000) text = text.slice(0, 2000) + "\n…";
    return text ? `Esquema relevante:\n${text}` : "";
  } catch {
    return "";
  } finally {
    if (connection) connection.release();
  }
}

export const chat = async (req, res) => {
  try {
    // Verificar OpenAI
    if (!client) {
      console.warn("Intento de usar chat sin API key configurada");
      return res.status(503).json({
        error: "CHAT_SERVICE_UNAVAILABLE",
        message: "El servicio de chat no está disponible. Por favor, configura la API key de OpenAI."
      });
    }

    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const safeMessages = messages.slice(-20).map(m => ({
      role: m.role === "system" || m.role === "assistant" ? m.role : "user",
      content: String(m.content || "").slice(0, 4000)
    }));

    const lastUser = [...safeMessages].reverse().find(m => m.role === "user");
    const queryText = lastUser?.content?.slice(-1000) || "";

    // RAG: posibles rutas y esquema (como antes)
    const rag = await getRAGSnippetFromDB(queryText, req.id_tenant);
    const tables = detectTables(queryText);
    const schemaSnippet = await getSchemaSnippetFromDB(tables);

    // Mensajes base (no visibles) + conversación
    const augmented = [
      {
        role: "system",
        content:
`Formato: texto plano (sin Markdown ni **).
- Si la pregunta es de datos (empresa, clientes, productos, ventas, reportes), llama las tools.
- Si el output de la tool incluye "total", úsalo como conteo real (no estimes por cantidad de items).
- Para listados: "- Nombre — Categoria (Marca) — Precio: S/ 0.00".
- Para conteos: "Total: N".
- No inventes ni mezcles formularios.`
      },
      ...(schemaSnippet ? [{ role: "system", content: `Contexto adicional (no visible para el usuario):\n${schemaSnippet}` }] : []),
      ...(rag ? [{ role: "system", content: `Contexto adicional (no visible para el usuario):\n${rag}` }] : []),
      ...safeMessages
    ];

    const tools = buildTools();

    const first = await client.chat.completions.create({
      model: MODEL,
      messages: augmented,
      tools,
      tool_choice: "auto",
      temperature: 0.10,
      max_tokens: 320
    });

    const assistantMsg = first?.choices?.[0]?.message || {};
    const toolCalls = assistantMsg?.tool_calls || [];

    if (Array.isArray(toolCalls) && toolCalls.length) {
      const toolMessages = [];
      for (const call of toolCalls) {
        try {
          const name = call?.function?.name || "";
          const args = JSON.parse(call?.function?.arguments || "{}");
          const output = await runToolCall(name, args, req);

          // Si la tool ya trae { total, items }, úsalo tal cual; si fuese array, encapsular
          const hint = Array.isArray(output) ? { total: output.length, items: output } : output;

          toolMessages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(hint).slice(0, 8000)
          });
        } catch (e) {
          toolMessages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({ error: "Fallo ejecutando tool", detail: String(e?.message || e) })
          });
        }
      }

      const follow = await client.chat.completions.create({
        model: MODEL,
        messages: [...augmented, assistantMsg, ...toolMessages],
        temperature: 0.10,
        max_tokens: 380
      });

      const raw = follow?.choices?.[0]?.message?.content || "No hay datos suficientes.";
      const content = toPlainText(raw);
      return res.json({ choices: [{ message: { content } }] });
    }

    const raw = assistantMsg?.content || "No hay datos suficientes.";
    const content = toPlainText(raw);
    return res.json({ choices: [{ message: { content } }] });
  } catch (e) {
    console.error("CHAT_ERR", e);
    return res.status(500).json({ error: "CHAT_FAILED" });
  }
};