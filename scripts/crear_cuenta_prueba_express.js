import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { getExpressConnection } from "../src/database/express_db.js";

/**
 * Cuenta de prueba para Pocket POS (modo Express): crea un tenant ya
 * `active` (sin pasar por MercadoPago) para poder loguearse y probar el
 * flujo. Solo toca la fila de ESTE tenant — a diferencia de
 * force_activate_subscription.js, que activa TODOS los tenants sin filtro.
 *
 * Uso: node scripts/crear_cuenta_prueba_express.js
 */

const BUSINESS_NAME = "Tienda Demo Pocket";
const EMAIL = "demo.pocket@horytek.test";
const PASSWORD = "PocketDemo2026!";

const main = async () => {
  const connection = await getExpressConnection();
  try {
    const [existentes] = await connection.query(
      "SELECT tenant_id, subscription_status FROM express_tenants WHERE email = ?",
      [EMAIL]
    );
    if (existentes.length > 0) {
      console.log(`[omitido] Ya existe un tenant con email ${EMAIL} (estado: ${existentes[0].subscription_status}).`);
      console.log(`Credenciales:\n  email: ${EMAIL}\n  password: ${PASSWORD}`);
      return;
    }

    const tenant_id = randomUUID();
    const password_hash = await bcrypt.hash(PASSWORD, 10);

    await connection.query(
      `INSERT INTO express_tenants
       (tenant_id, business_name, email, password_hash, subscription_status, plan_id, subscription_end_date)
       VALUES (?, ?, ?, ?, 'active', 3, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
      [tenant_id, BUSINESS_NAME, EMAIL, password_hash]
    );

    console.log("[creado] Tenant de prueba activo:");
    console.log(`  business_name: ${BUSINESS_NAME}`);
    console.log(`  email: ${EMAIL}`);
    console.log(`  password: ${PASSWORD}`);
    console.log(`  tenant_id: ${tenant_id}`);
  } finally {
    connection.release();
    process.exit(0);
  }
};

main().catch((error) => {
  console.error("Error creando cuenta de prueba:", error.message);
  process.exit(1);
});
