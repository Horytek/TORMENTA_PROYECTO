import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAttributes } from "@/features/content/api/content";

/**
 * Qué tipos de atributo (Talla, Color, Material…) están activos para el
 * tenant actual. Reusa `atributo.es_visible` (Configuración > Contenido) en
 * vez de un concepto nuevo: es el mismo flag por el que ya filtra
 * `getCategoryAttributes` en el backend, así que desactivar un atributo acá
 * y en el creador de variantes es siempre la misma fuente de verdad.
 *
 * No bloquea nada retroactivo: las variantes ya creadas con un atributo
 * desactivado no se tocan, esto solo decide qué ofrecer para casos nuevos.
 */
export function useAttributeVisibility() {
  const { data: attributes = [] } = useQuery({
    queryKey: ["attributes"],
    queryFn: getAttributes,
    staleTime: 5 * 60 * 1000,
  });

  const isAttributeActive = (codigo: string) => {
    const attr = attributes.find((a) => a.codigo?.toLowerCase() === codigo.toLowerCase());
    // Código no registrado en `atributo` todavía: no hay nada que ocultar, se deja pasar.
    if (!attr) return true;
    return !!attr.es_visible;
  };

  // Set memoizado: `attributes` de react-query es referencialmente estable
  // mientras no cambien los datos, así que esto no crea una instancia nueva
  // en cada render (evitaría que cualquier useMemo aguas abajo, como el de
  // `collapseVariants`, sirva de algo).
  const activeAttributeIds = useMemo(
    () => new Set(attributes.filter((a) => !!a.es_visible).map((a) => a.id_atributo)),
    [attributes]
  );

  return {
    attributes,
    isAttributeActive,
    isTallaActive: isAttributeActive("talla"),
    isColorActive: isAttributeActive("color"),
    getActiveAttributes: () => attributes.filter((a) => !!a.es_visible),
    /** `id_atributo` de los atributos activos — lo que espera `collapseVariants()` para agrupar SKUs por variante visible. */
    activeAttributeIds,
  };
}
