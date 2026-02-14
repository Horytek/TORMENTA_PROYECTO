import { cva } from "class-variance-authority";
import { cn } from "../../../lib/utils";
import React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-2xl font-bold transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none active:scale-95",
  {
    variants: {
      variant: {
        primary:
          "bg-white text-[#000000] hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-[1.02] relative z-10",
        secondary:
          "bg-transparent text-white border border-white/20 hover:bg-white/5 hover:border-white/40",
        accent:
          "bg-amber-500 text-[#000000] hover:bg-amber-400 shadow-lg shadow-amber-500/20 hover:-translate-y-1 relative z-10",
        ghost:
          "bg-transparent text-gray-400 hover:text-white hover:bg-white/5",
        outlineWhite:
          "bg-transparent text-white border border-white/20 hover:bg-white hover:text-[#000000]",
      },
      size: {
        default: "px-6 py-3 text-base",
        sm: "px-4 py-2 text-sm",
        lg: "px-8 py-4 text-lg",
        xl: "px-8 py-4 text-xl",
      },
      fullWidth: {
        true: "w-full",
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      fullWidth: false,
    },
  }
);

export const LandingButton = React.forwardRef(
  ({ className, variant, size, fullWidth, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

LandingButton.displayName = "LandingButton";
