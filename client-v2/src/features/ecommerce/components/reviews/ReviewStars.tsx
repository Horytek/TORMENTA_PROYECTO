import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (n: number) => void;
  className?: string;
};

const SIZE = { sm: "size-3.5", md: "size-5", lg: "size-7" };

export function ReviewStars({
  value,
  size = "md",
  interactive = false,
  onChange,
  className,
}: Props) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={`${value} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= rounded;
        const cls = cn(
          SIZE[size],
          filled ? "fill-amber-400 text-amber-400" : "text-black/20 fill-transparent"
        );
        if (!interactive) {
          return <Star key={n} className={cls} />;
        }
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === value}
            className="p-0.5 rounded focus-visible:outline focus-visible:outline-2"
            onClick={() => onChange?.(n)}
          >
            <Star className={cls} />
          </button>
        );
      })}
    </div>
  );
}
