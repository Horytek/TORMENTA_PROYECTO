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
      req.headers.origin ||
      "http://localhost:5173";

    const back_urls = req.body?.back_urls || {
      success: `${origin}/success`,
      failure: `${origin}/failure`,
      pending: `${origin}/pending`,
    };

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items,
        payer,
        back_urls,
      },
    });

    res.status(200).json({ id: result.id });
  } catch (error) {
    res.status(500).json({
      error: "Error al crear preferencia",
      message: error.message,
      details: error.cause,
    });
  }
};