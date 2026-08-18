import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MasonryProps = {
  children: ReactNode;
  columns?: 2 | 3;
  className?: string;
};

/** Masonry por columnas CSS. Usar ArtworkCard como hijos directos. */
export function Masonry({ children, columns = 3, className }: MasonryProps) {
  return (
    <div className={cn(columns === 2 ? "at-masonry-2" : "at-masonry", className)}>{children}</div>
  );
}

export function MasonryItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("break-inside-avoid", className)}>{children}</div>;
}
