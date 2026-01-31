import { Info, CheckCircle, XCircle, Building2, Mail, Phone, MapPin, CalendarClock, Banknote, Shield, Users, Sparkles } from "lucide-react";

export default function AccountInfo({
    empresa, ruc, logo, correo, telefono, direccion,
    vencimiento, costo, plan_pago, estado,
    trialInfo, responsables, allFunciones, isEnabled
}) {
    const planLabel = String(plan_pago) === "1" ? "Enterprise" : String(plan_pago) === "2" ? "Pro" : "Basic";

    return (
        <div className="space-y-4 px-1">
            {/* Company Header Card */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="p-5">
                    <div className="flex items-start gap-4">
                        {logo ? (
                            <img
                                src={logo}
                                alt="Logo empresa"
                                className="w-14 h-14 rounded-xl border border-slate-200 dark:border-zinc-700 object-contain bg-white shadow-sm"
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-900/10 border border-indigo-200/50 dark:border-indigo-800/30 flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h2 className="font-bold text-slate-800 dark:text-white text-lg leading-tight truncate" title={empresa}>
                                {empresa}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                                    RUC: {ruc}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 p-4 grid grid-cols-2 gap-4">
                    <DataItem icon={<Mail className="w-3.5 h-3.5" />} label="Correo" value={correo} />
                    <DataItem icon={<Phone className="w-3.5 h-3.5" />} label="Teléfono" value={telefono} />
                    <DataItem icon={<MapPin className="w-3.5 h-3.5" />} label="Dirección" value={direccion} />
                    <DataItem icon={<CalendarClock className="w-3.5 h-3.5" />} label="Vencimiento" value={vencimiento ? new Date(vencimiento).toLocaleDateString() : "Sin fecha"} />
                    <DataItem icon={<Banknote className="w-3.5 h-3.5" />} label="Costo" value={costo} />
                    <DataItem icon={<Shield className="w-3.5 h-3.5" />} label="Estado" value={`${planLabel} • ${estado}`} />
                </div>
            </div>

            {/* Trial / Production Banner */}
            {trialInfo.isTrial ? (
                <TrialBanner trialInfo={trialInfo} />
            ) : (
                <ProdBanner />
            )}

            {/* Responsables */}
            {responsables?.length > 0 && (
                <Responsables responsables={responsables} />
            )}

            {/* Benefits Card */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wide">Beneficios Incluidos</span>
                    </div>
                </div>
                <div className="p-4 space-y-2">
                    {allFunciones.map(f => {
                        const enabled = isEnabled(f.id_funciones);
                        return (
                            <div key={f.id_funciones} className={`flex items-center justify-between py-1.5 px-3 rounded-lg transition-colors ${enabled ? "bg-emerald-50/50 dark:bg-emerald-900/10" : "opacity-60"}`}>
                                <div className="flex items-center gap-3">
                                    {enabled ? (
                                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-slate-400 dark:text-zinc-600" />
                                    )}
                                    <span className={`text-sm ${enabled ? "text-slate-700 dark:text-zinc-200 font-medium" : "text-slate-500 dark:text-zinc-500"}`}>
                                        {f.funcion}
                                    </span>
                                </div>
                                {!enabled && <span className="text-[10px] text-slate-400 dark:text-zinc-600 uppercase tracking-wide">No incluido</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer Hint */}
            <div className="px-2 py-3 text-xs text-slate-400 dark:text-zinc-500 text-center leading-relaxed">
                Información básica de la cuenta. Para más detalles o editar datos pulsa <span className="font-semibold text-slate-500 dark:text-zinc-400">"Gestionar datos"</span>.
            </div>
        </div>
    );
}

/* Subcomponentes internos */

function DataItem({ icon, label, value }) {
    return (
        <div className="flex items-start gap-2">
            <div className="mt-0.5 text-slate-400 dark:text-zinc-500">{icon}</div>
            <div className="min-w-0 flex-1">
                <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wide">{label}</span>
                <div className="text-sm font-medium text-slate-700 dark:text-zinc-200 truncate" title={value}>{value || "-"}</div>
            </div>
        </div>
    );
}

function TrialBanner({ trialInfo }) {
    return (
        <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-200/80 dark:border-amber-800/30 p-4">
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                        Periodo de prueba activo
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                        Quedan <span className="font-bold">{trialInfo.daysLeft}</span> días.
                        {trialInfo.extended && (
                            <span className="ml-1 opacity-80">(extendido por falta de ventas/productos)</span>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}

function ProdBanner() {
    return (
        <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10 border border-emerald-200/80 dark:border-emerald-800/30 p-4">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                        Producción activa
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Tu cuenta está funcionando en modo producción.
                    </p>
                </div>
            </div>
        </div>
    );
}

function Responsables({ responsables }) {
    return (
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wide">Responsables</span>
            </div>
            <div className="space-y-2">
                {responsables.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                            {r.nombre?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="text-slate-700 dark:text-zinc-200 font-medium">{r.nombre}</span>
                        <span className="text-xs text-slate-400 dark:text-zinc-500">({r.rol})</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

