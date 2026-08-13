import axios from "axios";
import { buyerMe, getStorefrontToken } from "../api/ecommerce";
import { useStorefrontAuthStore } from "../store/useStorefrontAuthStore";

/**
 * Refresca el perfil buyer. Solo limpia sesión ante 401 real;
 * errores de red / 5xx no cierran la sesión.
 */
export async function refreshStorefrontSession(slug: string): Promise<"ok" | "guest" | "invalid"> {
  const token = getStorefrontToken(slug);
  if (!token) {
    const cur = useStorefrontAuthStore.getState();
    if (cur.token || cur.user) useStorefrontAuthStore.getState().clear();
    return "guest";
  }

  try {
    const res = await buyerMe(slug);
    if (res?.success && res.data?.user) {
      useStorefrontAuthStore.getState().setSession(token, res.data.user, slug);
      return "ok";
    }
    // Respuesta rara sin 401: conservar token/user existente
    return "ok";
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      useStorefrontAuthStore.getState().clear();
      return "invalid";
    }
    return "ok";
  }
}
