import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useEcommerceCartStore } from "../store/useEcommerceCartStore";
import { checkoutStore } from "../api/ecommerce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function StoreCartPage() {
  const { slug = "" } = useParams();
  const { items, setQty, remove, total, setSlug, clear } = useEcommerceCartStore();
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    if (slug) setSlug(slug);
  }, [slug, setSlug]);

  const checkoutMut = useMutation({
    mutationFn: () =>
      checkoutStore(slug, {
        items: items.map((i) => ({ id_producto: i.id_producto, cantidad: i.cantidad })),
        email_comprador: email.trim(),
        nombre_comprador: nombre.trim() || undefined,
      }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message || "Error en checkout");
        return;
      }
      clear();
      window.location.href =
        res.data.init_point ||
        `https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=${res.data.preference_id}`;
    },
    onError: (e: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message || e.message || "Error");
    },
  });

  return (
    <div className="min-h-screen bg-[#faf9f7] text-stone-900">
      <div className="max-w-lg mx-auto px-4 py-10">
        <Link to={`/tienda/${slug}`} className="text-sm text-stone-500 hover:underline">
          ← Volver a la tienda
        </Link>
        <h1 className="text-2xl font-semibold mt-4">Carrito</h1>

        {items.length === 0 ? (
          <p className="mt-8 text-stone-400">Tu carrito está vacío.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {items.map((i) => (
              <li key={i.id_producto} className="rounded-xl border border-stone-200 bg-white p-3 flex gap-3">
                <div className="size-16 rounded-lg bg-stone-100 overflow-hidden shrink-0">
                  {i.imagen_url && <img src={i.imagen_url} alt="" className="size-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{i.nombre}</div>
                  <div className="text-sm text-stone-500">S/ {i.precio.toFixed(2)}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      min={1}
                      className="w-20 h-8"
                      value={i.cantidad}
                      onChange={(e) => setQty(i.id_producto, Number(e.target.value))}
                    />
                    <Button variant="ghost" size="sm" onClick={() => remove(i.id_producto)}>
                      Quitar
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <div className="mt-8 space-y-3 rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>S/ {total().toFixed(2)}</span>
            </div>
            <div>
              <Label>Tu email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Nombre (opcional)</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <Button
              className="w-full"
              disabled={!email.trim() || checkoutMut.isPending}
              onClick={() => checkoutMut.mutate()}
            >
              Pagar con Mercado Pago
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
