import OpenAI from "openai";
import { getConnection } from "../database/database.js";

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
    // Verificar si el cliente de OpenAI está disponible
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

    // RAG: posibles rutas del sistema
    const rag = await getRAGSnippetFromDB(queryText, req.id_tenant);

    // RAG: esquema de tablas mencionadas
    const tables = detectTables(queryText);
    const schemaSnippet = await getSchemaSnippetFromDB(tables);

    const augmented = [
      ...(schemaSnippet ? [{ role: "system", content: `Contexto adicional (no visible para el usuario):\n${schemaSnippet}` }] : []),
      ...(rag ? [{ role: "system", content: `Contexto adicional (no visible para el usuario):\n${rag}` }] : []),
      ...safeMessages
    ];

    const r = await client.chat.completions.create({
      model: MODEL,
      messages: augmented,
      temperature: 0.10,
      max_tokens: 380
    });

    const content = r?.choices?.[0]?.message?.content || "";
    return res.json({ choices: [{ message: { content } }] });
  } catch (e) {
    console.error("CHAT_ERR", e);
    return res.status(500).json({ error: "CHAT_FAILED" });
  }
};