import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";
dotenv.config();

console.log("🔑 Mercado Pago Access Token:", process.env.ACCESS_TOKEN);

const client = new MercadoPagoConfig({
  accessToken: process.env.ACCESS_TOKEN,
});

export const createPreference = async (req, res) => {
  try {
    console.log("\n=================== DEBUG INICIO ===================");
    console.log("📦 req.body completo:", JSON.stringify(req.body, null, 2));
    console.log("📝 Tipo de req.body:", typeof req.body);
    console.log("🔍 Content-Type:", req.headers['content-type']);
    console.log("====================================================\n");
    
    // Valores por defecto (solo como fallback)
    const defaultItems = [
      {
        id: "CONSULTA_001",
        title: "Consulta médica por neumonía",
        quantity: 1,
        unit_price: 100,
      },
    ];
    
    const defaultPayer = {
      email: "test_user_123456@testuser.com",
    };
    
    const defaultBackUrls = {
      success: "http://localhost:5173/success",
      failure: "http://localhost:5173/failure",
      pending: "http://localhost:5173/pending",
    };
    
    // Verificar específicamente cada campo
    console.log("🔎 Verificando datos recibidos:");
    console.log("  - req.body existe?", !!req.body);
    console.log("  - req.body.items existe?", !!req.body?.items);
    console.log("  - req.body.items es array?", Array.isArray(req.body?.items));
    console.log("  - req.body.items.length:", req.body?.items?.length);
    console.log("  - req.body.payer existe?", !!req.body?.payer);
    console.log("  - req.body.payer.email:", req.body?.payer?.email);
    
    // Usar los datos del frontend, o usar los predeterminados como fallback
    const items = (req.body && req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) 
      ? req.body.items 
      : defaultItems;
      
    const payer = (req.body && req.body.payer && req.body.payer.email) 
      ? req.body.payer 
      : defaultPayer;
      
    const back_urls = (req.body && req.body.back_urls) 
      ? req.body.back_urls 
      : defaultBackUrls;
    
    console.log("\n🎯 Datos FINALES que se usarán:");
    console.log("  Items:", items[0]?.title || "Sin título");
    console.log("  Precio:", items[0]?.unit_price || 0);
    console.log("  Email:", payer.email);
    console.log("  Nombre:", payer.name || "No proporcionado");
    console.log("  Apellido:", payer.surname || "No proporcionado");
    console.log("  Back URLs:", back_urls.success);
    
    if (items === defaultItems) {
      console.log("⚠️  ADVERTENCIA: Usando items por defecto (datos del frontend NO llegaron)");
    } else {
      console.log("✅ Usando items del frontend");
    }
    console.log("====================================================\n");
    
    // Crear la preferencia en Mercado Pago
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

    console.log("✅ Preferencia creada:", result.id);
    res.status(200).json({ id: result.id });
  } catch (error) {
    console.error("❌ Error al crear preferencia:", error);
    console.error("Detalles del error:", error.message);
    
    if (error.cause) {
      console.error("Causa del error:", error.cause);
    }
    
    res.status(500).json({ 
      error: "Error al crear preferencia", 
      message: error.message,
      details: error.cause
    });
  }
};