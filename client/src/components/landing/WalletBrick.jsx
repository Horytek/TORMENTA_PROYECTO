import React, { useEffect, useState } from "react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { createPreference } from "@/services/payment.services";


// 🔥 IMPORTANTE: Ahora recibe planInfo y userData como props
export default function WalletButton({ planInfo, userData }) {
  const [preferenceId, setPreferenceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Usar variable de entorno para la API en Azure o local
  const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL;
  const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY;

  useEffect(() => {
  // Inicializa Mercado Pago con la clave pública desde .env
  initMercadoPago(MP_PUBLIC_KEY, {
    locale: "es-PE",
  });

    // Crea la preferencia en tu backend
    const createPreference = async () => {
      try {
        // Extraer el precio numérico del string (ej: "S/ 30" -> 30)
        const priceString = planInfo?.price || "S/ 0";
        const priceNumber = parseFloat(priceString.replace(/[^\d.]/g, '')) || 0;

        // Construir datos del pago con la información REAL del frontend
        const paymentData = {
          items: [{
            id: "PLAN_" + Date.now(),
            title: planInfo?.plan || "Plan de suscripción",
            quantity: 1,
            unit_price: priceNumber,
            description: `${planInfo?.plan || "Plan"} - ${planInfo?.period || 'Suscripción'}`
          }],
          payer: {
            name: userData?.nombre || "",
            surname: userData?.apellido || "",
            email: userData?.email || "cliente@ejemplo.com",
            phone: {
              number: userData?.telefono || ""
            }
          },
          back_urls: {
              success: `${FRONTEND_URL}/success`,
              failure: `${FRONTEND_URL}/failure`,
              pending: `${FRONTEND_URL}/pending`
          }
        };


      const result = await createPreference(paymentData);
      if (result.success) {
        setPreferenceId(result.id);
      } else {
        setError("No se pudo crear la preferencia");
      }

      } catch (err) {
        setError("No se pudo crear la preferencia");
      } finally {
        setLoading(false);
      }
    };

    createPreference();
  }, [planInfo, userData]);

  if (loading) return <p className="text-gray-400">🕐 Cargando botón de pago...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2 text-primary-text">
        💳 Pagar con Mercado Pago
      </h2>
      {preferenceId ? (
        <div id="wallet_container">
          <Wallet
            initialization={{ preferenceId }}
            customization={{
              texts: { valueProp: "smart_option" },
              visual: { buttonBackground: "default" },
            }}
          />
        </div>
      ) : (
        <p style={{ color: "orange" }}>⚠️ No se pudo obtener la preferencia.</p>
      )}
    </div>
  );
}