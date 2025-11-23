import { Info, CheckCircle, XCircle } from "lucide-react";

export default function AccountInfo({
    empresa, ruc, logo, correo, telefono, direccion,
    vencimiento, costo, plan_pago, estado,
    trialInfo, responsables, allFunciones, isEnabled
}) {
    return (
        <div className="rounded-2xl bg-gradient-to-br from-bgDark1/80 via-bgDark2/80 to-bgDark1/80 dark:from-zinc-900/80 dark:via-zinc-900/70 dark:to-zinc-900/80 border border-gray-100/20 dark:border-zinc-700/30 shadow-sm p-5">
            <div className="flex items-center gap-4 mb-4">
                {logo && (
                    <img
                        src={logo}
                        alt="Logo empresa"
                        className="w-12 h-12 rounded-lg border border-gray-200 dark:border-zinc-700 object-contain bg-white"
                    />
                )}
                <div>
                    <div
                        className="font-bold text-blue-900 dark:text-blue-100 text-lg break-words leading-tight max-w-[260px]"
                        title={empresa}
                    >
                        {empresa}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-zinc-400">RUC: {ruc}</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-blue-100 mb-2">
                <DataItem label="Correo" value={correo} />
                <DataItem label="Teléfono" value={telefono} />
                <DataItem label="Dirección" value={direccion} />
                <DataItem
                    label="Vencimiento"
                    value={vencimiento ? new Date(vencimiento).toLocaleDateString() : "Sin fecha"}
                />
                <DataItem label="Costo" value={costo} />
                <DataItem label="Resumen" value={`Plan ${String(plan_pago) || "-"} • ${estado}`} />
            </div>

            <div className="mb-2">
                {trialInfo.isTrial ? (
                    <TrialBanner trialInfo={trialInfo} />
                ) : (
                    <ProdBanner />
                )}
            </div>

            {responsables?.length > 0 && (
                <Responsables responsables={responsables} />
            )}

            <DividerLine />
            <Beneficios allFunciones={allFunciones} isEnabled={isEnabled} />
            <FooterHint />
        </div>
    );
}

/* Subcomponentes internos */

function DataItem({ label, value }) {
    return (
        <div>
            <span className="text-xs text-gray-500 dark:text-zinc-400">{label}</span>
            <div className="font-medium truncate">{value}</div>
        </div>
    );
}

function TrialBanner({ trialInfo }) {
    return (
        <div className="flex items-center gap-2 text-yellow-700 text-sm">
            <Info className="w-4 h-4" />
            <span>
                Periodo de prueba activo. Quedan {trialInfo.daysLeft} días.
                {trialInfo.extended && (
                    <span className="ml-2 text-xs text-yellow-600">(extendido por falta de ventas/productos)</span>
                )}
            </span>
        </div>
    );
}

function ProdBanner() {
    return (
        <div className="flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Producción activa.</span>
        </div>
    );
}

function Responsables({ responsables }) {
    return (
        <div className="mb-2">
            <span className="text-xs text-gray-500 dark:text-zinc-400">Responsables</span>
            <ul className="text-xs text-gray-700 dark:text-blue-100 ml-2 list-disc">
                {responsables.map((r, i) => (
                    <li key={i}>{r.nombre} ({r.rol})</li>
                ))}
            </ul>
        </div>
    );
}

function DividerLine() {
    return <div className="my-3 h-px bg-gradient-to-r from-gray-100 to-transparent dark:from-zinc-800/30" />;
}

function Beneficios({ allFunciones, isEnabled }) {
    return (
        <div>
            <div className="mb-2 text-xs text-gray-500 dark:text-zinc-400">Beneficios disponibles</div>
            <div className="space-y-2">
                {allFunciones.map(f => {
                    const enabled = isEnabled(f.id_funciones);
                    return (
                        <div key={f.id_funciones} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {enabled ? (
                                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                                )}
                                <span className={`text-sm ${enabled ? "text-gray-800 dark:text-blue-100" : "text-gray-500 dark:text-zinc-400"}`}>
                                    {f.funcion}
                                </span>
                            </div>
                            {!enabled && <span className="text-xs text-gray-400 dark:text-zinc-500">No incluido</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function FooterHint() {
    return (
        <div className="mt-4 text-xs text-gray-500 dark:text-zinc-400">
            <p className="leading-snug">
                Información básica de la cuenta. Para más detalles o editar datos pulsa "Gestionar datos".
            </p>
        </div>
    );
}
