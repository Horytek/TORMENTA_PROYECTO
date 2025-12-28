import { Card, CardHeader, CardBody, Button, Divider } from "@heroui/react";
import { Command, Plus, ArrowRight, FileText, Package, Users } from "lucide-react";
import { Link } from "react-router-dom";

export function QuickActionsCard() {

    const actions = [
        { icon: Plus, label: "Nueva Venta", path: "/ventas/registro_venta", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-100" },
        { icon: FileText, label: "Nota Almacén", path: "/nota_almacen", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-100" },
        { icon: Package, label: "Nuevo Producto", path: "/productos", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-900/20", border: "border-violet-100" },
        { icon: Users, label: "Nuevo Cliente", path: "/clientes", color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-900/20", border: "border-rose-100" },
    ];

    return (
        <Card className="h-full border-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:shadow-none bg-white dark:bg-zinc-900 dark:border dark:border-zinc-800 rounded-2xl overflow-hidden">
            <CardHeader className="flex items-center justify-between px-5 py-4 border-b border-slate-50 dark:border-zinc-800/50">
                <div>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">Acciones</h2>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-50 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                    <Command size={14} />
                </div>
            </CardHeader>

            <CardBody className="px-4 py-3">
                <ul className="grid grid-cols-2 gap-2">
                    {actions.map((action, idx) => (
                        <li key={idx}>
                            <Link
                                to={action.path}
                                className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 hover:border-slate-200 transition-all duration-200 group text-center h-full"
                            >
                                <div className={`p-2 rounded-full ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                                    <action.icon size={16} strokeWidth={2.5} />
                                </div>
                                <span className="font-semibold text-[10px] text-slate-600 dark:text-slate-300 leading-tight">{action.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </CardBody>
        </Card>
    );
}
