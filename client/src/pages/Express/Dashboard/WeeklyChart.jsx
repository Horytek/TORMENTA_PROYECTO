import { AreaChart } from '@tremor/react';
import { TrendingUp } from 'lucide-react';
import { Card } from '@heroui/react';


const CustomTooltip = ({ payload, active, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/5 p-3 rounded-2xl shadow-2xl min-w-[120px]">
            <p className="text-zinc-500 text-[10px] mb-1 font-bold tracking-wider uppercase">{label}</p>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)] animate-pulse" />
                <p className="text-white text-base font-bold font-mono">
                    {Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(payload[0].value)}
                </p>
            </div>
        </div>
    );
};

export const WeeklyChart = ({ data = [] }) => {
    // Fill with empty data if null to prevent crash
    const chartData = data && data.length > 0 ? data : [
        { date: 'Lun', total: 0 },
        { date: 'Mar', total: 0 },
        { date: 'Mie', total: 0 },
        { date: 'Jue', total: 0 },
        { date: 'Vie', total: 0 },
        { date: 'Sab', total: 0 },
        { date: 'Dom', total: 0 },
    ];

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-zinc-500 tracking-widest uppercase flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" />
                    Tendencia Semanal
                </h3>
            </div>

            <Card className="bg-zinc-900 shadow-none rounded-3xl p-4 relative overflow-hidden ring-0 border-none">
                <AreaChart
                    className="h-40"
                    data={chartData}
                    index="date"
                    categories={["total"]}
                    colors={["blue"]}
                    showLegend={false}
                    showGridLines={false}
                    showYAxis={false}
                    showAnimation={true}
                    curveType="natural"
                    showGradient={true}
                    customTooltip={CustomTooltip}
                />
            </Card>
        </div>
    );
};
