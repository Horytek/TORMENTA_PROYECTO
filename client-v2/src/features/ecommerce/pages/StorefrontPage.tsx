import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { getStore } from "../api/ecommerce";
import { useEcommerceCartStore } from "../store/useEcommerceCartStore";
import { Button } from "@/components/ui/button";

export default function StorefrontPage() {
  const { slug = "" } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["store", slug],
    queryFn: () => getStore(slug),
    enabled: Boolean(slug),
  });
  const setSlug = useEcommerceCartStore((s) => s.setSlug);
  const add = useEcommerceCartStore((s) => s.add);
  const count = useEcommerceCartStore((s) => s.count());

  useEffect(() => {
    if (slug) setSlug(slug);
  }, [slug, setSlug]);

  const tienda = data?.data?.tienda;
  const productos = data?.data?.productos || [];
  const accent = tienda?.color_primario || "#0E7C7B";

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-stone-400">Cargando tienda…</div>;
  }
  if (error || !data?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center text-stone-600">
        Tienda no encontrada.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] text-stone-900">
      <header
        className="sticky top-0 z-10 border-b border-stone-200/80 backdrop-blur bg-white/90"
        style={{ borderBottomColor: `${accent}33` }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-stone-400">Horytek · Shop</div>
            <h1 className="font-semibold leading-tight">{tienda.nombre}</h1>
          </div>
          <Link to={`/tienda/${slug}/carrito`}>
            <Button variant="outline" size="sm" className="gap-2">
              <ShoppingBag className="size-4" />
              Carrito {count > 0 ? `(${count})` : ""}
            </Button>
          </Link>
        </div>
      </header>

      {tienda.descripcion && (
        <p className="max-w-5xl mx-auto px-4 pt-6 text-stone-600 text-sm">{tienda.descripcion}</p>
      )}

      {!data?.data?.mp_ready && (
        <div className="max-w-5xl mx-auto px-4 mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Esta tienda aún no tiene Mercado Pago configurado. Puedes explorar el catálogo.
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {productos.map(
          (p: {
            id_producto: number;
            nombre: string;
            descripcion?: string;
            precio: number;
            stock: number;
            imagen_url?: string;
          }) => (
            <article
              key={p.id_producto}
              className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm flex flex-col"
            >
              <Link to={`/tienda/${slug}/producto/${p.id_producto}`} className="aspect-[4/3] bg-stone-100 block">
                {p.imagen_url ? (
                  <img src={p.imagen_url} alt={p.nombre} className="size-full object-cover" />
                ) : (
                  <div className="size-full flex items-center justify-center text-stone-300">Sin foto</div>
                )}
              </Link>
              <div className="p-4 flex-1 flex flex-col gap-2">
                <div className="text-[10px] uppercase tracking-wider text-stone-400">Producto</div>
                <Link to={`/tienda/${slug}/producto/${p.id_producto}`} className="font-semibold text-lg leading-tight hover:underline">
                  {p.nombre}
                </Link>
                {p.descripcion && <p className="text-xs text-stone-500 line-clamp-2">{p.descripcion}</p>}
                <div className="mt-auto flex items-end justify-between pt-2">
                  <div>
                    <div className="text-[10px] uppercase text-stone-400">Precio</div>
                    <div className="text-lg font-semibold" style={{ color: accent }}>
                      S/ {Number(p.precio).toFixed(2)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    style={{ backgroundColor: accent }}
                    className="text-white"
                    onClick={() =>
                      add({
                        id_producto: p.id_producto,
                        nombre: p.nombre,
                        precio: Number(p.precio),
                        imagen_url: p.imagen_url,
                      })
                    }
                  >
                    Agregar
                  </Button>
                </div>
              </div>
            </article>
          )
        )}
        {productos.length === 0 && (
          <p className="col-span-full text-center text-stone-400 py-16">Catálogo vacío por ahora.</p>
        )}
      </div>
    </div>
  );
}
