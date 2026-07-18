import * as React from "react";
import { cn } from "@/lib/utils";

export interface HorytekIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: number;
  title?: string;
}

export function HorytekIcon({
  size = 24,
  className,
  title,
  ...props
}: HorytekIconProps) {
  return (
    <img
      src="/horycore.svg"
      alt={title || "Horytek"}
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      {...(props as any)}
    />
  );
}

export interface HorytekMarkProps {
  size?: number;
  className?: string;
  iconOnly?: boolean;
  title?: string;
}

export function HorytekMark({
  size = 28,
  className,
  iconOnly = false,
  title = "Horytek",
}: HorytekMarkProps) {
  if (iconOnly) {
    return <HorytekIcon size={size} className={className} title={title} />;
  }
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <HorytekIcon size={size} title={title} />
      <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
        {title}
      </span>
    </div>
  );
}

export default HorytekIcon;