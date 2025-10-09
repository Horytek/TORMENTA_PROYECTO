import OpenAI from "openai";
import { getConnection } from "../database/database.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

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

export const chat = async (req, res) => {
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const safeMessages = messages.slice(-20).map(m => ({
      role: m.role === "system" || m.role === "assistant" ? m.role : "user",
      content: String(m.content || "").slice(0, 4000)
    }));

    // Extraer último texto del usuario para RAG
    const lastUser = [...safeMessages].reverse().find(m => m.role === "user");
    const queryText = lastUser?.content?.slice(-1000) || "";
    const rag = await getRAGSnippetFromDB(queryText, req.id_tenant);

    const augmented = rag
      ? [{ role: "system", content: `Contexto adicional (no visible para el usuario):\n${rag}` }, ...safeMessages]
      : safeMessages;

    const r = await client.chat.completions.create({
      model: MODEL,
      messages: augmented,
      temperature: 0.2,
      max_tokens: 380
    });

    const content = r?.choices?.[0]?.message?.content || "";
    return res.json({ choices: [{ message: { content } }] });
  } catch (e) {
    console.error("CHAT_ERR", e);
    return res.status(500).json({ error: "CHAT_FAILED" });
  }
};