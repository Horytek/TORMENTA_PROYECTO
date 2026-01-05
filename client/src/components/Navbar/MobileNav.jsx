import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button, Switch } from "@heroui/react";
import { Menu, X, ChevronDown, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useNavPermissions } from "./useNavPermissions";
import { useTheme } from "@heroui/use-theme";

export default function MobileNav() {
    const navData = useNavPermissions();
    const [isOpen, setIsOpen] = useState(false);
    const [expandedSections, setExpandedSections] = useState({});
    const location = useLocation();
    const { theme, setTheme } = useTheme();

    const entries = useMemo(() => {
        if (!navData) return [];
        return Object.entries(navData);
    }, [navData]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
            setExpandedSections({});
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const isActive = (path) =>
        location.pathname === path || location.pathname.startsWith(path + "/");

    const toggleSection = (key) => {
        setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const drawer = (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                    />

                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 220 }}
                        className="fixed top-0 left-0 h-full w-[300px] bg-white dark:bg-zinc-950 shadow-2xl z-[9999] overflow-y-auto border-r border-slate-200 dark:border-zinc-800"
                    >
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-10">
                                <div className="flex flex-col leading-tight">
                                    <span className="font-extrabold text-slate-900 dark:text-white">
                                        Menú
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        Navegación
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Switch
                                        isSelected={theme === "dark"}
                                        onValueChange={(v) => setTheme(v ? "dark" : "light")}
                                        color="secondary"
                                        size="sm"
                                        thumbIcon={({ isSelected, className }) =>
                                            isSelected ? (<Sun className={className} size={14} />) : (<Moon className={className} size={14} />)
                                        }
                                        aria-label="Cambiar modo oscuro"
                                    />
                                    <Button
                                        isIconOnly
                                        variant="light"
                                        size="sm"
                                        onClick={() => setIsOpen(false)}
                                        aria-label="Cerrar menú"
                                    >
                                        <X size={18} />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 p-3 space-y-2">
                                {entries.map(([key, data]) => {
                                    const Icon = data.icon;

                                    // Link simple
                                    if (!data.items || data.items.length === 0) {
                                        const active = data.url ? isActive(data.url) : false;

                                        return (
                                            <Link
                                                key={key}
                                                to={data.url}
                                                onClick={() => setIsOpen(false)}
                                                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors border ${active
                                                        ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/25 dark:text-blue-300 dark:border-blue-900/30"
                                                        : "text-slate-800 border-transparent hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-zinc-900"
                                                    }`}
                                            >
                                                {Icon && <Icon size={18} className="opacity-80" />}
                                                <span className="font-semibold">{data.title}</span>
                                            </Link>
                                        );
                                    }

                                    // Grupo
                                    const isExpanded = !!expandedSections[key];
                                    const hasActiveChild = Array.isArray(data.items)
                                        ? data.items.some((sub) => sub?.url && isActive(sub.url))
                                        : false;

                                    return (
                                        <div
                                            key={key}
                                            className={`rounded-xl border overflow-hidden ${hasActiveChild
                                                    ? "border-blue-100 bg-blue-50/30 dark:border-blue-900/30 dark:bg-blue-900/10"
                                                    : "border-slate-100 dark:border-zinc-800"
                                                }`}
                                        >
                                            <button
                                                onClick={() => toggleSection(key)}
                                                aria-label={data.title}
                                                className="w-full flex items-center justify-between px-3 py-3 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors"
                                            >
                                                <span
                                                    className={`font-bold text-sm flex items-center gap-3 ${hasActiveChild
                                                            ? "text-blue-700 dark:text-blue-300"
                                                            : "text-slate-900 dark:text-slate-100"
                                                        }`}
                                                >
                                                    {Icon && (
                                                        <Icon
                                                            size={18}
                                                            className={
                                                                hasActiveChild ? "text-blue-500" : "text-slate-500"
                                                            }
                                                        />
                                                    )}
                                                    {data.title}
                                                </span>
                                                <ChevronDown
                                                    size={16}
                                                    className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                                                        }`}
                                                />
                                            </button>

                                            <AnimatePresence initial={false}>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-2 pb-2 space-y-1">
                                                            {data.items.map((item, idx) => {
                                                                const active = item.url ? isActive(item.url) : false;

                                                                return (
                                                                    <Link
                                                                        key={`${key}-${idx}`}
                                                                        to={item.url}
                                                                        onClick={() => setIsOpen(false)}
                                                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${active
                                                                                ? "bg-blue-100/70 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                                                                                : "text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-zinc-900"
                                                                            }`}
                                                                    >
                                                                        <span
                                                                            className={`w-1.5 h-1.5 rounded-full ${active
                                                                                    ? "bg-blue-500"
                                                                                    : "bg-slate-300 dark:bg-zinc-700"
                                                                                }`}
                                                                        />
                                                                        <span className="font-medium">{item.title}</span>
                                                                    </Link>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-3 border-t border-slate-100 dark:border-zinc-800 text-[11px] text-center text-slate-400">
                                v2.0.0
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <Button
                isIconOnly
                variant="light"
                onClick={() => setIsOpen(true)}
                className="lg:hidden text-slate-700 dark:text-slate-200"
                aria-label="Abrir menú"
            >
                <Menu size={22} />
            </Button>
            {createPortal(drawer, document.body)}
        </>
    );
}
