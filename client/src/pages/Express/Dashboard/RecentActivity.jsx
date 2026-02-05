import { ArrowUpRight } from "lucide-react";

export const RecentActivity = ({ sales = [] }) => {
    if (!sales || sales.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
                <span className="w-1 h-1 rounded-full bg-zinc-500" />
                <h3 className="text-xs font-bold text-zinc-500 tracking-widest uppercase">
                    RECIENTES
                </h3>
            </div>

            <div className="flex flex-col gap-3">
                {sales.map((sale) => (
                    <div
                        key={sale.id}
                        className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800/50 rounded-3xl shadow-sm group hover:scale-[1.02] transition-transform duration-300"
                    >
                        <div className="flex items-center gap-4">
                            {/* Icon Container */}
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/5 group-hover:bg-emerald-500/20 transition-colors">
                                <ArrowUpRight className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
                            </div>

                            {/* Text Info */}
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white tracking-tight">Venta #{sale.id}</span>
                                <span className="text-[10px] text-zinc-500 font-medium tracking-wide">{sale.time}</span>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="flex flex-col items-end">
                            <span className="text-base font-black text-white tracking-tight">S/. {Number(sale.total).toFixed(2)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
