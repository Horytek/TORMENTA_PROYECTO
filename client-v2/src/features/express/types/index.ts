export interface ExpressLoginInput {
  email: string;
  password: string;
}

export interface ExpressRegisterInput {
  business_name: string;
  email: string;
  password: string;
}

/** Respuesta de POST /express/auth/login (admin de tenant o empleado). */
export interface ExpressLoginResult {
  token?: string;
  business_name?: string;
  email?: string;
  role?: string;
  user?: { id: number; name: string; username: string; role: string; permissions?: ExpressPermissions };
}

/** Respuesta de POST /express/auth/register — nunca incluye token: la cuenta queda "pending" hasta completar el pago. */
export interface ExpressRegisterResult {
  message: string;
  business_name: string;
}

export interface ExpressApiError {
  error?: "SUBSCRIPTION_PENDING" | "SUBSCRIPTION_EXPIRED" | "USER_INACTIVE";
  message: string;
  business_name?: string;
  tenant_id?: string;
}

export interface ExpressPermissions {
  sales: boolean;
  inventory: boolean;
}

/** Respuesta real de GET /express/auth/me (admin o empleado). */
export interface ExpressMe {
  id: number | string;
  name: string;
  email?: string;
  username?: string;
  role: "admin" | "cashier";
  permissions: ExpressPermissions;
}

/** Respuesta de POST /express/subscription/verify — activa la suscripción y auto-loguea. */
export interface ExpressVerifyResult {
  success: boolean;
  message: string;
  token?: string;
  business_name?: string;
}

// ── Productos ────────────────────────────────────────────────────
export interface ExpressProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  image_url?: string | null;
}

export interface ExpressProductInput {
  name: string;
  price: number;
  stock?: number;
  image_url?: string | null;
}

// ── Carrito / ventas ─────────────────────────────────────────────
export interface ExpressCartLine {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

export interface ExpressSalePayload {
  cart: { product_id: number; quantity: number; price: number }[];
  payment_method: string;
}

export interface ExpressSaleSummary {
  id: number;
  total: number;
  payment_method: string;
  created_at: string;
}

export interface ExpressSaleDetail extends ExpressSaleSummary {
  items: { quantity: number; price: number; name: string }[];
}

// ── Dashboard ────────────────────────────────────────────────────
export interface ExpressDashboardStats {
  todayTotal: number;
  todayCount: number;
  recentSales: { id: number; total: number; payment_method: string; time: string }[];
  lowStock: { name: string; stock: number }[];
  weeklySales: { date: string; total: number; count: number }[];
  topProduct: { name: string; sold: number } | null;
}

// ── Usuarios (empleados) ─────────────────────────────────────────
export interface ExpressUser {
  id: number;
  name: string;
  username: string;
  role: "admin" | "cashier";
  permissions: ExpressPermissions;
  status: number;
  created_at: string;
}

export interface ExpressUserInput {
  name: string;
  username: string;
  password?: string;
  role?: string;
  permissions: ExpressPermissions;
  status: number;
}

// ── Suscripción ──────────────────────────────────────────────────
export interface ExpressPlan {
  id: number;
  name: string;
  price: number;
  duration_days: number;
}

export interface ExpressSubscriptionStatus {
  status: "active" | "expired" | "pending";
  plan: string | null;
  plan_id: number | null;
  daysRemaining: number;
  canRenew: boolean;
}

// ── Notificaciones ───────────────────────────────────────────────
export interface ExpressNotification {
  id: number;
  type: string;
  message: string;
  read_status: number;
  created_at: string;
}

export interface ExpressNotificationsResult {
  notifications: ExpressNotification[];
  unreadCount: number;
}
