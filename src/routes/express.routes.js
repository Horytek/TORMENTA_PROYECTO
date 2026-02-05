import { Router } from "express";
import {
    registerTenant,
    loginTenant,
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    createSale,
    getDashboardStats,
    getExpressUsers,
    createExpressUser,
    deleteExpressUser,
    loginExpressUser
} from "../controllers/express.controller.js";
import { expressAuth } from "../middlewares/expressAuthMiddleware.js";

const router = Router();

// --- Auth Routes (Public) ---
router.post("/auth/register", registerTenant);
router.post("/auth/login", loginTenant);

// --- Protected Routes ---
// Apply middleware to all routes below
router.use(expressAuth);

// Dashboard
router.get("/dashboard", getDashboardStats);

// Products
router.get("/products", getProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

// Sales
router.post("/sales", createSale);

// Users (Employees)
router.get("/users", getExpressUsers);
router.post("/users", createExpressUser);
router.delete("/users/:id", deleteExpressUser);
router.post("/users/login", loginExpressUser); // Internal login

export default router;
