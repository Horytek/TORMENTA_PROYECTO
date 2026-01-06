import React from "react";
import { Card, CardHeader, CardBody, CardFooter, Chip, Tooltip, Divider, Spinner } from "@heroui/react";
import { DonutChart } from '@tremor/react';
import { useCantidadVentasPorSubcategoria } from '@/services/reportes.services';
import { Tag } from "lucide-react";

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

const currencyFormatter = (number) => {
    return Intl.NumberFormat('us').format(number).toString();
};

export default function CategoriaProducto({ idSucursal, year, month, week }) {
    const { data, loading, error } = useCantidadVentasPorSubcategoria(idSucursal, year, month, week);

    const colors = [
        "bg-blue-500",
        "bg-indigo-500",
        "bg-sky-500",
        "bg-cyan-500",
        "bg-violet-500",
    ];

    const donutColors = ['blue', 'indigo', 'sky', 'cyan', 'violet'];

    const total = data.reduce((sum, item) => sum + Number(item.cantidad_vendida), 0);

    const salesData = data.map((subcat, index) => ({
        name: subcat.subcategoria,
        amount: Number(subcat.cantidad_vendida),
        share: total ? ((Number(subcat.cantidad_vendida) / total) * 100).toFixed(1) + '%' : '0%',
        color: colors[index % colors.length],
    }));

    const CustomTooltip = ({ payload, active }) => {
        if (!active || !payload || payload.length === 0) return null;
        const category = payload[0];
        return (
            <div className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm p-3 shadow-xl">
                <div className="flex items-center gap-2 mb-1">
                    <span
                        className="w-2 h-2 rounded-full shadow-sm"
                        style={{ backgroundColor: category.color }}
                    />
                    <p className="text-sm font-bold text-slate-700 dark:text-white">
                        {category.payload.name}
                    </p>
                </div>
                <div className="flex justify-between items-center gap-4">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Ventas</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                        {currencyFormatter(category.value)}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <Card className="w-full h-full p-2 rounded-3xl shadow-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 transition-all">
            <CardHeader className="flex flex-col items-start gap-1 pb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <Tag size={18} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                        Ventas por SubCategoría
                    </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Distribución de ventas por categoría
                </p>
            </CardHeader>
            <Divider className="bg-slate-100 dark:bg-zinc-800" />
            <CardBody className="py-2">
                {loading ? (
                    <div className="flex justify-center py-10"><Spinner size="lg" color="primary" /></div>
                ) : error ? (
                    <p className="text-center text-rose-500 mt-4">Error: {error}</p>
                ) : data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                        <p className="text-sm">No hay datos disponibles</p>
                    </div>
                ) : (
                    <div className="flex flex-col xl:flex-row items-center gap-6">
                        <div className="flex justify-center items-center flex-shrink-0">
                            <DonutChart
                                className="w-44 h-44"
                                data={salesData}
                                category="amount"
                                index="name"
                                valueFormatter={currencyFormatter}
                                colors={donutColors}
                                showAnimation={true}
                                customTooltip={CustomTooltip}
                            />
                        </div>
                        <div className="flex-1 w-full space-y-2">
                            <div className="flex items-center justify-between mb-1 px-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    SubCategoría
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    % Total
                                </span>
                            </div>
                            {salesData.slice(0, 5).map((item) => (
                                <div
                                    key={item.name}
                                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50/50 dark:bg-zinc-800/30 border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 transition-colors"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span
                                            className={classNames(item.color, 'w-2 h-2 rounded-full flex-shrink-0')}
                                            aria-hidden={true}
                                        />
                                        <span className="truncate font-bold text-slate-700 dark:text-slate-200 text-xs">
                                            {item.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {currencyFormatter(item.amount)}
                                        </span>
                                        <span className="rounded-md bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-zinc-700 px-1.5 py-0.5 text-[10px] font-bold shadow-sm">
                                            {item.share}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}