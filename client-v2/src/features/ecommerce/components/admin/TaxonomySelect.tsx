import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  adminCreateTaxonomia,
  adminListTaxonomia,
  type TaxonomiaTipo,
} from "../../api/ecommerce";
import { useEcommerceAuthStore } from "../../store/useEcommerceAuthStore";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Termino = { id_termino: number; nombre: string; activo: boolean };

type BaseProps = {
  tipo: TaxonomiaTipo;
  placeholder?: string;
  disabled?: boolean;
};

type SingleProps = BaseProps & {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
};

type MultiProps = BaseProps & {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
};

export function TaxonomySelect(props: SingleProps | MultiProps) {
  const { tipo, placeholder = "Buscar…", disabled } = props;
  const multiple = Boolean(props.multiple);
  const tid = useEcommerceAuthStore((s) => s.user?.id_tienda);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const listQ = useQuery({
    queryKey: ["ecom-taxonomia", tid, tipo],
    queryFn: () => adminListTaxonomia({ tipo, activo: "1" }),
    enabled: Boolean(tid),
  });
  const terminos = (listQ.data?.data || []) as Termino[];

  const selected = useMemo(() => {
    if (props.multiple) return props.value;
    return props.value ? [props.value] : [];
  }, [props]);

  const qTrim = q.trim();
  const exact = terminos.some((t) => t.nombre.toLowerCase() === qTrim.toLowerCase());
  const canCreate = qTrim.length > 0 && !exact;

  const createMut = useMutation({
    mutationFn: (nombre: string) => adminCreateTaxonomia({ tipo, nombre, ensure: true }),
    onSuccess: (res, nombre) => {
      const created = String(res?.data?.nombre || nombre).trim();
      qc.invalidateQueries({ queryKey: ["ecom-taxonomia", tid, tipo] });
      pick(created);
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo crear"),
  });

  const pick = (nombre: string) => {
    if (props.multiple) {
      const on = props.value.includes(nombre);
      props.onChange(on ? props.value.filter((v) => v !== nombre) : [...props.value, nombre]);
      setQ("");
      return;
    }
    props.onChange(props.value === nombre ? "" : nombre);
    setOpen(false);
    setQ("");
  };

  const label = !multiple && props.value ? props.value : placeholder;

  return (
    <div className="space-y-2">
      {multiple && selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((t) => (
            <button
              key={t}
              type="button"
              className="inline-flex items-center gap-1 min-h-9 px-2.5 rounded-full border border-teal-600 bg-teal-50 text-teal-800 text-sm touch-manipulation"
              onClick={() => pick(t)}
            >
              {t}
              <X className="size-3.5" />
            </button>
          ))}
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full min-h-11 justify-between font-normal"
          >
            <span className={cn("truncate", !multiple && !props.value && "text-stone-400")}>
              {multiple ? placeholder : label}
            </span>
            <span className="flex items-center gap-1 shrink-0">
              {!props.multiple && props.value ? (
                <span
                  role="button"
                  tabIndex={-1}
                  className="rounded p-1 hover:bg-stone-100"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    props.onChange("");
                  }}
                >
                  <X className="size-3.5 opacity-60" />
                </span>
              ) : null}
              <ChevronsUpDown className="size-4 opacity-50" />
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-0"
        >
          <Command shouldFilter>
            <CommandInput
              value={q}
              onValueChange={setQ}
              placeholder={placeholder}
              className="min-h-11"
            />
            <CommandList className="max-h-56">
              <CommandEmpty>No hay coincidencias.</CommandEmpty>
              <CommandGroup>
                {canCreate && (
                  <CommandItem
                    value={`crear ${qTrim}`}
                    onSelect={() => createMut.mutate(qTrim)}
                    className="min-h-11"
                  >
                    <Plus className="size-4 text-teal-700" />
                    Crear «{qTrim}»
                  </CommandItem>
                )}
                {terminos.map((t) => {
                  const on = selected.includes(t.nombre);
                  return (
                    <CommandItem
                      key={t.id_termino}
                      value={t.nombre}
                      onSelect={() => pick(t.nombre)}
                      className="min-h-11"
                    >
                      <Check className={cn("size-4", on ? "opacity-100" : "opacity-0")} />
                      {t.nombre}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
