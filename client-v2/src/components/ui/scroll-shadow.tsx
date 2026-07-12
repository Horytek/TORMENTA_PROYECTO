import { cn } from "@/lib/utils";

interface ScrollShadowProps {
  children: React.ReactNode;
  className?: string;
  orientation?: "vertical" | "horizontal";
}

export function ScrollShadow({ children, className }: ScrollShadowProps) {
  return (
    <div className={cn("overflow-auto", className)}>
      {children}
    </div>
  );
}
