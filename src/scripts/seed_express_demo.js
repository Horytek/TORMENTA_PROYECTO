/**
 * Seed demo Pocket POS (express_db).
 * Idempotente: upsert tenant, refresca productos/ventas/cajero.
 *
 * Uso: npm run seed:express
 *
 * Credenciales admin:
 *   email:    demo.pocket@horytek.test
 *   password: PocketDemo2026!
 *
 * Empleado (cajero):
 *   email login: CajeroDemo@caja1
 *   password:    PocketDemo2026!
 */

import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { getExpressConnection } from "../database/express_db.js";

const BUSINESS_NAME = "Tienda Demo Pocket";
const EMAIL = "demo.pocket@horytek.test";
const PASSWORD = "PocketDemo2026!";
const CASHIER_NAME = "Cajero Demo";
const CASHIER_USER = "caja1";

/** Catálogo alineado a la escena de login (feria / calle). */
const PRODUCTS = [
  { name: "Café americano", price: 6.0, stock: 80 },
  { name: "Café con leche", price: 7.5, stock: 60 },
  { name: "Sandwich mixto", price: 9.5, stock: 40 },
  { name: "Empanada de pollo", price: 4.5, stock: 55 },
  { name: "Jugo de naranja", price: 5.0, stock: 35 },
  { name: "Agua 500ml", price: 2.5, stock: 100 },
  { name: "Gaseosa personal", price: 3.5, stock: 70 },
  { name: "Chipá (unidad)", price: 2.0, stock: 90 },
  { name: "Combo desayuno", price: 14.0, stock: 25 },
  { name: "Porción de torta", price: 8.0, stock: 20 },
];

