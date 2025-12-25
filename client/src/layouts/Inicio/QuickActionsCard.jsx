import { Card, CardHeader, CardBody, Button, Divider } from "@heroui/react";
import { Command, Plus, ArrowRight, FileText, Package, Users } from "lucide-react";
import { Link } from "react-router-dom";

export function QuickActionsCard() {

    const actions = [
        { icon: Plus, label: "Nueva Venta", path: "/ventas/registro_venta", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
        { icon: FileText, label: "Nota de Almacén", path: "/nota_almacen", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
        { icon: Package, label: "Nuevo Producto", path: "/productos", color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20" },
        { icon: Users, label: "Registrar Cliente", path: "/clientes", color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20" },
    ];

    return (
        <Card className="h-full border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden group">
            <CardHeader className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-zinc-800/50">
                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 text-slate-600 dark:text-slate-300">
                    <Command size={16} />
                </div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">Acciones Rápidas</h2>
            </CardHeader>

            <CardBody className="px-3 py-2">
                <ul className="grid grid-cols-1 gap-1">
                    {actions.map((action, idx) => (
                        <li key={idx}>
                            <Link
                                to={action.path}
                                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 transition-all duration-200 group/item text-left"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className={`p-1.5 rounded-md ${action.bg} ${action.color}`}>
                                        <action.icon size={14} />
                                    </div>
                                    <span className="font-semibold text-xs text-slate-600 dark:text-slate-300 group-hover/item:text-slate-900 dark:group-hover/item:text-white transition-colors">{action.label}</span>
                                </div>
                                <ArrowRight size={12} className="text-slate-300 dark:text-zinc-600 group-hover/item:text-slate-500 dark:group-hover/item:text-slate-400 opacity-0 group-hover/item:opacity-100 transition-all transform group-hover/item:translate-x-1" />
                            </Link>
                        </li>
                    ))}
                </ul>
            </CardBody>
        </Card>
    );
}
