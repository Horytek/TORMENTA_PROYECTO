import React from "react";
import { Card, CardHeader, CardBody, CardFooter, Divider, Chip, Spinner } from "@heroui/react";
import useTopProductosMargen from "@/services/reports/data_productos_marge";
import { TrendingUp } from "lucide-react";

export default function TopProductosMargen({ idSucursal, year, month, week, limit = 5 }) {
    const { data, loading, error } = useTopProductosMargen(idSucursal, year, month, week, limit);

    // Gradientes y colores para los indicadores
    const dotColors = [
        "bg-indigo-500",
        "bg-blue-500",
        "bg-sky-500",
        "bg-cyan-500",
        "bg-teal-500",
    ];

    return (
        <Card className="w-full h-full p-2 rounded-3xl shadow-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <CardHeader className="flex flex-col items-start gap-1 pb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <TrendingUp size={18} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Top Margen</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Productos con mayor rentabilidad
                </p>
            </CardHeader>
            <Divider className="bg-slate-100 dark:bg-zinc-800" />
            <CardBody className="py-2">
                {loading ? (
                    <div className="flex justify-center py-8"><Spinner size="lg" color="success" /></div>
                ) : error ? (
                    <div className="text-center text-rose-500 py-8 text-sm">{error}</div>
                ) : !data || data.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                        <p className="text-sm">No hay datos disponibles</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {data.map((product, i) => (
                            <div key={i} className="flex flex-col p-3 rounded-2xl bg-slate-50/50 dark:bg-zinc-800/30 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-zinc-700">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-3 overflow-hidden">
                                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${dotColors[i % dotColors.length]}`}></div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="font-bold text-sm text-slate-800 dark:text-gray-100 truncate leading-snug">
                                                {product.nombre || product.name}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Ventas: S/. {product.ventas?.toLocaleString() ?? product.sales}
                                            </span>
                                        </div>
                                    </div>
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold border border-emerald-200/50 dark:border-emerald-800/30"
                                    >
                                        {product.margen ?? product.margin}%
                                    </Chip>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardBody>
        </Card>
    );
}