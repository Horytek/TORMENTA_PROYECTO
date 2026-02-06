import { Button } from "@heroui/react";
import { Plus, PackagePlus, ClipboardList, UserPlus, Grid } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ActionsGrid = () => {
    const navigate = useNavigate();

    const actions = [
        {
            label: "Nueva Venta",
            icon: Plus,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            glow: "group-hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]",
            path: "/express/pos",
            delay: "delay-100"
        },
        {
            label: "Nuevo Producto",
            icon: PackagePlus,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
            glow: "group-hover:shadow-[0_0_20px_-5px_rgba(168,85,247,0.3)]",
            path: "/express/inventory",
            delay: "delay-150"
        },
        {
            label: "Nota Almacén",
            icon: ClipboardList,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            glow: "group-hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]",
            path: "/express/inventory", // Redirigir a inventario temporalmente
            delay: "delay-200"
        },
        {
            label: "Nuevo Cliente",
            icon: UserPlus,
            color: "text-orange-400",
            bg: "bg-orange-500/10",
            border: "border-orange-500/20",
            glow: "group-hover:shadow-[0_0_20px_-5px_rgba(249,115,22,0.3)]",
            path: "/express/users",
            delay: "delay-300"
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end px-1">
                <h3 className="text-xs font-bold text-zinc-500 tracking-widest uppercase flex items-center gap-2">
                    <Grid className="w-3 h-3" />
                    Acciones Rápidas
                </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {actions.map((action, idx) => (
                    <Button
                        key={idx}
                        className={`h-24 bg-zinc-900/50 backdrop-blur-md border border-white/5 shadow-sm rounded-2xl flex flex-col gap-3 items-center justify-center group transition-all duration-300 hover:scale-[1.02] active:scale-95 ${action.glow} ${action.delay} animate-in fade-in zoom-in fill-mode-backwards`}
                        onPress={() => action.path && navigate(action.path)}
                    >
                        <div className={`w-12 h-12 rounded-2xl ${action.bg} border ${action.border} flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                            <action.icon className="w-6 h-6" strokeWidth={2.5} />
                        </div>
                        <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">
                            {action.label}
                        </span>
                    </Button>
                ))}
            </div>
        </div>
    );
};
