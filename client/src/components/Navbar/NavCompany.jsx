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
import { ChevronsUpDown, GalleryVerticalEnd, Plus, Check, Building2 } from "lucide-react";
import { useUserStore } from "@/store/useStore";
import { getEmpresas } from "@/services/empresa.services";
import { getPlanes } from "@/services/planes.services";

// Static Data for Fallback
const DEFAULT_TEAMS = [
    { name: "Horytek Inc", logo: GalleryVerticalEnd, plan: "Enterprise" },
    { name: "Horytek Corp.", logo: GalleryVerticalEnd, plan: "Startup" },
];

export default function NavCompany() {
    const id_tenant = useUserStore(state => state.id_tenant);
    const plan_pago = useUserStore(state => state.plan_pago);
    const [empresasTenant, setEmpresasTenant] = useState([]);
    const [planes, setPlanes] = useState([]);

    // Fetch Data Logic (Adapted from AppSidebar)
    useEffect(() => {
        const fetchEmpresasYPlanes = async () => {
            if (!id_tenant) return;
            try {
                const [empresas, planesData] = await Promise.all([
                    getEmpresas(),
                    getPlanes()
                ]);
                setPlanes(planesData || []);
                const empresasLigadas = empresas.filter(e => String(e.id_tenant) === String(id_tenant));
                setEmpresasTenant(empresasLigadas);
            } catch (e) {
                console.error("Error fetching company data:", e);
                setEmpresasTenant([]);
                setPlanes([]);
            }
        };
        fetchEmpresasYPlanes();
    }, [id_tenant]);

    // Helper functions
    const capitalize = (str) =>
        typeof str === "string" && str.length > 0
            ? str.charAt(0).toUpperCase() + str.slice(1)
            : str;

    const getPlanDescripcion = (planId) => {
        const plan = planes.find(p => String(p.id_plan) === String(planId));
        return plan ? capitalize(plan.descripcion_plan) : "Estándar";
    };

    // Construct Teams Array
    const teams = useMemo(() => {
        if (empresasTenant.length === 0) return DEFAULT_TEAMS;

        const empresaPrincipal = empresasTenant[0];

        return [
            ...(empresaPrincipal
                ? [{
                    name: empresaPrincipal.razonSocial || empresaPrincipal.nombreComercial || "Empresa Principal",
                    logo: empresaPrincipal.logotipo || GalleryVerticalEnd,
                    plan: getPlanDescripcion(plan_pago),
                    id: empresaPrincipal.id_empresa
                }]
                : []),
            ...empresasTenant.slice(1).map(emp => ({
                name: emp.razonSocial || emp.nombreComercial || "Sucursal",
                logo: emp.logotipo || GalleryVerticalEnd,
                plan: getPlanDescripcion(plan_pago),
                id: emp.id_empresa
            }))
        ];
    }, [empresasTenant, plan_pago, planes]);

    const [activeTeam, setActiveTeam] = useState(teams[0]);

    useEffect(() => {
        if (teams.length > 0) setActiveTeam(teams[0]);
    }, [teams]);

    if (!activeTeam) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    disableRipple
                    className="h-auto px-2 py-1.5 bg-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-xl transition-all duration-200 gap-3 flex items-center border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 group min-w-0"
                    aria-label="Seleccionar empresa"
                >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 group-hover:bg-white dark:group-hover:bg-zinc-800 transition-colors shadow-sm">
                        {typeof activeTeam.logo === "string" ? (
                            <img src={activeTeam.logo} alt={activeTeam.name} className="size-5 object-contain" />
                        ) : (
                            <GalleryVerticalEnd className="size-4" />
                        )}
                    </div>

                    <div className="grid flex-1 text-left text-sm leading-tight hidden sm:block mr-2 max-w-[200px] gap-0.5">
                        <span className="truncate font-bold text-slate-800 dark:text-slate-100 group-hover:text-black dark:group-hover:text-white transition-colors">
                            {activeTeam.name}
                        </span>
                        <span className="truncate text-[10px] font-medium text-slate-500 group-hover:text-slate-600 dark:text-slate-400 transition-colors uppercase tracking-wider">
                            {activeTeam.plan}
                        </span>
                    </div>

                    <ChevronsUpDown className="ml-auto size-4 text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 transition-colors hidden sm:block opacity-50" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className="z-[9999] min-w-[260px] rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-xl p-2"
                align="start"
                sideOffset={8}
            >
                <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Equipos
                </DropdownMenuLabel>

                <DropdownMenuGroup className="space-y-1">
                    {teams.map((team, index) => (
                        <DropdownMenuItem
                            key={team.name}
                            onClick={() => setActiveTeam(team)}
                            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors"
                        >
                            <div className="flex size-8 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-500 group-hover:border-indigo-200 dark:group-hover:border-indigo-900 group-hover:text-indigo-600 transition-colors">
                                {typeof team.logo === "string" ? (
                                    <img src={team.logo} alt={team.name} className="size-5 object-contain" />
                                ) : (
                                    <GalleryVerticalEnd className="size-4" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                    {team.name}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">
                                    {team.plan}
                                </p>
                            </div>
                            {activeTeam.name === team.name && (
                                <Check size={16} className="text-blue-600 dark:text-blue-400" />
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="bg-slate-100 dark:bg-zinc-800 mx-2 my-2" />

                <DropdownMenuItem
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer text-slate-600 dark:text-slate-400 font-medium transition-colors"
                >
                    <div className="flex size-8 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 group-hover:bg-slate-100 dark:group-hover:bg-zinc-700 transition-colors">
                        <Plus className="size-4" />
                    </div>
                    <span className="text-sm">Agregar equipo</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
