import React, { useEffect, useState } from "react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { createPreference as createPreferenceService } from "@/services/payment.services";

export default function WalletBrick({ planInfo, userData, onPreferenceId, onPagoExitoso }) {
  const [preferenceId, setPreferenceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

  useEffect(() => {
    if (!MP_PUBLIC_KEY) {
      setError("Clave pública de Mercado Pago no configurada");
      setLoading(false);
      return;
    }
    initMercadoPago(MP_PUBLIC_KEY, { locale: "es-PE" });
  }, [MP_PUBLIC_KEY]);

  useEffect(() => {
    let alive = true;
    async function setupPreference() {
      try {
        setLoading(true);
        const priceNumber = parseFloat((planInfo?.price || "0").replace(/[^\d.]/g, "")) || 0;
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
        if (!alive) return;
        if (result?.success) {
          setPreferenceId(result.id);
          setError(null);
          if (onPreferenceId) onPreferenceId(result.id); // Notifica al padre
        } else {
          setPreferenceId(null);
          setError(result?.message || "No se pudo crear la preferencia");
        }
      } catch (err) {
        if (!alive) return;
        setError("No se pudo crear la preferencia: " + (err.message || "Error desconocido"));
      } finally {
        if (alive) setLoading(false);
      }
    }
    if (planInfo && userData) {
      setupPreference();
    } else {
      setLoading(false);
    }
    return () => { alive = false; };
    // Solo depende de los campos primitivos
  }, [
    planInfo?.plan,
    planInfo?.price,
    planInfo?.period,
    userData?.nombre,
    userData?.apellido,
    userData?.email,
    userData?.telefono,
    FRONTEND_URL
  ]);

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