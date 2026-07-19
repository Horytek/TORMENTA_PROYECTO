import { useEffect } from "react";
import { toast } from "sonner";
import { onAuthzDenied, DENIAL_COPY, type AuthzDenial } from "@/api/authzError";

/**
 * Puente entre los 403 estructurados del backend (Fase 4.1) y sonner: escucha
 * el evento global `authz:denied` que emite el interceptor de axios y muestra
 * el toast correcto según el motivo — "mejora tu plan" vs "sin permiso" vs
 * "suscripción suspendida", en vez de un error genérico. Se monta una sola vez.
 */
export function AuthzToastBridge() {
  useEffect(() => {
    return onAuthzDenied((denial: AuthzDenial) => {
      const copy = DENIAL_COPY[denial.code];
      const action = copy.cta
        ? {
            label: copy.cta,
            onClick: () => {
              // Rutas destino según el motivo (ajustar cuando existan las
              // pantallas de upgrade/facturación definitivas).
              if (denial.code === "PLAN_NOT_INCLUDED") window.location.assign("/settings/system");
              else if (denial.code === "TENANT_SUSPENDED") window.location.assign("/express/subscription");
            },
          }
        : undefined;

      if (denial.code === "ROLE_DENIED") {
        toast.warning(denial.message, { description: "Contacta a un administrador si crees que es un error." });
      } else {
        toast.error(denial.message, { action });
      }
    });
  }, []);

  return null;
}
