import { getExpressConnection } from "../database/express_db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import { randomUUID } from "crypto";

// --- AUTH ---

export const registerTenant = async (req, res) => {
    const { business_name, email, password } = req.body;
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

        await connection.query(
            "INSERT INTO express_tenants (tenant_id, business_name, email, password_hash) VALUES (?, ?, ?, ?)",
            [tenant_id, business_name, email, password_hash]
        );

        // Auto-login
        const token = jwt.sign(
            { tenant_id, email, business_name },
            TOKEN_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({ message: "Welcome to Tormenta Express!", token, business_name });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error registering tenant." });
    } finally {
        if (connection) connection.release();
    }
};

export const loginTenant = async (req, res) => {
    const { email, password } = req.body;

    let connection;
    try {
        connection = await getExpressConnection();
        const [rows] = await connection.query("SELECT * FROM express_tenants WHERE email = ?", [email]);

        if (rows.length === 0) return res.status(401).json({ message: "Invalid credentials." });

        const tenant = rows[0];
        const isMatch = await bcrypt.compare(password, tenant.password_hash);

        if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

        const token = jwt.sign(
            { tenant_id: tenant.tenant_id, email: tenant.email, business_name: tenant.business_name },
            TOKEN_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ token, business_name: tenant.business_name });
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

        const [saleResult] = await connection.query(
            "INSERT INTO express_sales (tenant_id, total, payment_method) VALUES (?, ?, ?)",
            [tenantId, total, payment_method || 'Efectivo']
        );
        const saleId = saleResult.insertId;

        for (const item of cart) {
            await connection.query(
                "INSERT INTO express_sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
                [saleId, item.product_id, item.quantity, item.price]
            );

            // If product_id is valid (not a quick sale item with id=0 or null if implemented), update stock
            if (item.product_id) {
                await connection.query(
                    "UPDATE express_products SET stock = stock - ? WHERE id = ? AND tenant_id = ?",
                    [item.quantity, item.product_id, tenantId]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ message: "Sale recorded", saleId });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ message: "Error processing sale." });
    } finally {
        if (connection) connection.release();
    }
};

export const getDashboardStats = async (req, res) => {
    const tenantId = req.tenantId;
    let connection;
    try {
        connection = await getExpressConnection();

        // 1. Today's Sales
        const [today] = await connection.query(`
            SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count 
            FROM express_sales 
            WHERE tenant_id = ? AND DATE(created_at) = CURDATE()
        `, [tenantId]);

        // 2. Recent Transactions (Limit 5)
        const [recentSales] = await connection.query(`
            SELECT id, total, payment_method, DATE_FORMAT(created_at, '%H:%i') as time 
            FROM express_sales 
            WHERE tenant_id = ? 
            ORDER BY created_at DESC 
            LIMIT 5
        `, [tenantId]);

        // 3. Low Stock Alert (Limit 3) - Threshold < 5
        const [lowStock] = await connection.query(`
            SELECT name, stock 
            FROM express_products 
            WHERE tenant_id = ? AND stock < 5 
            ORDER BY stock ASC 
            LIMIT 3
        `, [tenantId]);

        // 4. Weekly Sales Chart (Last 7 Days)
        const [weeklySales] = await connection.query(`
            SELECT DATE_FORMAT(created_at, '%d/%m') as date, SUM(total) as total, COUNT(*) as count
            FROM express_sales
            WHERE tenant_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE_FORMAT(created_at, '%d/%m')
            ORDER BY MIN(created_at) ASC
        `, [tenantId]);

        // 5. Top Selling Product (All Time)
        const [topProduct] = await connection.query(`
            SELECT p.name, SUM(i.quantity) as sold
            FROM express_sale_items i
            JOIN express_products p ON i.product_id = p.id
            JOIN express_sales s ON i.sale_id = s.id
            WHERE s.tenant_id = ?
            GROUP BY i.product_id, p.name
            ORDER BY sold DESC
            LIMIT 1
        `, [tenantId]);

        res.json({
            todayTotal: today[0].total,
            todayCount: today[0].count,
            recentSales,
            lowStock,
            weeklySales,
            topProduct: topProduct[0] || null
        });
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
        const [users] = await connection.query("SELECT id, name, username, role, created_at FROM express_users WHERE tenant_id = ?", [tenantId]);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

export const createExpressUser = async (req, res) => {
    const tenantId = req.tenantId;
    const { name, username, password, role } = req.body;

    if (!name || !username || !password) return res.status(400).json({ message: "Fields required." });

    let connection;
    try {
        connection = await getExpressConnection();
        const password_hash = await bcrypt.hash(password, 10);
        await connection.query(
            "INSERT INTO express_users (tenant_id, name, username, password_hash, role) VALUES (?, ?, ?, ?, ?)",
            [tenantId, name, username, password_hash, role || 'cashier']
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
