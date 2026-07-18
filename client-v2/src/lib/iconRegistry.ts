/**
 * Registro nombre → componente de ícono, único punto que traduce el `icon`
 * (string) guardado en `modulo`/`submodulos` (BD) al componente de lucide-react
 * que se renderiza en sidebar/buscador y en el selector del panel Developer.
 * Agregar un ícono nuevo = agregarlo acá una vez; no hay que tocar nada más.
 */
import type { ComponentType } from "react";
import {
  Home,
  Tags,
  Warehouse,
  Package,
  FileSpreadsheet,
  Settings,
  ShoppingCart,
  ClipboardList,
  Truck,
  Building,
  User,
  Users,
  ShieldAlert,
  Wallet,
  Layers,
} from "lucide-react";

export type NavIcon = ComponentType<{ className?: string }>;

export const ICON_REGISTRY: Record<string, NavIcon> = {
  Home,
  Tags,
  Warehouse,
  Package,
  FileSpreadsheet,
  Settings,
  ShoppingCart,
  ClipboardList,
  Truck,
  Building,
  User,
  Users,
  ShieldAlert,
  Wallet,
  Layers,
};

export const ICON_NAMES = Object.keys(ICON_REGISTRY);

/** Ícono por defecto para módulos/submódulos sin `icon` asignado todavía. */
export function getIcon(name?: string | null): NavIcon {
  return (name && ICON_REGISTRY[name]) || Layers;
}
