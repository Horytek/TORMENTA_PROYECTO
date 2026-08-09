import type {
  AntiConfusionRow,
  LandingScenario,
  LayoutKitId,
} from "../landingModule.types";

export type ProductNarrative = {
  layoutKitId: LayoutKitId;
  story: string[];
  scenario: LandingScenario;
  antiConfusion: AntiConfusionRow[];
  sectionTitleOverrides?: {
    story?: string;
    scenario?: string;
    antiConfusion?: string;
  };
};

export const PRODUCT_NARRATIVES: Record<string, ProductNarrative> = {
  "catalogo-wa": {
    layoutKitId: "commerce",
    story: [
      "En el barrio el pedido no nace en un checkout: nace en un chat. El cliente quiere ver foto, precio y si hay stock — y cerrar por WhatsApp sin instalar nada.",
      "Catálogo WA pone una vitrina pública alimentada por el ERP. El carrito se transforma en un mensaje listo para confirmar, con ítems y total.",
      "No reemplaza Ecommerce ni Mayorista: es el atajo retail por chat cuando tu operación ya vive en Horytek.",
    ],
    scenario: {
      title: "Doña Rosa, abarrotes en Comas",
      body: "Publica 180 SKUs. El viernes recibe 40 mensajes con carrito armado; confirma stock y coordina delivery por zona.",
      metrics: [
        { label: "Mensajes con carrito / viernes", value: "40" },
        { label: "SKUs en vitrina", value: "180" },
        { label: "Apps que instala el cliente", value: "0" },
      ],
    },
    antiConfusion: [
      { other: "Ecommerce", difference: "Ecommerce cobra en web; WA cierra en el chat." },
      { other: "Mayorista", difference: "Mayorista es B2B con listas; esto es retail consumidor." },
      { other: "Sync Stock", difference: "Sync orquesta canales; WA es una vitrina de venta." },
    ],
    sectionTitleOverrides: {
      story: "Vender donde ya habla tu cliente",
      scenario: "Un viernes real",
      antiConfusion: "Catálogo WA no es…",
    },
  },
  sync: {
    layoutKitId: "commerce",
    story: [
      "La sobreventa no es un bug de marketing: es un stock que miente en dos sitios a la vez.",
      "Sync Stock mapea SKUs entre ERP, ecommerce y marketplaces y deja un historial de jobs — sin JOINs mágicos entre bases.",
      "No hay UI de tienda. Es el cuarto de máquinas del omnicanal.",
    ],
    scenario: {
      title: "Marca con ERP + Shopify + marketplace",
      body: "Tras un drop, Sync reconcilió 1.2k SKUs en la noche; el admin vio el log y corrigió tres mapeos rotos antes del mediodía.",
      metrics: [
        { label: "SKUs reconciliados", value: "1.2k" },
        { label: "Canales", value: "3" },
        { label: "Jobs auditados", value: "sí" },
      ],
    },
    antiConfusion: [
      { other: "Ecommerce", difference: "No vende; sincroniza cantidades." },
      { other: "WMS", difference: "WMS mueve piso; Sync mueve verdad entre canales." },
      { other: "Catálogo WA", difference: "WA es vitrina; Sync es integración." },
    ],
  },
  mayorista: {
    layoutKitId: "commerce",
    story: [
      "El cliente B2B no quiere un POS ni un catálogo de Instagram. Quiere su lista, su mínimo y pedir sin llamar dos veces.",
      "Mayorista separa el portal de reventa del mostrador retail. Precios por cuenta, reglas de cantidad, historial de pedidos.",
      "Si tu dolor es el carrito WhatsApp del consumidor final, este no es el producto.",
    ],
    scenario: {
      title: "Distribuidora de limpieza",
      body: "12 cuentas con lista propia. El portal recibe pedidos semanales con mínimo por bulto; el admin aprueba y pasa a despacho.",
      metrics: [
        { label: "Cuentas B2B", value: "12" },
        { label: "Listas distintas", value: "12" },
        { label: "Pedidos / semana", value: "~35" },
      ],
    },
    antiConfusion: [
      { other: "Pocket / POS", difference: "No es cobro de mostrador." },
      { other: "Catálogo WA", difference: "No es retail por chat." },
      { other: "Ecommerce", difference: "No es vitrina abierta al público general." },
    ],
  },
  taller: {
    layoutKitId: "plant",
    story: [
      "En planta la pregunta no es “¿quién vende?” sino “¿en qué paso va el lote?”.",
      "Taller modela OT de producción: insumos, avance y cierre. Distinto del preventivo de activos.",
      "Admin planta prioriza; el técnico marca el paso. Sin disfrazarlo de ticket genérico.",
    ],
    scenario: {
      title: "Línea de polos · lote 24",
      body: "OT-P-204 pasó corte → ensamble → acabado en un turno. El admin vio insumos consumidos sin Excel paralelo.",
      metrics: [
        { label: "Unidades del lote", value: "24" },
        { label: "Pasos de OT", value: "4" },
        { label: "Hojas Excel", value: "0" },
      ],
    },
    antiConfusion: [
      { other: "Mantenimiento", difference: "Mantto es preventivo de equipos; Taller produce." },
      { other: "WMS", difference: "WMS ubica stock; Taller ejecuta la OT." },
      { other: "Campo", difference: "Campo es visita comercial, no planta." },
    ],
  },
  preventa: {
    layoutKitId: "commerce",
    story: [
      "Una edición limitada no se comporta como un catálogo eterno. Hay cupo, anticipo y fecha de cierre.",
      "Preventa publica la campaña, muestra lo que queda y marca pago pendiente/pagado — sin fingir que es Mercado Pago prod a ciegas.",
      "Ideal para drops; malo si buscas tienda permanente o B2B.",
    ],
    scenario: {
      title: "Drop de zapatillas · 200 pares",
      body: "El slug se compartió a las 8pm. A las 8:40 quedaban 37 cupos; el admin marcó anticipos pagados al día siguiente.",
      metrics: [
        { label: "Cupo inicial", value: "200" },
        { label: "Anticipo", value: "30%" },
        { label: "Minutos al 80%", value: "40" },
      ],
    },
    antiConfusion: [
      { other: "Ecommerce", difference: "Ecommerce es tienda continua; Preventa es edición." },
      { other: "Mayorista", difference: "No hay listas B2B ni mínimos de reventa." },
      { other: "Agenda", difference: "No reserva horarios; reserva cupos de producto." },
    ],
  },
  crm: {
    layoutKitId: "pipeline",
    story: [
      "El comercial necesita mover deals, no reescribir el padrón de clientes del ERP.",
      "CRM Horytek es pipeline + actividades con referencia al cliente por ID. Sin IA obligatoria ni teatro de ‘copiloto’.",
      "Si contratas gente, usa Recluta. Si visitas calle, usa Campo.",
    ],
    scenario: {
      title: "Mesa de 4 vendedores B2B",
      body: "28 deals activos. Al mover a ‘Propuesta’, el deal pide nota; al ganar, queda el historial sin tocar el master ERP.",
      metrics: [
        { label: "Deals activos", value: "28" },
        { label: "Etapas", value: "5" },
        { label: "Master duplicado", value: "no" },
      ],
    },
    antiConfusion: [
      { other: "Recluta", difference: "Recluta es talento; CRM es venta." },
      { other: "Campo", difference: "Campo es check-in GPS; CRM es embudo." },
      { other: "ERP clientes", difference: "No reemplaza el padrón; referencia por ID." },
    ],
  },
  envios: {
    layoutKitId: "ship",
    story: [
      "Una guía no es un repartidor on-demand. Es un envío con timeline que el cliente puede seguir.",
      "Envíos crea la guía, registra hitos y comparte tracking. Puede convivir con couriers externos.",
      "Si necesitas matching de motos en 30 minutos, eso es Delivery.",
    ],
    scenario: {
      title: "Ecommerce que despacha 60 guías/día",
      body: "Cada guía tiene eventos. El cliente abre el link y ve ‘en tránsito’ sin llamar a WhatsApp genérico.",
      metrics: [
        { label: "Guías / día", value: "60" },
        { label: "Link público", value: "sí" },
        { label: "Matching repartidor", value: "no" },
      ],
    },
    antiConfusion: [
      { other: "Delivery", difference: "Delivery es on-demand; Envíos es guía/timeline." },
      { other: "Despacho", difference: "Despacho arma rutas propias; Envíos rastrea la guía." },
      { other: "Flotas", difference: "Flotas administra vehículos, no guías." },
    ],
  },
  wms: {
    layoutKitId: "rail-ops",
    story: [
      "El almacén gana cuando la ola de picking es clara y el bin no es un misterio.",
      "WMS opera recepción, ubicación y picking con admin + operario. No sale a la calle.",
      "Cuando el pedido deja el muelle, Despacho o Envíos toman la posta.",
    ],
    scenario: {
      title: "Ola de la mañana · 18 líneas",
      body: "El operario cierra picking bin a bin. El admin ve la ola en verde antes de liberar a ruta.",
      metrics: [
        { label: "Líneas en ola", value: "18" },
        { label: "Roles", value: "2" },
        { label: "GPS de calle", value: "0" },
      ],
    },
    antiConfusion: [
      { other: "Despacho", difference: "Despacho es ruta; WMS es piso." },
      { other: "Sync", difference: "Sync no ubica bins." },
      { other: "Taller", difference: "Taller produce; WMS almacena y pickea." },
    ],
  },
  despacho: {
    layoutKitId: "rail-ops",
    story: [
      "La ruta del día es una promesa a clientes que esperan la parada, no un kanban abstracto.",
      "Despacho ordena paradas, asigna y cierra visitas. Flotas puede prestar la unidad; Taxi no aplica.",
      "Si el dolor es el almacén, vuelve a WMS.",
    ],
    scenario: {
      title: "Ruta Sur · 14 paradas",
      body: "Ana sale a las 8. Cada cierre de parada actualiza el tablero. A las 14:00 quedan 2 incidencias documentadas.",
      metrics: [
        { label: "Paradas", value: "14" },
        { label: "Cierres OK", value: "12" },
        { label: "Incidencias", value: "2" },
      ],
    },
    antiConfusion: [
      { other: "Flotas", difference: "Flotas = papeles/combustible; Despacho = ruta del día." },
      { other: "Taxi", difference: "Taxi es solicitud de pasajeros." },
      { other: "WMS", difference: "WMS prepara; Despacho sale." },
    ],
  },
  taxi: {
    layoutKitId: "map-mobility",
    story: [
      "Un operador de taxis no necesita un ERP: necesita que el pasajero pida, el conductor acepte y el admin vea el viaje en vivo.",
      "Taxi Horytek corre en su propia base. El mapa no es decoración: es el escenario del viaje (origen, ruta, asignación) — Lima como demo, tu ciudad en producción.",
      "Delivery es paquetes. Flotas es el patio de vehículos. Aquí se mueven personas con matching y estados de viaje.",
    ],
    scenario: {
      title: "Base en San Isidro · hora punta",
      body: "El pasajero solicita Miraflores. En segundos hay conductor asignado; el admin ve el estado sin Excel de radio ni grupo de WhatsApp caótico.",
      metrics: [
        { label: "Superficies", value: "3" },
        { label: "ETA demo", value: "~4 min" },
        { label: "Base", value: "db_taxi" },
      ],
    },
    antiConfusion: [
      { other: "Delivery", difference: "Delivery mueve encargos; Taxi mueve pasajeros." },
      { other: "Flotas", difference: "Flotas no hace matching de viajes." },
      { other: "Despacho", difference: "Despacho es ruta planificada de distribución." },
    ],
    sectionTitleOverrides: {
      story: "La ciudad se pide en el mapa",
      scenario: "Un viaje en hora punta",
      antiConfusion: "Taxi no es…",
    },
  },
  delivery: {
    layoutKitId: "map-mobility",
    story: [
      "El encargo tiene recojo, entrega y un repartidor en movimiento — con ETA que el cliente entiende.",
      "Delivery separa cliente, repartidor y admin. El mapa muestra la ruta del pedido, no un viaje de pasajeros.",
      "Para guías courier de varios días, usa Envíos.",
    ],
    scenario: {
      title: "Zona Jesús María → Surco",
      body: "Pedido de farmacia. Al despachar, el mapa traza ruta y el ETA baja mientras el repartidor avanza (demo).",
      metrics: [
        { label: "ETA inicial", value: "18 min" },
        { label: "Roles", value: "3" },
        { label: "Tipo", value: "on-demand" },
      ],
    },
    antiConfusion: [
      { other: "Taxi", difference: "No lleva pasajeros." },
      { other: "Envíos", difference: "Envíos es guía larga; Delivery es ahora." },
      { other: "Flotas", difference: "Flotas no asigna el encargo al repartidor." },
    ],
  },
  flotas: {
    layoutKitId: "map-fleet",
    story: [
      "Antes del matching viene el patio: ¿qué placa está viva, con SOAT al día y combustible cargado?",
      "Flotas administra unidades y docs. Taxi, Delivery o Despacho pueden consumir esa verdad por API.",
      "No es un marketplace de viajes.",
    ],
    scenario: {
      title: "Patio con 18 unidades",
      body: "El admin abre el mapa demo, toca ABC-123 y ve SOAT + litros. Programa carga antes de soltar la unidad a Despacho.",
      metrics: [
        { label: "Unidades", value: "18" },
        { label: "Alertas SOAT", value: "3" },
        { label: "Matching viajes", value: "no" },
      ],
    },
    antiConfusion: [
      { other: "Taxi / Delivery", difference: "Ellos hacen matching; Flotas administra activos." },
      { other: "Despacho", difference: "Despacho opera la ruta del día." },
      { other: "ERP activos genéricos", difference: "Flotas está pensado para vehículos y combustible." },
    ],
  },
  campo: {
    layoutKitId: "rail-ops",
    story: [
      "El supervisor no necesita otro CRM: necesita saber si el vendedor llegó y qué dejó anotado.",
      "Campo arma la ruta del día y registra check-in GPS. El mapa es evidencia, no adorno: pin, hora y nota quedan para auditar la jornada.",
      "Los deals viven en CRM; las visitas viven aquí. Si mezclas ambos, el comercial pierde foco y el jefe pierde la calle.",
      "Pensado para equipos que ya salen a punto de venta, farmacia o distribuidor — no para televentas ni picking de almacén.",
    ],
    scenario: {
      title: "Ruta de 9 visitas · Lima Este",
      body: "Antes de las 8am el vendedor tiene la lista. Hace check-in en cada pin. Al mediodía el supervisor ve 6/9 con nota o foto; no hay ‘estoy en camino’ eterno ni Excel de WhatsApp.",
      metrics: [
        { label: "Visitas planificadas", value: "9" },
        { label: "Check-ins a mediodía", value: "6" },
        { label: "Deals en este producto", value: "0" },
        { label: "Apps que instala el cliente", value: "0" },
      ],
    },
    antiConfusion: [
      {
        other: "CRM",
        difference:
          "CRM mueve deals y etapas comerciales. Campo registra presencia física: ¿llegó?, ¿qué evidenció?, ¿cerró la visita?",
      },
      {
        other: "Delivery",
        difference:
          "Delivery asigna encargos on-demand a un repartidor. Campo no reparte paquetes; visita clientes con ruta del día.",
      },
      {
        other: "Despacho",
        difference:
          "Despacho entrega mercancía en paradas de distribución. Campo es visita comercial / cobranza / relevamiento.",
      },
    ],
    sectionTitleOverrides: {
      story: "La calle, no el embudo",
      scenario: "Un martes en Lima Este",
      antiConfusion: "Campo no es…",
    },
  },
  academia: {
    layoutKitId: "learn-book",
    story: [
      "Capacitar al equipo no es un PDF en Drive. Es una ruta con progreso visible en el portal del alumno.",
      "Academia publica cursos, inscribe con email y muestra avance — el mismo flujo que abre /academia/demo con datos seed.",
      "Contratar es Recluta; vender es CRM. Aquí solo se forma.",
    ],
    scenario: {
      title: "Onboarding de vendedores en campo",
      body: "El admin publica módulos; el alumno entra con su teléfono/email y ve el % en Mis cursos. Sin Excel de asistencia.",
      metrics: [
        { label: "Portal alumno", value: "vivo" },
        { label: "Cursos demo", value: "4" },
        { label: "Progreso", value: "visible" },
      ],
    },
    antiConfusion: [
      { other: "Recluta", difference: "Recluta contrata; Academia forma." },
      { other: "CRM", difference: "No es pipeline comercial." },
      { other: "Agenda", difference: "Agenda reserva 1-a-1; Academia es ruta de curso." },
    ],
  },
  agenda: {
    layoutKitId: "learn-book",
    story: [
      "El profesional vende tiempo. El cliente elige un slot y deja su nombre — sin expediente clínico.",
      "Agenda publica disponibilidad, recibe reservas y marca pago pendiente/pagado en MVP.",
      "Si necesitas historia clínica o CRM de ventas, este no es el producto.",
    ],
    scenario: {
      title: "Studio de 2 profesionales",
      body: "La grilla pública se llena el sábado. El admin confirma pagos el lunes sin WhatsApp caótico de ‘¿queda a las 4?’.",
      metrics: [
        { label: "Slots / semana", value: "48" },
        { label: "Reservas sábado", value: "22" },
        { label: "HC clínica", value: "no" },
      ],
    },
    antiConfusion: [
      { other: "Software clínico", difference: "No hay expediente ni receta." },
      { other: "CRM", difference: "No gestiona deals." },
      { other: "Catálogo WA", difference: "No vende productos; reserva tiempo." },
    ],
  },
  mantenimiento: {
    layoutKitId: "plant",
    story: [
      "La planta para cuando el compresor falla sin plan. El preventivo es aburrido — y por eso funciona.",
      "Mantenimiento registra activos, planes y OT técnicas. No es la línea de producción de Taller.",
      "El técnico cierra pasos; el admin ve el riesgo de vencimientos.",
    ],
    scenario: {
      title: "12 activos críticos",
      body: "El plan mensual dispara OT-118. Se completa diagnóstico → repuestos → QA sin perder el historial del equipo.",
      metrics: [
        { label: "Activos", value: "12" },
        { label: "OT del mes", value: "9" },
        { label: "Producción de lote", value: "no" },
      ],
    },
    antiConfusion: [
      { other: "Taller", difference: "Taller produce; Mantto cuida activos." },
      { other: "Campo", difference: "Campo es visita comercial." },
      { other: "WMS", difference: "No gestiona ubicaciones de almacén." },
    ],
  },
  recluta: {
    layoutKitId: "pipeline",
    story: [
      "Contratar no es mover un deal de venta. Es vacante, candidato y etapas hasta el hire.",
      "Recluta publica, recibe postulaciones y avanza el embudo. Separado del CRM comercial.",
      "La capacitación posterior es Academia.",
    ],
    scenario: {
      title: "Vacante de 2 analistas",
      body: "47 postulaciones. 8 en entrevista. 1 hire. El portal externo evita el inbox infinito.",
      metrics: [
        { label: "Postulaciones", value: "47" },
        { label: "En entrevista", value: "8" },
        { label: "Hire", value: "1" },
      ],
    },
    antiConfusion: [
      { other: "CRM", difference: "CRM vende; Recluta contrata." },
      { other: "Academia", difference: "Academia forma después del hire." },
      { other: "Nómina", difference: "No calcula sueldos." },
    ],
  },
};

export function getNarrative(productId: string): ProductNarrative | undefined {
  return PRODUCT_NARRATIVES[productId];
}
