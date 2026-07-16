import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
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
import { ArrowRight, Clock, X } from "lucide-react";

interface SearchCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchCommandDialog({ open, onOpenChange }: SearchCommandDialogProps) {
  const navigate = useNavigate();
  const globalModuleConfigs = useUserStore((s) => s.globalModuleConfigs);
  const { can, isDeveloper } = usePermissions();

  const [query, setQuery] = useState("");

  // Reset query al cerrar
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

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