import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getEnviosTracking } from "@/features/platform/api/platformProducts";
import { OpsShell } from "@/features/platform/ui/OpsShell";
import { EmptyState } from "@/features/platform/ui/EmptyState";
import { portalButtonClass, portalInputClass } from "@/features/platform/ui/portalTouch";

type Evento = { estado: string; detalle?: string; creado_en: string };
type Tracking = {
  codigo: string;
  estado: string;
  destinatario: string;
  destino: string;
  courier: string;
  eventos?: Evento[];
};

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function TrackingPublicPage() {
  const { codigo: codigoParam = "" } = useParams();
  const [codigo, setCodigo] = useState(codigoParam);
  const [data, setData] = useState<Tracking | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(codigoParam));

  const load = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await getEnviosTracking(code.trim());
      if (!res.success) throw new Error(res.message);
      setData(res.data);
    } catch (e: unknown) {
      setError(errMsg(e, "Guía no encontrada"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codigoParam) load(codigoParam);
  }, [codigoParam]);

  return (
    <OpsShell
      productId="envios"
      companyName="Horytek Envíos"
      roleLabel="Tracking"
      title="Seguimiento"
      width="default"
      showHome
    >
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          load(codigo);
        }}
      >
        <Input
          className={portalInputClass}
          placeholder="Código de guía"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          required
        />
        <Button type="submit" className={`${portalButtonClass} sm:w-auto sm:min-w-[8rem]`}>
          Buscar
        </Button>
      </form>

      {loading ? <p className="text-sm text-black/50">Buscando…</p> : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {data ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">{data.codigo}</p>
            <p className="text-sm text-black/55">
              {data.destinatario} · {data.destino}
            </p>
            <p className="mt-1 text-xs uppercase text-black/45">
              {data.estado} · {data.courier}
            </p>
          </div>
          {(data.eventos || []).length === 0 ? (
            <EmptyState title="Sin eventos" body="Aún no hay movimientos registrados." />
          ) : (
            <ul className="space-y-3 border-t border-black/8 pt-4 text-sm">
              {(data.eventos || []).map((ev, i) => (
                <li key={i}>
                  <span className="font-medium">{ev.estado}</span>
                  {ev.detalle ? <span className="text-black/55"> — {ev.detalle}</span> : null}
                  <p className="text-xs text-black/40">{ev.creado_en}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : !loading && !error ? (
        <EmptyState title="Consulta tu guía" body="Ingresa el código de seguimiento para ver el estado." />
      ) : null}
    </OpsShell>
  );
}
