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
  user?: { id: number; name: string; username: string; role: string };
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

/** Respuesta de GET /express/auth/me. */
export interface ExpressMe {
  business_name?: string;
  email?: string;
  name?: string;
  username?: string;
  role?: string;
}

/** Respuesta de POST /express/subscription/verify — activa la suscripción y auto-loguea. */
export interface ExpressVerifyResult {
  success: boolean;
  message: string;
  token?: string;
  business_name?: string;
}
