import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AttrChipsEditor({
  label,
  values,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v || disabled) return;
    if (values.some((x) => x.toLowerCase() === v.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, v]);
    setDraft("");
  };
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-stone-500">{label}</p>
      <div className="flex flex-wrap gap-1 min-h-[22px]">
        {values.length === 0 && (
          <span className="text-[11px] text-stone-300">Sin valores</span>
        )}
        {values.map((v) => (
          <button
            key={v}
            type="button"
            disabled={disabled}
            className="text-[11px] rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 hover:bg-stone-100 disabled:opacity-50"
            onClick={() => onChange(values.filter((x) => x !== v))}
            title="Quitar"
          >
            {v} ×
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        <Input
          className="h-8 text-xs"
          value={draft}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 shrink-0"
          disabled={disabled}
          onClick={add}
        >
          +
        </Button>
      </div>
    </div>
  );
}