async function ensureSchema(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS express_tenants (
      tenant_id CHAR(36) PRIMARY KEY,
      business_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS express_products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenant_id CHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      stock INT NOT NULL DEFAULT 0,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tenant (tenant_id),
      FOREIGN KEY (tenant_id) REFERENCES express_tenants(tenant_id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS express_sales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenant_id CHAR(36) NOT NULL,
      total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      payment_method VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tenant (tenant_id),
      FOREIGN KEY (tenant_id) REFERENCES express_tenants(tenant_id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS express_sale_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sale_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      FOREIGN KEY (sale_id) REFERENCES express_sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES express_products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS express_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenant_id CHAR(36) NOT NULL,
      name VARCHAR(100) NOT NULL,
      username VARCHAR(50) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin', 'cashier') DEFAULT 'cashier',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tenant_user (tenant_id),
      FOREIGN KEY (tenant_id) REFERENCES express_tenants(tenant_id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS express_plans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      duration_days INT NOT NULL,
      description VARCHAR(255)
    ) ENGINE=InnoDB
  `);

  await connection.query(`
    INSERT IGNORE INTO express_plans (id, name, price, duration_days, description) VALUES
    (1, 'Diario', 5.00, 1, 'Acceso por 24 horas'),
    (2, 'Semanal', 10.00, 7, 'Acceso por 7 días'),
    (3, 'Mensual', 30.00, 30, 'Acceso por 30 días')
  `);

  const tenantAlters = [
    "ADD COLUMN plan_id INT DEFAULT NULL",
    "ADD COLUMN subscription_end_date DATETIME DEFAULT NULL",
    "ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'trial'",
  ];
  for (const clause of tenantAlters) {
    try {
      await connection.query(`ALTER TABLE express_tenants ${clause}`);
    } catch (e) {
      if (e.code !== "ER_DUP_FIELDNAME") {
        /* ignore */
      }
    }
  }

  const userAlters = [
    "ADD COLUMN permissions JSON DEFAULT NULL",
    "ADD COLUMN status TINYINT DEFAULT 1",
  ];
  for (const clause of userAlters) {
    try {
      await connection.query(`ALTER TABLE express_users ${clause}`);
    } catch (e) {
      if (e.code !== "ER_DUP_FIELDNAME") {
        /* ignore */
      }
    }
  }
}

async function upsertTenant(connection, passwordHash) {
  const [rows] = await connection.query(
    "SELECT tenant_id FROM express_tenants WHERE email = ? LIMIT 1",
    [EMAIL]
  );

  if (rows.length) {
    const tenantId = rows[0].tenant_id;
    await connection.query(
      `UPDATE express_tenants
       SET business_name = ?,
           password_hash = ?,
           plan_id = 3,
           subscription_status = 'active',
           subscription_end_date = DATE_ADD(NOW(), INTERVAL 30 DAY)
       WHERE tenant_id = ?`,
      [BUSINESS_NAME, passwordHash, tenantId]
    );
    return { tenantId, created: false };
  }

  const tenantId = randomUUID();
  await connection.query(
    `INSERT INTO express_tenants
     (tenant_id, business_name, email, password_hash, subscription_status, plan_id, subscription_end_date)
     VALUES (?, ?, ?, ?, 'active', 3, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
    [tenantId, BUSINESS_NAME, EMAIL, passwordHash]
  );
  return { tenantId, created: true };
}

async function refreshCatalog(connection, tenantId) {
  // Borrar ventas e ítems del tenant (vía sales) y productos
  const [sales] = await connection.query(
    "SELECT id FROM express_sales WHERE tenant_id = ?",
    [tenantId]
  );
  if (sales.length) {
    const ids = sales.map((s) => s.id);
    await connection.query(
      `DELETE FROM express_sale_items WHERE sale_id IN (${ids.map(() => "?").join(",")})`,
      ids
    );
    await connection.query("DELETE FROM express_sales WHERE tenant_id = ?", [tenantId]);
  }
  await connection.query("DELETE FROM express_products WHERE tenant_id = ?", [tenantId]);

  const productIds = [];
  for (const p of PRODUCTS) {
    const [res] = await connection.query(
      "INSERT INTO express_products (tenant_id, name, price, stock, image_url) VALUES (?, ?, ?, ?, NULL)",
      [tenantId, p.name, p.price, p.stock]
    );
    productIds.push({ id: res.insertId, ...p });
  }
  return productIds;
}

async function seedSales(connection, tenantId, products) {
  const byName = Object.fromEntries(products.map((p) => [p.name, p]));

  const tickets = [
    {
      method: "Yape",
      items: [
        { name: "Café americano", qty: 2 },
        { name: "Sandwich mixto", qty: 1 },
      ],
    },
    {
      method: "Efectivo",
      items: [
        { name: "Combo desayuno", qty: 1 },
        { name: "Jugo de naranja", qty: 1 },
      ],
    },
    {
      method: "Yape",
      items: [
        { name: "Empanada de pollo", qty: 3 },
        { name: "Gaseosa personal", qty: 2 },
      ],
    },
  ];

  for (const ticket of tickets) {
    let total = 0;
    const lines = [];
    for (const line of ticket.items) {
      const prod = byName[line.name];
      if (!prod) continue;
      const lineTotal = Number(prod.price) * line.qty;
      total += lineTotal;
      lines.push({ product_id: prod.id, quantity: line.qty, price: prod.price });
    }
    if (!lines.length) continue;

    const [saleRes] = await connection.query(
      "INSERT INTO express_sales (tenant_id, total, payment_method) VALUES (?, ?, ?)",
      [tenantId, total.toFixed(2), ticket.method]
    );
    for (const line of lines) {
      await connection.query(
        "INSERT INTO express_sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
        [saleRes.insertId, line.product_id, line.quantity, line.price]
      );
    }
  }
}

async function upsertCashier(connection, tenantId, passwordHash) {
  const [rows] = await connection.query(
    "SELECT id FROM express_users WHERE tenant_id = ? AND username = ? LIMIT 1",
    [tenantId, CASHIER_USER]
  );
  if (rows.length) {
    await connection.query(
      "UPDATE express_users SET name = ?, password_hash = ?, role = 'cashier' WHERE id = ?",
      [CASHIER_NAME, passwordHash, rows[0].id]
    );
    try {
      await connection.query("UPDATE express_users SET status = 1 WHERE id = ?", [rows[0].id]);
    } catch {
      /* columna status opcional */
    }
    return;
  }
  await connection.query(
    `INSERT INTO express_users (tenant_id, name, username, password_hash, role)
     VALUES (?, ?, ?, ?, 'cashier')`,
    [tenantId, CASHIER_NAME, CASHIER_USER, passwordHash]
  );
}

async function main() {
  const connection = await getExpressConnection();
  try {
    await ensureSchema(connection);
    await connection.beginTransaction();

    const passwordHash = await bcrypt.hash(PASSWORD, 12);
    const { tenantId, created } = await upsertTenant(connection, passwordHash);
    const products = await refreshCatalog(connection, tenantId);
    await seedSales(connection, tenantId, products);
    await upsertCashier(connection, tenantId, passwordHash);

    await connection.commit();

    console.log(
      JSON.stringify(
        {
          ok: true,
          created,
          tenant_id: tenantId,
          business_name: BUSINESS_NAME,
          admin: {
            login: "/login?mode=express",
            email: EMAIL,
            password: PASSWORD,
          },
          cashier: {
            login: `${CASHIER_NAME.replace(/\s+/g, "")}@${CASHIER_USER}`,
            password: PASSWORD,
            note: "Mismo endpoint de login Express; formato Nombre@username",
          },
          products: products.length,
          sample_sale: "Café americano ×2 + Sandwich mixto (Yape) = S/ 21.50",
        },
        null,
        2
      )
    );
  } catch (e) {
    try {
      await connection.rollback();
    } catch {
      /* noop */
    }
    console.error(e.message || e);
    process.exitCode = 1;
  } finally {
    connection.release();
  }
}

main();
