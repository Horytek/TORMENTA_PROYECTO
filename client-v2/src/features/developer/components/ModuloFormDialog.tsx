import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/shared/FormDialog";
import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ICON_NAMES, getIcon } from "@/lib/iconRegistry";
import { SECTION_ORDER } from "@/lib/navigationCatalog";
import { createModulo, updateModulo } from "../api/developer";
import type { Modulo } from "../types";

interface ModuloFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  modulo: Modulo | null;
}

export function ModuloFormDialog({ isOpen, onClose, modulo }: ModuloFormDialogProps) {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState("");
  const [ruta, setRuta] = useState("");
  const [icon, setIcon] = useState<string>("");
  const [groupName, setGroupName] = useState<string>("");
  const [sortOrder, setSortOrder] = useState(0);
  const [frontendRoute, setFrontendRoute] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNombre(modulo?.nombre_modulo ?? "");
      setRuta(modulo?.ruta ?? "");
      setIcon(modulo?.icon ?? "");
      setGroupName(modulo?.group_name ?? "");
      setSortOrder(modulo?.sort_order ?? 0);
      setFrontendRoute(modulo?.frontend_route ?? "");
      setIsVisible(modulo?.is_visible ?? true);
      setError(null);
    }
  }, [isOpen, modulo]);

  const mutation = useMutation({
    mutationFn: () => {
      const meta = {
        icon: icon || null,
        group_name: groupName || null,
        sort_order: sortOrder,
        frontend_route: frontendRoute || null,
        is_visible: isVisible,
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
    </FormDialog>
  );
}
