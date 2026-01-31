import React, { useMemo, useEffect, useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { Button } from "@heroui/react";
import {
    ChevronsUpDown,
    Building2,
    Settings,
    MapPin,
    Users,
    FileText,
    ChevronRight
} from "lucide-react";
import { useUserStore } from "@/store/useStore";
import { getEmpresas } from "@/services/empresa.services";
import { getPlanes } from "@/services/planes.services";
import { useNavigate } from "react-router-dom";

export default function NavCompany() {
    const navigate = useNavigate();
    const id_tenant = useUserStore(state => state.id_tenant);
    const plan_pago = useUserStore(state => state.plan_pago);
    const rol = useUserStore(state => state.rol);
    const [empresasTenant, setEmpresasTenant] = useState([]);
    const [planes, setPlanes] = useState([]);

    const isAdmin = String(rol) === "1";

    useEffect(() => {
        const fetchData = async () => {
            if (!id_tenant) return;
            try {
                const [empresas, planesData] = await Promise.all([
                    getEmpresas(),
                    getPlanes()
                ]);
                setPlanes(planesData || []);
                setEmpresasTenant(empresas.filter(e => String(e.id_tenant) === String(id_tenant)));
            } catch (e) {
                console.error("Error:", e);
            }
        };
        fetchData();
    }, [id_tenant]);

    const capitalize = (str) => str?.charAt(0).toUpperCase() + str?.slice(1) || "";

    const getPlanInfo = (planId) => {
        const plan = planes.find(p => String(p.id_plan) === String(planId));
        return plan ? capitalize(plan.descripcion_plan) : "Básico";
    };

    const activeCompany = useMemo(() => {
        if (!empresasTenant.length) return null;
        const emp = empresasTenant[0];
        return {
            name: emp.razonSocial || emp.nombreComercial || "Mi Empresa",
            logo: emp.logotipo,
            plan: getPlanInfo(plan_pago),
            ruc: emp.ruc,
            direccion: emp.direccion,
            email: emp.email
        };
    }, [empresasTenant, plan_pago, planes]);

    const actions = [
        { icon: Settings, label: "Roles y Permisos", onClick: () => navigate("/configuracion/roles") },
        { icon: MapPin, label: "Sucursales", onClick: () => navigate("/sucursal") },
        { icon: Users, label: "Usuarios", onClick: () => navigate("/configuracion/usuarios") },
        { icon: FileText, label: "Reportes", onClick: () => navigate("/reportes") }
    ];

    if (!activeCompany) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    disableRipple
                    className="h-auto px-2 py-1.5 bg-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-xl transition-all gap-2.5 flex items-center border border-transparent hover:border-slate-200/50 dark:hover:border-zinc-700/50 group"
                >
                    {/* Logo */}
                    <div className="size-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-slate-200/50 dark:border-zinc-700/50">
                        {activeCompany.logo ? (
                            <img src={activeCompany.logo} alt="" className="size-full object-contain" />
                        ) : (
                            <Building2 className="size-4 text-slate-400" />
                        )}
                    </div>

                    {/* Name & Plan */}
                    <div className="hidden sm:flex flex-col items-start min-w-0 max-w-[160px]">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate w-full">
                            {activeCompany.name}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                            {activeCompany.plan}
                        </span>
                    </div>

                    <ChevronsUpDown className="size-3.5 text-slate-300 dark:text-slate-600 hidden sm:block" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className="w-64 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-lg shadow-slate-200/50 dark:shadow-black/20 p-1.5"
                align="start"
                sideOffset={6}
            >
                {/* Company Header - Minimal */}
                <div className="px-3 py-2.5 mb-1">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                            {activeCompany.logo ? (
                                <img src={activeCompany.logo} alt="" className="size-full object-contain" />
                            ) : (
                                <Building2 className="size-5 text-slate-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                {activeCompany.name}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                {activeCompany.ruc ? `RUC ${activeCompany.ruc}` : 'Sin RUC'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions - Admin Only */}
                {isAdmin && (
                    <>
                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-zinc-800 -mx-1.5" />
                        <DropdownMenuGroup className="py-1">
                            {actions.map((action) => (
                                <DropdownMenuItem
                                    key={action.label}
                                    onClick={action.onClick}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors group"
                                >
                                    <action.icon className="size-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                                    <span className="flex-1 text-sm">{action.label}</span>
                                    <ChevronRight className="size-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                    </>
                )}

                {/* Footer - Dirección y Email */}
                {(activeCompany.direccion || activeCompany.email) && (
                    <>
                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-zinc-800 -mx-1.5" />
                        <div className="px-3 py-2.5 space-y-1">
                            {activeCompany.direccion && (
                                <div className="flex items-start gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                                    <MapPin className="size-3 mt-0.5 flex-shrink-0" />
                                    <span className="truncate">{activeCompany.direccion}</span>
                                </div>
                            )}
                            {activeCompany.email && (
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                                    <span className="text-[10px]">✉️</span>
                                    <span className="truncate">{activeCompany.email}</span>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
