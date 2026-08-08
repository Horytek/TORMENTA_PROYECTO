import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getEnviosTracking } from "@/features/platform/api/platformProducts";

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
    <div className="min-h-screen bg-[linear-gradient(160deg,#f7f5f1_0%,#eef2f4_45%,#f4f7f5_100%)]">
      <div className="mx-auto max-w-lg px-6 py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">Envíos</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">Seguimiento</h1>

        <form
          className="mt-8 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            load(codigo);
          }}
        >
          <Input
            placeholder="Código de guía"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            required
          />
          <Button type="submit">Buscar</Button>
        </form>

        {loading && <p className="mt-8 text-sm text-stone-500">Buscando…</p>}
        {error && (
          <p className="mt-8 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {data && (
          <div className="mt-10 space-y-4">
            <div>
              <p className="text-sm font-medium text-stone-900">{data.codigo}</p>
              <p className="text-sm text-stone-600">
                {data.destinatario} · {data.destino}
              </p>
              <p className="mt-1 text-xs uppercase text-stone-500">
                {data.estado} · {data.courier}
              </p>
            </div>
            {(data.eventos || []).length === 0 ? (
              <p className="text-sm text-stone-500">Sin eventos aún.</p>
            ) : (
              <ul className="space-y-3 border-t border-stone-200/80 pt-4 text-sm">
                {(data.eventos || []).map((ev, i) => (
                  <li key={i}>
                    <span className="font-medium">{ev.estado}</span>
                    {ev.detalle && <span className="text-stone-600"> — {ev.detalle}</span>}
                    <p className="text-xs text-stone-400">{ev.creado_en}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <Link to="/" className="mt-12 inline-block text-sm text-stone-500 underline">
          Inicio
        </Link>
      </div>
    </div>
  );
}
