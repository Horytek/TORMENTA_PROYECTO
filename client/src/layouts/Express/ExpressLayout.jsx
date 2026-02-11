import { useState, useEffect } from "react";
import { LayoutGrid, ShoppingBag, Package, Users, LogOut, Building2, Settings, Bell } from "lucide-react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useTheme } from "@heroui/use-theme";
import { getBusinessName, getExpressRole, getExpressPermissions } from "@/utils/expressStorage";
import { expressLogout, getExpressMe } from "@/services/express.services";
import { forceHeroUILightTheme } from "@/utils/clearHeroUITheme";
import { NotificationsDrawer } from "./NotificationsDrawer";
import { useAuth } from "@/context/Auth/AuthProvider";

function ExpressLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, setTheme } = useTheme();
    const [erpTheme, setErpTheme] = useState(null);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState({});

    // Isolated Theme Management for Express
    useEffect(() => {
        const currentGlobalTheme = theme;
        setErpTheme(currentGlobalTheme);

        // Force Dark Mode for Express
        setTheme("dark");

        const init = async () => {
            try {
                // Try to get fresh permissions from backend
                const me = await getExpressMe();
                if (me) {
                    setRole(me.role);
                    setPermissions(me.permissions || {});

                    // Update storage to keep it in sync
                    // Note: We need to import setExpressRole/Permissions if we want to update them, 
                    // but for now relying on state is enough for the session.
                    // Actually, let's update storage so next reload works even offline-ish/faster
                    // We need to import setters. 
                }
            } catch (e) {
                console.error("Failed to refresh permissions", e);
                // Fallback to storage
                const r = await getExpressRole();
                setRole(r);
                if (r !== 'admin') {
                    const p = await getExpressPermissions();
                    setPermissions(p || {});
                }
            }
        };
        init();

        return () => {
            if (currentGlobalTheme) {
                setTheme(currentGlobalTheme);
            }
        }
    }, []);

    // Subscription Check
    const { user } = useAuth();
    useEffect(() => {
        if (user?.subscription_status === 'expired' && !location.pathname.includes('/subscription')) {
            navigate('/express/subscription');
        }
    }, [user, location.pathname]);

    const handleLogout = async () => {
        await expressLogout();
        navigate("/");
        forceHeroUILightTheme();
    };

    // Tabs Configuration
    const allTabs = [
        {
            id: "dashboard",
            icon: LayoutGrid,
            label: "Inicio",
            path: "/express/dashboard",
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            glow: "shadow-[0_0_15px_-3px_rgba(59,130,246,0.4)]",
            isVisible: () => true
        },
        {
            id: "pos",
            icon: ShoppingBag,
            label: "Vender",
            path: "/express/pos",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            glow: "shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]",
            isVisible: () => role === 'admin' || permissions?.sales
        },
        {
            id: "inventory",
            icon: Package,
            label: "Stock",
            path: "/express/inventory",
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            glow: "shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)]",
            isVisible: () => role === 'admin' || permissions?.inventory
        },
        {
            id: "users",
            icon: Users,
            label: "Equipo",
            path: "/express/users",
            color: "text-orange-400",
            bg: "bg-orange-500/10",
            glow: "shadow-[0_0_15px_-3px_rgba(249,115,22,0.4)]",
            isVisible: () => role === 'admin'
        },
    ];

    const tabs = allTabs.filter(tab => tab.isVisible());

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
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsNotificationsOpen(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-all duration-300 relative"
                        title="Notificaciones"
                    >
                        <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <Bell className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => navigate('/express/settings')}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-all duration-300"
                        title="Configuración"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>

            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden pb-28 p-0 scrollbar-hide">
                <Outlet context={{ role, permissions }} />
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

            <NotificationsDrawer
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
            />
        </div>
    );
}

export default ExpressLayout;
