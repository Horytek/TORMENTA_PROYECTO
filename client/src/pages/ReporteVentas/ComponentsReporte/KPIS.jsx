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
function MetricCardKPI({ icon, title, value, change, gradient, iconColor, borderColor, children }) {
    return (
        <Card className={`relative overflow-hidden border ${borderColor} bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm min-w-[280px] max-w-[400px] flex-1`}>
            <CardBody className="p-6 relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 pointer-events-none`}></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl ${iconColor} shadow-lg`}>{icon}</div>
                        {change !== undefined && (
                            <div className="flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-white/80 dark:bg-zinc-800/80 px-2 py-1 rounded-full backdrop-blur-sm">
                                <ArrowUp className="h-3 w-3 mr-1" />
                                {change} <span className="text-zinc-500 dark:text-zinc-400 ml-1">desde ayer</span>
                            </div>
                        )}
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">{title}</p>
                    </div>
                    {children}
                </div>
            </CardBody>
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
        <div className="flex flex-row flex-wrap gap-6 px-4 py-6">
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
                gradient={gradients[0]}
                iconColor={iconColors[0]}
                borderColor={borderColors[0]}
            >
                <div className="flex items-center space-x-2 mt-2">
                    <Chip
                        color={porcentajeGanancias >= 0 ? "success" : "danger"}
                        className="text-xs px-2 py-1 flex items-center gap-1 leading-none"
                    >
                        {porcentajeGanancias >= 0 ? (
                            <ArrowUpRight className="h-3 w-3 mr-1 inline-block relative top-[0.5px]" />
                        ) : (
                            <ArrowDownRight className="h-3 w-3 mr-1 inline-block relative top-[0.5px]" />
                        )}
                        {porcentajeGanancias > 0 ? "+" : ""}
                        {porcentajeGanancias || 0}%
                    </Chip>
                    <span className="text-xs text-muted-foreground">{periodoTexto}</span>
                </div>
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
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span>{metaLabel}: S/. {meta}</span>
                                        <span className="font-medium">{porcentajeMeta.toFixed(0)}%</span>
                                    </div>
                                    <Progress
                                        value={porcentajeMeta}
                                        className="h-2 rounded-full"
                                        color="success"
                                        aria-label="Progreso de meta de ganancias"
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
                gradient={gradients[1]}
                iconColor={iconColors[1]}
                borderColor={borderColors[1]}
            >
                <div className="flex items-center space-x-2 mt-2">
                    <Chip
                        color={porcentajeProductos >= 0 ? "success" : "danger"}
                        className="text-xs px-2 py-1 flex items-center gap-1 leading-none"
                    >
                        {porcentajeProductos >= 0 ? (
                            <ArrowUpRight className="h-3 w-3 mr-1 inline-block relative top-[0.5px]" />
                        ) : (
                            <ArrowDownRight className="h-3 w-3 mr-1 inline-block relative top-[0.5px]" />
                        )}
                        {porcentajeProductos > 0 ? "+" : ""}
                        {porcentajeProductos || 0}%
                    </Chip>
                    <span className="text-xs text-muted-foreground">{periodoTexto}</span>
                </div>
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
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span>{metaLabel}: {meta}</span>
                                        <span className="font-medium">{porcentajeMeta.toFixed(0)}%</span>
                                    </div>
                                    <Progress
                                        value={porcentajeMeta}
                                        className="h-2 rounded-full"
                                        color="secondary"
                                        aria-label="Progreso de meta de productos"
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
                gradient={gradients[2]}
                iconColor={iconColors[2]}
                borderColor={borderColors[2]}
            >
                <div className="mt-2 flex items-center text-xs">
                    <div className="flex items-center mr-3">
                        <span className="font-medium mr-1">Unidades:</span> {productoTop?.unidades || "0"}
                    </div>
                    <div className="flex items-center">
                        <span className="font-medium mr-1">Ingresos:</span> S/. {productoTop?.ingresos || "0.00"}
                    </div>
                </div>
                <div className="mt-3">
                    <div className="flex items-center gap-2 mt-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        <div className="text-xs flex items-center gap-1">
                            {productoTop?.porcentajeSobreTotal !== undefined && productoTop?.porcentajeSobreTotal !== null
                                ? (
                                    <>
                                        <span className="font-semibold">
                                            {Number(productoTop.porcentajeSobreTotal).toFixed(2)}%
                                        </span>
                                        <span>del total de ventas</span>
                                    </>
                                )
                                : "0% del total de ventas"}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`h-2 w-2 rounded-full ${Number(productoTop?.porcentajeCrecimiento) > 0 ? "bg-blue-500" : Number(productoTop?.porcentajeCrecimiento) < 0 ? "bg-red-500" : "bg-gray-400"}`}></div>
                        <div className={`text-xs flex items-center gap-1 ${Number(productoTop?.porcentajeCrecimiento) > 0 ? "text-blue-600" : Number(productoTop?.porcentajeCrecimiento) < 0 ? "text-red-600" : "text-gray-500"}`}>
                            {productoTop?.porcentajeCrecimiento !== undefined && productoTop?.porcentajeCrecimiento !== null
                                ? (
                                    <>
                                        {Number(productoTop.porcentajeCrecimiento) > 0 && <ArrowUpRight className="inline h-3 w-3" />}
                                        {Number(productoTop.porcentajeCrecimiento) < 0 && <ArrowDownRight className="inline h-3 w-3" />}
                                        <span className="font-semibold">
                                            {Number(productoTop.porcentajeCrecimiento).toFixed(2)}%
                                        </span>
                                        <span>de {Number(productoTop?.porcentajeCrecimiento) >= 0 ? "incremento" : "decremento"} vs. periodo anterior</span>
                                    </>
                                )
                                : "0% de incremento vs. periodo anterior"}
                        </div>
                    </div>
                </div>
            </MetricCardKPI>

            {/* Sucursal con Mayor Rendimiento */}
            <MetricCardKPI
                icon={<Store className="h-5 w-5" />}
                title="Sucursal con Mayor Rendimiento"
                value={sucursalTop?.nombre || "No disponible"}
                gradient={gradients[3]}
                iconColor={iconColors[3]}
                borderColor={borderColors[3]}
            >
                <div className="flex items-center space-x-2 mt-2">
                    <Chip
                        color={sucursalTop?.porcentajeCrecimiento >= 0 ? "success" : "danger"}
                        className="text-xs px-2 py-1 flex items-center gap-1 leading-none"
                    >
                        {sucursalTop?.porcentajeCrecimiento >= 0 ? (
                            <ArrowUpRight className="h-3 w-3 mr-1 inline-block relative top-[0.5px]" />
                        ) : (
                            <ArrowDownRight className="h-3 w-3 mr-1 inline-block relative top-[0.5px]" />
                        )}
                        {sucursalTop?.porcentajeCrecimiento > 0 ? "+" : ""}
                        {sucursalTop?.porcentajeCrecimiento || 0}%
                    </Chip>
                    <span className="text-xs text-muted-foreground">{periodoTexto}</span>
                </div>
                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span>
                            Ventas: S/. {sucursalTop?.totalVentas ? Number(sucursalTop.totalVentas).toFixed(2) : "0.00"}
                        </span>
                        <span className="font-medium">
                            {sucursalTop?.porcentajeSobreTotal
                                ? `${sucursalTop?.porcentajeSobreTotal}% del total`
                                : "0% del total"}
                        </span>
                    </div>
                    <Progress
                        value={sucursalTop?.porcentajeSobreTotal || 0}
                        className="h-2 rounded-full"
                        color="warning"
                        aria-label="Progreso de sucursal"
                    />
                </div>
            </MetricCardKPI>
        </div>
    );
};

export default SalesCard;