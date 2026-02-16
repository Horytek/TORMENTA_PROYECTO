import { getExpressConnection } from "../database/express_db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import { randomUUID } from "crypto";

// --- AUTH ---

export const registerTenant = async (req, res) => {
    const { business_name, email, password, plan_id } = req.body;
    if (!business_name || !email || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    let connection;
    try {
        connection = await getExpressConnection();

        // Check if email or business name exists
        const [existing] = await connection.query(
            "SELECT email, business_name FROM express_tenants WHERE email = ? OR business_name = ?",
            [email, business_name]
        );

        if (existing.length > 0) {
            if (existing[0].email === email) {
                return res.status(400).json({ message: "Email already registered." });
            }
            if (existing[0].business_name === business_name) {
                return res.status(400).json({ message: "Business Name already registered." });
            }
        }

        const password_hash = await bcrypt.hash(password, 10);
        const tenant_id = randomUUID();

        // Set subscription_status to 'pending' and DO NOT return token
        // Save plan_id if provided
        await connection.query(
            "INSERT INTO express_tenants (tenant_id, business_name, email, password_hash, subscription_status, plan_id) VALUES (?, ?, ?, ?, 'pending', ?)",
            [tenant_id, business_name, email, password_hash, plan_id || null]
        );

        res.status(201).json({ message: "Account created. Please complete payment to activate.", business_name });
    } catch (error) {
        console.error("REGISTRATION ERROR:", error);
        try {
            const fs = await import('fs');
            fs.writeFileSync('registration_error.log', JSON.stringify({
                message: error.message,
                stack: error.stack,
                code: error.code,
                sql: error.sql,
                sqlMessage: error.sqlMessage
            }, null, 2));
        } catch (logErr) {
            console.error("Failed to write log", logErr);
        }
        res.status(500).json({ message: "Error registering tenant.", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

export const loginTenant = async (req, res) => {
    const { email, password } = req.body;

    let connection;
    try {
        connection = await getExpressConnection();

        // 1. Try Tenant Login (Admin)
        const [tenants] = await connection.query("SELECT * FROM express_tenants WHERE email = ?", [email]);

        if (tenants.length > 0) {
            const tenant = tenants[0];
            const isMatch = await bcrypt.compare(password, tenant.password_hash);
            if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

            // Check subscription status
            if (tenant.subscription_status === 'pending') {
                return res.status(403).json({
                    error: 'SUBSCRIPTION_PENDING',
                    message: "Tu cuenta está pendiente de activación. Por favor completa el pago para acceder.",
                    tenant_id: tenant.tenant_id,
                    business_name: tenant.business_name
                });
            }

            if (tenant.subscription_status === 'expired') {
                return res.status(403).json({
                    error: 'SUBSCRIPTION_EXPIRED',
                    message: "Tu suscripción ha expirado. Por favor, renueva tu plan para continuar usando Pocket POS.",
                    tenant_id: tenant.tenant_id,
                    business_name: tenant.business_name
                });
            }

            // FIRST LOGIN CHECK:
            // If active but no end date (First time after payment), set it from created_at + plan duration.
            // Default 30 days if no plan specific logic here (or fetch plan duration).
            // For now, mirroring verifyPayment logic: 
            // Weekly/Daily plans set plan_id. We can fetch plan days if needed, or assume 30 for safety if plan_id is 3. 
            // Simpler: Just set it to created_at + 30 days as requested for "First Time".
            // Note: If plan is Diario (1) or Semanal (2), 30 days might be wrong?
            // User asked: "usando la fecha de creación... Y cuando renueve... se actualice"
            // Let's rely on the plan_id to determine duration if possible, or default to 30.
            if (tenant.subscription_status === 'active' && !tenant.subscription_end_date) {
                let duration = 30;
                if (tenant.plan_id === 1) duration = 1;
                if (tenant.plan_id === 2) duration = 7;

                await connection.query(
                    "UPDATE express_tenants SET subscription_end_date = DATE_ADD(created_at, INTERVAL ? DAY) WHERE tenant_id = ?",
                    [duration, tenant.tenant_id]
                );
            }

            const token = jwt.sign(
                { tenant_id: tenant.tenant_id, email: tenant.email, business_name: tenant.business_name, role: 'admin' },
                TOKEN_SECRET,
                { expiresIn: "7d" }
            );

            return res.json({ token, business_name: tenant.business_name, email: tenant.email, role: 'admin' });
        }

        // 2. Try Employee Login (Name@Username)
        if (email.includes('@')) {
            const parts = email.split('@');
            if (parts.length === 2) {
                const [namePart, usernamePart] = parts;
                // Search user. Note: Name in DB might have spaces, but login uses stripped name.
                // We compare REPLACE(name, ' ', '')
                const [users] = await connection.query(
                    "SELECT * FROM express_users WHERE REPLACE(name, ' ', '') = ? AND username = ?",
                    [namePart, usernamePart]
                );

                if (users.length > 0) {
                    const user = users[0];
                    const isMatch = await bcrypt.compare(password, user.password_hash);
                    if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

                    // Check if user is active
                    if (user.status === 0) {
                        return res.status(403).json({
                            error: 'USER_INACTIVE',
                            message: "Tu cuenta ha sido desactivada. Contacta al administrador de tu negocio."
                        });
                    }

                    // Get tenant info and check subscription
                    const [tenantRows] = await connection.query(
                        "SELECT business_name, subscription_status FROM express_tenants WHERE tenant_id = ?",
                        [user.tenant_id]
                    );
                    const tenant = tenantRows[0];
                    const businessName = tenant?.business_name || "Express Business";

                    // Check subscription status
                    if (tenant?.subscription_status === 'pending') {
                        return res.status(403).json({
                            error: 'SUBSCRIPTION_PENDING',
                            message: "La cuenta principal del negocio está pendiente de pago.",
                            business_name: businessName
                        });
                    }

                    if (tenant?.subscription_status === 'expired') {
                        return res.status(403).json({
                            error: 'SUBSCRIPTION_EXPIRED',
                            message: "La suscripción de tu negocio ha expirado. El administrador debe renovar el plan.",
                            business_name: businessName
                        });
                    }

                    const token = jwt.sign(
                        { tenant_id: user.tenant_id, user_id: user.id, username: user.username, role: user.role || 'cashier' },
                        TOKEN_SECRET,
                        { expiresIn: "1d" }
                    );

                    return res.json({
                        token,
                        user: {
                            id: user.id,
                            name: user.name,
                            role: user.role,
                            username: user.username,
                            permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions
                        },
                        business_name: businessName
                    });
                }
            }
        }

        return res.status(401).json({ message: "Invalid credentials." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    } finally {
        if (connection) connection.release();
    }
};

// --- PRODUCTS ---

export const getProducts = async (req, res) => {
    const tenantId = req.tenantId;
    let connection;
    try {
        connection = await getExpressConnection();
        const [products] = await connection.query(
            "SELECT * FROM express_products WHERE tenant_id = ? ORDER BY name ASC",
            [tenantId]
        );
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

export const createProduct = async (req, res) => {
    const tenantId = req.tenantId;
    const { name, price, stock, image_url } = req.body;

    if (!name || !price) return res.status(400).json({ message: "Name and price are required." });

    let connection;
    try {
        connection = await getExpressConnection();
        await connection.query(
            "INSERT INTO express_products (tenant_id, name, price, stock, image_url) VALUES (?, ?, ?, ?, ?)",
            [tenantId, name, price, stock || 0, image_url || null]
        );
        res.status(201).json({ message: "Product created." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating product." });
    } finally {
        if (connection) connection.release();
    }
};

export const updateProduct = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { name, price, stock, image_url } = req.body;

    let connection;
    try {
        connection = await getExpressConnection();
        await connection.query(
            "UPDATE express_products SET name=?, price=?, stock=?, image_url=? WHERE id=? AND tenant_id=?",
            [name, price, stock, image_url, id, tenantId]
        );
        res.json({ message: "Product updated." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

export const deleteProduct = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    let connection;
    try {
        connection = await getExpressConnection();
        await connection.query("DELETE FROM express_products WHERE id=? AND tenant_id=?", [id, tenantId]);
        res.json({ message: "Product deleted." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (connection) connection.release();
    }
}

// --- SALES ---

export const createSale = async (req, res) => {
    const tenantId = req.tenantId;
    const { cart, payment_method } = req.body; // cart: [{product_id, quantity, price}]

    if (!cart || cart.length === 0) return res.status(400).json({ message: "Cart empty" });

    let connection;
    try {
        connection = await getExpressConnection();
        await connection.beginTransaction();

        const total = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);

        // 1. Create Sale Record
        const [saleResult] = await connection.query(
            "INSERT INTO express_sales (tenant_id, total, payment_method) VALUES (?, ?, ?)",
            [tenantId, total, payment_method || 'Efectivo']
        );
        const saleId = saleResult.insertId;

        for (const item of cart) {
            // 2. Validate Stock before selling
            if (item.product_id) {
                const [products] = await connection.query("SELECT stock, name FROM express_products WHERE id = ? AND tenant_id = ?", [item.product_id, tenantId]);
                if (products.length === 0) throw new Error(`Product ${item.product_id} not found`);

                const currentStock = products[0].stock;
                if (currentStock < item.quantity) {
                    throw new Error(`Insufficient stock for ${products[0].name}. Available: ${currentStock}`);
                }

                // 3. Insert Item
                await connection.query(
                    "INSERT INTO express_sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
                    [saleId, item.product_id, item.quantity, item.price]
                );

                // 4. Deduct Stock
                await connection.query(
                    "UPDATE express_products SET stock = stock - ? WHERE id = ? AND tenant_id = ?",
                    [item.quantity, item.product_id, tenantId]
                );

                // 5. Check Low Stock & Notify
                const newStock = currentStock - item.quantity;
                if (newStock < 5) {
                    await connection.query(
                        "INSERT INTO express_notifications (tenant_id, type, message) VALUES (?, ?, ?)",
                        [tenantId, 'stock', `Stock bajo: ${products[0].name} items restantes: ${newStock}`]
                    );
                }
            }
        }

        await connection.commit();
        res.status(201).json({ message: "Sale recorded", saleId });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ message: error.message || "Error processing sale." });
    } finally {
        if (connection) connection.release();
    }
};

export const getSales = async (req, res) => {
    const tenantId = req.tenantId;
    let connection;
    try {
        connection = await getExpressConnection();
        const [sales] = await connection.query(
            "SELECT id, total, payment_method, created_at FROM express_sales WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 50",
            [tenantId]
        );
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (connection) connection.release();
    }
};



export const getSaleDetails = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    let connection;
    try {
        connection = await getExpressConnection();
        // Verify sale belongs to tenant
        const [sale] = await connection.query("SELECT id, total, created_at, payment_method FROM express_sales WHERE id = ? AND tenant_id = ?", [id, tenantId]);

        if (sale.length === 0) return res.status(404).json({ message: "Sale not found" });

        // Get Items
        const [items] = await connection.query(`
            SELECT i.quantity, i.price, p.name 
            FROM express_sale_items i
            JOIN express_products p ON i.product_id = p.id
            WHERE i.sale_id = ?
        `, [id]);

        res.json({ ...sale[0], items });
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// Simple in-memory cache
let statsCache = {
    data: null,
    timestamp: 0,
    tenantId: null
};

export const getDashboardStats = async (req, res) => {
    const tenantId = req.tenantId;

    // Return cached data if valid (60 seconds)
    if (statsCache.data && statsCache.tenantId === tenantId && (Date.now() - statsCache.timestamp < 60000)) {
        return res.json(statsCache.data);
    }

    let connection;
    try {
        connection = await getExpressConnection();

        // Execute all independent queries in parallel
        const [
            [today],
            [recentSales],
            [lowStock],
            [weeklySales],
            [topProduct]
        ] = await Promise.all([
            // 1. Today's Sales
            connection.query(`
                SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count 
                FROM express_sales 
                WHERE tenant_id = ? AND DATE(created_at) = CURDATE()
            `, [tenantId]),

            // 2. Recent Transactions (Limit 5)
            connection.query(`
                SELECT id, total, payment_method, DATE_FORMAT(created_at, '%H:%i') as time 
                FROM express_sales 
                WHERE tenant_id = ? 
                ORDER BY created_at DESC 
                LIMIT 5
            `, [tenantId]),

            // 3. Low Stock Alert (Limit 3) - Threshold < 5
            connection.query(`
                SELECT name, stock 
                FROM express_products 
                WHERE tenant_id = ? AND stock < 5 
                ORDER BY stock ASC 
                LIMIT 3
            `, [tenantId]),

            // 4. Weekly Sales Chart (Last 7 Days)
            connection.query(`
                SELECT DATE_FORMAT(created_at, '%d/%m') as date, SUM(total) as total, COUNT(*) as count
                FROM express_sales
                WHERE tenant_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY DATE_FORMAT(created_at, '%d/%m')
                ORDER BY MIN(created_at) ASC
            `, [tenantId]),

            // 5. Top Selling Product (All Time)
            connection.query(`
                SELECT p.name, SUM(i.quantity) as sold
                FROM express_sale_items i
                JOIN express_products p ON i.product_id = p.id
                JOIN express_sales s ON i.sale_id = s.id
                WHERE s.tenant_id = ?
                GROUP BY i.product_id, p.name
                ORDER BY sold DESC
                LIMIT 1
            `, [tenantId])
        ]);

        const result = {
            todayTotal: today[0].total,
            todayCount: today[0].count,
            recentSales,
            lowStock,
            weeklySales,
            topProduct: topProduct[0] || null
        };

        // Update Cache
        statsCache = {
            data: result,
            timestamp: Date.now(),
            tenantId: tenantId
        };

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (connection) connection.release();
    }
}

// --- USERS MANAGEMENT ---

export const getExpressUsers = async (req, res) => {
    const tenantId = req.tenantId;
    let connection;
    try {
        connection = await getExpressConnection();
        const [users] = await connection.query("SELECT id, name, username, role, permissions, status, created_at FROM express_users WHERE tenant_id = ?", [tenantId]);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

export const createExpressUser = async (req, res) => {
    const tenantId = req.tenantId;
    const { name, username, password, role, permissions, status } = req.body;

    if (!name || !username || !password) return res.status(400).json({ message: "Fields required." });

    let connection;
    try {
        connection = await getExpressConnection();
        const password_hash = await bcrypt.hash(password, 10);

        // Handle permissions JSON
        const perms = permissions ? JSON.stringify(permissions) : null;
        const userStatus = status !== undefined ? status : 1; // Default to Active

        await connection.query(
            "INSERT INTO express_users (tenant_id, name, username, password_hash, role, permissions, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [tenantId, name, username, password_hash, role || 'cashier', perms, userStatus]
        );
        res.status(201).json({ message: "User created." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

export const deleteExpressUser = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    let connection;
    try {
        connection = await getExpressConnection();
        await connection.query("DELETE FROM express_users WHERE id=? AND tenant_id=?", [id, tenantId]);
        res.json({ message: "User deleted." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

export const updateExpressUser = async (req, res) => {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { name, username, password, role, permissions, status } = req.body;

    let connection;
    try {
        connection = await getExpressConnection();

        // Build update query dynamically
        let query = "UPDATE express_users SET name=?, username=?, role=?, permissions=?, status=?";
        let params = [name, username, role, permissions ? JSON.stringify(permissions) : null, status !== undefined ? status : 1];

        if (password && password.length >= 6) {
            const hash = await bcrypt.hash(password, 10);
            query += ", password_hash=?";
            params.push(hash);
        }

        query += " WHERE id=? AND tenant_id=?";
        params.push(id, tenantId);

        await connection.query(query, params);
        res.json({ message: "User updated." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating user." });
    } finally {
        if (connection) connection.release();
    }
};

export const loginExpressUser = async (req, res) => {
    const { tenant_id, username, password } = req.body;
    let connection;
    try {
        connection = await getExpressConnection();
        const [users] = await connection.query("SELECT * FROM express_users WHERE tenant_id = ? AND username = ?", [tenant_id, username]);
        if (users.length === 0) return res.status(401).json({ message: "Invalid user." });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: "Invalid password." });

        const token = jwt.sign(
            { tenant_id, user_id: user.id, username: user.username, role: user.role },
            TOKEN_SECRET,
            { expiresIn: "1d" }
        );

        res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// --- ME ---

export const getMe = async (req, res) => {
    // req.expressUser is populated by middleware if token has user_id
    // req.tenantId is always populated

    let connection;
    try {
        connection = await getExpressConnection();

        // If it's an employee (User)
        if (req.expressUser && req.expressUser.user_id) {
            const [users] = await connection.query("SELECT id, name, username, role, permissions FROM express_users WHERE id = ? AND tenant_id = ?", [req.expressUser.user_id, req.tenantId]);
            if (users.length > 0) {
                const user = users[0];
                return res.json({
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    role: user.role,
                    permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions
                });
            }
        }

        // Default: Admin (Tenant) - Get actual business info
        const [tenants] = await connection.query(
            "SELECT business_name, email FROM express_tenants WHERE tenant_id = ?",
            [req.tenantId]
        );

        if (tenants.length > 0) {
            const tenant = tenants[0];
            return res.json({
                id: req.tenantId,
                name: tenant.business_name,
                email: tenant.email,
                role: 'admin',
                permissions: { sales: true, inventory: true }
            });
        }

        // Fallback if tenant not found
        return res.json({
            id: req.tenantId,
            name: "Mi Negocio",
            role: 'admin',
            permissions: { sales: true, inventory: true }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error fetching user details" });
    } finally {
        if (connection) connection.release();
    }
};

export const updatePassword = async (req, res) => {
    const { password } = req.body;
    const tenantId = req.tenantId;

    if (!password || password.length < 6) {
        return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
    }

    let connection;
    try {
        const hash = await bcrypt.hash(password, 10);
        connection = await getExpressConnection();

        // Check if it's an employee updating their own password
        if (req.expressUser && req.expressUser.user_id) {
            await connection.query(
                "UPDATE express_users SET password_hash = ? WHERE id = ? AND tenant_id = ?",
                [hash, req.expressUser.user_id, tenantId]
            );
        } else {
            // It's the Admin/Tenant
            await connection.query(
                "UPDATE express_tenants SET password_hash = ? WHERE tenant_id = ?",
                [hash, tenantId]
            );
        }

        res.json({ message: "Contraseña actualizada correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al actualizar contraseña" });
    } finally {
        if (connection) connection.release();
    }
};
