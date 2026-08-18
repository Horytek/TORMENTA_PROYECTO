import type { ComponentType } from "react";
import { resolveProductThemeId } from "@/features/platform/ui/productThemes";
import {
  SceneAtelier,
  SceneCatalogoWa,
  SceneEcommerce,
  SceneErp,
  SceneMayorista,
  ScenePocket,
  ScenePreventa,
  SceneSync,
} from "./scenesCommerce";
import {
  SceneCampo,
  SceneDelivery,
  SceneDespacho,
  SceneEnvios,
  SceneFlotas,
  SceneMantenimiento,
  SceneTaller,
  SceneTaxi,
  SceneWms,
} from "./scenesOpsMobility";
import { SceneAcademia, SceneAgenda, SceneCrm, SceneRecluta } from "./scenesPeople";

const SCENE_BY_PRODUCT: Record<string, ComponentType> = {
  erp: SceneErp,
  pocket: ScenePocket,
  ecommerce: SceneEcommerce,
  "catalogo-wa": SceneCatalogoWa,
  sync: SceneSync,
  mayorista: SceneMayorista,
  preventa: ScenePreventa,
  atelier: SceneAtelier,
  taller: SceneTaller,
  wms: SceneWms,
  envios: SceneEnvios,
  despacho: SceneDespacho,
  taxi: SceneTaxi,
  delivery: SceneDelivery,
  flotas: SceneFlotas,
  campo: SceneCampo,
  mantenimiento: SceneMantenimiento,
  crm: SceneCrm,
  recluta: SceneRecluta,
  academia: SceneAcademia,
  agenda: SceneAgenda,
};

export function LoginProductScene({ productId }: { productId: string }) {
  const id = resolveProductThemeId(productId);
  const Scene = SCENE_BY_PRODUCT[id] ?? SceneErp;
  return <Scene />;
}
