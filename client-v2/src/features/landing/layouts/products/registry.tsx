import type { ComponentType } from "react";
import type { LandingProductModule } from "../../modules/landingModule.types";
import { CatalogoWaLayout } from "./catalogo-wa/CatalogoWaLayout";
import { SyncLayout } from "./sync/SyncLayout";
import { MayoristaLayout } from "./mayorista/MayoristaLayout";
import { PreventaLayout } from "./preventa/PreventaLayout";
import { TaxiLayout } from "./taxi/TaxiLayout";
import { DeliveryLayout } from "./delivery/DeliveryLayout";
import { FlotasLayout } from "./flotas/FlotasLayout";
import { EnviosLayout } from "./envios/EnviosLayout";
import { WmsLayout } from "./wms/WmsLayout";
import { DespachoLayout } from "./despacho/DespachoLayout";
import { CampoLayout } from "./campo/CampoLayout";
import { TallerLayout } from "./taller/TallerLayout";
import { MantenimientoLayout } from "./mantenimiento/MantenimientoLayout";
import { CrmLayout } from "./crm/CrmLayout";
import { ReclutaLayout } from "./recluta/ReclutaLayout";
import { AcademiaLayout } from "./academia/AcademiaLayout";
import { AgendaLayout } from "./agenda/AgendaLayout";
import { AtelierLayout } from "./atelier/AtelierLayout";

export type ProductLayoutComponent = ComponentType<{ module: LandingProductModule }>;

/** Layout interactivo dedicado por producto (sin spine genérico). */
export const PRODUCT_LAYOUTS: Record<string, ProductLayoutComponent> = {
  "catalogo-wa": CatalogoWaLayout,
  sync: SyncLayout,
  mayorista: MayoristaLayout,
  preventa: PreventaLayout,
  taxi: TaxiLayout,
  delivery: DeliveryLayout,
  flotas: FlotasLayout,
  envios: EnviosLayout,
  wms: WmsLayout,
  despacho: DespachoLayout,
  campo: CampoLayout,
  taller: TallerLayout,
  mantenimiento: MantenimientoLayout,
  crm: CrmLayout,
  recluta: ReclutaLayout,
  academia: AcademiaLayout,
  agenda: AgendaLayout,
  atelier: AtelierLayout,
};
