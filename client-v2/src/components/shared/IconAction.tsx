import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface IconActionProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}

/**
 * Botón de acción de ícono con tooltip. Estándar para las columnas de acciones
 * de las tablas del ERP (editar, eliminar, dar de baja, ver, etc.).
 */
export function IconAction({ label, onClick, disabled, danger, children }: IconActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className={cn(
            "h-8 w-8 text-muted-foreground hover:bg-accent disabled:opacity-30",
            danger ? "hover:bg-destructive/10 hover:text-destructive" : "hover:text-foreground"
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
