import { Button } from "@heroui/react";
import { RefreshCw } from "lucide-react";

export const DashboardHeader = ({ loading, onRefresh }) => {
    return (
        <div className="flex justify-between items-center mb-6 pt-2">
            <div className="flex flex-col gap-0.5">
                <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">
                    Resumen
                </h2>
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase">
                        Panel en Tiempo Real
                    </p>
                </div>
            </div>
            <Button
                isIconOnly
                size="sm"
                variant="light"
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all backdrop-blur-md"
                onPress={onRefresh}
                isLoading={loading}
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
        </div>
    );
};
