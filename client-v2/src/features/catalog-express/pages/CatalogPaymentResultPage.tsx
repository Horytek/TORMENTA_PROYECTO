import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { syncPago } from "../api/catalogoPublico";
import { CatalogShell } from "../components/CatalogShell";

export default function CatalogPaymentResultPage() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const status = params.get("status") || "pending";
  const codigo = params.get("codigo") || "";

  const { data, refetch } = useQuery({
    queryKey: ["sync-pago", slug, codigo],
    queryFn: () => syncPago(slug!, codigo),
    enabled: !!slug && !!codigo,
    refetchInterval: status === "pending" ? 4000 : false,
  });

  useEffect(() => {
    if (status === "success" && codigo) refetch();
  }, [status, codigo, refetch]);

  const estado = data?.estado || status;
  const Icon =
    estado === "pagado" || status === "success"
      ? CheckCircle2
      : status === "failure"
        ? XCircle
        : Clock;

  return (
    <CatalogShell>
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <Icon
          className={`size-14 mx-auto ${
            estado === "pagado" || status === "success"
              ? "text-emerald-600"
              : status === "failure"
                ? "text-red-500"
                : "text-amber-500"
          }`}
        />
        <h1 className="text-2xl font-bold">
          {estado === "pagado" || status === "success"
            ? "¡Pago confirmado!"
            : status === "failure"
              ? "Pago no completado"
              : "Pedido registrado"}
        </h1>
        {codigo && (
          <p className="text-sm text-stone-500">
            Código: <span className="font-mono font-semibold text-stone-800">{codigo}</span>
          </p>
        )}
        {data?.id_venta && (
          <p className="text-xs text-stone-400">Venta ERP #{data.id_venta}</p>
        )}
        <div className="flex flex-col gap-2 pt-4">
          <Link
            to={`/c/${slug}/cuenta/pedidos`}
            className="h-11 rounded-full bg-stone-900 text-white text-sm font-semibold inline-flex items-center justify-center"
          >
            Ver mis pedidos
          </Link>
          <Link to={`/c/${slug}`} className="text-sm underline text-stone-500">
            Volver a la tienda
          </Link>
        </div>
      </div>
    </CatalogShell>
  );
}
