import type { TonalidadAttr } from "../../utils/productoAttrs";
import { normalizeHex } from "../../utils/productoAttrs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, ClipboardPaste, Plus, Trash2 } from "lucide-react";

export function TonalidadEditor({
  values,
  onChange,
  disabled,
  onCopy,
  onPaste,
  pasteLabel,
  canPaste,
}: {
  values: TonalidadAttr[];
  onChange: (next: TonalidadAttr[]) => void;
  disabled?: boolean;
  onCopy?: () => void;
  onPaste?: () => void;
  pasteLabel?: string;
  canPaste?: boolean;
}) {
  const updateAt = (idx: number, patch: Partial<TonalidadAttr>) => {
    onChange(values.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  };

  const hasNamed = values.some((t) => t.nombre.trim());

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-stone-500">Tonalidades</p>
        <div className="flex flex-wrap gap-1">
          {onCopy && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[11px]"
              disabled={disabled || !hasNamed}
              onClick={onCopy}
              title="Copiar tonalidades de este producto"
            >
              <Copy className="size-3 mr-1" />
              Copiar
            </Button>
          )}
          {onPaste && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[11px]"
              disabled={disabled || !canPaste}
              onClick={onPaste}
              title={pasteLabel || "Pegar tonalidades"}
            >
              <ClipboardPaste className="size-3 mr-1" />
              Pegar
            </Button>
          )}
        </div>
      </div>
      {values.length === 0 && (
        <p className="text-[11px] text-stone-300">Sin tonalidades — agrega color + nombre</p>
      )}
      <div className="space-y-2">
        {values.map((t, idx) => (
          <div key={idx} className="flex flex-wrap items-center gap-2">
            <input
              type="color"
              value={normalizeHex(t.hex)}
              disabled={disabled}
              className="size-9 rounded border border-stone-200 cursor-pointer bg-white p-0.5 disabled:opacity-50"
              onChange={(e) => updateAt(idx, { hex: e.target.value })}
              title="Color hexadecimal"
            />
            <span
              className="size-6 rounded-full border border-stone-200 shrink-0"
              style={{ backgroundColor: normalizeHex(t.hex) }}
              aria-hidden
            />
            <Input
              className="h-9 text-sm flex-1 min-w-[120px]"
              value={t.nombre}
              disabled={disabled}
              placeholder="Nombre (ej. Negro)"
              onChange={(e) => updateAt(idx, { nombre: e.target.value })}
            />
            <Input
              className="h-9 text-xs w-[100px] font-mono"
              value={t.hex}
              disabled={disabled}
              placeholder="#000000"
              onChange={(e) => updateAt(idx, { hex: e.target.value })}
              onBlur={() => updateAt(idx, { hex: normalizeHex(t.hex) })}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-9 text-stone-400 hover:text-red-600"
              disabled={disabled}
              onClick={() => onChange(values.filter((_, i) => i !== idx))}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() => onChange([...values, { nombre: "", hex: "#111111" }])}
      >
        <Plus className="size-3.5 mr-1" />
        Agregar tonalidad
      </Button>
    </div>
  );
}
