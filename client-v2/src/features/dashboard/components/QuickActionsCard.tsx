import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Package, Users, Command } from "lucide-react";
import { Link } from "react-router-dom";

export function QuickActionsCard() {
  const actions = [
    {
      icon: Plus,
      label: "Nueva Venta",
      path: "/sales",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "hover:border-blue-200 dark:hover:border-blue-800",
    },
    {
      icon: FileText,
      label: "Nota Almacén",
      path: "/logistics/warehouse-notes",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "hover:border-emerald-200 dark:hover:border-emerald-800",
    },
    {
      icon: Package,
      label: "Nuevo Producto",
      path: "/products",
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/40",
      border: "hover:border-violet-200 dark:hover:border-violet-800",
    },
    {
      icon: Users,
      label: "Nuevo Cliente",
      path: "/people/clients",
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      border: "hover:border-rose-200 dark:hover:border-rose-800",
    },
  ];

  return (
    <Card className="border border-border shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <CardTitle className="text-sm font-bold uppercase tracking-wide text-foreground">
            Acciones Rápidas
          </CardTitle>
        </div>
        <div className="p-1.5 rounded-lg bg-secondary text-muted-foreground">
          <Command size={14} />
        </div>
      </CardHeader>

      <CardContent className="px-4 py-3">
        <ul className="grid grid-cols-2 gap-2">
          {actions.map((action, idx) => (
            <li key={idx}>
              <Link
                to={action.path}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl hover:bg-muted/30 border border-border transition-all duration-200 group text-center h-full ${action.border}`}
              >
                <div className={`p-2 rounded-full ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                  <action.icon size={16} strokeWidth={2.5} />
                </div>
                <span className="font-semibold text-[10px] text-muted-foreground group-hover:text-foreground leading-tight">
                  {action.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
