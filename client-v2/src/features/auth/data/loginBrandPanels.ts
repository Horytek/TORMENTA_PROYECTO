import { HORYTEK_PRODUCTS } from "@/features/platform/catalog/horytekProducts";
import { resolveProductThemeId } from "@/features/platform/ui/productThemes";

export type LoginBrandMetric = { label: string; value: string };

export type LoginBrandCopy = {
  productId: string;
  pitch: string;
  metrics: LoginBrandMetric[];
};

const EXTRA_METRICS: Record<string, LoginBrandMetric[]> = {
  erp: [
    { label: "Módulos core", value: "POS · Stock · SUNAT" },
    { label: "Tenants", value: "multi" },
    { label: "Facturación", value: "electrónica" },
  ],
  pocket: [
    { label: "Cobro", value: "móvil" },
    { label: "Setup", value: "minutos" },
    { label: "ERP completo", value: "no" },
  ],
  ecommerce: [
    { label: "Checkout", value: "Mercado Pago" },
    { label: "Panel", value: "pedidos" },
    { label: "Vitrina", value: "propia" },
  ],
  "catalogo-wa": [
    { label: "Mensajes / viernes", value: "40" },
    { label: "SKUs vitrina", value: "180" },
    { label: "App cliente", value: "0" },
  ],
  sync: [
    { label: "SKUs sync", value: "1.2k" },
    { label: "Canales", value: "3" },
    { label: "Jobs", value: "auditados" },
  ],
  mayorista: [
    { label: "Cuentas B2B", value: "12" },
    { label: "Pedidos / sem", value: "~35" },
    { label: "MOQ", value: "por bulto" },
  ],
  taller: [
    { label: "Unidades lote", value: "24" },
    { label: "Pasos OT", value: "4" },
    { label: "Excel", value: "0" },
  ],
  preventa: [
    { label: "Cupo", value: "200" },
    { label: "Anticipo", value: "30%" },
    { label: "Al 80%", value: "40 min" },
  ],
  crm: [
    { label: "Deals", value: "28" },
    { label: "Etapas", value: "5" },
    { label: "Master ERP", value: "separado" },
  ],
  envios: [
    { label: "Guías / día", value: "60" },
    { label: "Tracking", value: "público" },
    { label: "Repartidor app", value: "no" },
  ],
  wms: [
    { label: "Líneas ola", value: "18" },
    { label: "Roles", value: "2" },
    { label: "GPS calle", value: "0" },
  ],
  despacho: [
    { label: "Paradas", value: "14" },
    { label: "Cierres OK", value: "12" },
    { label: "Incidencias", value: "2" },
  ],
  atelier: [
    { label: "Roles", value: "3" },
    { label: "Fee", value: "10%" },
    { label: "Checkout", value: "Mercado Pago" },
  ],
  taxi: [
    { label: "Superficies", value: "3" },
    { label: "ETA demo", value: "~4 min" },
    { label: "Paquetes", value: "no" },
  ],
  delivery: [
    { label: "ETA", value: "18 min" },
    { label: "Roles", value: "3" },
    { label: "Tipo", value: "on-demand" },
  ],
  flotas: [
    { label: "Unidades", value: "18" },
    { label: "Alertas SOAT", value: "3" },
    { label: "Matching", value: "no" },
  ],
  campo: [
    { label: "Visitas", value: "9" },
    { label: "Check-ins", value: "6" },
    { label: "Deals aquí", value: "0" },
  ],
  academia: [
    { label: "Cursos", value: "4" },
    { label: "Portal", value: "alumno" },
    { label: "Progreso", value: "visible" },
  ],
  agenda: [
    { label: "Slots / sem", value: "48" },
    { label: "Sábado", value: "22" },
    { label: "HC clínica", value: "no" },
  ],
  mantenimiento: [
    { label: "Activos", value: "12" },
    { label: "OT / mes", value: "9" },
    { label: "Producción", value: "no" },
  ],
  recluta: [
    { label: "Postulaciones", value: "47" },
    { label: "Entrevista", value: "8" },
    { label: "Hire", value: "1" },
  ],
};

const pitchById = Object.fromEntries(HORYTEK_PRODUCTS.map((p) => [p.id, p.pitch]));

export function getLoginBrandCopy(mode: string): LoginBrandCopy {
  const productId = resolveProductThemeId(mode);
  return {
    productId,
    pitch:
      pitchById[productId] ||
      (mode === "validar"
        ? "Activa tu cuenta con el código de seguridad y entra al ERP."
        : "Elige un producto e ingresa."),
    metrics: EXTRA_METRICS[productId] || EXTRA_METRICS.erp,
  };
}
