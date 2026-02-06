import { useState, useEffect } from "react";
import { LayoutGrid, ShoppingBag, Package, Users, LogOut, Building2 } from "lucide-react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useTheme } from "@heroui/use-theme";
import { getBusinessName } from "@/utils/expressStorage";
import { expressLogout } from "@/services/express.services";

function ExpressLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, setTheme } = useTheme();
    const [erpTheme, setErpTheme] = useState(null);

    // Isolated Theme Management for Express
    useEffect(() => {
        const currentGlobalTheme = theme;
        setErpTheme(currentGlobalTheme);

        // Force Dark Mode for Express
        setTheme("dark");

        return () => {
            if (currentGlobalTheme) {
                setTheme(currentGlobalTheme);
            }
        }
    }, []);

    const handleLogout = async () => {
        await expressLogout();
        navigate("/");
    };

    const tabs = [
        { id: "dashboard", icon: LayoutGrid, label: "Inicio", path: "/express/dashboard", color: "text-blue-400", bg: "bg-blue-500/10", glow: "shadow-[0_0_15px_-3px_rgba(59,130,246,0.4)]" },
        { id: "pos", icon: ShoppingBag, label: "Vender", path: "/express/pos", color: "text-emerald-400", bg: "bg-emerald-500/10", glow: "shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]" },
        { id: "inventory", icon: Package, label: "Stock", path: "/express/inventory", color: "text-purple-400", bg: "bg-purple-500/10", glow: "shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)]" },
        { id: "users", icon: Users, label: "Equipo", path: "/express/users", color: "text-orange-400", bg: "bg-orange-500/10", glow: "shadow-[0_0_15px_-3px_rgba(249,115,22,0.4)]" },
    ];

    const [businessName, setBusinessState] = useState("Horycore Pocket");

    useEffect(() => {
        getBusinessName().then(name => {
            if (name) setBusinessState(name);
        });
    }, []);

    return (
        <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden font-sans selection:bg-amber-500/30">
            {/* Header - Minimalist Glass */}
            <div className="h-16 flex items-center justify-between px-6 pt-2 z-40">
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-zinc-500 mb-0.5">
                        <Building2 className="w-3 h-3" />
                        <span className="text-[10px] uppercase tracking-wider font-bold">Empresa</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight truncate max-w-[200px] text-zinc-100">{businessName}</span>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
                    title="Cerrar Sesión"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden pb-28 p-0 scrollbar-hide">
                <Outlet />
            </div>

            {/* Floating Dock Navigation */}
            <div className="fixed bottom-6 left-4 right-4 h-16 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-full flex justify-around items-center px-2 z-50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
                {tabs.map((tab) => {
                    const isActive = location.pathname.includes(tab.path);
                    return (
                        <button
                            key={tab.id}
                            onClick={() => navigate(tab.path)}
                            className="relative flex flex-col items-center justify-center w-14 h-full group"
                        >
                            {/* Active Background Pill */}
                            {isActive && (
                                <div className={`absolute inset-0 m-auto w-12 h-12 rounded-full ${tab.bg} ${tab.glow} animate-in zoom-in duration-300`} />
                            )}

                            {/* Icon */}
                            <tab.icon
                                className={`w-5 h-5 z-10 transition-all duration-300 ${isActive ? `${tab.color} scale-110` : 'text-zinc-500 group-hover:text-zinc-300'}`}
                                strokeWidth={isActive ? 2.5 : 2}
                            />

                            {/* Active Dot (Optional, minimalist) */}
                            {isActive && (
                                <span className={`absolute bottom-2 w-1 h-1 rounded-full ${tab.color.replace('text-', 'bg-')}`} />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default ExpressLayout;
