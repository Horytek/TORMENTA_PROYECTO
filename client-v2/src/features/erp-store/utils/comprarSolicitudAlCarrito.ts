import { buyerComprarDesdeSolicitud, getStoreProduct } from "../api/erpStore";
import { addProductToCart } from "../components/vitrina/QuickAddSheet";
import { useEcommerceCartStore } from "../store/useEcommerceCartStore";
import type { StorefrontAttr, StorefrontVariante } from "../types/storefront";

/**
 * Prepara compra desde solicitud aprobada: inyecta al carrito con id_solicitud
 * (sin duplicar si ya está) y devuelve datos para navegar al checkout.
 */
export async function comprarSolicitudAlCarrito(slug: string, id_solicitud: number) {
  const cart = useEcommerceCartStore.getState();
  const existing = cart.items.find((i) => Number(i.id_solicitud) === Number(id_solicitud));

  const res = await buyerComprarDesdeSolicitud(slug, id_solicitud);
  if (!res.success || !res.data) throw new Error("No se pudo preparar la compra");

  const prodRes = await getStoreProduct(slug, res.data.id_producto, res.data.id_sucursal);
  const payload = prodRes?.data as {
    producto?: Record<string, unknown>;
    atributos?: StorefrontAttr[];
    variantes?: StorefrontVariante[];
    imagenes?: { url?: string }[];
  };
  const producto = (payload?.producto || payload) as {
    id_producto: number;
    nombre: string;
    precio: number;
    imagen_url?: string;
    disponibilidad?: { cta: { allowAddToCart: boolean } };
  };
  if (!producto?.id_producto) throw new Error("Producto no encontrado");

  const imagen =
    producto.imagen_url ||
    payload?.imagenes?.find((img) => img?.url)?.url ||
    payload?.imagenes?.[0]?.url ||
    null;

  if (existing) {
    if (!existing.imagen_url && imagen) {
      useEcommerceCartStore.setState((state) => ({
        items: state.items.map((i) =>
          Number(i.id_solicitud) === Number(id_solicitud) ? { ...i, imagen_url: imagen } : i
        ),
      }));
    }
    return { alreadyInCart: true as const, id_solicitud };
  }

  const atributos = (payload?.atributos || []) as StorefrontAttr[];
  const variantes = (payload?.variantes || []) as StorefrontVariante[];
  const selecciones: { id_atributo: number; id_valor: number | null; valor: string }[] = [];
  const snap = (res.data.attrs || {}) as Record<string, unknown>;
  for (const [nombre, valor] of Object.entries(snap)) {
    const attr = atributos.find(
      (a) => String(a.nombre || "").toLowerCase() === String(nombre).toLowerCase()
    );
    if (!attr) continue;
    const val = attr.valores?.find((v) => String(v.valor) === String(valor));
    selecciones.push({
      id_atributo: attr.id_atributo,
      id_valor: val?.id_valor ?? null,
      valor: String(valor),
    });
  }

  addProductToCart({
    producto: {
      ...producto,
      precio: res.data.precio ?? producto.precio,
      imagen_url: imagen || producto.imagen_url,
      disponibilidad: { cta: { allowAddToCart: true } },
    } as never,
    qty: res.data.cantidad,
    atributos,
    variantes,
    selecciones,
    imagen,
    id_solicitud: res.data.id_solicitud,
  });

  return {
    alreadyInCart: false as const,
    id_solicitud: res.data.id_solicitud,
    expires_at: res.data.expires_at,
  };
}
