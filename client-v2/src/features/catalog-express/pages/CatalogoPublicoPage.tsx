import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, Store } from "lucide-react";
import { getCatalogoPublico, getStoreBySlug } from "../api/catalogoPublico";
import { construirEnlaceWhatsApp, formatearMensajePedido, normalizarTelefono } from "../lib/whatsapp";
import { CatalogShell } from "../components/CatalogShell";
import { CatalogHeader } from "../components/CatalogHeader";
import { CatalogHero } from "../components/CatalogHero";
import { CategoryVisualRail } from "../components/CategoryVisualRail";
import { CatalogFilters, type CatalogFiltersState } from "../components/CatalogFilters";
import { CatalogToolbar, CatalogPagination, type OrdenOption } from "../components/CatalogToolbar";
import { ProductGrid, ProductGridSkeleton } from "../components/ProductGrid";
import { CartSheet } from "../components/CartSheet";
import { CheckoutBar } from "../components/CheckoutBar";
import { QuickViewModal } from "../components/QuickViewModal";
import { useCatalogCartStore } from "../store/useCatalogCartStore";
import { useCatalogBranchStore } from "../store/useCatalogBranchStore";
import type { CarritoItem, CatalogoProducto, CatalogoPublico } from "../types";

type PageProps = { slugOverride?: string; storeBootstrap?: CatalogoPublico | null };

