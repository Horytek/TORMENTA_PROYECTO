import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { demoLinksForProduct } from "../data/demoLinks";

const KIND_LABEL: Record<"portal" | "admin" | "ops", string> = {
  portal: "Cliente / portal",
  admin: "Administración",
  ops: "Operación",
};

const KIND_ORDER: Array<"portal" | "admin" | "ops"> = ["portal", "ops", "admin"];

type DemoSurfacesDropdownProps = {
  productId: string;
  accent: string;
  /** Estilo del trigger: navbar compacto o hero grande */
  size?: "sm" | "lg";
  label?: string;
  className?: string;
  /** Si no hay demos, href de respaldo (ej. #planes) */
  fallbackHref?: string;
};

/** Dropdown dinámico: todas las superficies demo del producto actual. */
export function DemoSurfacesDropdown({
  productId,
  accent,
  size = "sm",
  label = "Probar demo",
  className,
  fallbackHref,
}: DemoSurfacesDropdownProps) {
  const demos = demoLinksForProduct(productId);

  if (demos.length === 0) {
    if (!fallbackHref) return null;
    return (
      <Link
        to={fallbackHref}
        className={cn(
          "inline-flex items-center gap-1.5 font-semibold text-white",
          size === "lg" ? "min-h-11 rounded-xl px-5 py-3 text-[13px]" : "h-9 rounded-md px-3 text-[13px]",
          className,
        )}
        style={{ backgroundColor: accent }}
      >
        {label}
      </Link>
    );
  }

  if (demos.length === 1) {
    return (
      <Link
        to={demos[0].href}
        className={cn(
          "inline-flex items-center gap-1.5 font-semibold text-white",
          size === "lg" ? "min-h-11 rounded-xl px-5 py-3 text-[13px]" : "h-9 rounded-md px-3 text-[13px]",
          className,
        )}
        style={{ backgroundColor: accent }}
      >
        {label}
        <span className="font-normal opacity-80">· {demos[0].label}</span>
      </Link>
    );
  }

  const groups = KIND_ORDER.map((kind) => ({
    kind,
    items: demos.filter((d) => d.kind === kind),
  })).filter((g) => g.items.length > 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 font-semibold text-white outline-none transition-transform hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2",
            size === "lg" ? "min-h-11 rounded-xl px-5 py-3 text-[13px]" : "h-9 rounded-md px-3 text-[13px]",
            className,
          )}
          style={{ backgroundColor: accent }}
        >
          {label}
          <ChevronDown className={size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[14rem]">
        <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Superficies demo
        </DropdownMenuLabel>
        {groups.map((group, gi) => (
          <div key={group.kind}>
            {gi > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground">
              {KIND_LABEL[group.kind]}
            </DropdownMenuLabel>
            {group.items.map((d) => (
              <DropdownMenuItem key={d.href} asChild>
                <Link to={d.href} className="cursor-pointer">
                  {d.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
