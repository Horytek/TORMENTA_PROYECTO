import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card } from '@heroui/react';

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

            <Card className="bg-zinc-900 border border-zinc-800 shadow-sm rounded-3xl p-4 h-48 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                <div className="w-full h-full min-h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#71717a', fontSize: 10 }}
                                dy={10}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                                itemStyle={{ color: '#fff' }}
                                labelStyle={{ color: '#a1a1aa' }}
                                formatter={(value) => [`S/. ${value}`, 'Ventas']}
                            />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};
