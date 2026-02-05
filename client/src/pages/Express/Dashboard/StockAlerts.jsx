import { AlertTriangle, PackageX } from "lucide-react";

export const StockAlerts = ({ products = [] }) => {
    if (!products || products.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-red-500/80 tracking-widest uppercase flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    Stock Crítico
                </h3>
            </div>

            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {products.map((prod, idx) => (
                    <div
                        key={idx}
                        className="flex-shrink-0 min-w-[140px] p-3 bg-red-500/5 border border-red-500/10 rounded-2xl flex flex-col gap-2 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/10 rounded-bl-full -mr-2 -mt-2 group-hover:scale-110 transition-transform" />

                        <PackageX className="w-5 h-5 text-red-500 z-10" />

                        <div className="z-10 mt-1">
                            <p className="text-xs font-bold text-red-200 truncate">{prod.name}</p>
                            <p className="text-[10px] font-medium text-red-500/80 uppercase">
                                Queda: <span className="font-bold text-red-400 text-sm">{prod.stock}</span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
