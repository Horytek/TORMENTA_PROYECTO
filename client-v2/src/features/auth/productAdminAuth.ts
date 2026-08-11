import { loginTaxiAdmin } from "@/features/platform/api/taxi";
import { loginDeliveryAdmin } from "@/features/platform/api/delivery";
import { loginFlotasAdmin } from "@/features/platform/api/flotas";
import { loginAcademiaAdmin } from "@/features/platform/api/academia";
import { loginAgendaAdmin } from "@/features/platform/api/agenda";
import { HORYTEK_PRODUCTS } from "@/features/platform/catalog/horytekProducts";

export function adminPathForLoginMode(mode: string): string | null {
  const product = HORYTEK_PRODUCTS.find((p) => p.loginMode === mode && p.adminPath);
  return product?.adminPath ?? null;
}

export function clientPathTemplateForLoginMode(mode: string): string | null {
  const product = HORYTEK_PRODUCTS.find((p) => p.loginMode === mode && p.clientPath);
  return product?.clientPath ?? null;
}

/** Login admin de producto (JWT propio). */
export async function loginProductAdmin(
  mode: string,
  body: { slug: string; email: string; password: string }
): Promise<{ success: boolean; message?: string }> {
  switch (mode) {
    case "taxi":
      return loginTaxiAdmin(body);
    case "delivery":
      return loginDeliveryAdmin(body);
    case "flotas":
      return loginFlotasAdmin(body);
    case "academia":
      return loginAcademiaAdmin(body);
    case "agenda":
      return loginAgendaAdmin(body);
    default:
      return { success: false, message: "Este producto no tiene login admin propio." };
  }
}
