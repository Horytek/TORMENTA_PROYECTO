import React from "react";
import { Card, CardHeader, CardBody, Divider, Chip, Progress } from "@heroui/react";
import {
    ArrowUpRight,
    ArrowDownRight,
    ArrowUp,
    TrendingUp,
    Package,
    DollarSign,
    Store,
} from "lucide-react";
import useVentasData from "@/services/reports/data_soles";
import useTotalProductosVendidos from "@/services/reports/data_prod";
import useProductoTop from "@/services/reports/data_top";
import useVentasSucursal from "@/services/reports/data_ventas_sucursal";

// Card métrica reutilizable con fondo degradado y diseño consistente
function MetricCardKPI({ icon, title, value, change, variant = "default", children }) {
    const variants = {
        default: "text-slate-600 bg-slate-50 dark:text-slate-300 dark:bg-zinc-800",
        success: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20",
        primary: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20",
        secondary: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20",
        warning: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20",
    };

    const iconStyle = variants[variant] || variants.default;

    return (
        <Card className="border border-slate-100 dark:border-zinc-800 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] dark:shadow-none dark:bg-zinc-900 rounded-2xl p-6 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white">
            <div className="flex flex-col justify-between h-full gap-4">
                <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-xl ${iconStyle} transition-colors`}>
                        {icon}
                    </div>
                    {change !== undefined && (
                        <Chip
                            size="sm"
                            variant="flat"
                            color={change && change.toString().includes('+') ? "success" : "default"}
                            classNames={{
                                base: "h-6 px-1",
                                content: "font-semibold text-[10px] flex items-center gap-1"
                            }}
                        >
                            {change}
                        </Chip>
                    )}
                </div>

                <div>
                    <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight tabular-nums mt-2">
                        {value}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
                        {title}
                    </p>
                    {children}
                </div>
            </div>
        </Card>
    );
}

const SalesCard = ({
    idSucursal,
    periodoTexto = "vs. mes anterior",
    year,
    month,
    week,
}) => {
    // Ganancias
    const { totalRecaudado, totalAnterior: totalGananciasAnterior, porcentaje: porcentajeGanancias } =
        useVentasData(idSucursal, year, month, week);

    // Productos vendidos
    const {
        totalProductosVendidos,
        totalAnterior: totalProductosAnterior,
        porcentaje: porcentajeProductos,
    } = useTotalProductosVendidos(idSucursal, year, month, week);

    // Producto más vendido
    const { productoTop } = useProductoTop(idSucursal, year, month, week);

    // Sucursal con mayor rendimiento
    const { data: sucursalTop } = useVentasSucursal(year, month, week);

    // Gradientes y colores para cada card
    const gradients = [
        "from-emerald-400/30 via-emerald-200/20 to-transparent",
        "from-violet-400/30 via-violet-200/20 to-transparent",
        "from-blue-400/30 via-blue-200/20 to-transparent",
        "from-amber-400/30 via-yellow-200/20 to-transparent",
    ];
    const iconColors = [
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
        "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
        "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
        "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    ];
    const borderColors = [
        "border-emerald-200/50 dark:border-emerald-800/50",
        "border-violet-200/50 dark:border-violet-800/50",
        "border-blue-200/50 dark:border-blue-800/50",
        "border-amber-200/50 dark:border-amber-800/50",
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 w-full">
            {/* Total de Ganancias */}
            <MetricCardKPI
                icon={<DollarSign className="h-5 w-5" />}
                title="Total de Ganancias"
                value={`S/. ${totalRecaudado || "0.00"}`}
                change={
                    porcentajeGanancias !== undefined
                        ? `${porcentajeGanancias > 0 ? "+" : ""}${porcentajeGanancias || 0}%`
                        : undefined
                }
                variant="success"
            >
                {/* Meta y progreso */}
                <div className="mt-3">
                    {(() => {
                        let meta = 0;
                        let metaLabel = "";
                        const diasMes = month && year ? new Date(year, month, 0).getDate() : 30;
                        if (week && week !== "all") {
                            metaLabel = "Meta semanal";
                            meta = totalGananciasAnterior && totalGananciasAnterior > 0 && diasMes
                                ? Math.round((totalGananciasAnterior / diasMes) * 7)
                                : 6000;
                        } else if (month) {
                            metaLabel = "Meta mensual";
                            meta = totalGananciasAnterior && totalGananciasAnterior > 0
                                ? totalGananciasAnterior
                                : 18000;
                        } else {
                            metaLabel = "Meta anual";
                            meta = totalGananciasAnterior && totalGananciasAnterior > 0
                                ? totalGananciasAnterior
                                : 1000000;
                        }
                        const porcentajeMeta = meta > 0 ? Math.min((totalRecaudado / meta) * 100, 100) : 0;
                        return (
                            <>
                                <div className="mt-4">
                                    <div className="flex items-center justify-between text-xs mb-1 text-slate-500">
                                        <span>{metaLabel}: S/. {meta}</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{porcentajeMeta.toFixed(0)}%</span>
                                    </div>
                                    <Progress
                                        value={porcentajeMeta}
                                        className="h-1.5 rounded-full"
                                        color="success"
                                        aria-label="Progreso de meta de ganancias"
                                        classNames={{ indicator: "bg-emerald-500" }}
                                    />
                                </div>
                            </>
                        );
                    })()}
                </div>
            </MetricCardKPI>

            {/* Total de Productos Vendidos */}
            <MetricCardKPI
                icon={<Package className="h-5 w-5" />}
                title="Total de Productos Vendidos"
                value={totalProductosVendidos || "0"}
                change={
                    porcentajeProductos !== undefined
                        ? `${porcentajeProductos > 0 ? "+" : ""}${porcentajeProductos || 0}%`
                        : undefined
                }
                variant="secondary"
            >
                <div className="mt-3">
                    {(() => {
                        let meta = 0;
                        let metaLabel = "";
                        const diasMes = month && year ? new Date(year, month, 0).getDate() : 30;
                        if (week && week !== "all") {
                            metaLabel = "Meta semanal";
                            meta = totalProductosAnterior && diasMes
                                ? Math.round((totalProductosAnterior / diasMes) * 7)
                                : 400;
                        } else if (month) {
                            metaLabel = "Meta mensual";
                            meta = totalProductosAnterior
                                ? totalProductosAnterior
                                : 1700;
                        } else {
                            metaLabel = "Meta anual";
                            meta = totalProductosAnterior
                                ? totalProductosAnterior
                                : 50000;
                        }
                        const porcentajeMeta = meta > 0 ? Math.min((totalProductosVendidos / meta) * 100, 100) : 0;
                        return (
                            <>
                                <div className="mt-4">
                                    <div className="flex items-center justify-between text-xs mb-1 text-slate-500">
                                        <span>{metaLabel}: {meta}</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{porcentajeMeta.toFixed(0)}%</span>
                                    </div>
                                    <Progress
                                        value={porcentajeMeta}
                                        className="h-1.5 rounded-full"
                                        color="secondary"
                                        aria-label="Progreso de meta de productos"
                                        classNames={{ indicator: "bg-purple-500" }}
                                    />
                                </div>
                            </>
                        );
                    })()}
                </div>
            </MetricCardKPI>

            {/* Producto Más Vendido */}
            <MetricCardKPI
                icon={<TrendingUp className="h-5 w-5" />}
                title="Producto Más Vendido"
                value={productoTop?.descripcion || "No disponible"}
                variant="primary"
            >
                <div className="mt-2 flex items-center text-xs text-slate-500">
                    <div className="flex items-center mr-3">
                        <span className="font-medium mr-1 text-slate-700 dark:text-slate-300">Unidades:</span> {productoTop?.unidades || "0"}
                    </div>
                    <div className="flex items-center">
                        <span className="font-medium mr-1 text-slate-700 dark:text-slate-300">Ingresos:</span> S/. {productoTop?.ingresos || "0.00"}
                    </div>
                </div>
            </MetricCardKPI>

            {/* Sucursal con Mayor Rendimiento */}
            <MetricCardKPI
                icon={<Store className="h-5 w-5" />}
                title="Sucursal con Mayor Rendimiento"
                value={sucursalTop?.nombre || "No disponible"}
                variant="warning"
            >
                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1 text-slate-500">
                        <span>
                            Ventas: S/. {sucursalTop?.totalVentas ? Number(sucursalTop.totalVentas).toFixed(2) : "0.00"}
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                            {sucursalTop?.porcentajeSobreTotal
                                ? `${sucursalTop?.porcentajeSobreTotal}%`
                                : "0%"}
                        </span>
                    </div>
                    <Progress
                        value={sucursalTop?.porcentajeSobreTotal || 0}
                        className="h-1.5 rounded-full"
                        color="warning"
                        aria-label="Progreso de sucursal"
                        classNames={{ indicator: "bg-orange-500" }}
                    />
                </div>
            </MetricCardKPI>
        </div>
    );
};

export default SalesCard;