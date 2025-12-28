import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@heroui/react";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavPermissions } from "./useNavPermissions";

export default function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const filteredNav = useNavPermissions();

    // Track expanded sections in mobile menu
    const [expandedKeys, setExpandedKeys] = useState([]);

    const toggleSection = (key) => {
        setExpandedKeys(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const isActive = (path) => location.pathname.startsWith(path);

    return (
        <div className="md:hidden">
            <Button
                isIconOnly
                variant="light"
                onPress={() => setIsOpen(true)}
            >
                <Menu size={24} className="text-slate-700 dark:text-slate-200" />
            </Button>

            {/* Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/20 z-[90] backdrop-blur-sm"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-white dark:bg-zinc-950 shadow-2xl z-[100] border-l border-slate-200 dark:border-zinc-800 flex flex-col"
                        >
                            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/50 backdrop-blur-md">
                                <span className="font-bold text-lg text-slate-800 dark:text-white">Menú</span>
                                <Button isIconOnly size="sm" variant="light" onPress={() => setIsOpen(false)}>
                                    <X size={20} />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {Object.entries(filteredNav).map(([key, data]) => {
                                    const isExpanded = expandedKeys.includes(key);

                                    if (!data.items) {
                                        return (
                                            <Link
                                                key={key}
                                                to={data.url}
                                                onClick={() => setIsOpen(false)}
                                                className={`flex items-center gap-3 p-4 rounded-xl transition-all font-medium ${isActive(data.url)
                                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-900"
                                                    }`}
                                            >
                                                {data.icon && <data.icon size={22} />}
                                                {data.title}
                                            </Link>
                                        );
                                    }

                                    return (
                                        <div key={key} className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                                            <button
                                                onClick={() => toggleSection(key)}
                                                className="w-full flex items-center justify-between p-4 bg-slate-50/50 dark:bg-zinc-900/50 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
                                            >
                                                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                    {/* Optional: Add icon here if needed */}
                                                    {data.title}
                                                </span>
                                                <ChevronDown
                                                    size={18}
                                                    className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                                />
                                            </button>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="p-2 space-y-1 bg-white dark:bg-zinc-950">
                                                            {data.items.map((item, idx) => (
                                                                <Link
                                                                    key={idx}
                                                                    to={item.url}
                                                                    onClick={() => setIsOpen(false)}
                                                                    className={`flex items-center gap-3 p-3.5 rounded-lg transition-all ${isActive(item.url)
                                                                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-zinc-900"
                                                                        }`}
                                                                >
                                                                    <div className={`p-1.5 rounded-md ${isActive(item.url) ? "bg-white dark:bg-zinc-900" : "bg-slate-100 dark:bg-zinc-900"}`}>
                                                                        {item.icon && <item.icon size={16} />}
                                                                    </div>
                                                                    <span className="text-sm font-medium">{item.title}</span>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
