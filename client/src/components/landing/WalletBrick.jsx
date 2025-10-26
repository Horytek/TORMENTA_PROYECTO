import React, { useEffect, useRef, useState } from "react";
import { createPreference as createPreferenceService } from "@/services/payment.services";

export default function WalletBrick({ planInfo, userData, onPagoExitoso }) {
  const [preferenceId, setPreferenceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const brickContainerRef = useRef(null);

  const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

  // Cargar el script de Mercado Pago Bricks solo una vez
  useEffect(() => {
    if (!window.MercadoPago) {
      const script = document.createElement("script");
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Crear preferencia al montar
  useEffect(() => {
    let alive = true;
    async function setupPreference() {
      try {
        setLoading(true);

        // Detectar host público
        const host = window.location.hostname;
        const isPrivateHost =
          /^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)$/i.test(host);

        const base = new URL(window.location.href);
        base.searchParams.set("mp_return", "1");
        const buildUrl = (status) => {
          const u = new URL(base.toString());
          u.searchParams.set("mp_status", status);
          return u.toString();
        };

        const priceNumber = parseFloat((planInfo?.price || "0").replace(/[^\d.]/g, "")) || 0;

        // No enviar back_urls desde el front cuando el host es privado; el backend las construye.
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
          ...(isPrivateHost
            ? {}
            : {
                back_urls: {
                  success: buildUrl("approved"),
                  failure: buildUrl("failed"),
                  pending: buildUrl("pending"),
                },
                auto_return: "approved",
              }),
        };

        const result = await createPreferenceService(paymentData);
        if (!alive) return;
        if (result?.success) {
          setPreferenceId(result.id);
          setError(null);
        } else {
          const extra = result?.details?.cause?.[0]?.description || result?.details?.cause?.[0]?.code || "";
          setPreferenceId(null);
          setError(`${result?.message}${extra ? ` (${extra})` : ""}`);
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
  }, [planInfo, userData]);

  // Renderizar el Brick al hacer click en el botón
  const handleOpenCheckout = () => {
    if (!window.MercadoPago) {
      setError("SDK de Mercado Pago no cargado");
      return;
    }
    if (!preferenceId) {
      setError("No se pudo obtener la preferencia");
      return;
    }

    const mp = new window.MercadoPago(MP_PUBLIC_KEY, { locale: "es-PE" });

    // Checkout Pro con tu preferencia (abre modal)
    mp.checkout({
      preference: { id: preferenceId },
      autoOpen: true, // abre automáticamente el modal
    });
  };

  if (loading) return <p className="text-gray-400">🕐 Cargando botón de pago...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2 text-primary-text">💳 Pagar con Mercado Pago</h2>
      <button
        className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-secondary-color to-primary-color text-white font-semibold shadow-xl hover:scale-[1.02] transition-transform"
        onClick={handleOpenCheckout}
        disabled={!preferenceId}
      >
        Pagar ahora
      </button>
      {/* Ya no usamos Bricks aquí */}
    </div>
  );
}