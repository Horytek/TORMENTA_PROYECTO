import axios from "axios";
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
          unit_price: 30,
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

    const notification_url =
      process.env.MP_NOTIFICATION_URL ||
      "https://horytek-auc6e6d2c0efg5at.westus3-01.azurewebsites.net/api/payment/webhook?source_news=webhooks"; // Cambia por tu dominio real

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items,
        payer,
        back_urls,
        notification_url, 
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

export const paymentWebhook = async (req, res) => {
  try {
    const paymentId = req.body?.data?.id || req.query?.id;
    if (!paymentId) return res.status(200).send("ok");

    // Consulta el pago en Mercado Pago
    const { data: payment } = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${process.env.ACCESS_TOKEN}` } }
    );
    if (!payment || payment.status !== "approved") return res.status(200).send("ok");

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(200).send("ok");
  }
};