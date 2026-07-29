import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  getRecentSearches,
  pushRecentSearch,
  clearRecentSearches,
  searchRoutes,
  type SearchableRoute,
} from "./searchableRoutes";
import { useUserStore } from "@/store/useUserStore";
import { usePermissions } from "@/hooks/usePermissions";
import { buildSearchableRoutes } from "@/lib/navigationCatalog";
import { ArrowRight, Clock, X, User, Package, Receipt } from "lucide-react";
import { getClientes } from "@/features/clientes/api/clientes";
import { clienteNombre } from "@/features/clientes/types";
import { getProducts } from "@/features/products/api/products";
import { buscarVentas } from "@/features/sales/api/ventas";

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

interface SearchCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchCommandDialog({ open, onOpenChange }: SearchCommandDialogProps) {
  const navigate = useNavigate();
  const globalModuleConfigs = useUserStore((s) => s.globalModuleConfigs);
  const { can, isDeveloper } = usePermissions();

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const searchEnabled = open && debouncedQuery.trim().length >= 2;

  // Reset query al cerrar
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const { data: clientesResult } = useQuery({
    queryKey: ["search-clientes", debouncedQuery],
    queryFn: () => getClientes({ searchTerm: debouncedQuery, limit: 5 }),
    enabled: searchEnabled,
  });

  const { data: productosResult } = useQuery({
    queryKey: ["search-productos", debouncedQuery],
    queryFn: () => getProducts({ q: debouncedQuery, limit: 5 }),
    enabled: searchEnabled,
  });

  const { data: ventasResult } = useQuery({
    queryKey: ["search-ventas", debouncedQuery],
    queryFn: () => buscarVentas(debouncedQuery),
    enabled: searchEnabled,
  });

  const allRoutes = useMemo(() => buildSearchableRoutes(globalModuleConfigs), [globalModuleConfigs]);

  // Filtrar por capabilities del usuario (developer ve todo)
  const availableRoutes = useMemo<SearchableRoute[]>(() => {
    if (isDeveloper) return allRoutes;
    return allRoutes.filter((r) => !r.capability || can(`${r.capability}.view`));
  }, [allRoutes, can, isDeveloper]);

  const recentUrls = useMemo(() => getRecentSearches(), [open]);

  const recentRoutes = useMemo<SearchableRoute[]>(
    () =>
      recentUrls
        .map((u) => availableRoutes.find((r) => r.url === u))
        .filter((r): r is SearchableRoute => Boolean(r)),
    [recentUrls, availableRoutes]
  );

  const results = useMemo(
    () => searchRoutes(availableRoutes, query),
    [availableRoutes, query]
  );

  // Agrupar resultados por grupo (preservando el orden de secciones del sidebar)
  const grouped = useMemo(() => {
    const map = new Map<string, SearchableRoute[]>();
    for (const r of results) {
      const list = map.get(r.group) ?? [];
      list.push(r);
      map.set(r.group, list);
    }
    return Array.from(map.entries());
  }, [results]);

  const handleSelect = (route: SearchableRoute) => {
    pushRecentSearch(route.url);
    onOpenChange(false);
    navigate(route.url);
  };

  const handleClearRecent = () => {
    clearRecentSearches();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Búsqueda global"
      description="Busca módulos, pantallas y secciones del sistema."
      showCloseButton={false}
    >
      <CommandInput
        placeholder="Buscar módulos, pantallas…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No se encontraron resultados para “{query}”.</CommandEmpty>

        {!query && recentRoutes.length > 0 && (
          <CommandGroup heading="Recientes">
            {recentRoutes.map((r) => {
              const Icon = r.icon;
              return (
                <CommandItem
                  key={`recent-${r.url}`}
                  value={`recent-${r.title}`}
                  onSelect={() => handleSelect(r)}
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{r.title}</span>
                  <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground/60">
                    <Clock className="h-3 w-3" />
                    {r.group}
                  </span>
                </CommandItem>
              );
            })}
            <div className="px-2 pb-1">
              <button
                type="button"
                onClick={handleClearRecent}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70 hover:text-foreground"
              >
                <X className="h-3 w-3" /> Borrar recientes
              </button>
            </div>
            <CommandSeparator />
          </CommandGroup>
        )}

        {grouped.map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map((r) => {
              const Icon = r.icon;
              return (
                <CommandItem
                  key={r.url}
                  value={r.title}
                  onSelect={() => handleSelect(r)}
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{r.title}</span>
                  <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground/60">
                    Ir <ArrowRight className="h-3 w-3" />
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}

        {searchEnabled && clientesResult && clientesResult.length > 0 && (
          <CommandGroup heading="Clientes">
            {clientesResult.map((c) => (
              <CommandItem
                key={`cliente-${c.id}`}
                value={`cliente-${clienteNombre(c)}`}
                onSelect={() => {
                  onOpenChange(false);
                  navigate("/people/clients");
                }}
              >
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{clienteNombre(c)}</span>
                <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground/60">
                  Ir <ArrowRight className="h-3 w-3" />
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {searchEnabled && productosResult && productosResult.data.length > 0 && (
          <CommandGroup heading="Productos">
            {productosResult.data.map((p) => (
              <CommandItem
                key={`producto-${p.id_producto}`}
                value={`producto-${p.descripcion}`}
                onSelect={() => {
                  onOpenChange(false);
                  navigate("/products");
                }}
              >
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{p.descripcion}</span>
                <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground/60">
                  Ir <ArrowRight className="h-3 w-3" />
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {searchEnabled && ventasResult && ventasResult.length > 0 && (
          <CommandGroup heading="Comprobantes">
            {ventasResult.map((v) => (
              <CommandItem
                key={`venta-${v.id_venta}`}
                value={`venta-${v.num_comprobante}`}
                onSelect={() => {
                  onOpenChange(false);
                  navigate("/reports/sales");
                }}
              >
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{v.num_comprobante} — {v.cliente ?? "Sin cliente"}</span>
                <span className="ml-auto text-[11px] text-muted-foreground/60">{v.fecha}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!query && grouped.length === 0 && (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Empieza a escribir para buscar.
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}

/** Helper para registrar el atajo Ctrl/⌘+K desde un componente externo. */
export function useCommandK(open: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);
}