import { Crown, Trophy } from "lucide-react";
import { Card } from "@heroui/react";

export const TopProduct = ({ product }) => {
    if (!product) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-amber-500/80 tracking-widest uppercase flex items-center gap-2">
                    <Trophy className="w-3 h-3" />
                    Producto Estrella
                </h3>
            </div>

            <Card className="bg-gradient-to-br from-amber-500/10 to-zinc-900 border border-amber-500/20 shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)] rounded-2xl p-4 flex flex-row items-center gap-4 relative overflow-hidden group">
                {/* Sparkle Effect */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl -mr-5 -mt-5 animate-pulse" />

                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30 shrink-0 group-hover:scale-110 transition-transform">
                    <Crown className="w-6 h-6 text-amber-500" fill="currentColor" fillOpacity={0.3} />
                </div>

                <div className="flex flex-col relative z-10">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-0.5">Más Vendido</span>
                    <h4 className="text-lg font-black text-white leading-tight line-clamp-1" title={product.name}>
                        {product.name}
                    </h4>
                    <span className="text-xs text-zinc-400 mt-1">
                        <span className="font-bold text-white">{product.sold}</span> unidades vendidas
                    </span>
                </div>
            </Card>
        </div>
    );
};
