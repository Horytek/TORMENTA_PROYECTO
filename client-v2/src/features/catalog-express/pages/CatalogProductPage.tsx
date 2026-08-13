import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Minus, Plus, ShoppingBag, Heart } from "lucide-react";
import {
  getProductoDetalle,
  getStoreBySlug,
  logConsultaWa,
  addFavorito,
  removeFavorito,
} from "../api/catalogoPublico";
import { useCatalogCartStore } from "../store/useCatalogCartStore";
import { useCatalogBranchStore } from "../store/useCatalogBranchStore";
import { useCatalogBuyerStore } from "../store/useCatalogBuyerStore";
import { buildWaConsultaMessage, waLink } from "../lib/buildWaMessage";
import { CatalogShell } from "../components/CatalogShell";

export default function CatalogProductPage() {
  const { slug, productId } = useParams<{ slug: string; productId: string }>();
  const navigate = useNavigate();
  const id_sucursal = useCatalogBranchStore((s) => s.id_sucursal);
  const addItem = useCatalogCartStore((s) => s.addItem);
  const setSlug = useCatalogCartStore((s) => s.setSlug);
  const { token, comprador } = useCatalogBuyerStore();
  const [attrs, setAttrs] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [fav, setFav] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (slug) setSlug(slug);
  }, [slug, setSlug]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["catalog-pdp", slug, productId, id_sucursal],
    queryFn: () => getProductoDetalle(slug!, productId!, id_sucursal ?? undefined),
    enabled: !!slug && !!productId,
  });

  const { data: storeData } = useQuery({
    queryKey: ["catalog-store-phone", slug],
    queryFn: () => getStoreBySlug(slug!),
    enabled: !!slug,
  });

  const producto = data?.producto;
  const variantes = producto?.variantes ?? [];

  const varianteMatch = useMemo(() => {
    if (!variantes.length) return null;
    const keys = Object.keys(attrs);
    if (!keys.length) return variantes[0] ?? null;
    return (
      variantes.find((v) =>
        keys.every((k) => String(v.attributes_json?.[k] ?? "") === String(attrs[k]))
      ) ?? null
    );
  }, [variantes, attrs]);

  const precio = varianteMatch?.precio ?? producto?.precio ?? 0;
  const stock = varianteMatch?.stock ?? producto?.stock ?? 0;
  const disp = varianteMatch?.disponibilidad ?? producto?.disponibilidad;
  const images = producto?.images?.length
    ? producto.images
    : producto?.imagen_url
      ? [producto.imagen_url]
      : [];

  useEffect(() => {
    if (producto?.ejes_variante?.length && !Object.keys(attrs).length) {
      const initial: Record<string, string> = {};
      for (const eje of producto.ejes_variante) {
        if (eje.valores[0]) initial[String(eje.id_atributo)] = eje.valores[0];
      }
      setAttrs(initial);
    }
  }, [producto?.codigo]); // eslint-disable-line react-hooks/exhaustive-deps

  const consultWa = async (tipo: "disponibilidad" | "variante" | "otra_sucursal" | "confirmar") => {
    if (!producto || !slug) return;
    await logConsultaWa(slug, {
      id_producto: producto.codigo,
      id_sku: varianteMatch?.id_sku,
      id_sucursal: id_sucursal ?? undefined,
      origen: tipo,
      attrs_snapshot: attrs,
    });
    const msg = buildWaConsultaMessage({
      negocio: storeData?.store?.nombre || storeData?.negocio?.nombre || "",
      producto: producto.descripcion,
      sku: varianteMatch?.sku,
      attrs,
      url: window.location.href,
      tipo,
    });
    const link = waLink(storeData?.store?.telefono || storeData?.negocio?.telefono, msg);
    if (link) window.open(link, "_blank");
  };

  if (isLoading) {
    return (
      <CatalogShell>
        <div className="p-8 animate-pulse space-y-4">
          <div className="h-64 bg-stone-200 rounded-xl" />
          <div className="h-8 bg-stone-200 rounded w-2/3" />
        </div>
      </CatalogShell>
    );
  }

  if (isError || !producto) {
    return (
      <CatalogShell>
        <div className="p-8 text-center">
          <p className="text-stone-600">Producto no encontrado</p>
          <Link to={`/c/${slug}`} className="text-sm underline mt-2 inline-block">
            Volver al catálogo
          </Link>
        </div>
      </CatalogShell>
    );
  }

  return (
    <CatalogShell>
      <div className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
            {images[imgIdx] ? (
              <img src={images[imgIdx]} alt={producto.descripcion} className="size-full object-cover" />
            ) : (
              <div className="size-full flex items-center justify-center text-stone-400">Sin imagen</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setImgIdx(i)}
                  className={`size-16 rounded-lg overflow-hidden border-2 ${i === imgIdx ? "border-stone-900" : "border-transparent"}`}
                >
                  <img src={src} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {producto.nom_marca && (
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{producto.nom_marca}</p>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">{producto.descripcion}</h1>
          {producto.categoria && <p className="text-sm text-stone-500">{producto.categoria}</p>}

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-stone-900">S/ {precio.toFixed(2)}</span>
            {varianteMatch?.sku && (
              <span className="text-xs text-stone-400 font-mono">SKU {varianteMatch.sku}</span>
            )}
          </div>

          <div
            className={`inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full ${
              disp?.estado === "disponible"
                ? "bg-emerald-50 text-emerald-800"
                : disp?.estado === "ultimas_unidades"
                  ? "bg-amber-50 text-amber-800"
                  : disp?.estado === "otra_sucursal"
                    ? "bg-sky-50 text-sky-800"
                    : "bg-stone-100 text-stone-600"
            }`}
          >
            {disp?.label ?? "Consultar"} · {stock} und.
          </div>

          {producto.ejes_variante?.map((eje) => (
            <div key={eje.id_atributo}>
              <p className="text-xs font-semibold text-stone-600 mb-2">{eje.nombre}</p>
              <div className="flex flex-wrap gap-2">
                {eje.valores.map((val) => {
                  const key = String(eje.id_atributo);
                  const active = attrs[key] === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAttrs((a) => ({ ...a, [key]: val }))}
                      className={`px-3 py-1.5 text-sm rounded-full border transition ${
                        active
                          ? "border-stone-900 bg-stone-900 text-white"
                          : "border-stone-200 hover:border-stone-400"
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {producto.atributos?.length > 0 && (
            <dl className="grid grid-cols-2 gap-2 text-sm border-t border-stone-100 pt-4">
              {producto.atributos.map((a) => (
                <div key={a.id_atributo}>
                  <dt className="text-stone-400 text-xs">{a.nombre}</dt>
                  <dd className="font-medium text-stone-800">{a.valor}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="flex items-center gap-3 pt-2">
            <div className="inline-flex items-center border border-stone-200 rounded-full">
              <button
                type="button"
                className="p-2"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center text-sm font-semibold">{qty}</span>
              <button
                type="button"
                className="p-2"
                onClick={() => setQty((q) => Math.min(stock || 99, q + 1))}
              >
                <Plus className="size-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={stock <= 0}
              onClick={() => {
                addItem(producto, {
                  cantidad: qty,
                  id_sku: varianteMatch?.id_sku,
                  attrs,
                  precio_unitario: precio,
                });
              }}
              className="flex-1 h-11 rounded-full bg-stone-900 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <ShoppingBag className="size-4" /> Agregar al carrito
            </button>

            {token && (
              <button
                type="button"
                className="h-11 w-11 rounded-full border border-stone-200 inline-flex items-center justify-center"
                onClick={async () => {
                  if (!slug) return;
                  if (fav) {
                    await removeFavorito(slug, producto.codigo, token);
                    setFav(false);
                  } else {
                    await addFavorito(slug, producto.codigo, token);
                    setFav(true);
                  }
                }}
              >
                <Heart className={`size-4 ${fav ? "fill-red-500 text-red-500" : ""}`} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => consultWa("disponibilidad")}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-full bg-emerald-600 text-white font-medium"
            >
              <MessageCircle className="size-4" /> Consultar disponibilidad
            </button>
            <button
              type="button"
              onClick={() => consultWa("otra_sucursal")}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-full border border-stone-200 font-medium"
            >
              ¿En otra sucursal?
            </button>
            <button
              type="button"
              onClick={() => navigate(`/c/${slug}/carrito`)}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-full border border-stone-200 font-medium"
            >
              Ver carrito
            </button>
          </div>

          {producto.stock_por_sucursal?.length > 0 && (
            <div className="border-t border-stone-100 pt-4">
              <h3 className="text-sm font-semibold mb-2">Disponibilidad por sucursal</h3>
              <ul className="space-y-1.5 text-sm">
                {producto.stock_por_sucursal.map((s) => (
                  <li key={s.id_sucursal} className="flex justify-between gap-2">
                    <span>{s.nombre}</span>
                    <span className="text-stone-500">{s.disponibilidad.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!!comprador && (
            <p className="text-xs text-stone-400">Sesión: {comprador.nombres}</p>
          )}
        </div>
      </div>

      {data?.relacionados && data.relacionados.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <h2 className="text-lg font-semibold mb-4">También te puede interesar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.relacionados.map((p) => (
              <Link
                key={p.codigo}
                to={`/c/${slug}/p/${p.slug || p.codigo}`}
                className="rounded-xl border border-stone-200 overflow-hidden hover:shadow-md transition"
              >
                <div className="aspect-square bg-stone-100">
                  {(p.images?.[0] || p.imagen_url) && (
                    <img
                      src={p.images?.[0] || p.imagen_url!}
                      alt=""
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs line-clamp-2 font-medium">{p.descripcion}</p>
                  <p className="text-sm font-bold mt-1">S/ {p.precio.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {data?.resenas && data.resenas.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <h2 className="text-lg font-semibold mb-4">Opiniones</h2>
          <div className="space-y-3">
            {(data.resenas as { rating: number; titulo: string; cuerpo: string; nombres: string }[]).map(
              (r, i) => (
                <article key={i} className="rounded-xl border border-stone-200 p-4">
                  <p className="text-sm font-semibold">
                    {"★".repeat(r.rating)}{" "}
                    <span className="text-stone-500 font-normal">{r.nombres}</span>
                  </p>
                  {r.titulo && <p className="font-medium mt-1">{r.titulo}</p>}
                  {r.cuerpo && <p className="text-sm text-stone-600 mt-1">{r.cuerpo}</p>}
                </article>
              )
            )}
          </div>
        </section>
      )}
    </CatalogShell>
  );
}
