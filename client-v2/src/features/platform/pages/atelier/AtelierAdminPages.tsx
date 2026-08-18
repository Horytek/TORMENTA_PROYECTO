import { useEffect, useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { AtelierAdminFrame } from "@/features/atelier/components/AtelierAdminFrame";
import { AtelierButton } from "@/features/atelier/components/AtelierButton";
import { ATELIER_COPY } from "@/features/atelier/copy";
import { atelierStatusMeta } from "@/features/atelier/status";
import {
  getAtelierAdminDashboard,
  getAtelierCommission,
  listAtelierAdminOrders,
  listAtelierAdminUsers,
  updateAtelierCommission,
} from "@/features/platform/api/atelier";

const money = (v: unknown) => `S/ ${Number(v || 0).toFixed(2)}`;

export default function AtelierAdminPages() {
  const location = useLocation();
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [pending, setPending] = useState<{
    percent: number;
    min_fee: number | null;
    max_fee: number | null;
  } | null>(null);

  const page = location.pathname.includes("pedidos")
    ? "Encargos"
    : location.pathname.includes("usuarios")
      ? "Usuarios"
      : location.pathname.includes("comision")
        ? "Comisión"
        : "Resumen";

  const load = () => {
    const fn =
      page === "Encargos"
        ? listAtelierAdminOrders
        : page === "Usuarios"
          ? listAtelierAdminUsers
          : page === "Comisión"
            ? getAtelierCommission
            : getAtelierAdminDashboard;
    void fn()
      .then((r: any) => setData(r.data))
      .catch(() => setData(null));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const rows = Array.isArray(data) ? data : [];
  const kpis = [
    { key: "gmv", label: "GMV", value: money(data?.gmv) },
    { key: "fees", label: "Fees (guardados)", value: money(data?.fees) },
    { key: "orders_count", label: "Encargos", value: String(data?.orders_count ?? 0) },
  ];

  const submitCommission = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPending({
      percent: Number(fd.get("percent")),
      min_fee: fd.get("min_fee") ? Number(fd.get("min_fee")) : null,
      max_fee: fd.get("max_fee") ? Number(fd.get("max_fee")) : null,
    });
    setConfirmSave(true);
  };

  const persistCommission = () => {
    if (!pending) return;
    setSaving(true);
    void updateAtelierCommission({
      scope: "global",
      percent: pending.percent,
      min_fee: pending.min_fee,
      max_fee: pending.max_fee,
      activo: true,
    })
      .then(load)
      .finally(() => {
        setSaving(false);
        setConfirmSave(false);
        setPending(null);
      });
  };

  return (
    <AtelierAdminFrame
      title={page}
      subtitle={page === "Resumen" ? "Operación y salud de Atelier." : undefined}
    >
      {page === "Comisión" ? (
        <div className="at-admin-rule">
          <form className="at-admin-rule-form" onSubmit={submitCommission}>
            <p className="at-eyebrow">Regla global</p>
            <label className="at-field">
              <span>Porcentaje</span>
              <input
                name="percent"
                type="number"
                step="0.01"
                defaultValue={data?.percent ?? 10}
                className="at-field-input at-focus"
                required
              />
            </label>
            <label className="at-field">
              <span>Mínimo S/</span>
              <input
                name="min_fee"
                type="number"
                step="0.01"
                defaultValue={data?.min_fee ?? ""}
                className="at-field-input at-focus"
              />
            </label>
            <label className="at-field">
              <span>Máximo S/</span>
              <input
                name="max_fee"
                type="number"
                step="0.01"
                defaultValue={data?.max_fee ?? ""}
                className="at-field-input at-focus"
              />
            </label>
            <AtelierButton type="submit" disabled={saving}>
              Guardar comisión
            </AtelierButton>
          </form>
          <p className="at-ui at-admin-rule-note">
            Se aplica al crear la propuesta. El desglose del encargo ya queda guardado. No se
            recalcula el porcentaje en el cliente.
          </p>
        </div>
      ) : page === "Resumen" ? (
        <div className="at-kpi-row">
          {kpis.map((kpi) => (
            <article key={kpi.key} className="at-kpi">
              <p className="at-eyebrow">{kpi.label}</p>
              <p className="at-display at-kpi-n">{kpi.value}</p>
            </article>
          ))}
        </div>
      ) : page === "Encargos" ? (
        <div className="at-table-wrap">
          <table className="at-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Encargo</th>
                <th>Cliente</th>
                <th>Artista</th>
                <th>Estado</th>
                <th className="is-num">Bruto</th>
                <th className="is-num">Fee</th>
                <th className="is-num">Neto</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id_order}>
                  <td className="is-num">#{row.id_order}</td>
                  <td>{row.titulo || "—"}</td>
                  <td>{row.cliente_email}</td>
                  <td>{row.creador_email}</td>
                  <td>{atelierStatusMeta(row.estado).label}</td>
                  <td className="is-num">{money(row.gross_amount)}</td>
                  <td className="is-num">{money(row.platform_fee)}</td>
                  <td className="is-num">{money(row.creator_net)}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td className="at-ui text-[var(--at-stone)]" colSpan={8}>
                    No hay encargos.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="at-table-wrap">
          <table className="at-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id_user}>
                  <td className="is-num">#{row.id_user}</td>
                  <td>{row.nombre}</td>
                  <td>{row.email}</td>
                  <td className="capitalize">{row.role}</td>
                  <td>{row.activo ? "Activo" : "Inactivo"}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td className="at-ui text-[var(--at-stone)]" colSpan={5}>
                    No hay usuarios.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {confirmSave ? (
        <div className="at-confirm-scrim" role="presentation" onClick={() => !saving && setConfirmSave(false)}>
          <div
            role="dialog"
            aria-modal="true"
            className="at-confirm"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="at-eyebrow">{ATELIER_COPY.commissionRule}</p>
            <h2 className="at-display at-confirm-title">¿Guardar la regla?</h2>
            <p className="at-ui at-confirm-body">
              {pending
                ? `${pending.percent}% · mínimo ${pending.min_fee ?? "—"} · máximo ${pending.max_fee ?? "—"}. Afecta propuestas nuevas.`
                : ""}
            </p>
            <div className="at-confirm-actions">
              <AtelierButton variant="tertiary" disabled={saving} onClick={() => setConfirmSave(false)}>
                Cancelar
              </AtelierButton>
              <AtelierButton disabled={saving} onClick={persistCommission}>
                {saving ? "Guardando…" : "Guardar"}
              </AtelierButton>
            </div>
          </div>
        </div>
      ) : null}
    </AtelierAdminFrame>
  );
}
