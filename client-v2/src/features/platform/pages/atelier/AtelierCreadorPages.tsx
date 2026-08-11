import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AtelierCreadorShell } from "./AtelierShells";
import {
  addAtelierAttachment,
  createAtelierPortfolio,
  createAtelierService,
  getAtelierOrder,
  getAtelierWallet,
  listAtelierCreatorOrders,
  listAtelierCreatorPortfolio,
  listAtelierCreatorRequests,
  listAtelierCreatorServices,
  listAtelierOrderMessages,
  sendAtelierMessage,
  sendAtelierQuote,
  startAtelierOrder,
  transitionAtelierOrder,
} from "@/features/platform/api/atelier";

export default function AtelierCreadorPages() {
  const location = useLocation();
  const { id } = useParams();
  const [items, setItems] = useState<any[]>([]);
  const [order, setOrder] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const detail = Boolean(id);
  const page = location.pathname.includes("solicitudes")
    ? "Solicitudes"
    : location.pathname.includes("pedidos")
      ? "Pedidos"
      : location.pathname.includes("servicios")
        ? "Servicios"
        : location.pathname.includes("portafolio")
          ? "Portafolio"
          : location.pathname.includes("ganancias")
            ? "Ganancias"
            : "Resumen";

  const load = () => {
    if (detail) {
      void Promise.all([getAtelierOrder(Number(id), "creador"), listAtelierOrderMessages(Number(id), "creador")])
        .then(([o, m]) => {
          setOrder(o.data);
          setMessages(m.data || []);
          setItems([o.data]);
        })
        .catch(() => {
          setOrder(null);
          setItems([]);
        });
      return;
    }
    const fn =
      page === "Solicitudes"
        ? listAtelierCreatorRequests
        : page === "Pedidos" || page === "Resumen"
          ? listAtelierCreatorOrders
          : page === "Servicios"
            ? listAtelierCreatorServices
            : page === "Portafolio"
              ? listAtelierCreatorPortfolio
              : getAtelierWallet;
    void fn()
      .then((r: any) => setItems(page === "Ganancias" ? [r.data] : r.data || []))
      .catch(() => setItems([]));
  };

  useEffect(() => {
    load();
  }, [detail, id, page]);

  const create = (kind: "service" | "portfolio") => (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(e.currentTarget));
    const body =
      kind === "service"
        ? { nombre: String(raw.nombre), precio_base: Number(raw.precio_base) }
        : { titulo: String(raw.titulo), image_url: String(raw.image_url) };
    void (kind === "service" ? createAtelierService(body) : createAtelierPortfolio(body)).then(() => {
      e.currentTarget.reset();
      load();
    });
  };

  const quote = (id_request: number, presupuesto?: number) => {
    void sendAtelierQuote(id_request, {
      precio_base: Number(presupuesto) || 150,
      dias_entrega: 5,
      revisiones: 2,
      condiciones: "Entrega digital en alta resolución.",
    }).then(load);
  };

  return (
    <AtelierCreadorShell title={detail ? `Pedido #${id}` : page} subtitle={page === "Resumen" ? "Tu estudio creativo, sin perder el hilo." : undefined}>
      {page === "Servicios" ? (
        <form className="rounded-xl bg-white p-4 shadow-sm" onSubmit={create("service")}>
          <h2 className="font-semibold">Nuevo servicio</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Input name="nombre" placeholder="Nombre" required />
            <Input name="precio_base" type="number" placeholder="Precio desde" required />
            <Button className="bg-[#DB2777] hover:bg-[#BE185D]">Guardar</Button>
          </div>
        </form>
      ) : null}
      {page === "Portafolio" ? (
        <form className="rounded-xl bg-white p-4 shadow-sm" onSubmit={create("portfolio")}>
          <h2 className="font-semibold">Agregar al portafolio</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Input name="titulo" placeholder="Título" required />
            <Input name="image_url" placeholder="URL de imagen" required />
            <Button className="bg-[#DB2777] hover:bg-[#BE185D]">Publicar</Button>
          </div>
        </form>
      ) : null}
      {detail && order ? (
        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
          <div>
            <p className="font-semibold">{order.titulo}</p>
            <p className="mt-1 text-sm text-stone-500">Estado: {order.estado}</p>
            <p className="mt-1 text-sm text-stone-500">Cliente: {order.cliente}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {order.estado === "paid" ? (
              <Button onClick={() => void startAtelierOrder(Number(id)).then(load)}>Iniciar trabajo</Button>
            ) : null}
            {order.estado === "in_progress" || order.estado === "revision" ? (
              <Button
                variant="outline"
                onClick={() => void transitionAtelierOrder(Number(id), { estado: "preview" }).then(load)}
              >
                Subir avance (preview)
              </Button>
            ) : null}
            {order.estado === "preview" ? (
              <Button
                variant="outline"
                onClick={() => void transitionAtelierOrder(Number(id), { estado: "final_delivery" }).then(load)}
              >
                Entrega final
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Input value={previewUrl} onChange={(e) => setPreviewUrl(e.target.value)} placeholder="URL preview/final (ImageKit)" />
            <Button
              variant="outline"
              disabled={!previewUrl}
              onClick={() =>
                void addAtelierAttachment(Number(id), {
                  kind: order.estado === "final_delivery" || order.estado === "preview" ? "final" : "preview",
                  url: previewUrl,
                }).then(() => setPreviewUrl(""))
              }
            >
              Guardar adjunto
            </Button>
          </div>
          <div className="space-y-2 border-t pt-4">
            <h3 className="text-sm font-semibold">Mensajes</h3>
            {messages.map((m) => (
              <p key={m.id_message} className="text-sm text-stone-600">
                <span className="font-medium">{m.nombre}:</span> {m.body}
              </p>
            ))}
            <div className="flex gap-2">
              <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Escribe un mensaje…" />
              <Button
                onClick={() =>
                  void sendAtelierMessage(Number(id), { body: message }, "creador").then(() => {
                    setMessage("");
                    load();
                  })
                }
              >
                Enviar
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-4 grid gap-3">
          {page === "Resumen" ? (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-stone-500">Pedidos por atender</p>
              <p className="text-3xl font-semibold">{items.length}</p>
            </div>
          ) : page === "Ganancias" ? (
            items.map((w, i) => (
              <article key={i} className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm text-stone-500">Saldo pendiente / disponible</p>
                <p className="mt-2 text-2xl font-semibold">
                  S/ {Number(w?.pending || 0).toFixed(2)} · S/ {Number(w?.available || 0).toFixed(2)}
                </p>
                <p className="mt-1 text-sm text-stone-500">Ganado total: S/ {Number(w?.total_earned || 0).toFixed(2)}</p>
              </article>
            ))
          ) : (
            items.map((x) => (
              <article
                key={x.id_request || x.id_order || x.id_service || x.id_item}
                className="rounded-xl bg-white p-4 shadow-sm"
              >
                <p className="font-medium">{x.titulo || x.nombre || `Pedido #${x.id_order}`}</p>
                <p className="mt-1 text-sm text-stone-500">{x.estado || (x.image_url ? "Publicado" : "Activo")}</p>
                {page === "Solicitudes" && x.estado === "submitted" ? (
                  <Button size="sm" className="mt-3" onClick={() => quote(x.id_request, x.presupuesto)}>
                    Enviar cotización
                  </Button>
                ) : null}
                {page === "Pedidos" ? (
                  <Link className="mt-3 inline-block text-sm text-[#DB2777]" to={`/atelier/creador/pedidos/${x.id_order}`}>
                    Abrir pedido
                  </Link>
                ) : null}
              </article>
            ))
          )}
        </section>
      )}
    </AtelierCreadorShell>
  );
}
