import { ArrowRight, MessageCircle } from "lucide-react";
import { SALES_WHATSAPP_URL } from "../data/landing.data";

const TOPBAR_COPY_BY_PRODUCT: Record<string, string> = {
  erp: "¿Todavía llevas tu operación en cuaderno o Excel?",
  pocket: "¿Cobras hoy, pero el inventario lo mantienes en cuaderno o Excel?",
  ecommerce: "¿Tu tienda online vende, pero el stock lo sincronizas a mano en cuaderno o Excel?",
  "catalogo-wa": "¿Tu catálogo por WhatsApp te deja stock “a la deriva” y lo corriges en cuaderno o Excel?",
  sync: "¿Tienes varios canales y el stock te termina viviendo en planillas y Excel?",
  mayorista: "¿Listas, mínimos y reglas B2B las controlas en Excel en vez de en Horytek?",
  atelier: "¿Encargos y propuestas viven en mensajes y planillas? Centralízalo sin Excel paralelo.",
  taller: "¿Producción y OT en planillas? Modela el paso y evita Excel manual.",
  preventa: "¿Cupos y anticipo los llevas a mano en Excel? Prevé cierres sin planillas.",
  crm: "¿Leads y actividades se pierden en notas y Excel? Mantén el pipeline al día.",
  envios: "¿Armás guías con hojas y luego registras? Ten timeline y tracking sin Excel.",
  wms: "¿Ubicación y picking con planillas? WMS te da control de piso sin Excel.",
  taxi: "¿Gestionas viajes con planillas y “listas”? El mapa y estados mantienen todo en orden.",
  delivery: "¿Repartos con ETA “a ojo” en planillas? Delivery muestra el avance sin Excel.",
  flotas: "¿Vehículos y papeles en Excel? Flotas ordena mantenimiento y disponibilidad.",
  campo: "¿Check-ins y visitas comerciales en hojas? Campo registra en minutos.",
  academia: "¿Progreso y asistencia en Excel? Academia guarda avance sin hojas.",
  agenda: "¿Turnos y horarios con caos? Agenda ordena sin planillas.",
  mantenimiento: "¿Órdenes de mantenimiento en planillas? Mantenimientos con trazabilidad.",
  recluta: "¿Postulantes en listas y Excel? Recluta ordena el proceso.",
};

function topbarCopy(productId: string) {
  return (
    TOPBAR_COPY_BY_PRODUCT[productId] ??
    "¿Todavía llevas tu operación en cuaderno o Excel?"
  );
}

/**
 * Franja superior, sobre el header.
 *
 * No es sticky a propósito: el header sí lo es (`sticky top-0 z-40`), así que
 * esta se va con el scroll y no roba alto permanente en pantallas cortas.
 *
 * Lleva al WhatsApp de ventas porque hoy ese es el único canal de conversión
 * real del negocio. Cuando exista un programa de partners o una demo
 * autoservicio, este es el lugar para anunciarlo.
 */
export function TopBar({ productId }: { productId: string }) {
  return (
    <div className="bg-[hsl(var(--lp-ink))] text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-x-3 gap-y-1 px-6 py-2.5 text-center">
        <MessageCircle
          className="hidden h-3.5 w-3.5 shrink-0 text-white/50 sm:block"
          strokeWidth={2}
          aria-hidden
        />
        <p className="text-[12.5px] leading-snug text-white/75">
          {topbarCopy(productId)}
        </p>
        <a
          href={SALES_WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-white underline underline-offset-4 decoration-white/35 transition-colors hover:decoration-white"
        >
          Escríbenos
          <ArrowRight
            className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </a>
      </div>
    </div>
  );
}
