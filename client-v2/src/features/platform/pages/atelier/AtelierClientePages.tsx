import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AtelierClienteShell } from "./AtelierShells";
import {
  acceptAtelierQuote,
  checkoutAtelierOrder,
  createAtelierRequest,
  getAtelierOrder,
  listAtelierClientOrders,
  listAtelierClientRequests,
  listAtelierOrderMessages,
  rejectAtelierQuote,
  requestAtelierRevision,
  reviewAtelierOrder,
  sendAtelierMessage,
  transitionAtelierOrder,
} from "@/features/platform/api/atelier";

export default function AtelierClientePages() {
  const location = useLocation();
  const { id } = useParams();
  const [items, setItems] = useState<any[]>([]);
  const [order, setOrder] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const detail = Boolean(id);
  const page = location.pathname.includes("solicitudes")
    ? "Solicitudes"
    : location.pathname.includes("pedidos")
      ? "Pedidos"
      : "Resumen";

  const load = () => {
    if (detail) {
      void Promise.all([getAtelierOrder(Number(id)), listAtelierOrderMessages(Number(id))])
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
    const fn = page === "Solicitudes" ? listAtelierClientRequests : listAtelierClientOrders;
    void fn()
      .then((r: any) => setItems(r.data || []))
      .catch(() => setItems([]));
  };

  useEffect(() => {
    load();
  }, [detail, id, page]);

  const pay = async () => {
    const r = await checkoutAtelierOrder(Number(id));
    const url = r?.data?.init_point || r?.data?.sandbox_init_point;
    if (url) window.location.assign(url);
  };

  return (
    <AtelierClienteShell title={detail ? `Pedido #${id}` : page} subtitle={page === "Resumen" ? "Tus encargos creativos en un solo lugar." : undefined}>
      {page === "Solicitudes" && !detail ? (
        <form
          className="rounded-xl bg-white p-4 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void createAtelierRequest({
              titulo: String(fd.get("titulo")),
              id_creator: Number(fd.get("id_creator")),
              descripcion: String(fd.get("descripcion")),
            }).then(load);
          }}
        >
          <h2 className="font-semibold">Nueva solicitud</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Input name="titulo" placeholder="¿Qué quieres encargar?" required />
            <Input name="id_creator" type="number" placeholder="ID del creador" required />
            <textarea
              name="descripcion"
              className="min-h-24 rounded-md border p-3 text-sm md:col-span-2"
              placeholder="Cuéntale al creador tu idea…"
              required
            />
          </div>
          <Button className="mt-3 bg-[#DB2777] hover:bg-[#BE185D]">Enviar solicitud</Button>
        </form>
      ) : null}

      {detail && order ? (
        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold">{order.titulo}</h2>
            <p className="mt-2 text-sm text-stone-500">Estado: {order.estado}</p>
            <p className="mt-1 text-sm text-stone-500">
              Total: S/ {Number(order.gross_amount || 0).toFixed(2)} · Creador: {order.nombre_artistico}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {order.estado === "payment_pending" ? (
              <Button className="bg-[#DB2777] hover:bg-[#BE185D]" onClick={() => void pay()}>
                Pagar pedido
              </Button>
            ) : null}
            {order.estado === "preview" ? (
              <>
                <Button
                  variant="outline"
                  onClick={() =>
                    void requestAtelierRevision(Number(id), { comentario: "Necesito un ajuste en colores/detalle." }).then(load)
                  }
                >
                  Pedir revisión
                </Button>
              </>
            ) : null}
            {order.estado === "final_delivery" ? (
              <Button
                className="bg-[#DB2777] hover:bg-[#BE185D]"
                onClick={() => void transitionAtelierOrder(Number(id), { estado: "completed" }, "cliente").then(load)}
              >
                Aprobar entrega
              </Button>
            ) : null}
            {order.estado === "completed" ? (
              <Button
                variant="outline"
                onClick={() =>
                  void reviewAtelierOrder(Number(id), {
                    calidad: 5,
                    comunicacion: 5,
                    cumplimiento: 5,
                    tiempo: 5,
                    comentario: "¡Me encantó!",
                  }).then(load)
                }
              >
                Dejar reseña
              </Button>
            ) : null}
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
                  void sendAtelierMessage(Number(id), { body: message }).then(() => {
                    setMessage("");
                    load();
                  })
                }
              >
                Enviar
              </Button>
            </div>
          </div>
          {order.events?.length ? (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold">Timeline</h3>
              <ul className="mt-2 space-y-1 text-sm text-stone-500">
                {order.events.map((ev: any) => (
                  <li key={ev.id_event}>
                    {ev.tipo}: {ev.mensaje}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="mt-4 grid gap-3">
          {page === "Resumen" ? (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-stone-500">Pedidos activos</p>
              <p className="text-3xl font-semibold">{items.length}</p>
              <Link className="mt-3 inline-block text-sm font-medium text-[#DB2777]" to="/atelier/cliente/pedidos">
                Ver pedidos
              </Link>
            </div>
          ) : (
            items.map((x) => (
              <article key={x.id_request || x.id_order} className="rounded-xl bg-white p-4 shadow-sm">
                <p className="font-medium">{x.titulo || `Solicitud #${x.id_request}`}</p>
                <p className="mt-1 text-sm text-stone-500">
                  {x.estado}
                  {x.gross_amount ? ` · S/ ${Number(x.gross_amount).toFixed(2)}` : ""}
                  {x.nombre_artistico ? ` · ${x.nombre_artistico}` : ""}
                </p>
                {page === "Solicitudes" && x.id_quote && x.quote_estado === "sent" ? (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="bg-[#DB2777] hover:bg-[#BE185D]"
                      onClick={() =>
                        void acceptAtelierQuote(x.id_quote).then((r: any) => {
                          if (r?.data?.id_order) window.location.assign(`/atelier/cliente/pedidos/${r.data.id_order}`);
                          else load();
                        })
                      }
                    >
                      Aceptar cotización
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void rejectAtelierQuote(x.id_quote).then(load)}>
                      Rechazar
                    </Button>
                  </div>
                ) : null}
                {page === "Pedidos" ? (
                  <Link className="mt-3 inline-block text-sm text-[#DB2777]" to={`/atelier/cliente/pedidos/${x.id_order}`}>
                    Abrir pedido
                  </Link>
                ) : null}
              </article>
            ))
          )}
        </section>
      )}
    </AtelierClienteShell>
  );
}
