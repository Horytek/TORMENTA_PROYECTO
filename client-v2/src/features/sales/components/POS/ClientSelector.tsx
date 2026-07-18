import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Search, X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

import type { ClienteForSale } from "@/features/sales/types";
import { clienteNombre, clienteDocumento } from "@/features/sales/types";
import api from "@/api/axios";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────
// Cliente "VARIOS" por defecto
// ─────────────────────────────────────────────────────────────────
export const CLIENTE_VARIOS: ClienteForSale = {
  id_cliente: 0,
  nombres: "Varios",
  apellidos: "",
  razon_social: "",
  dni: "",
  ruc: "",
  direccion: "",
};

// ─────────────────────────────────────────────────────────────────
// ClientSelector — búsqueda dinámica de clientes en el POS
// ─────────────────────────────────────────────────────────────────

interface ClientSelectorProps {
  value: ClienteForSale | null;
  onChange: (cliente: ClienteForSale | null) => void;
}

interface ApiCliente {
  id_cliente: number;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  dni?: string;
  ruc?: string;
  direccion?: string;
}

export function ClientSelector({ value, onChange }: ClientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Búsqueda con debounce
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(v), 300);
  }, []);

  // Consulta de clientes
  const { data: resultados = [], isLoading } = useQuery<ClienteForSale[]>({
    queryKey: ["clientes-pos", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch.trim()) return [];
      const params: Record<string, string> = { searchTerm: debouncedSearch.trim(), limit: "20" };
      // Si parece un número (DNI), buscar por documento
      if (/^\d+$/.test(debouncedSearch.trim())) {
        params.docNumber = debouncedSearch.trim();
      }
      const res = await api.get("/clientes", { params });
      const raw: ApiCliente[] = res.data?.data || [];
      return raw.map((c): ClienteForSale => ({
        id_cliente: c.id_cliente,
        nombres: c.nombres || "",
        apellidos: c.apellidos || "",
        razon_social: c.razon_social || "",
        dni: c.dni || "",
        ruc: c.ruc || "",
        direccion: c.direccion || "",
      }));
    },
    enabled: debouncedSearch.trim().length > 0,
  });

  // Enfocar input al abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch("");
      setDebouncedSearch("");
    }
  }, [open]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const seleccionar = (c: ClienteForSale | null) => {
    onChange(c);
    setOpen(false);
    setSearch("");
    setDebouncedSearch("");
  };

  const displayName = value
    ? value.id_cliente === 0
      ? "Cliente Varios"
      : clienteNombre(value)
    : "Sin cliente";

  const displayDoc = value && value.id_cliente !== 0 ? clienteDocumento(value) : null;

  return (
    <div ref={popoverRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border px-2.5 h-8 text-xs transition-all cursor-pointer shrink-0",
          value
            ? "border-border bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            : "border-dashed border-muted-foreground/40 hover:border-primary/40 hover:text-foreground text-muted-foreground"
        )}
      >
        <User className="h-3 w-3 shrink-0" />
        <span className={cn("font-medium", !value && "italic")}>{displayName}</span>
        {displayDoc && (
          <Badge variant="secondary" className="h-4 px-1 text-[9px] ml-1">
            {value?.ruc ? "RUC" : "DNI"} {displayDoc}
          </Badge>
        )}
        {value && (
          <span
            onClick={(e) => { e.stopPropagation(); seleccionar(null); }}
            className="ml-0.5 rounded-sm opacity-50 hover:opacity-100 text-muted-foreground"
          >
            <X className="h-2.5 w-2.5" />
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-72 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Input de búsqueda */}
          <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar por nombre o DNI…"
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
            {isLoading && <Spinner size="xs" />}
          </div>

          {/* Lista de resultados */}
          <div className="max-h-60 overflow-y-auto">
            <div className="py-1">
              {/* Opción "Cliente Varios" */}
              <button
                onClick={() => seleccionar(CLIENTE_VARIOS)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors",
                  value?.id_cliente === 0
                    ? "bg-primary/10"
                    : "hover:bg-muted/60"
                )}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <User className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">Cliente Varios</p>
                  <p className="text-[10px] text-muted-foreground">Venta sin identificación</p>
                </div>
                {value?.id_cliente === 0 && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                )}
              </button>

              {/* Resultados de búsqueda */}
              {resultados.map((c) => {
                const isSelected = value?.id_cliente === c.id_cliente && c.id_cliente !== 0;
                return (
                  <button
                    key={c.id_cliente}
                    onClick={() => seleccionar(c)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors",
                      isSelected
                        ? "bg-primary/10"
                        : "hover:bg-muted/60"
                    )}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <User className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">
                        {clienteNombre(c)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {clienteDocumento(c)}
                        {c.direccion && ` · ${c.direccion}`}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })}

              {/* Sin resultados */}
              {!isLoading && debouncedSearch.trim().length > 0 && resultados.length === 0 && (
                <div className="px-3 py-4 text-center">
                  <p className="text-xs text-muted-foreground">No se encontraron clientes</p>
                </div>
              )}

              {/* Hint inicial */}
              {!isLoading && debouncedSearch.trim().length === 0 && (
                <div className="px-3 py-3 text-center">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Escribe para buscar por nombre o número de documento
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
