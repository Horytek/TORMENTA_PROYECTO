import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { FRONTEND_URL } from "../../config.js";

function mpClient() {
  const token = process.env.ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("ACCESS_TOKEN de Mercado Pago no configurado");
  return new MercadoPagoConfig({ accessToken: token });
}

function webhookBase() {
  return (process.env.WEBHOOK_BASE_URL || process.env.HOST_API || "http://localhost:4000").replace(
    /\/+$/,
    ""
  );
}

/**
 * Crea preferencia MP para un pedido Atelier.
 * external_reference = atelier_order:{id_order}
 */
export async function createAtelierCheckout({
  id_order,
  title,
  amount,
  payer_email,
}) {
  const client = mpClient();
  const preference = new Preference(client);
  const front = (FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
  const body = {
    items: [
      {
        id: `atelier-${id_order}`,
        title: title.slice(0, 120),
        quantity: 1,
        unit_price: Number(amount),
        currency_id: "PEN",
      },
    ],
    payer: payer_email ? { email: payer_email } : undefined,
    external_reference: `atelier_order:${id_order}`,
    notification_url: `${webhookBase()}/api/atelier/payments/webhook`,
    back_urls: {
      success: `${front}/atelier/cliente/pedidos/${id_order}?pay=ok`,
      failure: `${front}/atelier/cliente/pedidos/${id_order}?pay=fail`,
      pending: `${front}/atelier/cliente/pedidos/${id_order}?pay=pending`,
    },
    auto_return: "approved",
  };
  const result = await preference.create({ body });
  return {
    preference_id: result.id,
    init_point: result.init_point || result.sandbox_init_point,
  };
}

export async function fetchMpPayment(paymentId) {
  const client = mpClient();
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}

/** Extrae id_order desde external_reference. */
export function parseAtelierExternalRef(ref) {
  if (!ref || typeof ref !== "string") return null;
  const m = ref.match(/^atelier_order:(\d+)$/);
  return m ? Number(m[1]) : null;
}
