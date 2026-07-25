import { useEffect } from "react";
import { toast } from "sonner";
import { onAuthzDenied, DENIAL_COPY, isUserAction, type AuthzDenial } from "@/api/authzError";

/**
 * Puente entre los 403 estructurados del backend (Fase 4.1) y sonner: escucha
 * el evento global `authz:denied` que emite el interceptor de axios y muestra
 * el toast correcto según el motivo — "mejora tu plan" vs "sin permiso" vs
 * "suscripción suspendida", en vez de un error genérico. Se monta una sola vez.
 */
export function AuthzToastBridge() {
  useEffect(() => {
    return onAuthzDenied((denial: AuthzDenial) => {
      // Solo reaccionar a acciones explícitas del usuario (guardar, borrar…).
      // Un GET denegado por plan es un fetch de fondo (ej. el dashboard pide el
      // P&L de contabilidad aunque el plan no la incluya): la pantalla lo
      // maneja/oculta, no corresponde un toast global — antes spameaba en
      // cualquier página que trajera datos de un módulo fuera del plan.
      if (!isUserAction(denial.method)) return;

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

      // `id` por código: dos acciones seguidas con el mismo motivo reemplazan
      // el toast en vez de apilarse.
      if (denial.code === "ROLE_DENIED") {
        toast.warning(denial.message, {
          id: "authz-ROLE_DENIED",
          description: "Contacta a un administrador si crees que es un error.",
        });
      } else {
        toast.error(denial.message, { id: `authz-${denial.code}`, action });
      }
    });
  }, []);

  return null;
}
