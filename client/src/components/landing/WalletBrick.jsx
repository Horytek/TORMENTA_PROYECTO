import React, { useEffect, useState } from "react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";

// 🔥 IMPORTANTE: Ahora recibe planInfo y userData como props
export default function WalletButton({ planInfo, userData }) {
  const [preferenceId, setPreferenceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 🧩 Inicializa Mercado Pago con tu PUBLIC_KEY
    initMercadoPago("TEST-f39262f8-b4ee-4207-a47e-06da0fb4e5b6", {
      locale: "es-PE",
    });

    // ⚙️ Crea la preferencia en tu backend
    const createPreference = async () => {
      try {
        // Extraer el precio numérico del string (ej: "S/ 30" -> 30)
        const priceString = planInfo?.price || "S/ 0";
        const priceNumber = parseFloat(priceString.replace(/[^\d.]/g, '')) || 0;
        
        console.log("📊 Datos del plan:", planInfo);
        console.log("👤 Datos del usuario:", userData);
        console.log("💰 Precio extraído:", priceNumber);
        
        // 🔥 Construir datos del pago con la información REAL del frontend
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
            success: "http://localhost:5173/success",
            failure: "http://localhost:5173/failure",
            pending: "http://localhost:5173/pending"
          }
        };

        console.log("📤 Enviando al backend:", paymentData);

        const response = await fetch("http://localhost:4000/api/create_preference", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify(paymentData) // 🔥 Envía los datos al backend
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al crear preferencia");
        }

        const data = await response.json();
        console.log("✅ Preferencia creada correctamente:", data);
        setPreferenceId(data.id);
      } catch (err) {
        console.error("❌ Error al crear preferencia:", err);
        setError("No se pudo crear la preferencia: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    createPreference();
  }, [planInfo, userData]); // 🔥 Dependencias: se ejecuta cuando cambian

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