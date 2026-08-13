import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QrCode, Star } from "lucide-react";
import { buyerGetPedido, getReviewEligibilidad } from "../api/ecommerce";
import { formatPen } from "../types/storefront";
import { AttrsSnapshotText } from "../components/AttrsSnapshotText";
import { Button } from "@/components/ui/button";
import {
  BUYER_BADGE_CLASS,
  buyerBadgeFromFulfillment,
} from "../utils/buyerOrderStatus";
import { cn } from "@/lib/utils";
import { ReviewForm } from "../components/reviews/ReviewForm";
// notifyPickupReady — stub futuro cuando el pedido pasa a listo_recoger
// scheduleReviewInvite — stub fase 2 post-entrega (email/WhatsApp)

function formatHorario(horarioJson: unknown): string | null {
  if (!horarioJson) return null;
  try {
    const raw =
      typeof horarioJson === "string" ? JSON.parse(horarioJson) : horarioJson;
    if (!raw || typeof raw !== "object") return null;
    const entries = Object.entries(raw as Record<string, unknown>)
      .map(([day, val]) => {
        if (val == null || val === "") return null;
        if (typeof val === "string") return `${day}: ${val}`;
        if (typeof val === "object" && val !== null) {
          const v = val as { abierto?: string; cerrado?: string; open?: string; close?: string };
          const a = v.abierto || v.open;
          const c = v.cerrado || v.close;
          if (a && c) return `${day}: ${a}–${c}`;
        }
        return null;
      })
      .filter(Boolean);
    return entries.length ? entries.join(" · ") : null;
  } catch {
    return typeof horarioJson === "string" ? horarioJson : null;
  }
}

export default function StoreOrderDetailPage() {
  const { slug = "", id = "" } = useParams();
  const id_orden = Number(id);
  const qc = useQueryClient();
  const [writingReview, setWritingReview] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["buyer-pedido", slug, id_orden],
    queryFn: () => buyerGetPedido(slug, id_orden),
    enabled: Boolean(slug && id_orden),
  });
  const pedido = data?.data;
  const entregado = pedido?.estado_fulfillment === "entregado";

  const eligQ = useQuery({
    queryKey: ["review-elig", slug, "pedido", id_orden],
    queryFn: () => getReviewEligibilidad(slug, { tipo: "pedido", id_orden }),
    enabled: Boolean(slug && id_orden && entregado),
  });

  if (isLoading) return <p className="store-muted">Cargando…</p>;
  if (!pedido) return <p className="store-muted">Pedido no encontrado.</p>;

  const listo = pedido.estado_fulfillment === "listo_recoger";
  const badge = buyerBadgeFromFulfillment(pedido.estado_fulfillment);
  const horario = formatHorario(pedido.horario_json);
  const tel = pedido.sucursal_telefono || pedido.sucursal_whatsapp;
  const puedeOpinar = Boolean(eligQ.data?.data?.puede);
  const fulfillmentLabel =
    pedido.fulfillment === "delivery" || pedido.fulfillment === "envio"
      ? "entrega"
      : "recojo";

  return (
    <div className="space-y-6">
      <Link to={`/tienda/${slug}/cuenta/pedidos`} className="text-sm store-muted hover:underline">
        ← Mis pedidos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{pedido.codigo}</h2>
          <span
            className={cn(
              "inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-md",
              BUYER_BADGE_CLASS[badge.kind]
            )}
          >
            {badge.label}
          </span>
        </div>
        <p className="font-semibold text-lg" style={{ color: "var(--vitrina-accent)" }}>
          {formatPen(Number(pedido.total))}
        </p>
      </div>

      {listo && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-4">
          <div>
            <p className="text-lg font-semibold text-emerald-900">¡Tu pedido está listo!</p>
            <p className="text-sm text-emerald-800/80 mt-1">
              Presenta el código QR en la sucursal para retirarlo.
            </p>
          </div>
          <Button asChild className="w-full min-h-14 text-base">
            <Link to={`/tienda/${slug}/cuenta/pedidos/${id_orden}/qr`}>
              <QrCode className="size-5 mr-2" />
              Mostrar QR
            </Link>
          </Button>
        </div>
      )}

      {entregado && puedeOpinar && !writingReview && (
        <div className="rounded-2xl border store-hairline bg-[var(--vitrina-elevated)] p-5 space-y-3">
          <div className="flex items-start gap-3">
            <Star className="size-5 shrink-0 text-amber-400 fill-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold">¿Cómo fue tu experiencia de {fulfillmentLabel}?</p>
              <p className="text-sm store-muted mt-1">
                Tu opinión nos ayuda a mejorar el servicio.
              </p>
            </div>
          </div>
          <Button type="button" onClick={() => setWritingReview(true)}>
            Escribir opinión
          </Button>
        </div>
      )}

      {writingReview && (
        <div className="rounded-2xl border store-hairline bg-[var(--vitrina-elevated)] p-5">
          <ReviewForm
            slug={slug}
            tipo="pedido"
            id_orden={id_orden}
            id_sucursal={pedido.id_sucursal ? Number(pedido.id_sucursal) : undefined}
            onCancel={() => setWritingReview(false)}
            onSuccess={() => {
              setWritingReview(false);
              qc.invalidateQueries({ queryKey: ["review-elig", slug, "pedido", id_orden] });
              qc.invalidateQueries({ queryKey: ["mis-reviews", slug] });
            }}
          />
        </div>
      )}

      <div className="vitrina-card border store-hairline p-4 bg-[var(--vitrina-elevated)] space-y-2 text-sm">
        <p className="font-medium">Sucursal de recojo</p>
        <p>{pedido.sucursal_nombre || "—"}</p>
        <p className="store-muted">
          {pedido.pickup_direccion || pedido.sucursal_direccion || "—"}
        </p>
        {tel && (
          <p>
            <span className="store-muted">Teléfono:</span> {tel}
          </p>
        )}
        {horario && (
          <p>
            <span className="store-muted">Horario:</span> {horario}
          </p>
        )}
      </div>

      <ul className="space-y-2">
        {(pedido.items || []).map((item: Record<string, unknown>, i: number) => (
          <li
            key={i}
            className="flex justify-between text-sm vitrina-card border store-hairline p-3 bg-[var(--vitrina-elevated)]"
          >
            <span>
              {String(item.nombre)} × {Number(item.cantidad)}
              <AttrsSnapshotText snapshot={item.attrs_snapshot} className="text-xs store-muted mt-0.5" />
            </span>
            <span>{formatPen(Number(item.precio_unitario) * Number(item.cantidad))}</span>
          </li>
        ))}
      </ul>

      {pedido.historial?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Historial</h3>
          <ul className="text-xs store-muted space-y-1">
            {pedido.historial.map((h: Record<string, unknown>, i: number) => (
              <li key={i}>
                {new Date(String(h.created_at)).toLocaleString("es-PE")} —{" "}
                {buyerBadgeFromFulfillment(String(h.estado_nuevo)).label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
