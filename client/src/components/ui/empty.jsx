import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Card } from "@heroui/react";

function Empty({ className, children, ...props }) {
  return (
    <Card
      data-slot="empty"
      shadow="none"
      className={cn(
        // Fondo adaptado, borde sutil, padding compacto y transición suave
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 p-4 md:p-6 text-center text-balance transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
}

function EmptyHeader({ className, ...props }) {
  return (
    <div
      data-slot="empty-header"
      className={cn(
        "flex max-w-xs flex-col items-center gap-1 text-center",
        className
      )}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  "flex shrink-0 items-center justify-center mb-1 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-300 flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg:not([class*='size-'])]:size-5 shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function EmptyMedia({ className, variant = "default", ...props }) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

function EmptyTitle({ className, ...props }) {
  return (
    <div
      data-slot="empty-title"
      className={cn("text-base font-semibold tracking-tight text-gray-900 dark:text-white", className)}
      {...props}
    />
  );
}

function EmptyDescription({ className, ...props }) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        "text-gray-500 dark:text-gray-400 text-xs/relaxed [&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        className
      )}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full max-w-xs min-w-0 flex-col items-center gap-2 text-xs text-balance",
        className
      )}
      {...props}
    />
  );
}

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
};