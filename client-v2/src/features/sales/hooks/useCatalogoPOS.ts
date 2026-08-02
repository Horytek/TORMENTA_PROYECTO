import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { guardarCatalogo, leerCatalogo } from "@/lib/catalogoOffline";
import { catalogoConStockOffline } from "@/lib/stockOffline";
import { listarVentasPendientes, type VentaPendiente } from "@/lib/offlineOutbox";
import { getProductosVentas } from "../api/ventas";
import type { POSProduct } from "../types";

/**
 * Catálogo del POS con respaldo sin conexión.
 *
 * Online se comporta como siempre y, de paso, guarda la respuesta. Cuando no
 * hay datos de red se cae a la última foto guardada y le descuenta lo que ya
 * se vendió desde entonces, para no ofrecer dos veces la misma prenda.
 *
 * La foto se carga SIEMPRE al montar, sin esperar a que la consulta falle: con
 * `networkMode` por defecto, React Query *pausa* las consultas cuando el
 * navegador se declara offline y nunca entra en estado de error, así que
 * colgarse de `isError` dejaría la caja vacía justo en el caso que importa.
 * Mientras haya respuesta de red, manda la red.
 *
 * `esFoto` le dice a la UI que muestre de dónde salen esos números: vender
 * contra datos viejos es aceptable si la cajera sabe que lo está haciendo.
 */
export function useCatalogoPOS(selectedAlmacenId?: number | null) {
  const [foto, setFoto] = useState<{ productos: POSProduct[]; guardado_en: number } | null>(null);
  const [pendientes, setPendientes] = useState<VentaPendiente[]>([]);
  const [fotoBuscada, setFotoBuscada] = useState(false);

  const { data, isLoading } = useQuery<POSProduct[]>({
    queryKey: ["productos-ventas", selectedAlmacenId],
    queryFn: () => getProductosVentas(selectedAlmacenId ? { id_almacen: selectedAlmacenId } : undefined),
  });

  // Refrescar la foto con cada respuesta buena.
  useEffect(() => {
    if (data?.length) void guardarCatalogo(selectedAlmacenId, data);
  }, [data, selectedAlmacenId]);

  // Cargar la foto y la cola desde el arranque, pase lo que pase con la red.
  useEffect(() => {
    let vigente = true;
    setFotoBuscada(false);
    void Promise.all([leerCatalogo(selectedAlmacenId), listarVentasPendientes()]).then(
      ([guardado, cola]) => {
        if (!vigente) return;
        setFoto(guardado ? { productos: guardado.productos, guardado_en: guardado.guardado_en } : null);
        setPendientes(cola);
        setFotoBuscada(true);
      }
    );
    return () => {
      vigente = false;
    };
  }, [selectedAlmacenId]);

  const hayRed = !!data?.length;
  const usandoFoto = !hayRed && !!foto;

  const productos = useMemo(() => {
    if (hayRed) return data;
    if (!foto) return [];
    // Solo acá se descuenta: online el servidor ya devuelve el stock real.
    return catalogoConStockOffline(foto.productos, pendientes);
  }, [hayRed, data, foto, pendientes]);

  return {
    productos,
    // Con foto disponible no hay por qué mostrar el esqueleto de carga.
    isLoading: isLoading && !usandoFoto,
    esFoto: usandoFoto,
    fotoDe: usandoFoto ? foto.guardado_en : null,
    /** Ni red ni foto previa: no hay nada que vender y hay que decirlo. */
    sinDatos: !hayRed && !isLoading && fotoBuscada && !foto,
  };
}
