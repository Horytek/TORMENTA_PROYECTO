import { useEffect, useState } from "react";
import {
  Shield,
  Check,
  Lock,
  User as UserIcon,
  Edit,
  Eye,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ACCESS_MATRIX,
  ACTION_STYLES,
  AUDIT_ACTIONS,
  PERMISSIONS,
  ROLES,
  type Action,
} from "../data/landing.data";

type AuditStatus = "OK" | "AUTH";

interface AuditEntry {
  id: number;
  action: string;
  time: string;
  status: AuditStatus;
}

const ROLE_ICONS: Record<string, LucideIcon> = {
  user: UserIcon,
  shield: Shield,
  lock: Lock,
};

const ACTION_ICONS: Record<Action, LucideIcon> = {
  create: Edit,
  read: Eye,
  update: Edit,
  delete: Trash2,
  export: Check,
};

/**
 * Matriz interactiva de permisos por rol.
 * Versión "calma" del original: sin framer-motion, con transiciones CSS y
 * audit log generado por un setInterval (se desmonta al salir del viewport).
 */
export function LivePermissions() {
  const [activeRole, setActiveRole] = useState<string>("sales");
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([
    { id: 0, action: "SYSTEM_INIT", time: "10:00:00", status: "OK" },
  ]);

  useEffect(() => {
    const tick = () => {
      const action = AUDIT_ACTIONS[Math.floor(Math.random() * AUDIT_ACTIONS.length)];
      const time = formatTime(new Date());
      setAuditLog((prev) =>
        [...prev, { id: Date.now(), action, time, status: "OK" as AuditStatus }].slice(-5),
      );
    };
    const id = setInterval(tick, 2500);
    return () => clearInterval(id);
  }, []);

  const handleRoleChange = (roleId: string) => {
    setActiveRole(roleId);
    const time = formatTime(new Date());
    setAuditLog((prev) =>
      [...prev, { id: Date.now(), action: `SWITCH_ROLE_${roleId.toUpperCase()}`, time, status: "AUTH" as AuditStatus }].slice(-5),
    );
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Selector de roles + audit log */}
        <aside className="space-y-4 lg:col-span-4">
          <h3 className="flex items-center gap-2 text-[14px] font-semibold tracking-tight text-foreground">
            <Lock className="h-4 w-4 text-brand" aria-hidden />
            Roles & Perfiles
          </h3>

          <div role="radiogroup" aria-label="Rol" className="space-y-2">
            {ROLES.map((role) => {
              const Icon = ROLE_ICONS[role.icon] ?? UserIcon;
              const isActive = activeRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => handleRoleChange(role.id)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition-colors",
                    isActive
                      ? "border-brand bg-brand/5"
                      : "border-border bg-card hover:border-foreground/20",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "bg-brand text-brand-foreground"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold text-foreground">{role.label}</div>
                      <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                        {role.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Audit log mini */}
          <div className="num rounded-lg border border-border bg-foreground/[0.03] p-3 font-mono text-[10px]">
            <div className="mb-2 flex items-center justify-between border-b border-border pb-1.5 text-muted-foreground">
              <span className="uppercase tracking-[0.16em]">Live audit log</span>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            </div>
            <ul className="space-y-1" aria-live="polite">
              {auditLog.map((log) => (
                <li
                  key={log.id}
                  className="flex justify-between text-foreground/70 transition-opacity duration-300"
                >
                  <span>
                    [{log.time}] {log.action}
                  </span>
                  <span
                    className={cn(
                      log.status === "AUTH" ? "text-amber-600" : "text-emerald-600",
                    )}
                  >
                    {log.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Matriz de acceso */}
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-5 backdrop-blur-sm lg:col-span-8">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
              Matriz de Acceso
            </h3>
            <span className="num rounded border border-border bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
              {activeRole}_POLICY
            </span>
          </div>

          <ul className="space-y-2">
            {PERMISSIONS.map((perm) => {
              const actions = ACCESS_MATRIX[activeRole]?.[perm.id] ?? [];
              const hasAccess = actions.length > 0;
              return (
                <li
                  key={perm.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3 transition-colors",
                    hasAccess
                      ? "border-brand/40 bg-brand/5"
                      : "border-border bg-foreground/[0.02]",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full transition-colors",
                        hasAccess ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted",
                      )}
                    />
                    <span
                      className={cn(
                        "text-[13px] font-medium transition-colors",
                        hasAccess ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {perm.label}
                    </span>
                  </div>

                  {hasAccess ? (
                    <div className="flex flex-wrap gap-1.5">
                      {actions.map((action) => {
                        const Icon = ACTION_ICONS[action];
                        const style = ACTION_STYLES[action];
                        return (
                          <span
                            key={action}
                            title={style.label}
                            className={cn(
                              "flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
                              style.color,
                              style.bg,
                            )}
                          >
                            <Icon className="h-3 w-3" aria-hidden />
                            <span className="hidden sm:inline">{style.label}</span>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] italic text-muted-foreground/70">
                      <Lock className="h-3 w-3" aria-hidden /> Sin acceso
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Diagrama de flujo arriba */}
      <div className="mt-10 hidden items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground lg:flex">
        <Pill>EMPRESA</Pill>
        <Dash />
        <Pill>SUCURSALES</Pill>
        <Dash />
        <Pill highlight>ROLES</Pill>
        <Dash />
        <Pill>USUARIOS</Pill>
      </div>
    </div>
  );
}

function Pill({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <span
      className={cn(
        "rounded border px-3 py-1.5 text-[10px] font-medium tracking-[0.14em]",
        highlight
          ? "border-brand text-brand"
          : "border-border text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

function Dash() {
  return <span className="h-px w-8 bg-border" />;
}

function formatTime(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}