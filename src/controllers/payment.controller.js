import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";
dotenv.config();

const client = new MercadoPagoConfig({
  accessToken: process.env.ACCESS_TOKEN,
});

export const createPreference = async (req, res) => {
  try {
    // Validación de datos recibidos
    const items = Array.isArray(req.body?.items) && req.body.items.length > 0
      ? req.body.items
      : [{
          id: "CONSULTA_001",
          title: "Consulta médica por neumonía",
          quantity: 1,
          unit_price: 100,
        }];

    const payer = req.body?.payer?.email
      ? req.body.payer
      : { email: "test_user_123456@testuser.com" };

    const back_urls = req.body?.back_urls
      ? req.body.back_urls
      : {
          success: process.env.FRONTEND_URL
            ? `${process.env.FRONTEND_URL}/success`
            : "http://localhost:5173/success",
          failure: process.env.FRONTEND_URL
            ? `${process.env.FRONTEND_URL}/failure`
            : "http://localhost:5173/failure",
          pending: process.env.FRONTEND_URL
            ? `${process.env.FRONTEND_URL}/pending`
            : "http://localhost:5173/pending",
        };

    // Crear preferencia Mercado Pago
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items,
        payer,
        back_urls,
        metadata: {
          user_email: payer.email,
          user_name: payer.name || "",
          user_surname: payer.surname || "",
          plan_name: items[0]?.title || ""
        }
      },
    });

    res.status(200).json({ id: result.id });
  } catch (error) {
    res.status(500).json({
      error: "Error al crear preferencia",
      message: error.message,
      details: error.cause
    });
  }
};