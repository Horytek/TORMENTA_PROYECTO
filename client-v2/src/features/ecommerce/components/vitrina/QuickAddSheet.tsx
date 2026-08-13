import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getStoreProduct, getStore } from "../../api/ecommerce";
import { useEcommerceCartStore, type AttrSeleccion } from "../../store/useEcommerceCartStore";
import { useBranchStore } from "../../store/useBranchStore";
import {
  AttrPicker,
  attrsLabel,
  requiredAttrsIncomplete,
  resolveVarianteId,
  selectableAttrs,
} from "./AttrPicker";
import type { StorefrontAttr, StorefrontVariante, StoreProducto, StoreTienda } from "../../types/storefront";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ConsultarWhatsAppButton } from "../../design/ConsultarWhatsAppButton";
import { AvailabilityStatus } from "../../design/AvailabilityStatus";

export function addProductToCart(opts: {
  producto: StoreProducto;
  qty?: number;
  atributos: StorefrontAttr[];
  variantes: StorefrontVariante[];
  selecciones: AttrSeleccion[];
  imagen?: string | null;
  id_solicitud?: number | null;
}) {
  const { producto, qty = 1, atributos, variantes, selecciones, imagen, id_solicitud } = opts;
  if (!id_solicitud && producto.disponibilidad && !producto.disponibilidad.cta.allowAddToCart) {
    throw new Error("Antes de agregar este producto necesitamos confirmar su disponibilidad.");
  }
  if (requiredAttrsIncomplete(atributos, selecciones)) {
    throw new Error("Selecciona las características del producto");
  }
  const id_variante = resolveVarianteId(variantes, atributos, selecciones);
  useEcommerceCartStore.getState().add(
    {
      id_producto: producto.id_producto,
      id_variante,
      id_solicitud: id_solicitud || null,
      nombre: producto.nombre,
      precio: Number(producto.precio),
      imagen_url: imagen || producto.imagen_url,
      selecciones,
      attrs_label: attrsLabel(atributos, selecciones),
    },
    qty
  );
}

export function QuickAddSheet({
  slug,
  producto,
  qty = 1,
  onClose,
}: {
  slug: string;
  producto: StoreProducto | null;
  qty?: number;
  onClose: () => void;
}) {
  const open = Boolean(producto);
  const [sels, setSels] = useState<AttrSeleccion[]>([]);
  const addedRef = useRef(false);
  const id_sucursal = useBranchStore((s) => s.id_sucursal);
  const activeBranch = useBranchStore((s) => s.activeBranch());
  const needsConsult = Boolean(producto?.disponibilidad && !producto.disponibilidad.cta.allowAddToCart);
  const productQ = useQuery({
    queryKey: ["store-product", slug, producto?.id_producto],
    queryFn: () => getStoreProduct(slug, producto!.id_producto),
    enabled: open && Boolean(producto),
  });
  const storeQ = useQuery({
    queryKey: ["store", slug, id_sucursal],
    queryFn: () => getStore(slug, id_sucursal),
    enabled: open && needsConsult,
  });
  const atributos = (productQ.data?.data?.atributos || []) as StorefrontAttr[];
  const variantes = (productQ.data?.data?.variantes || []) as StorefrontVariante[];
  const needs = selectableAttrs(atributos).some((a) => a.requiere_seleccion);
  const tienda = storeQ.data?.data?.tienda as StoreTienda | undefined;

  useEffect(() => {
    setSels([]);
    addedRef.current = false;
  }, [producto?.id_producto]);

  useEffect(() => {
    if (!open || !producto || !productQ.isSuccess) return;
    if (needsConsult || needs || addedRef.current) return;
    addedRef.current = true;
    try {
      addProductToCart({
        producto,
        qty,
        atributos,
        variantes,
        selecciones: [],
        imagen: producto.imagen_url,
      });
      toast.success(`${producto.nombre} agregado al carrito`);
    } catch (e) {
      toast.error((e as Error).message);
    }
    onClose();
  }, [open, producto, productQ.isSuccess, needs, needsConsult, qty, atributos, variantes, onClose]);

  const confirm = () => {
    if (!producto) return;
    try {
      if (requiredAttrsIncomplete(atributos, sels)) {
        toast.error("Completa las características");
        return;
      }
      addProductToCart({
        producto,
        qty,
        atributos,
        variantes,
        selecciones: sels,
        imagen: producto.imagen_url,
      });
      toast.success(`${producto.nombre} agregado al carrito`);
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Sheet open={open && (productQ.isLoading || needs || needsConsult)} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{needsConsult ? "Confirmar disponibilidad" : "Selecciona características"}</SheetTitle>
          <SheetDescription>{producto?.nombre}</SheetDescription>
        </SheetHeader>
        <div className="px-4 py-4 space-y-4">
          {productQ.isLoading ? (
            <p className="text-sm text-stone-400">Cargando…</p>
          ) : needsConsult && producto ? (
            <>
              {producto.disponibilidad && <AvailabilityStatus disp={producto.disponibilidad} />}
              <p className="text-sm store-muted">
                Antes de agregar este producto necesitamos confirmar su disponibilidad.
              </p>
              <ConsultarWhatsAppButton
                slug={slug}
                telefono={tienda?.telefono}
                tiendaNombre={tienda?.nombre}
                branch={activeBranch}
                product={producto}
                qty={qty}
                origen="carrito"
                mensajeIntro={tienda?.disponibilidad_config?.mensaje_intro}
              />
            </>
          ) : (
            <AttrPicker atributos={atributos} value={sels} onChange={setSels} />
          )}
          {!needsConsult && (
            <button
              type="button"
              className="w-full h-11 text-sm font-semibold text-white"
              style={{ background: "var(--vitrina-accent, #0f766e)" }}
              onClick={confirm}
              disabled={productQ.isLoading}
            >
              Agregar al carrito
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function useQuickAddGuard() {
  const sucursales = useBranchStore((s) => s.sucursales);
  const id_sucursal = useBranchStore((s) => s.id_sucursal);
  return (p: StoreProducto | null) => {
    if (p && !id_sucursal && sucursales.length) {
      toast.error("Elige una sucursal de recojo primero");
      return false;
    }
    return true;
  };
}
