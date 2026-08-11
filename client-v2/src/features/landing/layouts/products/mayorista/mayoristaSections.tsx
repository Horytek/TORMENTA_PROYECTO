import { useState } from "react";
import { Building2, Check, Minus, Plus, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import { useLayoutChrome } from "../../layoutShared";

type Cuenta = {
  id: string;
  nombre: string;
  lista: string;
  descuento: number;
  minimo: number;
  credito: string;
};

const cuentas: Cuenta[] = [
  { id: "bodega", nombre: "Bodega San Luis", lista: "Distribuidor", descuento: 18, minimo: 12, credito: "15 días" },
  { id: "cadena", nombre: "Mercados Norte", lista: "Cadena", descuento: 24, minimo: 48, credito: "30 días" },
  { id: "horeca", nombre: "Grupo Sazón", lista: "Horeca", descuento: 12, minimo: 6, credito: "Contado" },
];

const precioBase = 18.9;

export function MayoristaAccountSwitcher({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [cuentaId, setCuentaId] = useState(cuentas[0].id);
  const cuenta = cuentas.find((item) => item.id === cuentaId) ?? cuentas[0];
  const precio = precioBase * (1 - cuenta.descuento / 100);

  return (
    <section className="border-b border-black/5 py-20 md:py-28" style={{ backgroundColor: accent.sectionTint }}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: accent.accent }}>Portal por comprador</p>
        <h2 className={cn(displayClass, "mt-3 max-w-2xl text-[clamp(1.9rem,4vw,2.8rem)]")}>Cada cuenta ve su propio negocio.</h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-[18rem_1fr]">
          <div className="space-y-2 rounded-2xl border border-black/5 bg-white/70 p-2">
            {cuentas.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCuentaId(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-4 py-4 text-left transition",
                  cuentaId === item.id ? "text-white shadow-sm" : "hover:bg-black/[0.04]",
                )}
                style={cuentaId === item.id ? { backgroundColor: accent.accent } : undefined}
              >
                <Building2 className="h-4 w-4 shrink-0" />
                <span><strong className="block text-sm">{item.nombre}</strong><small className="opacity-70">{item.lista}</small></span>
              </button>
            ))}
          </div>
          <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b p-6">
              <div><p className="text-xs text-muted-foreground">Sesión comercial</p><p className="mt-1 text-lg font-semibold">{cuenta.nombre}</p></div>
              <span className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ color: accent.accent, backgroundColor: `${accent.accent}12` }}>Lista {cuenta.lista}</span>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-3">
              <Dato label="Precio base" value={`S/ ${precioBase.toFixed(2)}`} tachado />
              <Dato label={`Descuento ${cuenta.descuento}%`} value={`S/ ${precio.toFixed(2)}`} />
              <Dato label="Pedido mínimo" value={`${cuenta.minimo} un.`} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Dato({ label, value, tachado = false }: { label: string; value: string; tachado?: boolean }) {
  return (
    <div className="rounded-xl bg-black/[0.035] p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-2 font-mono text-xl font-semibold", tachado && "text-muted-foreground line-through")}>{value}</p>
    </div>
  );
}

export function MayoristaOrderBuilder({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [cantidad, setCantidad] = useState(8);
  const minimo = 12;
  const habilitado = cantidad >= minimo;
  const cambiar = (delta: number) => setCantidad((valor) => Math.max(1, valor + delta));

  return (
    <section className="border-b border-black/5 py-20 md:py-28" style={{ backgroundColor: accent.surface }}>
      <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: accent.accent }}>Reglas en el carrito</p>
          <h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.5vw,2.5rem)]")}>El mínimo se entiende antes de enviar.</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Ajusta la cantidad y prueba cómo cambia la condición comercial.</p>
        </div>
        <div className="rounded-3xl border border-black/5 bg-white p-7 shadow-[0_24px_60px_-36px_var(--lp-accent)]">
          <div className="flex items-center justify-between"><div><p className="font-semibold">Aceite premium · caja</p><p className="text-xs text-muted-foreground">Mínimo: {minimo} unidades</p></div><p className="font-mono font-semibold">S/ 15.50</p></div>
          <div className="mt-8 flex items-center justify-center gap-5">
            <button type="button" onClick={() => cambiar(-1)} className="rounded-full border p-3" aria-label="Restar una unidad"><Minus className="h-4 w-4" /></button>
            <span className="w-20 text-center font-mono text-4xl font-semibold tabular-nums">{cantidad}</span>
            <button type="button" onClick={() => cambiar(1)} className="rounded-full border p-3" aria-label="Sumar una unidad"><Plus className="h-4 w-4" /></button>
          </div>
          <div className="mt-7 h-2 overflow-hidden rounded-full bg-black/[0.06]">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (cantidad / minimo) * 100)}%`, backgroundColor: habilitado ? "#16a34a" : accent.accent }} />
          </div>
          <p className={cn("mt-3 text-center text-xs font-semibold", habilitado ? "text-emerald-600" : "text-muted-foreground")}>
            {habilitado ? "Pedido habilitado para enviar" : `Agrega ${minimo - cantidad} para alcanzar el mínimo`}
          </p>
        </div>
      </div>
    </section>
  );
}

export function MayoristaTermsDesk({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [aprobado, setAprobado] = useState(false);

  return (
    <section className="border-b border-black/5 py-20 md:py-28" style={{ backgroundColor: accent.sectionTint }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: accent.accent }}>Mesa de condiciones</p><h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.5vw,2.5rem)]")}>Crédito claro para ambas partes.</h2></div>
          <button type="button" onClick={() => setAprobado((valor) => !valor)} className="rounded-xl px-5 py-3 text-xs font-semibold text-white" style={{ backgroundColor: aprobado ? "#16a34a" : accent.accent }}>{aprobado ? "Crédito aprobado" : "Simular aprobación"}</button>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {["Línea S/ 12,000", "Pago a 30 días", "Vendedor: Camila R."].map((dato) => (
            <div key={dato} className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-5">
              {aprobado ? <Check className="h-5 w-5 text-emerald-600" /> : <ShieldCheck className="h-5 w-5" style={{ color: accent.accent }} />}
              <span className="text-sm font-medium">{dato}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
