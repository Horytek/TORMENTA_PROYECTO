import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Sub-componentes presentacionales (slots) del `AdaptiveCard`.
 * Cada uno es un `div` neutral con data-slot, layout y estilos base —
 * el consumidor puede sobreescribirlos con `className` o `style`.
 *
 * Estructura esperada (composición libre, todos opcionales):
 *
 *   <AdaptiveCard variant="split-row">
 *     <CardMedia>...</CardMedia>     // cover / avatar / icon
 *     <CardHeader>...</CardHeader>   // título + subtítulo + chips
 *     <CardBody>...</CardBody>       // campos secundarios, descripciones
 *     <CardFooter>...</CardFooter>   // precio + stock + estado
 *     <CardAside>...</CardAside>     // columna derecha (índice, acciones, KPIs)
 *   </AdaptiveCard>
 *
 * Los slots funcionan **dentro** del card; no son "hijos sueltos" sino
 * children del componente principal. El `AdaptiveCard` decide dónde
 * colocar cada uno según el `variant`.
 */

// ─────────────────────────────────────────────────────────────────
// CardRail — el "rail" lateral izquierdo (sustituye al dot circular)
// ─────────────────────────────────────────────────────────────────
export const CardRail = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardRail({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="card-rail"
        className={cn(
          "flex shrink-0 items-start pl-3.5 pr-2.5 border-r rounded-l-2xl",
          className
        )}
        {...props}
      />
    );
  }
);

// ─────────────────────────────────────────────────────────────────
// CardMedia — cover / avatar / icon (zona izquierda o superior)
// ─────────────────────────────────────────────────────────────────
export const CardMedia = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardMedia({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="card-media"
        className={cn("flex shrink-0", className)}
        {...props}
      />
    );
  }
);

// ─────────────────────────────────────────────────────────────────
// CardHeader — zona superior (título + subtítulo + chips)
// ─────────────────────────────────────────────────────────────────
export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="card-header"
        className={cn("space-y-1", className)}
        {...props}
      />
    );
  }
);

// ─────────────────────────────────────────────────────────────────
// CardBody — zona media (campos secundarios, descripciones)
// ─────────────────────────────────────────────────────────────────
export const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardBody({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="card-body"
        className={cn("space-y-1.5", className)}
        {...props}
      />
    );
  }
);

// ─────────────────────────────────────────────────────────────────
// CardFooter — zona inferior (precio + stock + estado + meta)
// ─────────────────────────────────────────────────────────────────
export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="card-footer"
        className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5", className)}
        {...props}
      />
    );
  }
);

// ─────────────────────────────────────────────────────────────────
// CardAside — columna derecha (índice, acciones, KPI grande)
// ─────────────────────────────────────────────────────────────────
export const CardAside = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardAside({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="card-aside"
        className={cn("flex flex-col items-end justify-between gap-2 py-3 pr-3 pl-2", className)}
        {...props}
      />
    );
  }
);
