import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, Tab } from "@heroui/react";
import { motion } from "framer-motion";

// Components
import Tonalidades from '@/pages/Tonalidades/Tonalidades';
import Tallas from '@/pages/Tallas/Tallas';
import Unidades from './Unidades/Unidades';
import AttributesPage from '@/pages/Configuracion/Attributes/AttributesPage'; // Reusing existing Attributes page

// Hooks
import { usePermisos } from '@/routes';
import { useUserStore } from '@/store/useStore';

function Variantes() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useUserStore();

    // Custom permissions logic for this specific module aggregator
    // We need to know which tabs to show based on what modules/submodules the company has enabled.
    // We can check the permissions available in the store or helper.

    // Actually, usePermisos hook gives permissions for the *current* route context (idModulo), 
    // but since this is a wrapper, the context might be tricky if we want to check mutliple submodules.
    // Better to check the Global Layout permissions or specific keys.

    // Let's use a helper to check if a specific route key is allowed (similar to NavigationData).
    // But easier: we can check the list of permissions in the store directly.
    const permissions = useUserStore(state => state.permissions);
    const globalConfigs = useUserStore(state => state.globalModuleConfigs); // To verify enablement at company level logic

    const checkAccess = (routeKey) => {
        if (user?.rol === 10) return true; // Developer
        if (!permissions) return false;
        // Check if any permission entry matches the route
        return permissions.some(p =>
            (p.modulo_ruta?.toLowerCase() === routeKey) ||
            (p.submodulo_ruta?.toLowerCase() === routeKey) &&
            p.ver === 1
        );
    };

    const hasTonalidades = checkAccess('/gestor-contenidos/tonalidades');
    const hasTallas = checkAccess('/gestor-contenidos/tallas');
    const hasUnidades = checkAccess('/gestor-contenidos/unidades');

    // Attributes is usually under Config /configuracion/atributos using ID check
    // But we can check route too if mapped. Let's assume consistent route key.
    const hasAttributes = checkAccess('/configuracion/atributos');

    // Determine active tab based on URL
    const activeTab = useMemo(() => {
        const path = location.pathname;
        if (path.includes('/tonalidades')) return 'tonalidades';
        if (path.includes('/tallas')) return 'tallas';
        if (path.includes('/unidades')) return 'unidades';
        if (path.includes('/atributos')) return 'atributos';

        // Default fallback: First available
        if (hasTonalidades) return 'tonalidades';
        if (hasTallas) return 'tallas';
        if (hasUnidades) return 'unidades';
        if (hasAttributes) return 'atributos';
        return 'tonalidades';
    }, [location.pathname, hasTonalidades, hasTallas, hasUnidades, hasAttributes]);

    // Handle Tab Change
    const handleTabChange = (key) => {
        if (key === activeTab) return;
        navigate(`/gestor-contenidos/variantes/${key}`);
    };

    // Redirect if current path is root variants but we need to go to a specific tab
    useEffect(() => {
        if (location.pathname.endsWith('/variantes') || location.pathname.endsWith('/variantes/')) {
            handleTabChange(activeTab);
        }
    }, [location.pathname, activeTab]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="min-h-screen bg-[#F3F4F6] dark:bg-[#09090b] p-6 md:p-8 font-inter"
        >
            <div className="max-w-[1920px] mx-auto space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-extrabold text-[#1e293b] dark:text-white tracking-tight">
                        Gestión de Variantes
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
                        Administra todas las propiedades y características de tus productos.
                    </p>
                </div>

                {/* Tabs */}
                <div className="w-full">
                    <Tabs
                        selectedKey={activeTab}
                        onSelectionChange={handleTabChange}
                        variant="light"
                        classNames={{
                            tabList: "bg-white dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm gap-2",
                            cursor: "w-full bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20",
                            tab: "h-9 px-4 text-slate-500 dark:text-slate-400 data-[selected=true]:text-white font-semibold text-sm transition-all",
                            tabContent: "group-data-[selected=true]:text-white"
                        }}
                    >
                        {hasTonalidades && <Tab key="tonalidades" title="Tonalidades" />}
                        {hasTallas && <Tab key="tallas" title="Tallas" />}
                        {hasUnidades && <Tab key="unidades" title="Unidades" />}
                        {hasAttributes && <Tab key="atributos" title="Otros Atributos" />}
                    </Tabs>
                </div>

                {/* Content */}
                <div className="min-h-[400px]">
                    {activeTab === 'tonalidades' && hasTonalidades && <Tonalidades />}
                    {activeTab === 'tallas' && hasTallas && <Tallas />}
                    {activeTab === 'unidades' && hasUnidades && <Unidades />}
                    {activeTab === 'atributos' && hasAttributes && <AttributesPage />}
                </div>

            </div>
        </motion.div>
    );
}

export default Variantes;
