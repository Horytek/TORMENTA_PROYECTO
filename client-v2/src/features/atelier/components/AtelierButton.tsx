import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const atelierButtonVariants = cva(
  "at-ui at-focus inline-flex shrink-0 items-center justify-center gap-2 font-medium tracking-tight transition-colors duration-200 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--at-accent)] text-[var(--at-accent-ink)] hover:bg-[color-mix(in_srgb,var(--at-accent)_88%,black)]",
        secondary:
          "border border-[var(--at-ink)] bg-transparent text-[var(--at-ink)] hover:bg-[var(--at-ink)] hover:text-[var(--at-offwhite)]",
        tertiary:
          "bg-transparent text-[var(--at-ink)] underline-offset-[6px] hover:underline",
      },
      size: {
        sm: "h-9 px-3.5 text-[13px]",
        default: "h-11 px-5 text-[14px]",
        lg: "h-12 px-6 text-[15px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type AtelierButtonProps = ComponentProps<"button"> &
  VariantProps<typeof atelierButtonVariants> & {
    asChild?: boolean;
  };

export function AtelierButton({
  className,
  variant = "primary",
  size = "default",
  asChild = false,
  type = "button",
  ...props
}: AtelierButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="atelier-button"
      data-variant={variant}
      className={cn(atelierButtonVariants({ variant, size }), className)}
      {...(!asChild ? { type } : null)}
      {...props}
    />
  );
}

export { atelierButtonVariants };
