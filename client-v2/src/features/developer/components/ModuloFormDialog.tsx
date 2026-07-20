import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ICON_NAMES, getIcon } from "@/lib/iconRegistry";
import { SECTION_ORDER } from "@/lib/navigationCatalog";
import { createModulo, updateModulo, getActions } from "../api/developer";
import type { Modulo } from "../types";

interface ModuloFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  modulo: Modulo | null;
}

const STANDARD_ACTIONS: { key: string; label: string }[] = [
  { key: "ver", label: "Ver" },
  { key: "crear", label: "Crear" },
  { key: "editar", label: "Editar" },
  { key: "eliminar", label: "Eliminar" },
  { key: "desactivar", label: "Desactivar" },
  { key: "generar", label: "Generar" },
];
const STANDARD_KEYS = STANDARD_ACTIONS.map((a) => a.key);

/** active_actions puede venir como array o string JSON; null = todas las estándar. */
const parseActive = (raw: string[] | string | null | undefined): string[] | null => {
  if (raw == null) return null;
  if (Array.isArray(raw)) return raw;
  try { const a = JSON.parse(raw); return Array.isArray(a) ? a : null; } catch { return null; }
};

export function ModuloFormDialog({ isOpen, onClose, modulo }: ModuloFormDialogProps) {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState("");
  const [ruta, setRuta] = useState("");
  const [icon, setIcon] = useState<string>("");
  const [groupName, setGroupName] = useState<string>("");
  const [sortOrder, setSortOrder] = useState(0);
  const [frontendRoute, setFrontendRoute] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  // Acciones habilitadas del módulo (estándar + custom). null en BD = todas las
  // estándar, que representamos como el set de las 6 marcadas.
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set(STANDARD_KEYS));
  const [error, setError] = useState<string | null>(null);

  // Catálogo de acciones custom disponibles (fuera de las 6 estándar).
  const { data: catalogActions = [] } = useQuery({ queryKey: ["developer-actions"], queryFn: getActions, enabled: isOpen });
  const customActions = catalogActions.filter((a) => a.is_active && !STANDARD_KEYS.includes(a.action_key));

  useEffect(() => {
    if (isOpen) {
      setNombre(modulo?.nombre_modulo ?? "");
      setRuta(modulo?.ruta ?? "");
      setIcon(modulo?.icon ?? "");
      setGroupName(modulo?.group_name ?? "");
      setSortOrder(modulo?.sort_order ?? 0);
      setFrontendRoute(modulo?.frontend_route ?? "");
      setIsVisible(modulo?.is_visible ?? true);
      setSelectedActions(new Set(parseActive(modulo?.active_actions) ?? STANDARD_KEYS));
      setError(null);
    }
  }, [isOpen, modulo]);

  const toggleAction = (key: string) =>
    setSelectedActions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  const mutation = useMutation({
    mutationFn: () => {
      // null = todas las estándar (default legado, no ensucia la BD); array si
      // se recortan las estándar o se agrega alguna custom.
      const arr = [...selectedActions];
      const isAllStandardOnly = arr.length === STANDARD_KEYS.length && STANDARD_KEYS.every((k) => selectedActions.has(k));
      const meta = {
        icon: icon || null,
        group_name: groupName || null,
        sort_order: sortOrder,
        frontend_route: frontendRoute || null,
        is_visible: isVisible,
        active_actions: isAllStandardOnly ? null : arr,
      };
      // Nota: el endpoint de creación espera `nombre` y el de edición espera
      // `nombre_modulo` (contratos ya existentes en el backend, no unificados acá).
      return modulo
        ? updateModulo(modulo.id_modulo, { nombre_modulo: nombre, ruta, ...meta })
        : createModulo({ nombre, ruta, ...meta });
    },
    onSuccess: (ok) => {
      if (!ok) { setError("No se pudo guardar el módulo."); return; }
      queryClient.invalidateQueries({ queryKey: ["developer-modulos"] });
      onClose();
    },
    onError: () => setError("No se pudo guardar el módulo."),
  });

  return (
    <FormDialog
      open={isOpen}
      onClose={onClose}
      title={modulo ? "Editar módulo" : "Nuevo módulo"}
      onSubmit={(e) => { e.preventDefault(); if (nombre.trim() && ruta.trim()) { setError(null); mutation.mutate(); } }}
      submitLabel="Guardar"
      isSubmitting={mutation.isPending}
      error={error}
    >
      <FormField label="Nombre del módulo" htmlFor="nombre_modulo">
        <Input id="nombre_modulo" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </FormField>
      <FormField label="Ruta del módulo" htmlFor="ruta_modulo" hint="Ej. /almacen">
        <Input id="ruta_modulo" value={ruta} onChange={(e) => setRuta(e.target.value)} />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Ícono en sidebar" optional>
          <Select value={icon || undefined} onValueChange={setIcon}>
            <SelectTrigger>
              <SelectValue placeholder="Sin ícono" />
            </SelectTrigger>
            <SelectContent>
              {ICON_NAMES.map((name) => {
                const Icon = getIcon(name);
                return (
                  <SelectItem key={name} value={name}>
                    <Icon className="h-4 w-4" /> {name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Grupo en sidebar" optional>
          <Select value={groupName || undefined} onValueChange={setGroupName}>
            <SelectTrigger>
              <SelectValue placeholder="Sin grupo" />
            </SelectTrigger>
            <SelectContent>
              {SECTION_ORDER.map((section) => (
                <SelectItem key={section} value={section}>{section}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <FormField label="Ruta en client-v2" htmlFor="frontend_route" optional hint="Solo si ya existe la pantalla React (ej. /accounting). Vacío = no aparece en el menú.">
        <Input id="frontend_route" value={frontendRoute} onChange={(e) => setFrontendRoute(e.target.value)} />
      </FormField>

      <div className="flex items-end gap-3">
        <FormField label="Orden" htmlFor="sort_order" optional hint="Posición dentro del grupo (menor = primero)">
          <Input
            id="sort_order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
          />
        </FormField>

        <FormField label="Visible en menú">
          <div className="flex h-10 items-center">
            <Switch checked={isVisible} onCheckedChange={setIsVisible} />
          </div>
        </FormField>
      </div>

      <FormField
        label="Acciones habilitadas"
        hint="Qué acciones aparecen en la matriz de permisos por rol para este módulo. Desmarca las estándar que no apliquen; marca acciones personalizadas del catálogo."
      >
        <div className="space-y-3 rounded-md border border-border/70 p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {STANDARD_ACTIONS.map((a) => (
              <label key={a.key} className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox checked={selectedActions.has(a.key)} onCheckedChange={() => toggleAction(a.key)} />
                <span>{a.label}</span>
              </label>
            ))}
          </div>

          {customActions.length > 0 && (
            <div className="border-t border-border/60 pt-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand">Acciones personalizadas</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {customActions.map((a) => (
                  <label key={a.action_key} className="flex cursor-pointer items-center gap-2 text-sm" title={a.description}>
                    <Checkbox checked={selectedActions.has(a.action_key)} onCheckedChange={() => toggleAction(a.action_key)} />
                    <span className="min-w-0 truncate">{a.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </FormField>
    </FormDialog>
  );
}
