import React, { useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChangeValue: (value: string) => void;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  showClearButton?: boolean;
}

export function SearchInput({
  value,
  onChangeValue,
  placeholder = "Buscar…",
  className,
  wrapperClassName,
  showClearButton = true,
  ...props
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChangeValue("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      handleClear();
    }
    props.onKeyDown?.(e);
  };

  return (
    <div className={cn("relative flex items-center w-full max-w-sm group", wrapperClassName)}>
      <Search className="absolute left-3 h-4 w-4 shrink-0 text-muted-foreground/70 pointer-events-none transition-colors group-focus-within:text-primary" />
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChangeValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "pl-9 pr-8 h-9 text-xs sm:text-sm bg-background/80 hover:bg-background border-border/80",
          "focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/60",
          "rounded-lg transition-all shadow-xs placeholder:text-muted-foreground/60",
          className
        )}
        {...props}
      />
      {showClearButton && value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 p-1 text-muted-foreground/60 hover:text-foreground rounded-md transition-colors cursor-pointer"
          title="Limpiar búsqueda (Esc)"
          aria-label="Limpiar búsqueda"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
