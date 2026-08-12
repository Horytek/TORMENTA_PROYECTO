import type { QueryClient } from "@tanstack/react-query";

/** Limpia queries admin ecommerce para no filtrar datos entre tiendas al cambiar de sesión. */
export function resetEcommerceAdminCache(qc: QueryClient) {
  qc.removeQueries({
    predicate: (q) => {
      const head = q.queryKey[0];
      return typeof head === "string" && head.startsWith("ecom-");
    },
  });
}
