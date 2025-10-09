import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export const chat = async (req, res) => {
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const safeMessages = messages.slice(-20).map(m => ({
      role: m.role === "system" || m.role === "assistant" ? m.role : "user",
      content: String(m.content || "").slice(0, 4000)
    }));

    const r = await client.chat.completions.create({
      model: MODEL,
      messages: safeMessages,
      temperature: 0.2,
      max_tokens: 300
    });

    const content = r?.choices?.[0]?.message?.content || "";
    return res.json({ choices: [{ message: { content } }] });
  } catch (e) {
    console.error("CHAT_ERR", e);
    return res.status(500).json({ error: "CHAT_FAILED" });
  }
};