export default function CatalogoPublicoPage({ slugOverride, storeBootstrap }: PageProps = {}) {
  const { idTenant } = useParams<{ idTenant: string }>();
  const navigate = useNavigate();
  const slug = slugOverride || storeBootstrap?.store?.slug;
  const setCartSlug = useCatalogCartStore((st) => st.setSlug);
  const syncAdd = useCatalogCartStore((st) => st.addItem);
  const id_sucursal = useCatalogBranchStore((st) => st.id_sucursal);
  const setSucursal = useCatalogBranchStore((st) => st.setSucursal);

  const [busqueda, setBusqueda] = useState("");
  const [filters, setFilters] = useState<CatalogFiltersState>({
    categoria: null,
    marca: null,
    precioMin: "",
    precioMax: "",
    soloStock: false,
  });
  const [orden, setOrden] = useState<OrdenOption>("relevancia");
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(12);
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [quickViewProducto, setQuickViewProducto] = useState<CatalogoProducto | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => { if (slug) setCartSlug(slug); }, [slug, setCartSlug]);

  const { data: fetched, isLoading, isError } = useQuery({
    queryKey: ["catalogo-publico", slug || idTenant],
    queryFn: () => (slug ? getStoreBySlug(slug) : getCatalogoPublico(idTenant!)),
    enabled: !storeBootstrap && (!!slug || !!idTenant),
  });
  const data = storeBootstrap || fetched;

  useEffect(() => {
    if (!id_sucursal && data?.sucursales?.[0]) setSucursal(data.sucursales[0].id_sucursal);
  }, [data?.sucursales, id_sucursal, setSucursal]);

  useEffect(() => {
    if (data?.negocio?.nombre) document.title = `${data.negocio.nombre} · Tienda`;
  }, [data?.negocio?.nombre]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filters, orden, itemsPorPagina]);

  const categoriasConCount = useMemo(() => {
    const map = new Map<string, number>();
    (data?.productos ?? []).forEach((p) => {
      if (p.categoria) map.set(p.categoria, (map.get(p.categoria) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [data]);

  const marcasConCount = useMemo(() => {
    const map = new Map<string, number>();
    (data?.productos ?? []).forEach((p) => {
      if (p.nom_marca) map.set(p.nom_marca, (map.get(p.nom_marca) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [data]);

  const filtrados = useMemo(() => {
    let lista = data?.productos ?? [];
    if (filters.categoria) lista = lista.filter((p) => p.categoria === filters.categoria);
    if (filters.marca) lista = lista.filter((p) => p.nom_marca === filters.marca);
    if (filters.soloStock) lista = lista.filter((p) => p.stock > 0);
    if (filters.precioMin.trim() !== "") {
      const min = parseFloat(filters.precioMin);
      if (!isNaN(min)) lista = lista.filter((p) => p.precio >= min);
    }
    if (filters.precioMax.trim() !== "") {
      const max = parseFloat(filters.precioMax);
      if (!isNaN(max)) lista = lista.filter((p) => p.precio <= max);
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.descripcion.toLowerCase().includes(q) ||
          (p.nom_marca && p.nom_marca.toLowerCase().includes(q)) ||
          (p.categoria && p.categoria.toLowerCase().includes(q))
      );
    }
    return lista;
  }, [data, filters, busqueda]);

  const ordenados = useMemo(() => {
    const copia = [...filtrados];
    switch (orden) {
      case "precio-asc":
        return copia.sort((a, b) => a.precio - b.precio);
      case "precio-desc":
        return copia.sort((a, b) => b.precio - a.precio);
      case "nombre-asc":
        return copia.sort((a, b) => a.descripcion.localeCompare(b.descripcion));
      case "nombre-desc":
        return copia.sort((a, b) => b.descripcion.localeCompare(a.descripcion));
      default:
        return copia;
    }
  }, [filtrados, orden]);

  const totalItems = ordenados.length;
  const totalPaginas = Math.ceil(totalItems / itemsPorPagina) || 1;
  const pagina = Math.min(Math.max(1, paginaActual), totalPaginas);

  const paginados = useMemo(() => {
    const inicio = (pagina - 1) * itemsPorPagina;
    return ordenados.slice(inicio, inicio + itemsPorPagina);
  }, [ordenados, pagina, itemsPorPagina]);

  const numFiltrosActivos = useMemo(() => {
    let count = 0;
    if (busqueda.trim()) count++;
    if (filters.categoria) count++;
    if (filters.marca) count++;
    if (filters.precioMin.trim()) count++;
    if (filters.precioMax.trim()) count++;
    if (filters.soloStock) count++;
    if (orden !== "relevancia") count++;
    return count;
  }, [busqueda, filters, orden]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFilters({
      categoria: null,
      marca: null,
      precioMin: "",
      precioMax: "",
      soloStock: false,
    });
    setOrden("relevancia");
    setPaginaActual(1);
  };

  const agregar = (producto: CatalogoProducto) => {
    setCarrito((prev) => {
      const existente = prev.find((it) => it.producto.codigo === producto.codigo);
      if (existente) {
        if (existente.cantidad >= producto.stock) return prev;
        return prev.map((it) =>
          it.producto.codigo === producto.codigo ? { ...it, cantidad: it.cantidad + 1 } : it
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
    if (slug) syncAdd(producto);
  };

  const openProduct = (p: CatalogoProducto) => {
    if (slug) navigate(`/c/${slug}/p/${p.slug || p.codigo}`);
    else setQuickViewProducto(p);
  };

  const openCartOrCheckout = () => {
    if (slug) navigate(`/c/${slug}/carrito`);
    else setCarritoAbierto(true);
  };

  const cambiarCantidad = (codigo: number, delta: number) => {
    setCarrito((prev) =>
      prev
        .map((it) =>
          it.producto.codigo === codigo
            ? { ...it, cantidad: Math.min(it.producto.stock, it.cantidad + delta) }
            : it
        )
        .filter((it) => it.cantidad > 0)
    );
  };

  const quitar = (codigo: number) =>
    setCarrito((prev) => prev.filter((it) => it.producto.codigo !== codigo));

  const totalItemsCarrito = carrito.reduce((sum, it) => sum + it.cantidad, 0);
  const totalMontoCarrito = carrito.reduce(
    (sum, it) => sum + it.producto.precio * it.cantidad,
    0
  );

  const hasWhatsApp = Boolean(normalizarTelefono(data?.negocio.telefono));
  const enlaceWhatsApp = data
    ? construirEnlaceWhatsApp(data.negocio.telefono, formatearMensajePedido(carrito, data.negocio.nombre))
    : null;

  const previewImages = useMemo(() => {
    const urls: string[] = [];
    for (const p of data?.productos ?? []) {
      const src = p.images?.[0] || p.imagen_url;
      if (src && !urls.includes(src)) urls.push(src);
      if (urls.length >= 5) break;
    }
    return urls;
  }, [data?.productos]);

  const scrollToCatalogo = () => {
    document.getElementById("cx-catalogo")?.scrollIntoView({ behavior: "smooth" });
  };

  const goPagina = (n: number) => {
    setPaginaActual(n);
    document.getElementById("cx-catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoading && !storeBootstrap) {
    return (
      <CatalogShell>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div className="h-48 rounded-[var(--cx-radius-lg)] cx-skeleton" />
          <ProductGridSkeleton />
        </div>
      </CatalogShell>
    );
  }

  if ((isError && !storeBootstrap) || !data) {
    return (
      <CatalogShell>
        <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
          <div className="rounded-full bg-black/[0.05] p-4">
            <Store className="size-10 opacity-40" />
          </div>
          <h1 className="cx-display text-2xl font-bold">Catálogo no disponible</h1>
          <p className="max-w-sm text-sm cx-muted">
            El enlace no corresponde a un catálogo activo o la tienda no está disponible temporalmente.
          </p>
        </div>
      </CatalogShell>
    );
  }

  const filtersPanel = (
    <CatalogFilters
      state={filters}
      onChange={(patch) => setFilters((s) => ({ ...s, ...patch }))}
      categorias={categoriasConCount}
      marcas={marcasConCount}
      totalProductos={data.productos.length}
      numFiltrosActivos={numFiltrosActivos}
      onReset={limpiarFiltros}
    />
  );

  const chips = [
    busqueda.trim()
      ? { key: "q", label: `"${busqueda}"`, onClear: () => setBusqueda("") }
      : null,
    filters.categoria
      ? { key: "cat", label: filters.categoria, onClear: () => setFilters((s) => ({ ...s, categoria: null })) }
      : null,
    filters.marca
      ? { key: "marca", label: filters.marca, onClear: () => setFilters((s) => ({ ...s, marca: null })) }
      : null,
    filters.precioMin.trim()
      ? {
          key: "min",
          label: `Min S/ ${filters.precioMin}`,
          onClear: () => setFilters((s) => ({ ...s, precioMin: "" })),
        }
      : null,
    filters.precioMax.trim()
      ? {
          key: "max",
          label: `Max S/ ${filters.precioMax}`,
          onClear: () => setFilters((s) => ({ ...s, precioMax: "" })),
        }
      : null,
    filters.soloStock
      ? { key: "stock", label: "Con stock", onClear: () => setFilters((s) => ({ ...s, soloStock: false })) }
      : null,
    orden !== "relevancia"
      ? { key: "orden", label: "Ordenado", onClear: () => setOrden("relevancia") }
      : null,
  ].filter(Boolean) as { key: string; label: string; onClear: () => void }[];

  return (
    <CatalogShell title={`${data.negocio.nombre} · Catálogo`} className="pb-24 sm:pb-28">
      <CatalogHeader
        negocio={data.negocio}
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        cartCount={totalItemsCarrito}
        cartTotal={totalMontoCarrito}
        onOpenCart={openCartOrCheckout}
        hasWhatsApp={hasWhatsApp}
      />

      <CatalogHero
        negocio={data.negocio}
        productosCount={data.productos.length}
        categoriasCount={categoriasConCount.length}
        onVerCatalogo={scrollToCatalogo}
        hasWhatsApp={hasWhatsApp}
        previewImages={previewImages}
      />

      {(data.sucursales?.length ?? 0) > 0 && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-3">
          <select
            value={id_sucursal ?? ""}
            onChange={(e) => setSucursal(Number(e.target.value) || null)}
            className="h-9 text-sm border cx-hairline rounded-full px-3"
          >
            <option value="">Todas las sucursales</option>
            {data.sucursales!.map((su) => (
              <option key={su.id_sucursal} value={su.id_sucursal}>{su.nombre}</option>
            ))}
          </select>
        </div>
      )}

      <CategoryVisualRail
        categorias={categoriasConCount}
        productos={data.productos}
        activa={filters.categoria}
        onSelect={(cat) => {
          setFilters((s) => ({ ...s, categoria: cat }));
          scrollToCatalogo();
        }}
      />

      {!hasWhatsApp && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-[var(--cx-radius-sm)] px-3 py-2">
            Esta tienda aún no configuró un número de WhatsApp. Puedes explorar el catálogo, pero el envío del pedido no estará disponible.
          </p>
        </div>
      )}

      <div id="cx-catalogo" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 scroll-mt-16">
        <CatalogToolbar
          orden={orden}
          onOrden={setOrden}
          itemsPorPagina={itemsPorPagina}
          onItemsPorPagina={setItemsPorPagina}
          numFiltrosActivos={numFiltrosActivos}
          mobileFiltersOpen={mobileFiltersOpen}
          onMobileFiltersOpen={setMobileFiltersOpen}
          filtersPanel={filtersPanel}
          chips={chips}
          onClearAll={limpiarFiltros}
          showingFrom={totalItems > 0 ? (pagina - 1) * itemsPorPagina + 1 : 0}
          showingTo={Math.min(pagina * itemsPorPagina, totalItems)}
          totalItems={totalItems}
          pagina={pagina}
          totalPaginas={totalPaginas}
        />

        <div className="mt-6 flex gap-8 items-start">
          <aside className="hidden md:block w-64 lg:w-72 shrink-0 sticky top-20">
            <div className="cx-elevated p-5">
              <div className="flex items-center justify-between pb-3 mb-4 border-b cx-hairline">
                <h2 className="font-bold text-sm tracking-tight flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-[var(--cx-accent)]" /> Filtros
                </h2>
                {numFiltrosActivos > 0 && (
                  <span className="text-[10px] font-semibold cx-muted">{numFiltrosActivos} activos</span>
                )}
              </div>
              {filtersPanel}
            </div>
          </aside>

          <main className="flex-1 min-w-0 space-y-6">
            <ProductGrid
              productos={paginados}
              carrito={carrito}
              onAdd={agregar}
              onQuickView={openProduct}
              hasFilters={numFiltrosActivos > 0}
              emptyAction={limpiarFiltros}
            />
            <CatalogPagination
              pagina={pagina}
              totalPaginas={totalPaginas}
              onPagina={goPagina}
              className="pt-2"
            />
          </main>
        </div>
      </div>

      <CheckoutBar
        itemCount={totalItemsCarrito}
        total={totalMontoCarrito}
        enlaceWhatsApp={slug ? null : enlaceWhatsApp}
        onOpenCart={openCartOrCheckout}
      />

      <CartSheet
        open={carritoAbierto}
        onOpenChange={setCarritoAbierto}
        carrito={carrito}
        total={totalMontoCarrito}
        enlaceWhatsApp={enlaceWhatsApp}
        onCambiarCantidad={cambiarCantidad}
        onQuitar={quitar}
      />

      <QuickViewModal
        producto={quickViewProducto}
        nombreNegocio={data.negocio.nombre}
        telefono={data.negocio.telefono}
        onClose={() => setQuickViewProducto(null)}
        onAdd={(p) => {
          agregar(p);
          setQuickViewProducto(null);
        }}
      />
    </CatalogShell>
  );
}
