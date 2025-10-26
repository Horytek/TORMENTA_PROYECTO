import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";
dotenv.config();

const client = new MercadoPagoConfig({
  accessToken: process.env.ACCESS_TOKEN,
});

export const createPreference = async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) && req.body.items.length > 0
      ? req.body.items
      : [{
          id: "PLAN_DEFAULT",
          title: "Plan de suscripción",
          quantity: 1,
          unit_price: 0,
        }];

    const payer = req.body?.payer?.email
      ? req.body.payer
      : { email: "test_user_123456@testuser.com" };

    const origin =
      process.env.FRONTEND_URL ||
      `${req.protocol}://${req.get("host")}` ||
      "http://localhost:5173";

    // Helpers de validación de URL
    const isHttpUrl = (u) => typeof u === "string" && /^https?:\/\//i.test(u);
    const isPrivateHost = (host) =>
      /^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)$/i.test(host);
    const isPublicUrl = (u) => {
      try {
        const url = new URL(u);
        return isHttpUrl(u) && !isPrivateHost(url.hostname);
      } catch {
        return false;
      }
    };

    // Usar back_urls del cliente solo si son públicas y válidas
    let back_urls = req.body?.back_urls;
    const clientSuccess = back_urls?.success;

    if (!isPublicUrl(clientSuccess)) {
      // Construir URLs por defecto (pueden ser locales, pero sin auto_return)
      const def = new URL(origin);
      const build = (status) => {
        const u = new URL(def.toString());
        u.searchParams.set("mp_return", "1");
        u.searchParams.set("mp_status", status);
        return u.toString();
      };
      back_urls = {
        success: build("approved"),
        failure: build("failed"),
        pending: build("pending"),
      };
    }

    // Solo activar auto_return si success es pública
    const auto_return = isPublicUrl(back_urls.success) ? (req.body?.auto_return || "approved") : undefined;

    console.log("[MP] Creando preferencia:", {
      origin,
      item0: items?.[0],
      back_urls,
      auto_return
    });

    if (!process.env.ACCESS_TOKEN) {
      return res.status(500).json({
        ok: false,
        source: "server",
        message: "ACCESS_TOKEN de Mercado Pago no está configurado",
      });
    }

    const preference = new Preference(client);
    const result = await preference.create({
      body: { items, payer, back_urls, ...(auto_return ? { auto_return } : {}) },
    });

    return res.status(200).json({ id: result.id });
  } catch (error) {
    res.status(500).json({
      error: "Error al crear preferencia",
      message: error.message,
      details: error.cause,
    });
  }
};