import { TALLAS_CATALOGO } from "../../utils/productoAttrs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function TallaMultiSelect({
  values,
  onChange,
  disabled,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [otra, setOtra] = useState("");
  const selected = new Set(values);

  const toggle = (t: string) => {
    if (disabled) return;
    if (selected.has(t)) onChange(values.filter((x) => x !== t));
    else onChange([...values, t]);
  };

  const addOtra = () => {
    const v = otra.trim().toUpperCase();
    if (!v || disabled) return;
    if (!values.some((x) => x.toLowerCase() === v.toLowerCase())) {
      onChange([...values, v]);
    }
    setOtra("");
  };

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium text-stone-500">Tallas</p>
      <div className="flex flex-wrap gap-1.5">
        {TALLAS_CATALOGO.map((t) => {
          const on = selected.has(t);
          return (
            <button
              key={t}
              type="button"
              disabled={disabled}
              onClick={() => toggle(t)}
              className={`min-w-9 h-8 px-2 rounded-md border text-xs font-medium transition-colors disabled:opacity-50 ${
                on
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>
      {values.some((v) => !(TALLAS_CATALOGO as readonly string[]).includes(v)) && (
        <div className="flex flex-wrap gap-1">
          {values
            .filter((v) => !(TALLAS_CATALOGO as readonly string[]).includes(v))
            .map((v) => (
              <button
                key={v}
                type="button"
                disabled={disabled}
                className="text-[11px] rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 hover:bg-stone-100"
                onClick={() => onChange(values.filter((x) => x !== v))}
                title="Quitar"
              >
                {v} ×
              </button>
            ))}
        </div>
      )}
      <div className="flex gap-1 max-w-xs">
        <Input
          className="h-8 text-xs"
          value={otra}
          disabled={disabled}
          placeholder="Otra talla…"
          onChange={(e) => setOtra(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addOtra();
            }
          }}
        />
        <Button type="button" size="sm" variant="outline" className="h-8" disabled={disabled} onClick={addOtra}>
          +
        </Button>
      </div>
    </div>
  );
}
