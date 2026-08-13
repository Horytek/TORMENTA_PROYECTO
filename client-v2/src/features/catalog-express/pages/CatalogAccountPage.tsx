import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getFavoritos, getMisPedidos, removeFavorito } from "../api/catalogoPublico";
import { useCatalogBuyerStore } from "../store/useCatalogBuyerStore";
import { CatalogShell } from "../components/CatalogShell";

export default function CatalogAccountPage() {
  const { slug } = useParams<{ slug: string }>();
  const { token, comprador, logout } = useCatalogBuyerStore();

  const { data: pedidos } = useQuery({
    queryKey: ["mis-pedidos", slug],
    queryFn: () => getMisPedidos(slug!, token!),
    enabled: !!slug && !!token,
  });

  const { data: favoritos, refetch } = useQuery({
    queryKey: ["favoritos", slug],
    queryFn: () => getFavoritos(slug!, token!),
    enabled: !!slug && !!token,
  });

  if (!token) {
    return (
      <CatalogShell>
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <p className="text-stone-600 mb-4">Inicia sesión desde el carrito para ver tu cuenta.</p>
          <Link to={`/c/${slug}/carrito`} className="underline text-sm">
            Ir al carrito
          </Link>
        </div>
      </CatalogShell>
    );
  }

  return (
    <CatalogShell>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Mi cuenta</h1>
            <p className="text-sm text-stone-500">{comprador?.nombres} · {comprador?.email}</p>
          </div>
          <button type="button" onClick={logout} className="text-sm underline text-stone-500">
            Salir
          </button>
        </div>

        <section>
          <h2 className="font-semibold mb-3">Pedidos</h2>
          <ul className="space-y-2">
            {(pedidos || []).map((p: { codigo: string; estado: string; total: number; created_at: string }) => (
              <li key={p.codigo} className="rounded-xl border border-stone-200 p-3 flex justify-between text-sm">
                <div>
                  <p className="font-mono font-semibold">{p.codigo}</p>
                  <p className="text-stone-500 text-xs">{new Date(p.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">S/ {Number(p.total).toFixed(2)}</p>
                  <p className="text-xs text-stone-500">{p.estado}</p>
                </div>
              </li>
            ))}
            {!pedidos?.length && <p className="text-sm text-stone-400">Sin pedidos aún</p>}
          </ul>
        </section>

        <section>
          <h2 className="font-semibold mb-3">Favoritos</h2>
          <div className="grid grid-cols-2 gap-3">
            {(favoritos || []).map(
              (f: { id_producto: number; descripcion: string; precio: number; imagen_url: string; slug_tienda: string }) => (
                <div key={f.id_producto} className="rounded-xl border border-stone-200 overflow-hidden">
                  <Link to={`/c/${slug}/p/${f.slug_tienda || f.id_producto}`}>
                    <div className="aspect-square bg-stone-100">
                      {f.imagen_url && <img src={f.imagen_url} alt="" className="size-full object-cover" />}
                    </div>
                    <div className="p-2">
                      <p className="text-xs line-clamp-2 font-medium">{f.descripcion}</p>
                      <p className="text-sm font-bold">S/ {Number(f.precio).toFixed(2)}</p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    className="w-full text-xs py-2 border-t border-stone-100 text-stone-500"
                    onClick={async () => {
                      await removeFavorito(slug!, f.id_producto, token!);
                      refetch();
                    }}
                  >
                    Quitar
                  </button>
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </CatalogShell>
  );
}
