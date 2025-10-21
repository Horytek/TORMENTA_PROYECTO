import React, { useEffect, useState } from "react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { createPreference as createPreferenceService } from "@/services/payment.services";

// 🔥 IMPORTANTE: Ahora recibe planInfo y userData como props
export default function WalletButton({ planInfo, userData }) {
  const [preferenceId, setPreferenceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

  // 1) Inicializa Mercado Pago una sola vez (cuando haya public key)
  useEffect(() => {
    if (!MP_PUBLIC_KEY) {
      setError("Clave pública de Mercado Pago no configurada");
      setLoading(false);
      return;
    }
    initMercadoPago(MP_PUBLIC_KEY, { locale: "es-PE" });
  }, [MP_PUBLIC_KEY]);

  // 2) Crea la preferencia cuando cambian los datos requeridos
  useEffect(() => {
    let alive = true;

    async function setupPreference() {
      try {
        setLoading(true);

        // Validaciones mínimas
        const priceString = planInfo?.price || "S/ 0";
        const priceNumber = parseFloat(priceString.replace(/[^\d.]/g, "")) || 0;

        const paymentData = {
          items: [
            {
              id: "PLAN_" + Date.now(),
              title: planInfo?.plan || "Plan de suscripción",
              quantity: 1,
              unit_price: priceNumber,
              description: `${planInfo?.plan || "Plan"} - ${planInfo?.period || "Suscripción"}`,
            },
          ],
          payer: {
            name: userData?.nombre || "",
            surname: userData?.apellido || "",
            email: userData?.email || "cliente@ejemplo.com",
            phone: { number: userData?.telefono || "" },
          },
          back_urls: {
            success: `${FRONTEND_URL}/success`,
            failure: `${FRONTEND_URL}/failure`,
            pending: `${FRONTEND_URL}/pending`,
          },
        };

        const result = await createPreferenceService(paymentData);

        if (result?.success) {
          setPreferenceId(result.id);
          setError(null);
        } else {
          setPreferenceId(null);
          setError(result?.message || "No se pudo crear la preferencia");
        }
      } catch (err) {
        if (!alive) return;
        // Log completo del error y la respuesta
        console.error("Error al crear preferencia:", err);
        if (err.response) {
          console.error("Respuesta del backend:", err.response.data);
          setError(
            `No se pudo crear la preferencia: ${err.response.data?.message || JSON.stringify(err.response.data)}`
          );
        } else {
          setError("No se pudo crear la preferencia: " + (err.message || "Error desconocido"));
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (planInfo && userData) {
      setupPreference();
    } else {
      setLoading(false);
    }

    return () => {
      alive = false;
    };
  }, [planInfo, userData, FRONTEND_URL]);

  if (loading) return <p className="text-gray-400">🕐 Cargando botón de pago...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2 text-primary-text">💳 Pagar con Mercado Pago</h2>
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