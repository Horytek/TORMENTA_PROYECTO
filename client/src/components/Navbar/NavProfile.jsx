import React, { useState, useEffect } from "react";
import {
    BadgeCheck,
    Bell,
    CreditCard,
    LogOut,
    ChevronDown
} from "lucide-react";
import UserNotifications from "@/components/ui/UserNotifications";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/Auth/AuthProvider";
import { getRoles } from "@/services/rol.services";
import { getNotificaciones } from "@/services/dashboard.services";
import { Badge, Button } from "@heroui/react";
import BillingDrawer from "@/components/ui/BillingDrawer";
import AccountDrawer from "@/components/ui/AccountDrawer";

export default function NavProfile() {
    const { user, logout } = useAuth();
    const [roles, setRoles] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showBilling, setShowBilling] = useState(false);
    const [showAccount, setShowAccount] = useState(false);
    const [billingData, setBillingData] = useState(null);
    const [notifCount, setNotifCount] = useState(0);

    useEffect(() => {
        const fetchRoles = async () => {
            const data = await getRoles();
            setRoles(data);
        };
        fetchRoles();
    }, []);

    const normalizeItems = (resp) => {
        if (Array.isArray(resp)) return resp;
        if (Array.isArray(resp?.data?.data)) return resp.data.data;
        if (Array.isArray(resp?.data?.notificaciones)) return resp.data.notificaciones;
        if (Array.isArray(resp?.data)) return resp.data;
        return [];
    };

    useEffect(() => {
        let mounted = true;
        const fetchCount = async () => {
            try {
                const resp = await getNotificaciones();
                const items = normalizeItems(resp);
                if (mounted) setNotifCount(Array.isArray(items) ? items.length : 0);
            } catch (e) {
                if (mounted) setNotifCount(0);
            }
        };
        fetchCount();
        return () => { mounted = false; };
    }, [showNotifications]);

    useEffect(() => {
        if (showBilling) {
            setBillingData({
                empresa: user?.empresa || "Empresa S.A.C.",
                correo: user?.correo || user?.email || "correo@empresa.com",
                costo: user?.plan_pago === "1" ? "S/ 120" : user?.plan_pago === "2" ? "S/ 60" : "S/ 30",
                vencimiento: user?.fecha_vencimiento || "2024-12-31",
                estado: "Activo"
            });
        }
    }, [showBilling, user]);

    if (!user) return null;

    const formatRoleName = (name) => {
        if (!name) return "Rol desconocido";
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    };

    const userRole = formatRoleName(
        roles.find((role) => String(role.id_rol) === String(user.rol))?.nom_rol
        || (String(user.rol) === "1" ? "Administrador" : "Rol desconocido")
    );

    const displayName = user.usuario || user.name || "Usuario";
    const initials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

    return (
        <>
            <UserNotifications open={showNotifications} onClose={() => setShowNotifications(false)} />
            <BillingDrawer open={showBilling} onClose={() => setShowBilling(false)} billingData={billingData} />
            <AccountDrawer open={showAccount} onClose={() => setShowAccount(false)} accountData={billingData} />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        disableRipple
                        className="p-0 bg-transparent data-[hover=true]:bg-transparent min-w-0"
                    >
                        <div className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all border border-transparent hover:border-slate-200/60 dark:hover:border-zinc-700/50 group">
                            <Avatar className="h-8 w-8 ring-2 ring-white dark:ring-zinc-900 shadow-sm transition-transform group-hover:scale-105">
                                {user.avatar ? (
                                    <AvatarImage src={user.avatar} alt={displayName} />
                                ) : (
                                    <AvatarFallback className="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 font-bold text-xs">
                                        {initials}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <div className="hidden md:flex flex-col items-start mr-1">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-none group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">
                                    {displayName}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                                    {userRole}
                                </p>
                            </div>
                            <ChevronDown size={14} className="text-slate-300 group-hover:text-indigo-400 transition-colors hidden md:block" strokeWidth={2.5} />
                        </div>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    className="z-[9999] min-w-[260px] rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-zinc-800 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] dark:shadow-none p-2"
                    align="end"
                    sideOffset={8}
                >
                    <DropdownMenuLabel className="p-2 font-normal">
                        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800/50">
                            <Avatar className="h-10 w-10 rounded-lg ring-0">
                                {user.avatar ? (
                                    <AvatarImage src={user.avatar} alt={displayName} />
                                ) : (
                                    <AvatarFallback className="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 font-bold text-sm rounded-lg">
                                        {initials}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <div className="grid flex-1 text-left">
                                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                                    {displayName}
                                </span>
                                <span className="text-[10px] font-medium text-slate-400 truncate flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    {user.email || "Usuario activo"}
                                </span>
                            </div>
                        </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-zinc-800/50 h-px mx-2 my-1" />

                    <DropdownMenuGroup className="space-y-0.5 px-1">
                        <DropdownMenuItem
                            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-medium text-xs hover:bg-slate-50 dark:hover:bg-zinc-800 focus:bg-slate-50 transition-colors cursor-pointer outline-none data-[highlighted]:bg-slate-50"
                            onClick={() => setShowAccount(true)}
                        >
                            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                <BadgeCheck className="w-4 h-4" strokeWidth={2} />
                            </div>
                            Cuenta
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-medium text-xs hover:bg-slate-50 dark:hover:bg-zinc-800 focus:bg-slate-50 transition-colors cursor-pointer outline-none data-[highlighted]:bg-slate-50"
                            onClick={() => setShowBilling(true)}
                        >
                            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-500 group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
                                <CreditCard className="w-4 h-4" strokeWidth={2} />
                            </div>
                            Facturación
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setShowNotifications(true)}
                            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-medium text-xs hover:bg-slate-50 dark:hover:bg-zinc-800 focus:bg-slate-50 transition-colors cursor-pointer outline-none data-[highlighted]:bg-slate-50 justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-slate-50 text-slate-500 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                                    <Bell className="w-4 h-4" strokeWidth={2} />
                                </div>
                                Notificaciones
                            </div>
                            {notifCount > 0 && (
                                <span className="inline-flex items-center justify-center h-5 px-2 text-[10px] font-bold text-white bg-rose-500 rounded-full shadow-sm shadow-rose-200 dark:shadow-none">
                                    {notifCount}
                                </span>
                            )}
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-zinc-800/50 h-px mx-2 my-1" />

                    <div className="px-1 pb-1">
                        <DropdownMenuItem
                            onClick={logout}
                            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 font-medium text-xs hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:text-rose-600 focus:bg-rose-50 transition-all cursor-pointer outline-none data-[highlighted]:bg-rose-50"
                        >
                            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                                <LogOut className="w-4 h-4" strokeWidth={2} />
                            </div>
                            Cerrar sesión
                        </DropdownMenuItem>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
