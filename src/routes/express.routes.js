import { Router } from "express";
import {
    registerTenant,
    loginTenant,
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    createSale,
    getSales,
    getSaleDetails,
    getDashboardStats,
    getExpressUsers,
    createExpressUser,
    deleteExpressUser,
    loginExpressUser,
    updateExpressUser,
    updatePassword,
    getMe
} from "../controllers/express.controller.js";
import { expressAuth } from "../middlewares/expressAuthMiddleware.js";

const router = Router();

// --- Auth Routes (Public) ---
router.post("/auth/register", registerTenant);
router.post("/auth/login", loginTenant);
router.post("/subscription/verify", verifyPayment);

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
router.get("/sales", getSales);
router.get("/sales/:id", getSaleDetails);

// Subscription
import { getPlans, getSubscriptionStatus, subscribeToPlan, createRenewalPreference, verifyPayment } from "../controllers/subscription.controller.js";
import { getNotifications, markAsRead } from "../controllers/notifications.controller.js";

router.get("/subscription/plans", getPlans);
router.get("/subscription/status", getSubscriptionStatus);
router.post("/subscription/subscribe", subscribeToPlan);
// Notifications
router.get("/notifications", getNotifications);
router.put("/notifications/:id/read", markAsRead);

// Users (Employees)
router.get("/users", getExpressUsers);
router.post("/users", createExpressUser);
router.delete("/users/:id", deleteExpressUser);
router.put("/users/:id", updateExpressUser);
router.post("/users/login", loginExpressUser); // Internal login

router.get("/auth/me", expressAuth, getMe);
router.post("/auth/update-password", expressAuth, updatePassword);

export default router;
