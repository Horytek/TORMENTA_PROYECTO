import { Card, CardBody } from "@heroui/react";
import { DollarSign, ShoppingBag, TrendingUp, Clock } from "lucide-react";
import { useMemo } from "react";

export const StatsCards = ({ stats }) => {

    // Helper to generate SVG Path from data array
    const generateSparklinePath = (data) => {
        if (!data || data.length === 0) return "M0,20 L100,20";

        const width = 100;
        const height = 20;
        const max = Math.max(...data, 1); // Avoid division by zero
        const min = Math.min(...data, 0);
        const range = max - min || 1;

        // Generate points
        const points = data.map((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const normalizedY = (val - min) / range;
            const y = height - (normalizedY * height); // Invert Y because SVG 0 is top
            return `${x},${y}`;
        });

        // Create smooth curve (or at least line)
        if (points.length === 1) return `M0,${points[0].split(',')[1]} L100,${points[0].split(',')[1]}`;

        return `M${points.join(' L')}`;
        // Note: For true smooth bezier curves, a more complex function is needed, 
        // but polyline (L) is sufficient for a small sparkline.
    };

    // Prepare data arrays (or fallback to zeros if empty)
    const salesData = stats.weeklySales && stats.weeklySales.length > 0
        ? stats.weeklySales.map(d => Number(d.total))
        : [0, 0, 0, 0, 0, 0, 0];

    const ordersData = stats.weeklySales && stats.weeklySales.length > 0
        ? stats.weeklySales.map(d => Number(d.count))
        : [0, 0, 0, 0, 0, 0, 0];

    return (
        <div className="grid grid-cols-2 gap-4">
            {/* Sales Card - Luminous Emerald */}
            <Card className="bg-zinc-900 border border-emerald-500/20 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)] rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
                {/* Custom Radial Glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/30 transition-colors" />

                <CardBody className="py-5 px-4 relative z-10 flex flex-col justify-between min-h-[140px]">
                    <div className="flex justify-between items-start">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl backdrop-blur-md border border-emerald-500/10">
                            <DollarSign className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex items-center gap-1 bg-emerald-950/50 border border-emerald-500/20 px-2 py-1 rounded-full">
                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] font-bold text-emerald-400">Hoy</span>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-3xl font-black text-white tracking-tight leading-none mb-1">
                            <span className="text-sm font-bold text-zinc-500 mr-1 align-top relative top-1">S/.</span>
                            {Number(stats.todayTotal).toFixed(2)}
                        </p>
                        <p className="text-xs font-semibold text-zinc-500 tracking-wide uppercase">Ventas Hoy</p>
                    </div>

                    {/* Functional Sparkline */}
                    <div className="absolute bottom-0 left-0 right-0 h-8 opacity-30 text-emerald-500">
                        <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                            <path
                                d={generateSparklinePath(salesData)}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                vectorEffect="non-scaling-stroke"
                            />
                            <path
                                d={`${generateSparklinePath(salesData)} L100,20 L0,20 Z`}
                                fill="currentColor"
                                stroke="none"
                                opacity="0.2"
                            />
                        </svg>
                    </div>
                </CardBody>
            </Card>

            {/* Orders Card - Luminous Blue */}
            <Card className="bg-zinc-900 border border-blue-500/20 shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)] rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500 delay-75">
                {/* Custom Radial Glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/30 transition-colors" />

                <CardBody className="py-5 px-4 relative z-10 flex flex-col justify-between min-h-[140px]">
                    <div className="flex justify-between items-start">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl backdrop-blur-md border border-blue-500/10">
                            <ShoppingBag className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex items-center gap-1 bg-blue-950/50 border border-blue-500/20 px-2 py-1 rounded-full">
                            <Clock className="w-3 h-3 text-blue-400" />
                            <span className="text-[10px] font-bold text-blue-400">Ahora</span>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-3xl font-black text-white tracking-tight leading-none mb-1">
                            {stats.todayCount}
                        </p>
                        <p className="text-xs font-semibold text-zinc-500 tracking-wide uppercase">Pedidos</p>
                    </div>

                    {/* Functional Sparkline */}
                    <div className="absolute bottom-0 left-0 right-0 h-8 opacity-30 text-blue-500">
                        <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                            <path
                                d={generateSparklinePath(ordersData)}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                vectorEffect="non-scaling-stroke"
                            />
                            <path
                                d={`${generateSparklinePath(ordersData)} L100,20 L0,20 Z`}
                                fill="currentColor"
                                stroke="none"
                                opacity="0.2"
                            />
                        </svg>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};
